// Unit tests for Quick add validation and Saved meals. Run: node tests/quickadd.test.js (also run by pre-deploy)
import { load, runner } from './_load.js';

const { validateQuickAdd, mealFromItems, itemsFromMeal } =
  load(['function validateQuickAdd(', 'function mealFromItems(', 'function itemsFromMeal(']);
const { ok, done } = runner();
const qa = (o) => validateQuickAdd({ name: '', cal: '', pro: '', carb: '', fat: '', fib: '', ...o });

// ── Quick add validation ──
let r = qa({ name: 'Bean bowl', cal: '809' });
ok(r.ok && r.item.cal === 809 && r.item.pro === 0 && r.item.fib === 0, 'name + calories only: logs, blank macros count as 0');
ok(!qa({ cal: '100' }).ok, 'blank name refused');
ok(!qa({ name: '   ', cal: '100' }).ok, 'whitespace-only name refused');
ok(!qa({ name: 'X' }).ok, 'blank calories refused');
ok(!qa({ name: 'X', cal: 'abc' }).ok, 'non-numeric calories refused');
ok(!qa({ name: 'X', cal: '100', pro: '-5' }).ok, 'negative protein refused');
ok(qa({ name: 'X', cal: '100', fat: 'lots' }).error?.length > 0, 'refusal carries a message');
r = qa({ name: '  Bean bowl  ', cal: '809.4', pro: '34', carb: '120', fat: '26', fib: '40' });
ok(r.ok && r.item.name === 'Bean bowl' && r.item.cal === 809, 'trims name, rounds numbers');

// ── Calorie / macro mismatch warning (never blocks) ──
ok(!r.warning, 'matching macros (809 vs 850 est.): no warning');
r = qa({ name: 'Beans', cal: '3850', pro: '24', carb: '70', fat: '2' });
ok(r.ok && /calorie/i.test(r.warning || ''), '3850 typed for ~385: warns but still logs');
r = qa({ name: 'Salsa', cal: '40', pro: '1', carb: '8', fat: '0' });
ok(r.ok && !r.warning, 'small food (40 vs 36 est.): no warning');
r = qa({ name: 'Gum', cal: '10', pro: '0', carb: '0', fat: '0' });
ok(r.ok && !r.warning, 'no macros entered: no warning');
r = qa({ name: 'Snack', cal: '40', pro: '0', carb: '20', fat: '0' });
ok(r.ok && !r.warning, 'over 25% but under 50 kcal gap (40 vs 80) stays quiet');
r = qa({ name: 'Snack', cal: '20', pro: '0', carb: '20', fat: '0' });
ok(r.ok && !!r.warning, 'over 25% and over 50 kcal gap (20 vs 80) warns');

// ── Saved meals ──
const lunch = [
  { id: 'a', date: '2026-10-14', slot: 'Lunch', name: 'Black beans', cal: 385, pro: 24, carb: 70, fat: 2, fib: 24, createdAt: 1, imported: true },
  { id: 'b', date: '2026-10-14', slot: 'Lunch', name: 'Avocado',     cal: 240, pro: 3,  carb: 13, fat: 22, fib: 10, createdAt: 2 }
];
let m = mealFromItems('  Bean bowl ', lunch);
ok(m.ok && m.meal.name === 'Bean bowl' && m.meal.items.length === 2, 'save: trims name, keeps every item');
ok(m.ok && !('id' in m.meal.items[0]) && !('date' in m.meal.items[0]) && !('imported' in m.meal.items[0]), 'save: strips id/date/slot/imported');
ok(!mealFromItems('Empty', []).ok, 'save: empty slot refused');
ok(!mealFromItems('  ', lunch).ok, 'save: blank name refused');

const relog = itemsFromMeal(m.meal, '2026-10-15', 'Dinner', 1000);
ok(relog.length === 2 && relog.every(i => i.date === '2026-10-15' && i.slot === 'Dinner'), 're-log: uses the given date and slot');
ok(relog[0].name === 'Black beans' && relog[1].cal === 240 && relog[1].fib === 10, 're-log: names and macros identical');
ok(relog[0].createdAt < relog[1].createdAt, 're-log: keeps item order');
ok(itemsFromMeal(m.meal, '2026-10-15', 'Dinner', 2000).length === 2, 're-log twice: each call yields a full set (no dedupe)');
done();
