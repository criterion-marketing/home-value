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
  { key: "address", type: "address", q: "What's the property address?", hint: "Street, city, and ZIP" },
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
  "street",
  "city",
  "state",
  "zip",
];

/** New keys, in the order they are appended after company_website. */
export const APPENDED_FIELDS = [
  "intent",
  "reason",
  "owner_estimate",
  "agent_priority",
  "street",
  "city",
  "state",
  "zip",
];

/** About a minute for the whole form, rounded to 5 seconds as steps pass. */
export const QUIZ_SECONDS = 60;

export const STATES = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const STATE_ABBR = new Set(STATES.map(([abbr]) => abbr));
const STATE_BY_NAME = Object.fromEntries(STATES.map(([abbr, name]) => [name.toLowerCase(), abbr]));

export const SMS_CONSENT_TEXT =
  "I agree to receive text messages from Criterion Real Estate about my home valuation at the number provided. Msg & data rates may apply. Reply STOP to opt out.";

export const PRIVACY_TEXT =
  "We respect your privacy. Your information is never sold or shared and is used only to prepare your market analysis.";

export const THANKS_TEXT =
  "Thanks! A member of our team will reach out with your custom market analysis within 24 hours.";

/** Same shape zod's email().max(255) used on the previous page. */
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

const ESTIMATE_MAX = 100_000_000;

export function secondsRemaining(stepIndex, total = STEPS.length) {
  if (stepIndex < 0 || stepIndex >= total) return null;
  const raw = ((total - stepIndex) / total) * QUIZ_SECONDS;
  return Math.max(5, Math.ceil(raw / 5) * 5);
}

export function timeLeftLabel(stepIndex, total = STEPS.length) {
  const seconds = secondsRemaining(stepIndex, total);
  if (seconds == null) return "";
  return `About ${seconds} seconds left`;
}

export function normalizeState(value) {
  const raw = String(value ?? "").trim().replace(/\./g, "");
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (STATE_ABBR.has(upper)) return upper;
  return STATE_BY_NAME[raw.toLowerCase()] ?? "";
}

export function normalizeZip(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return "";
}

export function composeAddress(parts) {
  const street = String(parts?.street ?? "").trim();
  const city = String(parts?.city ?? "").trim();
  const state = normalizeState(parts?.state || "");
  const zip = normalizeZip(parts?.zip);
  if (!street) return "";
  if (!city && !zip) return street;
  const region = [state, zip].filter(Boolean).join(" ");
  return [street, city, region].filter(Boolean).join(", ");
}

/** Split a single-line address into parts. State defaults to CT when the line has no state. */
export function parseAddress(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  const empty = { street: "", city: "", state: "CT", zip: "" };
  if (!raw) return empty;
  if (raw.length > 300) return { ...empty, street: raw.slice(0, 200) };

  const zipMatch = raw.match(/(\d{5})(?:-(\d{4}))?\s*$/);
  if (!zipMatch) return { ...empty, street: raw.slice(0, 200) };
  const zip = zipMatch[2] ? `${zipMatch[1]}-${zipMatch[2]}` : zipMatch[1];
  const head = raw.slice(0, zipMatch.index).trim().replace(/[,\s]+$/, "");
  const bits = head.split(",").map((part) => part.trim()).filter(Boolean);

  let state = "";
  let city = "";
  let streetBits = [];
  if (bits.length >= 2) {
    const last = bits[bits.length - 1];
    const asState = normalizeState(last);
    if (asState && last.length <= 20) {
      state = asState;
      city = bits[bits.length - 2];
      streetBits = bits.slice(0, -2);
    } else {
      const mixed = last.match(/^(.*\S)\s+([A-Za-z]{2})$/);
      if (mixed && normalizeState(mixed[2])) {
        state = normalizeState(mixed[2]);
        city = mixed[1];
        streetBits = bits.slice(0, -1);
      }
    }
  } else if (bits.length === 1) {
    const loose = bits[0].match(/^(.*\S)\s+([A-Za-z][A-Za-z .'-]*?\S)\s+([A-Za-z]{2})$/);
    if (loose && normalizeState(loose[3])) {
      streetBits = [loose[1]];
      city = loose[2];
      state = normalizeState(loose[3]);
    }
  }

  if (!state || !city || streetBits.length === 0 || !/[A-Za-z]/.test(streetBits.join(" "))) {
    return { ...empty, street: raw.slice(0, 200) };
  }
  return {
    street: streetBits.join(", ").slice(0, 200),
    city: city.slice(0, 80),
    state,
    zip,
  };
}

export function addressIssue(fields) {
  const street = String(fields?.street ?? "").trim();
  const city = String(fields?.city ?? "").trim();
  const state = normalizeState(fields?.state || "");
  const zip = normalizeZip(fields?.zip);
  if (!street || !/[A-Za-z]/.test(street)) return { field: "street", message: "Please enter the street address." };
  if (street.length > 200) return { field: "street", message: "Street address is too long." };
  if (!city) return { field: "city", message: "Please enter the city or town." };
  if (city.length > 80 || !/^[A-Za-z][A-Za-z .'-]*$/.test(city)) {
    return { field: "city", message: "Please enter a city or town." };
  }
  if (!state) return { field: "state", message: "Please choose a state." };
  if (!zip) return { field: "zip", message: "Please enter a 5-digit ZIP code." };
  if (composeAddress({ street, city, state, zip }).length > 300) {
    return { field: "street", message: "Address is too long." };
  }
  return null;
}

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
    if (text.trim().length > 300) return "Address is too long.";
    return addressIssue(parseAddress(text))?.message ?? null;
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

function partsFromFields(fields) {
  const directStreet = String(fields?.street ?? "").trim();
  const directCity = String(fields?.city ?? "").trim();
  const directZip = String(fields?.zip ?? "").trim();
  if (directStreet || directCity || directZip) {
    return {
      street: directStreet,
      city: directCity,
      state: normalizeState(fields?.state || "CT") || "CT",
      zip: directZip,
    };
  }
  return parseAddress(fields?.address ?? "");
}

/** A full address and phone are enough to keep a lead when someone leaves early. */
export function canCapturePartial(fields) {
  return addressIssue(partsFromFields(fields)) == null && validate("phone", fields?.phone ?? "") == null;
}

/** Fields the Apps Script web app stores; the 15-minute lead routine reads them from the sheet. */
export function buildLeadPayload(fields, smsConsent, utm) {
  const estimate = parseEstimate(fields.owner_estimate ?? "");
  const parts = partsFromFields(fields);
  const state = normalizeState(parts.state);
  const zip = normalizeZip(parts.zip);
  const composed = composeAddress({ ...parts, state, zip });
  return {
    name: (fields.name ?? "").trim() || null,
    address: composed || String(fields.address ?? "").trim(),
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
    street: parts.street.trim() || null,
    city: parts.city.trim() || null,
    state: state || null,
    zip: zip || null,
  };
}
