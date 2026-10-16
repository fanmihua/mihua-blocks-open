/*
 * 第 05 篇的交互。小检查照 audit/README.md 的量法（简化）；部件照五个套件的部件地图（data/kits.js）。
 * 299 项清单来自最近一次完整检查的报告（data/audit.js）。取舍那一部分挪到附录 C 了（apx.js）。
 */
(function () {
  const C = window.MhColor, MH = window.MH, K = window.MH_KITS, A = window.MH_AUDIT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ORDER = ['antd', 'element', 'shadcn', 'arco', 'tdesign'];
  const KIT = Object.fromEntries(K.kits.map((k) => [k.id, k]));
  const FW = { react: 'React', vue: 'Vue' };
  const part = (id, key) => { const p = KIT[id].parts[key]; return typeof p === 'string' ? p : p && p.selector; };
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const r1 = (n) => Math.round(n * 10) / 10;
  const settle = (doc) => { try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {} };

  // ── 开头：加深看
  MH.seg('shade', (v) => $('#shade').classList.toggle('boost', v === 'boost'));

  // ── 5.1 小检查
  const col = (css) => {
    if (!css) return 'none';
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      const a = p.length > 3 ? p[3] : 1;
      if (a === 0) return 'none';
      const hex = C.rgbToHex(p.slice(0, 3));
      return a < 1 ? `${hex} ${Math.round(a * 100)}%` : hex;
    }
    return C.cssToHex(css) || 'none';
  };
  const shadows = (s) => (!s || s === 'none' ? [] : s.split(/,(?![^(]*\))/).map((x) => x.trim()));
  const PARTS = [['field', '输入框'], ['button', '按钮'], ['checkbox', '复选框'], ['switch', '开关']];
  function measure(doc, el, opt) {
    const w = doc.defaultView, cs = w.getComputedStyle(el), r = el.getBoundingClientRect();
    const v = { 宽: r1(r.width), 高: r1(r.height), 底色: col(cs.backgroundColor) };
    const bw = parseFloat(cs.borderTopWidth), bc = col(cs.borderTopColor);
    let border = 'none';
    if (bw > 0 && bc !== 'none' && bc !== v.底色) border = `${bw}px ${bc}`;
    else {
      // 1px 内阴影也算边线（Element Plus 这样画边框）
      const ins = shadows(cs.boxShadow).find((s) => /inset/.test(s) && /0px 0px 0px 1px/.test(s));
      const c = ins && col((ins.match(/rgba?\([^)]+\)/) || [])[0]);
      if (c && c !== 'none') border = `1px ${c}`;
    }
    v.边线 = border;
    const raw = cs.borderTopLeftRadius;
    const px = raw.endsWith('%') ? (parseFloat(raw) / 100) * r.width : parseFloat(raw) || 0;
    v.圆角 = opt.round ? r1(Math.min(px, Math.min(r.width, r.height) / 2)) : raw;
    if (opt.shadow) {
      const sh = shadows(cs.boxShadow).filter((s) => !/inset/.test(s)).map((s) => {
        const c = col((s.match(/rgba?\([^)]+\)/) || [])[0]);
        const n = s.replace(/rgba?\([^)]+\)/, '').trim().split(/\s+/).map(parseFloat);
        return { c, n };
      }).filter((x) => x.c !== 'none' && (x.n[0] || x.n[1] || x.n[2])).map((x) => `${x.n[0]} ${x.n[1]} ${x.n[2]} ${x.c}`);
      v.投影 = sh.length ? sh.join(' / ') : 'none';
    }
    return v;
  }
  let lastDoc = null;
  function check() {
    const out = $('#ck-report');
    const doc = lastDoc;
    if (!out || !doc) return;
    const opt = { shadow: $('#ck-shadow').checked, round: $('#ck-round').checked };
    let total = 0;
    const lines = [];
    PARTS.forEach(([key, zh]) => {
      const vals = {};
      ORDER.forEach((id) => {
        const cell = doc.querySelector(`[data-audit-cell="${id}"]`);
        const el = cell && cell.querySelector(part(id, key));
        if (el) vals[id] = measure(doc, el, opt);
      });
      Object.keys(vals.antd || {}).forEach((p) => {
        total++;
        const xs = ORDER.map((id) => vals[id] && vals[id][p]);
        const same = typeof xs[0] === 'number' ? Math.max(...xs) - Math.min(...xs) <= 0.6 : xs.every((x) => x === xs[0]);
        if (!same) lines.push(`    控件样张 › ${zh} › ${p}: {${ORDER.map((id) => `"${id}":${typeof vals[id][p] === 'number' ? vals[id][p] : `"${vals[id][p]}"`}`).join(',')}}`);
      });
    });
    out.innerHTML = lines.length
      ? `<pre><b class="bad">✗ ${total} 项里有 ${lines.length} 项不一样</b>\n${esc(lines.join('\n'))}</pre>`
      : `<pre><b class="ok">✓ ${total} 项，5 个组件库全部一致</b></pre>`;
    rounds(doc);
  }
  // ── 5.5 五个开关的圆角写法
  function rounds(doc) {
    const box = $('#rounds');
    if (!box) return;
    box.innerHTML = ORDER.map((id) => {
      const cell = doc.querySelector(`[data-audit-cell="${id}"]`);
      const el = cell && cell.querySelector(part(id, 'switch'));
      if (!el) return '';
      const cs = doc.defaultView.getComputedStyle(el), r = el.getBoundingClientRect();
      const raw = cs.borderTopLeftRadius;
      const px = raw.endsWith('%') ? (parseFloat(raw) / 100) * r.width : parseFloat(raw) || 0;
      const vis = r1(Math.min(px, Math.min(r.width, r.height) / 2));
      return `<div class="rd"><b>${KIT[id].name}</b><code>${esc(raw)}</code><i style="width:${r.width * 2}px;height:${r.height * 2}px;border-radius:${raw.endsWith('%') ? raw : px * 2 + 'px'}"></i><span>画出来 ${vis}px</span></div>`;
    }).join('');
  }
  document.addEventListener('mh:live', (e) => {
    if (e.detail.box.id !== 'ck-live') return;
    MH.whenLive('#ck-live', (doc) => { settle(doc); lastDoc = doc; setTimeout(check, 200); });
  });
  ['#ck-shadow', '#ck-round'].forEach((s) => $(s)?.addEventListener('change', check));
  MH.seg('ckmode', (v) => { lastDoc = null; $('#ck-report').innerHTML = '<div class="sum">…</div>'; MH.live('#ck-live').reload(`scene=controls&spec=mono&mode=${v}`); });

  // ── 5.3 299 项都是什么
  const KEYS = /Tab|Esc|回车|空格|方向键|[↑↓←→]|焦点锁|按键/;
  (function () {
    const box = $('#au-list');
    if (!box || !A) return;
    $('#au-cap').textContent = `最近一次完整检查（${A.date}）：${A.total} 项，${A.ok === A.total ? '全部一致' : `${A.ok} 项一致`}。`;
    const paint = (scene) => {
      const items = A.items.filter((i) => i.scene === scene);
      const groups = new Map();
      // 只列看得见的样子和鼠标操作（这个系列不讲键盘）；项数还是这个场景的全部
      items.filter((i) => !KEYS.test(i.label)).forEach((i) => { if (!groups.has(i.label)) groups.set(i.label, []); groups.get(i.label).push(i.combo); });
      box.innerHTML = `<div class="au-h"><b>${scene}</b><span>${items.length} 项</span></div><div class="au">${[...groups].map(([label, combos]) => `<div class="au-r"><span class="l">${esc(label)}</span><span class="c">${combos.map((c) => `<i>${esc(c)}</i>`).join('')}</span></div>`).join('')}</div>`;
    };
    MH.seg('auscene', paint); paint('登录框');
  })();

  // ── 5.6 五格排开，比窗口宽（按真实比例画）
  (function () {
    const box = $('#win');
    if (!box) return;
    const S = () => box.clientWidth / 4400;
    const paint = (v) => {
      const s = S(), n = v === '4' ? 4 : 5, cell = n === 4 ? 820 : 817.6;
      const scroll = v === '5' ? 4088 - 3400 : 0;
      const cells = ORDER.slice(0, n).map((id, i) => { const x = i * cell - scroll; const out = x < 0; return `<div class="wc${out ? ' out' : ''}" style="left:${(x + 500) * s}px;width:${(cell - 20) * s}px"><span>${esc(KIT[id].name).replace('/', '/<wbr>')}</span></div>`; }).join('');
      $('.win-c', box).innerHTML = cells;
      $('.win-v', box).style.cssText = `left:${500 * s}px;width:${3400 * s}px`;
    };
    let cur = '5';
    MH.seg('win', (v) => { cur = v; paint(v); });
    paint(cur);
    addEventListener('resize', () => paint(cur));
  })();

  // ── 排了序的那一列：两个表头图标的颜色，直接标在图标上
  (function () {
    if (!$('#sort-live')) return;
    let kit = 'antd';
    const read = () => MH.whenLive('#sort-live', (doc) => {
      settle(doc);
      const w = doc.defaultView;
      const ths = $$('[data-region=table] th', doc);
      const sorted = ths.find((t) => /ending/.test(t.getAttribute('aria-sort') || ''));
      const other = ths.find((t) => t !== sorted && t.querySelector('svg[data-mh-icon]') && !t.getAttribute('aria-sort'));
      const ic = (t) => t && t.querySelector('svg[data-mh-icon]');
      const c = (t) => { const s = ic(t); return (s && C.cssToHex(w.getComputedStyle(s).color)) || '—'; };
      // 图标的颜色：取色点钉在图标上沿（不盖住图标），小牌子放在表头上方（下面紧挨着第一行）；两块牌子挤了就翻到点的另一边
      MH.mark(doc, [
        ic(sorted) && { pin: ic(sorted), color: c(sorted), label: `排了序 ${c(sorted)}`, place: 'upL' },
        ic(other) && { pin: ic(other), color: c(other), label: `没排序 ${c(other)}` },
      ]);
    });
    MH.seg('sortkit', (v) => { kit = v; $('#sort-name').textContent = `${FW[KIT[kit].framework]} · ${KIT[kit].name}`; MH.live('#sort-live').reload(`scene=customers&spec=mono&state=sorted&mode=aligned&kits=${kit}`); });
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'sort-live') setTimeout(read, 400); });
  })();

  // ── 分工那一节的插画：底部的胶带标签压着画布下边，描边被裁掉一截。画布往下加高一点
  const growIll = (name, add) => {
    const svg = $(`.ill[data-ill="${name}"] svg`);
    if (!svg || svg.dataset.grown) return;
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h + add}`);
    const bg = svg.querySelector(':scope > rect');
    if (bg) bg.setAttribute('height', h + add);
    svg.dataset.grown = '1';
  };
  const ills = () => { if (window.MHILL) window.MHILL.draw(); growIll('split', 14); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ills); else ills();
})();
