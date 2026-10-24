export const INTENTS = ["Sell", "Buy", "Both", "Just curious"];

export const REASONS = [
  "Downsizing",
  "Need more space",
  "Job or family move",
  "Cashing out equity",
  "Relocating",
  "Other",
];

export const TIMELINES = [
  "0-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
  "Not sure",
];

export const AGENT_PRIORITIES = [
  "Honest pricing",
  "Marketing reach",
  "Local expertise",
  "Communication",
  "Low pressure",
  "Other",
];

/** Tap-to-answer steps. Values are stored under the step key. */
export const CHOICES = {
  intent: INTENTS,
  reason: REASONS,
  timeline: TIMELINES,
  agent_priority: AGENT_PRIORITIES,
};

export const STEPS = [
  { key: "intent", type: "choice", q: "Are you thinking about selling, buying, or both?" },
  { key: "reason", type: "choice", q: "What's the main reason for a possible move?" },
  { key: "timeline", type: "choice", q: "What's your timeline?" },
  {
    key: "owner_estimate",
    type: "money",
    q: "What do you think your home is worth?",
    hint: "Optional — your best guess",
    placeholder: "450,000",
    optional: true,
  },
  { key: "agent_priority", type: "choice", q: "What matters most in an agent?" },
  {
    key: "notes",
    type: "notes",
    q: "Anything else we should know?",
    hint: "Optional",
    placeholder: "Type here…",
    optional: true,
  },
  { key: "address", type: "text", q: "What's the property address?", placeholder: "123 Main Street, Town, State" },
  { key: "name", type: "text", q: "What's your name?", hint: "Optional", placeholder: "Full name", optional: true },
  { key: "phone", type: "text", q: "Best phone number to reach you?", placeholder: "(555) 555-0123" },
  { key: "email", type: "text", q: "Email address?", hint: "Optional", placeholder: "you@example.com", optional: true },
  { key: "consent", type: "consent", q: "Last step" },
];

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
];

/**
 * Lead columns. The first 13 match the existing Web Submissions fields.
 * The last four are new. On the wire they are sent after company_website
 * so a positional writer does not shift the original columns.
 */
export const LEAD_FIELDS = [
  "name",
  "address",
  "phone",
  "email",
  "timeline",
  "notes",
  "sms_consent",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "intent",
  "reason",
  "owner_estimate",
  "agent_priority",
];

export const SMS_CONSENT_TEXT =
  "I agree to receive text messages from Criterion Real Estate at (475) 897-5114 about my home valuation at the number provided. Msg & data rates may apply. Reply STOP to opt out.";

export const PRIVACY_TEXT =
  "We respect your privacy. Your information is never sold or shared and is used only to prepare your market analysis.";

export const THANKS_TEXT =
  "Thanks! A member of our team will reach out with your custom market analysis within 24 hours.";

/** Same shape zod's email().max(255) used on the previous page. */
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

const ESTIMATE_MAX = 100_000_000;

export function captureAttribution(params) {
  return Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, params.get(key)?.slice(0, 200) || null]),
  );
}

export function parseEstimate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount <= 0 || amount > ESTIMATE_MAX) return null;
  return Math.round(amount);
}

function choiceOrNull(key, value) {
  const allowed = CHOICES[key];
  return allowed?.includes(value) ? value : null;
}

export function validate(key, value) {
  const text = String(value ?? "");
  if (key === "address") {
    if (!text.trim()) return "Please enter the property address.";
    if (text.length > 300) return "Address is too long.";
  }
  if (key === "name" && text.length > 100) return "Name is too long.";
  if (key === "phone" && (text.replace(/\D/g, "").length < 10 || text.length > 30)) {
    return "Please enter a valid phone number.";
  }
  if (key === "email") {
    const trimmed = text.trim();
    if (trimmed && (trimmed.length > 255 || !EMAIL_RE.test(trimmed))) {
      return "Please enter a valid email, or leave it blank.";
    }
  }
  if (key === "notes" && text.length > 2000) {
    return "Please keep notes under 2000 characters.";
  }
  if (key === "owner_estimate") {
    const trimmed = text.trim();
    if (trimmed && (trimmed.length > 16 || parseEstimate(trimmed) == null)) {
      return "Please enter a dollar amount, or leave it blank.";
    }
  }
  if (CHOICES[key] && text && !CHOICES[key].includes(text)) return "Please choose one.";
  return null;
}

/** Address and phone are enough to keep a lead when someone leaves early. */
export function canCapturePartial(fields) {
  return validate("address", fields?.address ?? "") == null && validate("phone", fields?.phone ?? "") == null;
}

/** Fields the Apps Script web app stores; the 15-minute lead routine reads them from the sheet. */
export function buildLeadPayload(fields, smsConsent, utm) {
  const estimate = parseEstimate(fields.owner_estimate ?? "");
  return {
    name: (fields.name ?? "").trim() || null,
    address: (fields.address ?? "").trim(),
    phone: (fields.phone ?? "").trim(),
    email: (fields.email ?? "").trim() || null,
    timeline: choiceOrNull("timeline", fields.timeline),
    notes: (fields.notes ?? "").trim() || null,
    sms_consent: smsConsent,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: utm.utm_content ?? null,
    utm_term: utm.utm_term ?? null,
    src: utm.src ?? null,
    intent: choiceOrNull("intent", fields.intent),
    reason: choiceOrNull("reason", fields.reason),
    owner_estimate: estimate,
    agent_priority: choiceOrNull("agent_priority", fields.agent_priority),
  };
}
