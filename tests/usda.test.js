// Unit tests for mapping a USDA FoodData Central search result to a CoreFit food.
// Branded foods report nutrients per 100 g/ml; CoreFit must scale to one serving.
// Run: node tests/usda.test.js (also run by pre-deploy)
import { load, runner } from './_load.js';

const { mapUSDAFood } = load(['function mapUSDAFood(']);
const { ok, done } = runner();
const nut = (o) => Object.entries(o).map(([id, value]) => ({ nutrientId: Number(id), value }));

// Real record: fdcId 2469024, Gatorade PROTEIN 30G SHAKE, CHOCOLATE (per 100 ml)
const gatorade = {
  description: 'PROTEIN 30G SHAKE, CHOCOLATE, CHOCOLATE', dataType: 'Branded', brandOwner: 'The Quaker Oats Co./gatorade-Van Camp',
  servingSize: 330, servingSizeUnit: 'ml', householdServingFullText: '1 Carton',
  foodNutrients: nut({ 1008: 55, 1003: 9.09, 1005: 3.33, 1004: 0.3, 1079: 0.6 })
};
let f = mapUSDAFood(gatorade);
ok(f.cal === 182 && f.pro === 30, `branded shake scaled to 330 ml carton: 182 kcal / 30 g protein (got ${f.cal} / ${f.pro})`);
ok(f.carb === 11 && f.fat === 1 && f.fib === 2, `carbs/fat/fiber scaled too (got ${f.carb}/${f.fat}/${f.fib})`);
ok(/1 Carton/.test(f.serving) && /330 ml/.test(f.serving), `serving label names the serving (got "${f.serving}")`);

// Real record: fdcId 2102157, Essential Everyday COTTAGE CHEESE, unit spelled "g", 0.5 cup = 113 g
f = mapUSDAFood({
  description: 'COTTAGE CHEESE', dataType: 'Branded', brandOwner: 'Supervalu, Inc.',
  servingSize: 113, servingSizeUnit: 'g', householdServingFullText: '0.5 cup',
  foodNutrients: nut({ 1008: 62, 1003: 10.6, 1005: 3.54, 1004: 0, 1079: 0 })
});
ok(f.cal === 70 && f.pro === 12 && f.carb === 4, `cottage cheese per 1/2 cup: 70 kcal / 12 g protein / 4 g carbs (got ${f.cal}/${f.pro}/${f.carb})`);

// USDA's alternate unit spellings
f = mapUSDAFood({ ...gatorade, servingSizeUnit: 'MLT' });
ok(f.cal === 182, 'unit "MLT" treated as ml');
f = mapUSDAFood({ ...gatorade, servingSize: 200, servingSizeUnit: 'GRM', householdServingFullText: '' });
ok(f.cal === 110 && /200 g/.test(f.serving), `unit "GRM" treated as g (got ${f.cal}, "${f.serving}")`);

// Generic USDA foods (SR Legacy / Foundation / Survey) have no serving: stay per 100 g, labeled
f = mapUSDAFood({ description: 'Beans, black, mature seeds, cooked', dataType: 'SR Legacy', foodNutrients: nut({ 1008: 132, 1003: 8.86, 1005: 23.7, 1004: 0.54, 1079: 8.7 }) });
ok(f.cal === 132 && f.pro === 9 && f.serving === '100 g', `generic food stays per 100 g and says so (got ${f.cal}, "${f.serving}")`);

// Unknown unit: don't guess a conversion, label as per 100
f = mapUSDAFood({ ...gatorade, servingSizeUnit: 'oz' });
ok(f.cal === 55 && /100/.test(f.serving), `unsupported unit stays per 100 and is labeled (got ${f.cal}, "${f.serving}")`);

// Robustness: missing values never produce NaN
f = mapUSDAFood({ description: 'X', dataType: 'Branded', servingSize: 50, servingSizeUnit: 'g', foodNutrients: [{ nutrientId: 1008 }, { nutrientId: 1003, value: null }] });
ok([f.cal, f.pro, f.carb, f.fat, f.fib].every(Number.isFinite), 'missing nutrient values become 0, not NaN');

// Energy reported only as Atwater kcal (2047/2048) on some Foundation foods
f = mapUSDAFood({ description: 'Y', dataType: 'Foundation', foodNutrients: nut({ 2047: 120, 1003: 5 }) });
ok(f.cal === 120, `falls back to energy nutrient 2047 when 1008 is absent (got ${f.cal})`);
done();
