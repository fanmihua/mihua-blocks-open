/*
 * 附录 C 里每条取舍记录配的小画面。
 *   能截真组件的：五个组件库「各库原来 / 统一以后」两组截图，点一下换（图来自 _tools/shots-b.mjs 截的检查页）；
 *   截不出来的（几个选项怎么选）：画成示意，几个选项并排，定了的那一个黑框。
 * MH.tradeoffArt(第几条) 拿到这一条的画面（HTML）；没有画面的返回空字符串。
 */
(function () {
  const MH = (window.MH = window.MH || {});
  const KITS = [['antd', 'Ant Design'], ['element', 'Element Plus'], ['shadcn', 'shadcn/ui'], ['arco', 'Arco Design'], ['tdesign', 'TDesign']];
  const icon = (name, size = 14) => (window.mhIcon ? window.mhIcon(name, 'lucide', size) : '');
  const img = (src, alt) => `<img src="${src}" alt="${alt}" loading="lazy">`;

  // 五个库一排；a、b 两组图，点上面的开关换
  const strip = (region, { a = '各库原来', b = '统一以后', alt = '', srcA, srcB } = {}) => {
    const A = srcA || ((k) => `assets/img/b-${region}-native-${k}.png`), B = srcB || ((k) => `assets/img/b-${region}-aligned-${k}.png`);
    return `<div class="b5"><div class="ctl b5-ctl"><div class="seg sm"><button type="button" data-v="a" class="on">${a}</button><button type="button" data-v="b">${b}</button></div></div>`
      + `<div class="libs b5-row">${KITS.map(([k, n]) => `<div class="lib"><div class="lab"><b>${n}</b></div><span class="b5-im" data-a="${A(k)}" data-b="${B(k)}">${img(A(k), `${n}：${alt}`)}</span></div>`).join('')}</div></div>`;
  };
  // 一前一后两张图
  const pair = (l, r) => `<div class="b2">${[l, r].map(([src, cap, alt]) => `<div class="b2-c"><div class="lab"><b>${cap}</b></div>${img(src, alt || cap)}</div>`).join('<span class="b2-ar">→</span>')}</div>`;
  // 示意：几个选项并排，定了的那一个黑框
  const opts = (list) => `<div class="skx" style="--n:${list.length}">${list.map(([l, t, pic, p, on]) => `<div class="skx-o${on ? ' on' : ''}"><div class="skx-l"><b>${l}</b><span>${t}</span>${on ? '<em>定了</em>' : ''}</div><div class="skx-p">${pic}</div>${p ? `<p>${p}</p>` : ''}</div>`).join('')}</div>`;

  // 小零件
  const field = (t, cls = '', ic = 'calendar') => `<span class="mi-field ${cls}"><span>${t}</span>${ic ? `<i class="mi-ic">${icon(ic, 13)}</i>` : ''}</span>`;
  const dlg = (body, cls = '') => `<div class="mi-dlg ${cls}"><div class="mi-dh"><b>编辑客户</b><span class="mi-x">${icon('x', 13)}</span></div>${body}</div>`;
  const row = (t, cls = '') => `<div class="mi-row ${cls}"><small>${t}</small><span></span></div>`;

  const ART = {
    1: () => strip('tip', { alt: '侧栏收起后，鼠标停在「工作台」上' }),
    3: () => pair(['assets/img/b-field-native-shadcn.png', 'shadcn/ui 原来：输入框、选择框底下一道淡阴影'], ['assets/img/b-field-aligned-shadcn.png', '对齐以后：去掉']),
    4: () => strip('switch', { srcA: (k) => `assets/img/03-switch-native-${k}.png`, srcB: (k) => `assets/img/03-switch-aligned-${k}.png`, alt: '开关' }),
    5: () => pair(['assets/img/02-controls-mono-aligned-36-antd.png', '原来：控件 36'], ['assets/img/02-controls-mono-aligned-antd.png', '现在：控件 32']),
    7: () => strip('sort', { alt: '按年度金额降序排好的表头' }),
    8: () => strip('loading', { alt: '表格加载中' }),
    9: () => opts([
      ['A', '保留 TDesign 的', `<div class="mi-cells"><span class="mi-cell hit"><i class="mi-cb"></i></span><span class="mi-cell"><i class="mi-cb hit"></i></span></div><div class="mi-cap2"><span>TDesign：整格能点</span><span>别家：只有方块</span></div>`, '点哪都是勾上这一行，结果一样，保留原样。', true],
    ]),
    10: () => strip('pagination', { alt: '分页' }) + '<p class="b-cap">页数多时显示哪些页码，保留各库自己的做法（这次只有 5 页，看不到省略号）。</p>',
    11: () => opts([
      ['A', '点一下才打开', `<div class="mi-bar">${field('开始日期', 'ring')}${field('结束日期')}<span class="mi-btn dark">查询</span></div><div class="mi-under">光聚焦，面板不出来</div>`, '面板不会自己弹出来，挡住筛选栏。', true],
      ['B', '一聚焦就打开', `<div class="mi-bar">${field('开始日期', 'ring')}${field('结束日期')}<span class="mi-btn dark">查询</span></div><div class="mi-pop"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`, 'Ant Design、Element Plus 原来这样。'],
    ]),
    '12b': () => strip('date', { srcA: (k) => `assets/img/03-date-native-${k}.png`, srcB: (k) => `assets/img/03-date-aligned-${k}.png`, alt: '日期面板' }),
    13: () => opts([
      ['A', '点遮罩不关', `<div class="mi-mask">${dlg(row('客户名称') + row('备注'))}<span class="mi-click">点这里</span></div>`, '要用右上角的叉或「取消」关。表单填了一半点歪了，不会丢。三档都这样。', true],
      ['B', '点遮罩就关', `<div class="mi-mask">${dlg(row('客户名称') + row('备注'), 'gone')}<span class="mi-click">点这里</span></div>`, '五个库原来都这样。'],
    ]),
    14: () => `<div class="sk1">${dlg(`<div class="mi-row ring"><small>客户名称</small><span></span></div>${row('联系电话')}<div class="mi-foot"><span class="mi-btn">取消</span><span class="mi-btn dark">保存</span></div>`, 'tab')}<ol class="mi-steps"><li><b>打开</b>焦点进第一个输入框（黑框那里），直接就能填</li><li><b>关上</b>焦点回到打开它的「编辑」按钮</li></ol></div>`,
    '14b': () => opts([
      ['A', '原生档如实保留', `<div class="mi-two"><div><small>TDesign 原生</small>${dlg(row('客户名称') + row('联系电话'))}<span class="mi-note">焦点掉到页面上</span></div><div><small>对齐以后</small>${dlg(`<div class="mi-row ring"><small>客户名称</small><span></span></div>` + row('联系电话'))}<span class="mi-note">进第一个框</span></div></div>`, '演示时能看到缺口；只在对齐档补。', true],
      ['B', '三档都补', '', '把「关上以后焦点回到按钮」算成接口约定。'],
    ]),
    15: () => strip('radio', { alt: '对话框里的「客户等级」单选' }),
    16: () => strip('textarea', { alt: '对话框里的「备注」多行输入' }),
    17: () => strip('tag', { alt: '表格里的状态标签' }),
    18: () => strip('cbhover', { alt: '鼠标停在第一个复选框上' }),
  };
  MH.tradeoffArt = (no) => (ART[no] ? ART[no]() : '');
  // 文章里也能直接放：<div data-art="t:1"></div> 是第 1 条取舍的画面；<div data-art="strip:tip"></div> 是五个库一排
  //   （data-src-a="assets/img/x-{k}.png" 换成别的图）；<div data-art="pair:a.png|b.png" data-a="原来" data-b="后来"></div> 一前一后
  document.querySelectorAll('[data-art]').forEach((el) => {
    const [k, v] = el.dataset.art.split(':');
    const rest = el.dataset.art.slice(k.length + 1);
    if (k === 'pair') { const [a, b] = rest.split('|'); el.innerHTML = pair([a, el.dataset.a || '组件库原生', el.dataset.alt], [b, el.dataset.b || '对齐到控件规格', el.dataset.alt]); return; }
    el.innerHTML = k === 't' ? MH.tradeoffArt(v) : strip(v, { a: el.dataset.a || '组件库原生', b: el.dataset.b || '对齐到控件规格', alt: el.dataset.alt || '', srcA: el.dataset.srcA && ((kk) => el.dataset.srcA.replace('{k}', kk)), srcB: el.dataset.srcB && ((kk) => el.dataset.srcB.replace('{k}', kk)) });
  });

  // 同一排的图按同一个倍数缩放（截图都是 2 倍像素）：不放大，放不下时一起缩，五个库才比得出大小
  const fit = (box) => {
    const ims = Array.from(box.querySelectorAll('img'));
    if (!ims.length || ims.some((im) => !im.naturalWidth)) return;
    const s = Math.min(1, ...ims.map((im) => (im.parentElement.clientWidth || 1) / (im.naturalWidth / 2)));
    ims.forEach((im) => { im.style.width = Math.floor((im.naturalWidth / 2) * s) + 'px'; });
  };
  MH.sameScale = (root) => (root || document).querySelectorAll('.b5-row, .b2, .rgp-pic').forEach((box) => {
    fit(box);
    box.querySelectorAll('img').forEach((im) => { if (!im._fit) { im._fit = 1; im.addEventListener('load', () => fit(box)); } });
  });
  let rq = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => MH.sameScale()); });

  // 「各库原来 / 统一以后」：换这一排的五张图
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.b5-ctl button[data-v]');
    if (!b) return;
    const box = b.closest('.b5');
    box.querySelectorAll('.b5-ctl button').forEach((x) => x.classList.toggle('on', x === b));
    box.querySelectorAll('.b5-im').forEach((s) => { const im = s.querySelector('img'); if (im) im.src = s.dataset[b.dataset.v]; });
    MH.sameScale(box);
  });
  MH.sameScale();
})();
