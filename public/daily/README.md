# Criterion Daily (static app)

The phone app for Criterion Real Estate's daily To Do, deals, approvals and leads, served by GitHub Pages at
https://criterion-marketing.github.io/home-value/daily/

This repo holds **code only**. No data, no keys, no tokens. Everything private lives in a private Google Sheet
behind an Apps Script web app; each phone signs in once with a one-time pairing code and gets its own revocable token.

- `config.js`: public settings (API URL, Firebase web config, Web Push public key). Safe to publish.
- `app-api.js`: talks to the Apps Script API; pairing; push notifications (Firebase Cloud Messaging).
- `sw.js`: service worker (shows notifications; opens the app on tap).
- `vendor/`: Firebase JS SDK 12.4.0 (self-hosted, unmodified apart from the import path).
- `stamp.sh`: run after any edit so open apps reload themselves.
