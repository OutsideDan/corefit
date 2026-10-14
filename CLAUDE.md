# CLAUDE.md — CoreFit

This repo follows the **personal-webapp-template** pattern. Read `intent.md` and the SOP at `workbench/wiki/reference/personal-webapp-deploy.md` (Dan's local workbench) before making changes.

## Stack
- Single-file static webapp, served from GitHub Pages (`main` branch root, no build step)
- Firestore: project `sendit-67c81` (shared across all personal apps)
- Auth: **Firebase Auth (Google sign-in)**, not the template's PIN login. Data lives at `corefit/{uid}/**`, which Firestore rules lock to `request.auth.uid`. See `intent.md` for the data model
- Constants are declared at the top of the inline `<script>` block in `index.html`

## Deploy
```
npm run check    # lint without deploying
npm run deploy   # lint + git push origin main
```

The `predeploy` hook runs `scripts/pre-deploy.js`. Failures block the push. Warnings don't.

## Embedded test rule
Every new feature requires a check in `scripts/pre-deploy.js` before merge. The check is part of the feature, not optional, not later.

## Behavior
- Read this file and `intent.md` before any task
- Keep responses concise — bullets over prose
- Before structural changes: present a plan, wait for approval
- Don't propose a solution before the real problem is understood
- Flag speculative complexity
