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
- My Foods: Quick add saves the food by default (name, serving, macros); My Foods show first in search and in suggestions, log at 0.5x to 2x, and can be edited or deleted without changing past entries
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
| `corefit/{uid}/foods/{id}` | My Food: `name`, `serving`, macros | last write wins; logged items are copies, so edits never change history |
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
| USDA branded food under-counted (per-100 values shown as per serving) | `tests/usda.test.js` (run by pre-deploy) | real Gatorade + cottage cheese records must scale to 182 kcal/30 g and 70 kcal/12 g |
| My Foods saved wrong, search order wrong, portion math wrong, edit changes history | `tests/myfoods.test.js` (run by pre-deploy) | 17 cases incl. 2x Nurri = 300 kcal / 60 g |
| My Foods stored outside `corefit/{uid}` | `scripts/pre-deploy.js` | fails unless `foodsRef = () => userRef().collection('foods')` |
| Another account reads data | Firestore rules | Rules Playground: other uid on `corefit/xyz` denied (verified 2026-10-14) |
