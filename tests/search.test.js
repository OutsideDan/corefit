// Unit tests for CoreFit's search helpers. Run: node tests/search.test.js (also run by pre-deploy)
import { load, runner } from './_load.js';

const { STAPLES, searchStaples } = load(['const STAPLES =', 'function matchFoods(', 'function searchStaples(']);
const { ok, done } = runner();
const names = (q) => searchStaples(q).map(f => f.name);

ok(names('black beans').some(n => /black beans/i.test(n)), '"black beans" finds the black beans staple');
ok(names('BEAN').length >= 1, 'singular, any case: "BEAN" matches');
ok(names('tofu').length === 1, '"tofu" matches exactly one staple');
ok(names('fiber').length >= 1, 'matches on tag text ("fiber")');
ok(names('black pizza').length === 0, 'all words must match: "black pizza" finds nothing');
ok(names('   ').length === 0, 'blank query returns nothing');
ok(STAPLES.length === 11, 'staples list intact (11)');
done();
