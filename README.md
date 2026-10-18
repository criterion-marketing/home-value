# What's My Home Worth?

Static lead page for Criterion Real Estate LLC, licensed in Connecticut and New York. A visitor answers one question at a time and the page inserts a single row into the existing `public.leads` table. There is no account system, no analytics, and no tracker.

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

## Configure the page URL and Supabase

All public settings live in [`site.config.js`](site.config.js):

| Setting | Purpose |
| --- | --- |
| `pageUrl` | Canonical URL, `og:url`, and the absolute share-image URL. Set this to the deployed page, with a trailing slash, then rebuild. |
| `supabaseUrl` | Lovable Cloud / Supabase project URL. The form posts to `{supabaseUrl}/rest/v1/leads`. |
| `supabaseKey` | Public publishable key. Sent as the `apikey` header. It is not a service-role key. |

The key is the same publishable key already shipped in the previous frontend. Anonymous clients may insert a lead and cannot read the table, so the request uses `Prefer: return=minimal` and does not ask for the new row.

The insert body is exactly these columns:

`name`, `address`, `phone`, `email`, `timeline`, `notes`, `sms_consent`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`

`source` is not sent. The database fills that column itself. `utm_*` and `src` are copied from the page URL, each trimmed to 200 characters, and stored as null when absent. `?name=` and `?address=` prefill those answers.

Do not change the column list. A scheduled routine reads this table.

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

No environment variables are required. The publishable key is intentionally public and is limited by row-level security to inserts.

## What's on the page

The header carries the Criterion wordmark and the phone link `(475) 897-5114`. The footer is the Equal Housing Opportunity mark and “Criterion Real Estate LLC, licensed in CT & NY”. The form asks for address, name, phone, email, selling timeline, notes, and SMS consent, then shows a thank-you state. Address and phone are required. Name, email, timeline, notes, and the SMS checkbox are optional.
