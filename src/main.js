import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "./styles.css";
import { site } from "../site.config.js";
import {
  CHOICES,
  PRIVACY_TEXT,
  SMS_CONSENT_TEXT,
  STEPS,
  THANKS_TEXT,
  buildLeadPayload,
  canCapturePartial,
  captureAttribution,
  validate,
} from "./lead.js";

const emptyFields = () => ({
  intent: "",
  reason: "",
  timeline: "",
  owner_estimate: "",
  agent_priority: "",
  notes: "",
  address: "",
  name: "",
  phone: "",
  email: "",
});

const state = {
  fields: emptyFields(),
  sms: false,
  utm: captureAttribution(new URLSearchParams()),
  step: -1,
  sending: false,
  submitted: false,
  beaconSent: false,
};

let choiceTimer = 0;

function svgIcon(paths, className) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);
  for (const d of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

const checkIcon = () => svgIcon(["M20 6 9 17l-5-5"], "icon-sm");
const arrowIcon = () => svgIcon(["m12 19-7-7 7-7", "M19 12H5"], "icon-sm");
const enterIcon = () => svgIcon(["m9 10-5 5 5 5", "M20 4v7a4 4 0 0 1-4 4H4"], "icon-xs");

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  state.fields.name = (params.get("name") ?? "").slice(0, 100);
  state.fields.address = (params.get("address") ?? "").slice(0, 300);
  state.utm = captureAttribution(params);
}

function progress() {
  if (state.step < 0) return 0;
  if (state.step >= STEPS.length) return 100;
  return ((state.step + 1) / STEPS.length) * 100;
}

function focusField() {
  window.setTimeout(() => {
    const target = document.querySelector("[data-autofocus]") || document.getElementById("step-question");
    if (!target) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }, 50);
}

function setStep(nextStep) {
  window.clearTimeout(choiceTimer);
  state.step = nextStep;
  render();
  focusField();
}

function showError(message) {
  const node = document.getElementById("form-error");
  if (!node) return;
  node.textContent = message;
  node.hidden = !message;
  const field = document.querySelector("[data-autofocus]");
  if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
}

function next() {
  const cur = STEPS[state.step];
  if (!cur || state.sending) return;
  if (cur.type !== "consent") {
    const err = validate(cur.key, state.fields[cur.key] ?? "");
    if (err) {
      showError(err);
      return;
    }
  }
  setStep(state.step + 1);
}

function choose(key, choice) {
  state.fields[key] = choice;
  for (const button of document.querySelectorAll("[data-choice]")) {
    const selected = button.dataset.choice === choice;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
  showError("");
  window.clearTimeout(choiceTimer);
  choiceTimer = window.setTimeout(() => setStep(state.step + 1), 220);
}

function setSending(sending) {
  state.sending = sending;
  const button = document.getElementById("submit-btn");
  if (!button) return;
  button.disabled = sending;
  button.textContent = sending ? "Sending…" : "Get my free market analysis";
}

function leadBody() {
  // Quiz answers stay after the original keys so a positional row writer
  // does not shift page_url, referrer, user_agent, or company_website.
  const { intent, reason, owner_estimate, agent_priority, ...core } = buildLeadPayload(
    state.fields,
    state.sms,
    state.utm,
  );
  return {
    ...core,
    page_url: window.location.href.slice(0, 500),
    referrer: document.referrer.slice(0, 500),
    user_agent: navigator.userAgent.slice(0, 300),
    company_website: document.getElementById("company_website")?.value ?? "",
    intent,
    reason,
    owner_estimate,
    agent_priority,
  };
}

function deliverQuietly(body) {
  try {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    if (navigator.sendBeacon?.(site.leadEndpoint, blob)) return;
  } catch {
    // Some browsers reject the beacon body. The fetch below is the fallback.
  }
  fetch(site.leadEndpoint, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    credentials: "omit",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  }).catch(() => {});
}

async function postLead(payload) {
  const body = JSON.stringify(payload);
  try {
    // text/plain keeps this a CORS "simple request": no preflight, and Apps Script's
    // redirected response is readable.
    const response = await fetch(site.leadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
    });
    if (!response.ok) throw new Error(String(response.status));
    const result = await response.json();
    if (!result || result.ok !== true) throw new Error(result?.error || "rejected");
  } catch (error) {
    // Network or CORS read failure: send once more opaquely. The script drops repeats,
    // so a lead that already landed is not duplicated.
    if (!(error instanceof TypeError)) throw error;
    await fetch(site.leadEndpoint, { method: "POST", mode: "no-cors", body });
  }
}

