"""Minimal renderer for the .dc.html design mockups (no editor runtime needed).

Expands the template ({{holes}}, sc-for, sc-if) with each file's own Component.renderVals(),
so the page can be screenshotted or audited in headless Chromium.
"""
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]                      # docs/design/review/audit -> repo root
MOCKUPS = REPO / 'docs' / 'design' / 'mockups'
LOGO_WHITE = REPO / 'docs' / 'design' / 'assets' / 'pd-logo-white.png'
FONTS = HERE / 'fonts'                      # optional: drop the Google font files here for pixel-exact renders
LOGO_BLOB = '/_blob/a30cbbc821751d8b62862841bb3975f0'

SHIM = r"""
<style>
@font-face{font-family:'Space Grotesk';src:url('file://%(f)s/SpaceGrotesk[wght].ttf');font-weight:300 700}
@font-face{font-family:'Archivo';src:url('file://%(f)s/Archivo[wdth,wght].ttf');font-weight:100 900;font-stretch:62%% 125%%}
@font-face{font-family:'JetBrains Mono';src:url('file://%(f)s/JetBrainsMono[wght].ttf');font-weight:100 800}
</style>
<script>
class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(o){this.state=Object.assign({},this.state,typeof o==='function'?o(this.state):o)}forceUpdate(){}}
window.__render=function(preset){
  const root=document.querySelector('x-dc');
  const helmet=root.querySelector('helmet');
  if(helmet){[...helmet.children].forEach(c=>document.head.appendChild(c));helmet.remove();}
  const src=document.querySelector('script[data-dc-script]').textContent;
  const Component=new Function('DCLogic',src+';return Component;')(DCLogic);
  const c=new Component({});
  if(preset)c.state=Object.assign({},c.state,preset);
  const vals=c.renderVals();
  const look=(scope,p)=>{p=p.trim();if(p==='true')return true;if(p==='false')return false;if(/^-?\d+(\.\d+)?$/.test(p))return +p;
    return p.split('.').reduce((o,k)=>o==null?undefined:o[k],scope);};
  const HOLE=/\{\{\s*([^}]+?)\s*\}\}/g;
  const interp=(s,scope)=>s.replace(HOLE,(_,p)=>{const v=look(scope,p);return v==null?'':String(v)});
  function walk(node,scope){
    for(const ch of [...node.childNodes]){
      if(ch.nodeType===3){if(HOLE.test(ch.data)){HOLE.lastIndex=0;ch.data=interp(ch.data,scope);}HOLE.lastIndex=0;continue;}
      if(ch.nodeType!==1)continue;
      if(ch.tagName==='TEMPLATE'&&ch.dataset.sc){
        const frag=document.createDocumentFragment();
        if(ch.dataset.sc==='for'){
          const m=/^\{\{\s*(.+?)\s*\}\}$/.exec(ch.getAttribute('list'));const list=(m?look(scope,m[1]):[])||[];
          const as=ch.getAttribute('as')||'item';
          list.forEach((it,i)=>{const s=Object.assign({},scope,{[as]:it,$index:i});const cl=ch.content.cloneNode(true);const holder=document.createElement('div');holder.appendChild(cl);walk(holder,s);while(holder.firstChild)frag.appendChild(holder.firstChild);});
        }else{
          const m=/^\{\{\s*(.+?)\s*\}\}$/.exec(ch.getAttribute('value'));const v=m?look(scope,m[1]):false;
          if(v){const holder=document.createElement('div');holder.appendChild(ch.content.cloneNode(true));walk(holder,scope);while(holder.firstChild)frag.appendChild(holder.firstChild);}
        }
        ch.replaceWith(frag);continue;
      }
      for(const a of [...ch.attributes]){
        if(/^on/i.test(a.name)){ch.removeAttribute(a.name);continue;}
        if(!a.value.includes('{{'))continue;
        const whole=/^\{\{\s*(.+?)\s*\}\}$/.exec(a.value);
        if(whole){const v=look(scope,whole[1]);
          if(v===false||v==null||typeof v==='function')ch.removeAttribute(a.name);
          else if(v===true)ch.setAttribute(a.name,'');else ch.setAttribute(a.name,String(v));}
        else ch.setAttribute(a.name,interp(a.value,scope));
      }
      if(ch.tagName==='INPUT'&&ch.hasAttribute('checked'))ch.checked=true;
      walk(ch,scope);
    }
  }
  walk(root,vals);
};
</script>
""" % {'f': str(FONTS)}


def prep(src: str) -> str:
    s = src.replace('<script src="./support.js"></script>', SHIM).replace(LOGO_BLOB, LOGO_WHITE.as_uri())
    s = re.sub(r'<link[^>]+fonts\.googleapis\.com[^>]*>', '', s)
    s = re.sub(r'<sc-for\b', '<template data-sc="for"', s)
    s = re.sub(r'</sc-for>', '</template>', s)
    s = re.sub(r'<sc-if\b', '<template data-sc="if"', s)
    s = re.sub(r'</sc-if>', '</template>', s)
    return s


