# Intent — CoreFit

## Outcomes
- CoreFit runs from one URL on phone and computer, with logs syncing in real time, and redeploys never lose data.
- Daily vegetarian macro tracking for general fitness, with visceral (stomach) fat loss as a sub-goal.

## Scope
- BMR/TDEE targets from a synced profile, 4 meal slots, water tracking, Visceral Fat Scorecard
- Vegetarian staples list plus live USDA FoodData Central search, and goal-closing suggestions
- Google sign-in (Firebase Auth); data at `corefit/{uid}` in the shared `sendit-67c81` Firestore project
- Offline logging via Firestore's local cache
- One-time import of pre-sync data (browser localStorage or a JSON backup file)

## Out of scope
- Other users, sharing, or the template's username + PIN login
- Weight trend charts, meal templates (possible later; not built)
- Server-side code

## Data model
| Path | Holds | Conflict behavior |
|---|---|---|
| `corefit/{uid}` | `profile` | last write wins (rarely edited) |
| `corefit/{uid}/items/{id}` | one logged food (`date`, `slot`, macros) | add/remove are independent, so devices never overwrite each other |
| `corefit/{uid}/days/{date}` | `water` | `increment()`, so concurrent changes add up |

## Embedded test
| What could fail | Where it's caught | How |
|---|---|---|
| Collection renamed, rules stop matching | `scripts/pre-deploy.js` | fails unless `COREFIT_COLL = 'corefit'` |
| Legacy data overwritten | `scripts/pre-deploy.js` | fails on any `localStorage.setItem/removeItem/clear` |
| Import key drifts | `scripts/pre-deploy.js` | fails unless key is `DAN_COREFIT_PERMANENT_V2` |
| Evening logs land on tomorrow (UTC) | `scripts/pre-deploy.js` | fails on `toISOString().split(` |
| Food name injects HTML | `scripts/pre-deploy.js` | fails on unescaped `${f.name}` / `${it.name}` |
| Import drops entries | Import flow, at run time | reads back from the server and reports count mismatch; never deletes source |
| Another account reads data | Firestore rules | Rules Playground: other uid on `corefit/xyz` denied (verified 2026-10-14) |
