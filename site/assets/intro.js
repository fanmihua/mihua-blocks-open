/* 导读：三步切换、大纲（照 blog.js 的文章清单）。 */
(function () {
  const MH = window.MH;
  const $ = (s, r) => (r || document).querySelector(s);
  const NOTE = {
    native: '什么都不改：主色、圆角、标签栏、复选框，五个各不一样。',
    theme: '大家最常用的做法：颜色统一了，标签栏、复选框、输入框还对不上。',
    aligned: '按控件规格一项一项对齐：五个一模一样。',
  };
  const note = (v) => { $('#stepnote').textContent = NOTE[v]; };
  MH.seg('step', (v) => { note(v); MH.live('#step-live').reload(`scene=login&spec=mono&variant=centered&state=initial&mode=${v}`); });
  note('native');

  // 右边的小标签：讲的是哪一层（标题下面不放小字）
  const TAG = { '01-switch.html': '总览', '02-visual.html': '视觉 · 颜色', '02-size.html': '视觉 · 尺寸', '02-icons.html': '视觉 · 图标', '03-controls.html': '控件 · 数据录入', '03-nav.html': '控件 · 导航', '03-display.html': '控件 · 数据展示', '04-structure.html': '结构', '05-audit.html': '验证', '06-ai.html': 'AI' };
  const row = ([f, n, t]) => `<a class="ol" href="${f}"><span class="n">${n}</span><div><b>${t}</b></div><em>${TAG[f] || ''}</em></a>`;
  $('#outline').innerHTML = MH.ARTICLES.filter(([f]) => f !== 'intro.html').map(row).join('') + '<div class="ol-h">附录</div>' + MH.APPENDIX.map(row).join('');

  // 解耦图
  const dec = $('#decouple');
  if (dec) {
    const L = ['视觉', '控件', '结构', '逻辑'];
    dec.innerHTML = `<div class="top"><div class="stack">${L.slice().reverse().map((n, i) => `<i style="transform:translateZ(${(i - 1.5) * 70}px)"><b>0${4 - i} ${n}</b>${i === 3 ? '<img src="assets/img/02-login-mono-aligned-antd.png" alt="">' : ''}</i>`).join('')}</div></div>
      <div class="txt"><b>我们要的设计</b><span>视觉 · 控件 · 结构 · 逻辑，只写一次</span></div>
      <div class="cut"><span>解耦</span></div>
      <div class="libs5">${['Ant Design', 'Element Plus', 'shadcn/ui', 'Arco Design', 'TDesign'].map((n) => `<div><em>套件</em><i></i><b>${n}</b></div>`).join('')}</div>
      <div class="txt"><b>某个组件库的写法</b><span>每个库各不相同，每个库配一个套件去翻译</span></div>`;
  }
})();
