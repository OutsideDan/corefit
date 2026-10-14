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
- Quick add: log a custom food by name + macros, with a calorie/macro typo warning (never blocks)
- Saved meals: save a meal slot's items under a name; one tap re-logs them to the selected slot and date

## Out of scope
- Other users, sharing, or the template's username + PIN login
- Weight trend charts (possible later; not built)
- Editing a saved meal (delete and re-save), portion picker on re-log (decided 2026-10-14)
- Server-side code

## Data model
| Path | Holds | Conflict behavior |
|---|---|---|
| `corefit/{uid}` | `profile` | last write wins (rarely edited) |
| `corefit/{uid}/items/{id}` | one logged food (`date`, `slot`, macros) | add/remove are independent, so devices never overwrite each other |
| `corefit/{uid}/days/{date}` | `water` | `increment()`, so concurrent changes add up |
| `corefit/{uid}/meals/{id}` | saved meal: `name`, `items[]` | add/delete only; re-log writes new `items` docs |

## Embedded test
| What could fail | Where it's caught | How |
|---|---|---|
| Collection renamed, rules stop matching | `scripts/pre-deploy.js` | fails unless `COREFIT_COLL = 'corefit'` |
| Legacy data overwritten | `scripts/pre-deploy.js` | fails on any `localStorage.setItem/removeItem/clear` |
| Import key drifts | `scripts/pre-deploy.js` | fails unless key is `DAN_COREFIT_PERMANENT_V2` |
| Evening logs land on tomorrow (UTC) | `scripts/pre-deploy.js` | fails on `toISOString().split(` |
| Food name injects HTML | `scripts/pre-deploy.js` | fails on unescaped `${f.name}` / `${it.name}` |
| Import drops entries | Import flow, at run time | reads back from the server and reports count mismatch; never deletes source |
| Quick add accepts bad input / typo warning wrong | `tests/quickadd.test.js` (run by pre-deploy) | 14 validation + warning cases |
| Saved meal loses items or re-logs to wrong date/slot | `tests/quickadd.test.js` | save/re-log round-trip cases |
| Meals stored outside `corefit/{uid}` | `scripts/pre-deploy.js` | fails unless `mealsRef = () => userRef().collection('meals')` |
| Another account reads data | Firestore rules | Rules Playground: other uid on `corefit/xyz` denied (verified 2026-10-14) |
