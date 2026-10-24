import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import {
  ATTRIBUTION_KEYS,
  APPENDED_FIELDS,
  LEAD_FIELDS,
  SMS_CONSENT_TEXT,
  STEPS,
  THANKS_TEXT,
  buildLeadPayload,
  canCapturePartial,
  captureAttribution,
  composeAddress,
  parseAddress,
  parseEstimate,
  secondsRemaining,
  timeLeftLabel,
  validate,
} from "../src/lead.js";
import { site } from "../site.config.js";

const base = (process.argv[2] || "http://127.0.0.1:4321").replace(/\/$/, "");
const outDir = path.resolve("docs/screenshots");
const shots = process.argv.includes("--no-shots") ? false : true;

function checkLeadLogic() {
  assert.equal(validate("address", "  "), "Please enter the street address.");
  assert.equal(validate("address", "x".repeat(301)), "Address is too long.");
  assert.equal(validate("address", "123 Main Street"), "Please enter the city or town.");
  assert.equal(validate("address", "123 Main Street, Wilton, CT 06897"), null);
  assert.equal(validate("address", "123 Main Street, Wilton, Connecticut 06897"), null);
  assert.deepEqual(parseAddress("123 Main Street, Unit 4, Wilton, CT 06897-1234"), {
    street: "123 Main Street, Unit 4",
    city: "Wilton",
    state: "CT",
    zip: "06897-1234",
  });
  assert.equal(parseAddress("A".repeat(340)).street.length, 200);
  assert.equal(composeAddress({ street: "10 Oak Avenue", city: "Ridgefield", state: "ct", zip: "06877" }), "10 Oak Avenue, Ridgefield, CT 06877");
  assert.equal(timeLeftLabel(0), "About 60 seconds left");
  assert.ok(secondsRemaining(6) < secondsRemaining(0));
  assert.equal(secondsRemaining(STEPS.length - 1) >= 5, true);
  assert.equal(validate("name", ""), null);
  assert.equal(validate("name", "n".repeat(101)), "Name is too long.");
  assert.equal(validate("phone", "123"), "Please enter a valid phone number.");
  assert.equal(validate("phone", "123456789"), "Please enter a valid phone number.");
  assert.equal(validate("phone", "(555) 555-0123"), null);
  assert.equal(validate("phone", "1".repeat(31)), "Please enter a valid phone number.");
  assert.equal(validate("email", "  "), null);
  assert.equal(validate("email", "not-an-email"), "Please enter a valid email, or leave it blank.");
  assert.equal(validate("email", "a@b"), "Please enter a valid email, or leave it blank.");
  assert.equal(validate("email", "you@example.com"), null);
  assert.equal(validate("notes", "ok"), null);
  assert.equal(validate("notes", "n".repeat(2001)), "Please keep notes under 2000 characters.");
  assert.equal(validate("timeline", ""), null);
  assert.equal(validate("timeline", "Just curious"), "Please choose one.");
  assert.equal(validate("timeline", "Not sure"), null);
  assert.equal(validate("owner_estimate", ""), null);
  assert.equal(validate("owner_estimate", "nope"), "Please enter a dollar amount, or leave it blank.");
  assert.equal(validate("owner_estimate", "$450,000"), null);
  assert.equal(parseEstimate(""), null);
  assert.equal(parseEstimate("$450,000"), 450000);
  assert.equal(parseEstimate("450000.40"), 450000);
  assert.equal(parseEstimate("0"), null);
  assert.equal(canCapturePartial({ address: "123 Main", phone: "555" }), false);
  assert.equal(canCapturePartial({ street: "123 Main Street", city: "Wilton", state: "CT", zip: "06897", phone: "(555) 555-0123" }), true);
  assert.equal(canCapturePartial({ address: "123 Main Street, Wilton, CT 06897", phone: "(555) 555-0123" }), true);

  const params = new URLSearchParams({
    utm_source: "q".repeat(250),
    utm_medium: "",
    src: "postcard",
  });
  const utm = captureAttribution(params);
  assert.equal(utm.utm_source.length, 200);
  assert.equal(utm.utm_medium, null);
  assert.equal(utm.utm_campaign, null);
  assert.equal(utm.utm_content, null);
  assert.equal(utm.utm_term, null);
  assert.equal(utm.src, "postcard");
  assert.deepEqual(Object.keys(utm), ATTRIBUTION_KEYS);

  const payload = buildLeadPayload(
    {
      name: "  ",
      address: "ignored when parts are present",
      street: " 123 Main Street ",
      city: " Wilton ",
      state: "ct",
      zip: "06897",
      phone: " 5555555555 ",
      email: "",
      timeline: "",
      notes: "  hello ",
      intent: "Sell",
      reason: "Not a real reason",
      owner_estimate: " $450,000 ",
      agent_priority: "Low pressure",
    },
    false,
    utm,
  );
  assert.deepEqual(Object.keys(payload), LEAD_FIELDS);
  assert.equal(payload.name, null);
  assert.equal(payload.address, "123 Main Street, Wilton, CT 06897");
  assert.equal(payload.street, "123 Main Street");
  assert.equal(payload.city, "Wilton");
  assert.equal(payload.state, "CT");
  assert.equal(payload.zip, "06897");
  assert.equal(payload.phone, "5555555555");
  assert.equal(payload.email, null);
  assert.equal(payload.timeline, null);
  assert.equal(payload.notes, "hello");
  assert.equal(payload.sms_consent, false);
  assert.equal(payload.intent, "Sell");
  assert.equal(payload.reason, null);
  assert.equal(payload.owner_estimate, 450000);
  assert.equal(payload.agent_priority, "Low pressure");
  assert.equal("source" in payload, false);
  assert.equal(STEPS.length, 11);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shot(page, name) {
  if (!shots) return;
  await sleep(450);
  await page.screenshot({ path: path.join(outDir, name) });
}

async function kicker(page) {
  return page.$eval(".step-kicker", (node) => node.textContent);
}

async function waitKicker(page, text) {
  await page.waitForFunction((expected) => document.querySelector(".step-kicker")?.textContent === expected, {}, text);
}

async function fillAddress(page, { street, city, state = "CT", zip }) {
  await page.click("#street", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  if (street) await page.type("#street", street);
  await page.click("#city", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  if (city) await page.type("#city", city);
  await page.select("#state", state);
  await page.click("#zip", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  if (zip) await page.type("#zip", zip);
}

async function completeUntilConsent(page) {
  await page.click(".intro .pill");
  await page.waitForSelector(".timeline-btn");
  assert.equal(await kicker(page), "1 of 11");
  assert.equal(await page.$eval(".time-left", (node) => node.textContent), "About 60 seconds left");
  assert.equal(
    await page.$eval("#step-question", (node) => node.textContent),
    "Are you thinking about selling, buying, or both?",
  );
  await page.keyboard.press("1");
  await waitKicker(page, "2 of 11");
  await page.keyboard.press("1");
  await waitKicker(page, "3 of 11");
  await page.keyboard.press("2");
  await waitKicker(page, "4 of 11");
  const estimateSize = await page.$eval(".field-input", (node) => parseFloat(getComputedStyle(node).fontSize));
  assert.ok(estimateSize >= 16, "inputs stay at least 16px so iOS does not zoom");
  await page.type(".field-input", "nope");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.$eval("#form-error", (node) => node.textContent),
    "Please enter a dollar amount, or leave it blank.",
  );
  await page.click(".field-input", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(".field-input", "$450,000");
  await page.keyboard.press("Enter");
  await waitKicker(page, "5 of 11");
  await page.keyboard.press("5");
  await waitKicker(page, "6 of 11");
  await page.type(".field-input", "Fresh paint");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Shift");
  assert.equal(await kicker(page), "6 of 11");
  const notes = await page.$eval(".field-input", (node) => node.value);
  assert.ok(notes.includes("\n"), "Shift+Enter should insert a newline");
  await page.keyboard.press("Enter");
  await waitKicker(page, "7 of 11");
  assert.match(await page.$eval(".time-left", (node) => node.textContent), /^About \d+ seconds left$/);
  const addressSeconds = await page.$eval(".time-left", (node) => Number(node.textContent.match(/\d+/)[0]));
  assert.ok(addressSeconds < 60, "time left counts down by the address step");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#form-error", (node) => node.textContent), "Please enter the street address.");
  await page.type("#street", "123");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#form-error", (node) => node.textContent), "Please enter the street address.");
  await page.click("#street", { clickCount: 3 });
  await page.type("#street", "123 Main Street");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#form-error", (node) => node.textContent), "Please enter the city or town.");
  await page.type("#city", "Wilton");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#form-error", (node) => node.textContent), "Please enter a 5-digit ZIP code.");
  await page.select("#state", "CT");
  assert.equal(await page.$eval("#state", (node) => node.value), "CT");
  await page.evaluate(() => {
    document.getElementById("street").value = "123 Main Street";
    document.getElementById("city").value = "Wilton";
    document.getElementById("state").value = "NY";
    document.getElementById("zip").value = "06897";
  });
  await page.keyboard.press("Enter");
  await waitKicker(page, "8 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "9 of 11");
  await page.type(".field-input", "555");
  await page.click(".actions .pill");
  const phoneError = await page.$eval("#form-error", (node) => node.textContent);
  assert.equal(phoneError, "Please enter a valid phone number.");
  await page.click(".field-input", { clickCount: 3 });
  await page.type(".field-input", "(555) 555-0123");
  await page.keyboard.press("Enter");
  await waitKicker(page, "10 of 11");
  await page.type(".field-input", "not-an-email");
  await page.keyboard.press("Enter");
  const emailError = await page.$eval("#form-error", (node) => node.textContent);
  assert.equal(emailError, "Please enter a valid email, or leave it blank.");
  await page.click(".field-input", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Enter");
  await waitKicker(page, "11 of 11");
  const consent = await page.$eval(".consent span", (node) => node.textContent);
  assert.equal(consent, SMS_CONSENT_TEXT);
  const privacy = await page.$eval(".privacy", (node) => node.textContent);
  assert.match(privacy, /never sold or shared/);
}

async function runBrowser() {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  const posts = [];
  let failNext = false;
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = request.url();
    if (!url.startsWith(site.leadEndpoint)) {
      request.continue();
      return;
    }
    if (request.method() === "OPTIONS") {
      request.respond({
        status: 204,
        headers: {
          "access-control-allow-origin": new URL(base).origin,
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "POST, OPTIONS",
        },
      });
      return;
    }
    let body = request.postData();
    if (!body && request.hasPostData()) body = await request.fetchPostData();
    posts.push({
      method: request.method(),
      headers: request.headers(),
      body,
    });
    if (failNext) {
      failNext = false;
      request.respond({
        status: 500,
        headers: { "access-control-allow-origin": new URL(base).origin },
        body: "",
      });
      return;
    }
    request.respond({
      status: 200,
      headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
      body: JSON.stringify({ ok: true, id: "test" }),
    });
  });

  await mkdir(outDir, { recursive: true });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const interReady = await page.evaluate(() => document.fonts.check("700 60px Inter"));
  assert.equal(interReady, true, "Inter should be loaded");
  await shot(page, "intro-desktop.png");

  const title = await page.title();
  assert.equal(title, "What's My Home Worth? | Criterion Real Estate");
  const canonical = await page.$eval('link[rel="canonical"]', (node) => node.href);
  assert.equal(canonical, site.pageUrl.endsWith("/") ? site.pageUrl : `${site.pageUrl}/`);
  const ogImage = await page.$eval('meta[property="og:image"]', (node) => node.content);
  assert.ok(ogImage.endsWith("/home-worth-share.jpg"));
  const logoOk = await page.$eval(".logo", (img) => img.complete && img.naturalWidth === 1200);
  assert.equal(logoOk, true);
  const phone = await page.$eval(".phone", (node) => ({ href: node.href, text: node.textContent }));
  assert.equal(phone.href, "tel:+14758975114");
  assert.match(phone.text, /\(475\) 897-5114/);
  const footer = await page.$eval(".footer", (node) => node.innerText);
  assert.match(footer, /Equal Housing Opportunity/);
  assert.match(footer, /Criterion Real Estate LLC, licensed in CT & NY/);
  const bodyText = await page.evaluate(() => document.body.innerText);
  assert.equal(/daniel/i.test(bodyText), false);
  assert.equal(/stamford/i.test(bodyText), false);
  assert.equal(/made with lovable/i.test(bodyText), false);

  await page.click(".intro .pill");
  await page.waitForSelector(".card");
  assert.equal(await kicker(page), "1 of 11");
  await page.click(".back");
  await page.waitForSelector(".intro h1");

  await completeUntilConsent(page);
  await page.click(".back");
  await waitKicker(page, "10 of 11");
  await page.click(".back");
  await waitKicker(page, "9 of 11");
  await page.click(".back");
  await waitKicker(page, "8 of 11");
  await page.click(".back");
  await waitKicker(page, "7 of 11");
  const addressHint = await page.$eval(".enter-hint", (node) => getComputedStyle(node).display);
  assert.notEqual(addressHint, "none");
  await shot(page, "form-desktop.png");
  await page.click("#street", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.$eval("#form-error", (node) => node.textContent),
    "Please enter the street address.",
  );
  await page.type("#street", "123 Main Street");
  await page.keyboard.press("Enter");
  await waitKicker(page, "8 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "9 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "10 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "11 of 11");
  failNext = true;
  await page.click("#submit-btn");
  await page.waitForFunction(() => document.getElementById("form-error")?.textContent?.includes("couldn't send"));
  assert.equal(await kicker(page), "11 of 11");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  const thanks = await page.$eval(".thanks p", (node) => node.textContent);
  assert.equal(thanks, THANKS_TEXT);
  const bar = await page.$eval("#progress", (node) => node.style.width);
  assert.equal(bar, "100%");
  await shot(page, "thanks-desktop.png");

  const post = posts.at(-1);
  assert.ok(post, "expected an intercepted lead insert");
  assert.match(post.headers["content-type"], /^text\/plain/);
  assert.equal(post.headers.apikey, undefined);
  assert.equal(post.headers.authorization, undefined);
  const body = JSON.parse(post.body);
  assert.equal(body.address, "123 Main Street, Wilton, NY 06897");
  assert.equal(body.street, "123 Main Street");
  assert.equal(body.city, "Wilton");
  assert.equal(body.state, "NY");
  assert.equal(body.zip, "06897");
  assert.equal(body.phone, "(555) 555-0123");
  assert.equal(body.name, null);
  assert.equal(body.email, null);
  assert.equal(body.intent, "Sell");
  assert.equal(body.reason, "Downsizing");
  assert.equal(body.timeline, "3-6 months");
  assert.equal(body.owner_estimate, 450000);
  assert.equal(body.agent_priority, "Low pressure");
  assert.equal(body.sms_consent, false);
  assert.equal(body.notes.startsWith("Fresh paint"), true);
  assert.equal("source" in body, false);
  assert.equal(body.company_website, "");
  assert.deepEqual(Object.keys(body), [
    ...LEAD_FIELDS.filter((key) => !APPENDED_FIELDS.includes(key)),
    "page_url",
    "referrer",
    "user_agent",
    "company_website",
    ...APPENDED_FIELDS,
  ]);
  const beforeHide = posts.length;
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await sleep(200);
  assert.equal(posts.length, beforeHide, "a submitted lead is not sent again on leave");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  );
  await page.goto(`${base}/?src=paul-mailer`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await shot(page, "intro-mobile.png");
  const fits = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2);
  assert.equal(fits, true, "mobile intro should fit the viewport");
  await page.click(".intro .pill");
  await page.waitForSelector(".card");
  const progressNow = await page.$eval("#progress-track", (node) => node.getAttribute("aria-valuenow"));
  assert.notEqual(progressNow, "0");
  assert.equal(await page.$eval(".time-left", (node) => node.textContent), "About 60 seconds left");
  await shot(page, "quiz-1-intent-mobile.png");
  await page.click("[data-choice='Both']");
  await waitKicker(page, "2 of 11");
  await shot(page, "quiz-2-reason-mobile.png");
  await page.click("[data-choice='Relocating']");
  await waitKicker(page, "3 of 11");
  await shot(page, "quiz-3-timeline-mobile.png");
  await page.click("[data-choice='Not sure']");
  await waitKicker(page, "4 of 11");
  await shot(page, "quiz-4-estimate-mobile.png");
  await page.click(".actions .pill");
  await waitKicker(page, "5 of 11");
  await shot(page, "quiz-5-agent-mobile.png");
  const mobileKeys = await page.$eval(".key-hint-keys", (node) => getComputedStyle(node).display);
  assert.equal(mobileKeys, "none");
  await page.click("[data-choice='Communication']");
  await waitKicker(page, "6 of 11");
  await shot(page, "quiz-6-notes-mobile.png");
  await page.click(".actions .pill");
  await waitKicker(page, "7 of 11");
  const mobileHint = await page.$eval(".enter-hint", (node) => getComputedStyle(node).display);
  assert.equal(mobileHint, "none");
  await shot(page, "form-mobile.png");
  const mobileFont = await page.$eval("#street", (node) => parseFloat(getComputedStyle(node).fontSize));
  assert.ok(mobileFont >= 16, "mobile inputs stay at least 16px so iOS Safari does not zoom");
  const stateFont = await page.$eval("#state", (node) => parseFloat(getComputedStyle(node).fontSize));
  assert.ok(stateFont >= 16, "the state menu stays at least 16px so iOS Safari does not zoom");
  await fillAddress(page, { street: "10 Oak Avenue", city: "Ridgefield", state: "CT", zip: "06877" });
  await page.click(".actions .pill");
  await waitKicker(page, "8 of 11");
  await shot(page, "contact-name-mobile.png");
  await page.click(".actions .pill");
  await waitKicker(page, "9 of 11");
  await shot(page, "contact-phone-mobile.png");
  await page.type(".field-input", "2035550100");
  await page.click(".actions .pill");
  await waitKicker(page, "10 of 11");
  await shot(page, "contact-email-mobile.png");
  await page.click(".actions .pill");
  await waitKicker(page, "11 of 11");
  await shot(page, "contact-consent-mobile.png");
  await page.click(".consent input");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  await shot(page, "thanks-mobile.png");
  const mobilePost = JSON.parse(posts.at(-1).body);
  assert.equal(mobilePost.sms_consent, true);
  assert.equal(mobilePost.src, "paul-mailer");
  assert.equal(mobilePost.intent, "Both");
  assert.equal(mobilePost.reason, "Relocating");
  assert.equal(mobilePost.timeline, "Not sure");
  assert.equal(mobilePost.owner_estimate, null);
  assert.equal(mobilePost.agent_priority, "Communication");
  assert.equal(mobilePost.notes, null);
  assert.equal(mobilePost.address, "10 Oak Avenue, Ridgefield, CT 06877");
  assert.equal(mobilePost.street, "10 Oak Avenue");
  assert.equal(mobilePost.city, "Ridgefield");
  assert.equal(mobilePost.state, "CT");
  assert.equal(mobilePost.zip, "06877");

  await page.goto(`${base}/?src=paul-online`, { waitUntil: "networkidle0" });
  const postsBeforeLeave = posts.length;
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await sleep(200);
  assert.equal(posts.length, postsBeforeLeave, "leaving before contact does not post a lead");
  await page.click(".intro .pill");
  await waitKicker(page, "1 of 11");
  await page.click(".skip");
  await waitKicker(page, "2 of 11");
  await page.click(".skip");
  await waitKicker(page, "3 of 11");
  await page.click(".skip");
  await waitKicker(page, "4 of 11");
  await page.click(".actions .pill");
  await waitKicker(page, "5 of 11");
  await page.click(".skip");
  await waitKicker(page, "6 of 11");
  await page.click(".actions .pill");
  await waitKicker(page, "7 of 11");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await sleep(100);
  assert.equal(posts.length, postsBeforeLeave, "a cached page hide is not abandonment");
  await page.type("#street", "9 Pine Road");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#form-error", (node) => node.textContent), "Please enter the city or town.");
  await fillAddress(page, { street: "9 Pine Road", city: "Norwalk", zip: "06850" });
  await page.keyboard.press("Enter");
  await waitKicker(page, "8 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "9 of 11");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await sleep(200);
  assert.equal(posts.length, postsBeforeLeave, "address without a phone is not a lead");
  await page.type(".field-input", "2035550144");
  await page.keyboard.press("Enter");
  await waitKicker(page, "10 of 11");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await sleep(300);
  assert.equal(posts.length, postsBeforeLeave + 1, "leaving after address and phone posts the lead");
  const partial = JSON.parse(posts.at(-1).body);
  assert.equal(partial.src, "paul-online");
  assert.equal(partial.address, "9 Pine Road, Norwalk, CT 06850");
  assert.equal(partial.street, "9 Pine Road");
  assert.equal(partial.city, "Norwalk");
  assert.equal(partial.state, "CT");
  assert.equal(partial.zip, "06850");
  assert.equal(partial.phone, "2035550144");
  assert.equal(partial.intent, null);
  assert.equal(partial.reason, null);
  assert.equal(partial.timeline, null);
  assert.equal(partial.owner_estimate, null);
  assert.equal(partial.agent_priority, null);
  assert.equal(partial.email, null);
  assert.equal(partial.sms_consent, false);
  await page.type(".field-input", "ada@example.com");
  await page.keyboard.press("Enter");
  await waitKicker(page, "11 of 11");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  const finished = JSON.parse(posts.at(-1).body);
  assert.equal(finished.email, "ada@example.com");
  assert.equal(finished.address, "9 Pine Road, Norwalk, CT 06850");
  assert.equal(finished.street, "9 Pine Road");
  assert.equal(finished.zip, "06850");
  assert.equal(finished.src, "paul-online");

  const prefill = new URLSearchParams({
    name: "N".repeat(140),
    address: "123 Main Street, Unit 4, Wilton, CT 06897",
    utm_source: "mail",
    utm_medium: "qr",
    utm_campaign: "spring",
    utm_content: "card",
    utm_term: "worth",
    src: "s".repeat(240),
  });
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(`${base}/?${prefill}`, { waitUntil: "networkidle0" });
  await page.click(".intro .pill");
  await page.keyboard.press("d");
  await waitKicker(page, "2 of 11");
  await page.keyboard.press("c");
  await waitKicker(page, "3 of 11");
  await page.keyboard.press("b");
  await waitKicker(page, "4 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "5 of 11");
  await page.keyboard.press("a");
  await waitKicker(page, "6 of 11");
  await page.keyboard.press("Enter");
  await waitKicker(page, "7 of 11");
  await page.waitForSelector("#street");
  assert.equal(await page.$eval("#street", (node) => node.value), "123 Main Street, Unit 4");
  assert.equal(await page.$eval("#city", (node) => node.value), "Wilton");
  assert.equal(await page.$eval("#state", (node) => node.value), "CT");
  assert.equal(await page.$eval("#zip", (node) => node.value), "06897");
  await page.keyboard.press("Enter");
  await waitKicker(page, "8 of 11");
  const nameValue = await page.$eval(".field-input", (node) => node.value);
  assert.equal(nameValue.length, 100);
  await page.keyboard.press("Enter");
  await page.type(".field-input", "2035550199");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  const attributed = JSON.parse(posts.at(-1).body);
  assert.equal(attributed.name.length, 100);
  assert.equal(attributed.address, "123 Main Street, Unit 4, Wilton, CT 06897");
  assert.equal(attributed.street, "123 Main Street, Unit 4");
  assert.equal(attributed.city, "Wilton");
  assert.equal(attributed.state, "CT");
  assert.equal(attributed.zip, "06897");
  assert.equal(attributed.utm_source, "mail");
  assert.equal(attributed.utm_medium, "qr");
  assert.equal(attributed.utm_campaign, "spring");
  assert.equal(attributed.utm_content, "card");
  assert.equal(attributed.utm_term, "worth");
  assert.equal(attributed.src.length, 200);
  assert.equal(attributed.intent, "Just curious");
  assert.equal(attributed.reason, "Job or family move");
  assert.equal(attributed.timeline, "3-6 months");
  assert.equal(attributed.agent_priority, "Honest pricing");

  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  await browser.close();
  return posts.length;
}

checkLeadLogic();
const count = await runBrowser();
console.log(`ok: lead checks passed, ${count} intercepted posts, screenshots in ${outDir}`);