async function submit() {
  if (state.sending || state.submitted || state.step !== STEPS.length - 1) return;
  setSending(true);
  showError("");
  try {
    await postLead(leadBody());
    state.submitted = true;
    setSending(false);
    setStep(STEPS.length);
  } catch {
    setSending(false);
    showError("Sorry, we couldn't send your request. Please check your connection and try again.");
  }
}

function onPageHide(event) {
  if (event.persisted || state.submitted || state.sending || state.beaconSent) return;
  if (!canCapturePartial(state.fields)) return;
  state.beaconSent = true;
  deliverQuietly(JSON.stringify(leadBody()));
}

function onKey(event) {
  const cur = STEPS[state.step];
  if (!cur || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
  if (cur.type === "choice") {
    const choices = CHOICES[cur.key];
    const number = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
    const letter = "abcdef".indexOf(event.key.toLowerCase());
    const index = number >= 0 ? number : letter;
    const choice = choices[index];
    if (choice) {
      event.preventDefault();
      choose(cur.key, choice);
      return;
    }
  }
  if (event.key === "Enter" && !(cur.key === "notes" && event.shiftKey)) {
    event.preventDefault();
    if (cur.key === "consent") void submit();
    else next();
  }
}

function renderIntro() {
  const wrap = document.createElement("div");
  wrap.className = "intro step-in";
  const title = document.createElement("h1");
  title.className = "font-display";
  title.textContent = "See what a buyer might offer for your home today";
  const copy = document.createElement("p");
  copy.textContent =
    "A few quick questions, then your address. A free, no-obligation market analysis prepared by our local team — not an automated estimate.";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pill";
  button.textContent = "Get started";
  button.addEventListener("click", () => setStep(0));
  wrap.append(title, copy, button);
  return wrap;
}

function fieldControl(step) {
  if (step.type === "choice") {
    const choices = CHOICES[step.key];
    const list = document.createElement("div");
    list.className = "timeline";
    list.setAttribute("role", "group");
    list.setAttribute("aria-labelledby", "step-question");
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-btn";
      button.dataset.choice = choice;
      button.setAttribute("aria-pressed", state.fields[step.key] === choice ? "true" : "false");
      if (state.fields[step.key] === choice) button.classList.add("is-selected");
      const cap = document.createElement("span");
      cap.className = "keycap";
      cap.setAttribute("aria-hidden", "true");
      cap.textContent = String(index + 1);
      const label = document.createElement("span");
      label.textContent = choice;
      button.append(cap, label, svgIcon(["M20 6 9 17l-5-5"], "timeline-check"));
      button.addEventListener("click", () => choose(step.key, choice));
      list.append(button);
    });
    return list;
  }

  if (step.type === "notes") {
    const area = document.createElement("textarea");
    area.className = "field-input field-notes";
    area.id = "step-field";
    area.name = "notes";
    area.rows = 3;
    area.maxLength = 2000;
    area.placeholder = step.placeholder;
    area.value = state.fields.notes;
    area.dataset.autofocus = "true";
    area.setAttribute("aria-labelledby", "step-question");
    area.autocomplete = "off";
    area.enterKeyHint = "done";
    area.addEventListener("input", () => {
      state.fields.notes = area.value;
    });
    return area;
  }

  if (step.type === "consent") {
    const label = document.createElement("label");
    label.className = "consent";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = state.sms;
    box.dataset.autofocus = "true";
    box.addEventListener("change", () => {
      state.sms = box.checked;
    });
    const text = document.createElement("span");
    text.textContent = SMS_CONSENT_TEXT;
    label.append(box, text);
    return label;
  }

  const input = document.createElement("input");
  input.className = "field-input";
  input.id = "step-field";
  input.name = step.key;
  input.placeholder = step.placeholder ?? "";
  input.value = state.fields[step.key] ?? "";
  input.dataset.autofocus = "true";
  input.setAttribute("aria-labelledby", "step-question");
  input.enterKeyHint = "done";
  if (step.key === "phone") {
    input.type = "tel";
    input.inputMode = "tel";
    input.autocomplete = "tel";
    input.maxLength = 30;
  } else if (step.key === "email") {
    input.type = "email";
    input.inputMode = "email";
    input.autocomplete = "email";
    input.autocapitalize = "none";
    input.spellcheck = false;
    input.maxLength = 255;
  } else if (step.key === "name") {
    input.autocomplete = "name";
    input.maxLength = 100;
  } else if (step.type === "money") {
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.maxLength = 16;
    input.setAttribute("aria-describedby", "step-hint");
  } else {
    input.autocomplete = "street-address";
    input.maxLength = 300;
  }
  input.addEventListener("input", () => {
    state.fields[step.key] = input.value;
  });
  return input;
}

