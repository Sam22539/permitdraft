"""Contrast + minimum text-size audit of every mockup, using computed styles in Chrome."""
import json, pathlib, sys
sys.argv = ['x', '/tmp', '/dev/null']
exec(open('/home/claude/render/render.py').read().split('def main():')[0])  # reuse prep() and SHIM
from playwright.sync_api import sync_playwright

P = pathlib.Path('/home/claude/pd-design/project')
FILES = ['HomepageA', 'HomepageV2', 'OfficeSignIn', 'OfficeDashboard', 'OfficeReview', 'ContractorSign',
         'TechJobs', 'TechCapture', 'TechCamera', 'TechFix', 'TechQueued', 'TechSent', 'TechSync']
JS = r"""() => {
 const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const [r,g,b] = m.slice(0,3).map(v => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)}); return [0.2126*r+0.7152*g+0.0722*b, m.length>3? m[3]:1]; };
 const bgOf = el => { while (el) { const c = getComputedStyle(el).backgroundColor; const a = (c.match(/[\d.]+/g)||[]).map(Number); if (a.length===3 || (a.length===4 && a[3] > 0.6)) return c; el = el.parentElement; } return 'rgb(255,255,255)'; };
 const out = [];
 const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
 while (walker.nextNode()) { const t = walker.currentNode; const txt = t.data.trim(); if (!txt || txt.length < 2) continue;
   const el = t.parentElement; const cs = getComputedStyle(el); if (cs.visibility==='hidden' || cs.display==='none' || el.closest('[aria-hidden="true"]')) continue;
   const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
   const fg = cs.color; if (cs.webkitTextStroke && cs.webkitTextStrokeWidth !== '0px' && fg.includes('0)')) continue;
   const [lf] = lum(fg); const [lb] = lum(bgOf(el)); const ratio = (Math.max(lf,lb)+0.05)/(Math.min(lf,lb)+0.05);
   const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (bold && size >= 18.66);
   if (ratio < (large ? 3 : 4.5) || size < 12) out.push({ txt: txt.slice(0,40), size, ratio: Math.round(ratio*100)/100, fg, bg: bgOf(el) });
 }
 return out; }"""
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    for f in FILES:
        src = (P / (f + '.dc.html')).read_text(); t = pathlib.Path('/home/claude/render/tmp') / (f + '-audit.html'); t.write_text(prep(src))
        for w in ([1440, 390] if f.startswith(('Homepage', 'Office')) else [390]):
            pg = b.new_page(viewport={'width': w, 'height': 900}); pg.goto('file://' + str(t)); pg.evaluate('p => window.__render(p)', None); pg.wait_for_timeout(300)
            res[f'{f}@{w}'] = pg.evaluate(JS); pg.close()
    b.close()
bad = {k: v for k, v in res.items() if v}
print(json.dumps({k: len(v) for k, v in res.items()}))
for k, v in bad.items():
    print('\n##', k)
    for i in v[:12]: print(i)
