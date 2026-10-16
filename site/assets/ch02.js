/*
 * 第 02 篇的交互。颜色算法在 color.js（照搬 @ant-design/colors 8.0.1；混白混黑同 spec/src/color.ts）。
 * 套件填哪些变量、按什么比例算，照套件源码：vue/src/kits/element/index.ts:95-132 等。
 */
(function () {
  const C = window.MhColor, MH = window.MH;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const SPECS = { mono: { primary: '#0A0A0A', hover: '#333333' }, blue: { primary: '#3370FF', hover: '#4E83FD' }, stress: { primary: '#0F766E', hover: '#14968A' } };
  const sw = (hex) => `<i class="sw" style="background:${hex}"></i>`;
  const toHex = (css) => C.cssToHex(css);

  // ── 从真组件上量勾选行的颜色（Ant Design 的表格），直接标在勾选的那一行上
  function measure(sel) {
    MH.whenLive(sel, (doc) => {
      // 第 4 列是负责人：纯文字，字色就是正文色
      const row = doc.querySelector('tr.ant-table-row-selected');
      const td = row && row.querySelector('td:nth-child(4)');
      if (!td) return;
      const win = doc.defaultView;
      const bg = toHex(win.getComputedStyle(td).backgroundColor) || '#FFFFFF';
      const fg = toHex(win.getComputedStyle(td).color);
      const k = C.contrast(fg, bg);
      // 取色点钉在负责人那一格右边的空处（底色），小牌子放到表头上方的工具条里（右边是空的），不压表头和这一行
      const R = row.getBoundingClientRect(), T = td.getBoundingClientRect();
      MH.mark(doc, [{ pin: row, on: 'fill', fx: (T.right - 14 - R.left) / R.width, color: bg, label: `勾选的行：底 ${bg} · 字 ${fg} · 对比度 ${k.toFixed(2)} : 1`, lift: doc.querySelector('[data-region=table] thead') || row }]);
    });
  }
  document.addEventListener('mh:live', (e) => {
    if (e.detail.box.id === 'hook-live') setTimeout(() => measure('#hook-live'), 300);
    if (e.detail.box.id === 'two-live') setTimeout(() => measure('#two-live'), 300);
  });
  MH.seg('hookspec', (v) => { MH.live('#hook-live').reload(`scene=customers&spec=${v}&state=selected&mode=theme&kits=antd`); });
  // 两张卡本身就是开关：点「只设主题」或「对齐到控件规格」，下面的真组件跟着换
  const twoLook = (v) => {
    MH.live('#two-live').reload(`scene=customers&spec=mono&state=selected&mode=${v}&kits=antd`);
    $$('.twostep .row[data-v]').forEach((r) => r.classList.toggle('on', r.dataset.v === v));
  };
  $$('.twostep .row[data-v]').forEach((r) => {
    r.addEventListener('click', () => twoLook(r.dataset.v));
    r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); twoLook(r.dataset.v); } });
  });
  $('#ts-theme')?.classList.add('on');

  // ── 2.2 变量面板：改左边的数，右边绑了变量的按钮跟着变
  (() => {
    const btn = $('#v2-btn span');
    if (!btn) return;
    const st = { c: '#0A0A0A', h: 32, r: 6 };
    const paint = (flash) => {
      btn.style.background = st.c;
      btn.style.height = st.h + 'px';
      btn.style.borderRadius = st.r + 'px';
      $('#v2-c b').textContent = st.c;
      $('#v2-h').nextElementSibling.textContent = st.h;
      $('#v2-r').nextElementSibling.textContent = st.r;
      $('#v2-hc').textContent = `⬡ 控件高度 · ${st.h}`;
      $('#v2-rc').textContent = `⬡ 控件圆角 · ${st.r}`;
      if (flash) { const c = $('#' + flash); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
    };
    $$('#v2-c button').forEach((b) => b.addEventListener('click', () => { $$('#v2-c button').forEach((x) => x.classList.toggle('on', x === b)); st.c = b.dataset.c; paint('v2-cc'); }));
    $('#v2-h').addEventListener('input', (e) => { st.h = +e.target.value; paint('v2-hc'); });
    $('#v2-r').addEventListener('input', (e) => { st.r = +e.target.value; paint('v2-rc'); });
    paint();
  })();

  // ── 2.1 改一个数：32 / 36
  MH.seg('h36', (v) => {
    $$('img[data-h36]').forEach((im) => (im.src = `assets/img/02-controls-mono-aligned${v === '36' ? '-36' : ''}-${im.dataset.h36}.png`));
    $$('#s1 .code .l').forEach((l) => { if ($('.ln', l)?.textContent === '53') $('.tx', l).textContent = `size.control: ${v}px${v === '36' ? '    ← 改成 36' : ''}`; });
  });

  // ── 2.3 三种情况
  (function () {
    const input = $('#c1-color');
    if (!input) return;
    let filled = false;
    const NAMES = ['--el-color-primary', '-light-3', '-light-5', '-light-7', '-light-8', '-light-9', '-dark-2'];
    const paint = () => {
      const color = input.value.toUpperCase();
      $('#c1-hex').textContent = color;
      $('#c1-ramp').innerHTML = C.generate(color).slice(0, 6).map((s) => `<i style="background:${s.hex}"></i>`).join('');
      const spec = Object.values(SPECS).find((x) => x.primary === color);
      const vals = [color, spec ? spec.hover : C.tint(color, 0.3), C.tint(color, 0.5), C.tint(color, 0.7), C.tint(color, 0.8), C.tint(color, 0.9), C.shade(color, 0.2)];
      $('#c2-vars').innerHTML = `<div class="vh">Element Plus 的主色这一组<span>一共七个</span></div>` + NAMES.map((n, i) => `<div class="vr"><span>${n}</span><span class="v ${filled ? '' : 'empty'}">${filled ? sw(vals[i]) + vals[i] : sw('') + '等你填'}</span></div>`).join('');
    };
    input.addEventListener('input', paint);
    $('#c2-fill').addEventListener('click', () => { filled = true; paint(); });
    $('#c2-clear').addEventListener('click', () => { filled = false; paint(); });
    const r = $('#c3-range'), b = $('#c3-bound');
    const p3 = () => { b.style.height = r.value + 'px'; b.textContent = r.value; $('#c3-val').textContent = r.value; };
    r.addEventListener('input', p3); p3();
    paint();
  })();

  // ── 2.4 五步
  (function () {
    const flow = $('#flow');
    if (!flow) return;
    const D = [
      ['人写的一份文件', 'Design.md 正文随便写，机器只读 mihua-tokens 那一块里的「角色: 取值」，比如 <b>size.control: 32px</b>。黑白、蓝色、压力测试，一共三份。', 'designs/mono/Design.md · 第 53 行'],
      ['每个角色是什么意思、能填多少', '控件高度这一项是「默认一档：后台页面里按钮、输入框、选择框的高度」，<b>只能填 28 到 48</b>。取值会变成页面上的 CSS 变量 <code>--mh-size-control</code>。', 'spec/src/roles.ts · 第 244–253 行'],
      ['每种控件用哪些角色、怎么组合', '按钮多高、文字离边多远、复选框多大、聚焦外圈多粗，都从规范里的角色算出来，变成 <code>--mh-c-*</code> 一组变量。五个组件库都对齐到这一份。', 'spec/src/controls.ts'],
      ['每个组件库一份翻译', '把控件规格翻成这个组件库认的写法：主题变量、组件属性、类名、样式覆盖。<b>组件库之间的差别，只写在这一层。</b>', 'react/src/kits/antd、arco、shadcn · vue/src/kits/element、tdesign'],
      ['照自己的规则画出来', '改第一步的那个数，后面几步跟着走。这就是 32 改成 36，套件一个字不用动的原因。', 'docs/architecture.md「四层在仓库里的位置」'],
    ];
    const show = (i) => { $$('.node', flow).forEach((n) => n.classList.toggle('on', +n.dataset.i === i)); const [h, p, f] = D[i]; $('#flow-detail').innerHTML = `<h4>第 ${i + 1} 步 · ${h}</h4><p>${p}</p><p class="f">${f}</p>`; };
    $$('.node', flow).forEach((n) => n.addEventListener('click', () => show(+n.dataset.i)));
    show(0);
  })();

  // ── 2.7 一整套颜色（蓝色规范）
  (function () {
    const p = '#3370FF', g = C.generate(p);
    const set = (i, bg, extra) => { const t = $('#st-' + i); if (t) { t.style.background = bg; if (extra) Object.assign(t.style, extra); } };
    set(0, p); set(1, '#4E83FD'); set(2, g[6].hex); set(3, g[0].hex); set(4, '#fff', { boxShadow: `0 0 0 4px ${g[1].hex}, inset 0 0 0 1px ${p}` });
  })();

  // ── 2.8 种子 → 十档
  (function () {
    const el = $('#seed-ramp');
    if (el) el.innerHTML = C.generate('#3370FF').map((s, i) => `<i class="${i === 5 ? 'base' : ''}" style="background:${s.hex}" title="${s.hex}"></i>`).join('');
  })();

  // ── 2.9 推色实验台
  (function () {
    const steps = $('#ramp-steps');
    if (!steps) return;
    const TEXT = '#262626';
    const paint = (color) => {
      const g = C.generate(color).slice(0, 6).reverse(); // 主色在左，往右越来越浅
      steps.innerHTML = g.map((s, i) => { const h = C.hsb(s.hex); return `<div class="st ${i === 5 ? 'lightest' : ''}"><span class="tag">${i === 0 ? '主色' : i === 5 ? '最浅一档 · 勾选的行用它' : ''}</span><i style="background:${s.hex}"></i><p><b>${s.hex}</b>亮度 ${h.b}%<br>饱和度 ${h.s}%</p></div>`; }).join('');
      const bg = g[5].hex;
      $('#ramp-row').style.background = bg;
      $('#ramp-bg').textContent = bg;
      const k = C.contrast(TEXT, bg);
      const v = $('#ramp-verdict');
      v.className = 'verdict ' + (k >= 4.5 ? 'ok' : 'bad');
      v.innerHTML = `<span class="kk">${k.toFixed(2)}</span><span>字放在这一档上的对比度<br>${k >= 4.5 ? '够 4.5，看得清' : '没到 4.5，字快看不清了'}</span>`;
      // 「这就是开头那个深灰」只在黑白规范时成立
      const tail = $('#ramp-k');
      if (tail) tail.hidden = color.toUpperCase() !== '#0A0A0A';
    };
    MH.seg('ramp', paint);
    $('#ramp-pick').addEventListener('input', (e) => { $$('.seg[data-ctl="ramp"] button').forEach((b) => b.classList.remove('on')); paint(e.target.value); });
    paint('#0A0A0A');
  })();

  // ── 2.10 HSB 柱子
  (function () {
    const draw = (id, color, name) => {
      const el = $(id);
      if (!el) return;
      const g = C.generate(color).slice(0, 6).reverse();
      const hs = g.map((s) => C.hsb(s.hex));
      el.innerHTML = `<h5>${sw(color)}${name}<small>${color}</small><span class="ref">亮度 100%</span></h5><div class="bars">${g.map((s, i) => `<div class="b" style="height:${Math.max(2, hs[i].b * 2)}px;background:${s.hex}"><span>${hs[i].b}%</span></div>`).join('')}</div><div class="lab2">${g.map((s, i) => `<span><b>${i === 0 ? '主色' : '浅 ' + i}</b>饱和度 ${hs[i].s}%</span>`).join('')}</div>`;
    };
    draw('#hsb-blue', '#3370FF', '蓝色规范的主色');
    draw('#hsb-black', '#0A0A0A', '黑白规范的主色');
  })();

  // ═════════ 后半篇 ═════════
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  // 在真组件上做实验：在某个元素上写 / 去掉变量，再量一个元素
  function experiment(sel, kitClass, fn) {
    MH.whenLive(sel, (doc) => {
      // 组件库的按钮带过渡动画：先让浏览器把样式算一遍（过渡这时才开始），再让它走完，最后才量
      const win = doc.defaultView;
      doc.querySelectorAll('button, .t-button, .arco-btn, .el-button, .ant-btn').forEach((b) => { const cs = win.getComputedStyle(b); void cs.backgroundColor; void cs.height; });
      try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {}
      fn(doc, doc.querySelector(kitClass), doc.defaultView);
    });
  }

  // ── 2.16 Element Plus：只改主色
  (function () {
    const out = $('#el-vars');
    if (!out) return;
    const put = (k, hex) => { const v = $(`[data-m="${k}"]`, out); v.innerHTML = hex ? sw(hex) + hex : '…'; };
    const read = () => experiment('#el-live', '.mh-kit-element', (doc, kit, win) => {
      const btn = doc.querySelector('.el-button--primary');
      if (!btn) return;
      const cs = win.getComputedStyle(btn);
      put('p', toHex(cs.backgroundColor));
      put('h', (cs.getPropertyValue('--el-button-hover-bg-color').trim() || '').toUpperCase());
      put('l', (win.getComputedStyle(kit).getPropertyValue('--el-color-primary-light-9').trim() || '').toUpperCase());
      $$('.vr', out)[1].classList.toggle('warn', kit.style.getPropertyValue('--el-color-primary') !== '');
    });
    $('#el-black').addEventListener('click', () => experiment('#el-live', '.mh-kit-element', (doc, kit) => { kit.style.setProperty('--el-color-primary', '#0A0A0A'); setTimeout(read, 60); }));
    $('#el-reset').addEventListener('click', () => experiment('#el-live', '.mh-kit-element', (doc, kit) => { kit.style.removeProperty('--el-color-primary'); setTimeout(read, 60); }));
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'el-live') setTimeout(read, 400); });
  })();

  // ── 2.17 一个一个填：Element 的七个
  (function () {
    const box = $('#fill-vars');
    if (!box) return;
    const paint = (spec) => {
      const { primary: p, hover: h } = SPECS[spec];
      const rows = [['--el-color-primary', p, '主色'], ['-light-3', h, '主操作悬停'], ['-light-5', C.tint(p, 0.5), '混白 50%'], ['-light-7', C.tint(p, 0.7), '混白 70%'], ['-light-8', C.tint(p, 0.8), '混白 80%'], ['-light-9', C.tint(p, 0.9), '混白 90%'], ['-dark-2', C.shade(p, 0.2), '混黑 20%']];
      box.innerHTML = `<div class="vh">套件给 Element Plus 填的七个<span>${({ mono: '黑白', blue: '蓝色', stress: '压力测试' })[spec]}规范</span></div>` + rows.map(([n, v, w]) => `<div class="vr"><span>${n} <span style="color:var(--faint)">· ${w}</span></span><span class="v">${sw(v)}${v}</span></div>`).join('');
    };
    MH.seg('fill', paint); paint('mono');
  })();

  // ── 2.18 变量有多有少
  (function () {
    const box = $('#counts');
    if (!box) return;
    const paint = (spec) => {
      const { primary: p, hover: h } = SPECS[spec];
      const col = (name, rows, note, n) => `<div class="c"><h5>${name}</h5><div class="n">${n}<small>个</small></div>${rows.map(([k, v, show]) => `<div class="v">${sw(show || v)}<span>${k}</span></div>`).join('')}<p>${note}</p></div>`;
      const trip = (hex) => C.rgbTriplet(hex);
      box.innerHTML = [
        col('Element Plus', [['--el-color-primary', p], ['-light-3', h], ['-light-5', C.tint(p, 0.5)], ['-light-7', C.tint(p, 0.7)], ['-light-8', C.tint(p, 0.8)], ['-light-9', C.tint(p, 0.9)], ['-dark-2', C.shade(p, 0.2)]], '浅色按比例混白，深色混黑', 7),
        col('Arco Design', [['--primary-1', '', C.tint(p, 0.92)], ['--primary-2', '', C.tint(p, 0.8)], ['--primary-3', '', C.tint(p, 0.6)], ['--primary-4', '', C.tint(p, 0.35)], ['--primary-5', '', h], ['--primary-6', '', p], ['--primary-7', '', C.shade(p, 0.15)]].map(([k, , v]) => [`${k}: ${trip(v)}`, v]), '每一个都写成 R,G,B 三个数', 7),
        col('TDesign', [['--td-brand-color', p], ['-hover', h], ['-focus', C.tint(p, 0.8)], ['-active', C.shade(p, 0.2)], ['-disabled', C.tint(p, 0.6)], ['-light', C.tint(p, 0.9)], ['-light-hover', C.tint(p, 0.8)]], '直接写拼好的那一层', 7),
        col('shadcn/ui', [['--primary', p], ['--ring', p]], '名字按用途起，一个对一个；悬停是主色 85% 不透明', 2),
      ].join('');
    };
    MH.seg('counts', paint); paint('mono');
  })();

  // ── 选中面：没交时自己推，交了就直接用（原来一张 6 × 6 的表，改成色块：一格画一条勾选的行）
  (function () {
    const el = $('#sel-grid');
    if (!el) return;
    const row = (c) => (c ? { draw: `<i class="selrow" style="background:${c}"><b></b></i>`, label: c } : { draw: '<i class="selrow none"><b></b></i>', label: '不上色' });
    const R = (name, sub, a, s2) => ({ name, sub, cells: [row(a), row(null), row(s2[0] === '#' ? s2 : '#F5F5F5'), row(null), row(null)].map((x, i) => (i === 2 && s2[0] !== '#' ? { ...x, label: s2 } : x)) });
    const all = (name, sub, c) => ({ name, sub, cells: [0, 1, 2, 3, 4].map(() => row(c)) });
    MH.dgrid(el, [
      R('黑白', '组件库原生', '#E6F4FF', 'oklch(0.97 0 0)'),
      R('黑白', '只设主题', '#4A4A4A', '#F5F5F5'),
      R('蓝色', '只设主题', '#F0F7FF', '#F5F6F7'),
      R('压力测试', '只设主题', '#A8B5B2', '#F5F5F5'),
      all('黑白', '对齐：规范的选中面', '#EBEBEB'),
      all('蓝色', '对齐：规范的选中面', '#E1EAFF'),
    ], { cols: ['Ant Design', 'Element Plus', 'shadcn/ui', 'Arco Design', 'TDesign'] });
  })();

  // ── 2.15 主题从哪进、几档谁算（不用表格：一行一个库，一格一档颜色：实线框是套件填的，虚线框是组件库自己推的）
  (function () {
    const box = $('#entry');
    if (!box) return;
    const COLS = ['浅 1', '浅 2', '浅 3', '浅 4', '悬停', '主色', '按下'];
    // 一格：[颜色, 谁算（k 套件填 / d 组件库自己推）, 变量名]；没有这个变量就是 null
    const chip = (c) => (c ? `<i class="${c[1]}" data-k="${c[1]}" style="--c:${c[0]}" title="${c[2]} · ${c[0].toUpperCase()}"></i>` : '<i class="no"></i>');
    const row = (name, door, cells, count) => `<div class="en-r"><div class="en-n"><b>${name}</b><span>${door}</span></div><div class="en-ch">${cells.map(chip).join('')}</div><div class="en-c">${count}</div></div>`;
    const paint = (spec) => {
      const { primary: p, hover: h } = SPECS[spec];
      const g = C.generate(p).map((x) => x.hex);
      const t = (w) => C.tint(p, w), d = (w) => C.shade(p, w);
      box.innerHTML = `<div class="en-r en-h"><div></div><div class="en-ch">${COLS.map((c) => `<span>${c}</span>`).join('')}</div><div></div></div>
        <div class="en-g"><div class="en-gh"><b>第一种</b>交主色，其余几档组件库自己推</div>
        ${row('Ant Design', 'JS 主题配置 <code>theme.token</code>', [[g[0], 'd', 'colorPrimaryBg'], [g[1], 'd', 'colorPrimaryBgHover'], [g[2], 'd', 'colorPrimaryBorder'], [g[3], 'd', 'colorPrimaryBorderHover'], [h, 'k', 'colorPrimaryHover'], [p, 'k', 'colorPrimary'], [g[6], 'd', 'colorPrimaryActive']], '交 <b>2</b> 个')}</div>
        <div class="en-g"><div class="en-gh"><b>第二种</b>每一档都由套件算好，填进 CSS 变量</div>
        ${row('Element Plus', 'CSS 变量 <code>--el-color-primary-*</code>', [[t(0.9), 'k', '-light-9'], [t(0.8), 'k', '-light-8'], [t(0.7), 'k', '-light-7'], [t(0.5), 'k', '-light-5'], [h, 'k', '-light-3'], [p, 'k', '--el-color-primary'], [d(0.2), 'k', '-dark-2']], '交 <b>7</b> 个')}
        ${row('Arco Design', 'CSS 变量 <code>--primary-1…7</code>，值是三个数', [[t(0.92), 'k', '--primary-1'], [t(0.8), 'k', '--primary-2'], [t(0.6), 'k', '--primary-3'], [t(0.35), 'k', '--primary-4'], [h, 'k', '--primary-5'], [p, 'k', '--primary-6'], [d(0.15), 'k', '--primary-7']], '交 <b>7</b> 个')}
        ${row('TDesign', 'CSS 变量 <code>--td-brand-color-*</code>', [[t(0.9), 'k', '-light'], [t(0.8), 'k', '-light-hover'], [t(0.8), 'k', '-focus'], [t(0.6), 'k', '-disabled'], [h, 'k', '-hover'], [p, 'k', '--td-brand-color'], [d(0.2), 'k', '-active']], '交 <b>7</b> 个')}
        ${row('shadcn/ui', 'CSS 变量 <code>--primary</code>、<code>--ring</code>', [null, null, null, null, [C.tint(p, 0.15), 'd', '主色 85% 不透明'], [p, 'k', '--primary、--ring'], null], '交 <b>2</b> 个')}</div>`;
    };
    MH.seg('entry', paint); paint('mono');
  })();

  // ── 2.19 Arco：三个数
  (function () {
    const out = $('#arco-out');
    if (!out) return;
    const read = (what) => experiment('#arco-live', '.mh-kit-arco', (doc, kit, win) => {
      const btn = doc.querySelector('.arco-btn-primary');
      if (!btn) return;
      const bg = win.getComputedStyle(btn).backgroundColor;
      const hex = toHex(bg);
      out.innerHTML = `${what ? what + '<br>' : ''}「查询」按钮现在的底色：<b>${hex ? sw(hex) + hex : '透明（颜色没了）'}</b>`;
      // 也直接标在按钮上：取色点钉在按钮左边的留白里（这是在看变化，不比规格，灰牌子）
      MH.mark(doc, [{ pin: btn, on: 'fill', fx: 0.1, color: hex || null, label: hex ? `底 ${hex}` : '透明，颜色没了', ok: null }]);
    });
    const set = (v, what) => experiment('#arco-live', '.mh-kit-arco', (doc, kit) => { if (v) kit.style.setProperty('--primary-6', v); else kit.style.removeProperty('--primary-6'); setTimeout(() => read(what), 120); });
    $('#arco-hex').addEventListener('click', () => set('#0A0A0A', '写的是 <b>#0A0A0A</b>，组件拿去拼成 rgb(#0A0A0A)，不成立。'));
    $('#arco-rgb').addEventListener('click', () => set('10,10,10', '写的是 <b>10,10,10</b>，拼成 rgb(10,10,10)，就是黑。'));
    $('#arco-reset').addEventListener('click', () => set(null, '出厂的 --primary-6 是 22,93,255。'));
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'arco-live') setTimeout(() => read(''), 400); });
  })();

  // ── 2.20 TDesign：在哪一层改
  (function () {
    const out = $('#td-out');
    if (!out) return;
    const clear = (doc, kit) => { kit.style.removeProperty('--td-brand-color-7'); kit.style.removeProperty('--td-brand-color'); doc.documentElement.style.removeProperty('--td-brand-color-7'); };
    const read = (what) => experiment('#td-live', '.mh-kit-tdesign', (doc, kit, win) => {
      const btn = doc.querySelector('.t-button--theme-primary');
      if (!btn) return;
      const hex = toHex(win.getComputedStyle(btn).backgroundColor);
      out.innerHTML = `${what ? what + '<br>' : ''}「查询」按钮现在的底色：<b>${sw(hex)}${hex}</b>`;
      MH.mark(doc, [{ pin: btn, on: 'fill', fx: 0.1, color: hex, label: `底 ${hex}`, ok: null }]);
    });
    const act = (fn, what) => experiment('#td-live', '.mh-kit-tdesign', (doc, kit) => { clear(doc, kit); fn(doc, kit); setTimeout(() => read(what), 120); });
    $('#td-7').addEventListener('click', () => act((d, k) => k.style.setProperty('--td-brand-color-7', '#0A0A0A'), '在套件这一层写 --td-brand-color-7: #0A0A0A：<b>不变</b>，往里传的还是最外层算好的。'));
    $('#td-brand').addEventListener('click', () => act((d, k) => k.style.setProperty('--td-brand-color', '#0A0A0A'), '在套件这一层写拼好的 --td-brand-color: #0A0A0A：<b>变了</b>。套件就是这样写的。'));
    $('#td-root').addEventListener('click', () => act((d) => d.documentElement.style.setProperty('--td-brand-color-7', '#0A0A0A'), '在页面最外层写 --td-brand-color-7: #0A0A0A：<b>变了</b>，整个页面的 TDesign 都会跟着变。'));
    $('#td-reset').addEventListener('click', () => act(() => {}, '出厂的第七档是 #0052D9。'));
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'td-live') setTimeout(() => read(''), 400); });
  })();

  // ── 2.24 Ant Design 自己乘
  (function () {
    const r = $('#mult-range');
    if (!r) return;
    const paint = () => {
      const h = +r.value, lg = +(h * 1.25).toFixed(2), sm = +(h * 0.75).toFixed(2), cb = h / 2;
      $('#mult-val').textContent = h;
      const seed = $('#mult-seed'); seed.style.height = h + 'px'; seed.textContent = h;
      // 复选框那一格比数字还小：数字写在方框右边
      const box = (id, v, w) => { const e = $(id); e.style.height = v + 'px'; e.style.width = (w || 110) + 'px'; const tiny = (w || 110) < 28; e.classList.toggle('tiny', tiny); e.dataset.v = v; e.textContent = tiny ? '' : v; };
      box('#mult-lg', lg); box('#mult-sm', sm); box('#mult-cb', cb, cb);
    };
    r.addEventListener('input', paint); paint();
  })();

  // ── 压力测试的按钮和复选框：量出来直接标在组件上
  (function () {
    if (!$('#cb-live')) return;
    const read = () => MH.whenLive('#cb-live', (doc) => {
      const btns = [...doc.querySelectorAll('.ant-btn')];
      const H = (e) => e.getBoundingClientRect().height;
      const big = btns.reduce((a, b) => (H(b) > (a ? H(a) : 0) ? b : a), null);
      const small = btns.reduce((a, b) => (H(b) < (a ? H(a) : 1e9) ? b : a), null);
      const cb = doc.querySelector('.ant-checkbox-inner') || doc.querySelector('.ant-checkbox');
      // 高画在按钮左边（右边紧挨着次要按钮，卡片左边留白窄，只写数）；复选框高标在左边、宽画在下面、数放在线右端
      MH.mark(doc, [
        small && { h: small, side: 'l', label: px(H(small)) },
        big && { h: big, side: 'l', label: px(H(big)) },
        cb && { h: cb, side: 'l', label: px(cb.getBoundingClientRect().height) },
        cb && { w: cb, side: 'br', label: px(cb.getBoundingClientRect().width) },
      ]);
    });
    MH.seg('cblook', (v) => MH.live('#cb-live').reload(`scene=controls&spec=stress&mode=${v}&kits=antd`));
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'cb-live') setTimeout(read, 500); });
  })();

  // ── 2.26 TDesign 的高度
  (function () {
    const out = $('#tdh-out');
    if (!out) return;
    const clear = (kit) => { kit.style.removeProperty('--td-size-10'); kit.style.removeProperty('--td-comp-size-m'); };
    const read = (what) => experiment('#tdh-live', '.mh-kit-tdesign', (doc, kit) => {
      const btn = doc.querySelector('.t-button--theme-primary') || doc.querySelector('.t-button');
      if (!btn) return;
      out.innerHTML = `${what ? what + '<br>' : ''}「查询」按钮现在的高度：<b>${px(btn.getBoundingClientRect().height)} px</b>`;
      MH.live('#tdh-live').fit();
      // 也直接标在按钮上：高画在按钮左边（右边紧挨着「重置」）
      MH.mark(doc, [{ h: btn, side: 'l', label: px(btn.getBoundingClientRect().height), ok: null }]);
    });
    const act = (fn, what) => experiment('#tdh-live', '.mh-kit-tdesign', (doc, kit) => { clear(kit); fn(kit); setTimeout(() => read(what), 120); });
    $('#tdh-10').addEventListener('click', () => act((k) => k.style.setProperty('--td-size-10', '40px'), '改底层的第十号尺寸：<b>不变</b>。'));
    $('#tdh-m').addEventListener('click', () => act((k) => k.style.setProperty('--td-comp-size-m', '40px'), '改拼好的默认高度：<b>变了</b>，写多少就是多少。'));
    $('#tdh-reset').addEventListener('click', () => act(() => {}, '出厂默认高度 32。'));
    document.addEventListener('mh:live', (e) => { if (e.detail.box.id === 'tdh-live') setTimeout(() => read(''), 400); });
  })();

  // ── 2.27 压力测试两档截图
  MH.seg('h3look', (v) => $$('img[data-h3]').forEach((im) => (im.src = `assets/img/02-controls-stress-${v}-${im.dataset.h3}.png`)));

  // ── 2.28 一个高度，五种算法
  (function () {
    const box = $('#heights');
    if (!box) return;
    const r = $('#h-range');
    let mode = 'theme';
    const near = (h) => [24, 28, 32, 36].reduce((b, s) => (Math.abs(s - h) < Math.abs(b - h) ? s : b));
    const bar = (v, stuck) => `<div class="bar${stuck ? ' stuck' : ''}" style="height:${Math.round(v * 2)}px"><span>${Math.round(v * 10) / 10}</span></div>`;
    const paint = () => {
      const h = +r.value; $('#h-val').textContent = h;
      const al = mode === 'aligned';
      const L = [
        ['Ant Design', al ? '套件直接给' : '它自己会', al ? [[h], [h], [16]] : [[h], [h], [h / 2]], al ? '复选框套件直接给 16，不让它乘。' : `复选框是控件高度的一半：${h / 2}。`],
        ['TDesign', '要你说全', [[h], [h], [16]], '默认高度是一个变量，填多少就是多少；复选框它自己是 16。'],
        ['Element Plus', al ? '样式覆盖' : '它改不了', al ? [[h], [h], [16]] : [[h], [32, 1], [14, 1]], al ? '按钮外面盖一层样式，复选框改成 16。' : '输入框读变量；默认按钮写死 32；复选框 14。'],
        ['Arco Design', al ? '组件属性' : '它改不了', al ? [[h], [h], [16]] : [[near(h), 1], [near(h), 1], [14, 1]], al ? '先挑最接近的一档，再把高度设准。' : `只有 24 / 28 / 32 / 36，${h} 落进 ${near(h)}；复选框 14。`],
        ['shadcn/ui', al ? '换类名' : '它改不了', [[h], [h], [16]], '出厂写在类名里（h-9 = 36）；套件把类名换成读变量，只设主题也跟着走。'],
      ];
      box.innerHTML = L.map(([n, tag, bars, note]) => `<div class="h"><h5>${n}<span class="chip">${tag}</span></h5><div class="bars">${bars.map(([v, st]) => bar(v, st)).join('')}</div><div class="bl"><span>输入框</span><span>按钮</span><span>复选框</span></div><p>${note}</p></div>`).join('');
    };
    r.addEventListener('input', paint);
    MH.seg('hmode', (v) => { mode = v; paint(); });
    paint();
  })();

  // ── 2.36 / 2.37 图标
  (function () {
    const I = window.MH_ICONS;
    if (!I || !window.mhIcon) return;
    const g = $('#sem-glyphs');
    if (g) g.innerHTML = [['lucide', 'Lucide'], ['mihua', 'Mihua 自绘']].map(([id, n]) => `<span>${window.mhIcon('chevron-down', id, 28)}${n}</span>`).join('');
    const grid = $('#icongrid');
    const paint = (set) => { if (grid) grid.innerHTML = I.names.map((n) => `<div class="ic">${window.mhIcon(n, set, 28)}<b>${n}</b><span>${I.usage[n]}</span></div>`).join(''); };
    MH.seg('iconset', paint); paint('lucide');
  })();
  MH.seg('iconlive', (v) => MH.live('#icon-live').reload(`scene=login&variant=centered&state=initial&${({ native: 'spec=mono&mode=native', lucide: 'spec=mono&mode=aligned', mihua: 'spec=stress&mode=aligned' })[v]}`));
  MH.seg('eyelook', (v) => MH.live('#eye-live').reload(`scene=login&spec=mono&variant=centered&state=account&mode=${v}`));

  // ── 2.40 对勾怎么画
  (function () {
    const stage = $('#cb-stage');
    if (!stage) return;
    const mask = $('#cb-mask');
    if (mask && window.mhIcon) mask.innerHTML = window.mhIcon('check', 'lucide', 64, 3);
    $$('#cb-steps button').forEach((b) => b.addEventListener('click', () => { stage.dataset.s = b.dataset.s; $$('#cb-steps button').forEach((x) => x.classList.toggle('on', x === b)); }));
  })();
  // ═════════ 02-2 尺寸：不用表格，按真实像素画═════════
  //   一格画一个控件：高度、字号、留白都是量出来的像素；虚线是规格的高度；和规格不一样的描红、数字标红
  const X = (v, bad) => (bad ? `<b class="x">${v}</b>` : `${v}`);
  // 按钮：pad 是文字离外边框（含 1px 边框），浅色底标出留白
  const btn = (h, f, pad, bad, txt = '查询') => `<span class="mb pd${bad ? ' x' : ''}" style="height:${h}px;font-size:${f}px;padding:0 ${pad - 1}px;--p:${pad - 1}px">${txt}</span>`;
  const field = (h, f, pad, bad, w = 132, txt = '客户名称', shade = true) => `<span class="mf${shade ? ' pd-l' : ''}${bad ? ' x' : ''}" style="height:${h}px;font-size:${f}px;width:${w}px;padding-left:${pad - 1}px;--p:${pad - 1}px">${txt}</span>`;
  const box = (n, bad) => `<span class="mc${bad ? ' x' : ''}" style="width:${n}px;height:${n}px"></span>`;
  const guide = (g) => (g ? `<i class="gd" style="bottom:${g}px"></i>` : '');
  const draw = (H, g, inner) => `<div class="dw" style="height:${H}px">${guide(g)}${inner}</div>`;
  // k：这一格和规格一样（same）还是不一样（diff），给同类高亮用；规格那一格不带
  const cell = (H, g, inner, label, cls = '', k = '') => `<div class="sc${cls}"${k ? ` data-k="${k}"` : ''}>${draw(H, g, inner)}<div class="nm">${label}</div></div>`;
  const K = (bad) => (bad ? 'diff' : 'same');
  const head = (cols) => `<div class="sr sh"><div></div>${cols.map((c) => `<div>${c}</div>`).join('')}</div>`;
  const rowOf = (name, sub, cells) => `<div class="sr"><div class="sl"><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</div>${cells.join('')}</div>`;
  const LIB5 = ['Ant Design', 'Element Plus', 'shadcn/ui', 'Arco Design', 'TDesign'];

  // ── 2.7 实测：五个库的按钮与复选框
  (function () {
    const el = $('#sz-grid');
    if (!el) return;
    const MONO = { d: [32, 14, 16], L: [40, 14, 20], cb: 16 }, STRESS = { d: [34, 15, 16], L: [46, 15, 20], cb: 16 };
    const same = (s) => LIB5.map(() => s);
    const DATA = {
      'mono-native': { spec: MONO, libs: [{ d: [32, 14, 16], L: [40, 16, 16], cb: 16 }, { d: [32, 14, 16], L: [40, 14, 20], cb: 14 }, { d: [36, 14, 16], d2: 17, L: [40, 15, 24], cb: 16 }, { d: [32, 14, 16], L: [36, 14, 20], cb: 14 }, { d: [32, 14, 16], L: [40, 16, 24], cb: 16 }] },
      'mono-aligned': { spec: MONO, libs: same(MONO) },
      // 只设主题时只量了高和字号
      'stress-theme': { spec: STRESS, n: 2, libs: [{ d: [34, 15], L: [46, 18], cb: 17 }, { d: [32, 15], L: [40, 15], cb: 14 }, { d: [34, 14], L: [46, 15], cb: 16 }, { d: [32, 14], L: [36, 14], cb: 14 }, { d: [34, 15], L: [46, 16], cb: 16 }] },
      'stress-aligned': { spec: STRESS, libs: same(STRESS) },
    };
    const paint = (k) => {
      const { spec, libs, n = 3 } = DATA[k];
      const lab = (v, s, extra) => v.slice(0, n).map((x, i) => X(x, x !== s[i])).join(' · ') + (extra ? ` · 次要 ${X(extra, true)}` : '');
      const bad = (v, s) => v.slice(0, n).some((x, i) => x !== s[i]);
      const one = (v, s, H, extra) => cell(H, s[0], btn(v[0], v[1], v[2] || s[2], bad(v, s) || extra), lab(v, s, extra), '', K(bad(v, s) || extra));
      el.innerHTML = head(['规格', ...LIB5])
        + rowOf('默认按钮', n === 3 ? '高 · 字号 · 文字离外边框' : '高 · 字号', [cell(48, spec.d[0], btn(...spec.d), lab(spec.d, spec.d), ' sp'), ...libs.map((v) => one(v.d, spec.d, 48, v.d2))])
        + rowOf('大号按钮', n === 3 ? '高 · 字号 · 文字离外边框' : '高 · 字号', [cell(56, spec.L[0], btn(...spec.L), lab(spec.L, spec.L), ' sp'), ...libs.map((v) => one(v.L, spec.L, 56))])
        + rowOf('复选框', '边长', [cell(24, spec.cb, box(spec.cb), `${spec.cb}`, ' sp'), ...libs.map((v) => cell(24, spec.cb, box(v.cb, v.cb !== spec.cb), X(v.cb, v.cb !== spec.cb), '', K(v.cb !== spec.cb)))]);
    };
    MH.seg('sz', paint); paint('mono-native');
  })();

  // ── 2.8 22 处：当时第一次摆出来查到的几类（四个库，默认高度还是 36）
  (function () {
    const el = $('#sz-22');
    if (!el) return;
    const libs = ['Ant Design', 'Element Plus', 'shadcn/ui', 'Arco Design'];
    // 两个复选框：第二个离第一个多远
    const pair = (x, bad) => `<span class="cbp" style="width:${x + 16}px"><span class="mc"></span><i class="lb" style="left:22px;width:${x - 30}px"></i><span class="mc${bad ? ' x' : ''}" style="left:${x}px"></span><i class="dim${bad ? ' x' : ''}" style="width:${x}px"></i></span>`;
    // 选择框 128 宽，下拉多宽
    const sel = (w, bad) => `<span class="sel"><span class="mf" style="height:24px;width:128px"></span><span class="pop${bad ? ' x' : ''}" style="width:${w}px"><i></i><i></i></span></span>`;
    el.innerHTML = head(libs)
      + rowOf('默认按钮高度', '', [36, 32, 36, 36].map((h, i) => cell(44, 36, btn(h, 14, 16, i === 1), i === 1 ? X('32 写死', true) : '36', '', K(i === 1))))
      + rowOf('默认按钮', '文字离外边框', [[16], [16], [16, 17], [20]].map((p, i) => cell(44, 0, btn(36, 14, p[0], i === 3) + (p[1] ? btn(36, 14, p[1], true, '取消') : ''), i === 2 ? `主 16 · 次要 ${X(17, true)}` : i === 3 ? `${X(20, true)} · 36 落进它的大号档` : `${p[0]}`, '', K(i >= 2))))
      + rowOf('大号按钮', '文字离外边框', [16, 20, 24, 20].map((p, i) => cell(48, 0, btn(40, 14, p, i === 2), i === 2 ? X('24 / 25', true) : `${p}`, '', K(i === 2))))
      + rowOf('两个复选框', '第二个的位置', [124, 116, 116, 116].map((x, i) => cell(40, 0, pair(x, !i), i ? '116' : `${X(124, true)} · 文字左右各留 8`, '', K(!i))))
      + rowOf('选择框 128 宽', '下拉多宽', [128, 128, 128, 84].map((w, i) => cell(70, 0, sel(w, i === 3), i === 3 ? X('按选项文字算', true) : '128', '', K(i === 3))));
  })();

  // ── 2.9 TDesign 大号：左边 TDesign 出厂，右边控件规格
  (function () {
    const el = $('#sz-td');
    if (!el) return;
    const tab = (h, bad) => `<span class="tab1${bad ? ' x' : ''}" style="height:${h}px">标签一<i></i></span>`;
    const sw = (w, h, bad) => `<span class="sw1${bad ? ' x' : ''}" style="width:${w}px;height:${h}px;--k:${h - 4}px"></span>`;
    el.innerHTML = head(['TDesign 出厂', '控件规格'])
      + rowOf('大号控件的字号', '', [cell(48, 0, field(40, 16, 12, true, 132, '客户名称', false), X(16, true)), cell(48, 0, field(40, 14, 12, false, 132, '客户名称', false), '正文字号 14')])
      + rowOf('按钮文字离外边框', '默认 / 大号', [cell(48, 0, btn(32, 14, 16) + btn(40, 16, 24, true), `16 / ${X(24, true)}`), cell(48, 0, btn(32, 14, 16) + btn(40, 14, 20), '16 / 20')])
      + rowOf('输入框文字离边框', '默认 / 大号', [cell(48, 0, field(32, 14, 9, true, 110) + field(40, 16, 13, true, 110), X('9 / 13', true)), cell(48, 0, field(32, 14, 12, false, 110) + field(40, 14, 12, false, 110), '12 / 12')])
      + rowOf('标签栏一项的高度', '', [cell(56, 40, tab(48, true), X(48, true)), cell(56, 40, tab(40), '40')])
      + rowOf('开关', '', [cell(28, 0, sw(32.4, 20, true), X('高 20，宽 = 高 ÷ 0.618', true)), cell(28, 0, sw(44, 22), '44 × 22')]);
  })();

  // ── 2.10 尺寸档案：每个库分几档、每档多高（黑色是默认档）
  (function () {
    const el = $('#sz-prof');
    if (!el) return;
    const P = [
      ['Ant Design', [24, 32, 40], 1, '由 controlHeight 一组 token 决定；标签栏、复选框等按比例推算'],
      ['Element Plus', [24, 32, 40], 1, '来自 --el-component-size；但默认按钮写死 32，大号按钮、选择框写死 40，输入框、复选框的字写死 14'],
      ['shadcn/ui', [36], 0, '写在类名里（h-9），没有统一的尺寸开关'],
      ['Arco Design', [24, 28, 32, 36], 2, '四档，每档的高度、内边距、字号都写死；输入框另有 height 属性'],
      ['TDesign', [24, 32, 40], 1, '能改成任意高度；但大号的字变 16、按钮留白变 24'],
    ];
    el.innerHTML = P.map(([n, hs, d, note]) => `<div class="ld"><b>${n}</b><div class="lad-t">${hs.map((h, i) => `<span class="lad-i${i === d ? ' on' : ''}"><i style="height:${h}px"></i>${h}</span>`).join('')}</div><p>${note}</p></div>`).join('');
  })();
})();
