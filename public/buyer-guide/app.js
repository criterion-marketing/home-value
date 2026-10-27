/* Criterion Buyer Guide: one scroll-driven page. Static, vanilla JS, no build step. */
(function () {
  "use strict";

  // ---- Config -------------------------------------------------------------
  // LIVE = false: the sign-up is a mock. Nothing leaves the phone.
  // To go live, TraCy sets LIVE to true (see spec-for-tracy.md). The endpoint is the same
  // public Apps Script web app home-value posts to (site.config.js leadEndpoint).
  var CONFIG = {
    LIVE: false,
    leadEndpoint: "https://script.google.com/macros/s/AKfycbwcpeKoRHzPK2Vbdo5vTW_G8iIvSOhKQIMi0RbnQAMwPJZ39it3tr9JBRPZMmQCGHdS/exec",
    defaultSrc: "buyer-guide",
  };
  var C = window.CONTENT, ICON = window.ICON;
  var STORE = "criterion-buyer-guide-v1";
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "id"];
  var NQ = C.quiz.questions.length;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- State --------------------------------------------------------------
  function blank() { return { signed: false, extrasDone: false, lead: {}, quiz: [], checks: {}, ws: {}, rid: null, attr: {} }; }
  function load() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { return blank(); } }
  var S = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }

  // Attribution from the landing URL (same keys as home-value lead.js, plus mailer `id`).
  var params = new URLSearchParams(location.search);
  ATTR_KEYS.forEach(function (k) { var v = params.get(k); if (v) S.attr[k] = v.slice(0, 200); });
  if (!S.attr.src) S.attr.src = CONFIG.defaultSrc;

  // Personal link: ?r=<base64url JSON>. Answers only, plus first name for the greeting.
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function packState() {
    var c = Object.keys(S.checks).filter(function (k) { return S.checks[k]; });
    var w = {}; Object.keys(S.ws).forEach(function (k) { if (S.ws[k]) w[k] = S.ws[k]; });
    return b64e(JSON.stringify({ v: 2, i: S.rid, n: S.lead.first_name || "", s: S.signed ? 1 : 0, q: S.quiz, c: c, w: w }));
  }
  function resultsUrl() {
    var base = location.origin + location.pathname;
    if (location.protocol === "file:") base = "https://criterion-marketing.github.io/home-value/buyer-guide/";
    return base + "?r=" + packState();
  }
  var returning = false, r = params.get("r");
  if (r) {
    try {
      var d = JSON.parse(b64d(r));
      S.rid = d.i || S.rid; S.lead.first_name = S.lead.first_name || d.n || "";
      S.signed = S.signed || !!d.s || d.v === 1; if (S.signed) S.extrasDone = true;
      S.quiz = Array.isArray(d.q) ? d.q : []; S.ws = d.w || {};
      S.checks = {}; (d.c || []).forEach(function (k) { S.checks[k] = true; });
      returning = !!S.lead.first_name; save();
    } catch (e) {}
  }

  // ---- Helpers ------------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return esc(o[k]); }); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  var toastT;
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.hidden = false; requestAnimationFrame(function () { t.classList.add("on"); }); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.hidden = true; }, 300); }, 2600); }
  function copy(text, btn) {
    var done = function () { if (btn) { btn.textContent = C.signup.done.copied; setTimeout(function () { btn.textContent = C.signup.done.copy; }, 1800); } };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done); else done();
  }
  function scrollToId(id) { var el = $(id); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  function score() { return S.quiz.reduce(function (t, a) { return t + (a == null ? 0 : 2 - a); }, 0); }
  function quizDone() { return S.quiz.length === NQ && S.quiz.every(function (a) { return a != null; }); }
  function band(sc) { for (var i = 0; i < C.quiz.bands.length; i++) if (sc >= C.quiz.bands[i].min) return C.quiz.bands[i]; }
  function wsTotal() {
    var n = function (k) { return Number(S.ws[k]) || 0; };
    var sum = C.worksheet.items.reduce(function (t, it) { return t + n(it.id); }, 0);
    // The deposit is credited at closing, so it isn't extra cash on top of down payment + closing costs.
    return sum - Math.min(n("deposit"), n("down") + n("closing"));
  }
  // Headlines: keep hyphenated words (pre-approved) on one line.
  function hd(t) { return esc(t).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>'); }
  function nn(i) { return (i < 9 ? "0" : "") + (i + 1); }
  // Responsive photo: AVIF first, WebP fallback. Everything below the hero lazy-loads.
  var IMG_W = { stop: [640, 1000], door: [720, 1280] };
  function srcset(name, ws, ext) { return ws.map(function (w) { return "./img/" + name + "-" + w + "." + ext + " " + w + "w"; }).join(", "); }
  function pic(name, alt, ws, sizes, w, h) {
    return "<picture>" +
      '<source type="image/avif" srcset="' + srcset(name, ws, "avif") + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + srcset(name, ws, "webp") + '" sizes="' + sizes + '">' +
      '<img src="./img/' + name + "-" + ws[0] + '.webp" alt="' + esc(alt) + '" width="' + w + '" height="' + h + '" loading="lazy" decoding="async"></picture>';
  }
  function heroPic(alt) {
    var wide = [1280, 2048], tall = [720, 1080];
    return "<picture>" +
      '<source media="(min-width:860px)" type="image/avif" srcset="' + srcset("hero-wide", wide, "avif") + '" sizes="100vw">' +
      '<source media="(min-width:860px)" type="image/webp" srcset="' + srcset("hero-wide", wide, "webp") + '" sizes="100vw">' +
      '<source type="image/avif" srcset="' + srcset("hero-tall", tall, "avif") + '" sizes="100vw">' +
      '<source type="image/webp" srcset="' + srcset("hero-tall", tall, "webp") + '" sizes="100vw">' +
      '<img src="./img/hero-tall-720.webp" alt="' + esc(alt) + '" width="1080" height="1341" fetchpriority="high" decoding="async"></picture>';
  }
  function rv(html, delay, extra) { return '<div class="rv ' + (extra || "") + '" style="--d:' + (delay || 0) + 'ms">' + html + "</div>"; }

  // ---- Build page ---------------------------------------------------------
  var main = $("main");
  var renter = S.attr.src === "mailer-renter";
  var H = renter ? C.hero.renter : C.hero.generic;
  var kicker = returning ? "Welcome back, " + S.lead.first_name : H.kicker;

  var html = "", U0 = C.signup;
  html += '<section class="hero" id="top">' +
    '<div class="hero__media"><div class="parallax" id="hero-art">' + heroPic(C.hero.img.alt) + '</div></div><div class="hero__shade" aria-hidden="true"></div>' +
    '<div class="hero__in"><div class="hero__copy">' +
      '<p class="kicker load" style="--d:200ms">' + esc(kicker) + "</p>" +
      '<h1 class="display load" style="--d:350ms">' + hd(H.title) + "</h1>" +
      '<p class="lede load" style="--d:500ms">' + esc(H.line) + "</p>" +
      '<div class="cta-row load" style="--d:650ms"><a class="btn btn--light" href="#journey" data-jump="journey">' + esc(C.hero.cta) + '</a><a class="btn btn--link" href="#quiz" data-jump="quiz">' + esc(C.hero.ctaQuiz) + "</a></div>" +
    "</div></div>" +
    '<a class="cue" href="#journey" data-jump="journey" aria-label="Scroll to the journey"><span></span></a>' +
  "</section>";

  html += '<section class="journey" id="journey"><div class="wrap">' +
    rv('<p class="kicker">' + esc(C.journey.kicker) + "</p>") +
    rv('<h2 class="display">' + hd(C.journey.title) + "</h2>", 80) +
    rv('<p class="lede">' + esc(C.journey.line) + "</p>", 160) +
    '<ol class="road" id="road">' +
    C.stops.map(function (s, i) {
      return '<li style="--i:' + i + '"><a href="#' + s.id + '" data-jump="' + s.id + '"><span class="road__n">' + nn(i) + '</span><span class="road__txt">' + esc(s.label) + "</span>" + ICON("chev", "ic road__go") + "</a></li>";
    }).join("") + "</ol></div></section>";

  C.stops.forEach(function (s, i) {
    var more = "";
    if (s.more) more = s.more.map(function (m) { return '<div class="more__item"><h3>' + esc(m.h) + "</h3><p>" + esc(m.p) + "</p></div>"; }).join("");
    if (s.checklist) more = '<ul class="ticks">' + s.checklist.map(function (c) {
      return '<li><label><input type="checkbox" data-id="' + c.id + '"' + (S.checks[c.id] ? " checked" : "") + '><span class="box">' + ICON("yes") + "</span>" + esc(c.t) + "</label></li>";
    }).join("") + "</ul>" + (s.note ? '<p class="more__note">' + esc(s.note) + "</p>" : "");
    html += '<section class="stop' + (i % 2 ? " stop--alt" : "") + '" id="' + s.id + '" data-stop="' + i + '"><div class="stop__in">' +
      rv('<figure class="stop__fig"><div class="ph">' + pic(s.img, s.alt, IMG_W.stop, "(min-width:860px) 50vw, 100vw", 1000, 1241) + "</div></figure>", 0, "rv--img stop__media") +
      '<div class="stop__body"><div class="stop__copy">' +
        rv('<p class="kicker"><span class="kicker__n">' + nn(i) + "</span>" + esc(s.label) + "</p>") +
        rv('<h2 class="display">' + hd(s.title) + "</h2>", 120) +
        rv('<p class="lede">' + esc(s.line) + "</p>", 240) +
      "</div>" +
      rv('<button class="more-btn" type="button" aria-expanded="false" aria-controls="more-' + s.id + '"><span>' + esc(s.moreLabel || C.more) + "</span>" + ICON("plus") + "</button>" +
        '<div class="more" id="more-' + s.id + '" hidden><div class="more__in">' + more + "</div></div>", 340, "stop__more") +
    "</div></div></section>";
  });

  html += '<section class="quiz" id="quiz"><div class="wrap">' +
    rv('<p class="kicker">' + esc(C.quiz.kicker) + "</p>") +
    rv('<h2 class="display">' + hd(C.quiz.title) + "</h2>", 80) +
    rv('<p class="lede">' + esc(C.quiz.line) + "</p>", 160) +
    rv('<div class="qcard" id="qcard" aria-live="polite"></div>', 220) +
  "</div></section>";

  html += '<section class="ws" id="costs"><div class="wrap">' +
    rv('<p class="kicker">' + esc(C.worksheet.kicker) + "</p>") +
    rv('<h2 class="display">' + hd(C.worksheet.title) + "</h2>", 80) +
    rv('<p class="lede">' + esc(C.worksheet.line) + "</p>", 160) +
    '<div class="ws__list">' + C.worksheet.items.map(function (it, i) {
      return rv('<label class="ws__row" for="ws-' + it.id + '"><span class="ws__ic">' + nn(i) + '</span><span class="ws__lab"><b>' + esc(it.label) + "</b><small>" + esc(it.hint) + '</small></span><span class="ws__in"><span class="ws__cur">$</span><input id="ws-' + it.id + '" data-id="' + it.id + '" inputmode="numeric" autocomplete="off" placeholder="' + esc(C.worksheet.placeholder) + '" value="' + (S.ws[it.id] ? Number(S.ws[it.id]).toLocaleString("en-US") : "") + '"></span></label>', 60 * i);
    }).join("") + "</div>" +
    rv('<div class="ws__total"><span>' + esc(C.worksheet.totalLabel) + '</span><output id="ws-total">$0</output></div>', 100) +
    rv('<p class="fine">' + esc(C.worksheet.note) + "</p>", 140) +
  "</div></section>";

  html += '<section class="signup" id="signup">' + rv('<figure class="signup__fig"><div class="ph">' + pic(U0.img.name, U0.img.alt, IMG_W.door, "(min-width:860px) 50vw, 100vw", 1280, 1589) + "</div></figure>", 0, "rv--img signup__media") +
    '<div class="signup__body"><div class="wrap"><div id="signup-body"></div></div></div></section>';
  main.innerHTML = html;

  // ---- Reveal on scroll ----------------------------------------------------
  document.documentElement.classList.add("js");
  var reveals = main.querySelectorAll(".rv, .road");
  if (reduce || !("IntersectionObserver" in window)) reveals.forEach(function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }
  requestAnimationFrame(function () { document.body.classList.add("ready"); });

  // ---- Jumps, expanders, checklist ----------------------------------------
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-jump]");
    if (a) { e.preventDefault(); scrollToId(a.dataset.jump); }
  });
  main.querySelectorAll(".more-btn").forEach(function (b) {
    b.onclick = function () {
      var panel = $(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open);
      b.querySelector("span").textContent = open ? C.less : (C.stops.filter(function (s) { return "more-" + s.id === panel.id; })[0].moreLabel || C.more);
      if (open) { panel.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add("open"); }); }); }
      else { panel.classList.remove("open"); setTimeout(function () { if (!panel.classList.contains("open")) panel.hidden = true; }, reduce ? 0 : 250); }
    };
  });
  main.querySelectorAll(".ticks input").forEach(function (cb) { cb.onchange = function () { S.checks[cb.dataset.id] = cb.checked; save(); }; });

  // ---- Scroll-linked: hero parallax + journey rail -------------------------
  var hdr = $("hdr"), heroSec = $("top"), phs = main.querySelectorAll(".ph"), quizSec = $("quiz"), rail = $("rail"), heroArt = $("hero-art"), stops = main.querySelectorAll(".stop"), ticking = false;
  rail.innerHTML = '<div class="rail__in"><span class="rail__label" id="rail-label"></span><span class="rail__bars">' +
    C.stops.map(function () { return '<i><b></b></i>'; }).join("") + "</span></div>";
  var bars = rail.querySelectorAll(".rail__bars b"), railLabel = $("rail-label"), lastIdx = -1;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (!reduce && y < vh * 1.2) heroArt.style.transform = "translate3d(0," + (y * 0.3).toFixed(1) + "px,0)";
    hdr.classList.toggle("over", y < heroSec.offsetHeight - 70);
    // Subtle parallax inside each photo frame (image is 12% taller than its frame).
    if (!reduce) phs.forEach(function (ph) {
      var rc = ph.getBoundingClientRect(); if (rc.bottom < -50 || rc.top > vh + 50) return;
      var k = (rc.top + rc.height / 2 - vh / 2) / (vh / 2 + rc.height / 2);
      ph.firstChild.style.transform = "translate3d(0," + (k * -5).toFixed(2) + "%,0)";
    });
    var rects = []; stops.forEach(function (s) { rects.push(s.getBoundingClientRect()); });
    var mid = vh * 0.5, idx = -1, fills = [];
    rects.forEach(function (rc, i) {
      var f = Math.max(0, Math.min(1, (mid - rc.top) / rc.height));
      fills.push(f); if (rc.top <= mid) idx = i;
    });
    var qr = quizSec.getBoundingClientRect();
    hdr.classList.toggle("dark", qr.top < 60 && qr.bottom > 60);
    var show = rects[0].top < vh * 0.55 && rects[rects.length - 1].bottom > vh * 0.45;
    rail.classList.toggle("on", show);
    fills.forEach(function (f, i) { bars[i].style.transform = "scaleX(" + f.toFixed(3) + ")"; });
    if (idx !== lastIdx && idx >= 0) { lastIdx = idx; railLabel.textContent = "Stop " + (idx + 1) + " · " + C.stops[idx].label; }
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  var U = C.signup, body = $("signup-body"), EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
  // ---- Quiz ---------------------------------------------------------------
  var qcard = $("qcard"), qi = Math.min(S.quiz.filter(function (a) { return a != null; }).length, NQ - 1);
  function swap(render) {
    if (reduce) { render(); return; }
    qcard.classList.add("swap-out");
    setTimeout(function () { render(); qcard.classList.remove("swap-out"); qcard.classList.add("swap-in"); requestAnimationFrame(function () { requestAnimationFrame(function () { qcard.classList.remove("swap-in"); }); }); }, 200);
  }
  function question(i) {
    qi = i; var q = C.quiz.questions[i], ic = ["yes", "sortof", "notyet"];
    qcard.innerHTML =
      '<div class="qtop"><button type="button" class="qback" id="qback"' + (i ? "" : " hidden") + ">" + ICON("left") + esc(C.quiz.back) + '</button><span class="qcount">' + (i + 1) + " / " + NQ + "</span></div>" +
      '<div class="qdots">' + C.quiz.questions.map(function (_, k) { return "<i" + (k < i ? ' class="done"' : k === i ? ' class="on"' : "") + "></i>"; }).join("") + "</div>" +
      '<p class="qnum">' + nn(i) + "</p>" +
      '<h3 class="qq">' + esc(q.q) + "</h3>" +
      '<div class="tiles">' + C.quiz.answers.map(function (a, k) {
        return '<button type="button" class="tile" data-k="' + k + '" aria-pressed="' + (S.quiz[i] === k) + '"><span>' + esc(a) + '</span><span class="tile__ic">' + ICON("chev") + "</span></button>";
      }).join("") + "</div>";
    $("qback").onclick = function () { swap(function () { question(i - 1); }); };
    qcard.querySelectorAll(".tile").forEach(function (b) {
      b.onclick = function () {
        S.quiz[i] = Number(b.dataset.k); save();
        qcard.querySelectorAll(".tile").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        setTimeout(function () { swap(function () { i + 1 < NQ ? question(i + 1) : result(); }); }, reduce ? 0 : 260);
      };
    });
  }
  // Locked teaser: the score stays hidden until they sign up (name, cell, SMS consent).
  function locked() {
    var Lk = C.quiz.locked;
    qcard.innerHTML =
      '<div class="res res--locked">' +
        '<p class="lock__k">' + ICON("lock") + esc(Lk.kicker) + "</p>" +
        '<p class="res__band">' + hd(Lk.title) + "</p>" +
        '<p class="res__line">' + esc(Lk.line) + "</p>" +
        '<div class="ghost" aria-hidden="true"><div class="meter"><div class="meter__fill meter__fill--ghost"></div></div>' +
          '<div class="ghost__rows"><i></i><i></i><i></i></div><span class="ghost__lock">' + ICON("lock") + "</span></div>" +
        formHTML("q-", Lk.submit, true) +
        '<button type="button" class="btn btn--quiet-dark btn--sm" id="retake">' + esc(C.quiz.retake) + "</button>" +
      "</div>";
    bindForm("q-", function () { signedUp(true); });
    $("retake").onclick = function () { S.quiz = []; save(); swap(function () { question(0); }); };
  }
  function result(reveal) {
    if (!S.signed) { locked(); return; }
    var sc = score(), b = band(sc);
    var tips = []; S.quiz.forEach(function (a, k) { if (a !== 0) tips.push(C.quiz.questions[k].tip); });
    var top = tips.slice(0, 3), rest = tips.slice(3).concat([C.quiz.always]);
    if (!tips.length) { top = [C.quiz.allSet]; rest = []; }
    qcard.innerHTML =
      '<div class="res' + (reveal && !reduce ? " res--reveal" : "") + '">' +
        (S.extrasDone ? "" : '<p class="lock__k lock__k--ok">' + ICON("yes") + esc(C.quiz.unlocked.sent) + "</p>") +
        '<p class="res__band">' + esc(b.name) + "</p>" +
        '<p class="res__line">' + esc(b.line) + "</p>" +
        '<div class="meter" role="img" aria-label="' + sc + " of 16" + '"><div class="meter__fill" id="meter"></div></div>' +
        '<p class="res__score"><b>' + sc + "</b> of 16</p>" +
        '<h3 class="res__h">' + esc(C.quiz.nextTitle) + "</h3>" +
        '<ol class="steps">' + top.map(function (t, k) { return '<li><span>' + (k + 1) + "</span>" + esc(t) + "</li>"; }).join("") + "</ol>" +
        (rest.length ? '<button class="more-btn more-btn--dark" type="button" aria-expanded="false" id="res-more-btn"><span>' + esc(C.quiz.moreSteps) + "</span>" + ICON("plus") + '</button><div class="more" id="res-more" hidden><ul class="steps steps--more">' + rest.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" : "") +
        '<div class="res__cta">' + (S.extrasDone ? "" : '<a class="btn btn--light" href="#signup" data-jump="signup-body">' + esc(C.quiz.unlocked.tailor) + "</a>") + '<button type="button" class="btn btn--ghost-dark" id="retake">' + esc(C.quiz.retake) + "</button></div>" +
      "</div>";
    var fill = $("meter");
    setTimeout(function () { fill.style.transform = "scaleX(" + (sc / 16).toFixed(3) + ")"; }, reduce ? 0 : reveal ? 450 : 120);
    var mb = $("res-more-btn");
    if (mb) mb.onclick = function () { var p = $("res-more"), o = mb.getAttribute("aria-expanded") !== "true"; mb.setAttribute("aria-expanded", o); mb.querySelector("span").textContent = o ? C.less : C.quiz.moreSteps; p.hidden = !o; if (o) requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add("open"); }); }); else p.classList.remove("open"); };
    $("retake").onclick = function () { S.quiz = []; save(); swap(function () { question(0); }); };
  }
  quizDone() ? result() : question(qi);

  // ---- Worksheet ----------------------------------------------------------
  var totalEl = $("ws-total");
  function paintTotal() { totalEl.textContent = wsTotal() > 0 ? money(wsTotal()) : "$ –"; totalEl.classList.toggle("has", wsTotal() > 0); }
  main.querySelectorAll(".ws__in input").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var digits = inp.value.replace(/\D/g, "").slice(0, 9);
      inp.value = digits ? Number(digits).toLocaleString("en-US") : "";
      S.ws[inp.dataset.id] = digits ? Number(digits) : ""; save(); paintTotal();
    });
  });
  paintTotal();

  // ---- Sign-up (step 1 required, step 2 optional) -------------------------
  function err(name, msg) {
    var el = $("err-" + name); if (!el) return; el.textContent = msg; el.hidden = !msg;
    var input = $(name); if (input) input.closest(".fld, .consent").classList.toggle("bad", !!msg);
  }
  // One sign-up form, used in two places: inline under the locked quiz result ("q-") and in #signup ("").
  function formHTML(pfx, label, dark) {
    var L = S.lead;
    return '<form class="form' + (dark ? " form--dark" : "") + '" id="' + pfx + 'form" novalidate>' +
      '<label class="fld"><span class="fld__lab">' + esc(U.fields.first_name.label) + '</span><input class="input" id="' + pfx + 'first_name" autocomplete="given-name" maxlength="60" placeholder="' + esc(U.fields.first_name.placeholder) + '" value="' + esc(L.first_name || "") + '"></label><p class="err" id="err-' + pfx + 'first_name" hidden></p>' +
      '<label class="fld"><span class="fld__lab">' + esc(U.fields.phone.label) + '</span><input class="input" id="' + pfx + 'phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="' + esc(U.fields.phone.placeholder) + '" value="' + esc(L.phone || "") + '"></label><p class="err" id="err-' + pfx + 'phone" hidden></p>' +
      '<label class="consent"><input type="checkbox" id="' + pfx + 'sms_consent"' + (L.sms_consent ? " checked" : "") + '><span class="box">' + ICON("yes") + "</span><span>" + esc(U.consent) + '</span></label><p class="err" id="err-' + pfx + 'sms_consent" hidden></p>' +
      '<button class="btn btn--primary btn--block" id="' + pfx + 'submit" type="submit">' + esc(label) + "</button>" +
    "</form>";
  }
  function bindForm(pfx, onOk) {
    var L = S.lead, f = function (n) { return $(pfx + n); };
    f("phone").addEventListener("input", function (e) {
      var dg = e.target.value.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
      e.target.value = dg.length > 6 ? "(" + dg.slice(0, 3) + ") " + dg.slice(3, 6) + "-" + dg.slice(6) : dg.length > 3 ? "(" + dg.slice(0, 3) + ") " + dg.slice(3) : dg;
    });
    ["first_name", "phone", "sms_consent"].forEach(function (n) { var el = f(n); el.addEventListener(el.type === "checkbox" ? "change" : "input", function () { err(pfx + n, ""); }); });
    f("form").onsubmit = function (e) {
      e.preventDefault();
      L.first_name = f("first_name").value.trim().slice(0, 60); L.phone = f("phone").value.trim(); L.sms_consent = f("sms_consent").checked;
      var bad = [];
      [["first_name", !!L.first_name], ["phone", L.phone.replace(/\D/g, "").length === 10], ["sms_consent", L.sms_consent]].forEach(function (c) { err(pfx + c[0], c[1] ? "" : U.errors[c[0]]); if (!c[1]) bad.push(c[0]); });
      if (bad.length) { f(bad[0]).focus(); return; }
      var btn = f("submit"), label = btn.textContent; btn.disabled = true; btn.textContent = U.sending;
      S.rid = S.rid || Math.random().toString(36).slice(2, 10); save();
      sendLead(buildPayload("signup")).then(onOk, function () {
        btn.disabled = false; btn.textContent = label; toast("Something went wrong. Please try again.");
      });
    };
  }
  function step1() {
    body.innerHTML =
      rv('<p class="kicker">' + esc(U.kicker) + "</p>") +
      rv('<h2 class="display">' + hd(U.title) + "</h2>", 80) +
      rv('<p class="lede">' + esc(U.line) + "</p>", 160) +
      rv(formHTML("", U.submit), 220);
    revealNow(body);
    bindForm("", function () { signedUp(false); });
  }
  // After a successful sign-up from either form: unlock the score, then offer the optional extras.
  function signedUp(fromQuiz) {
    S.signed = true; save();
    step2(!fromQuiz);
    if (!quizDone()) return;
    if (!fromQuiz) { result(); return; }
    if (reduce) { result(true); scrollToId("qcard"); return; }
    qcard.classList.add("unlock-out");
    setTimeout(function () { result(true); qcard.classList.remove("unlock-out"); scrollToId("qcard"); }, 380);
  }
  function chips(name, opts, cur) {
    return '<div class="chips" role="group" aria-label="' + esc(C.signup.extras[name].label) + '" data-name="' + name + '">' + opts.map(function (o) {
      return '<button type="button" class="chip" aria-pressed="' + (cur === o) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  function step2(scroll) {
    var X = U.extras, L = S.lead;
    body.innerHTML =
      '<div class="step-in">' +
      '<p class="kicker">' + ICON("yes") + " Link sent</p>" +
      '<h2 class="display">' + fmt(X.title, { name: L.first_name }) + "</h2>" +
      '<p class="lede">' + esc(X.line) + "</p>" +
      '<div class="xgroup"><p class="xlab">' + esc(X.town.label) + "</p>" + chips("town", X.town.options, L.town) + "</div>" +
      '<div class="xgroup"><p class="xlab">' + esc(X.timeline.label) + "</p>" + chips("timeline", X.timeline.options, L.timeline) + "</div>" +
      '<div class="xgroup"><p class="xlab">' + esc(X.renting.label) + "</p>" + chips("renting", X.renting.options, L.renting) + "</div>" +
      '<label class="switch"><input type="checkbox" id="lender_optin"' + (L.lender_optin ? " checked" : "") + '><span class="switch__ui" aria-hidden="true"></span><span><b>' + esc(X.lender.label) + "</b><small>" + esc(X.lender.hint) + "</small></span></label>" +
      '<label class="fld"><span class="fld__lab">' + esc(X.email.label) + ' <em>optional</em></span><input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="' + esc(X.email.placeholder) + '" value="' + esc(L.email || "") + '"></label><p class="err" id="err-email" hidden></p>' +
      '<div class="row2"><button class="btn btn--primary" id="save2" type="button">' + esc(X.save) + '</button><button class="btn btn--quiet" id="skip2" type="button">' + esc(X.skip) + "</button></div>" +
      "</div>";
    body.querySelectorAll(".chips").forEach(function (g) {
      g.onclick = function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        var on = b.getAttribute("aria-pressed") !== "true";
        g.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", on && x === b); });
        L[g.dataset.name] = on ? b.textContent : ""; save();
      };
    });
    $("email").addEventListener("input", function () { err("email", ""); });
    $("skip2").onclick = function () { S.extrasDone = true; save(); done(true); };
    $("save2").onclick = function () {
      L.email = $("email").value.trim(); L.lender_optin = $("lender_optin").checked;
      if (L.email && !(L.email.length <= 255 && EMAIL_RE.test(L.email))) { err("email", U.errors.email); $("email").focus(); return; }
      var any = L.town || L.timeline || L.renting || L.lender_optin || L.email;
      var btn = this; btn.disabled = true; btn.textContent = U.sending;
      (any ? sendLead(buildPayload("details")) : Promise.resolve()).then(function () { S.extrasDone = true; save(); done(true); }, function () {
        btn.disabled = false; btn.textContent = X.save; toast("Something went wrong. Please try again.");
      });
    };
    if (scroll) scrollToId("signup-body");
  }
  function done(scroll) {
    var D = U.done, url = resultsUrl();
    body.innerHTML =
      '<div class="step-in done">' +
      '<div class="done__ic">' + ICON("phone") + "</div>" +
      '<h2 class="display">' + esc(D.title) + "</h2>" +
      '<p class="lede">' + esc(D.line) + "</p>" +
      '<div class="linkbox"><input readonly value="' + esc(url) + '" aria-label="Your personal link"><button class="btn btn--primary btn--sm" id="copy" type="button">' + esc(D.copy) + "</button></div>" +
      "</div>";
    $("copy").onclick = function () { copy(resultsUrl(), this); };
    if (location.protocol !== "file:") history.replaceState(null, "", "?r=" + packState());
    var res = $("retake"); if (res && quizDone()) result();
    if (scroll) scrollToId("signup-body");
  }
  function revealNow(scope) {
    var els = scope.querySelectorAll(".rv");
    if (reduce || !window.IntersectionObserver) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    els.forEach(function (el) { o.observe(el); });
  }
  if (!S.signed) step1(); else if (!S.extrasDone) step2(); else done();
  if (S.signed && !S.extrasDone) window.scrollTo(0, 0);

  // Lead payload: home-value's column order first, then buyer-guide keys appended (see spec).
  function buildPayload(event) {
    var L = S.lead, A = S.attr, sc = quizDone() ? score() : null, t = wsTotal();
    var summary = ["Buyer guide " + (event === "details" ? "details" : "sign-up")];
    if (L.town) summary.push("Town: " + L.town);
    if (L.renting) summary.push("Renting: " + L.renting);
    summary.push("Lender intro: " + (L.lender_optin ? "Yes" : "No"));
    if (sc != null) summary.push("Quiz: " + sc + "/16 " + band(sc).name);
    if (t > 0) summary.push("Cash to have ready (their entry): " + money(t));
    return {
      name: L.first_name || null, address: null, phone: L.phone, email: L.email || null,
      timeline: L.timeline || null, notes: summary.join(" | "), sms_consent: !!L.sms_consent,
      utm_source: A.utm_source || null, utm_medium: A.utm_medium || null, utm_campaign: A.utm_campaign || null,
      utm_content: A.utm_content || null, utm_term: A.utm_term || null, src: A.src || null,
      page_url: location.href.slice(0, 500), referrer: document.referrer.slice(0, 500), user_agent: navigator.userAgent.slice(0, 300),
      company_website: $("company_website").value,
      intent: "Buy", reason: null, owner_estimate: null, agent_priority: null, street: null, city: L.town || null, state: "CT", zip: null,
      lead_type: "buyer-guide", mailer_id: A.id || null, town: L.town || null, renting: L.renting || null,
      lender_optin: !!L.lender_optin, quiz_score: sc, quiz_band: sc != null ? band(sc).name : null,
      results_id: S.rid, results_url: resultsUrl(), sms_consent_text: U.consent,
      lead_event: event,
    };
  }
  function sendLead(payload) {
    if (!CONFIG.LIVE) {
      window.__lastPayload = payload; (window.__payloads = window.__payloads || []).push(payload);
      console.info("[mock] lead payload", payload); return new Promise(function (ok) { setTimeout(ok, 500); });
    }
    var b = JSON.stringify(payload);
    // Same pattern as home-value main.js postLead: text/plain = no CORS preflight; retry once opaque.
    return fetch(CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: b, redirect: "follow" })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error("rejected"); })
      .catch(function (e) { if (!(e instanceof TypeError)) throw e; return fetch(CONFIG.leadEndpoint, { method: "POST", mode: "no-cors", body: b }); });
  }

  // ---- Header -------------------------------------------------------------
  $("save-spot").onclick = function () {
    S.rid = S.rid || Math.random().toString(36).slice(2, 10); save();
    if (location.protocol !== "file:") history.replaceState(null, "", "?r=" + packState());
    copy(resultsUrl()); toast(C.saveSpot.saved);
  };
  $("mockbar").hidden = CONFIG.LIVE;
  function hdrState() { hdr.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", hdrState, { passive: true }); hdrState();
})();
