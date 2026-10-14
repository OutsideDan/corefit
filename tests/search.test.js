// Unit tests for CoreFit's search helpers, run against the inline <script> in index.html.
// Run: node tests/search.test.js   (also run by scripts/pre-deploy.js)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const src  = [...html.matchAll(/<script(?!\s+src)[^>]*>([\s\S]+?)<\/script>/g)].pop()[1];

// Pull a top-level `const NAME = [...]` or `function name(...) {...}` out of the script by brace matching
function grab(start) {
  const i = src.indexOf(start);
  if (i === -1) throw new Error(`not found in index.html: ${start}`);
  const open = src.indexOf(start.startsWith('const') ? '[' : '{', i);
  const [o, c] = src[open] === '[' ? ['[', ']'] : ['{', '}'];
  let depth = 0;
  for (let k = open; k < src.length; k++) {
    if (src[k] === o) depth++;
    if (src[k] === c && --depth === 0) return src.slice(i, k + 1);
  }
}
const { STAPLES, searchStaples } = new Function(
  `${grab('const STAPLES =')}; ${grab('function searchStaples(')}; return { STAPLES, searchStaples };`
)();

let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failed++; };
const names = (q) => searchStaples(q).map(f => f.name);

ok(names('black beans').some(n => /black beans/i.test(n)), '"black beans" finds the black beans staple');
ok(names('BEAN').length >= 1, 'singular, any case: "BEAN" matches');
ok(names('tofu').length === 1, '"tofu" matches exactly one staple');
ok(names('fiber').length >= 1, 'matches on tag text ("fiber")');
ok(names('black pizza').length === 0, 'all words must match: "black pizza" finds nothing');
ok(names('   ').length === 0, 'blank query returns nothing');
ok(STAPLES.length === 11, 'staples list intact (11)');

process.exit(failed ? 1 : 0);
