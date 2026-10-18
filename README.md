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

The body carries these fields:

`name`, `address`, `phone`, `email`, `timeline`, `notes`, `sms_consent`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `page_url`, `referrer`, `user_agent`, `company_website` (hidden spam trap; must be empty)

`utm_*` and `src` are copied from the page URL, each trimmed to 200 characters, and sent as null when absent. `?name=` and `?address=` prefill those answers. The script fills `Source` with "thanks.io QR".

Do not rename the sheet columns. A scheduled routine reads the Web Submissions tab.

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

The header carries the Criterion wordmark and the phone link `(475) 897-5114`. The footer is the Equal Housing Opportunity mark and “Criterion Real Estate LLC, licensed in CT & NY”. The form asks for address, name, phone, email, selling timeline, notes, and SMS consent, then shows a thank-you state. Address and phone are required. Name, email, timeline, notes, and the SMS checkbox are optional.
