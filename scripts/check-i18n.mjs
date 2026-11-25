// Spanish parity check: every t("English", "Spanish") call in src must have a Spanish string that is not empty and,
// unless it is a name or code, not identical to the English. Usage: node scripts/check-i18n.mjs  (exit 1 on findings)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SAME_OK = /^(PermitDraft( Core)?|Core|English|Español|English y Español|OK|Total|Subtotal|No|Federal|Editor|Las Vegas, Nevada|PD-[\w-]+|[\d\s.,:·/%$#-]*|[A-Z0-9 ._·-]{1,6})$/;
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f)) files.push(p); } };
walk("src");

// A string literal: "...", '...' or `...` (template parts kept verbatim).
const STR = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\`(?:[^\`\\]|\\.)*\`)`;
const CALL = new RegExp(String.raw`(?<![\w.])t\(\s*` + STR + String.raw`\s*(?:,\s*` + STR + String.raw`)?\s*\)`, "g");
const unq = (s) => s.slice(1, -1).trim();

let bad = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(CALL)) {
    const en = unq(m[1]), es = m[2] === undefined ? null : unq(m[2]);
    const line = src.slice(0, m.index).split("\n").length;
    let why = null;
    if (es === null) why = "no Spanish";
    else if (es === "") why = "empty Spanish";
    else if (es === en && !SAME_OK.test(en)) why = "Spanish identical to English";
    if (why) { bad++; console.log(`${f}:${line}  ${why}: ${en.slice(0, 70)}`); }
  }
}
console.log(bad ? `\n${bad} finding(s).` : "Spanish parity OK.");
process.exit(bad ? 1 : 0);
