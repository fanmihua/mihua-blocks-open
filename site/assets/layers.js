/*
 * 剖面图：把登录框像剖面一样拆成四层（照上一期视频的画法，改成白底）。
 * 顶层是真登录框的 2 倍截图；控件层、结构层的框画在真组件量出来的位置上（检查页 · 登录框 · Ant Design · 对齐，2026-10-14 量）；
 * 逻辑层是 core/src/login/controller.ts 里初始状态的几个字段。
 * 用法：<div class="lay3d" data-lay3d></div>
 */
(function () {
  const CTL = [['Tabs', 33, 115, 334, 40], ['Select', 33, 171, 96, 40], ['Input', 137, 171, 230, 40], ['Input', 33, 227, 334, 40], ['Checkbox', 33, 283, 108, 22], ['Checkbox', 33, 321, 334, 22], ['Button', 33, 359, 334, 40]];
  const REG = [['头部', 33, 33, 334, 58], ['登录方式', 33, 115, 334, 40], ['输入', 33, 171, 334, 96], ['协议', 33, 283, 334, 60], ['提交', 33, 359, 334, 40], ['其他登录方式', 33, 469, 334, 110]];
  const LOGIC = [['method', "'phone'"], ['countryCode', "'+86'"], ['identity', "''"], ['code', "''"], ['agreed', 'false'], ['remember', 'true'], ['resendSeconds', '0'], ['status', "'idle'"]];
  const L = [
    ['视觉', '颜色、字号、圆角、尺寸、图标', '02-visual.html'],
    ['控件', '开关多大、表格多高、菜单怎么选中', '03-controls.html'],
    ['结构', '页面分哪几块、怎么排、间距多少', '04-structure.html'],
    ['逻辑', '用户选了什么、勾了什么、填了什么', ''],
  ];
  const box = (cls, [n, x, y, w, h], text) => `<div class="${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><b>${text ?? n}</b></div>`;
  function render(el) {
    const planes = [
      `<div class="pl" data-i="3"><i class="tg">04 逻辑</i><div class="lg"><p>LoginController</p>${LOGIC.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>`,
      `<div class="pl" data-i="2"><i class="tg">03 结构</i>${REG.map((r, i) => box('rg', r, `0${i + 1} ${r[0]}`)).join('')}</div>`,
      `<div class="pl" data-i="1"><i class="tg">02 控件</i>${CTL.map((c) => box('ct', c)).join('')}</div>`,
      `<div class="pl face" data-i="0"><i class="tg">01 视觉</i><img src="assets/img/02-login-mono-aligned-antd.png" alt="登录框 · Ant Design · 对齐 · 黑白规范"></div>`,
    ];
    el.innerHTML = `<div class="ll">${L.map(([n, d, href], i) => `<button type="button" data-i="${i}"><span>0${i + 1}</span><b>${n}</b><em>${d}</em></button>`).join('')}<p class="hint">点一层，高亮显示</p></div><div class="lv"><div class="tilt"><div class="rig">${planes.join('')}</div></div></div>`;
    const btns = [...el.querySelectorAll('.ll button')];
    const pls = [...el.querySelectorAll('.pl')];
    const set = (j) => { el.dataset.on = j; btns.forEach((b) => b.classList.toggle('on', +b.dataset.i === j)); pls.forEach((p) => { p.classList.toggle('sel', +p.dataset.i === j); p.classList.toggle('up', +p.dataset.i < j); }); };
    btns.forEach((b) => b.addEventListener('click', () => set(+el.dataset.on === +b.dataset.i ? -1 : +b.dataset.i)));
    set(-1);
  }
  document.querySelectorAll('[data-lay3d]').forEach(render);
})();
