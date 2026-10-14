# personal-webapp-template

Template for Dan's personal single-file webapps. Hosted on GitHub Pages, backed by the shared `sendit-67c81` Firestore project for username + PIN auth.

## Use this template

1. Click **Use this template** on the GitHub repo page → create a new repo under `OutsideDan/<RepoName>`.
2. Clone locally:
   ```
   git clone git@github.com:OutsideDan/<RepoName>.git
   cd <RepoName>
   npm install
   ```
3. Edit `package.json` → change `name` and `description`.
4. Edit `manifest.json` → change `name`, `short_name`, theme/background colors.
5. Replace `icon-source.svg` with your app's glyph, then:
   ```
   npm run icons
   ```
6. Edit `intent.md` (what is this app? what's in / out of scope?).
7. Build the app inside `<main id="app">` in `index.html`. Login screen and Firestore wiring are already in place.
8. Deploy:
   ```
   npm run deploy
   ```
9. **Enable GitHub Pages** (one-time, in browser): repo Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save. Live within ~30s at `https://outsidedan.github.io/<RepoName>/`.
10. Add the new app to the inventory in `workbench/wiki/reference/personal-webapp-deploy.md`.

## What's in the box

| File | Purpose |
|---|---|
| `index.html` | Starter app: login screen wired to `sendit-67c81`, empty `<main>` placeholder |
| `manifest.json` | Web app manifest for "Add to Home Screen" |
| `icon-source.svg` | Source glyph; `npm run icons` generates the PNG set |
| `scripts/pre-deploy.js` | Lint that runs on every push (a11y, file size, manifest, console.log, etc.) |
| `scripts/make-icons.js` | SVG → PNG favicon/icon generator (uses `sharp`) |
| `.github/workflows/checks.yml` | CI: re-runs the lint on every push to `main` |
| `DEPLOY_LOG.md` | Auto-updated by `pre-deploy.js` with each deploy's commit + files |

## Stack constants

Declared at the top of the inline `<script>` block in `index.html`. Easy to grep, easy to override per app.

```js
const FIREBASE_PROJECT = 'sendit-67c81';
const ACCOUNTS_COLL    = 'accounts';
```

## Auth contract

- User doc lives at `accounts/{lowercased-username}`
- Doc has at minimum `{ pinHash: string, createdAt: ISO8601 }`
- App-specific fields go on the same doc (e.g. `pullupProfile` for Apex)
- App-specific subcollections live under it (e.g. `accounts/{user}/pullups`)

## Authority

The canonical SOP for this pattern lives in Dan's local workbench:
`workbench/wiki/reference/personal-webapp-deploy.md`
