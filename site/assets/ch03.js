/*
 * 第 03 篇的交互。量哪个元素，照五个套件自己的部件地图（parts，由 _tools/data.mjs 从套件源码摘到 data/kits.js）。
 * 16 条开关适配记录也是从套件源码里读的，不手抄。
 */
(function () {
  const C = window.MhColor, MH = window.MH, K = window.MH_KITS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ORDER = ['antd', 'element', 'shadcn', 'arco', 'tdesign'];
  const KIT = Object.fromEntries(K.kits.map((k) => [k.id, k]));
  const FW = { react: 'React', vue: 'Vue' };
  const part = (id, key) => { const p = KIT[id].parts[key]; return typeof p === 'string' ? p : p && p.selector; };
  const r1 = (n) => Math.round(n * 10) / 10;
  const settle = (doc) => { try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {} };

  // ── 开头：五个开关，量出来直接标在每个开关上
  // 标注里的颜色（纯文字）：透明的写「无底色」，半透明的带百分比
  const hex = (css) => {
    if (!css) return '—';
    const m = css.match(/^rgba\(([^)]+)\)$/);
    if (m) { const [r, g, b, a] = m[1].split(',').map((x) => +x.trim()); if (a === 0) return '无底色'; if (a < 1) return `${C.rgbToHex([r, g, b])} ${Math.round(a * 100)}%`; }
    return C.cssToHex(css) || css;
  };
  function measureSwitches() {
    MH.whenLive('#hook-live', (doc) => {
      settle(doc);
      MH.mark(doc, ORDER.map((id) => {
        const cell = doc.querySelector(`[data-audit-cell="${id}"]`);
        if (!cell) return null;
        const tracks = $$(part(id, 'switch'), cell);
        const on = tracks[0];
        if (!on) return null;
        const r = on.getBoundingClientRect();
        const th = on.querySelector(part(id, 'switchThumb')) || on.parentElement.querySelector(part(id, 'switchThumb'));
        // 宽的尺寸线画在开关下面，数写全：宽 × 高 · 圆点
        const d = th ? r1(th.getBoundingClientRect().width) : 0;
        return { w: on, side: 'b', label: `${r1(r.width)} × ${r1(r.height)}${th ? ` · 圆点 ${d}` : ''}`, ok: r1(r.width) === 44 && r1(r.height) === 22 && d === 18 };
      }));
    });
  }
  document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'hook-live') setTimeout(measureSwitches, 300); });
  MH.seg('hook', (v) => MH.live('#hook-live').reload(`scene=controls&spec=mono&mode=${v}`));

  // ── 3.1 五个开关的截图
  const libs = (id, prefix) => {
    const box = $(id);
    if (box) box.innerHTML = ORDER.map((k) => `<div class="lib"><div class="lab"><b>${KIT[k].name}</b></div><img data-k="${k}" src="assets/img/${prefix}-${k}.png" alt="${KIT[k].name} 的开关"></div>`).join('');
  };
  // ── 对照台（MH.bench 在 blog.js）：上面五个库的真组件，下面「看哪一项」，标在组件上，和规格一样标黑、不一样标红。
  //   量什么用什么标法（MH.mark）：尺寸、距离画尺寸线，圆角画角上的弧，颜色用取色点 + 色块，字重画字上的括线，做法说明用取色点指过去。
  //   规格的数照 spec/src/controls.ts（黑白规范）；能量的实时量，量不到的（禁用、聚焦的做法）写实测记下的（2026-10-11、10-12）。
  const cs = (win, el) => win.getComputedStyle(el);
  const px = (v) => r1(parseFloat(v) || 0);
  const at = (cell, kit, key) => (part(kit, key) ? $$(part(kit, key), cell) : []);
  // 阴影拆成一条条：颜色、是不是 inset、扩展多宽（有的库用 inset 阴影画描边，用外扩阴影画聚焦外圈）
  const shadows = (v) => (v && v !== 'none' ? v.split(/,(?![^(]*\))/).map((x) => {
    const color = (x.match(/rgba?\([^)]*\)|#[0-9a-f]+/i) || [''])[0];
    const n = (x.replace(color, '').match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
    return { color, inset: /inset/.test(x), spread: n[3] || 0, blur: n[2] || 0 };
  }) : []);
  const visible = (c) => c && !/rgba\([^)]*,\s*0\)$/.test(c) && c !== 'transparent';
  // 看得见的描边：先看 border，没有就看 inset 1px 的阴影；都没有就写「没有描边」，带上底色
  const stroke = (win, el) => {
    const c = win.getComputedStyle(el);
    if (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && visible(c.borderTopColor)) return hex(c.borderTopColor);
    const s = shadows(c.boxShadow).find((x) => x.inset && x.spread >= 0.5 && x.spread <= 2 && visible(x.color));
    if (s) return hex(s.color);
    return visible(c.backgroundColor) ? `没有描边，底 ${hex(c.backgroundColor)}` : '没有描边';
  };
  // 外圈：不是 inset、扩展 2 以上的阴影（Tailwind 的 ring、Ant Design 的聚焦）
  const ring = (win, el) => shadows(win.getComputedStyle(el).boxShadow).find((x) => !x.inset && x.spread >= 1.5 && visible(x.color));
  // 先读一次样式（让过渡开始），再把过渡走完，再读
  const settled = (doc, el) => { doc.defaultView.getComputedStyle(el).boxShadow; try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {} };

  // 开关
  (function () {
    const SPEC = { w: 44, h: 22, d: 18, off: '#D4D4D4' };
    const DID = {
      antd: { hover: ['关着变深、开着变浅', 0], dis: ['65% 不透明', 0], focus: ['主色浅色的轮廓线', 0] },
      element: { hover: ['不变', 1], dis: ['60% 不透明', 0], focus: ['2px 主色轮廓线', 0] },
      shadcn: { hover: ['不变', 1], dis: ['50% 不透明', 1], focus: ['3px 外圈', 1] },
      arco: { hover: ['不变', 1], dis: ['换两种更浅的颜色', 0], focus: ['2px 外圈', 0] },
      tdesign: { hover: ['开、关都变色', 0], dis: ['换更浅的颜色', 0], focus: ['没有聚焦样式', 0] },
    };
    const ALIGNED = { hover: ['不变', 1], dis: ['50% 不透明', 1], focus: ['3px 外圈', 1] };
    // 悬停、禁用、聚焦：写的是做法，取色点指到那个开关上（禁用指两个禁用的）
    const said = (key) => ({ cell, kit, al, seen }) => {
      const t = at(cell, kit, 'switch');
      if (!t[0]) return null;
      const [say, ok] = al ? ALIGNED[key] : DID[kit][key];
      const label = say + (key === 'hover' && seen ? ` · 悬停时 ${seen}` : '');
      return { ok, marks: [key === 'dis' ? { pin: t[2], also: [t[3]], label } : { pin: t[0], label, color: key === 'hover' && seen ? seen : null }] };
    };
    MH.bench({
      live: '#sw-live', look: 'swlook', item: 'switem', region: '[data-region=switch]',
      query: (m) => `scene=controls&spec=mono&mode=${m}`,
      items: {
        size: ({ cell, kit }) => {
          const t = at(cell, kit, 'switch')[0];
          if (!t) return null;
          const r = t.getBoundingClientRect(), th = t.querySelector(part(kit, 'switchThumb')) || t.parentElement.querySelector(part(kit, 'switchThumb'));
          const w = r1(r.width), h = r1(r.height);
          // 轨道：宽标在上面、高标在左边
          return { marks: [{ w: t, ok: w === SPEC.w }, { h: t, side: 'l', ok: h === SPEC.h }] };
        },
        // 圆点：直径标在圆点上面（开着的那个，圆点在右头）
        dot: ({ cell, kit }) => {
          const t = at(cell, kit, 'switch')[0];
          const th = t && (t.querySelector(part(kit, 'switchThumb')) || t.parentElement.querySelector(part(kit, 'switchThumb')));
          if (!th) return null;
          const d = r1(th.getBoundingClientRect().width);
          return { marks: [{ w: th, label: d, ok: d === SPEC.d }] };
        },
        off: ({ win, cell, kit }) => {
          const t = at(cell, kit, 'switch')[1];
          if (!t) return null;
          const c = hex(cs(win, t).backgroundColor);
          // 关着时圆点在左边，取色点钉在右边露出来的轨道上
          return { ok: c.toUpperCase() === SPEC.off, marks: [{ pin: t, on: 'fill', fx: 0.72, color: c, label: c }] };
        },
        hover: said('hover'), dis: said('dis'), focus: said('focus'),
      },
      hover: { hover: ({ win, row, kit }, el) => { const t = at(row, kit, 'switch').find((x) => x.contains(el)); return t && hex(cs(win, t).backgroundColor); } },
    });
  })();

  // 输入框与选择框
  (function () {
    const SPEC = { h: 32, radius: 6, border: '#D4D4D4', focus: '#0A0A0A', inset: 12 };
    const pick = (cell, kit) => ({ f: at(cell, kit, 'field')[0], s: at(cell, kit, 'select')[0] });
    MH.bench({
      live: '#fd-live', look: 'fdlook', item: 'fditem', region: '[data-region=field]',
      query: (m) => `scene=controls&spec=mono&mode=${m}`,
      items: {
        size: ({ cell, kit }) => {
          const { f, s } = pick(cell, kit);
          if (!f) return null;
          const a = r1(f.getBoundingClientRect().height), b = s ? r1(s.getBoundingClientRect().height) : a;
          // 输入框的高标在左边，选择框的高标在右边
          return { marks: [{ h: f, side: 'l', ok: a === SPEC.h }, s && { h: s, side: 'r', ok: b === SPEC.h }] };
        },
        radius: ({ win, cell, kit }) => {
          const { f, s } = pick(cell, kit);
          if (!f) return null;
          const a = px(cs(win, f).borderTopLeftRadius), b = s ? px(cs(win, s).borderTopRightRadius) : a;
          return { marks: [{ corner: f, at: 'tl', label: a, ok: a === SPEC.radius }, s && { corner: s, at: 'tr', label: b, ok: b === SPEC.radius }] };
        },
        border: ({ win, cell, kit }) => {
          const { f } = pick(cell, kit);
          if (!f) return null;
          const c = stroke(win, f), bg = c.match(/#[0-9A-F]+/i);
          // 有描边：取色点钉在上边线上；没有描边（只有底色）：钉在底色里，色块是底色
          return { ok: c.toUpperCase() === SPEC.border, marks: [{ pin: f, on: c.startsWith('#') ? 'edge' : 'fill', fx: c.startsWith('#') ? 0.3 : 0.55, color: bg && bg[0], label: c.startsWith('#') ? `描边 ${c}` : c }] };
        },
        inset: ({ win, cell, kit }) => {
          const { f } = pick(cell, kit);
          const inp = f && (f.matches('input') ? f : f.querySelector('input'));
          if (!inp) return null;
          const ci = cs(win, inp), fr = f.getBoundingClientRect(), x2 = inp.getBoundingClientRect().left + parseFloat(ci.borderLeftWidth) + parseFloat(ci.paddingLeft), d = r1(x2 - fr.left);
          return { ok: d === SPEC.inset, marks: [{ gap: [fr.left, x2, fr.top + fr.height / 2], lift: 'l', label: d }] };
        },
        // 聚焦：一页里同时只能有一个框聚焦——挨个聚焦，等组件加上自己的「聚焦」样式再量（prep 里），最后停在最后一个上
        focus: ({ cell, kit, pre }) => {
          const { f } = pick(cell, kit);
          if (!f || !pre) return null;
          const { border, w } = pre, c = border.match(/#[0-9A-F]+/i);
          return { ok: border.toUpperCase() === SPEC.focus && w === 3, marks: [{ pin: f, fx: 0.3, color: c && c[0], label: `聚焦时 ${border.startsWith('#') ? border : border.replace('没有描边，', '')}${w ? ` · 外圈 ${w}` : ' · 没外圈'}` }] };
        },
      },
      prep: {
        focus: async ({ doc, win, cell, kit }) => {
          const { f } = pick(cell, kit);
          const inp = f && (f.matches('input') ? f : f.querySelector('input'));
          if (!inp) return null;
          // 嵌进来的演示页先拿到焦点，里面的框聚焦才算数（不然 :focus 不生效、组件也收不到聚焦）
          if (!doc.hasFocus()) win.focus();
          inp.focus({ preventScroll: true });
          await new Promise((r) => setTimeout(r, 150));
          settled(doc, f);
          const r = ring(win, f);
          return { border: stroke(win, f), w: r ? px(r.spread) : 0 };
        },
      },
    });
  })();

  // 复选框
  (function () {
    const SPEC = { size: 16, radius: 4, checked: '#0A0A0A', border: '#D4D4D4', gap: 8 };
    const boxes = (cell, kit) => at(cell, kit, 'checkbox');
    MH.bench({
      live: '#cb-live', look: 'cblook', item: 'cbitem', region: '[data-region=checkbox]',
      query: (m) => `scene=controls&spec=mono&mode=${m}`,
      items: {
        size: ({ cell, kit }) => {
          const b = boxes(cell, kit)[0];
          if (!b) return null;
          const r = b.getBoundingClientRect(), w = r1(r.width), h = r1(r.height);
          return { marks: [{ w: b, ok: w === SPEC.size }, { h: b, side: 'l', ok: h === SPEC.size }] };
        },
        checked: ({ win, cell, kit }) => {
          const b = boxes(cell, kit)[0];
          if (!b) return null;
          const c = hex(cs(win, b).backgroundColor);
          return { ok: c.toUpperCase() === SPEC.checked, marks: [{ pin: b, on: 'fill', color: c, label: `底 ${c}` }] };
        },
        border: ({ win, cell, kit }) => {
          const b = boxes(cell, kit)[1];
          if (!b) return null;
          const c = stroke(win, b), bg = c.match(/#[0-9A-F]+/i);
          return { ok: c.toUpperCase() === SPEC.border, marks: [{ pin: b, color: bg && bg[0], label: c.startsWith('#') ? `描边 ${c}` : c }] };
        },
        radius: ({ win, cell, kit }) => {
          const b = boxes(cell, kit)[0];
          if (!b) return null;
          const v = px(cs(win, b).borderTopLeftRadius);
          return { ok: v === SPEC.radius, marks: [{ corner: b, at: 'tl', label: v }] };
        },
        gap: ({ cell, kit, row }) => {
          const b = boxes(cell, kit)[0];
          if (!b) return null;
          // 文字：复选框所在那一项里，第一个有字的元素
          const item = b.closest('label') || b.parentElement;
          const txt = [...item.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() && !b.contains(e));
          if (!txt) return null;
          const range = row.ownerDocument.createRange(); range.selectNodeContents(txt);
          const br = b.getBoundingClientRect(), x2 = range.getBoundingClientRect().left, d = r1(x2 - br.right);
          return { ok: d === SPEC.gap, marks: [{ gap: [br.right, x2, br.top + br.height / 2], lift: 'l', label: d }] };
        },
      },
    });
  })();

  // ── 画出来的对照格（MH.dgrid 在 blog.js）：一行一项，一列一个库，最后一列是规格
  const LIBS = ORDER.map((id) => KIT[id].name);
  const dgrid = (el, rows, o = {}) => MH.dgrid(el, rows, { cols: LIBS, ...o });
  const NATIVE_PRIMARY = { antd: '#1677FF', element: '#409EFF', shadcn: '#171717', arco: '#165DFF', tdesign: '#0052D9' };

  // 日期面板（原来一张 5 × 7 的表）
  (function () {
    const P = ORDER.map((id) => NATIVE_PRIMARY[id]);
    const day = (size, r, c = '#0A0A0A') => `<i class="day" style="width:${size}px;height:${size}px;border-radius:${r};background:${c}">15</i>`;
    const today = (k, c) => ({ outline: `<i class="today" style="box-shadow:inset 0 0 0 1px ${c};border-radius:4px">16</i>`, bold: `<i class="today" style="color:${c};font-weight:700">16</i>`, dot: `<i class="today dotb" style="--c:${c}">16</i>`, none: '<i class="today">16</i>', gray: '<i class="today" style="background:#F5F5F5;border-radius:4px">16</i>' })[k];
    dgrid($('#date-grid'), [
      { name: '每月多宽', cells: [{ label: '288' , bad: 1 }, { label: '两个月共 648、居中', bad: 1 }, { label: '224 · 离 4' }, { label: '265', bad: 1 }, { label: '280 · 离 8', bad: 1 }], spec: { label: '7 × 32 = 224 · 两月隔 24 · 离 4' } },
      { name: '选中的日子', sub: '按 1 倍画', cells: [{ draw: day(24, '4px', P[0]), label: '36 的格子里 24 的圆角块', bad: 1 }, { draw: day(24, '50%', P[1]), label: '32 × 30 里 24 的圆', bad: 1 }, { draw: day(32, '6px', P[2]), label: '32 的方块' }, { draw: day(24, '50%', P[3]), label: '36 高里 24 的圆', bad: 1 }, { draw: day(24, '3px', P[4]), label: '36 × 30 里 24 的方块', bad: 1 }], spec: { draw: day(32, '6px'), label: '32 的方块，紧挨着' } },
      { name: '今天', cells: [{ draw: today('outline', P[0]), label: '1px 主色描边' }, { draw: today('bold', P[1]), label: '主色粗体字', bad: 1 }, { draw: today('gray'), label: '浅灰底', bad: 1 }, { draw: today('dot', P[3]), label: '下面一个小圆点', bad: 1 }, { draw: today('none'), label: '不标', bad: 1 }], spec: { draw: today('outline', '#0A0A0A'), label: '1px 主色描边' } },
      { name: '标题', cells: [{ label: '年、月两个按钮，能按年翻', bad: 1 }, { label: '年、月是按钮，能按年翻', bad: 1 }, { label: '一段文字' }, { label: '年、月两段能点', bad: 1 }, { label: '年、月两个下拉，两个月各翻各的', bad: 1 }], spec: { label: '文字，只按月翻' } },
      { name: '聚焦就打开', cells: [{ label: '是', bad: 1 }, { label: '是', bad: 1 }, { label: '否' }, { label: '否' }, { label: '否' }], spec: { label: '否，点一下才打开' } },
    ], { pick: true });
  })();

  // 分页（03-2）
  (function () {
    const SPEC = { size: 32, gap: 8, radius: 6, active: '#0A0A0A' };
    const pages = (cell, kit) => at(cell, kit, 'pageItem').filter((e) => /\d/.test(e.textContent));
    const cur = (list) => list.find((e) => e.getAttribute('aria-current') === 'page' || /(^|[\s_-])(active|current|selected|is-active)\b/.test(e.className)) || list[0];
    MH.bench({
      live: '#pg-live', look: 'pglook', item: 'pgitem', region: '[data-region=pagination]',
      query: (m) => `scene=customers&spec=mono&state=default&mode=${m}`,
      items: {
        // 大小、圆角量当前页那一个：别的页码没有底、没有边，标在看不见的框上看不出来
        size: ({ cell, kit }) => {
          const e = cur(pages(cell, kit));
          if (!e) return null;
          const r = e.getBoundingClientRect(), w = r1(r.width), h = r1(r.height);
          // 宽标在上面；右边隔 8 就是下一页，高的数放到右上
          return { marks: [{ w: e, label: `宽 ${w}`, ok: w === SPEC.size }, { h: e, side: 'ru', label: `高 ${h}`, ok: h === SPEC.size }] };
        },
        gap: ({ cell, kit }) => {
          const [a, b2] = pages(cell, kit);
          if (!a || !b2) return null;
          const ar = a.getBoundingClientRect(), x2 = b2.getBoundingClientRect().left, d = r1(x2 - ar.right);
          return { ok: d === SPEC.gap, marks: [{ gap: [ar.right, Math.max(x2, ar.right + 2), ar.top + ar.height / 2], lift: a, label: d }] };
        },
        active: ({ win, cell, kit }) => {
          const e = cur(pages(cell, kit));
          if (!e) return null;
          // 白底和没有底一样；字的颜色、粗细读真正装着数字的那个元素
          const c = cs(win, e), b0 = hex(c.backgroundColor), bg = visible(c.backgroundColor) && b0.toUpperCase() !== '#FFFFFF' ? `底 ${b0} · ` : '', st = stroke(win, e);
          const t = [...e.querySelectorAll('*'), e].find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || e, ct = cs(win, t);
          // 一个 32 的小格子里放不下三个标注：取色点钉在上边线，一块牌子写全（底、描边、字）
          const fg = hex(ct.color), okAll = !bg && st.toUpperCase() === SPEC.active && fg.toUpperCase() === SPEC.active && +ct.fontWeight === 500;
          return { ok: okAll, marks: [{ pin: e, fx: 0.75, color: st.startsWith('#') ? st : bg ? b0 : null, label: `${bg}${st.startsWith('#') ? `描边 ${st}` : '没有描边'} · 字 ${fg} ${ct.fontWeight}` }] };
        },
        radius: ({ win, cell, kit }) => {
          const e = cur(pages(cell, kit));
          if (!e) return null;
          const v = px(cs(win, e).borderTopLeftRadius);
          return { ok: v === SPEC.radius, marks: [{ corner: e, at: 'tl', label: v }] };
        },
      },
    });
  })();

  // 按钮（03-3）：主按钮、次要按钮。高度、留白 02-2 讲过，这里不量
  (function () {
    const SPEC = { weight: 500, radius: 6, border: '#D4D4D4', hover: '#333333' };
    const btns = (cell, kit) => at(cell, kit, 'button');
    MH.bench({
      live: '#bt-live', look: 'btlook', item: 'btitem', region: '[data-region=button]',
      query: (m) => `scene=controls&spec=mono&mode=${m}`,
      items: {
        weight: ({ win, cell, kit }) => { const b = btns(cell, kit)[0]; if (!b) return null; const t = [...b.querySelectorAll('*'), b].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || b; const w = +cs(win, t).fontWeight; return { ok: w === SPEC.weight, marks: [{ over: t, lift: b, label: `字重 ${w}` }] }; },
        radius: ({ win, cell, kit }) => { const b = btns(cell, kit)[0]; if (!b) return null; const v = px(cs(win, b).borderTopLeftRadius); return { ok: v === SPEC.radius, marks: [{ corner: b, at: 'tl', label: v }] }; },
        secondary: ({ win, cell, kit }) => { const b = btns(cell, kit)[1]; if (!b) return null; const st = stroke(win, b), c = st.match(/#[0-9A-F]+/i); return { ok: st.toUpperCase() === SPEC.border, marks: [{ pin: b, on: st.startsWith('#') ? 'edge' : 'fill', fx: st.startsWith('#') ? 0.25 : 0.1, color: c && c[0], label: st.startsWith('#') ? `描边 ${st}` : st }] }; },
        // 悬停：取色点钉在主按钮左边的留白里（不压字），色块是悬停时的底色
        hover: ({ cell, kit, seen }) => { const b = btns(cell, kit)[0]; if (!b) return null; return seen ? { ok: seen.toUpperCase() === SPEC.hover, marks: [{ pin: b, on: 'fill', fx: 0.08, color: seen, label: `悬停 ${seen}` }] } : { ok: null, marks: [{ pin: b, on: 'fill', fx: 0.08, label: '移到主按钮上，量悬停' }] }; },
      },
      hover: { hover: ({ win, row, kit }, el) => { const b = btns(row, kit)[0]; return b && b.contains(el) ? hex(cs(win, b).backgroundColor) : null; } },
    });
  })();

  // 侧栏菜单、面包屑与下拉菜单（03-2）、头像与徽标（03-3）：原来的表改成画出来的对照格。数照 2026-10-11 第一次一起检查的记录
  (function () {
    const P = ORDER.map((id) => NATIVE_PRIMARY[id]);
    const K = 0.6; // 菜单、表格按 0.6 倍画，五列放得下
    const item = (h, r, bg = '#F5F5F5', fg = '#A3A3A3', w = 96, weight = 400) => `<i class="mi" style="height:${h * K}px;border-radius:${r * K}px;background:${bg};color:${fg};width:${w}px;font-weight:${weight}">客户</i>`;
    const two = (h, gap, r, h2) => `<span class="mstack" style="gap:${gap * K}px">${item(h, r)}${item(h2 || h, r)}</span>`;
    const indent = (d, line) => `<span class="mind"><i class="pt"><b></b>客户管理</i><i class="ch" style="margin-left:${line ? 6 : d * K}px">${line ? '<s></s>' : ''}客户列表</i></span>`;
    const crumb = (sep, gap, bold) => `<span class="crumb">首页<i style="margin:0 ${gap}px;${bold ? 'font-weight:700;color:#606266' : ''}">${sep}</i>客户</span>`;
    const drop = (align, gap, arrow, w) => `<span class="dropd ${align}"><i class="btn"></i><i class="pop" style="margin-top:${gap * 0.5}px;width:${w}px">${arrow ? '<s></s>' : ''}</i></span>`;
    const avatar = (n, bg) => `<i class="av" style="width:${n}px;height:${n}px;background:${bg}"></i>`;
    const badge = (h, ring) => (h ? `<span class="bdg"><i class="bell"></i><i class="bd" style="height:${h}px;min-width:${h}px;${ring ? 'box-shadow:0 0 0 2px #fff' : ''}">3</i></span>` : '<span class="bdg"><i class="bell"></i></span>');
    dgrid($('#nav-grid'), [
      { name: '菜单项', sub: '高、间距、圆角', cells: [{ draw: two(40, 4, 8), label: '40 高、隔 4、圆角 8', bad: 1 }, { draw: two(56, 0, 0, 50), label: '一级 56、子菜单 50、整宽、直角', bad: 1 }, { draw: two(36, 4, 8, 28), label: '一级 36、子菜单 28、隔 4、圆角 8', bad: 1 }, { draw: two(40, 4, 2), label: '40 高、隔 4、圆角 2', bad: 1 }, { draw: two(36, 4, 3), label: '36 高、隔 4、圆角 3', bad: 1 }], spec: { draw: two(36, 2, 6), label: '36 高、隔 2、控件圆角 6' } },
      { name: '选中', cells: [{ draw: item(40, 8, '#E6F4FF', P[0]), label: '浅蓝底 + 主色字', bad: 1 }, { draw: item(56, 0, 'transparent', P[1]), label: '只把字变主色', bad: 1 }, { draw: item(36, 8, '#F5F5F5', '#171717'), label: '浅灰底', bad: 1 }, { draw: item(40, 2, '#F2F3F5', P[3]), label: '浅灰底 + 主色字', bad: 1 }, { draw: item(36, 3, '#F2F3FF', P[4]), label: '浅主色底 + 主色字', bad: 1 }], spec: { draw: item(36, 6, '#EBEBEB', '#0A0A0A', 96, 500), label: '选中面底 + 主色字、500' } },
      { name: '子菜单缩进', cells: [{ draw: indent(24), label: '每级 24', bad: 1 }, { draw: indent(20), label: '每级 20', bad: 1 }, { draw: indent(0, 1), label: '左边一条竖线', bad: 1 }, { draw: indent(20), label: '每级 20', bad: 1 }, { draw: indent(44), label: '44', bad: 1 }], spec: { draw: indent(38), label: '文字和上一级对齐' } },
    ]);
    dgrid($('#crumb-grid'), [
      { name: '面包屑分隔符', cells: [{ draw: crumb('/', 8), label: '「/」、左右 8' }, { draw: crumb('/', 9, 1), label: '「/」加粗、左右 9', bad: 1 }, { draw: crumb('›', 3), label: '箭头图标、间距 6', bad: 1 }, { draw: crumb('/', 4), label: '斜线图标、左右 4', bad: 1 }, { draw: crumb('›', 4), label: '箭头图标、左右 4', bad: 1 }], spec: { draw: crumb('/', 8), label: '「/」、左右 8' } },
      { name: '下拉菜单', sub: '弹层对齐在哪', cells: [{ draw: drop('r', 4, 0, 36), label: '右对齐、和按钮一样宽', bad: 1 }, { draw: drop('c', 12, 1, 64), label: '居中、离 12、带小箭头、悬停打开', bad: 1 }, { draw: drop('c', 4, 0, 64), label: '项 32、最小 128', bad: 1 }, { draw: drop('l', 4, 0, 64), label: '左对齐、悬停打开', bad: 1 }, { draw: drop('r', 8, 0, 64), label: '右对齐、离 8', bad: 1 }], spec: { draw: drop('r', 4, 0, 80), label: '右对齐、离 4、项 32、最小 160' } },
    ]);
    dgrid($('#av-grid'), [
      { name: '头像', cells: [{ draw: avatar(32, '#D9D9D9'), label: '32', bad: 1 }, { draw: avatar(40, '#C0C4CC'), label: '40', bad: 1 }, { draw: avatar(32, '#F5F5F5'), label: '32、浅灰底', bad: 1 }, { draw: avatar(40, '#C9CDD4'), label: '40', bad: 1 }, { draw: avatar(32, '#F2F3FF'), label: '32、浅主色底', bad: 1 }], spec: { draw: avatar(28, '#EBEBEB'), label: '28、选中面底' } },
      { name: '徽标', cells: [{ draw: badge(20), label: '20 高、数字滚动动画', bad: 1 }, { draw: badge(18), label: '18 高', bad: 1 }, { draw: badge(0), label: '没有', bad: 1 }, { draw: badge(20, 1), label: '20 高、2px 白边', bad: 1 }, { draw: badge(20), label: '20 高、对准一行文字的右上角', bad: 1 }], spec: { draw: badge(16), label: '16 高、中心对准铃铛右上角' } },
    ]);
  })();

  // 五个库各用了哪几种手段（01 篇「六种手段」）：从套件的适配记录里数，一格一个点；鼠标停在点上，同一种手段一起亮
  (function () {
    const M = [['theme-token', '全局主题变量'], ['component-token', '组件主题变量'], ['prop', '组件属性'], ['class', '换类名'], ['style-override', '样式覆盖'], ['behavior', '补交互']];
    $$('.means[data-ctrl]').forEach((el) => {
      const want = el.dataset.ctrl.split(',');
      el.innerHTML = `<div class="mr mh"><div></div>${M.map(([, n]) => `<div>${n}</div>`).join('')}<div class="mc">条数</div></div>` + ORDER.map((id) => {
        const list = KIT[id].adaptations.filter((a) => want.includes(a.control));
        return `<div class="mr"><div class="ml">${KIT[id].name}</div>${M.map(([v, n]) => { const k = list.filter((a) => a.via === v).length; return `<div>${k ? `<i class="dot" data-k="${v}" title="${n} · ${k} 条"></i>` : ''}</div>`; }).join('')}<div class="mc">${list.length}</div></div>`;
      }).join('');
    });
  })();

  // ── 侧栏菜单的高度与选中样式：量出来直接标在菜单上（头像归顶栏控件那一部分，这里不标）
  (function () {
    if (!$('#admin-live')) return;
    let mode = 'native', kit = 'element';
    const SEL = { antd: '.ant-menu-item-selected', element: '.el-menu-item.is-active', shadcn: '[data-slot=nav-item][aria-current=page]', arco: '.arco-menu-item.arco-menu-selected', tdesign: '.t-menu__item.t-is-active:not(.t-is-opened)' };
    const read = () => MH.whenLive('#admin-live', (doc) => {
      settle(doc);
      const win = doc.defaultView;
      const first = doc.querySelector(part(kit, 'menuItem'));
      const sel = doc.querySelector(SEL[kit]);
      const cs = sel && win.getComputedStyle(sel);
      // 一级菜单：高画在右边、数放右上（旁边是面包屑，右上是顶栏的空处）；选中的那一项：高画在右边、数在线右边，
      //   底色和字用取色点（钉在这一项靠下的空处）横着拉到右边，在高的那块牌子下面
      const bg = hex(cs.backgroundColor);
      MH.mark(doc, [
        first && first !== sel && { h: first, side: 'ru', label: `一级菜单 高 ${r1(first.getBoundingClientRect().height)}` },
        sel && { h: sel, side: 'r', label: `选中 高 ${r1(sel.getBoundingClientRect().height)}` },
        sel && { pin: sel, on: 'fill', fx: 0.9, fy: 0.9, color: bg.startsWith('#') ? bg : null, label: `底 ${bg} · 字 ${hex(cs.color)} ${cs.fontWeight}`, place: 'r' },
      ]);
    });
    const go = () => {
      $('#admin-name').textContent = `${FW[KIT[kit].framework]} · ${KIT[kit].name}`;
      MH.live('#admin-live').reload(`scene=admin&spec=mono&sider=expanded&mode=${mode}&kits=${kit}`);
    };
    MH.seg('admin', (v) => { mode = v; go(); });
    MH.seg('adminkit', (v) => { kit = v; go(); });
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'admin-live') setTimeout(read, 400); });
  })();

  // ── 3.8 TDesign 的指示条：读它身上写的行内样式，标在指示条上；点一下标签就重读
  (function () {
    if (!$('#tabs-live')) return;
    let watching = null;
    const read = (doc) => {
      const bar = doc.querySelector('.t-tabs__bar');
      const act = doc.querySelector('.t-tabs__nav-item.t-is-active');
      if (!bar) return;
      const win = doc.defaultView;
      const shown = win.getComputedStyle(bar).display !== 'none';
      const after = act && win.getComputedStyle(act, '::after');
      const own = after && after.content !== 'none' && parseFloat(after.height) > 0;
      MH.mark(doc, [
        // 指示条：宽的尺寸线画在条下面，数放在线右端外面（下面紧挨着输入框）；藏起来了就用取色点指着那个标签
        shown ? { w: bar, side: 'br', label: `它算的 left ${bar.style.left || '—'} · width ${bar.style.width || '—'}` }
          : act && { pin: act, label: own ? `TDesign 的指示条藏起来了（还在算 left ${bar.style.left || '—'}）· 套件画的线 ${after.height} ${C.cssToHex(after.backgroundColor)}` : '指示条藏起来了' },
      ]);
    };
    const hook = () => MH.whenLive('#tabs-live', (doc) => {
      settle(doc);
      read(doc);
      const bar = doc.querySelector('.t-tabs__bar');
      if (!bar || watching === bar) return;
      watching = bar;
      new doc.defaultView.MutationObserver(() => read(doc)).observe(bar, { attributes: true, attributeFilter: ['style'] });
      doc.addEventListener('click', () => setTimeout(() => read(doc), 50));
    });
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'tabs-live') { watching = null; setTimeout(hook, 300); } });
    MH.seg('tabslook', (v) => {
      $('#tabs-mode').textContent = v === 'native' ? '组件库原生' : '对齐到控件规格';
      MH.live('#tabs-live').reload(`scene=login&spec=mono&variant=centered&state=initial&mode=${v}&kits=tdesign`);
    });
  })();

  // ── 表格（03-3）：一次看一项（六项一起摆太密）。
  //   上面是一个库的真表格（只留前三行），选的那一项照它是什么标在表格上：高、宽画尺寸线，底色用取色点；
  //   「勾选的行」「加载中」「没有行」先把表格换到那个状态。下面是五个库和规格的这一项，按 1 倍画，正在看的那个库那一列垫灰。
  (function () {
    const box = $('#table-live'), grid = $('#table-grid');
    if (!box) return;
    let kit = 'antd', look = 'native', item = 'head', loaded = '';
    const STATE = { sel: 'selected', loading: 'loading', empty: 'empty' };
    // 五个库的这一项：数照 2026-10-11 第一次一起检查的记录
    const hv = (h) => `<span class="hv" style="height:${h}px"></span>`;
    const thead = (h, bg, line) => `${hv(h)}<i class="th" style="height:${h}px;background:${bg};${line ? 'background-image:linear-gradient(90deg,transparent 47%,#ddd 47%,#ddd 50%,transparent 50%)' : ''}"></i>`;
    const trow = (h) => `${hv(h)}<i class="tr" style="height:${h}px"></i>`;
    const tsel = (bg) => `<i class="tr sel" style="height:44px;background:${bg}"><b></b></i>`;
    const col = (w) => (w ? `<span class="cw"><i class="wv" style="width:${w}px"></i><i class="tc" style="width:${w}px"></i></span>` : '<i class="tc none"></i>');
    const ROWS = {
      head: { name: '表头', cells: [{ draw: thead(55, '#FAFAFA', 1), label: '55 高、浅灰底、格子之间竖线', bad: 1 }, { draw: thead(41.5, '#fff'), label: '41.5 高、白底', bad: 1 }, { draw: thead(40, '#fff'), label: '40 高', bad: 1 }, { draw: thead(41, '#F2F3F5'), label: '41 高、外框', bad: 1 }, { draw: thead(46.5, '#fff'), label: '46.5 高、白底', bad: 1 }], spec: { draw: thead(40, '#F5F5F5'), label: '40 高、浅底、12px 次要灰' } },
      row: { name: '行高', cells: [65, 49, 39.2, 43.3, 57].map((h) => ({ draw: trow(h), label: `${h}`, bad: 1 })), spec: { draw: trow(44), label: '44（含 1px 线）' } },
      col: { name: '勾选列', sub: '宽', cells: [32, 0, 40, 40, 64].map((w) => ({ draw: col(w), label: w ? `${w}` : '没有单独一列', bad: 1 })), spec: { draw: col(48), label: '48' } },
      sel: { name: '勾选的行', cells: [{ draw: tsel('#E6F4FF'), label: '浅主色、悬停再深', bad: 1 }, { draw: tsel('#fff'), label: '不变色', bad: 1 }, { draw: tsel('#F5F5F5'), label: '浅灰', bad: 1 }, { draw: tsel('#fff'), label: '不变色', bad: 1 }, { draw: tsel('#fff'), label: '不变色', bad: 1 }], spec: { draw: tsel('#EBEBEB'), label: '选中面底，悬停不变' } },
      loading: { name: '加载中', cells: [{ label: '50% 不透明 + 40% 白', bad: 1 }, { label: '90% 白、42px 转圈', bad: 1 }, { label: '没有', bad: 1 }, { label: '60% 白', bad: 1 }, { label: '60% 白、渐变圆环', bad: 1 }], spec: { label: '50% 不透明，不盖白' } },
      empty: { name: '没有行', cells: [{ label: '格子上下 16', bad: 1 }, { label: '至少 60 高的框', bad: 1 }, { label: '一格' }, { label: '上下 9 + 20', bad: 1 }, { label: '至少 120 高、灰字', bad: 1 }], spec: { label: '一格，内容页面给' } },
    };
    // 对齐档：五个库这一项都对齐成规格了，下面那一行就画五个规格（不然上面标黑、下面标红，对不上）
    const strip = () => {
      const R = ROWS[item], row = look === 'aligned' ? { ...R, cells: R.cells.map(() => ({ ...R.spec })) } : R;
      MH.dgrid(grid, [row], { cols: ORDER.map((id) => KIT[id].name) });
      const i = ORDER.indexOf(kit) + 1;
      $$('.dr', grid).forEach((r) => r.children[i] && r.children[i].classList.add('cur'));
    };
    const rowsOf = (doc) => $$('[data-region=table] tbody tr', doc).filter((r) => r.getBoundingClientRect().height > 5);
    const checked = (r) => r.querySelector('input[type=checkbox]:checked, [role=checkbox][aria-checked=true], [data-state=checked], .is-checked, .t-is-checked, .arco-checkbox-checked, .ant-checkbox-checked');
    const mark = () => MH.whenLive('#table-live', (doc) => {
      settle(doc);
      const win = doc.defaultView;
      // 只露出表格卡片（侧栏、筛选栏藏起来，放大时边上不露出半截），只留前三行：表格不用那么长，标注看得清
      if (!doc.getElementById('mh-solo')) { const st = doc.createElement('style'); st.id = 'mh-solo'; st.textContent = '.ex-list{visibility:hidden}.mh-list__panel{visibility:visible}'; doc.head.appendChild(st); }
      const rs = rowsOf(doc);
      if (rs.length > 3 && !doc.documentElement.dataset.mhRows) { rs.slice(3).forEach((r) => (r.style.display = 'none')); doc.documentElement.dataset.mhRows = '1'; MH.live(box).fit(); }
      const th = doc.querySelector(part(kit, 'tableHead')), headRow = th && th.closest('tr'), row = rowsOf(doc)[0];
      const C = ROWS[item].cells[ORDER.indexOf(kit)], said = look === 'aligned' ? ROWS[item].spec.label : C.label, sayOk = look === 'aligned' || !C.bad;
      let marks = [];
      if (item === 'head' && th) {
        const h = r1(th.getBoundingClientRect().height), hb = hex(win.getComputedStyle(th).backgroundColor);
        marks = [{ h: headRow, side: 'l', label: h, ok: h === 40 }, { pin: th, on: 'fill', fx: 0.85, fy: 0.15, color: hb.startsWith('#') ? hb : null, label: `表头底 ${hb}`, ok: hb.toUpperCase() === '#F5F5F5' }];
      }
      if (item === 'row' && row) { const h = r1(row.getBoundingClientRect().height); marks = [{ h: row, side: 'l', label: h, ok: h === 44 }]; }
      if (item === 'col' && headRow) {
        // 表头第一格里只有勾选框、没有字：那就是单独的勾选列。宽画在最后一行那一格下面（上面紧挨着工具条的字）
        const c0 = headRow.firstElementChild, alone = c0 && !c0.textContent.trim() && c0.querySelector('input, [role=checkbox], [class*=checkbox]');
        const last = rowsOf(doc).filter((r) => r.style.display !== 'none').pop(), cell = (last && last.firstElementChild) || c0;
        const w = alone ? r1(cell.getBoundingClientRect().width) : 0;
        marks = [alone ? { w: cell, side: 'b', label: w, ok: w === 48 } : { pin: c0, fx: 0.2, label: '勾选框和名字在同一格', ok: false }];
      }
      if (item === 'sel') {
        const r = rowsOf(doc).find(checked);
        const td = r && (r.children[1] || r.lastElementChild);
        if (td) {
          const bg = hex(win.getComputedStyle(td).backgroundColor), R = r.getBoundingClientRect(), T = td.getBoundingClientRect();
          // 底色读名字那一格；取色点钉在那一格右边的空处，小牌子骑在这一行的上边线上
          marks = [{ pin: r, on: 'fill', fx: (T.right - 14 - R.left) / R.width, color: bg.startsWith('#') ? bg.slice(0, 7) : null, label: `勾选的行：底 ${bg}`, place: 'top', ok: bg.toUpperCase() === '#EBEBEB' }];
        }
      }
      if (item === 'loading' || item === 'empty') {
        // 取色点钉在表格上边线中间（转圈、空状态的字在表格里面，不压），牌子放在表头上面的工具条里；手机上横着滑之前也看得到
        const t = doc.querySelector('[data-region=table]');
        if (t) marks = [{ pin: t, fx: 0.5, label: said, ok: sayOk }];
      }
      MH.mark(doc, marks, { clip: doc.querySelector('.mh-list__panel') });
    });
    const go = () => {
      const q = `scene=customers&spec=mono&state=${STATE[item] || 'default'}&mode=${look}&kits=${kit}`;
      $('#table-name').textContent = `${FW[KIT[kit].framework]} · ${KIT[kit].name}`;
      strip();
      if (q === loaded) return mark();
      loaded = q;
      MH.live(box).reload(q);
    };
    MH.seg('tablekit', (v) => { kit = v; go(); });
    MH.seg('tablelook', (v) => { look = v; go(); });
    MH.seg('tableitem', (v) => { item = v; go(); });
    document.addEventListener('mh:live', (e) => { if (e.detail.box === box) { loaded = loaded || box.dataset.live; setTimeout(mark, 500); } });
    loaded = box.dataset.live;
    strip();
  })();

  // ── 3.13 日期面板截图
  // 截图时弹层四周多截了 8 像素（2 倍图里是 16），那一圈是背后的页面：按图的大小把这一圈裁掉，露出外面一层的白底
  (function () {
    const box = $('#date-libs');
    if (!box) return;
    const PAD = 16;
    let look = 'native';
    // Ant Design、Element Plus 原生档的面板上方带一个小箭头，正好在那一圈里：这两张上边不裁
    const clip = (im) => { const W = im.naturalWidth, H = im.naturalHeight; if (W <= PAD * 4 || H <= PAD * 4) return; const top = look === 'native' && /^(antd|element)$/.test(im.dataset.k) ? 0 : (PAD / H) * 100; im.style.clipPath = `inset(${top}% ${(PAD / W) * 100}% ${(PAD / H) * 100}%)`; };
    box.innerHTML = ORDER.map((k) => `<div class="lib"><div class="lab"><b>${KIT[k].name}</b></div><span class="dp"><img data-k="${k}" src="assets/img/03-date-native-${k}.png" alt="${KIT[k].name} 的日期面板"></span></div>`).join('');
    $$('img', box).forEach((im) => { im.addEventListener('load', () => clip(im)); if (im.complete) clip(im); });
    MH.seg('datelook', (v) => { look = v; $$('img', box).forEach((im) => (im.src = `assets/img/03-date-${v}-${im.dataset.k}.png`)); });
  })();

  // ── 3.16 同一个 4 像素，相对谁（示意）
  (function () {
    const box = $('#rel');
    if (!box) return;
    // 示意：每个库「菜单项」那个框的左右范围（在 64 宽的收起侧栏里），宽窄不按比例
    const ITEM = [['Ant Design', 0, 64, '外面多一层带 8 像素留白的壳'], ['Element Plus', 0, 64, '这一层把整个子菜单包在里面'], ['shadcn/ui', 8, 56, ''], ['Arco Design', 4, 60, ''], ['TDesign', 8, 52, '']];
    const EDGE = 64, X = 2.6; // 侧栏右边缘；1 像素画 2.6 倍
    const paint = (how) => {
      box.innerHTML = `<div class="rel-sider" style="width:${EDGE * X}px"><span>收起的侧栏 64</span></div><div class="rel-edge" style="left:${EDGE * X}px"></div>` + ITEM.map(([n, a, b, note], i) => {
        const x = how === 'item' ? b + 4 : EDGE + 1 + 4;
        return `<div class="rel-row" style="top:${34 + i * 46}px"><div class="rel-item" style="left:${a * X}px;width:${(b - a) * X}px"></div><div class="rel-gap" style="left:${(how === 'item' ? b : EDGE + 1) * X}px;width:${4 * X}px"><span>4</span></div><div class="rel-pop" style="left:${x * X}px"><b>${n}</b>${note ? `<small>${note}</small>` : ''}</div></div>`;
      }).join('');
      box.classList.toggle('aligned', how === 'edge');
    };
    MH.seg('rel', paint); paint('item');
  })();

  // ── 3.17 开关宽度 44 → 40
  libs('#sw-40', '03-switch-aligned');
  MH.seg('sw40', (v) => $$('#sw-40 img').forEach((im) => (im.src = `assets/img/03-switch-aligned${v === '40' ? '-40' : ''}-${im.dataset.k}.png`)));
})();

// ── 3.4 三家的开关样式表，一次看一份
window.MH && window.MH.seg('swcss', (v) => document.querySelectorAll('[data-g]').forEach((el) => (el.hidden = el.dataset.g !== v)));
