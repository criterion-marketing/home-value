export const TIMELINES = [
  "Just curious",
  "0-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
];

export const STEPS = [
  { key: "address", q: "What's the property address?", placeholder: "123 Main Street, Town, State" },
  { key: "name", q: "What's your name?", hint: "Optional", placeholder: "Full name" },
  { key: "phone", q: "Best phone number to reach you?", placeholder: "(555) 555-0123" },
  { key: "email", q: "Email address?", hint: "Optional", placeholder: "you@example.com" },
  { key: "timeline", q: "When might you consider selling?" },
  {
    key: "notes",
    q: "Anything our team should know?",
    hint: "Optional — updates, condition, questions",
    placeholder: "Type here…",
  },
  { key: "consent", q: "Last step" },
];

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
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

export function captureAttribution(params) {
  return Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, params.get(key)?.slice(0, 200) || null]),
  );
}

export function validate(key, value) {
  if (key === "address") {
    if (!value.trim()) return "Please enter the property address.";
    if (value.length > 300) return "Address is too long.";
  }
  if (key === "name" && value.length > 100) return "Name is too long.";
  if (key === "phone" && (value.replace(/\D/g, "").length < 10 || value.length > 30)) {
    return "Please enter a valid phone number.";
  }
  if (key === "email") {
    const trimmed = value.trim();
    if (trimmed && (trimmed.length > 255 || !EMAIL_RE.test(trimmed))) {
      return "Please enter a valid email, or leave it blank.";
    }
  }
  if (key === "notes" && value.length > 2000) {
    return "Please keep notes under 2000 characters.";
  }
  return null;
}

/** Columns the 15-minute lead routine reads. `source` is omitted; the database defaults it. */
export function buildLeadPayload(fields, smsConsent, utm) {
  return {
    name: fields.name.trim() || null,
    address: fields.address.trim(),
    phone: fields.phone.trim(),
    email: fields.email.trim() || null,
    timeline: fields.timeline || null,
    notes: fields.notes.trim() || null,
    sms_consent: smsConsent,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: utm.utm_content ?? null,
    utm_term: utm.utm_term ?? null,
    src: utm.src ?? null,
  };
}
