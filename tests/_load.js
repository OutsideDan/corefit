// Loads named top-level declarations from the inline <script> in index.html so
// unit tests run against the shipped code, not a copy.
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const src  = [...html.matchAll(/<script(?!\s+src)[^>]*>([\s\S]+?)<\/script>/g)].pop()[1];

// Brace-match a `const NAME = [...]` or `function name(...) {...}`
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

export function load(decls) {
  const names = decls.map(d => d.match(/^(?:const|function)\s+(\w+)/)[1]);
  return new Function(`${decls.map(grab).join(';\n')}; return { ${names.join(', ')} };`)();
}

export function runner() {
  let failed = 0;
  const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failed++; };
  const done = () => process.exit(failed ? 1 : 0);
  return { ok, done };
}
