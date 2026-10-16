/* 第 01 篇的交互：演示页切到客户列表、原生档「登录」按钮的底色和 Element Plus 菜单项高度——量出来直接标在真组件上。 */
(function () {
  const C = window.MhColor, MH = window.MH;
  const $ = (s, r) => (r || document).querySelector(s);
  const toHex = (css) => C.cssToHex(css);

  MH.seg('hook', (v) => MH.live('#hook-live').reload(`scene=login&spec=mono&variant=centered&state=initial&mode=${v}`));

  // 1.1 演示页：打开就切到「客户列表」，最上面正好是场景、组件库、外观、规范四组开关（登录框那一页是「布局」）
  document.addEventListener('mh:live', (e) => {
    if (e.detail.box.id !== 'demo-live') return;
    const doc = e.detail.doc;
    let n = 0;
    const go = () => {
      const b = doc && [...doc.querySelectorAll('button')].find((x) => x.textContent.trim() === '客户列表');
      if (b) { if (b.getAttribute('aria-pressed') !== 'true') b.click(); return; }
      if (++n < 40) setTimeout(go, 150);
    };
    go();
  });

  // 原生档：每一格「登录」按钮的底色，直接标在按钮上
  document.addEventListener('mh:live', (e) => {
    if (e.detail.box.id === 'native-live') setTimeout(() => MH.whenLive('#native-live', (doc) => {
      try { doc.getAnimations().forEach((a) => a.finish()); } catch (er) {}
      MH.mark(doc, [...doc.querySelectorAll('[data-audit-cell]')].map((cell) => {
        const btn = cell.querySelector('[data-region=submit] button');
        const hex = btn && toHex(doc.defaultView.getComputedStyle(btn).backgroundColor);
        // 底色：取色点钉在按钮右边的空处，小牌子骑在按钮下边线上（字在正中，不压字；不出卡片，也不碰下面一行字），带色块
        return btn && hex && { pin: btn, on: 'fill', fx: 0.8, color: hex, label: hex, place: 'bot' };
      }));
    }), 500);
    if (e.detail.box.id === 'elmenu-live') setTimeout(readMenu, 500);
  });

  // Element Plus 侧栏菜单一项的高度：量出来直接标在真组件上，标出是哪里为 56
  function readMenu() {
    MH.whenLive('#elmenu-live', (doc) => {
      try { doc.getAnimations().forEach((a) => a.finish()); } catch (er) {}
      const item = doc.querySelector('[data-region=sider] .el-menu-item') || doc.querySelector('[data-region=sider] [role=menuitem]');
      // 尺寸线画在这一项右边，数放在右上（顶栏右边是空的），不压这一项的字
      if (item) MH.mark(doc, [{ h: item, side: 'ru', label: `高 ${Math.round(item.getBoundingClientRect().height * 10) / 10}` }]);
    });
  }
  // 三种外观在几个库上是什么样（原来一张 8 × 4 的表；两个开关上面那张 2 × 2 图画过了，这里只画效果）
  (function () {
    const chip = (c, w = 22) => `<i class="ch" style="background:${c};width:${w}px"></i>`;
    const item = (h) => `<i class="mi1" style="height:${h * 0.6}px">客户列表</i>`;
    const input = (bg, border) => `<i class="in1" style="background:${bg};${border ? `box-shadow:inset 0 0 0 1px ${border}` : ''}">客户名称</i>`;
    const shadow = (on) => `<i class="sh1" style="${on ? 'box-shadow:0 1px 2px rgba(0,0,0,.08)' : ''}"></i>`;
    MH.dgrid(document.getElementById('modes-grid'), [
      { name: '主色', cells: [{ draw: ['#1677FF', '#409EFF', '#171717', '#165DFF', '#0052D9'].map((c) => chip(c, 14)).join(''), label: '四种蓝 + 黑白，各用各的' }, { draw: chip('#0A0A0A'), label: '规范的主色 #0A0A0A' }, { draw: chip('#0A0A0A'), label: '规范的主色 #0A0A0A' }] },
      { name: 'Ant Design', sub: '勾选的行', cells: [{ draw: chip('#E6F4FF', 64), label: '#E6F4FF' }, { draw: chip('#4A4A4A', 64), label: '#4A4A4A，自己推出来的深灰' }, { draw: chip('#EBEBEB', 64), label: '#EBEBEB，规范的选中面' }] },
      { name: 'Element Plus', sub: '菜单项高，按 0.6 倍画', cells: [{ draw: item(56), label: '56' }, { draw: item(56), label: '56' }, { draw: item(36), label: '36' }] },
      { name: 'Arco Design', sub: '输入框', cells: [{ draw: input('#F2F3F5'), label: '灰底，没有描边' }, { draw: input('#F2F3F5'), label: '灰底，没有描边' }, { draw: input('#fff', '#D4D4D4'), label: '白底、描边' }] },
      { name: 'shadcn/ui', sub: '控件', cells: [{ draw: shadow(1), label: '淡阴影' }, { draw: shadow(1), label: '淡阴影' }, { draw: shadow(0), label: '没有阴影' }] },
      { name: '自动检查', cells: [{ label: '不查，本来就不一样' }, { label: '不查' }, { label: '299 项全部一致' }] },
    ], { cols: ['组件库原生', '只设主题', '对齐到控件规格'] });
  })();

  MH.seg('elmenu', (v) => MH.live('#elmenu-live').reload(`scene=admin&spec=mono&sider=expanded&mode=${v}&kits=element`));
})();
