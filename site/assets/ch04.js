/*
 * 第 04 篇的交互。量哪个元素，照五个套件自己的部件地图（data/kits.js，由 _tools/data.mjs 从套件源码摘出来）。
 */
(function () {
  const MH = window.MH, K = window.MH_KITS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ORDER = ['antd', 'element', 'shadcn', 'arco', 'tdesign'];
  const KIT = Object.fromEntries(K.kits.map((k) => [k.id, k]));
  const FW = { react: 'React', vue: 'Vue' };
  const part = (id, key) => { const p = KIT[id].parts[key]; return typeof p === 'string' ? p : p && p.selector; };
  const r1 = (n) => Math.round(n * 10) / 10;
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const settle = (doc) => { try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {} };
  const title = (id) => `${FW[KIT[id].framework]} · ${KIT[id].name}`;

  // ── 4.1 线框：侧栏展开 / 收起
  // 收起后侧栏只有 64 宽，标签只写数，免得被侧栏边裁掉
  MH.seg('wf', (v) => { $('#wf').classList.toggle('closed', v === 'closed'); $('#wf-sw').textContent = v === 'closed' ? '64' : '展开 220'; });

  // ── 4.3 顶栏 = 控件高度 × 2（按 antd 源码的算法画）
  (function () {
    const r = $('#hdr-range');
    if (!r) return;
    const paint = () => {
      const c = +r.value, h = c * 2;
      $('#hdr-v').textContent = c; $('#hdr-o').textContent = h; $('#hdr-h').textContent = h;
      $('#hdr-bar').style.height = h + 'px';
      $('#hdr-btn').style.height = c + 'px';
    };
    r.addEventListener('input', paint); paint();
  })();

  // ── 4.4 菜单自己带的布局：量出来直接标在顶栏、侧栏、菜单上
  (function () {
    if (!$('#lay-live')) return;
    let mode = 'native', sider = 'expanded', kit = 'tdesign';
    const MENU = { antd: '.ant-menu-root', element: '.el-menu', shadcn: '.mh-admin__nav > :first-child', arco: '.arco-menu', tdesign: '.t-default-menu' };
    const read = () => MH.whenLive('#lay-live', (doc) => {
      settle(doc);
      const Q = (sel) => doc.querySelector(sel);
      const head = Q('[data-region=header]'), side = Q('[data-region=sider]'), menu = Q(MENU[kit]), item = Q(part(kit, 'menuItem'));
      // 顶栏下边、侧栏右边各有 1 像素的分隔线：写成「220 + 1」，和开头那张红线一个写法
      const line = (e, sd) => (e ? parseFloat(doc.defaultView.getComputedStyle(e)[`border${sd}Width`]) || 0 : 0);
      const hb = line(head, 'Bottom'), sb = line(side, 'Right');
      const R = (e) => e && e.getBoundingClientRect();
      const h = R(head), s = R(side), m = R(menu), it = R(item);
      const over = m && s ? r1(m.width - (s.width - 1)) : 0;
      // 顶栏的高：尺寸线画在顶栏中间（两头有内容）；侧栏、菜单的宽：在侧栏下部横着量两道，菜单那道比侧栏长出去多少一眼看得见；
      // 第一项：高画在这一项右边、数放右上（第一项的宽在下面的对照格里）；侧栏、菜单两道宽线离底下的「收起」按钮远一点
      const fyOf = (r, y) => (y - r.top) / r.height;
      MH.mark(doc, [
        head && { h: head, fx: 0.5, side: 'r', label: `顶栏 高 ${r1(h.height - hb)}${hb ? ` + ${r1(hb)}` : ''}` },
        side && { w: side, fy: fyOf(s, s.bottom - 90), label: `侧栏 宽 ${r1(s.width - sb)}${sb ? ` + ${r1(sb)}` : ''}` },
        menu && over > 0 && { w: menu, fy: fyOf(m, s.bottom - 170), label: `菜单 宽 ${r1(m.width)}，比侧栏宽 ${over}` },
        item && { h: item, side: 'ru', label: `第一项 高 ${r1(it.height)}` },
      ]);
    });
    const go = () => { $('#lay-name').textContent = title(kit); MH.live('#lay-live').reload(`scene=admin&spec=mono&sider=${sider}&mode=${mode}&kits=${kit}`); };
    MH.seg('laymode', (v) => { mode = v; go(); });
    MH.seg('laysider', (v) => { sider = v; go(); });
    MH.seg('laykit', (v) => { kit = v; go(); });
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'lay-live') setTimeout(read, 500); });
  })();

  // ── 4.7 收起后的子菜单：截图
  (function () {
    const box = $('#fly-libs');
    if (!box) return;
    box.innerHTML = ORDER.map((k) => `<div class="lib"><div class="lab"><b>${KIT[k].name}</b></div><img data-k="${k}" src="assets/img/04-flyout-native-${k}.png" alt="${KIT[k].name} 收起后的子菜单"></div>`).join('');
    MH.seg('flylook', (v) => $$('img', box).forEach((im) => (im.src = `assets/img/04-flyout-${v}-${im.dataset.k}.png`)));
  })();

  // ── 布局组件的户型图：按默认值等比例画（官方文档和对照页实测的数；原来下面那张表的数都并进每张图的小字里了）
  (function () {
    const box = $('#plans');
    if (!box) return;
    const P = [
      ['Ant Design · Layout', 64, 200, '#001529', '#001529', '顶栏 64（控件高度 × 2）· 左右留白 50 · 侧栏 200，收起 80'],
      ['Element Plus · Container', 60, 300, '', '', '顶栏 60 · 左右留白 20 · 侧栏 300，自己不会收起'],
      ['Arco Design · Layout', 21, 200, '', '#232324', '顶栏按内容撑 · 侧栏 200，收起 48'],
      ['TDesign · Layout', 56, 232, '#fff', '#fff', '顶栏 56（文档写 64）· 侧栏 232，收起靠菜单 64'],
      ['shadcn/ui · Sidebar', 0, 256, '', '#fafafa', '没有布局组件，只有侧栏 · 侧栏 256，收起 48'],
      ['这个仓库 · 自己写的布局', 56, 220, '#fff', '#fff', '顶栏 56 · 侧栏 220，收起 64'],
    ];
    // 页面按 1200 × 720 算：整张图的宽高比固定 5:3，顶栏、侧栏按百分比画，手机上缩小也不变形
    const X = (v) => `${(v / 1200) * 100}%`, Y = (v) => `${(v / 720) * 100}%`;
    box.innerHTML = P.map(([n, h, w, hb, sb, cap], i) => `<div class="plan${i === 5 ? ' ours' : ''}"><b>${n}</b><div class="pg">${h ? `<i class="ph" style="height:${Y(h)};${hb ? `background:${hb}` : ''}"></i>` : ''}<i class="ps" style="top:${Y(h)};width:${X(w)};${sb ? `background:${sb}` : ''}"></i><i class="pm" style="top:calc(${Y(h)} + 6px);left:calc(${X(w)} + 6px)"></i></div><span>${cap}</span></div>`).join('');
  })();


  // ── 菜单尺寸、收起后子菜单的弹出位置、悬停显示名称：原来三张表，改成画出来的对照格（MH.dgrid 在 blog.js）
  const LIBS = ORDER.map((id) => KIT[id].name);
  (function () {
    const K = 0.4;
    // 侧栏（虚线是侧栏右边缘）里放菜单和第一项：菜单比侧栏宽，就伸出虚线
    const menu = (side, mw, iw, ih) => `<span class="mn" style="width:${Math.max(side, mw) * K + 4}px"><i class="edge" style="left:${side * K}px"></i><i class="mw" style="width:${mw * K}px"><i class="it" style="width:${iw * K}px;height:${ih * K}px"></i></i></span>`;
    MH.dgrid($('#menu-grid'), [
      { name: '展开', sub: '菜单宽 / 第一项', cells: [[220, 211, 40], [220, 219, 56], [220, 204, 36], [220, 204, 40], [232, 216, 36]].map(([m, w, h]) => ({ draw: menu(220, m, w, h), label: `${m} / ${w}×${h}`, bad: !(m === 220 && w === 204 && h === 36) })), spec: { draw: menu(220, 220, 204, 36), label: '220 / 204×36' } },
      { name: '收起', sub: '菜单宽 / 第一项', cells: [[80, 71, 40], [64, 63, 56], [64, 48, 32], [48, 40, 40], [64, 48, 36]].map(([m, w, h]) => ({ draw: menu(64, m, w, h), label: `${m} / ${w}×${h}`, bad: !(m === 64 && w === 48 && h === 36) })), spec: { draw: menu(64, 64, 48, 36), label: '64 / 48×36' } },
    ], { cols: LIBS });
    // 子菜单弹层离侧栏右边缘多远：负数是压在侧栏上
    const fly = (d) => `<span class="fly"><i class="sd"></i><i class="pp" style="left:${30 + d * 1.5}px"></i></span>`;
    MH.dgrid($('#fly-grid'), [
      { name: '离侧栏右边缘', sub: '按 1.5 倍画', cells: [18, 4, -5, -9, -7].map((d) => ({ draw: fly(d), label: d < 0 ? `${d}（压在侧栏上）` : `${d}`, bad: d !== 4 })), spec: { draw: fly(4), label: '4，顶边和菜单项对齐' } },
      { name: '离菜单项', cells: [8, 6, 4, 12, 2].map((d) => ({ label: `${d}` })), spec: { label: '不按菜单项算' } },
      { name: '等多久弹出', cells: [{ label: '一停上去就出来' }, { label: '0.3 秒，移开也等 0.3 秒', bad: 1 }, { label: '一停上去就出来' }, { label: '一停上去就出来' }, { label: '一停上去就出来' }], spec: { label: '一停上去就出来' } },
      { name: '打断正在打字的框吗', cells: [{ label: '不会' }, { label: '会，焦点被抢走', bad: 1 }, { label: '不会' }, { label: '不会' }, { label: '不会' }], spec: { label: '不会' } },
    ], { cols: LIBS, pick: true });
    // 悬停显示名称：画出提示框
    const tip = (bg, size, r, shadow, arrow) => `<span class="tipd">${arrow ? `<i class="ar" style="border-width:${arrow / 2}px ${arrow / 2}px ${arrow / 2}px 0;border-right-color:${bg}"></i>` : ''}<i class="tp" style="background:${bg};font-size:${size}px;border-radius:${r}px;${shadow ? 'box-shadow:0 6px 16px rgba(0,0,0,.08),0 3px 6px -4px rgba(0,0,0,.12),0 9px 28px 8px rgba(0,0,0,.05)' : ''}">工作台</i></span>`;
    MH.dgrid($('#tip-grid'), [
      { name: '样子', cells: [{ draw: tip('rgba(0,0,0,.85)', 14, 6, 1, 16), label: '85% 黑底、14 号、圆角 6、三层投影', bad: 1 }, { draw: tip('#303133', 12, 4, 0, 10), label: '深灰底、12 号、圆角 4', bad: 1 }, { draw: tip('#171717', 12, 8, 0, 8), label: '深色底、12 号、圆角 8（照官方侧栏拼的）', bad: 1 }, { draw: tip('#1D2129', 14, 2, 0, 8), label: '深灰底、14 号、圆角 2，图标和字一起放进去', bad: 1 }, { draw: tip('#262626', 14, 6, 0, 8), label: '深灰底、14 号、圆角 6', bad: 1 }], spec: { draw: tip('#0A0A0A', 12, 6, 0, 0), label: '深色底、12 号、控件圆角，没有阴影和描边' } },
      { name: '小箭头', cells: [{ label: '16', bad: 1 }, { label: '10', bad: 1 }, { label: '有', bad: 1 }, { label: '8', bad: 1 }, { label: '8', bad: 1 }], spec: { label: '没有' } },
      { name: '位置', cells: [{ label: '菜单项右边 12，居中', bad: 1 }, { label: '菜单项右边 12', bad: 1 }, { label: '贴着菜单项', bad: 1 }, { label: '菜单项右边 12，居中', bad: 1 }, { label: '菜单项右边 16', bad: 1 }], spec: { label: '左边离侧栏右边缘 4，上下居中' } },
    ], { cols: LIBS });
  })();

  // ── 红线：从真页面上量布局，画在页面里（和 Figma 的标注一个意思）
  const RL_CSS = `#mh-rl{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483646}
#mh-rl .b{position:absolute;outline:1.5px dashed #F24E1E;outline-offset:-1px}
#mh-rl .t{position:absolute;font:600 var(--rlf,12px)/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#F24E1E;color:#fff;padding:0 5px;border-radius:3px;white-space:nowrap}
#mh-rl .g{position:absolute;background:#F24E1E}
#mh-rl .g.x{height:1px}#mh-rl .g.y{width:1px}
#mh-rl .g.x::before,#mh-rl .g.x::after{content:'';position:absolute;top:-4px;width:1px;height:9px;background:#F24E1E}
#mh-rl .g.x::before{left:0}#mh-rl .g.x::after{right:0}
#mh-rl .g.y::before,#mh-rl .g.y::after{content:'';position:absolute;left:-4px;width:9px;height:1px;background:#F24E1E}
#mh-rl .g.y::before{top:0}#mh-rl .g.y::after{bottom:0}`;
  // 嵌进来的页面缩小显示时（手机上），标注的字跟着放大，屏幕上至少约 10.5 像素
  const zoomOf = (doc) => { try { return new DOMMatrixReadOnly(getComputedStyle(doc.defaultView.frameElement).transform).a || 1; } catch (e) { return 1; } };
  function redline(doc, base) {
    const font = Math.max(base, Math.round(10.5 / zoomOf(doc)));
    if (!doc.getElementById('mh-rl-css')) { const st = doc.createElement('style'); st.id = 'mh-rl-css'; st.textContent = RL_CSS; doc.head.appendChild(st); }
    let o = doc.getElementById('mh-rl');
    if (!o) { o = doc.createElement('div'); o.id = 'mh-rl'; doc.body.appendChild(o); }
    o.innerHTML = '';
    o.style.setProperty('--rlf', font + 'px');
    const w = doc.defaultView;
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left + w.scrollX, t: r.top + w.scrollY, r: r.right + w.scrollX, b: r.bottom + w.scrollY, w: r.width, h: r.height }; };
    const add = (cls, css, text) => { const d = doc.createElement('div'); d.className = cls; Object.assign(d.style, css); if (text != null) d.textContent = text; o.appendChild(d); return d; };
    const n = (v) => String(Math.round(v * 10) / 10);
    return {
      R,
      // 标签放哪：tl 框里左上（默认）、tr 框里右上、c 正中、b 框里底部左边、cb 跨在底边上、below 框外下方、above 框外上方、{ x, y } 指定左上角
      // nobox：只写名字、不画框（区域的名字；尺寸都画尺寸线，不用框）
      box(r, label, at = 'tl', nobox = false) {
        if (!r) return;
        if (!nobox) add('b', { left: r.l + 'px', top: r.t + 'px', width: r.w + 'px', height: r.h + 'px' });
        if (!label) return;
        const t = add('t', { left: '0px', top: '0px' }, label), tw = t.offsetWidth, th = t.offsetHeight;
        const pos = typeof at === 'object' ? at
          : at === 'tr' ? { x: r.r - tw - 4, y: r.t + 4 }
          : at === 'c' ? { x: r.l + (r.w - tw) / 2, y: r.t + (r.h - th) / 2 }
          : at === 'b' ? { x: r.l + 4, y: r.b - th - 4 }
          : at === 'cb' ? { x: r.l + 40, y: r.b - th / 2 }
          : at === 'below' ? { x: r.l, y: r.b + 4 }
          : at === 'above' ? { x: r.l, y: r.t - th - 4 }
          : { x: r.l + 4, y: r.t + 4 };
        t.style.left = pos.x + 'px';
        t.style.top = pos.y + 'px';
      },
      // 横向间距：数字默认放在线上方；挨着字的小间距用 'left'，数字放到线的左边外面；
      // 两个控件之间的间距用 { above: 控件上沿 }，数字放到控件上沿外面，不压控件；贴着页面右边的用 'end'，数字右边对齐线的右端
      gx(x1, x2, y, label, at) {
        if (x2 - x1 < 0.5) return;
        add('g x', { left: x1 + 'px', top: y + 'px', width: x2 - x1 + 'px' });
        if (at === 'left') { const t = add('t', { left: '0px', top: y - font * 0.75 + 'px' }, label ?? n(x2 - x1)); t.style.left = x1 - t.offsetWidth - 6 + 'px'; return t; }
        if (at === 'end') { const t = add('t', { left: '0px', top: y - font * 1.7 + 'px' }, label ?? n(x2 - x1)); t.style.left = x2 - t.offsetWidth + 'px'; return t; }
        if (at === 'below') return add('t', { left: (x1 + x2) / 2 + 'px', top: y + 4 + 'px', transform: 'translateX(-50%)' }, label ?? n(x2 - x1));
        if (at && at.above != null) { const t = add('t', { left: (x1 + x2) / 2 + 'px', top: '0px', transform: 'translateX(-50%)' }, label ?? n(x2 - x1)); t.style.top = at.above - t.offsetHeight - 3 + 'px'; return t; }
        return add('t', { left: (x1 + x2) / 2 + 'px', top: y - font * 1.7 + 'px', transform: 'translateX(-50%)' }, label ?? n(x2 - x1));
      },
      // 竖向间距：数字放在线的右边；间距比数字还矮（比如名字和输入框之间的 8）就放到线的上端旁边，不压下面的框
      //   at='below'：放到线的下端旁边（上面是输入框、下面是下一项名字的时候）
      gy(y1, y2, x, label, at) { if (y2 - y1 < 0.5) return; add('g y', { left: x + 'px', top: y1 + 'px', height: y2 - y1 + 'px' }); const small = y2 - y1 < font * 1.6; add('t', { left: x + 6 + 'px', top: (small ? (at === 'below' ? y2 : y1 - font * 1.55) : (y1 + y2) / 2 - font * 0.75) + 'px' }, label ?? n(y2 - y1)); },
    };
  }
  // 控件真正画出来的范围：自己和里面所有看得见的元素的并集（有的库原生档里的框比外面的容器宽）
  const outer = (k, el) => [el, ...el.querySelectorAll('*')].map((e) => k.R(e)).filter((r) => r.w > 0 && r.h > 0).reduce((u, r) => (u ? { l: Math.min(u.l, r.l), t: Math.min(u.t, r.t), r: Math.max(u.r, r.r), b: Math.max(u.b, r.b) } : { ...r }), null);
  const wh = (r) => r && Object.assign(r, { w: r.r - r.l, h: r.b - r.t });
  // 只改嵌入的显示：往检查页里加一段样式（同一个 id 只加一次）
  const inject = (doc, id, css) => { if (!doc.getElementById(id)) { const st = doc.createElement('style'); st.id = id; st.textContent = css; doc.head.appendChild(st); } };
  // 检查页里后台框架是固定高度、内容区自己滚动：原生档表格行变高以后，卡片下半截在滚动区外面。把框架高度放开，整张卡片露出来
  const TALL = '.ex-list,.mh-admin{height:auto!important}.mh-admin__main{overflow:visible!important;height:auto!important}';
  // 只看一张卡片时：别的都不画，裁切框边上不露出半截邻居
  const SOLO = (sel) => `.ex-list{visibility:hidden}${sel}{visibility:visible}`;
  const bw = (el, side) => parseFloat(el.ownerDocument.defaultView.getComputedStyle(el)[`border${side}Width`]) || 0;
  const textBox = (doc, el) => { const rg = doc.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); const w = doc.defaultView; return { l: r.left + w.scrollX, t: r.top + w.scrollY, r: r.right + w.scrollX, b: r.bottom + w.scrollY, w: r.width, h: r.height }; };
  const DRAW = {
    page(doc) {
      inject(doc, 'mh-rl-tall', TALL);
      const k = redline(doc, 15), $d = (s) => doc.querySelector(s);
      const header = $d('[data-region=header]'), sider = $d('[data-region=sider]'), bc = $d('[data-region=breadcrumb]'), head = $d('[data-region=page-head]') || $d('.mh-admin__page-head'), filter = $d('.mh-list__filter'), panel = $d('.mh-list__panel'), main = $d('.mh-admin__main');
      const H = k.R(header), S = k.R(sider), B = k.R(bc), P = k.R(head), F = k.R(filter), T = k.R(panel), M = k.R(main);
      if (!H || !F) return;
      // 顶栏的高、侧栏的宽：尺寸线（顶栏中间是空的；侧栏下部菜单下面是空的）
      k.gy(H.t, H.b - bw(header, 'Bottom'), H.l + H.w * 0.5, `顶栏 ${Math.round(H.h - bw(header, 'Bottom'))} + 1`);
      k.gx(S.l, S.r - bw(sider, 'Right'), S.b - 110, `侧栏 ${Math.round(S.w - bw(sider, 'Right'))} + 1`);
      k.gx(S.r, F.l, F.t + F.h / 2);
      k.gx(T.r, M.r - (main.offsetWidth - main.clientWidth), T.t + 60, null, 'end');
      if (B) k.gy(H.b, B.t, B.l + 120);
      // 标题说明和筛选栏之间只有 16，数字标在线的上方：挪到说明文字的右边，不压字
      if (P) { const ds = head.querySelector('.mh-admin__desc'); k.gy(P.b, F.t, ds ? Math.max(F.l + 120, textBox(doc, ds).r + 28) : F.l + 120); }
      k.gy(F.b, T.t, F.l + 120);
      // 筛选栏：放在最后一个输入框和按钮之间的空处；表格卡片：放在工具条右边的空处
      const fk = [...filter.children].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 2 && r.height > 2; }).map((c) => outer(k, c)), act = fk[fk.length - 1], last = fk[fk.length - 2];
      k.box(F, '筛选栏', act && last && act.l - last.r > 80 ? { x: last.r + 12, y: F.t + (F.h - 18) / 2 } : 'below', true);
      k.box(T, '表格卡片', 'tr', true);
    },
    filter(doc) {
      inject(doc, 'mh-rl-solo', SOLO('.mh-list__filter'));
      const k = redline(doc, 12), f = doc.querySelector('.mh-list__filter');
      if (!f) return;
      // shadcn/ui 的选择框旁边还有一个给表单用的隐藏 select（1 × 1），不算
      const F = k.R(f), kids = [...f.children].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 2 && r.height > 2; }).map((c) => [c, wh(outer(k, c))]);
      const [[, a], [, b], [, c], [act, d]] = kids;
      const up = { above: Math.min(a.t, b.t, c.t, d.t) };
      k.gx(F.l + bw(f, 'Left'), a.l, a.t + a.h / 2, null, 'left');
      k.gy(F.t + bw(f, 'Top'), a.t, a.l + 40);
      // 输入框、日期框的宽：尺寸线画在框下面
      k.gx(a.l, a.r, a.b + 6, `${Math.round(a.w)}`, 'below'); k.gx(c.l, c.r, c.b + 6, `${Math.round(c.w)}`, 'below');
      k.gx(a.r, b.l, a.t + a.h / 2, null, up); k.gx(b.r, c.l, a.t + a.h / 2, null, up);
      const btns = [...act.querySelectorAll('button')].map((x) => k.R(x));
      if (btns[1]) k.gx(btns[0].r, btns[1].l, d.t + d.h / 2, null, up);
      k.gx(d.r, F.r - bw(f, 'Right'), d.t + d.h / 2, null, up);
    },
    panel(doc) {
      inject(doc, 'mh-rl-tall', TALL);
      inject(doc, 'mh-rl-solo', SOLO('.mh-list__panel'));
      const k = redline(doc, 12), p = doc.querySelector('.mh-list__panel');
      if (!p) return;
      const bar = p.querySelector('.mh-list__bar'), pag = p.querySelector('.mh-list__pagination'), table = p.querySelector('[data-region=table]');
      const BR = k.R(bar), PG = k.R(pag), TB = k.R(table);
      const bt = textBox(doc, bar), pc = k.R(pag.firstElementChild);
      k.gy(BR.t, BR.b, BR.r - 60, `工具条 ${Math.round(BR.h)}`);
      k.gx(BR.l, bt.l, BR.t + BR.h / 2, null, 'left');
      k.box(TB, '表格 · 组件库画', { x: TB.l + 200, y: TB.b - 30 }, true);
      k.gy(PG.t + bw(pag, 'Top'), PG.b, PG.l + 160, `分页条 ${Math.round(PG.h - bw(pag, 'Top'))} + 1`);
      // 表格和分页条之间那个 12：数字放在线的下端旁边，不压表格最后一行的字
      if (pc) { k.gx(pc.r, PG.r, pc.t + pc.h / 2); k.gy(PG.t + bw(pag, 'Top'), pc.t, pc.l - 48, null, 'below'); }
    },
    dialog(doc, kit) {
      const k = redline(doc, 12);
      const dlg = $$(part(kit, 'dialog'), doc).find((e) => e.getBoundingClientRect().width > 0);
      const form = dlg && dlg.querySelector('.mh-form');
      if (!form) return;
      const D = k.R(dlg), items = [...form.children].filter((e) => e.classList.contains('mh-form__item') || e.classList.contains('mh-form__row'));
      const I = items.map((e) => k.R(e));
      k.gx(D.l, D.r, D.t - 12, `对话框 宽 ${Math.round(D.w)}`);
      k.gx(D.l, I[0].l, I[0].t + 12, null, 'left');
      const lb1 = items[1] && items[1].querySelector('.mh-form__label');
      if (I[1]) k.gy(I[0].b, I[1].t, lb1 ? textBox(doc, lb1).r + 14 : I[0].l + 160, null, 'below');
      const lbl = form.querySelector('.mh-form__label'), ctl = lbl && lbl.nextElementSibling;
      if (ctl) k.gy(k.R(lbl).b, k.R(ctl).t, textBox(doc, lbl).r + 14);
      const row = form.querySelector('.mh-form__row');
      if (row && row.children[1]) { const a = k.R(row.children[0]), b = k.R(row.children[1]); k.gx(a.r, b.l, Math.max(a.b, b.b) + 5, null, 'below'); }
      const foot = dlg.querySelector('[data-region=dialog-footer]') || dlg.querySelector('.mh-form__footer');
      const btns = foot ? [...foot.querySelectorAll('button')].map((x) => k.R(x)) : [];
      if (btns[1]) { const y = btns[0].t + btns[0].h / 2, up = { above: Math.min(...btns.map((x) => x.t)) }; k.gx(btns[0].r, btns[1].l, y, null, up); k.gx(btns[btns.length - 1].r, D.r, y, null, up); }
    },
  };
  // 手机上红线框里左右滑：右边还有没滑到的，右边缘淡出去
  $$('.rl-sc').forEach((sc) => {
    const edge = () => sc.classList.toggle('more', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4);
    sc.addEventListener('scroll', edge, { passive: true });
    addEventListener('resize', edge);
    if (window.ResizeObserver) new ResizeObserver(edge).observe(sc.firstElementChild);
    edge();
  });
  const RL = { 'rl-page': ['rlkit', 'rlmode', 'rl-name'], 'rl-filter': ['fkit', 'fmode'], 'rl-panel': ['pkit', 'pmode'], 'rl-dialog': ['dkit', 'dmode'] };
  Object.entries(RL).forEach(([id, [segKit, segMode, nameId]]) => {
    const box = document.getElementById(id);
    if (!box) return;
    let kit = 'antd', mode = 'aligned';
    const kind = box.dataset.rl;
    const draw = () => MH.whenLive('#' + id, (doc) => {
      settle(doc);
      if (kind === 'dialog') {
        if (!doc.querySelector('.mh-form')) {
          const edit = doc.querySelector('[data-region=table] [aria-label^="编辑"]');
          if (edit) edit.click();
          return setTimeout(draw, 900);
        }
        box.dataset.focus = part(kit, 'dialog');
        MH.live(box).fit();
      }
      DRAW[kind](doc, kit);
    });
    const go = () => { delete box.dataset.focusDone; if (kind === 'dialog') delete box.dataset.focus; if (nameId) $('#' + nameId).textContent = title(kit); MH.live(box).reload(`scene=customers&spec=mono&state=default&mode=${mode}&kits=${kit}`); };
    MH.seg(segKit, (v) => { kit = v; go(); });
    MH.seg(segMode, (v) => { mode = v; go(); });
    document.addEventListener('mh:live', (e) => {
      if (e.detail.box.id !== id) return;
      setTimeout(draw, 500);
      setTimeout(() => { if (kind !== 'dialog') draw(); }, 1600);
      // 样式晚到、换了外观以后页面变高：红线跟着重画
      try {
        const d = e.detail.doc, w = d.defaultView, root = d.querySelector('.audit') || d.body;
        let last = '', tm = 0;
        new w.ResizeObserver(() => { const r = root.getBoundingClientRect(), key = Math.round(r.width) + 'x' + Math.round(r.height); if (key === last) return; last = key; clearTimeout(tm); tm = setTimeout(() => { if (kind !== 'dialog') draw(); }, 250); }).observe(root);
      } catch {}
    });
  });

  // ═══════════ 04-2 共用：读真页面里页面记着的状态（检查页的 __audit.snapshot），画成一条「账」 ═══════════
  // 同一个 id 的样式：有就换内容，没有就加（inject 只能加一次）
  const setCss = (doc, id, css) => { let st = doc.getElementById(id); if (!st) { st = doc.createElement('style'); st.id = id; doc.head.appendChild(st); } if (st.textContent !== css) st.textContent = css; };
  // 看得见的：匹配 sel、显示着、有宽度
  const shown = (root, sel) => (sel ? $$(sel, root).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && (!e.checkVisibility || e.checkVisibility()); }) : []);
  // 盯着一张嵌进来的真页面：进视口才读（每 150ms），离开就停；页面里点一下、打一个字，60ms 后补读一次。读到的变了才调 on(新, 旧)
  const watch = (box, read, on) => {
    let last = '', timer = 0, seen = false;
    const tick = () => { let v; try { const d = MH.live(box).doc(); v = d && d.defaultView.__audit && read(d.defaultView.__audit, d); } catch (e) {} if (v === undefined) return; const k = JSON.stringify(v); if (k !== last) { const old = last ? JSON.parse(last) : null; last = k; on(v, old); } };
    new IntersectionObserver((es) => es.forEach((en) => { seen = en.isIntersecting; clearInterval(timer); if (seen) timer = setInterval(tick, 150); })).observe(box);
    document.addEventListener('mh:live', (e) => { if (e.detail.box !== box) return; last = ''; const d = e.detail.doc; if (!d._mh04) { d._mh04 = 1; ['click', 'input', 'change'].forEach((t) => d.addEventListener(t, () => setTimeout(tick, 60), true)); } setTimeout(tick, 300); });
    return { tick, reset() { last = ''; } };
  };
  // 一条账：rows = [[键, 名字, 值, 红不红]]。头一回画出来，以后只改值；值变了这一格闪一下、小拨闸翻一下
  const ledger = (ul, rows) => {
    if (!ul) return;
    rows.forEach(([k, name, val, bad]) => {
      let li = ul.querySelector(`li[data-k="${k}"]`);
      if (!li) { li = document.createElement('li'); li.dataset.k = k; li.innerHTML = `<i class="lv"></i><span>${esc(name)}</span><b></b>`; ul.appendChild(li); }
      const b = li.querySelector('b'), v = String(val);
      if (b.textContent !== v) {
        if (b.textContent) { li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); li.querySelector('.lv').classList.toggle('down'); setTimeout(() => li.classList.remove('flash'), 800); }
        b.textContent = v;
      }
      li.classList.toggle('bad', !!bad);
    });
  };
  // 把真页面的状态清回初始：检查页的 reset 要等两帧画面，标签页在后台时不出帧，最多等 0.8 秒
  const resetLive = (doc) => Promise.race([Promise.resolve().then(() => doc.defaultView.__audit.reset()), new Promise((r) => setTimeout(r, 800))]).catch(() => {});
  // 刚变了的几样：add([[键, 牌子上的字, …]])。900ms 内接连变的算同一次（查询以后「加载中 → 已显示」），过 6 秒自己收掉；变了就调 on()
  const recent = (on) => {
    let items = new Map(), t0 = 0, tm = 0;
    return {
      add(list) {
        if (!list.length) return;
        const now = Date.now();
        if (now - t0 > 900) items = new Map();
        t0 = now;
        list.forEach((x) => items.set(x[0], x));
        clearTimeout(tm);
        tm = setTimeout(() => { items = new Map(); on(); }, 6000);
        on();
      },
      list: () => [...items.values()],
      clear() { clearTimeout(tm); items = new Map(); on(); },
    };
  };
  const STATUS = { all: '全部状态', potential: '潜在', active: '活跃', silent: '沉默', lost: '流失' };
  const NAV = { workbench: '工作台', customers: '客户管理', 'customer-list': '客户列表', 'lead-pool': '线索池', contacts: '联系人', sales: '销售推进', pipeline: '商机管道', contracts: '合同与续约', analytics: '经营分析', settings: '系统设置' };
  const ACT = { profile: '个人中心', preferences: '账号设置', 'sign-out': '退出登录' };
  // 客户名照 core/src/customers/data.ts 拼：KH-0002 是杭州星河供应链有限公司
  const CITIES = ['上海', '杭州', '苏州', '南京', '深圳', '广州', '成都', '武汉', '北京', '厦门'], WORDS = ['云帆', '启明', '恒信', '星河', '远景', '青禾', '海川', '致远', '博纳', '嘉禾'], KINDS = ['科技', '医疗器械', '供应链', '新材料', '教育科技'];
  const NAME = (key) => { const i = +String(key).replace(/\D/g, '') - 1; return i < 0 ? key : `${CITIES[i % 10]}${WORDS[(i * 3 + Math.floor(i / 10)) % 10]}${KINDS[(i * 7) % 5]}有限公司`; };
  const md = (d) => String(d).slice(5);
  const rg = (r) => (r && r[0] ? `${md(r[0])} 至 ${md(r[1])}` : '');
  const libName = (id) => KIT[id].name;

  // ── 04-2 开头：两个组件库共用一份状态（检查页带 shared=yes，五个库共用一个控制器；只露 Ant Design 和下面选的那个）
  //   宽屏左右并排、窄屏上下排，账和两张表一屏看全：只留账上那几样（搜索框、状态框、排序、勾选、分页），
  //   日期范围和负责人、最近跟进、重点客户、操作四列藏起来，表格只留三行
  //   （shadcn/ui 的排序按钮往右伸出 12，原来后面还有列看不出；年度金额成了最后一列，右边多留 4，不出横向滚动条）
  (function () {
    const box = $('#one-live');
    if (!box) return;
    let lib = 'element', who = '';
    const SLIM = `.audit{align-items:flex-start!important;flex-wrap:nowrap!important;gap:24px!important}
.audit__cell{width:580px!important;min-width:0!important;flex:none!important}
.audit__cell .mh-root,.audit__cell .mh-admin,.audit__cell .ex-list{width:auto!important;min-width:0!important;max-width:none!important}
.ex-list,.mh-admin{height:auto!important}.mh-admin__main{overflow:visible!important;height:auto!important}
[data-region=header],[data-region=sider],[data-region=breadcrumb],[data-region=page-head],.mh-admin__page-head{display:none!important}
.mh-list__range{display:none!important}.mh-list__keyword{width:160px!important}
[data-region=table] tbody tr:nth-child(n+4){display:none!important}
[data-region=table] :is(th,td,col):is(:nth-child(4),:nth-child(6),:nth-child(7),:nth-child(8)){display:none!important}
[data-region=table] table{width:100%!important;min-width:0!important}[data-region=table] col:nth-child(2){width:auto!important}
[data-audit-cell=shadcn] [data-region=table] :is(th,td):nth-child(5){padding-right:12px!important}
.audit__cell>p{display:block!important;margin:0 0 8px!important;font:600 15px/1.4 -apple-system,'PingFang SC',sans-serif!important;color:#0a0a0a!important}
[data-audit-cell=antd]>p::after,[data-audit-cell=arco]>p::after,[data-audit-cell=shadcn]>p::after{content:' · React';font-weight:400;color:#737373}
[data-audit-cell=element]>p::after,[data-audit-cell=tdesign]>p::after{content:' · Vue';font-weight:400;color:#737373}`;
    // 两格并排要约 1210 宽：容器窄于 760 时并排就缩得太小，改上下排
    const DIR = () => `.audit{flex-direction:${box.clientWidth >= 760 ? 'row' : 'column'}!important}`;
    const VIS = (l) => `.audit__cell:not([data-audit-cell=antd]):not([data-audit-cell=${l}]){display:none!important}`;
    const rows = (s) => {
      const q = [s.filters.keyword && `「${s.filters.keyword}」`, s.filters.status !== 'all' && STATUS[s.filters.status], rg(s.filters.range)].filter(Boolean);
      const sort = s.sort ? (s.sort.key === 'amount' ? `金额${s.sort.order === 'asc' ? '从小到大' : '从大到小'}` : `跟进${s.sort.order === 'asc' ? '从早到晚' : '从晚到早'}`) : '没有';
      const n = s.selected.length;
      return [
        ['kw', '搜索框里填的', s.draft.keyword ? `「${s.draft.keyword}」` : '空'],
        ['st', '状态框里选的', STATUS[s.draft.status] || s.draft.status],
        ['q', '已经查询的', q.length ? q.join(' · ') : '全部客户'],
        ['sort', '排序', sort],
        ['page', '第几页', s.page],
        // 只写行数（勾的是哪一行，表上看得到），账上一格放得下
        ['sel', '勾了', `${n} 行`],
        ['list', '列表', { ready: '已显示', loading: '加载中', error: '出错' }[s.status] || s.status],
      ];
    };
    const led = $('#one-led'), lastP = $('#one-last');
    ledger(led, rows({ draft: { keyword: '', status: 'all' }, filters: { keyword: '', status: 'all', range: null }, sort: null, page: 1, selected: [], status: 'ready' }));
    // 账上变了的那几样，两张表上同一个位置各钉一块牌子（「状态框里选的：活跃」）
    const changed = recent(() => draw());
    const w = watch(box, (A) => A.snapshot('antd'), (s, old) => {
      ledger(led, rows(s));
      if (!old) return;
      if (who) lastP.textContent = `刚才在 ${libName(who)} 上操作，两张一起变。`;
      const was = Object.fromEntries(rows(old).map(([k, , v]) => [k, String(v)]));
      changed.add(rows(s).filter(([k, , v]) => was[k] !== String(v)).map(([k, name, v]) => [k, `${name}：${v}`]));
    });
    // 弹层只在点的那一格开着：钉一块牌子
    const pops = (doc) => ['antd', lib].flatMap((k) => { const c = doc.querySelector(`[data-audit-cell="${k}"]`); const p = c && [...shown(c, part(k, 'popup')), ...shown(c, part(k, 'datePopup'))][0]; return p ? [{ pin: p, label: '弹层开着：只有这一格自己记着', ok: true, place: 'r' }] : []; });
    let hoverKey = '';
    const filterBtn = (c, t) => $$('[data-region=filter] button', c).find((b) => b.textContent.replace(/\s/g, '') === t);
    const PICK = {
      kw: (c) => c.querySelector('.mh-list__keyword') || c.querySelector('[data-region=filter] input'),
      st: (c, k) => shown(c.querySelector('[data-region=filter]') || c, part(k, 'select'))[0],
      q: (c) => filterBtn(c, '查询') || c.querySelector('[data-region=filter]'),
      sort: (c, k) => shown(c, part(k, 'tableSort'))[0] || c.querySelector('[data-region=table] th[aria-sort]'),
      page: (c, k) => shown(c, part(k, 'pageItem')).find((e) => /^\d+$/.test(e.textContent.trim()) && (e.matches('[aria-current], .is-active, .active, [class*=-active], [class*=current]') || e.querySelector('[aria-current]'))) || c.querySelector('[data-region=pagination]'),
      sel: (c, k) => shown(c.querySelector('[data-region=table] tbody') || c, part(k, 'checkbox')).filter((e) => !e.closest('[role=switch]') && e.getAttribute('role') !== 'switch')[0],
      list: (c) => c.querySelector('[data-region=toolbar]') || c.querySelector('[data-region=table]'),
    };
    const draw = () => MH.whenLive('#one-live', (doc) => {
      const marks = [];
      const both = (key, label) => ['antd', lib].forEach((k) => { const c = doc.querySelector(`[data-audit-cell="${k}"]`), el = c && PICK[key] && PICK[key](c, k); if (el) marks.push({ pin: el, label, ok: true }); });
      // 鼠标停在账上那一项：两张表各钉一块牌子（并排时连一根线会横穿左边那张）
      if (hoverKey) both(hoverKey, (led.querySelector(`li[data-k="${hoverKey}"] span`) || {}).textContent);
      else changed.list().forEach(([k, label]) => both(k, label));
      MH.mark(doc, marks.concat(pops(doc)));
    });
    led.addEventListener('pointerover', (e) => { const li = e.target.closest('li'); if (li && li.dataset.k !== hoverKey) { hoverKey = li.dataset.k; draw(); } });
    led.addEventListener('pointerleave', () => { hoverKey = ''; draw(); });
    document.addEventListener('mh:live', (e) => {
      if (e.detail.box !== box) return;
      const doc = e.detail.doc;
      setCss(doc, 'one-slim', SLIM);
      setCss(doc, 'one-dir', DIR());
      setCss(doc, 'one-vis', VIS(lib));
      MH.live(box).fit();
      [300, 1200].forEach((t) => setTimeout(() => MH.live(box).fit(), t));
      ['click', 'pointerup'].forEach((t) => doc.addEventListener(t, (ev) => { const c = ev.target.closest && ev.target.closest('[data-audit-cell]'); if (c) who = c.dataset.auditCell; setTimeout(draw, 320); }, true));
    });
    addEventListener('resize', () => { const d = MH.live(box).doc(); if (d && d.querySelector('.audit')) { setCss(d, 'one-dir', DIR()); MH.live(box).fit(); } });
    // 「▶ 走一遍」：五步在两张表上轮流做；每一步变了什么，两张表上一起钉出来（上面 changed 自己会钉）
    const fig = $('#one'), pause = (ms) => new Promise((r) => setTimeout(r, ms));
    let busy = false;
    const STEPS = () => [
      ['antd', '搜「科技」', (A, c) => A.type(c.querySelector('.mh-list__keyword input') || c.querySelector('[data-region=filter] input'), '科技')],
      [lib, '点查询', (A, c) => A.click(filterBtn(c, '查询'))],
      ['antd', '按金额排序', (A, c) => A.click(PICK.sort(c, 'antd'))],
      [lib, '勾第一行', (A, c) => A.click(PICK.sel(c, lib))],
      ['antd', '翻到第 2 页', (A, c) => A.click(shown(c, part('antd', 'pageItem')).find((e) => e.textContent.trim() === '2'))],
    ];
    const paintSteps = () => { $('#one-steps').innerHTML = STEPS().map(([on, t], k) => `<li><i>${k + 1}</i><span>${libName(on)}</span><b>${t}</b></li>`).join(''); };
    const play = () => MH.whenLive('#one-live', async (doc) => {
      if (busy) return;
      busy = true;
      $$('[data-one]', fig).forEach((b) => (b.disabled = true));
      paintSteps();
      await resetLive(doc);
      changed.clear();
      lastP.textContent = '';
      await pause(500);
      const A = MH.hands(doc), lis = $$('#one-steps li');
      for (const [k, [on, , run]] of STEPS().entries()) {
        lis.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', j < k); });
        try { await run(A, doc.querySelector(`[data-audit-cell="${on}"]`)); } catch (e) {}
        await pause(1600);
      }
      lis.forEach((li) => { li.classList.remove('on'); li.classList.add('done'); });
      A.park();
      busy = false;
      $$('[data-one]', fig).forEach((b) => (b.disabled = false));
    });
    fig.addEventListener('click', (e) => {
      const b = e.target.closest('[data-one]');
      if (!b) return;
      if (b.dataset.one === 'play') return play();
      paintSteps();
      lastP.textContent = '';
      MH.whenLive('#one-live', async (doc) => { await resetLive(doc); changed.clear(); });
    });
    MH.seg('onelib', (v) => {
      lib = v;
      if (!busy) paintSteps();
      MH.whenLive('#one-live', (doc) => { setCss(doc, 'one-vis', VIS(lib)); MH.live(box).fit(); draw(); });
      lastP.textContent = `另一张换成了 ${libName(v)}，页面记着的没变。`;
    });
    paintSteps();
  })();

  // ── 04-2「页面管理的状态与组件库内部的状态」：侧栏收起的真后台（五个库一起挂、共用一份状态，只露选的那一个），右边两条账：
  //   深色的读 snapshot（页面记着的）；虚线的看真页面上组件库自己的弹层开没开、鼠标停在哪个菜单项上（组件库自己记着的）。
  //   哪一样变了，就钉在真后台上：页面记着的黑牌子、组件库自己记着的灰牌子。「▶ 走一遍」：点「经营分析」→ 停在「销售推进」上 → 换下一个库
  (function () {
    const fig = $('#own'), box = $('#own-live');
    if (!fig || !box) return;
    let lib = 'tdesign', hoverEl = null, S = null, busy = false;
    const LIBS = ['tdesign', 'element', 'antd', 'arco', 'shadcn'];
    const next = () => LIBS[(LIBS.indexOf(lib) + 1) % LIBS.length];
    const ICONS = ['工作台', '客户管理', '销售推进', '经营分析', '系统设置'];
    // 菜单项在收起的侧栏里落在第几个图标上
    const TOP = { workbench: 0, customers: 1, 'customer-list': 1, 'lead-pool': 1, contacts: 1, sales: 2, pipeline: 2, contracts: 2, analytics: 3, settings: 4 };
    const pageRows = (s) => [
      ['c', '侧栏收起没有', s.collapsed ? '收起' : '展开'],
      ['sel', '选中哪一项', NAV[s.selected] || s.selected],
      ['open', '哪些子菜单展开', s.open.length ? s.open.map((k) => NAV[k] || k).join('、') : '（空）'],
      ['act', '最后点了哪个操作', s.lastAction ? ACT[s.lastAction] || s.lastAction : '没有'],
    ];
    const pageLed = $('#own-page'), kitLed = $('#own-kit'), lastP = $('#own-last');
    ledger(pageLed, pageRows({ collapsed: true, selected: 'customer-list', open: ['customers'], lastAction: null }));
    const kitRows = (pop, at) => [['pop', '弹层开没开', pop], ['at', '鼠标停在哪', at]];
    ledger(kitLed, kitRows('都关着', '不在菜单上'));
    const cellOf = (doc) => doc.querySelector(`[data-audit-cell="${lib}"]`);
    const navEl = (cell, key) => {
      if (!cell || !key) return null;
      const vis = shown(cell.querySelector('[data-region=sider]') || cell, part(lib, 'menuItem'));
      return vis.find((e) => (e.innerText || '').trim().split('\n')[0] === NAV[key]) || (S && S.collapsed ? vis[TOP[key]] : null);
    };
    const popEl = (cell) => [...shown(cell, part(lib, 'menuPopup')), ...shown(cell, part(lib, 'tooltip')), ...shown(cell, part(lib, 'dropdown'))][0];
    // 每一样钉在哪
    const AT = {
      c: (c) => c.querySelector('[data-region=sider] button[aria-label$="侧栏"]') || [...c.querySelectorAll('[data-region=sider] button')].pop(),
      sel: (c) => navEl(c, S && S.selected),
      open: (c) => navEl(c, S && S.open[S.open.length - 1]),
      act: (c) => [...c.querySelectorAll('[data-region=header] *')].find((e) => !e.children.length && e.textContent.trim() === '顾清和'),
      pop: (c) => popEl(c),
      at: (c) => hoverEl && c.contains(hoverEl) && hoverEl.closest(part(lib, 'menuItem')),
    };
    // 变了的几样：[键, 牌子上的字, 黑 / 灰, 钉在哪（不给就照 AT）]
    const changed = recent(() => draw());
    const draw = () => MH.whenLive('#own-live', (doc) => {
      const c = cellOf(doc);
      // 菜单项钉在它右边缘、上下居中（钉在顶边，收起的侧栏里看着像指着上一个图标）；弹层开着时它就在图标右边：
      //   「鼠标停在哪」的牌子放图标上方，「弹层」的牌子钉在弹层右边中间（右边是空的内容区），都不压弹层里的字
      const opened = changed.list().some(([k]) => k === 'pop') && popEl(c);
      MH.mark(doc, c ? changed.list().map(([k, label, ok, at]) => {
        const el = (at || AT[k])(c);
        if (!el) return null;
        if (k === 'pop' && el === opened) return { pin: el, on: 'fill', fx: 0.98, fy: 0.5, label, ok, place: 'r' };
        if (el.matches(part(lib, 'menuItem'))) return { pin: el, on: 'fill', fx: 0.96, fy: 0.5, label, ok, place: opened ? 'up' : 'r' };
        return { pin: el, label, ok, place: 'r' };
      }).filter(Boolean) : []);
    });
    const diff = (rows, old, ok) => { const was = Object.fromEntries(old.map(([k, , v]) => [k, v])); return rows.filter(([k, , v]) => was[k] !== v).map(([k, name, v]) => [k, `${name}：${v}`, ok]); };
    watch(box, (A) => A.snapshot(lib), (s, old) => { S = s; ledger(pageLed, pageRows(s)); if (old) changed.add(diff(pageRows(s), pageRows(old), true)); });
    // 组件库自己记着的：从真页面上看。变回「都关着」「不在菜单上」不钉（没东西可钉），只把钉着的旧牌子收掉
    let kitLast = kitRows('都关着', '不在菜单上');
    const readKit = () => MH.whenLive('#own-live', (doc) => {
      const cell = cellOf(doc);
      if (!cell) return;
      const pop = shown(cell, part(lib, 'menuPopup')).length ? '子菜单弹层开着' : shown(cell, part(lib, 'tooltip')).length ? '名字提示开着' : shown(cell, part(lib, 'dropdown')).length ? '用户菜单开着' : '都关着';
      let at = '不在菜单上';
      const it = AT.at(cell);
      if (it) {
        const txt = (it.innerText || '').trim().split('\n')[0];
        if (txt) at = txt;
        else { const vis = shown(cell.querySelector('[data-region=sider]') || cell, part(lib, 'menuItem')); const n = vis.indexOf(it); at = ICONS[n] || '菜单上'; }
      }
      const rows = kitRows(pop, at), ch = diff(rows, kitLast, null);
      kitLast = rows;
      ledger(kitLed, rows);
      const add = ch.filter(([, label]) => !/都关着|不在菜单上/.test(label));
      if (add.length) changed.add(add); else if (ch.length) draw();
    });
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(readKit, 250); };
    const SMALL = '.ex-admin{width:560px!important;height:460px!important}.audit__cell>p{display:none!important}';
    const VIS = () => `.audit__cell:not([data-audit-cell=${lib}]){display:none!important}`;
    document.addEventListener('mh:live', (e) => {
      if (e.detail.box !== box) return;
      const doc = e.detail.doc;
      setCss(doc, 'own-small', SMALL);
      setCss(doc, 'own-vis', VIS());
      MH.live(box).fit();
      doc.addEventListener('pointerover', (ev) => { hoverEl = ev.target; later(); }, true);
      doc.addEventListener('pointerout', (ev) => { if (!ev.relatedTarget) hoverEl = null; later(); }, true);
      doc.addEventListener('click', later, true);
      doc.documentElement.addEventListener('pointerleave', () => { hoverEl = null; later(); });
      setTimeout(readKit, 400);
    });
    const show = (v) => {
      lib = v;
      MH.whenLive('#own-live', (doc) => { setCss(doc, 'own-vis', VIS()); MH.live(box).fit(); hoverEl = null; readKit(); });
      lastP.textContent = `换成了 ${libName(v)}：页面记着的没变，组件库自己记着的从头来。`;
    };
    // 「▶ 走一遍」
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const STEPS = () => [
      [libName(lib), '点「经营分析」'],
      [libName(lib), '鼠标停在「销售推进」上'],
      [`${libName(lib)} → ${libName(next())}`, '换组件库'],
    ];
    const paintSteps = () => { $('#own-steps').innerHTML = STEPS().map(([a, b], k) => `<li><i>${k + 1}</i><span>${a}</span><b>${b}</b></li>`).join(''); };
    const play = () => MH.whenLive('#own-live', async (doc) => {
      if (busy) return;
      busy = true;
      $$('[data-own]', fig).forEach((b) => (b.disabled = true));
      paintSteps();
      const to = next();
      await resetLive(doc);
      changed.clear();
      await pause(500);
      const A = MH.hands(doc), lis = $$('#own-steps li');
      const on = (k) => lis.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', j < k); });
      try {
        on(0);
        await A.click(navEl(cellOf(doc), 'analytics'));
        await pause(1800);
        on(1);
        await A.hover(navEl(cellOf(doc), 'sales'), { after: 900 });
        readKit();
        await pause(2000);
        on(2);
        A.park();
        const b = $(`.seg[data-ctl="ownlib"] button[data-v="${to}"]`);
        if (b) b.click();
        await pause(700);
        // 换了库：页面记着的一样没变（不会自己钉），这里补钉两块：选中的还是那一项；弹层从头来
        changed.add([['sel', `选中哪一项：${NAV[S.selected] || S.selected}（没变）`, true], ['pop', '弹层：都关着（从头来）', null, (c) => navEl(c, 'sales')]]);
      } catch (e) {}
      lis.forEach((li) => { li.classList.remove('on'); li.classList.add('done'); });
      busy = false;
      $$('[data-own]', fig).forEach((b) => (b.disabled = false));
    });
    fig.addEventListener('click', (e) => {
      const b = e.target.closest('[data-own]');
      if (!b) return;
      if (b.dataset.own === 'play') return play();
      paintSteps();
      MH.whenLive('#own-live', async (doc) => { await resetLive(doc); changed.clear(); });
    });
    MH.seg('ownlib', (v) => { show(v); if (!busy) paintSteps(); });
    paintSteps();
  })();

  // ── 04-2「一次操作的处理流程」：真 Element Plus 侧栏 + 四个站（用户 → Element Plus → 套件 → 页面记着）。
  //   选一种操作，假鼠标在真侧栏上做一遍，四个站一个一个亮。Element Plus 报了什么在页面上读不到，照实测写（element.test.ts：
  //   点「经营分析」报选中和展开；收起后悬停 0.3 秒报展开）；「页面记着」那一站从真页面读，做之前、做之后各读一次
  (function () {
    const box = $('#path-live'), loop = $('#loop');
    if (!box || !loop) return;
    const st = (k) => loop.querySelector(`[data-st="${k}"]`);
    const bub = (k, list) => { st(k).querySelector('.bubs').innerHTML = list.map(([t, cls]) => `<div class="bub${cls ? ' ' + cls : ''}">${t}</div>`).join(''); };
    const pageLines = (s, old) => [['选中', NAV[s.selected] || s.selected, old && old.selected === s.selected], ['展开', s.open.length ? s.open.map((k) => NAV[k] || k).join('、') : '（空）', old && JSON.stringify(old.open) === JSON.stringify(s.open)]]
      .map(([n, v, same]) => [`${n}｜${v}${same ? '（没变）' : ''}`, same ? 'same' : 'new']);
    const CASES = {
      open: { you: '点「销售推进」', kit: [['报：展开「销售推进」']], suit: [['是用户点的，转给页面']], back: '重新画：「销售推进」展开' },
      pick: { you: '点「经营分析」', kit: [['报：选中「经营分析」'], ['报：展开「经营分析」']], suit: [['选中：转给页面'], ['展开：拦下，它没有子菜单', 'bad']], back: '重新画：「经营分析」选中', half: true },
      hover: { you: '侧栏收起，停在「客户管理」图标上', kit: [['0.3 秒后报：展开「客户管理」'], ['弹层开着：它自己记着', 'dash']], suit: [['侧栏收着，拦下', 'bad']], back: '不用重新画', stop: true },
    };
    let run = 0, playing = false;
    const clear = () => { $$('.stn', loop).forEach((e) => e.classList.remove('on', 'x', 'half')); $$('.bubs', loop).forEach((e) => (e.innerHTML = '')); loop.querySelector('.back').className = 'back'; loop.querySelector('.back span').textContent = ''; };
    const snap = (doc) => doc.defaultView.__audit.snapshot('element');
    const cellOf = (doc) => doc.querySelector('[data-audit-cell="element"]');
    const item = (doc, name) => shown(cellOf(doc), part('element', 'menuItem')).find((e) => (e.innerText || '').trim().split('\n')[0] === name);
    const play = (k) => MH.whenLive('#path-live', async (doc) => {
      const my = ++run, C = CASES[k];
      playing = true;
      clear();
      await resetLive(doc);
      await new Promise((r) => setTimeout(r, 350));
      setCss(doc, 'path-small', '.ex-admin{width:560px!important;height:460px!important}.audit__cell>p{display:none!important}');
      MH.live(box).fit();
      if (my !== run) return;
      const A = MH.hands(doc), before = snap(doc);
      if (k === 'open') await A.click(item(doc, '销售推进'));
      if (k === 'pick') await A.click(item(doc, '经营分析'));
      if (k === 'hover') {
        const tg = cellOf(doc).querySelector('button[aria-label$="侧栏"]') || [...cellOf(doc).querySelectorAll('[data-region=sider] button')].pop();
        if (tg) await A.click(tg, { after: 700 });
        const it = shown(cellOf(doc).querySelector('[data-region=sider]') || cellOf(doc), part('element', 'menuItem'))[1];
        if (it) await A.hover(it, { after: 600 });
      }
      if (my !== run) return;
      const after = snap(doc);
      const steps = [
        () => { st('you').classList.add('on'); bub('you', [[C.you]]); },
        () => { st('kit').classList.add('on'); bub('kit', C.kit); },
        () => { st('suit').classList.add('on'); if (C.stop) st('suit').classList.add('x'); if (C.half) st('suit').classList.add('half'); bub('suit', C.suit); },
        () => { st('page').classList.add('on'); bub('page', pageLines(after, before)); },
        () => { const b = loop.querySelector('.back'); b.classList.add(C.stop ? 'off' : 'on'); b.querySelector('span').textContent = C.back; playing = false; },
      ];
      for (const f of steps) { if (my !== run) return; f(); await new Promise((r) => setTimeout(r, 700)); }
    });
    MH.seg('path', play);
    // 读者自己在侧栏上点：只更新「页面记着」那一站
    watch(box, (A) => A.snapshot('element'), (s, old) => { if (!playing && old) { st('page').classList.add('on'); bub('page', pageLines(s, old)); } });
    document.addEventListener('mh:live', (e) => { if (e.detail.box === box) setCss(e.detail.doc, 'path-small', '.ex-admin{width:560px!important;height:460px!important}.audit__cell>p{display:none!important}'); });
    // 第一次看到这一节，自动走一遍「展开销售推进」
    const io = new IntersectionObserver((es) => { if (es.some((en) => en.isIntersecting)) { io.disconnect(); setTimeout(() => play($('.seg[data-ctl="path"] button.on').dataset.v), 800); } }, { threshold: 0.4 });
    io.observe(loop);
  })();

  // ── 04-2「侧栏菜单」：左边是示意（不拦：组件库报什么页面就记什么，照实测画），右边是真组件（套件拦着）；「▶ 走一遍」两边同时做。
  //   实测（组件库原样的组件，页面受控）：Ant Design 收起那一刻报「全部合上」；Element Plus 合上「客户管理」后收起再展开，它自己报「展开」；
  //   TDesign 收起后悬停已展开的组，移开 0.1 秒后报「全部合上」；Arco Design 悬停不报，点收起后的图标报的还是原来的列表
  (function () {
    const fig = $('#side'), box = $('#side-live'), mock = $('#side-mock');
    if (!fig || !box) return;
    const ICON = { workbench: 'home', customers: 'users', sales: 'trending-up', analytics: 'chart', settings: 'settings' };
    const TREE = [['workbench'], ['customers', ['customer-list', 'lead-pool', 'contacts']], ['sales', ['pipeline', 'contracts']], ['analytics'], ['settings']];
    const ico = (n) => (window.mhIcon ? window.mhIcon(n, 'lucide', 16) : '');
    const toggle = (doc) => doc.querySelector('[data-region=sider] button[aria-label$="侧栏"]');
    const item = (doc, lib, name) => shown(doc.querySelector('[data-region=sider]') || doc, part(lib, 'menuItem')).find((e) => (e.innerText || '').trim().split('\n')[0] === name);
    const icon = (doc, lib, n) => shown(doc.querySelector('[data-region=sider]') || doc, part(lib, 'menuItem'))[n];
    // 每个库：开始的样子（arco 一开始就收着），每一步：步骤条上的字、示意怎么变（返回组件库说的话、红不红、牌子）、真组件怎么做
    const SIDE = {
      antd: { start: { collapsed: false, open: ['customers'] }, steps: [
        { t: '收起侧栏', mock: (s) => { s.collapsed = true; s.open = []; return { say: '报：全部合上', bad: 1 }; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
        { t: '展开侧栏', mock: (s) => { s.collapsed = false; return { pin: '选中的「客户列表」看不见了' }; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
      ] },
      element: { start: { collapsed: false, open: ['customers'] }, steps: [
        { t: '点「客户管理」合上', mock: (s) => { s.open = []; return { say: '报：合上「客户管理」' }; }, real: async (A, d) => A.click(item(d, 'element', '客户管理'), { after: 600 }) },
        { t: '收起侧栏', mock: (s) => { s.collapsed = true; return {}; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
        { t: '展开侧栏', mock: (s) => { s.collapsed = false; s.open = ['customers']; return { say: '报：展开「客户管理」', bad: 1, pin: '刚合上的又打开了' }; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
      ] },
      tdesign: { start: { collapsed: false, open: ['customers'] }, steps: [
        { t: '收起侧栏', mock: (s) => { s.collapsed = true; return {}; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
        { t: '停在「客户管理」上', mock: (s) => { s.hover = 'customers'; return {}; }, real: async (A, d) => A.hover(icon(d, 'tdesign', 1), { after: 600 }) },
        { t: '移开', mock: (s) => { s.hover = null; s.open = []; return { say: '0.1 秒后报：全部合上', bad: 1 }; }, real: async (A) => A.leave({ after: 600 }) },
        { t: '展开侧栏', mock: (s) => { s.collapsed = false; return { pin: '选中的「客户列表」看不见了' }; }, real: async (A, d) => A.click(toggle(d), { after: 700 }) },
      ] },
      arco: { start: { collapsed: true, open: ['customers'] }, steps: [
        { t: '停在「客户管理」上', mock: (s) => { s.hover = 'customers'; return { say: '不报，弹层自己记着', ok: 1 }; }, real: null },
        { t: '移开', mock: (s) => { s.hover = null; return { say: '不报', ok: 1 }; }, real: null },
        { t: '点「客户管理」图标', mock: () => ({ say: '报：展开的还是「客户管理」', ok: 1, pin: '不拦也不变', pinOk: 1 }), real: null },
      ] },
    };
    let lib = 'antd', S = null, busy = false;
    const drawMock = (said = {}) => {
      const s = S, rows = [];
      if (!s.collapsed) {
        TREE.forEach(([k, kids]) => {
          rows.push(`<div class="mi${kids ? ' grp' : ''}${k === 'workbench' && s.selected === k ? ' sel' : ''}" data-k="${k}">${ico(ICON[k])}<span>${NAV[k]}</span>${kids ? `<em>${s.open.includes(k) ? '▾' : '▸'}</em>` : ''}</div>`);
          if (kids && s.open.includes(k)) kids.forEach((c) => rows.push(`<div class="mi sub${s.selected === c ? ' sel' : ''}" data-k="${c}"><span>${NAV[c]}</span></div>`));
        });
      } else TREE.forEach(([k]) => rows.push(`<div class="mi ic${s.hover === k ? ' hov' : ''}" data-k="${k}">${ico(ICON[k])}</div>`));
      const pop = s.collapsed && s.hover ? `<div class="mock-pop" style="top:${42 + TREE.findIndex(([k]) => k === s.hover) * 38}px">${TREE.find(([k]) => k === s.hover)[1].map((c) => `<div>${NAV[c]}</div>`).join('')}<em>弹层：它自己记着</em></div>` : '';
      mock.className = 'mock-side' + (s.collapsed ? ' col' : '');
      mock.innerHTML = `<div class="mh">客户经营平台</div><div class="mn">${rows.join('')}</div>${pop}${said.say ? `<div class="bub${said.bad ? ' bad' : ''}">${said.say}</div>` : ''}${said.pin ? `<div class="pin${said.pinOk ? ' ok' : ''}">${said.pin}</div>` : ''}`;
      // 牌子钉在「客户管理」那一行旁边
      const row = mock.querySelector('[data-k="customers"]'), pin = mock.querySelector('.pin'), bubEl = mock.querySelector('.bub');
      if (row && pin) pin.style.top = row.offsetTop + 'px';
      if (row && bubEl) bubEl.style.top = Math.max(4, row.offsetTop - 34) + 'px';
      const bad = said.bad || (said.pin && !said.pinOk);
      ledger($('#side-led-l'), [['open', '展开', S.open.length ? S.open.map((k) => NAV[k]).join('、') : '（空）', !!bad], ['sel', '选中', NAV[S.selected]]]);
    };
    const steps = () => { const ol = $('#side-steps'); ol.style.setProperty('--n', SIDE[lib].steps.length); ol.innerHTML = SIDE[lib].steps.map((x, k) => `<li><i>${k + 1}</i><b>${x.t}</b></li>`).join(''); };
    const reset = () => { S = { ...SIDE[lib].start, open: [...SIDE[lib].start.open], selected: 'customer-list', hover: null }; steps(); drawMock(); $('#side-note').textContent = lib === 'arco' ? 'Arco Design 这一段右边不自动做：鼠标停到「客户管理」图标上、再移开、点一下，账一直不变。' : ''; };
    const q = () => `scene=admin&spec=mono&sider=${lib === 'arco' ? 'collapsed' : 'expanded'}&mode=native&kits=${lib}`;
    const play = () => MH.whenLive('#side-live', async (doc) => {
      if (busy) return;
      busy = true;
      $$('[data-side]', fig).forEach((b) => (b.disabled = true));
      reset();
      await resetLive(doc);
      await new Promise((r) => setTimeout(r, 400));
      setCss(doc, 'side-small', '.ex-admin{width:560px!important;height:460px!important}.audit__cell>p{display:none!important}');
      MH.live(box).fit();
      const A = MH.hands(doc), lis = $$('#side-steps li');
      for (const [k, x] of SIDE[lib].steps.entries()) {
        lis.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', j < k); });
        const said = x.mock(S);
        drawMock(said);
        if (x.real) await x.real(A, doc); else await new Promise((r) => setTimeout(r, 600));
        await new Promise((r) => setTimeout(r, 900));
      }
      lis.forEach((li) => { li.classList.remove('on'); li.classList.add('done'); });
      A.park();
      busy = false;
      $$('[data-side]', fig).forEach((b) => (b.disabled = false));
    });
    fig.addEventListener('click', (e) => { const b = e.target.closest('[data-side]'); if (!b) return; if (b.dataset.side === 'play') play(); else { reset(); MH.whenLive('#side-live', async (doc) => { await resetLive(doc); setTimeout(() => MH.live(box).fit(), 400); }); } });
    watch(box, (Au) => Au.snapshot(lib), (s) => ledger($('#side-led-r'), [['open', '展开', s.open.length ? s.open.map((k) => NAV[k] || k).join('、') : '（空）'], ['sel', '选中', NAV[s.selected] || s.selected]]));
    document.addEventListener('mh:live', (e) => { if (e.detail.box === box) { setCss(e.detail.doc, 'side-small', '.ex-admin{width:560px!important;height:460px!important}.audit__cell>p{display:none!important}'); MH.live(box).fit(); } });
    MH.seg('sidelib', (v) => {
      lib = v;
      reset();
      $('#side-name').textContent = `${FW[KIT[v].framework]} · ${KIT[v].name}`;
      $$('#side-code [data-g]').forEach((el) => (el.hidden = el.dataset.g !== v));
      $('#side-code').hidden = v === 'arco';
      MH.live(box).reload(q());
    });
    reset();
  })();

  // ── 04-2「对话框」：左边示意（组件库默认：点遮罩就关，填的跟着没了），右边真对话框（套件拦着：点遮罩不关）；「▶ 走一遍」两边同时做
  (function () {
    const fig = $('#dlg'), box = $('#dlg-live'), mock = $('#dlg-mock');
    if (!fig || !box) return;
    let lib = 'antd', busy = false;
    const MOCK = () => `<div class="box"><b>编辑客户</b><label><span>客户名称</span><i>上海云帆科技有限公司</i></label><label><span>客户等级</span><i>C 级</i></label><label><span>备注</span><i class="ta" data-ph="最多 200 个字"></i></label><div class="bt"><u>取消</u><u class="pri">保存</u></div></div>`;
    const leftLed = (open, note, bad) => ledger($('#dlg-led-l'), [['d', '对话框', open ? '开着' : '关着', bad], ['n', '备注', note ? `「${note}」` : bad ? '没了' : '空', bad]]);
    const resetMock = () => { mock.className = 'mdlg'; mock.innerHTML = MOCK(); leftLed(true, ''); $$('#dlg-steps li').forEach((li) => li.classList.remove('on', 'done')); };
    const focusDlg = (doc) => { const d = shown(doc, part(lib, 'dialog'))[0]; if (d) { box.dataset.focus = part(lib, 'dialog'); MH.live(box).fit(); } return d; };
    watch(box, (A) => A.snapshot(lib), (s) => {
      const d = s.dialog;
      ledger($('#dlg-led-r'), [['d', '对话框', d ? `开着 · 编辑 ${NAME(d.key)}` : '关着'], ['n', '备注', d && d.form.note ? `「${d.form.note}」` : '空'], ['lv', '客户等级', d ? `${d.form.level} 级` : '—']]);
    });
    document.addEventListener('mh:live', (e) => { if (e.detail.box === box) setTimeout(() => focusDlg(e.detail.doc), 300); });
    const play = () => MH.whenLive('#dlg-live', async (doc) => {
      if (busy) return;
      busy = true;
      $$('[data-dlg]', fig).forEach((b) => (b.disabled = true));
      resetMock();
      await resetLive(doc);
      await new Promise((r) => setTimeout(r, 500));
      const dlg = focusDlg(doc);
      const lis = $$('#dlg-steps li');
      if (dlg) {
        const A = MH.hands(doc), ta = dlg.querySelector('textarea');
        lis[0].classList.add('on');
        // 左边示意同时一个字一个字打
        const mta = mock.querySelector('.ta'), text = '下周回访';
        let k = 0;
        const tick = setInterval(() => { k++; mta.textContent = text.slice(0, k); leftLed(true, text.slice(0, k)); if (k >= text.length) clearInterval(tick); }, 300);
        if (ta) await A.type(ta, text);
        lis[0].classList.replace('on', 'done');
        lis[1].classList.add('on');
        const r = dlg.getBoundingClientRect();
        await A.clickAt(Math.max(8, r.left - 30), r.top + 80);
        mock.classList.add('gone');
        leftLed(false, '', true);
        lis[1].classList.replace('on', 'done');
        A.park();
      }
      busy = false;
      $$('[data-dlg]', fig).forEach((b) => (b.disabled = false));
    });
    fig.addEventListener('click', (e) => { const b = e.target.closest('[data-dlg]'); if (!b) return; if (b.dataset.dlg === 'play') play(); else { resetMock(); MH.whenLive('#dlg-live', async (doc) => { await resetLive(doc); setTimeout(() => focusDlg(doc), 400); }); } });
    MH.seg('dlglib', (v) => { lib = v; resetMock(); $('#dlg-name').textContent = `${FW[KIT[v].framework]} · ${KIT[v].name}`; delete box.dataset.focus; MH.live(box).reload(`scene=customers&spec=mono&mode=native&state=dialog&shared=yes&kits=${v}`); });
    resetMock();
  })();

  // ── 04-2「日期范围」：左边示意月历照 TDesign 的规则算（原来 06-08 至 06-19，点一天：不晚于 19 号马上报半截范围；晚于 19 号不报、结束清掉）；
  //   右边真 TDesign 日期范围框（只露这一个），账读页面记着的
  (function () {
    const box = $('#date-live'), cal = $('#cal-mock');
    if (!box || !cal) return;
    const S0 = [8, 19];
    const d2 = (n) => `06-${String(n).padStart(2, '0')}`;
    const paint = (a, b) => {
      // 2026 年 6 月 1 日是星期一
      cal.innerHTML = ['一', '二', '三', '四', '五', '六', '日'].map((w) => `<b>${w}</b>`).join('') + Array.from({ length: 30 }, (_, i) => { const n = i + 1, end = n === a || n === b, inr = b && n > a && n < b; return `<button type="button" data-d="${n}" class="${end ? 'end' : inr ? 'in' : ''}">${n}</button>`; }).join('');
    };
    const reset = () => { paint(...S0); $('#cal-say').textContent = '点一天试试。'; ledger($('#cal-led'), [['d', '筛选栏正在填的', `${d2(8)} 至 ${d2(19)}`, false]]); };
    cal.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-d]');
      if (!b) return;
      const d = +b.dataset.d;
      if (d <= S0[1]) { paint(d, S0[1]); $('#cal-say').textContent = '只点了一天，就报出去了。'; ledger($('#cal-led'), [['d', '筛选栏正在填的', `${d2(d)} 至 ${d2(S0[1])}`, true]]); }
      else { paint(d, null); $('#cal-say').textContent = '这时它不报，只把结束日期清掉。'; ledger($('#cal-led'), [['d', '筛选栏正在填的', `${d2(8)} 至 ${d2(19)}`, false]]); }
    });
    $('[data-cal="reset"]').addEventListener('click', reset);
    reset();
    const ONLY = `.ex-list,.mh-admin{width:760px!important;height:auto!important}.mh-admin__main{overflow:visible!important;height:auto!important}
[data-region=header],[data-region=sider],[data-region=breadcrumb],[data-region=page-head],.mh-admin__page-head,.mh-list__panel{display:none!important}
.mh-list__filter>:nth-child(1),.mh-list__filter>:nth-child(2){display:none!important}.mh-list__filter{padding-bottom:380px!important}.audit__cell>p{display:none!important}`;
    ledger($('#date-led'), [['d', '筛选栏正在填的', `${d2(8)} 至 ${d2(19)}`], ['f', '已经查询的', `${d2(8)} 至 ${d2(19)}`]]);
    // 筛选栏里的范围变了：日期框上钉一块牌子；[键, 字, 钉在哪（不给就钉日期框）]
    const changed = recent(() => drawDate());
    const drawDate = () => MH.whenLive('#date-live', (doc) => {
      const input = shown(doc, part('tdesign', 'dateRange'))[0];
      MH.mark(doc, changed.list().map(([, label, at]) => { const el = at ? at(doc) : input; return el && { pin: el, label, ok: true, place: 'r' }; }).filter(Boolean));
    });
    watch(box, (A) => A.snapshot('tdesign'), (s, old) => {
      ledger($('#date-led'), [['d', '筛选栏正在填的', rg(s.draft.range) || '空'], ['f', '已经查询的', rg(s.filters.range) || '空']]);
      if (old && rg(old.draft.range) !== rg(s.draft.range)) changed.add([['d', `筛选栏正在填的：${rg(s.draft.range) || '空'}`]]);
    });
    document.addEventListener('mh:live', (e) => { if (e.detail.box === box) { setCss(e.detail.doc, 'date-only', ONLY); MH.live(box).fit(); } });
    // 「▶ 走一遍」：打开日期框 → 点 12 日 → 点 24 日；左边示意同时点，右边真 TDesign（套件拦着）
    const fig = $('#date'), pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const dayEl = (doc, n) => { const pop = shown(doc, part('tdesign', 'datePopup'))[0]; return pop && $$(part('tdesign', 'dateCell'), pop).find((e) => e.textContent.trim() === String(n) && !e.closest('[class*="--additional"]')); };
    const mockDay = (a, b, say, bad) => { paint(a, b); $('#cal-say').textContent = say; ledger($('#cal-led'), [['d', '筛选栏正在填的', `${d2(a)} 至 ${d2(b)}`, bad]]); };
    let busy = false;
    const play = () => MH.whenLive('#date-live', async (doc) => {
      if (busy) return;
      busy = true;
      $$('[data-date]', fig).forEach((b) => (b.disabled = true));
      reset();
      await resetLive(doc);
      changed.clear();
      await pause(400);
      const A = MH.hands(doc), lis = $$('#date-steps li');
      const on = (k) => lis.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', j < k); });
      try {
        on(0);
        const input = shown(doc, part('tdesign', 'dateRange'))[0];
        await A.click(input.querySelector('input') || input, { after: 600 });
        await pause(1000);
        on(1);
        mockDay(12, 19, '只点了一天，就报出去了。', true);
        await A.click(await A.get(() => dayEl(doc, 12)), { after: 400 });
        changed.add([['one', '只点了一天：套件先不报', (d) => dayEl(d, 12)]]);
        await pause(2200);
        on(2);
        mockDay(12, 24, '点完第二天，报出完整的范围。', false);
        await A.click(await A.get(() => dayEl(doc, 24)), { after: 600 });
        A.park();
        await pause(400);
      } catch (e) {}
      lis.forEach((li) => { li.classList.remove('on'); li.classList.add('done'); });
      busy = false;
      $$('[data-date]', fig).forEach((b) => (b.disabled = false));
    });
    fig.addEventListener('click', (e) => {
      const b = e.target.closest('[data-date]');
      if (!b) return;
      if (b.dataset.date === 'play') return play();
      reset();
      $$('#date-steps li').forEach((li) => li.classList.remove('on', 'done'));
      MH.whenLive('#date-live', async (doc) => { await resetLive(doc); changed.clear(); });
    });
  })();
})();