function renderStep() {
  const step = STEPS[state.step];
  const card = document.createElement("div");
  card.className = "card step-in";

  const kicker = document.createElement("p");
  kicker.className = "step-kicker";
  kicker.textContent = `${state.step + 1} of ${STEPS.length}`;

  const question = document.createElement("h2");
  question.className = "step-q font-display";
  question.id = "step-question";
  question.tabIndex = -1;
  question.textContent = step.q;

  card.append(kicker, question);
  if (step.hint) {
    const hint = document.createElement("p");
    hint.className = "step-hint";
    hint.id = "step-hint";
    hint.textContent = step.hint;
    card.append(hint);
  }

  const field = document.createElement("div");
  field.className = "field";
  field.append(fieldControl(step));
  card.append(field);

  const error = document.createElement("p");
  error.id = "form-error";
  error.className = "error";
  error.setAttribute("role", "alert");
  error.hidden = true;
  card.append(error);

  const actions = document.createElement("div");
  actions.className = "actions";
  if (step.type === "consent") {
    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.id = "submit-btn";
    submitButton.className = "pill pill-block";
    submitButton.textContent = "Get my free market analysis";
    submitButton.addEventListener("click", () => void submit());
    actions.append(submitButton);
  } else if (step.type !== "choice") {
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "pill";
    ok.append(document.createTextNode(step.optional ? "Continue" : "OK"), checkIcon());
    ok.addEventListener("click", next);
    const hint = document.createElement("span");
    hint.className = "enter-hint";
    hint.append(document.createTextNode("press Enter"), enterIcon());
    if (step.key === "notes") hint.append(document.createTextNode(" · Shift+Enter for new line"));
    actions.append(ok, hint);
  } else {
    const hint = document.createElement("span");
    hint.className = "key-hint";
    const count = CHOICES[step.key].length;
    hint.append(document.createTextNode("Tap a choice"));
    const keys = document.createElement("span");
    keys.className = "key-hint-keys";
    keys.textContent = `, or press 1–${count}`;
    hint.append(keys);
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "skip";
    skip.textContent = "Skip";
    skip.addEventListener("click", () => {
      window.clearTimeout(choiceTimer);
      state.fields[step.key] = "";
      setStep(state.step + 1);
    });
    actions.append(hint, skip);
  }
  card.append(actions);

  if (step.type === "consent") {
    const privacy = document.createElement("p");
    privacy.className = "privacy";
    privacy.textContent = PRIVACY_TEXT;
    card.append(privacy);
  }

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back";
  back.append(arrowIcon(), document.createTextNode("Back"));
  back.addEventListener("click", () => setStep(state.step - 1));
  card.append(back);
  return card;
}

function renderThanks() {
  const wrap = document.createElement("div");
  wrap.className = "thanks step-in";
  wrap.setAttribute("role", "status");
  const mark = document.createElement("div");
  mark.className = "thanks-mark";
  mark.append(svgIcon(["M20 6 9 17l-5-5"], "icon-sm"));
  const copy = document.createElement("p");
  copy.className = "font-display";
  copy.textContent = THANKS_TEXT;
  wrap.append(mark, copy);
  return wrap;
}

function render() {
  const value = progress();
  const bar = document.getElementById("progress");
  bar.style.width = `${value}%`;
  const track = document.getElementById("progress-track");
  track.setAttribute("aria-valuenow", String(Math.round(value)));
  track.setAttribute("aria-valuetext", state.step < 0 ? "Not started" : `${Math.round(value)} percent`);
  const main = document.getElementById("main");
  main.dataset.step = String(state.step);
  main.replaceChildren(state.step < 0 ? renderIntro() : state.step >= STEPS.length ? renderThanks() : renderStep());
}

readQuery();
document.addEventListener("keydown", onKey);
window.addEventListener("pagehide", onPageHide);
render();
