// Unit tests for My Foods. Run: node tests/myfoods.test.js (also run by pre-deploy)
import { load, runner } from './_load.js';

const { STAPLES, buildFood, localMatches, scaleFood, findDuplicateFood, suggestionPool } = load([
  'const STAPLES =', 'function validateQuickAdd(', 'function matchFoods(', 'function buildFood(',
  'function localMatches(', 'function scaleFood(', 'function findDuplicateFood(', 'function suggestionPool('
]);
const { ok, done } = runner();

const nurri = { id: 'n1', name: 'Nurri 30g Protein Shake, Chocolate', serving: '1 bottle (11 fl oz)', cal: 150, pro: 30, carb: 3, fat: 3, fib: 0 };
const bowl  = { id: 'b1', name: 'Spinach Bean Bowl', serving: '1 bowl', cal: 809, pro: 34, carb: 120, fat: 26, fib: 40 };
const mine  = [nurri, bowl];

// ── Creating a food (reuses Quick add validation) ──
let r = buildFood({ name: ' Nurri shake ', serving: ' 1 bottle (11 fl oz) ', cal: '150', pro: '30', carb: '3', fat: '2.5', fib: '0' });
ok(r.ok && r.food.name === 'Nurri shake' && r.food.serving === '1 bottle (11 fl oz)' && r.food.cal === 150, 'builds a food with trimmed name and serving');
ok(buildFood({ name: 'X', serving: '', cal: '10' }).food.serving === '1 serving', 'blank serving defaults to "1 serving"');
ok(!buildFood({ name: '', cal: '10' }).ok, 'blank name refused (same rules as Quick add)');
ok(!buildFood({ name: 'X', cal: '-1' }).ok, 'negative calories refused');
ok(!!buildFood({ name: 'Beans', cal: '3850', pro: '24', carb: '70', fat: '2' }).warning, 'typo warning carried through');

// ── Search: My Foods first, then staples ──
let hits = localMatches('nurri', mine, STAPLES);
ok(hits.length === 1 && hits[0].id === 'n1' && hits[0].brand === 'My Food', '"nurri" finds the saved shake, badged My Food');
hits = localMatches('bean', mine, STAPLES);
ok(hits[0].id === 'b1' && hits.slice(1).some(h => /Black Beans/.test(h.name)), '"bean": my bowl listed before the black beans staple');
ok(localMatches('protein shake', mine, STAPLES)[0].id === 'n1', 'my food outranks the whey staple for "protein shake"');
ok(localMatches('zzz', mine, STAPLES).length === 0, 'no match returns nothing');

// ── Portion scaling ──
let s = scaleFood(nurri, 2);
ok(s.cal === 300 && s.pro === 60 && s.name === 'Nurri 30g Protein Shake, Chocolate (2x)', '2x Nurri logs 300 kcal / 60 g protein');
s = scaleFood(nurri, 1);
ok(s.cal === 150 && s.name === nurri.name, '1x keeps the plain name');
ok(scaleFood({ name: 'X', cal: 'bad', pro: undefined }, 1.5).cal === 0, 'bad numbers scale to 0, not NaN');

// ── Editing a food never changes what was already logged ──
const food = { ...nurri };
const logged = scaleFood(food, 1);
food.cal = 999;
ok(logged.cal === 150, 'logged entry is a copy: editing the food later leaves it at 150');

// ── Duplicate names ──
ok(findDuplicateFood('  nurri 30g protein shake, CHOCOLATE ', mine)?.id === 'n1', 'duplicate check ignores case and spaces');
ok(findDuplicateFood('Nurri Vanilla', mine) === null, 'different name is not a duplicate');

// ── Suggestions include my foods ──
const pool = suggestionPool(mine, STAPLES);
ok(pool.length === STAPLES.length + 2 && pool[0].tag === 'My Food', 'pool = my foods (tagged My Food) + staples');
ok(suggestionPool([{ ...nurri, name: 'Avocado (Medium Half)' }], STAPLES).filter(f => f.name === 'Avocado (Medium Half)').length === 1, 'my food replaces a staple with the same name');
done();
