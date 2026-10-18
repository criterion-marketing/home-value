/**
 * Public site settings. Change `pageUrl` when you deploy so the canonical
 * URL, Open Graph URL, and share image point at the live page.
 *
 * `leadEndpoint` is the public Google Apps Script web app URL (deployed as
 * dan@durantehomegroup.com, access "Anyone"). It only appends a row to the
 * "Web Submissions" tab of the Criterion Home Value Leads sheet. No secrets
 * belong in this file.
 */
export const site = {
  pageUrl: "https://criterion-marketing.github.io/home-value/",
  leadEndpoint: "https://script.google.com/macros/s/AKfycbwcpeKoRHzPK2Vbdo5vTW_G8iIvSOhKQIMi0RbnQAMwPJZ39it3tr9JBRPZMmQCGHdS/exec",
};

export const TITLE = "What's My Home Worth? | Criterion Real Estate";
export const DESCRIPTION =
  "Get a free, no-obligation market analysis of your home from Criterion Real Estate's local team, serving Connecticut and New York.";
