/* Criterion Buyer Guide: static, no build step. Routes live in the URL hash. */
(function () {
  "use strict";

  // ---- Config -------------------------------------------------------------
  // LIVE = false: the gate is a mock. Nothing leaves the phone.
  // To go live, TraCy sets LIVE to true (see spec-for-tracy.md). The endpoint is the same
  // public Apps Script web app home-value posts to (site.config.js leadEndpoint).
  var CONFIG = {
    LIVE: false,
    leadEndpoint: "https://script.google.com/macros/s/AKfycbwcpeKoRHzPK2Vbdo5vTW_G8iIvSOhKQIMi0RbnQAMwPJZ39it3tr9JBRPZMmQCGHdS/exec",
    defaultSrc: "buyer-guide",
  };
  var C = window.CONTENT;
  var STORE = "criterion-buyer-guide-v1";
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "id"];
  var TOTAL_STEPS = C.guide.length;

  // ---- State --------------------------------------------------------------
  function blank() {
    return { unlocked: false, lead: {}, quiz: [], guideStep: 1, checks: {}, ws: {}, rid: null, attr: {} };
  }
  function load() {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { return blank(); }
  }
  var S = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }

  // Attribution from the landing URL (same keys as home-value lead.js, plus mailer `id`).
  var params = new URLSearchParams(location.search);
  ATTR_KEYS.forEach(function (k) { var v = params.get(k); if (v) S.attr[k] = v.slice(0, 200); });
  if (!S.attr.src) S.attr.src = CONFIG.defaultSrc;

  // Personal results link: ?r=<base64url JSON>. Holds answers only, plus first name for the greeting.
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function packState() {
    var c = Object.keys(S.checks).filter(function (k) { return S.checks[k]; });
    var w = {}; Object.keys(S.ws).forEach(function (k) { if (S.ws[k]) w[k] = S.ws[k]; });
    return b64e(JSON.stringify({ v: 1, i: S.rid, n: S.lead.first_name || "", q: S.quiz, g: S.guideStep, c: c, w: w }));
  }
  function resultsUrl() {
    var base = location.origin + location.pathname;
    if (location.protocol === "file:") base = "https://criterion-marketing.github.io/home-value/buyer-guide/";
    return base + "?r=" + packState() + "#/plan";
  }
  var r = params.get("r");
  if (r) {
    try {
      var d = JSON.parse(b64d(r));
      S.unlocked = true; S.rid = d.i || S.rid; S.lead.first_name = S.lead.first_name || d.n || "";
      S.quiz = Array.isArray(d.q) ? d.q : []; S.guideStep = d.g || 1; S.ws = d.w || {};
      S.checks = {}; (d.c || []).forEach(function (k) { S.checks[k] = true; });
      save();
    } catch (e) {}
  }

  // ---- Helpers ------------------------------------------------------------
  var main = document.getElementById("main");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  var ICON = {
    lock: '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    chev: '<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
  };
  var progress = document.getElementById("progress");
  var track = document.getElementById("progress-track");
  function setProgress(p) { if (p == null) { track.hidden = true; return; } track.hidden = false; progress.style.width = p + "%"; track.setAttribute("aria-valuenow", Math.round(p)); }
  var toastT;
  function toast(msg) { var t = document.getElementById("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600); }
  function copy(text, btn) {
    var done = function () { if (btn) { btn.textContent = C.sent.copied; setTimeout(function () { btn.textContent = "Copy"; }, 1800); } };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }
  var isRenter = S.attr.src === "mailer-renter";

  // ---- Quiz scoring -------------------------------------------------------
  function score() { return S.quiz.reduce(function (t, a) { return t + (a == null ? 0 : 2 - a); }, 0); }
  function quizDone() { return S.quiz.length === C.quiz.questions.length && S.quiz.every(function (a) { return a != null; }); }
  function band(sc) { for (var i = 0; i < C.quiz.bands.length; i++) if (sc >= C.quiz.bands[i].min) return C.quiz.bands[i]; }
  // Deposit is credited at closing, so it is counted once: subtract it up to the closing-day amounts.
  function wsTotal() {
    var n = function (k) { return Number(S.ws[k]) || 0; };
    var sum = Object.keys(S.ws).reduce(function (t, k) { return t + n(k); }, 0);
    return sum - Math.min(n("deposit"), n("down") + n("closing"));
  }

  // ---- Screens ------------------------------------------------------------
  function teaser() {
    setProgress(null);
    var t = isRenter ? C.teaser.renter : C.teaser.generic;
    var steps = C.guide.map(function (g, i) { return '<li><span class="num">' + (i + 1) + "</span>" + esc(g.title) + (S.unlocked ? "" : ICON.lock) + "</li>"; }).join("");
    main.innerHTML =
      '<section class="teaser">' +
      '<p class="kicker">' + esc(t.kicker) + "</p>" +
      '<h1 class="title">' + esc(t.title) + "</h1>" +
      '<p class="lead">' + esc(t.body) + "</p>" +
      '<ul class="stats">' + C.teaser.stats.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
      '<div class="ctas">' +
      '<a class="pill pill-block" href="#/quiz">' + esc(C.teaser.ctaQuiz) + "</a>" +
      '<a class="pill pill-ghost pill-block" href="' + (S.unlocked ? "#/plan" : "#/unlock") + '">' + esc(S.unlocked ? "Open my game plan" : C.teaser.ctaUnlock) + "</a>" +
      "</div>" +
      (S.unlocked ? "" : '<p class="small muted" style="text-align:center;margin:.75rem 0 0">' + esc(C.teaser.lockedNote) + "</p>") +
      '<div class="card steps-preview"><ol>' + steps + "</ol></div>" +
      "</section>";
  }

  function chipGroup(name, opts) {
    return '<div class="chips" role="group" data-name="' + name + '">' + opts.map(function (o) {
      return '<button type="button" class="chip" aria-pressed="' + (S.lead[name] === o) + '" data-v="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  function gate(fromQuiz) {
    setProgress(null);
    var F = C.gate.fields, L = S.lead;
    main.innerHTML =
      '<form class="card" id="gate" novalidate>' +
      '<div class="form-head"><h1>' + esc(fromQuiz ? C.gate.titleQuiz : C.gate.title) + "</h1><p>" + esc(C.gate.sub) + "</p></div>" +
      field("first_name", F.first_name.label, '<input class="input" id="first_name" name="first_name" autocomplete="given-name" placeholder="' + F.first_name.placeholder + '" value="' + esc(L.first_name) + '">') +
      field("phone", F.phone.label, '<input class="input" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="' + F.phone.placeholder + '" value="' + esc(L.phone) + '">') +
      field("email", F.email.label + ' <span class="opt">(' + F.email.hint + ")</span>", '<input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="' + F.email.placeholder + '" value="' + esc(L.email) + '">') +
      field("town", F.town.label, chipGroup("town", F.town.options), true) +
      field("timeline", F.timeline.label, '<select class="input" id="timeline" name="timeline"><option value="">Choose one</option>' + F.timeline.options.map(function (o) { return "<option" + (L.timeline === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>") +
      field("renting", F.renting.label, chipGroup("renting", F.renting.options), true) +
      '<label class="check"><input type="checkbox" id="lender_optin"' + (L.lender_optin ? " checked" : "") + '><span class="t"><strong>' + esc(F.lender_optin.label) + "</strong>" + esc(F.lender_optin.hint) + "</span></label>" +
      '<label class="check consent" id="consent-wrap"><input type="checkbox" id="sms_consent"' + (L.sms_consent ? " checked" : "") + '><span class="t">' + esc(F.sms_consent.label) + "</span></label>" +
      '<p class="err" id="err-sms_consent" hidden></p>' +
      '<div style="margin-top:1.25rem"><button class="pill pill-block" id="submit" type="submit">' + esc(C.gate.submit) + "</button></div>" +
      '<p class="small muted" style="text-align:center;margin:.75rem 0 0">' + esc(C.gate.privacy) + "</p>" +
      "</form>";
    main.querySelectorAll(".chips").forEach(function (g) {
      g.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        g.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        S.lead[g.dataset.name] = b.dataset.v; showErr(g.dataset.name, "");
      });
    });
    document.getElementById("phone").addEventListener("input", function (e) {
      var d = e.target.value.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
      e.target.value = d.length > 6 ? "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6) : d.length > 3 ? "(" + d.slice(0, 3) + ") " + d.slice(3) : d;
    });
    ["first_name", "phone", "email", "timeline", "sms_consent"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", function () { showErr(id, ""); });
    });
    document.getElementById("gate").addEventListener("submit", function (e) { e.preventDefault(); submitGate(fromQuiz); });
  }
  function field(name, label, control, group) {
    return '<div class="field">' + (group ? '<span class="label">' + label + "</span>" : '<label for="' + name + '">' + label + "</label>") + control + '<p class="err" id="err-' + name + '" hidden></p></div>';
  }
  function showErr(name, msg) {
    var el = document.getElementById("err-" + name); if (!el) return;
    el.textContent = msg; el.hidden = !msg;
    var input = document.getElementById(name); if (input && input.classList) input.classList.toggle("bad", !!msg);
    if (name === "sms_consent") document.getElementById("consent-wrap").classList.toggle("bad", !!msg);
  }
  var EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
  function submitGate(fromQuiz) {
    var v = function (id) { return document.getElementById(id).value.trim(); };
    S.lead.first_name = v("first_name").slice(0, 60);
    S.lead.phone = v("phone");
    S.lead.email = v("email");
    S.lead.timeline = v("timeline");
    S.lead.lender_optin = document.getElementById("lender_optin").checked;
    S.lead.sms_consent = document.getElementById("sms_consent").checked;
    var E = C.gate.errors, bad = [];
    function check(name, ok) { showErr(name, ok ? "" : E[name]); if (!ok) bad.push(name); }
    check("first_name", !!S.lead.first_name);
    check("phone", S.lead.phone.replace(/\D/g, "").length === 10);
    check("email", !S.lead.email || (S.lead.email.length <= 255 && EMAIL_RE.test(S.lead.email)));
    check("town", !!S.lead.town);
    check("timeline", !!S.lead.timeline);
    check("renting", !!S.lead.renting);
    check("sms_consent", S.lead.sms_consent);
    if (bad.length) { var el = document.getElementById(bad[0]) || document.getElementById("err-" + bad[0]); el.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    var btn = document.getElementById("submit"); btn.disabled = true; btn.textContent = C.gate.sending;
    S.rid = S.rid || Math.random().toString(36).slice(2, 10);
    S.unlocked = true; save();
    sendLead(buildPayload()).then(function () { go(fromQuiz ? "#/sent?next=result" : "#/sent"); }, function () {
      btn.disabled = false; btn.textContent = C.gate.submit;
      toast("Something went wrong. Please try again.");
    });
  }

  // Lead payload: home-value's column order first, then buyer-guide keys appended (see spec).
  function buildPayload() {
    var L = S.lead, A = S.attr, sc = quizDone() ? score() : null;
    var summary = ["Buyer guide lead", "Town: " + L.town, "Renting: " + L.renting, "Lender reach-out: " + (L.lender_optin ? "Yes" : "No")];
    if (sc != null) summary.push("Quiz: " + sc + "/16 " + band(sc).name);
    return {
      name: L.first_name || null, address: null, phone: L.phone, email: L.email || null,
      timeline: L.timeline || null, notes: summary.join(" | "), sms_consent: !!L.sms_consent,
      utm_source: A.utm_source || null, utm_medium: A.utm_medium || null, utm_campaign: A.utm_campaign || null,
      utm_content: A.utm_content || null, utm_term: A.utm_term || null, src: A.src || null,
      page_url: location.href.slice(0, 500), referrer: document.referrer.slice(0, 500), user_agent: navigator.userAgent.slice(0, 300),
      company_website: document.getElementById("company_website").value,
      intent: "Buy", reason: null, owner_estimate: null, agent_priority: null, street: null, city: L.town || null, state: "CT", zip: null,
      lead_type: "buyer-guide", mailer_id: A.id || null, town: L.town || null, renting: L.renting || null,
      lender_optin: !!L.lender_optin, quiz_score: sc, quiz_band: sc != null ? band(sc).name : null,
      results_id: S.rid, results_url: resultsUrl(), sms_consent_text: C.gate.fields.sms_consent.label,
    };
  }
  function sendLead(payload) {
    if (!CONFIG.LIVE) { window.__lastPayload = payload; console.info("[mock] lead payload", payload); return new Promise(function (ok) { setTimeout(ok, 500); }); }
    var body = JSON.stringify(payload);
    // Same pattern as home-value main.js postLead: text/plain = no CORS preflight; retry once opaque.
    return fetch(CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body, redirect: "follow" })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error("rejected"); })
      .catch(function (err) { if (!(err instanceof TypeError)) throw err; return fetch(CONFIG.leadEndpoint, { method: "POST", mode: "no-cors", body: body }); });
  }

  function sent(next) {
    setProgress(null);
    var url = resultsUrl();
    main.innerHTML =
      '<section class="sent">' +
      '<div class="icon">' + ICON.phone + "</div>" +
      "<h1>" + esc(C.sent.title) + "</h1>" +
      '<p class="lead">' + esc(C.sent.body) + "</p>" +
      '<div class="linkbox"><code>' + esc(url) + '</code><button type="button" id="copy">Copy</button></div>' +
      '<div style="margin-top:1.5rem"><a class="pill pill-block" href="' + (next === "result" ? "#/quiz/result" : "#/plan") + '">' + esc(next === "result" ? C.quiz.seeResult : C.sent.cta) + "</a></div>" +
      '<p class="small muted" style="margin-top:1rem">' + esc(C.sent.noText) + "</p>" +
      "</section>";
    document.getElementById("copy").onclick = function () { copy(url, this); };
  }

  function hub() {
    setProgress(null);
    var name = S.lead.first_name;
    var gs = Math.min(S.guideStep, TOTAL_STEPS);
    var tiles = [
      { href: "#/guide/" + gs, ic: ICON.book, t: C.hub.guide.title, s: S.guideStep >= TOTAL_STEPS ? C.hub.guide.done : S.guideStep > 1 ? fmt(C.hub.guide.progress, { n: gs, total: TOTAL_STEPS }) : C.hub.guide.start, bar: (gs / TOTAL_STEPS) * 100 },
      { href: quizDone() ? "#/quiz/result" : "#/quiz", ic: ICON.quiz, t: C.hub.quiz.title, s: quizDone() ? fmt(C.hub.quiz.done, { score: score(), band: band(score()).name }) : C.hub.quiz.start },
      { href: "#/worksheet", ic: ICON.calc, t: C.hub.worksheet.title, s: wsTotal() ? fmt(C.hub.worksheet.done, { total: money(wsTotal()) }) : C.hub.worksheet.start },
    ];
    main.innerHTML =
      '<section class="hub stack">' +
      "<h1>" + esc(name ? fmt(C.hub.hello, { name: name }) : C.hub.helloNoName) + "</h1>" +
      tiles.map(function (x) {
        return '<a class="card tile" href="' + x.href + '"><span class="ic">' + x.ic + '</span><span class="tx"><strong>' + esc(x.t) + "</strong><span>" + esc(x.s) + "</span>" +
          (x.bar != null ? '<span class="bar" style="display:block"><i style="width:' + x.bar + '%"></i></span>' : "") + "</span>" + ICON.chev + "</a>";
      }).join("") +
      '<div class="card"><p class="small" style="margin:0;font-weight:600">' + esc(C.hub.linkLabel) + '</p><div class="linkbox" style="margin-top:.5rem"><code>' + esc(resultsUrl()) + '</code><button type="button" id="copy">Copy</button></div></div>' +
      
      "</section>";
    document.getElementById("copy").onclick = function () { copy(resultsUrl(), this); };
  }

  function guide(n) {
    if (!S.unlocked && n > 1) return go("#/unlock");
    n = Math.max(1, Math.min(TOTAL_STEPS, n));
    if (S.unlocked) { S.guideStep = Math.max(S.guideStep, n); save(); }
    setProgress((n / TOTAL_STEPS) * 100);
    var g = C.guide[n - 1], h = "";
    if (g.list) h += '<ol class="olist">' + g.list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    (g.blocks || []).forEach(function (b) {
      h += '<div class="block"><h3>' + esc(b.h) + "</h3>" + (b.p ? "<p>" + esc(b.p) + "</p>" : "") +
        (b.list ? "<ul>" + b.list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    });
    if (g.checklist) {
      var last = "";
      g.checklist.forEach(function (c) {
        if (c.group !== last) { h += '<p class="group">' + esc(c.group) + "</p>"; last = c.group; }
        h += '<label class="tick"><input type="checkbox" data-id="' + c.id + '"' + (S.checks[c.id] ? " checked" : "") + "><span>" + esc(c.t) + "</span></label>";
      });
    }
    if (g.outro) h += '<div class="block"><p style="color:var(--fg);font-weight:600">' + esc(g.outro) + "</p></div>";
    var dots = C.guide.map(function (_, i) { return "<i" + (i + 1 === n ? ' class="on"' : "") + "></i>"; }).join("");
    var nextHref = n < TOTAL_STEPS ? "#/guide/" + (n + 1) : (S.unlocked ? "#/plan" : "#/unlock");
    var nextLabel = n < TOTAL_STEPS ? "Next: " + C.guide[n].title : "Back to my game plan";
    if (!S.unlocked && n === 1) nextLabel = "Unlock the next 8 steps";
    main.innerHTML =
      '<article class="gstep" id="gstep">' +
      '<a class="back-link" href="' + (S.unlocked ? "#/plan" : "#/") + '">' + ICON.left + (S.unlocked ? "Game plan" : "Back") + "</a>" +
      '<p class="kicker">' + esc(g.kicker) + " of " + TOTAL_STEPS + "</p>" +
      "<h1>" + esc(g.title) + "</h1>" +
      '<p class="intro">' + esc(g.intro) + "</p>" + h +
      '<div class="gnav">' + (n > 1 ? '<a class="pill back" href="#/guide/' + (n - 1) + '" aria-label="Previous step">' + ICON.left + "</a>" : "") +
      '<a class="pill" href="' + nextHref + '">' + esc(nextLabel) + "</a></div>" +
      '<div class="dots" aria-hidden="true">' + dots + "</div>" +
      (n === 1 ? '<p class="swipe-hint">Swipe or tap Next to move through the steps</p>' : "") +
      "</article>";
    main.querySelectorAll(".tick input").forEach(function (cb) { cb.onchange = function () { S.checks[cb.dataset.id] = cb.checked; save(); }; });
    swipe(document.getElementById("gstep"), function () { if (n < TOTAL_STEPS || !S.unlocked) go(nextHref); }, function () { if (n > 1) go("#/guide/" + (n - 1)); });
  }
  function swipe(el, onLeft, onRight) {
    var x0, y0;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onLeft : onRight)();
    }, { passive: true });
  }

  function quiz(i) {
    var Q = C.quiz.questions;
    i = Math.max(0, Math.min(Q.length - 1, i));
    setProgress((i / Q.length) * 100);
    var q = Q[i];
    main.innerHTML =
      '<section class="card">' +
      '<button class="back-link" type="button" id="qback">' + ICON.left + (i ? "Back" : "Exit") + "</button>" +
      '<p class="qcount">Question ' + (i + 1) + " of " + Q.length + "</p>" +
      '<h1 class="qtext">' + esc(q.q) + "</h1>" +
      '<div class="answers">' + q.a.map(function (a, k) { return '<button type="button" class="ans" aria-pressed="' + (S.quiz[i] === k) + '" data-k="' + k + '"><span class="r"></span>' + esc(a) + "</button>"; }).join("") + "</div>" +
      "</section>";
    document.getElementById("qback").onclick = function () { i ? go("#/quiz/" + i) : go(S.unlocked ? "#/plan" : "#/"); };
    main.querySelectorAll(".ans").forEach(function (b) {
      b.onclick = function () {
        S.quiz[i] = Number(b.dataset.k); save();
        main.querySelectorAll(".ans").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        setTimeout(function () {
          if (i + 1 < Q.length) go("#/quiz/" + (i + 2));
          else go(S.unlocked ? "#/quiz/result" : "#/unlock?from=quiz");
        }, 220);
      };
    });
  }

  function result() {
    if (!quizDone()) return go("#/quiz");
    if (!S.unlocked) return go("#/unlock?from=quiz");
    setProgress(null);
    var sc = score(), b = band(sc), pct = sc / 16, R = 42, L = 2 * Math.PI * R;
    var todos = C.quiz.questions.filter(function (q, i) { return S.quiz[i] > 0; }).sort(function (a, b2) {
      return S.quiz[C.quiz.questions.indexOf(b2)] - S.quiz[C.quiz.questions.indexOf(a)];
    }).map(function (q) { return q.tip; });
    if (!todos.length) todos.push(C.quiz.allSet); else todos.push(C.quiz.always);
    main.innerHTML =
      '<section class="stack">' +
      '<a class="back-link" href="#/plan">' + ICON.left + "Game plan</a>" +
      '<div class="card"><p class="kicker">' + esc(C.quiz.resultTitle) + '</p><div class="score" style="margin-top:.75rem">' +
      '<div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="9"/>' +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (L * pct) + " " + L + '"/></svg><b><span>' + sc + "<small>of 16</small></span></b></div>" +
      '<div><p class="band">' + esc(b.name) + '</p><p class="small muted" style="margin:.25rem 0 0">' + esc(b.body) + "</p></div></div></div>" +
      '<div class="card"><h2 style="font-size:1.125rem">' + esc(C.quiz.nextTitle) + '</h2><ul class="todo">' +
      todos.map(function (t, k) { var id = "q" + k; return '<li><label class="tick" style="border:0;padding:0"><input type="checkbox" data-id="' + id + '"' + (S.checks[id] ? " checked" : "") + "><span>" + esc(t) + "</span></label></li>"; }).join("") + "</ul></div>" +
      '<a class="pill pill-block" href="#/worksheet">Next: up-front cost worksheet</a>' +
      '<div style="text-align:center"><button class="link-btn" id="retake" type="button">' + esc(C.quiz.retake) + "</button></div>" +
      "</section>";
    main.querySelectorAll(".todo input").forEach(function (cb) { cb.onchange = function () { S.checks[cb.dataset.id] = cb.checked; save(); }; });
    document.getElementById("retake").onclick = function () { S.quiz = []; Object.keys(S.checks).forEach(function (k) { if (k[0] === "q") delete S.checks[k]; }); save(); go("#/quiz/1"); };
  }

  function worksheet() {
    if (!S.unlocked) return go("#/unlock");
    setProgress(null);
    var W = C.worksheet, h = "";
    W.sections.forEach(function (sec, si) {
      h += '<div class="card ws-sec"><h3>' + esc(sec.h) + "</h3>" + (sec.note ? '<p class="note">' + esc(sec.note) + "</p>" : "");
      sec.items.forEach(function (it) {
        var v = S.ws[it.id] ? Number(S.ws[it.id]).toLocaleString("en-US") : "";
        h += '<div class="ws-row"><label for="ws-' + it.id + '">' + esc(it.label) + '</label><span class="hint">' + esc(it.hint) + "</span>" +
          '<div class="money"><span>$</span><input class="input" id="ws-' + it.id + '" data-id="' + it.id + '" inputmode="numeric" autocomplete="off" placeholder="' + esc(W.placeholder) + '" value="' + v + '"></div></div>';
      });
      h += '<div class="sub"><span>Subtotal</span><b data-sub="' + si + '">$0</b></div></div>';
    });
    main.innerHTML =
      '<section class="stack">' +
      '<a class="back-link" href="#/plan">' + ICON.left + "Game plan</a>" +
      '<h1 style="font-size:1.75rem;line-height:1.15">' + esc(W.title) + '</h1><p class="muted" style="margin:.25rem 0 0">' + esc(W.sub) + "</p>" +
      h +
      '<p class="small muted">' + esc(W.depositNote) + " " + esc(W.disclaimer) + "</p>" +
      '<div class="total"><span>' + esc(W.totalLabel) + '</span><b id="ws-total">$0</b></div>' +
      "</section>";
    function recalc() {
      W.sections.forEach(function (sec, si) {
        var t = sec.items.reduce(function (a, it) { return a + (Number(S.ws[it.id]) || 0); }, 0);
        main.querySelector('[data-sub="' + si + '"]').textContent = money(t);
      });
      document.getElementById("ws-total").textContent = money(wsTotal());
    }
    main.querySelectorAll(".money input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var d = inp.value.replace(/\D/g, "").slice(0, 9);
        S.ws[inp.dataset.id] = d ? Number(d) : 0;
        inp.value = d ? Number(d).toLocaleString("en-US") : "";
        save(); recalc();
      });
    });
    recalc();
  }

  // ---- Router -------------------------------------------------------------
  function render() {
    var h = location.hash.replace(/^#/, "") || "/";
    var parts = h.split("?"), path = parts[0], q = new URLSearchParams(parts[1] || "");
    document.getElementById("save-spot").hidden = !(S.unlocked && /^\/(guide|worksheet|quiz\/result|plan)/.test(path));
    var m;
    if (path === "/") teaser();
    else if (path === "/unlock") { if (S.unlocked) return go(q.get("from") === "quiz" ? "#/quiz/result" : "#/plan"); gate(q.get("from") === "quiz"); }
    else if (path === "/sent") sent(q.get("next"));
    else if (path === "/plan") { if (!S.unlocked) return go("#/unlock"); hub(); }
    else if ((m = path.match(/^\/guide\/(\d+)$/))) guide(Number(m[1]));
    else if (path === "/quiz") quiz(0);
    else if (path === "/quiz/result") result();
    else if ((m = path.match(/^\/quiz\/(\d+)$/))) quiz(Number(m[1]) - 1);
    else if (path === "/worksheet") worksheet();
    else teaser();
    window.scrollTo(0, 0);
    var h1 = main.querySelector("h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); h1.style.outline = "none"; }
  }
  document.getElementById("save-spot").onclick = function () {
    save();
    var url = resultsUrl();
    if (location.protocol !== "file:") history.replaceState(null, "", "?r=" + packState() + location.hash);
    copy(url); toast(C.saveSpot.saved);
  };
  document.getElementById("mockbar").hidden = CONFIG.LIVE;
  window.addEventListener("hashchange", render);
  render();
})();
