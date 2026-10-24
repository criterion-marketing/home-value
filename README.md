# What's My Home Worth?

Static lead page for Criterion Real Estate LLC, licensed in Connecticut and New York. A visitor answers one question at a time and the page posts the answers to a Google Apps Script web app, which appends one row to the **Web Submissions** tab of the *Criterion Home Value Leads* Google Sheet (owned by dan@durantehomegroup.com). There is no account system, no analytics, and no tracker.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on [http://127.0.0.1:4321](http://127.0.0.1:4321).

Production output:

```bash
npm run build
npm run preview
```

`npm run build` writes `dist/`. The Vite `base` is `/home-value/`, so asset URLs resolve on GitHub Pages at `https://criterion-marketing.github.io/home-value/`.

## Configure the page URL and lead endpoint

All public settings live in [`site.config.js`](site.config.js):

| Setting | Purpose |
| --- | --- |
| `pageUrl` | Canonical URL, `og:url`, and the absolute share-image URL. Set this to the deployed page, with a trailing slash, then rebuild. |
| `leadEndpoint` | The Apps Script web app `/exec` URL (deployed as dan@durantehomegroup.com, access "Anyone"). |

The form sends one `POST` with `Content-Type: text/plain` and a JSON body, so browsers send no CORS preflight. The script returns `{"ok":true}`. If the response can't be read, the page retries once with `mode: "no-cors"`, and the script drops repeats within 2 minutes.

The body carries these fields, in this order:

`name`, `address`, `phone`, `email`, `timeline`, `notes`, `sms_consent`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `page_url`, `referrer`, `user_agent`, `company_website` (hidden spam trap; must be empty), `intent`, `reason`, `owner_estimate`, `agent_priority`, `street`, `city`, `state`, `zip`

`address` is the full line, `street, city, ST ZIP`, so existing columns keep working. `street`, `city`, `state`, and `zip` are appended after the quiz keys. The quiz keys and these address parts are last so a script that writes values by position does not shift the existing columns.

`utm_*` and `src` are copied from the page URL (`?src=paul-mailer`, `?src=paul-online`, and the other `src` values), each trimmed to 200 characters, and sent as null when absent. `?name=` and `?address=` prefill those answers. The script fills `Source` with "thanks.io QR".

Do not rename or reorder the existing sheet columns. A scheduled routine reads the Web Submissions tab. On the request, these keys follow `company_website`, in order: `intent`, `reason`, `owner_estimate`, `agent_priority`, `street`, `city`, `state`, `zip`. On the sheet, append matching columns after the last existing column.

| Field | Values |
| --- | --- |
| `intent` | `Sell`, `Buy`, `Both`, `Just curious`, or null |
| `reason` | `Downsizing`, `Need more space`, `Job or family move`, `Cashing out equity`, `Relocating`, `Other`, or null |
| `timeline` | `0-3 months`, `3-6 months`, `6-12 months`, `12+ months`, `Not sure`, or null. This column already exists. `Just curious` is no longer a timeline; it is an `intent`. |
| `owner_estimate` | Whole-dollar number (commas and a leading `$` are accepted in the form), or null |
| `agent_priority` | `Honest pricing`, `Marketing reach`, `Local expertise`, `Communication`, `Low pressure`, `Other`, or null |
| `street` | Street address, or null |
| `city` | City or town, or null |
| `state` | Two-letter state, default `CT` on the form, or null |
| `zip` | Five-digit ZIP, or ZIP+4, or null |
| `notes` | Free text, or null. This column already exists. |

### Apps Script change outside this repo

The web app behind `leadEndpoint` has to write the new keys into the **Web Submissions** tab. Append these header cells after the existing columns, in this order: `intent`, `reason`, `owner_estimate`, `agent_priority`, `street`, `city`, `state`, `zip`. In the row builder, copy those JSON properties into the new cells. Do not insert them ahead of existing columns. Keep writing the combined line to the existing `address` column.

Until that script is redeployed, the page still posts the new keys, and the current script will keep logging the original columns only if it copies a fixed list of fields. Quiz answers will not appear on the sheet until the script is updated. No email or text is sent from the page; follow-up stays human-approved.

If a visitor enters a valid address and phone and then leaves before tapping submit, the page sends the same payload once with `navigator.sendBeacon` (falling back to `fetch` keepalive). The script's existing two-minute repeat drop still applies to that request.

## Deploy

### GitHub Pages

1. Set `pageUrl` in `site.config.js` to the Pages URL (for example `https://<user>.github.io/<repo>/`) and rebuild.
2. In the repo settings, open Pages and set the source to **GitHub Actions**.
3. Push to `main`. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds `dist/` and deploys it.

To publish by hand, run `npm run build` and upload the contents of `dist/`. Keep `dist/.nojekyll` so Pages serves every file.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Set `pageUrl` to the Netlify site URL before building.

### Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Set `pageUrl` to the Vercel URL before building.

No environment variables are required. The page holds no secrets; the endpoint can only append rows.

## What's on the page

The header carries the Criterion wordmark. The opening screen states “Takes about 60 seconds” above Get started. The footer is the Equal Housing Opportunity mark and “Criterion Real Estate LLC, licensed in CT & NY”. The office phone number is not shown on this page or on the report-link page.

The form is one question per screen, with a progress bar and a quiet “About N seconds left” note that counts down. Six short questions come first (intent, reason for moving, timeline, optional home-value guess, what matters in an agent, optional notes). Choice questions advance on tap and can be skipped. The guess and the notes can be left blank. Then the page asks for a full property address (street, city or town, state defaulting to CT, and ZIP), name, phone, email, and SMS consent. Street, city, ZIP, and phone are required. Name, email, the quiz answers, and the SMS checkbox are optional. A thank-you state follows a successful submit. Leaving after a valid address and phone still posts the lead.
