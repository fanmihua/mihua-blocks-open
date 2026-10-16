/*
 * 文字版的公共脚本：本篇目录（宽屏常驻左边、能拖宽窄、能收起；窄屏抽屉）、阅读进度、真组件嵌入、分段开关、复制、
 * 放大看（任何一张图单独铺满屏幕，录视频用；网址带 ?fig=s3-1 直接打开第 3 节第 1 张）。
 * 不依赖任何库，双击打开也能跑（双击时真组件换成截图）。
 *
 * 真组件：<div class="live" data-live="scene=…&kits=antd" data-shot="assets/img/x.png"></div>
 *   嵌的是 site/demo/ 里编译好的检查页（audit.html），按网址参数只渲染一格；滚到附近才加载。
 *   宽度跟容器走，内容按比例缩小（不放大超过 data-max，默认 1），高度跟着内容。
 *   页面脚本用 MH.live(box) 拿到 { doc(), reload(query) }；加载好会在 document 上发 mh:live。
 * 分段开关：<div class="seg" data-ctl="x"><button data-v="a" class="on">…</button></div>，页面脚本用 MH.seg('x', fn)。
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const served = location.protocol !== 'file:';
  const ARTICLES = [
    ['intro.html', '导读', '一份设计，如何适配不同组件库'],
    ['00-repo.html', '00', '源码仓库：包含哪些内容，如何使用'],
    ['01-switch.html', '01', '整体演示：三种外观模式与四层拆解'],
    ['02-visual.html', '02-1', '视觉层：统一颜色'],
    ['02-size.html', '02-2', '视觉层：统一尺寸'],
    ['02-icons.html', '02-3', '视觉层：统一图标'],
    ['03-controls.html', '03-1', '控件层：总述与数据录入'],
    ['03-nav.html', '03-2', '控件层：导航'],
    ['03-display.html', '03-3', '控件层：通用与数据展示'],
    ['04-structure.html', '04', '结构层：统一页面布局'],
    ['05-audit.html', '05', '验证：如何检查一致性'],
    ['06-ai.html', '06', '交给 AI：如何让生成结果符合适配要求'],
  ];
  const READY = ['intro.html', '00-repo.html', '01-switch.html', '02-visual.html', '02-size.html', '02-icons.html', '03-controls.html', '03-nav.html', '03-display.html', '04-structure.html', '05-audit.html', '06-ai.html'];
  const APPENDIX = [
    ['a1-libraries.html', 'A', '五个组件库档案'],
    ['a2-adaptations.html', 'B', '适配记录'],
    ['a3-tradeoffs.html', 'C', '取舍记录'],
    ['a4-prompts.html', 'D', '常用提示词'],
  ];
  // 视频：网页每章一集（导读、附录没有对应的一集）。[编号, 短名, 视频标题（还没有的写空）, 页面]
  const SERIES = [
    ['00', '仓库', '', '00-repo.html'],
    ['01', '整体演示', '', '01-switch.html'],
    ['02-1', '颜色', '', '02-visual.html'],
    ['02-2', '尺寸', '', '02-size.html'],
    ['02-3', '图标', '', '02-icons.html'],
    ['03-1', '总述与数据录入', '', '03-controls.html'],
    ['03-2', '导航', '', '03-nav.html'],
    ['03-3', '通用与数据展示', '', '03-display.html'],
    ['04', '结构', '', '04-structure.html'],
    ['05', '验证', '', '05-audit.html'],
    ['06', '交给 AI', '', '06-ai.html'],
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  // 线上演示页：双击打开（file://）时 demo/ 跑不起来，演示页入口改指这里
  const DEMO_URL = 'https://fanmihua.github.io/mihua-blocks-open/demo/';
  // 公开版（site/_tools/public.mjs 生成时写进 window.MH_PUBLIC）：part 是只公开一部分的页面；完整版里没有这个
  const PART = (window.MH_PUBLIC && window.MH_PUBLIC.part) || [];
  const MH = (window.MH = { ARTICLES, READY, APPENDIX, SERIES, DEMO_URL, PART });
  // 浏览器里记一点个人偏好（目录宽窄、收没收起）；隐私窗口里读写会失败，失败就当没记
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
  // 正文宽窄变了（拖目录、收起目录）：通知各篇的图重新排一次
  MH.relayout = () => dispatchEvent(new Event('resize'));

  // ── 代码开关（给不想看代码的读者）：顶栏正中，默认打开；关了就记在这台电脑的浏览器里
  //   关的时候藏：代码面板；只装代码的图；紧挨着、只用来引出代码的小标题。图和代码混在一起的，只藏代码那一块。
  //   放大看（?fig=）的时候照常显示，静帧不受影响。
  //   首页「阅读说明」里那个开关和顶栏的是同一个；那里的示例代码面板（.eg）一直显示
  const codes = $$('main .code:not(.eg)'), mirrors = $$('main .code-tg');
  if (codes.length || mirrors.length) {
    // 只装代码的图：除了代码，只剩说明、切换代码的开关、放大按钮
    const onlyCode = (el) => [...el.children].every((k) => k.matches('.code, .ctl, figcaption, .fig-x') || (k.matches('.codes') && [...k.children].every((x) => x.matches('.code'))));
    new Set(codes.map((c) => c.closest('figure')).filter(Boolean)).forEach((fig) => {
      if (onlyCode(fig)) {
        fig.classList.add('code-only');
        const h = fig.previousElementSibling;
        if (h && h.tagName === 'H3') h.classList.add('code-h');
      }
    });
    // 代码和别的东西并排的（左说明右代码）：代码藏起来以后，剩下的占满一行
    new Set(codes.map((c) => c.parentElement)).forEach((g) => { if (!g.matches('figure') && ![...g.children].every((x) => x.matches('.code'))) g.classList.add('code-mixed'); });
    const tg = document.createElement('button');
    tg.type = 'button';
    tg.className = 'code-tg';
    tg.innerHTML = '<span>代码</span><i class="sw2"></i>';
    $('.bar .sp')?.before(tg);
    const tgs = [tg, ...mirrors];
    const set = (on, keep) => {
      document.body.classList.toggle('code-off', !on);
      tgs.forEach((b) => b.setAttribute('aria-pressed', on ? 'true' : 'false'));
      if (!keep) store.set('mh.code', on ? null : 'off');
      MH.relayout();
    };
    // 网址带 ?fig= 是录视频截静帧：这一次照常显示，不改记下的选择
    const still = new URLSearchParams(location.search).has('fig');
    set(still || store.get('mh.code') !== 'off', true);
    tgs.forEach((b) => b.addEventListener('click', () => set(document.body.classList.contains('code-off'))));
  }

  // ── 本篇目录
  const toc = $('#toc');
  if (toc) {
    document.body.classList.add('has-toc');
    const secs = $$('.sec[id], .part[id]');
    // 每一部分是一组：点组名展开、收起（目录太长）；后面把每组的链接包进 .gi
    toc.innerHTML = `<h4>本篇</h4><p class="art">${$('.head h1')?.textContent || ''}</p>${secs
      .map((s) => (s.classList.contains('part') ? `<button type="button" class="grp"><span>${$('.no', s)?.textContent || ''}　${$('h2', s)?.textContent || ''}</span></button>` : `<a href="#${s.classList.contains('locked') ? 'course' : s.id}" data-id="${s.id}"${s.classList.contains('locked') ? ' class="lk"' : ''}><i>${$('.kick .no', s)?.textContent || ''}</i><span>${$('h2', s)?.textContent || ''}</span></a>`))
      .join('')}<div class="others"><h4>全部文章</h4>${ARTICLES.map(([f, n, t]) => `<a href="${f}" class="${f === here ? 'cur' : ''}${PART.includes(f) ? ' pt' : ''}"><i>${n}</i><span>${t}${READY.includes(f) ? '' : '（在写）'}</span></a>`).join('')}<h4>附录</h4>${APPENDIX.map(([f, n, t]) => `<a href="${f}" class="${f === here ? 'cur' : ''}${PART.includes(f) ? ' pt' : ''}"><i>${n}</i><span>${t}</span></a>`).join('')}<a href="index.html"><i>⌂</i><span>首页</span></a></div>`;
    const body = document.body, root = document.documentElement;
    const DOCK = 1240, MINW = 200, MAXW = 480, DEFW = 288;
    // 宽屏：目录常驻左边，宽窄、收没收起记在这台电脑的浏览器里
    let hide = store.get('mh.toc.hide') === '1';
    const w0 = +store.get('mh.toc.w');
    if (w0 >= MINW && w0 <= MAXW) root.style.setProperty('--tocw', w0 + 'px');
    const setOpen = (on) => { toc.classList.toggle('open', on); body.classList.toggle('toc-open', on); };
    const dock = () => {
      const on = innerWidth >= DOCK && !hide, was = body.classList.contains('toc-dock');
      body.classList.toggle('toc-dock', on);
      if (on) setOpen(false);
      if (was !== on) MH.relayout();
    };
    const toggle = () => { if (innerWidth >= DOCK) { hide = !hide; store.set('mh.toc.hide', hide ? '1' : null); dock(); } else setOpen(!toc.classList.contains('open')); };
    $('.btn-toc')?.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    toc.addEventListener('click', (e) => { if (e.target.closest('a') && !body.classList.contains('toc-dock')) setOpen(false); });
    document.addEventListener('click', (e) => { if (toc.classList.contains('open') && !e.target.closest('#toc, .btn-toc')) setOpen(false); });
    addEventListener('keydown', (e) => { if (body.classList.contains('staging')) return; if (e.key === 'Escape') setOpen(false); if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) toggle(); });
    addEventListener('resize', dock);
    dock();
    // 右边缘的把手：拖宽窄，双击回到默认
    const rs = document.createElement('div');
    rs.className = 'toc-rs';
    rs.title = '拖动调宽窄，双击恢复';
    body.appendChild(rs);
    let drag = 0, raf = 0;
    const setW = (w) => { w = Math.round(Math.max(MINW, Math.min(MAXW, innerWidth - 640, w))); root.style.setProperty('--tocw', w + 'px'); return w; };
    rs.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = 1; rs.setPointerCapture(e.pointerId); body.classList.add('toc-drag'); });
    rs.addEventListener('pointermove', (e) => { if (!drag) return; setW(e.clientX); if (!raf) raf = requestAnimationFrame(() => { raf = 0; MH.relayout(); }); });
    const end = (e) => { if (!drag) return; drag = 0; body.classList.remove('toc-drag'); store.set('mh.toc.w', setW(e.clientX)); MH.relayout(); };
    rs.addEventListener('pointerup', end);
    rs.addEventListener('pointercancel', end);
    rs.addEventListener('dblclick', () => { root.style.removeProperty('--tocw'); store.set('mh.toc.w', null); MH.relayout(); });
    // 把每一部分后面的链接包成一组；默认只展开当前读到的那一组
    $$('.grp', toc).forEach((g) => {
      const gi = document.createElement('div');
      gi.className = 'gi';
      while (g.nextElementSibling && g.nextElementSibling.matches('a[data-id]')) gi.append(g.nextElementSibling);
      g.after(gi);
      g.classList.add('shut');
      g.addEventListener('click', () => g.classList.toggle('shut'));
    });
    const reveal = (a) => a?.closest('.gi')?.previousElementSibling?.classList.remove('shut');
    const links = new Map($$('a[data-id]', toc).map((a) => [a.dataset.id, a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { $$('a.on', toc).forEach((a) => a.classList.remove('on')); links.get(en.target.id)?.classList.add('on'); reveal(links.get(en.target.id)); } }), { rootMargin: '-30% 0px -65% 0px' });
    secs.forEach((s) => s.classList.contains('sec') && io.observe(s));
  }

  // ── 出处：页面上不显示。HTML 里的 <p class="src"> 留着，给改网页的人和 AI 查来源
  $$('main .src').forEach((e) => e.remove());

  // ── 标题下面的「四层」：这一篇讲哪一层
  $$('.lstrip[data-on]').forEach((el) => {
    const on = el.dataset.on.split(/\s+/);
    el.innerHTML = '<span class="lb">四层里讲的是</span>' + ['视觉', '控件', '结构', '逻辑'].map((x, i) => `<span class="ls${on.includes(x) ? ' on' : ''}"><i>${i + 1}</i>${x}</span>`).join('');
  });

  // ── 视频标题写在别处的：按 SERIES 填（data-ep="02-1"）
  $$('[data-ep]').forEach((el) => { const x = SERIES.find((y) => y[0] === el.dataset.ep); if (x) el.textContent = `第 ${x[0]} 集 · ${x[2] || x[1]}`; });

  // ── 头部那排格子：视频一集一格，这一篇亮、前面的变灰；这一篇不是视频的一集（导读、附录），就不画
  const ep = SERIES.findIndex((x) => x[3] === here);
  $$('.head .series').forEach((el) => {
    const lab = el.nextElementSibling && el.nextElementSibling.classList.contains('series-l') ? el.nextElementSibling : null;
    if (ep < 0) { el.remove(); lab?.remove(); return; }
    el.innerHTML = SERIES.map(([n, t, , f], i) => `<a class="${i < ep ? 'done' : i === ep ? 'now' : ''}" href="${f}" title="${n} ${t}"></a>`).join('');
    if (lab) { const a = SERIES[0], b = SERIES[SERIES.length - 1]; lab.innerHTML = `<span>${a[0]} ${a[1]}</span><span>${b[0]} ${b[1]}</span>`; }
  });

  // ── 视频各集的卡片（现在没有页面用；集数跟着 SERIES）
  $$('.series6').forEach((el) => {
    const on = el.dataset.series6;
    el.innerHTML = SERIES.map(([n, t, q, f]) => `<a class="s6${n === String(on).padStart(2, '0') ? ' on' : ''}" href="${f}"><span class="sk">组件库差异</span><b>${n}</b><i class="g">${SERIES.map((x) => `<s${x[0] <= n ? ' class="f"' : ''}></s>`).join('')}</i><h4>${q || t}</h4></a>`).join('');
  });

  // ── 上一篇、下一篇：按文章清单生成（改标题只改上面一处）
  const nx = $('.next');
  if (nx) {
    const all = ARTICLES.concat(APPENDIX);
    const i = all.findIndex(([f]) => f === here);
    const prev = all[i - 1], next = all[i + 1];
    const lab = ([f, n, t]) => `${/^\d/.test(n) ? n + ' · ' : ''}${t}`;
    nx.innerHTML = (prev ? `<a href="${prev[0]}"><span>← 上一篇</span><b>${lab(prev)}</b></a>` : '<a href="index.html"><span>← 回首页</span><b>全部文章</b></a>') + (next ? `<a class="r" href="${next[0]}"><span>${i + 1 >= ARTICLES.length ? '附录' : '下一篇'} →</span><b>${lab(next)}</b></a>` : '<a class="r" href="index.html"><span>回首页 →</span><b>全部文章</b></a>');
  }

  // ── 文章开头的「这一篇」小目录
  const intoc = $('#intoc ol');
  const item = (s) => `<li><a href="#${s.classList.contains('locked') ? 'course' : s.id}"${s.classList.contains('locked') ? ' class="lk"' : ''}><i>${$('.kick .no', s)?.textContent || ''}</i>${$('h2', s)?.textContent || ''}</a></li>`;
  if (intoc && $$('.part[id]').length) {
    // 分了部分的篇（导读、01–06）一律按部分分组：每部分一行组名，下面两列小节，全部展开（所有页面的目录统一排版）
    // 「开头」「小结」这种不带数字的小节不归哪一部分，单独一行
    intoc.parentElement.classList.add('grouped');
    let html = '', open = false;
    $$('.sec[id], .part[id]').forEach((s) => {
      if (s.classList.contains('part')) {
        html += (open ? '</ol></li>' : '') + `<li class="ig"><div class="ig-h"><i>${$('.no', s)?.textContent || ''}</i>${$('h2', s)?.textContent || ''}</div><ol>`;
        open = true;
      } else if (!/\d/.test($('.kick .no', s)?.textContent || '')) {
        html += (open ? '</ol></li>' : '') + item(s);
        open = false;
      } else html += item(s);
    });
    intoc.innerHTML = html + (open ? '</ol></li>' : '');
  } else if (intoc) intoc.innerHTML = $$('.sec[id]').map(item).join('');

  // ── 悬浮解释（.tipq）：靠右边放不下时，往左展开
  const tipSide = (e) => { const t = e.target.closest && e.target.closest('.tipq'); if (t) t.classList.toggle('tip-r', t.getBoundingClientRect().left + Math.min(320, innerWidth * 0.8) > innerWidth - 16); };
  document.addEventListener('mouseover', tipSide);
  document.addEventListener('focusin', tipSide);

  // ── 截图自己带了卡片边框的（控件样张、登录框……），外面就不再套一层框，免得看着像两层
  // 看四条边正中那几个像素有没有灰线；本地直接双击打开时读不了像素，就照旧
  const framed = (img) => {
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w < 40 || h < 40) return false;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const dark = (x0, y0, dx, dy) => { for (let i = 0; i < 6; i++) { const d = g.getImageData(x0 + dx * i, y0 + dy * i, 1, 1).data; if (d[3] > 200 && d[0] < 240 && Math.abs(d[0] - d[1]) < 12) return true; } return false; };
      return dark(0, h >> 1, 1, 0) && dark(w - 1, h >> 1, -1, 0) && dark(w >> 1, 0, 0, 1) && dark(w >> 1, h - 1, 0, -1);
    } catch { return false; }
  };
  const mark = (img) => { if (framed(img)) img.classList.add('own-frame'); };
  const watch = (img) => (img.complete && img.naturalWidth ? mark(img) : img.addEventListener('load', () => mark(img), { once: true }));
  if (served && $('main')) {
    $$('main img').forEach(watch);
    // 各篇脚本后画出来的图（附录、小画面）也看一遍
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) (n.tagName === 'IMG' ? [n] : $$('img', n)).forEach(watch); }))).observe($('main'), { childList: true, subtree: true });
  }

  // ── 阅读进度
  const bar = $('.progress');
  if (bar) {
    const on = () => { const h = document.documentElement; const m = h.scrollHeight - h.clientHeight; bar.style.width = (m > 0 ? (h.scrollTop / m) * 100 : 0) + '%'; };
    addEventListener('scroll', on, { passive: true }); on();
  }

  // ── 手机上一屏放不下的东西（几个库并排的真组件、整页演示、插画、多列的表）：按看得清的大小横着滑，旁边一行小字提示
  const NARROW = matchMedia('(max-width: 760px)');
  const MIN_CELL = 240, MIN_CELL_S = 0.5, MIN_PAGE = 0.6, KITS_H = 26;
  const swipeHint = (el, on, text, before) => {
    let h = el._hint;
    if (!on && !h) return;
    if (!h) { h = el._hint = document.createElement('p'); h.className = 'swipe-hint'; before ? el.before(h) : el.after(h); }
    h.textContent = text;
    h.hidden = !on;
  };
  // 右边还有没滑到的，右边缘淡出去
  const edge = (el) => el.classList.toggle('more', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  const watchEdge = (el) => { if (el._edge) return edge(el); el._edge = 1; el.addEventListener('scroll', () => edge(el), { passive: true }); edge(el); };

  // ── 真组件
  const SB = '::-webkit-scrollbar{width:12px;height:12px}::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.16) content-box;border:3px solid transparent;border-radius:12px}::-webkit-scrollbar-thumb:hover{background-color:rgba(0,0,0,.34)}';
  // data-only="[data-region=switch]"：每个库只留这一块，五个库一行一个，左边写库名；右边空出 data-room 宽给标注，
  //   每一行上面、库名和组件之间也各空出一条，给尺寸线和数（不压在组件和下一行上）
  //   （对照台用：一次只看一项，标在真组件上）。只加类名和样式，不动组件本身，点、悬停都照常
  function only(doc, sel, room) {
    if (doc.documentElement.dataset.mhOnly === sel) return;
    const hit = doc.querySelectorAll(sel);
    if (!hit.length) return;
    doc.documentElement.dataset.mhOnly = sel;
    const st = doc.createElement('style');
    const n = NARROW.matches;
    st.textContent = `body .audit{flex-direction:column!important;align-items:stretch!important;gap:${n ? 58 : 38}px!important;padding-top:${n ? 54 : 44}px!important;padding-right:${room}px!important}.audit__cell{flex-direction:row!important;align-items:center!important;gap:0!important}.audit__cell>p{display:block!important;flex:none;width:118px;margin-right:${n ? 60 : 48}px!important;font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace!important;color:#525252!important}.mh-only-hide{display:none!important}.mh-only-path{width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;gap:0!important}`;
    doc.head.appendChild(st);
    hit.forEach((el) => {
      for (let n = el; n && !n.classList.contains('audit__cell'); n = n.parentElement) {
        const up = n.parentElement;
        if (!up) break;
        const top = up.classList.contains('audit__cell');
        [...up.children].forEach((c) => { if (c !== n && !(top && c.matches('p, .audit__start'))) c.classList.add('mh-only-hide'); });
        if (!top) up.classList.add('mh-only-path');
      }
    });
  }
  function initLive(box) {
    if (box._live) return box._live;
    const page = box.dataset.page || 'audit.html';
    const url = () => `demo/${page}?${box.dataset.live || ''}`;
    if (!served) {
      box.innerHTML = `<div class="fallback">${box.dataset.shot ? `<img src="${box.dataset.shot}" alt="">` : ''}<p>双击打开时这里是截图；用网页地址打开，这里就是能点的真组件。</p></div>`;
      return (box._live = { doc: () => null, reload() {}, fit() {} });
    }
    box.innerHTML = '<div class="wait">真组件加载中…</div>';
    box.style.minHeight = (box.dataset.min || 240) + 'px';
    const frame = document.createElement('iframe');
    frame.title = box.dataset.title || '真组件';
    frame.style.width = '3000px';
    frame.style.height = '1600px';
    box.appendChild(frame);
    // 手机上：放不下就按看得清的大小排，容器横着滑；几个库并排时，每一格上面写库名
    let kitsBar = null;
    const wide = (on, cells, s) => {
      box.classList.toggle('wide', on);
      if (on) watchEdge(box); else box.classList.remove('more');
      swipeHint(box.closest('.frame') || box, on, cells ? '左右滑动看另外几个库' : '左右滑动看整页');
      if (!on || !cells) { kitsBar?.remove(); kitsBar = null; return; }
      if (!kitsBar) { kitsBar = document.createElement('div'); kitsBar.className = 'live-kits'; box.appendChild(kitsBar); }
      kitsBar.innerHTML = cells.map((c) => `<span style="left:${Math.round(c.getBoundingClientRect().left * s)}px">${c.querySelector(':scope > p')?.textContent || c.dataset.auditCell || ''}</span>`).join('');
    };
    const fit = () => {
      try {
        const doc = frame.contentDocument;
        if (page !== 'audit.html') {
          // 整个演示页：按给定的宽度排，等比缩到容器宽（手机上最小 0.6 倍、横着滑），高度跟着演示页的内容
          if (!doc || !doc.body) return;
          const ch = Math.ceil(doc.body.scrollHeight);
          if (ch < 120) return;
          // 高度按内容算以后，原来写的宽高比不再管用（留着会反过来把宽度撑大）
          box.style.aspectRatio = 'auto';
          const w = +(box.dataset.w || 1440), fs = Math.min(1, box.clientWidth / w);
          const s = NARROW.matches ? Math.max(fs, MIN_PAGE) : fs;
          frame.style.width = w + 'px';
          frame.style.height = ch + 'px';
          frame.style.transform = `scale(${s})`;
          box.style.height = Math.ceil(ch * s) + 'px';
          box.style.minHeight = '0';
          box._scale = s;
          wide(s > fs + 0.001);
          box.classList.add('ready');
          return;
        }
        const root = doc && doc.querySelector('.audit');
        if (!root) return;
        if (box.dataset.only) only(doc, box.dataset.only, +(box.dataset.room || 280));
        if (!doc.getElementById('mh-embed')) {
          const st = doc.createElement('style');
          st.id = 'mh-embed';
          st.textContent = `html,body{background:#fff!important}.audit{padding:${box.dataset.pad ?? 16}px!important;gap:24px!important}.audit__cell>p{display:none}`;
          doc.head.appendChild(st);
        }
        const w = Math.ceil(root.scrollWidth), h = Math.ceil(root.getBoundingClientRect().height);
        if (!w || !h) return;
        // data-focus：只看页面里的某一块，放大到容器宽（最多 data-max 倍，默认 1.6）
        const foc = box.dataset.focus && doc.querySelector(box.dataset.focus);
        if (foc) {
          const r = foc.getBoundingClientRect(), pad = +(box.dataset.focusPad ?? 24);
          const fw = r.width + pad * 2, fh = r.height + pad * 2;
          // data-focus-min：手机上至少这么大（整张表格这种宽的，缩到一屏宽就看不清了），放不下就横着滑
          const fit0 = Math.min(box.clientWidth / fw, +(box.dataset.max || 1.6)), s = NARROW.matches && box.dataset.focusMin ? Math.max(fit0, +box.dataset.focusMin) : fit0;
          wide(s > fit0 + 0.001);
          frame.style.width = Math.max(w, Math.ceil(r.right + pad)) + 'px';
          frame.style.height = Math.max(h, Math.ceil(r.bottom + pad)) + 'px';
          const left = Math.max(0, (box.clientWidth - fw * s) / 2);
          frame.style.transform = `translate(${left - (r.left - pad) * s}px, ${-(r.top - pad) * s}px) scale(${s})`;
          box.style.height = Math.ceil(fh * s) + 'px';
          box.style.minHeight = '0';
          box.classList.add('ready');
          return;
        }
        const max = +(box.dataset.max || 1), fs = Math.min(box.clientWidth / w, max);
        // 几个库并排：手机上每一格至少约 240 宽，大的格子（整张客户列表）至少缩到一半
        // 只显示一块（data-only）时一个库一行、库名写在左边：手机上至少 0.75 倍，横着滑看右边的标注，不用上面那条库名
        //   只算看得见的格子（页面脚本藏起几格时）；只有一格、或上下排的（第二格在第一格下面）不画上面那条库名
        //   data-min-scale：单格或上下排的，手机上至少缩到这么大，放不下就横着滑
        const cells = box.dataset.only ? [] : Array.from(doc.querySelectorAll('.audit__cell')).filter((c) => c.offsetWidth > 0);
        const stacked = cells.length > 1 && cells[1].getBoundingClientRect().top >= cells[0].getBoundingClientRect().bottom - 1;
        const cw = cells.length > 1 && !stacked && NARROW.matches ? cells[0].getBoundingClientRect().width : 0;
        let s = cw ? Math.max(fs, Math.min(max, Math.max(MIN_CELL / cw, MIN_CELL_S))) : box.dataset.only && NARROW.matches ? Math.max(fs, Math.min(max, 0.75)) : fs;
        if (box.dataset.minScale && NARROW.matches && (cells.length <= 1 || stacked)) s = Math.max(fs, Math.min(max, +box.dataset.minScale));
        const bar = cells.length > 1 && !stacked, on = s > fs + 0.001, top = on && bar ? KITS_H : 0;
        frame.style.width = w + 'px';
        frame.style.height = h + 'px';
        const left = on || box.dataset.align === 'left' ? 0 : Math.max(0, (box.clientWidth - w * s) / 2);
        frame.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
        box.style.height = Math.ceil(h * s) + top + 'px';
        box.style.minHeight = '0';
        box._scale = s;
        wide(on, bar ? cells : null, s);
        box.classList.add('ready');
      } catch (e) { box.classList.add('ready'); }
    };
    frame.addEventListener('load', () => {
      // 嵌进来的页面也用细滚动条
      try { const d = frame.contentDocument; if (d && !d.getElementById('mh-sb')) { const st = d.createElement('style'); st.id = 'mh-sb'; st.textContent = SB; d.head.appendChild(st); } } catch {}
      // 嵌进来的页面自己挪焦点（比如对话框打开时）不带着文章滚走：读者停在哪就还在哪
      try {
        const P = frame.contentWindow.HTMLElement.prototype, f0 = P.focus;
        if (!P._mhFocus) { P._mhFocus = 1; P.focus = function (o) { return f0.call(this, Object.assign({}, o, { preventScroll: true })); }; }
      } catch {}
      fit();
      [200, 600, 1200, 2500, 4000].forEach((t) => setTimeout(fit, t));
      // 嵌进来的页面内容变高变矮（换了外观、样式晚到、对话框打开）也跟着重新量；同一个大小不重复量
      try {
        const d = frame.contentDocument, w = frame.contentWindow, target = d && (d.querySelector('.audit') || d.body);
        if (target && w.ResizeObserver) {
          let last = '', raf = 0;
          new w.ResizeObserver(() => {
            const r = target.getBoundingClientRect(), key = Math.round(r.width) + 'x' + Math.round(r.height);
            if (key === last) return;
            last = key;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(fit);
          }).observe(target);
        }
      } catch {}
      document.dispatchEvent(new CustomEvent('mh:live', { detail: { box, doc: frame.contentDocument } }));
    });
    addEventListener('resize', fit);
    let bw = 0;
    if (window.ResizeObserver) new ResizeObserver(() => { if (box.clientWidth !== bw) { bw = box.clientWidth; fit(); } }).observe(box);
    const live = { frame, fit, doc: () => frame.contentDocument, reload(q) { if (q !== undefined) box.dataset.live = q; box.classList.remove('ready'); frame.src = url(); } };
    box._live = live;
    frame.src = url();
    return live;
  }
  MH.live = (box) => (typeof box === 'string' ? (box = $(box)) : box) && initLive(box);
  // 量出来的数直接标在真组件上（不另放量数面板，在组件上标出是哪里）。
  // 量什么，标法就不一样（圆角、边框、高度都不用框来标），照 Figma 标注的习惯：
  //   尺寸、距离 → 尺寸线（两头短横），数写在线旁边；圆角 → 贴着那个角画一段弧；
  //   颜色（描边、底色）→ 取色点钉在描边上 / 底色里，引线拉到小牌子，牌子上带色块；字重 → 字上面一道括线；
  //   悬停、禁用、聚焦怎么画 → 取色点指着那个控件（不带色块）。和规格一样的标黑，不一样的标红。
  // MH.mark(doc, [标注…], { clip })：同一个页面再调一次就整组换掉。每条标注 label 写在小牌子上；ok 为真标黑、假标红、null 标灰（只是提示）；
  //   clip 给一个元素时，小牌子不出它的左右边（只露出一块的嵌入）。每条标注：
  //   { h: el, side, fx }    el 的高：竖尺寸线。side 'l' 画在左边、数在线左边；'r'（默认）右边；'ru' 右边、数放到右上（旁边紧挨着别的控件时）；
  //                          fx（0–1）：线画在 el 里面这个位置（整宽的顶栏、菜单项外面没地方时），数照 side 放线的左边或右边
  //   { w: el, side, fy }    el 的宽：横尺寸线。side 't'（默认）上面；'b' 下面；'br' 下面、数放在线右端外面（不占下一行上方）；
  //                          fy（0–1）：线画在 el 里面这个高度（侧栏这种高的，横着量一道），数在线上方
  //   { gap: [x1, x2, y], lift }   两点之间的距离（坐标照 getBoundingClientRect）：横尺寸线；lift 给一个元素时，数抬到它上方，引线连过去；lift 'l'：数放在线左边外面
  //   { corner: el, at }      圆角：读 el 自己那个角的圆角，贴着角画弧；at 'tl'（默认）左上、'tr' 右上；数写在角外
  //   { pin: el, on, fx, fy, color, lift, place }   取色点：on 'edge'（默认，钉在上边线）/ 'bottom'（下边线）/ 'fill'（钉在里面，fy 竖着在哪）；fx 横着在哪（0–1，默认 0.5）；
  //                           color 给了就是色块；小牌子默认在 el（或 lift）上方，place 'r' 放右边、'in' 放 el 里面、挨着点（点在右半边就放点左边）、'below' 放下面、'top' / 'bot' 骑在 el 的上 / 下边线上（以点为中）；
  //                           also：另外几个元素也钉点，连到同一块小牌子
  //   { over: el, lift }      字上面一道括线（量字重、字色）；el 是装着字的元素
  //   旧写法 { el, label, at, box }、{ dim: { x1, x2, y } } 还认（box: false 只写字）
  const MARK_CSS = `#mh-mk{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483646}
#mh-mk svg{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible}
#mh-mk .b{position:absolute;outline:1.5px dashed #F24E1E;outline-offset:3px}
#mh-mk .t{position:absolute;font:600 var(--mkf,12px)/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#F24E1E;color:#fff;padding:0 6px;border-radius:3px;white-space:nowrap;box-shadow:0 0 0 1.5px #fff}
#mh-mk .t i{display:inline-block;width:.85em;height:.85em;margin:0 5px 0 -1px;vertical-align:-.1em;border-radius:2px;box-shadow:0 0 0 1.5px #fff}
#mh-mk .b.ok{outline-color:#0a0a0a}
#mh-mk .t.ok{background:#0a0a0a}
#mh-mk .t.n{background:#737373}
#mh-mk .t.ok i{box-shadow:0 0 0 1.5px #fff,inset 0 0 0 1.5px rgba(255,255,255,.35)}
#mh-mk .d{position:absolute;height:0;border-top:1.5px solid #F24E1E}
#mh-mk .d::before,#mh-mk .d::after{content:'';position:absolute;top:-5px;height:9px;border-left:1.5px solid #F24E1E}
#mh-mk .d::before{left:0}#mh-mk .d::after{right:0}
#mh-mk .d.ok,#mh-mk .d.ok::before,#mh-mk .d.ok::after{border-color:#0a0a0a}`;
  const r1m = (n) => Math.round(n * 10) / 10;
  MH.mark = (doc, items, opt = {}) => {
    if (!doc || !doc.body) return;
    if (!doc.getElementById('mh-mk-css')) { const st = doc.createElement('style'); st.id = 'mh-mk-css'; st.textContent = MARK_CSS; doc.head.appendChild(st); }
    let o = doc.getElementById('mh-mk');
    if (!o) { o = doc.createElement('div'); o.id = 'mh-mk'; doc.body.appendChild(o); }
    // 嵌进来的页面缩小显示时，标注的字和线跟着放大，屏幕上字约 10 像素；不再更大，免得比被标的组件还大、压住内容
    let zoom = 1;
    try { zoom = new DOMMatrixReadOnly(getComputedStyle(doc.defaultView.frameElement).transform).a || 1; } catch (e) {}
    o.style.setProperty('--mkf', Math.max(11, Math.round(10 / zoom)) + 'px');
    const w = doc.defaultView, sx = w.scrollX, sy = w.scrollY;
    const SW = r1m(Math.max(1.5, 1.2 / zoom)), TK = 4, GAP = 6, DOT = r1m(Math.max(3.5, 3 / zoom));
    const box = (el) => { const r = el.getBoundingClientRect(); return { l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy, w: r.width, h: r.height }; };
    const textBox = (el) => { const rg = doc.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return { l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy }; };
    // 小牌子不出这个范围（opt.clip：只露出一块时的那一块；默认整个页面）
    const B = opt.clip ? box(opt.clip) : { l: 0, r: Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth) };
    o.innerHTML = '';
    const lines = [], dots = [], placed = [];
    // ok：真 = 和规格一样（黑），假 = 不一样（红），null = 只是提示（灰）
    const col = (ok) => (ok === null ? '#737373' : ok ? '#0a0a0a' : '#F24E1E');
    // 线底下垫一道白边：标在深色按钮、深色底上也看得见（画在组件里面的距离线不垫，免得把边框啃出缺口）
    const path = (d, ok, sw = SW, halo = true) => lines.push(`${halo ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="${sw + 2}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>` : ''}<path d="${d}" fill="none" stroke="${col(ok)}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`);
    // 取色点：小控件（复选框这种 16 的）点也跟着小，不把控件盖住
    const dot = (x, y, ok, fill, r) => { const d = r ? r1m(Math.min(DOT, Math.max(2.2, Math.min(r.w, r.h) * 0.16))) : DOT; dots.push(`<circle cx="${x}" cy="${y}" r="${d}" fill="none" stroke="#fff" stroke-width="${SW + 1.5}"/><circle cx="${x}" cy="${y}" r="${d}" fill="${fill || '#fff'}" stroke="${col(ok)}" stroke-width="${SW}"/>`); };
    // 色块：带透明度的（「#000000 25%」）叠在白底上，显示眼睛看到的那个颜色
    const solid = (c) => {
      if (!c) return c;
      const m = String(c).match(/^#([0-9a-f]{6})\s+(\d+)%$/i);
      if (!m) return String(c).slice(0, 7);
      const a = +m[2] / 100, v = [0, 2, 4].map((i) => Math.round(parseInt(m[1].slice(i, i + 2), 16) * a + 255 * (1 - a)));
      return '#' + v.map((n) => n.toString(16).padStart(2, '0')).join('');
    };
    // 小牌子：先放进去量宽高，再摆。和已经摆好的叠在一起：先试着翻到点的另一边，还叠就往右挪；不出 B 的左右边
    const pill = (label, ok, swatch, place, alt) => {
      const t = doc.createElement('div');
      t.className = 't' + (ok === null ? ' n' : ok ? ' ok' : '');
      if (swatch) { const i = doc.createElement('i'); i.style.background = solid(swatch); t.appendChild(i); }
      t.appendChild(doc.createTextNode(String(label)));
      o.appendChild(t);
      const pw = t.offsetWidth, ph = t.offsetHeight;
      const fit = (q) => ({ x: Math.max(B.l + 2, Math.min(q.x, B.r - pw - 2)), y: q.y });
      const hits = (q) => placed.find((p) => q.x < p.x + p.w + 4 && q.x + pw + 4 > p.x && q.y < p.y + p.h + 2 && q.y + ph + 2 > p.y);
      let q = fit(place(pw, ph));
      if (hits(q) && alt) { const q2 = fit(alt(pw, ph)); if (!hits(q2)) q = q2; }
      for (let n = 0; n < 12; n++) { const hit = hits(q); if (!hit) break; q = { x: hit.x + hit.w + 6, y: q.y }; }
      const { x, y } = q;
      placed.push({ x, y, w: pw, h: ph });
      t.style.left = x + 'px';
      t.style.top = y + 'px';
      return { x, y, w: pw, h: ph };
    };
    // 引线：从点竖着拉到小牌子（在上面就到下沿、在下面就到上沿）；小牌子被挪开了，再横着拐过去
    const lead = (x, y, p, ok) => {
      const up = p.y < y, ey = up ? p.y + p.h : p.y;
      if ((up && ey >= y) || (!up && ey <= y)) return;
      path(`M${x} ${y} V${ey}` + (x < p.x + 3 || x > p.x + p.w - 3 ? ` H${Math.min(Math.max(x, p.x + 3), p.x + p.w - 3)}` : ''), ok);
    };
    items.filter(Boolean).forEach((m) => {
      const ok = m.ok === null ? null : !!m.ok;
      if (m.h) {
        const r = box(m.h), side = m.side || 'r', x = m.fx != null ? r.l + r.w * m.fx : side === 'l' ? r.l - GAP : r.r + (side === 'ru' ? 3 : GAP);
        path(`M${x} ${r.t} V${r.b} M${x - TK} ${r.t} H${x + TK} M${x - TK} ${r.b} H${x + TK}`, ok);
        pill(m.label ?? r1m(r.h), ok, null, (pw, ph) => (side === 'l' ? { x: x - TK - 3 - pw, y: (r.t + r.b - ph) / 2 } : side === 'ru' ? { x: x + 2, y: r.t - GAP - ph } : { x: x + TK + 3, y: (r.t + r.b - ph) / 2 }));
      } else if (m.w) {
        const r = box(m.w), y = m.fy != null ? r.t + r.h * m.fy : m.side === 'br' || m.side === 'b' ? r.b + GAP : r.t - GAP;
        path(`M${r.l} ${y} H${r.r} M${r.l} ${y - TK} V${y + TK} M${r.r} ${y - TK} V${y + TK}`, ok);
        // 数比线宽很多（线短、字长）：小牌子左边对齐线头，不往左边伸出去
        pill(m.label ?? r1m(r.w), ok, null, (pw, ph) => (m.side === 'br' ? { x: r.r + TK + 3, y: y - ph / 2 } : { x: pw > r.w + 16 ? r.l : (r.l + r.r - pw) / 2, y: m.side === 'b' ? y + TK + 1 : y - TK - 1 - ph }));
      } else if (m.gap) {
        const [a, b, yy] = m.gap, x1 = a + sx, x2 = Math.max(b, a + 1) + sx, y = yy + sy, mid = (x1 + x2) / 2;
        path(`M${x1} ${y} H${x2} M${x1} ${y - TK} V${y + TK} M${x2} ${y - TK} V${y + TK}`, ok, SW, false);
        // lift：'l' 数放在线左边外面（组件里面的小距离，比如文字离边框）；给一个元素，数抬到它上方，引线连过去
        const lift = m.lift && m.lift !== 'l' && box(m.lift);
        const p = pill(m.label ?? r1m(b - a), ok, null, (pw, ph) => (m.lift === 'l' ? { x: x1 - 8 - pw, y: y - ph / 2 } : lift ? { x: Math.min(mid - 8, mid - pw / 2 + 8), y: lift.t - GAP - ph } : { x: mid - pw / 2, y: y - TK - 1 - ph }));
        if (lift) lead(mid, y - TK, p, ok);
        else if (m.lift === 'l') path(`M${p.x + p.w} ${y} H${x1}`, ok, SW, false);
      } else if (m.corner) {
        const el = m.corner, r = box(el), at = m.at || 'tl', cs = w.getComputedStyle(el);
        const raw = parseFloat(at === 'tr' ? cs.borderTopRightRadius : cs.borderTopLeftRadius) || 0, rad = Math.min(raw, r.h / 2, r.w / 2), k = 3, R = rad + k, L = Math.min(8, Math.max(3, Math.min(r.w, r.h) * 0.25));
        const d = at === 'tr'
          ? (rad ? `M${r.r - rad - L} ${r.t - k} H${r.r - rad} A${R} ${R} 0 0 1 ${r.r + k} ${r.t + rad} V${r.t + rad + L}` : `M${r.r - L - 2} ${r.t - k} H${r.r + k} V${r.t + L + 2}`)
          : (rad ? `M${r.l - k} ${r.t + rad + L} V${r.t + rad} A${R} ${R} 0 0 1 ${r.l + rad} ${r.t - k} H${r.l + rad + L}` : `M${r.l - k} ${r.t + L + 2} V${r.t - k} H${r.l + L + 2}`);
        path(d, ok, SW + 0.8);
        pill(m.label ?? r1m(raw), ok, null, (pw, ph) => (at === 'tr' ? { x: r.r + k + 3, y: r.t - k - 2 - ph } : { x: r.l - k - 3 - pw, y: r.t - k - 2 - ph }));
      } else if (m.pin) {
        // on：'edge' 钉在上边线（默认）、'bottom' 钉在下边线、'fill' 钉在里面（fy 竖着在哪，默认正中）
        const r = box(m.pin), fx = m.fx ?? 0.5, x = r.l + r.w * fx, y = m.on === 'fill' ? r.t + r.h * (m.fy ?? 0.5) : m.on === 'bottom' ? r.b : r.t;
        const top = (m.lift ? box(m.lift) : r).t, pl = m.place || 'up';
        const at = (side) => (pw, ph) => (side === 'r' ? { x: r.r + 10, y: y - ph / 2 }
          : side === 'in' ? (fx > 0.5 ? { x: x - 10 - pw, y: y - ph / 2 } : { x: x + 10, y: y - ph / 2 })
          : side === 'below' ? { x: x - 8, y: r.b + GAP }
          : side === 'top' ? { x: x - pw / 2, y: r.t - ph / 2 }
          : side === 'bot' ? { x: x - pw / 2, y: r.b - ph / 2 }
          : side === 'upL' ? { x: x + 8 - pw, y: top - GAP - ph }
          : { x: x - 8, y: top - GAP - ph });
        const p = pill(m.label, ok, m.color, at(pl), pl === 'up' ? at('upL') : null);
        if (pl === 'r' || pl === 'in') path(`M${x} ${y} H${p.x > x ? p.x : p.x + p.w}`, ok); else lead(x, y, p, ok);
        dot(x, y, ok, solid(m.color), r);
        (m.also || []).filter(Boolean).forEach((el) => { const q = box(el), qx = q.l + q.w * fx, qy = m.on === 'fill' ? q.t + q.h * (m.fy ?? 0.5) : q.t; lead(qx, qy, p, ok); dot(qx, qy, ok, solid(m.color), q); });
      } else if (m.over) {
        const t = textBox(m.over), y = t.t - 4, mid = (t.l + t.r) / 2, top = box(m.lift || m.over).t;
        path(`M${t.l} ${y + 3} V${y} H${t.r} V${y + 3}`, ok);
        const p = pill(m.label, ok, m.color, (pw, ph) => ({ x: mid - 8, y: Math.min(top, y) - GAP - ph }));
        lead(mid, y, p, ok);
      } else if (m.dim) {
        const d = m.dim, div = doc.createElement('div');
        div.className = 'd' + (ok ? ' ok' : '');
        div.style.cssText = `left:${d.x1 + sx}px;top:${d.y + sy}px;width:${Math.max(1, d.x2 - d.x1)}px`;
        o.appendChild(div);
      } else if (m.el) {
        // 旧写法：框 + 字
        const r = m.el.getBoundingClientRect(), x = r.left + sx, y = r.top + sy, k = ok ? ' ok' : '';
        if (m.box !== false) { const b = doc.createElement('div'); b.className = 'b' + k; b.style.cssText = `left:${x}px;top:${y}px;width:${r.width}px;height:${r.height}px`; o.appendChild(b); }
        if (m.label) {
          const pos = {
            in: `left:${x + r.width - 6}px;top:${y + r.height / 2}px;transform:translate(-100%,-50%)`,
            r: `left:${x + r.width + 8}px;top:${y + r.height / 2}px;transform:translateY(-50%)`,
            l: `left:${x - 8}px;top:${y + r.height / 2}px;transform:translate(-100%,-50%)`,
            top: `left:${x + 8}px;top:${y}px;transform:translateY(-50%)`,
            b: `left:${x}px;top:${y + r.height + 6}px`,
            it: `left:${x + r.width - 6}px;top:${y + 6}px;transform:translateX(-100%)`,
            ib: `left:${x + r.width - 6}px;top:${y + r.height - 6}px;transform:translate(-100%,-100%)`,
          }[m.at || 'in'];
          const t = doc.createElement('div'); t.className = 't' + k; t.style.cssText = pos; t.textContent = m.label; o.appendChild(t);
        }
      }
    });
    // 线在下、点在上、小牌子最上（小牌子是 div，排在 svg 后面）
    o.insertAdjacentHTML('afterbegin', `<svg aria-hidden="true">${lines.join('')}${dots.join('')}</svg>`);
  };
  // ── 对照台（03 三篇共用）：上面五个库的真组件（data-only 只留一块，一个库一行），下面「看哪一项」；
  //   点哪项，只把那一项标在真组件上——和规格一样标黑，不一样标红。外观切原生 / 对齐时重新加载。
  //   MH.bench({ live: '#x-live', look: 'xlook', item: 'xitem', query: (mode) => '…', region: '[data-region=x]',
  //     items: { 项: (c) => ({ label, ok, box: [元素…], anchor, prep }) },   // c = { doc, win, cell, kit, al, seen }
  //     hover: { 项: (c, el) => 量到的字 },                                   // 鼠标停在某个元素上时现量
  //     prep: { 项: async (c) => 值 } })                                         // 先做一步、等一下再量，值在 c.pre
  MH.bench = (o) => {
    if (!$(o.live)) return;
    let mode = 'native', item = $(`.seg[data-ctl="${o.item}"] button.on`)?.dataset.v || Object.keys(o.items)[0];
    const seen = {};
    const cells = (doc) => $$('[data-audit-cell]', doc).map((cell) => ({ cell, kit: cell.dataset.auditCell, row: cell.querySelector(o.region) })).filter((x) => x.row);
    // prep：有的项要先做一步、等组件反应过来再量（比如挨个聚焦，组件自己加上「聚焦」的类名要等一下），量到的值放进 pre
    let run = 0;
    const draw = () => MH.whenLive(o.live, async (doc) => {
      const my = ++run, pre = {};
      try { doc.getAnimations().forEach((a) => a.finish()); } catch (e) {}
      const win = doc.defaultView, marks = [];
      // 不是要先做一步的项（「聚焦时」那种）：先让正在聚焦的框失焦，聚焦的样子不留到这一项里
      if (!(o.prep && o.prep[item])) { try { const ae = doc.activeElement; if (ae && ae !== doc.body) { ae.blur(); win.getComputedStyle(ae).boxShadow; doc.getAnimations().forEach((a) => a.finish()); } } catch (e) {} }
      if (o.prep && o.prep[item]) for (const c of cells(doc)) { pre[c.kit] = await o.prep[item]({ doc, win, ...c }); if (my !== run) return; }
      cells(doc).forEach(({ cell, kit, row }) => {
        const r = o.items[item]({ doc, win, cell, kit, row, al: mode === 'aligned', seen: (seen[item] || {})[kit], pre: pre[kit] });
        if (!r) return;
        (r.box || []).filter(Boolean).forEach((el) => marks.push({ el, ok: !!r.ok }));
        (r.dims || []).forEach((dim) => marks.push({ dim, ok: !!r.ok }));
        (r.marks || []).filter(Boolean).forEach((m) => marks.push({ ok: !!r.ok, ...m }));
        if (r.label) marks.push({ el: r.anchor || row, label: r.label, at: r.at || 'r', ok: !!r.ok, box: false });
      });
      MH.mark(doc, marks);
    });
    const hook = (doc) => {
      if (doc._mhBench) return;
      doc._mhBench = 1;
      doc.addEventListener('pointerover', (e) => {
        const fn = o.hover && o.hover[item];
        if (!fn) return;
        const hit = cells(doc).find((x) => x.row.contains(e.target));
        if (!hit) return;
        const key = item;
        setTimeout(() => { const v = fn({ doc, win: doc.defaultView, cell: hit.cell, kit: hit.kit, row: hit.row }, e.target); if (v != null && key === item) { (seen[key] = seen[key] || {})[hit.kit] = v; draw(); } }, 260);
      });
    };
    document.addEventListener('mh:live', (e) => { if (e.detail.box === $(o.live)) setTimeout(() => { MH.whenLive(o.live, hook); draw(); }, 400); });
    MH.seg(o.look, (v) => { mode = v; Object.keys(seen).forEach((k) => delete seen[k]); MH.live(o.live).reload(o.query(v)); });
    MH.seg(o.item, (v) => { item = v; draw(); });
    addEventListener('resize', () => setTimeout(draw, 300));
    draw();
    return { draw };
  };
  // ── 画出来的对照格（03、04 篇等共用）：一行一项、一列一个对象（通常是五个库），最后一列是规格（左边一道线）；
  //   格子里画出样子，下面一行字，和规格不一样的标红。figure 加 data-hl、上面放「只看」按钮，就能筛「和规格不一样 / 一样」。
  //   MH.dgrid(el, [{ name, sub, cells: [{ draw, label, bad }], spec }], { cols: ['Ant Design', …], spec: '控件规格' })
  //   o.pick：行多（四行以上）一起摆太密——上面加一排「看哪一项」，一次只画一行
  //   同一节里有「组件库原生 / 对齐到控件规格」切换的，跟着切：对齐档五个库都画成规格那一格（不然切到对齐，
  //   下面还画着和规格不一样的数，两处对不上）；写着「原生档。……」的图注只在原生档显示，「组件库原生 · ……」的图注跟着改成「对齐到控件规格 · ……」
  MH.dgrid = (el, all, o = {}) => {
    if (!el) return;
    el._dg = { all, o }; // 重画时用最近一次给的行（页面脚本自己会换着给，比如表格那张一次给一行）
    const sec = el.closest('section');
    // 这一节的外观切换：页面上的「组件库原生 / 对齐到控件规格」，没有就找五张截图那一排上面的切换（art.js 画的）
    const segs = sec ? $$('.seg', sec) : [];
    const look = segs.find((g) => g.querySelector('button[data-v="aligned"]') && g.querySelector('button[data-v="native"]')) || segs.find((g) => g.closest('.b5-ctl') && /对齐/.test(g.textContent));
    const aligned = !!(look && (look.querySelector('button.on[data-v="aligned"]') || (look.closest('.b5-ctl') && look.querySelector('button.on[data-v="b"]'))));
    if (!MH._dgLook) {
      // 点了哪一节的切换，就把那一节的对照格重画一遍（截图那一排的切换是后画的，所以挂在整页上）
      MH._dgLook = 1;
      document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.seg button[data-v]'); const sc = b && b.closest('section'); if (sc) setTimeout(() => $$('.dg', sc).forEach((g) => g._dg && MH.dgrid(g, g._dg.all, g._dg.o)), 0); });
    }
    const cap = el.closest('figure') && el.closest('figure').querySelector('figcaption');
    if (cap) {
      if (cap._t == null) cap._t = cap.innerHTML;
      if (/^原生档/.test(cap.textContent.trim())) cap.hidden = aligned;
      else if (/^组件库原生/.test(cap.textContent.trim()) || /^组件库原生/.test(cap._t)) cap.innerHTML = aligned ? cap._t.replace(/^组件库原生/, '对齐到控件规格') : cap._t;
    }
    let rows = aligned ? all.map((r) => (r.spec ? { ...r, cells: r.cells.map(() => ({ ...r.spec })) } : r)) : all;
    if (o.pick && all.length > 1) {
      if (!el._pickBar) {
        const bar = document.createElement('div');
        bar.className = 'dg-pick';
        bar.innerHTML = `<span class="lb">看哪一项</span><div class="seg">${all.map((r, k) => `<button type="button" data-i="${k}"${k === (el._pick || 0) ? ' class="on"' : ''}>${r.name}</button>`).join('')}</div>`;
        el.before(bar);
        el._pickBar = bar;
        bar.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; el._pick = +b.dataset.i; $$('button', bar).forEach((x) => x.classList.toggle('on', x === b)); MH.dgrid(el, el._dg.all, el._dg.o); });
      }
      rows = [rows[el._pick || 0]];
    }
    const hasSpec = rows.some((r) => r.spec);
    const cell = (c, sp) => `<div class="dc${sp ? ' sp' : ''}"${sp ? '' : ` data-k="${c.bad ? 'diff' : 'same'}"`}>${c.draw ? `<div class="dd">${c.draw}</div>` : ''}<div class="dl">${c.bad ? `<b class="x">${c.label}</b>` : c.label}</div></div>`;
    el.style.setProperty('--dgn', o.cols.length + (hasSpec ? 1 : 0));
    el.innerHTML = `<div class="dr dh"><div></div>${o.cols.map((n) => `<div>${n}</div>`).join('')}${hasSpec ? `<div class="sp">${o.spec || '控件规格'}</div>` : ''}</div>`
      + rows.map((r) => `<div class="dr"><div class="dn"><b>${r.name}</b>${r.sub ? `<span>${r.sub}</span>` : ''}</div>${r.cells.map((c) => cell(c)).join('')}${r.spec ? cell(r.spec, true) : ''}</div>`).join('');
  };
  MH.whenLive = (sel, fn, tries = 60) => {
    const l = MH.live(sel);
    const doc = l && l.doc && l.doc();
    if (doc && doc.readyState === 'complete' && doc.querySelector('.audit__cell') && $(sel).classList.contains('ready')) return fn(doc);
    if (tries > 0) setTimeout(() => MH.whenLive(sel, fn, tries - 1), 250);
  };
  const lazy = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { initLive(en.target); lazy.unobserve(en.target); } }), { rootMargin: '800px 0px' });
  $$('.live[data-live]').forEach((b) => lazy.observe(b));
  // 保底：有的浏览器在后台标签里不触发上面的观察，滚动时再自己看一眼
  let tick = 0;
  addEventListener('scroll', () => {
    if (tick) return;
    tick = setTimeout(() => {
      tick = 0;
      $$('.live[data-live]').forEach((b) => { if (!b._live) { const r = b.getBoundingClientRect(); if (r.top < innerHeight + 800 && r.bottom > -800) initLive(b); } });
    }, 200);
  }, { passive: true });

  // ── 分段开关
  MH.seg = (name, fn) => {
    const el = $(`.seg[data-ctl="${name}"]`);
    if (!el) return () => {};
    const btns = $$('button[data-v]', el);
    const set = (v, quiet) => { btns.forEach((b) => b.classList.toggle('on', b.dataset.v === v)); if (!quiet) fn(v); };
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.v)));
    return set;
  };

  // ── 同类高亮：上面一排筛选，或者悬停在一格上，同一类一起亮（分类上色的表都这样）
  //   <figure data-hl> 里带 data-k 的格子是一类一类的：鼠标停在一格上，同一类的照常、别的变淡；
  //   图上的筛选 <div class="seg hl-f"><button data-hlk="">全部</button><button data-hlk="x">…</button></div>：点一下只看这一类。
  //   手机上点一下格子 = 只看这一类，再点一下恢复。格子是页面脚本后画的也行（重画后自动接上）。
  const hlApply = (root) => {
    const k = root.dataset.hlPin || root.dataset.hlHover || '';
    $$('[data-k]', root).forEach((e) => e.classList.toggle('hl-dim', !!k && e.dataset.k !== k));
    $$('.hl-f button[data-hlk]', root).forEach((b) => b.classList.toggle('on', b.dataset.hlk === (root.dataset.hlPin || '')));
  };
  const hlPin = (root, k) => { if (k) root.dataset.hlPin = k; else delete root.dataset.hlPin; hlApply(root); };
  $$('[data-hl]').forEach((root) => {
    new MutationObserver(() => hlApply(root)).observe(root, { childList: true, subtree: true });
    root.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const it = e.target.closest('[data-k]');
      const k = it && root.contains(it) ? it.dataset.k : '';
      if (k !== (root.dataset.hlHover || '')) { if (k) root.dataset.hlHover = k; else delete root.dataset.hlHover; hlApply(root); }
    });
    root.addEventListener('pointerleave', () => { delete root.dataset.hlHover; hlApply(root); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.hl-f button[data-hlk]');
      if (b) return hlPin(root, b.dataset.hlk);
      const it = e.target.closest('[data-k]');
      if (it && !e.target.closest('a, button, input, select, .live')) hlPin(root, root.dataset.hlPin === it.dataset.k ? '' : it.dataset.k);
    });
    hlApply(root);
  });

  // ── 放大看：一张图单独铺满屏幕，录视频用。← → 换上一张下一张，F 全屏，Esc 退出。
  //   图原地变成浮层（不挪位置），里面的真组件不会重新加载，点过的状态都在。
  //   等页面脚本都跑完再收集（附录 B、C 的图是页面脚本画出来的）
  const initStage = () => {
  const figs = $$('main figure.fig').filter((f) => !f.closest('.next, .ask'));
  if (figs.length) {
    const ui = document.createElement('div');
    ui.className = 'stage-ui';
    ui.innerHTML = '<span class="sn"></span><button type="button" data-k="prev" title="上一张（←）">←</button><button type="button" data-k="next" title="下一张（→）">→</button><button type="button" data-k="full" title="全屏（F）">全屏</button><button type="button" data-k="x" title="退出（Esc）">退出</button>';
    document.body.appendChild(ui);
    const sn = $('.sn', ui);
    let cur = -1, spacer = null, ro = null, idle = 0;
    // 编号：本节第几张图。后来加的图自带编号（data-fig="a"），不占顺序号，已经截好的 ?fig= 静帧不会错位
    const numbered = (sec) => $$('figure.fig', sec).filter((x) => figs.includes(x) && !x.dataset.fig);
    const id = (f) => { const sec = f.closest('.sec, .part'); if (!sec) return ''; return `${sec.id}-${f.dataset.fig || numbered(sec).indexOf(f) + 1}`; };
    const place = () => {
      const f = figs[cur];
      if (!f) return;
      const k = Math.min((innerWidth * 0.9) / f.offsetWidth, (innerHeight * 0.86) / f.offsetHeight, 2.4);
      f.style.setProperty('--k', k.toFixed(4));
    };
    const wake = () => { ui.classList.remove('idle'); document.body.classList.remove('stage-idle'); clearTimeout(idle); idle = setTimeout(() => { ui.classList.add('idle'); document.body.classList.add('stage-idle'); }, 2200); };
    const off = () => {
      if (cur < 0) return null;
      const f = figs[cur];
      f.classList.remove('staged');
      f.style.width = '';
      f.style.removeProperty('--k');
      spacer?.remove();
      ro?.disconnect();
      cur = -1;
      return f;
    };
    const on = (i) => {
      i = (i + figs.length) % figs.length;
      off();
      const f = figs[i];
      // 收在折叠里的图：放大看时先展开
      for (let d = f.closest('details:not([open])'); d; d = d.parentElement?.closest('details:not([open])')) d.open = true;
      if (!f.offsetParent && f.offsetWidth === 0) return on(i + 1);
      cur = i;
      spacer = document.createElement('div');
      spacer.className = 'fig-spacer';
      spacer.style.height = f.offsetHeight + 'px';
      f.before(spacer);
      f.style.width = f.offsetWidth + 'px';
      f.classList.add('staged');
      document.body.classList.add('staging');
      $$('.live[data-live]', f).forEach((b) => initLive(b));
      place();
      ro = new ResizeObserver(place);
      ro.observe(f);
      sn.textContent = `${$('.kick .no', f.closest('.sec, .part'))?.textContent || ''}　${i + 1} / ${figs.length}`;
      try { history.replaceState(null, '', `?fig=${id(f)}${location.hash}`); } catch {}
      wake();
    };
    const exit = () => {
      const f = off();
      document.body.classList.remove('staging', 'stage-idle');
      try { history.replaceState(null, '', location.pathname + location.hash); } catch {}
      if (document.fullscreenElement) document.exitFullscreen?.();
      if (f) f.scrollIntoView({ block: 'center', behavior: 'instant' });
    };
    const full = () => { const p = document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.(); p?.catch?.(() => {}); };
    figs.forEach((f, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fig-x';
      b.title = '放大看（录视频用）';
      b.innerHTML = '<i></i>放大';
      b.addEventListener('click', (e) => { e.stopPropagation(); on(i); });
      f.appendChild(b);
    });
    ui.addEventListener('click', (e) => { const k = e.target.closest('button')?.dataset.k; if (k === 'prev') on(cur - 1); if (k === 'next') on(cur + 1); if (k === 'full') full(); if (k === 'x') exit(); });
    addEventListener('keydown', (e) => {
      if (cur < 0 || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'Escape' && !document.fullscreenElement) exit();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); on(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); on(cur - 1); }
      else if (e.key === 'f' || e.key === 'F') full();
    });
    addEventListener('resize', place);
    addEventListener('mousemove', () => cur >= 0 && wake(), { passive: true });
    const q = new URLSearchParams(location.search).get('fig');
    if (q) {
      const m = q.match(/^(.+)-(\w+)$/);
      const sec = m && document.getElementById(m[1]);
      const f = sec && ($$('figure.fig', sec).find((x) => figs.includes(x) && x.dataset.fig === m[2]) || (/^\d+$/.test(m[2]) && numbered(sec)[+m[2] - 1]));
      if (f) setTimeout(() => on(figs.indexOf(f)), 60);
    }
    MH.stage = (i) => (i == null ? exit() : on(i));
  }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStage); else initStage();

  // ── 表：每一格记下列名（手机上长表排成一条一条时用）；放不下的表、插画给滑动提示
  const labelTable = (t) => {
    const head = t.rows[0];
    if (!head || !head.querySelector('th')) return;
    const names = Array.from(head.cells).map((c) => c.textContent.trim());
    const span = [];
    Array.from(t.rows).slice(1).forEach((tr) => {
      let c = 0;
      Array.from(tr.cells).forEach((td) => {
        while (span[c] > 0) { span[c]--; c++; }
        td.dataset.c = c + 1;
        if (names[c]) td.dataset.th = names[c];
        if (td.rowSpan > 1) span[c] = td.rowSpan - 1;
        c += td.colSpan || 1;
      });
      for (let k = c; k < span.length; k++) if (span[k] > 0) span[k]--;
    });
    t.dataset.labeled = t.rows.length;
  };
  const decorate = () => {
    $$('table.tbl').forEach((t) => { if (+t.dataset.labeled !== t.rows.length) labelTable(t); });
    $$('.tbl-wrap').forEach((w) => { const on = w.scrollWidth > w.clientWidth + 2; w.classList.toggle('swipe', on); if (on) watchEdge(w); else w.classList.remove('more'); swipeHint(w, on, '左右滑动看后面几列', true); });
    $$('.libs, .heights').forEach((el) => { const on = el.scrollWidth > el.clientWidth + 2; if (on) watchEdge(el); else el.classList.remove('more'); swipeHint(el, on, '左右滑动看另外几个库'); });
    $$('.ill:not(.av)').forEach((el) => { if (!el.querySelector('svg')) return; const on = el.scrollWidth > el.clientWidth + 2; el.classList.toggle('swipe', on); if (on) watchEdge(el); else el.classList.remove('more'); swipeHint(el, on, '左右滑动看整张图'); });
    // 一排卡片：底下「出处」那几行在同一排里一样高，分隔线对齐
    $$('.cards').forEach((g) => {
      const whos = $$(':scope > .card > .who', g);
      whos.forEach((w) => (w.style.minHeight = ''));
      // 图放大看的时候整块被 scale 过，量出来的要除回去，不然每 resize 一次就拉高一次
      const sc = g.offsetWidth ? g.getBoundingClientRect().width / g.offsetWidth : 1;
      const rows = new Map();
      whos.forEach((w) => { const k = Math.round(w.parentElement.getBoundingClientRect().top / sc); rows.set(k, (rows.get(k) || []).concat(w)); });
      rows.forEach((ws) => { if (ws.length < 2) return; const m = Math.max(...ws.map((w) => w.getBoundingClientRect().height / sc)); ws.forEach((w) => (w.style.minHeight = m + 'px')); });
    });
  };
  // 大标题只在标点处换行：手机上「视觉层：颜 / 色、尺寸、图标」这样从词中间断开不好看；带空格或太长的段照常断
  $$('.head h1, .home-head h1').forEach((h) => {
    Array.from(h.childNodes).forEach((n) => {
      if (n.nodeType !== 3) return;
      const parts = n.textContent.split(/(?<=[：、，」])|(?=「)/).filter(Boolean);
      if (parts.length < 2 && !/\S-\S/.test(n.textContent)) return;
      const f = document.createDocumentFragment();
      parts.forEach((p) => { if (!/\s/.test(p) && p.length <= 8) { const t = document.createElement('span'); t.className = 'nb'; t.textContent = p; f.appendChild(t); } else p.split(/(\S+-\S+)/).forEach((q, k) => { if (!q) return; if (k % 2) { const t = document.createElement('span'); t.className = 'nb'; t.textContent = q; f.appendChild(t); } else f.appendChild(document.createTextNode(q)); }); });
      n.replaceWith(f);
    });
  });
  // 表格里带连字符的参数（--scene=、--kits=）整段不拆：浏览器默认会在「-」后面换行
  $$('.tbl code').forEach((c) => { if (/-/.test(c.textContent) && c.textContent.length <= 24) c.classList.add('nb'); });
  // 命令块：一行一个 span，注释单独包起来（手机上注释挪到命令上面一行，不用横着滑）
  $$('.cmd').forEach((el) => {
    if (el.querySelector('pre, .cl')) return;
    const lines = [[]];
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) n.textContent.split('\n').forEach((t, i) => { if (i) lines.push([]); if (t) lines[lines.length - 1].push(document.createTextNode(t)); });
      else lines[lines.length - 1].push(n);
    });
    el.textContent = '';
    lines.forEach((parts, i) => {
      const l = document.createElement('span');
      l.className = 'cl';
      const c = parts.find((n) => n.nodeType === 1 && n.classList.contains('c'));
      const rest = parts.filter((n) => n !== c);
      if (c && rest.some((n) => n.textContent.trim())) { l.classList.add('has-c'); const x = document.createElement('span'); x.className = 'cx'; rest.forEach((n) => x.appendChild(n)); l.append(x, c); }
      else parts.forEach((n) => l.appendChild(n));
      if (i < lines.length - 1) l.appendChild(document.createTextNode('\n'));
      el.appendChild(l);
    });
    // 命令里每一段（npm、run、--kits=shadcn,antd……）整段不拆：浏览器默认会在「-」后面换行，把 --kits 拆成两半
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('.c') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const texts = [];
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/\S-/.test(n.textContent) || /-\S/.test(n.textContent)) texts.push(n);
    texts.forEach((n) => {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\S+)/).forEach((part, k) => { if (!part) return; if (k % 2) { const t = document.createElement('span'); t.className = 'tk'; t.textContent = part; f.appendChild(t); } else f.appendChild(document.createTextNode(part)); });
      n.replaceWith(f);
    });
  });
  let dq = 0;
  const later = () => { cancelAnimationFrame(dq); dq = requestAnimationFrame(decorate); };
  document.addEventListener('DOMContentLoaded', later);
  addEventListener('load', later);
  addEventListener('resize', later);
  document.fonts?.ready.then(later);
  // 页面脚本后来才画的表（附录按库筛、点开目录）也补上
  const main = $('main');
  const grew = (n) => n.nodeType === 1 && (n.matches('table, .tbl-wrap, .card') || n.parentElement?.classList.contains('ill') || n.querySelector('table, .card'));
  if (main && window.MutationObserver) new MutationObserver((ms) => { if (ms.some((m) => Array.from(m.addedNodes).some(grew))) later(); }).observe(main, { childList: true, subtree: true });

  // ── 复制
  const copyText = async (t) => { try { await navigator.clipboard.writeText(t); } catch { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } };
  $$('.copy[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    await copyText($(b.dataset.copy)?.textContent.trim() || '');
    const o = b.textContent; b.textContent = '已复制'; b.classList.add('done'); setTimeout(() => { b.textContent = o; b.classList.remove('done'); }, 1500);
  }));

  // ── 演示页入口：顶栏头像左边一个，各页里写了 data-demo 的链接也是；双击打开时改指线上演示页
  const meImg = $('.bar img.me');
  if (meImg) meImg.insertAdjacentHTML('beforebegin', '<a class="demo-l" data-demo href="demo/index.html" target="_blank" rel="noopener">演示页</a>');
  if (!served) $$('a[data-demo]').forEach((a) => (a.href = DEMO_URL));

  // ── 付费墙（公开版才有）：「微信小店」点一下出商品码，再点收起
  $$('.paywall .wx').forEach((b) => b.addEventListener('click', () => {
    const q = b.closest('.paywall').querySelector('.wxq');
    q.hidden = !q.hidden;
    b.setAttribute('aria-expanded', String(!q.hidden));
  }));

  // ── 顶栏头像：鼠标停上去（手机上点一下、键盘 Tab 到）出一张小卡片，写名字和微信号；点微信号复制，Esc 收起
  //   不改各页 HTML：把 <img class="me"> 包进一个按钮，卡片放在旁边；原来的 title 提示去掉，免得和卡片重复
  const me = $('.bar img.me');
  if (me) {
    const WX = 'vanvan_0422';
    me.removeAttribute('title');
    const w = document.createElement('span');
    w.className = 'me-w';
    me.replaceWith(w);
    w.innerHTML = `<button type="button" class="me-b" aria-expanded="false" aria-controls="me-card"></button><div class="me-card" id="me-card"><b>范米花儿</b><button type="button" class="me-wx">微信：<span>${WX}</span><i>复制</i></button></div>`;
    const btn = $('.me-b', w), tip = $('.me-wx i', w);
    btn.appendChild(me);
    // 开着的原因有三个：鼠标停在上面、键盘 Tab 到了、点开了（手机）；三个都没了才收。鼠标移开晚一点收，斜着移到卡片上不会闪
    const why = { hov: 0, foc: 0, pin: 0 };
    let t = 0;
    const show = () => { const on = !!(why.hov || why.foc || why.pin); w.classList.toggle('open', on); btn.setAttribute('aria-expanded', on); };
    const set = (k, v, wait) => { why[k] = v; clearTimeout(t); if (wait) t = setTimeout(show, 150); else show(); };
    // 键盘来的焦点才算（鼠标点按钮也会给焦点，那个不算）；老浏览器不认 :focus-visible，就都算
    const kb = (el) => { try { return el.matches(':focus-visible'); } catch { return true; } };
    w.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') set('hov', 1); });
    w.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') set('hov', 0, true); });
    w.addEventListener('focusin', (e) => { if (kb(e.target)) set('foc', 1); });
    w.addEventListener('focusout', (e) => { if (!w.contains(e.relatedTarget)) set('foc', 0); });
    btn.addEventListener('click', () => set('pin', why.pin ? 0 : 1));
    // 点卡片外面就收（捕获阶段：目录按钮自己拦了冒泡）
    document.addEventListener('click', (e) => { if (why.pin && !w.contains(e.target)) set('pin', 0); }, true);
    addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !w.classList.contains('open')) return;
      if (w.contains(document.activeElement) && document.activeElement !== btn) btn.focus();
      why.hov = why.foc = why.pin = 0;
      clearTimeout(t);
      show();
    });
    $('.me-wx', w).addEventListener('click', async () => {
      await copyText(WX);
      tip.textContent = '已复制';
      w.classList.add('copied');
      clearTimeout(tip._t);
      tip._t = setTimeout(() => { tip.textContent = '复制'; w.classList.remove('copied'); }, 1500);
    });
  }
})();
