import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import {
  ATTRIBUTION_KEYS,
  SMS_CONSENT_TEXT,
  THANKS_TEXT,
  buildLeadPayload,
  captureAttribution,
  validate,
} from "../src/lead.js";
import { site } from "../site.config.js";

const base = (process.argv[2] || "http://127.0.0.1:4321").replace(/\/$/, "");
const outDir = path.resolve("docs/screenshots");
const shots = process.argv.includes("--no-shots") ? false : true;

function checkLeadLogic() {
  assert.equal(validate("address", "  "), "Please enter the property address.");
  assert.equal(validate("address", "x".repeat(301)), "Address is too long.");
  assert.equal(validate("address", "123 Main Street"), null);
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
      address: " 123 Main ",
      phone: " 5555555555 ",
      email: "",
      timeline: "",
      notes: "  hello ",
    },
    false,
    utm,
  );
  assert.deepEqual(Object.keys(payload), [
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
  ]);
  assert.equal(payload.name, null);
  assert.equal(payload.address, "123 Main");
  assert.equal(payload.phone, "5555555555");
  assert.equal(payload.email, null);
  assert.equal(payload.timeline, null);
  assert.equal(payload.notes, "hello");
  assert.equal(payload.sms_consent, false);
  assert.equal("source" in payload, false);
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

async function completeUntilConsent(page) {
  await page.click(".intro .pill");
  await page.waitForSelector(".field-input");
  await page.type(".field-input", "123 Main Street, Town, State");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "2 of 7");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "3 of 7");
  await page.type(".field-input", "555");
  await page.click(".actions .pill");
  const phoneError = await page.$eval("#form-error", (node) => node.textContent);
  assert.equal(phoneError, "Please enter a valid phone number.");
  await page.click(".field-input", { clickCount: 3 });
  await page.type(".field-input", "(555) 555-0123");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "4 of 7");
  await page.type(".field-input", "not-an-email");
  await page.keyboard.press("Enter");
  const emailError = await page.$eval("#form-error", (node) => node.textContent);
  assert.equal(emailError, "Please enter a valid email, or leave it blank.");
  await page.click(".field-input", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "5 of 7");
  await page.keyboard.press("3");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "6 of 7");
  await page.type(".field-input", "Fresh paint");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Shift");
  assert.equal(await kicker(page), "6 of 7");
  const notes = await page.$eval(".field-input", (node) => node.value);
  assert.ok(notes.includes("\n"), "Shift+Enter should insert a newline");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "7 of 7");
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
  page.on("request", (request) => {
    const url = request.url();
    if (!url.includes("/rest/v1/leads")) {
      request.continue();
      return;
    }
    if (request.method() === "OPTIONS") {
      request.respond({
        status: 204,
        headers: {
          "access-control-allow-origin": new URL(base).origin,
          "access-control-allow-headers": "apikey,content-type,prefer,accept",
          "access-control-allow-methods": "POST, OPTIONS",
        },
      });
      return;
    }
    posts.push({
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
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
      status: 201,
      headers: { "access-control-allow-origin": new URL(base).origin },
      body: "",
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
  assert.equal(await kicker(page), "1 of 7");
  const enterHint = await page.$eval(".enter-hint", (node) => getComputedStyle(node).display);
  assert.notEqual(enterHint, "none");
  await shot(page, "form-desktop.png");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.$eval("#form-error", (node) => node.textContent),
    "Please enter the property address.",
  );
  await page.click(".back");
  await page.waitForSelector(".intro h1");

  await completeUntilConsent(page);
  failNext = true;
  await page.click("#submit-btn");
  await page.waitForFunction(() => document.getElementById("form-error")?.textContent?.includes("couldn't send"));
  assert.equal(await kicker(page), "7 of 7");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  const thanks = await page.$eval(".thanks p", (node) => node.textContent);
  assert.equal(thanks, THANKS_TEXT);
  const bar = await page.$eval("#progress", (node) => node.style.width);
  assert.equal(bar, "100%");
  await shot(page, "thanks-desktop.png");

  const post = posts.at(-1);
  assert.ok(post, "expected an intercepted lead insert");
  assert.equal(post.headers.prefer, "return=minimal");
  assert.equal(post.headers.apikey, site.supabaseKey);
  assert.equal(post.headers.authorization, undefined);
  const body = JSON.parse(post.body);
  assert.equal(body.address, "123 Main Street, Town, State");
  assert.equal(body.phone, "(555) 555-0123");
  assert.equal(body.name, null);
  assert.equal(body.email, null);
  assert.equal(body.timeline, "3-6 months");
  assert.equal(body.sms_consent, false);
  assert.equal(body.notes.startsWith("Fresh paint"), true);
  assert.equal("source" in body, false);

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await shot(page, "intro-mobile.png");
  const fits = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2);
  assert.equal(fits, true, "mobile intro should fit the viewport");
  await page.click(".intro .pill");
  await page.waitForSelector(".card");
  const mobileHint = await page.$eval(".enter-hint", (node) => getComputedStyle(node).display);
  assert.equal(mobileHint, "none");
  await shot(page, "form-mobile.png");
  await page.type(".field-input", "10 Oak Avenue");
  await page.click(".actions .pill");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "2 of 7");
  await page.click(".actions .pill");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "3 of 7");
  await page.type(".field-input", "2035550100");
  await page.click(".actions .pill");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "4 of 7");
  await page.click(".actions .pill");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "5 of 7");
  await page.click("[data-timeline='Just curious']");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "6 of 7");
  await page.click(".actions .pill");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "7 of 7");
  await page.click(".consent input");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  await shot(page, "thanks-mobile.png");
  const mobilePost = JSON.parse(posts.at(-1).body);
  assert.equal(mobilePost.sms_consent, true);
  assert.equal(mobilePost.timeline, "Just curious");
  assert.equal(mobilePost.address, "10 Oak Avenue");

  const prefill = new URLSearchParams({
    name: "N".repeat(140),
    address: "A".repeat(340),
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
  await page.waitForSelector(".field-input");
  const addressValue = await page.$eval(".field-input", (node) => node.value);
  assert.equal(addressValue.length, 300);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "2 of 7");
  const nameValue = await page.$eval(".field-input", (node) => node.value);
  assert.equal(nameValue.length, 100);
  await page.keyboard.press("Enter");
  await page.type(".field-input", "2035550199");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.press("b");
  await page.waitForFunction(() => document.querySelector(".step-kicker")?.textContent === "6 of 7");
  await page.keyboard.press("Enter");
  await page.click("#submit-btn");
  await page.waitForSelector(".thanks");
  const attributed = JSON.parse(posts.at(-1).body);
  assert.equal(attributed.name.length, 100);
  assert.equal(attributed.address.length, 300);
  assert.equal(attributed.utm_source, "mail");
  assert.equal(attributed.utm_medium, "qr");
  assert.equal(attributed.utm_campaign, "spring");
  assert.equal(attributed.utm_content, "card");
  assert.equal(attributed.utm_term, "worth");
  assert.equal(attributed.src.length, 200);
  assert.equal(attributed.timeline, "0-3 months");

  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  await browser.close();
  return posts.length;
}

checkLeadLogic();
const count = await runBrowser();
console.log(`ok: lead checks passed, ${count} intercepted posts, screenshots in ${outDir}`);
