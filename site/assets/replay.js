/*
 * 自动演示：在嵌进来的整页演示里，一个假鼠标照着步骤走过去、点下去、打字，录视频能直接用。
 *   <figure class="fig rp" data-replay="state">
 *     <ol class="rp-steps"><li>…</li></ol>                       ← 步骤条，自动跟着亮
 *     <div class="frame">…<div class="live" data-page="index.html" data-w="1440" data-live="" …></div></div>
 *     <div class="rp-ctl"><button data-rp="play">…</button><button data-rp="next">…</button><button data-rp="reset">…</button></div>
 *   </figure>
 * 步骤写在下面的 SCRIPTS 里；点的都是演示页里真的按钮、真的输入框（不改演示页的代码）。
 */
(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const KITS = ['Ant Design', 'Element Plus', 'shadcn/ui', 'Arco Design', 'TDesign'];

  // 在 iframe 里动手的几样工具
  function hands(doc, speed) {
    const win = doc.defaultView;
    const k = speed || 1;
    const wait = (ms) => sleep(ms / k);
    if (!doc.getElementById('rp-style')) {
      const st = doc.createElement('style');
      st.id = 'rp-style';
      st.textContent = `
#rp-cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:34px;height:34px;transform:translate(720px,640px);transition:transform .7s cubic-bezier(.3,.7,.2,1);filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}
#rp-cur svg{display:block;width:34px;height:34px;transition:transform .12s}
#rp-cur.down svg{transform:scale(.82)}
.rp-ring{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #0a0a0a;animation:rp-ring .55s ease-out forwards}
@keyframes rp-ring{from{transform:scale(.3);opacity:.9}to{transform:scale(1.5);opacity:0}}
#rp-mk{position:absolute;left:0;top:0;z-index:2147483645;pointer-events:none}
#rp-mk .b{position:absolute;border:3px solid #0a0a0a;border-radius:10px;box-shadow:0 0 0 3px #fff;opacity:0;transition:opacity .3s}
#rp-mk .b.on{opacity:1}
#rp-mk .n{position:absolute;z-index:2;left:-15px;top:-15px;width:30px;height:30px;border-radius:50%;background:#0a0a0a;color:#fff;font:700 16px/30px -apple-system,'PingFang SC',sans-serif;text-align:center;box-shadow:0 0 0 3px #fff}#rp-mk .n.l{left:-42px;top:50%;margin-top:-15px}
#rp-mk .t{position:absolute;height:30px;padding:0 12px;border-radius:15px;background:#0a0a0a;color:#fff;font:600 15px/30px -apple-system,'PingFang SC',sans-serif;white-space:nowrap;box-shadow:0 0 0 3px #fff}#rp-mk .t.r{left:calc(100% + 10px);top:50%;margin-top:-15px}#rp-mk .t.tr{right:0;top:-42px}`;
      doc.head.appendChild(st);
    }
    let cur = doc.getElementById('rp-cur');
    if (!cur) {
      cur = doc.createElement('div');
      cur.id = 'rp-cur';
      cur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 2.5v17.2l4.6-4.3 3 6.6 3.1-1.4-3-6.5h6.3z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      doc.body.appendChild(cur);
    }
    let at = [720, 640];
    const A = {
      doc,
      // 等到元素出现
      async get(sel, root, ms = 4000) {
        const t0 = Date.now();
        for (;;) {
          const el = typeof sel === 'function' ? sel(doc) : (root || doc).querySelector(sel);
          if (el) return el;
          if (Date.now() - t0 > ms) throw new Error('找不到 ' + sel);
          await sleep(80);
        }
      },
      byText(sel, text, root) { return [...(root || doc).querySelectorAll(sel)].find((e) => e.textContent.trim() === text); },
      async move(el, dx = 0, dy = 0) {
        const r = el.getBoundingClientRect();
        if (r.bottom > win.innerHeight - 20 || r.top < 0) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); await wait(500); }
        await A.reveal?.(el);
        const q = el.getBoundingClientRect();
        const x = Math.round(q.left + Math.min(q.width / 2, 40) + dx), y = Math.round(q.top + q.height / 2 + dy);
        const d = Math.hypot(x - at[0], y - at[1]);
        const ms = Math.max(320, Math.min(900, d * 0.9)) / k;
        cur.style.transition = `transform ${ms}ms cubic-bezier(.3,.7,.2,1)`;
        cur.style.transform = `translate(${x - 6}px, ${y - 3}px)`;
        at = [x, y];
        await sleep(ms + 60);
      },
      async click(el, opt = {}) {
        await A.move(el, opt.dx, opt.dy);
        cur.classList.add('down');
        const ring = doc.createElement('i');
        ring.className = 'rp-ring';
        ring.style.left = at[0] + 'px';
        ring.style.top = at[1] + 'px';
        doc.body.appendChild(ring);
        setTimeout(() => ring.remove(), 700);
        const o = { bubbles: true, cancelable: true, view: win, clientX: at[0], clientY: at[1] };
        el.dispatchEvent(new win.PointerEvent('pointerdown', o));
        el.dispatchEvent(new win.MouseEvent('mousedown', o));
        await wait(110);
        cur.classList.remove('down');
        el.dispatchEvent(new win.PointerEvent('pointerup', o));
        el.dispatchEvent(new win.MouseEvent('mouseup', o));
        el.click();
        await wait(opt.after ?? 420);
      },
      async type(el, text) {
        await A.click(el, { after: 160 });
        el.focus();
        const p = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
        const set = Object.getOwnPropertyDescriptor(p, 'value').set;
        for (const ch of text) {
          set.call(el, el.value + ch);
          el.dispatchEvent(new win.Event('input', { bubbles: true }));
          await wait(120);
        }
        el.dispatchEvent(new win.Event('change', { bubbles: true }));
        await wait(260);
      },
      // 停在元素上：鼠标移过去，从最里面那个元素往外一层层发「进来」（组件库的悬停多半挂在外层）
      async hover(el, opt = {}) {
        await A.move(el, opt.dx, opt.dy);
        const t = doc.elementFromPoint(at[0], at[1]) || el, o = { bubbles: true, cancelable: true, view: win, clientX: at[0], clientY: at[1] };
        t.dispatchEvent(new win.PointerEvent('pointerover', o)); t.dispatchEvent(new win.MouseEvent('mouseover', o));
        for (let n = t; n && n !== doc.documentElement; n = n.parentElement) { n.dispatchEvent(new win.PointerEvent('pointerenter', { ...o, bubbles: false })); n.dispatchEvent(new win.MouseEvent('mouseenter', { ...o, bubbles: false })); }
        t.dispatchEvent(new win.PointerEvent('pointermove', o)); t.dispatchEvent(new win.MouseEvent('mousemove', o));
        A.hovered = t;
        await wait(opt.after ?? 400);
      },
      // 从刚才停的元素上移开：一层层发「出去」，假鼠标挪到右下角
      async leave(opt = {}) {
        const t = A.hovered;
        if (t) {
          const o = { bubbles: true, cancelable: true, view: win, clientX: win.innerWidth - 40, clientY: win.innerHeight - 40 };
          t.dispatchEvent(new win.PointerEvent('pointerout', o)); t.dispatchEvent(new win.MouseEvent('mouseout', o));
          for (let n = t; n && n !== doc.documentElement; n = n.parentElement) { n.dispatchEvent(new win.PointerEvent('pointerleave', { ...o, bubbles: false })); n.dispatchEvent(new win.MouseEvent('mouseleave', { ...o, bubbles: false })); }
          A.hovered = null;
        }
        A.park();
        await wait(opt.after ?? 400);
      },
      // 点一个位置（不是某个按钮，比如对话框外面的遮罩）
      async clickAt(x, y, opt = {}) {
        const d = Math.hypot(x - at[0], y - at[1]), ms = Math.max(320, Math.min(900, d * 0.9)) / k;
        cur.style.transition = `transform ${ms}ms cubic-bezier(.3,.7,.2,1)`;
        cur.style.transform = `translate(${x - 6}px, ${y - 3}px)`;
        at = [x, y];
        await sleep(ms + 60);
        const el = doc.elementFromPoint(x, y);
        if (!el) return;
        cur.classList.add('down');
        const o = { bubbles: true, cancelable: true, view: win, clientX: x, clientY: y };
        el.dispatchEvent(new win.PointerEvent('pointerdown', o)); el.dispatchEvent(new win.MouseEvent('mousedown', o));
        await wait(110);
        cur.classList.remove('down');
        el.dispatchEvent(new win.PointerEvent('pointerup', o)); el.dispatchEvent(new win.MouseEvent('mouseup', o));
        el.dispatchEvent(new win.MouseEvent('click', o));
        await wait(opt.after ?? 420);
      },
      park() { cur.style.transition = 'transform .6s ease'; cur.style.transform = `translate(${win.innerWidth - 60}px, ${win.innerHeight - 60}px)`; at = [win.innerWidth - 60, win.innerHeight - 60]; },
      hide(on) { cur.style.opacity = on ? '0' : '1'; },
      // 标出一组元素：框 + 圆圈编号 + 一句话；一个一个出来
      async mark(list, gap = 380, each) {
        A.unmark();
        const box = doc.createElement('div');
        box.id = 'rp-mk';
        doc.body.appendChild(box);
        const sx = win.scrollX, sy = win.scrollY;
        for (const [i, m] of list.entries()) {
          const el = typeof m.el === 'string' ? doc.querySelector(m.el) : m.el;
          if (!el) continue;
          const r = el.getBoundingClientRect(), p = m.pad ?? 6;
          const b = doc.createElement('div');
          b.className = 'b';
          b.style.cssText = `left:${r.left + sx - p}px;top:${r.top + sy - p}px;width:${r.width + p * 2}px;height:${r.height + p * 2}px`;
          // 字放在框外面，不压住被标的东西：窄的放右边，宽的放上面
          const at = m.at || (r.width < 520 ? 'r' : 'tr');
          b.innerHTML = `<span class="n${m.nAt ? ' ' + m.nAt : ''}">${m.n ?? i + 1}</span>${m.t && !each ? `<span class="t ${at}">${m.t}</span>` : ''}`;
          box.appendChild(b);
          await sleep(30);
          b.classList.add('on');
          each?.(i, m);
          await wait(gap);
        }
      },
      unmark() { doc.getElementById('rp-mk')?.remove(); A.onUnmark?.(); },
    };
    return A;
  }

  // ── 步骤：每一步 { t: 步骤条上的字, run(A) }
  const SCRIPTS = {
    // 第 01 篇 1.1、第 04-2 篇开头：做几件事，再换组件库，一样都没丢
    state: {
      async setup(A) {
        const b = A.byText('button', '客户列表');
        if (b && !b.classList.contains('on') && b.getAttribute('aria-pressed') !== 'true') b.click();
        await sleep(300);
        A.byText('button', 'Ant Design')?.click();
        await A.get('.mh-list__keyword input, input[placeholder*="客户名称"]');
        await sleep(600);
      },
      steps: [
        { t: '搜一下', async run(A) { await A.type(await A.get('input[placeholder*="客户名称"]'), '科技'); await A.click(A.byText('.mh-list__filter button', '查询')); } },
        { t: '排个序', async run(A) { await A.click(await A.get(() => A.byText('button.mh-table-sort', '年度金额'))); } },
        { t: '勾两个', async run(A) { const cb = A.doc.querySelectorAll('tbody input[type=checkbox]'); await A.click(cb[0], { after: 250 }); await A.click(cb[1], { after: 300 }); await A.click(await A.get(() => A.byText('.mh-list__pagination li, .mh-list__pagination button', '2'))); } },
        { t: '收起侧栏', async run(A) { await A.click(await A.get('button[aria-label="收起侧栏"]'), { after: 600 }); } },
        { t: '开对话框', async run(A) {
          await A.click(await A.get(() => [...A.doc.querySelectorAll('tbody button, tbody a')].find((e) => e.textContent.trim() === '编辑')), { after: 700 });
          const dlg = await A.get('[role=dialog] textarea, .ant-modal textarea');
          await A.click(await A.get(() => A.byText('label', 'A 级')));
          await A.type(dlg, '下周三上门，带合同');
        } },
        { t: '换组件库', async run(A) { await A.click(A.byText('button', 'Element Plus'), { after: 300 }); await A.get('.el-dialog textarea, [role=dialog] textarea', null, 8000); await sleep(900); } },
        { t: '都还在', async run(A) {
          A.park();
          const d = A.doc;
          const dlg = await A.get(() => [...d.querySelectorAll('[role=dialog]')].find((e) => e.querySelector('textarea')));
          await A.mark([
            { el: [...dlg.querySelectorAll('label, .el-radio')].find((e) => /A\s?级/.test(e.textContent)), t: 'A 级还选着', pad: 10, n: 5 },
            { el: dlg.querySelector('textarea'), t: '备注还在', n: 5 },
          ], 700, A.legend);
          await sleep(1600);
          A.unmark();
          A.hide(false);
          await A.click(await A.get(() => [...dlg.querySelectorAll('button')].find((b) => b.textContent.trim() === '取消')), { after: 700 });
          A.park();
          await A.mark(LIST_MARKS(d), 520, A.legend);
        } },
      ],
      // 「再换一个」：换到下一个组件库，再标一遍
      async next(A, i) {
        A.unmark();
        const name = KITS[i % KITS.length];
        await A.click(A.byText('button', name), { after: 400 });
        await sleep(1500);
        A.park();
        await A.mark(LIST_MARKS(A.doc), 320, A.legend);
        return name;
      },
    },
  };
  // 圆圈里的数字和上面步骤条对上：第 2 页是第 3 步翻的，侧栏是第 4 步收的
  const LIST_MARKS = (d) => [
    { el: d.querySelector('.mh-list__keyword input') || d.querySelector('.mh-list__keyword'), t: '搜的词', n: 1, nAt: 'l' },
    { el: [...d.querySelectorAll('th')].find((t) => t.textContent.includes('年度金额')), t: '排序', n: 2 },
    { el: d.querySelector('.mh-list__bar'), t: '勾的 2 个', pad: 2, n: 3 },
    { el: d.querySelector('.mh-list__pagination'), t: '第 2 页', pad: 2, n: 3 },
    { el: d.querySelector('.mh-admin__sider'), t: '侧栏收着', pad: 0, at: 'r', n: 4 },
  ];

  document.querySelectorAll('.rp[data-replay]').forEach((fig) => {
    const S = SCRIPTS[fig.dataset.replay];
    const box = fig.querySelector('.live');
    if (!S || !box) return;
    const lis = [...fig.querySelectorAll('.rp-steps li')];
    const btn = (k) => fig.querySelector(`[data-rp="${k}"]`);
    const note = fig.querySelector('.rp-now');
    let busy = false, ki = 1, ready = false;
    const doc = () => window.MH && MH.live(box)?.doc();
    const leg = fig.querySelector('.rp-legend');
    const H = () => {
      const A = hands(doc(), +fig.dataset.speed || 1);
      // 手机上演示页横着滑：要点的东西不在眼前，先把它滑过来
      A.reveal = async (el) => {
        if (!box.classList.contains('wide')) return;
        const s = box._scale || 1, r = el.getBoundingClientRect(), x0 = r.left * s, x1 = r.right * s;
        if (x0 >= box.scrollLeft + 8 && x1 <= box.scrollLeft + box.clientWidth - 8) return;
        box.scrollTo({ left: Math.max(0, (x0 + x1 - box.clientWidth) / 2), behavior: 'smooth' });
        await sleep(450);
      };
      if (leg) {
        A.legend = (i, m) => { const c = document.createElement('span'); c.innerHTML = `<i>${m.n ?? i + 1}</i>${m.t}`; leg.appendChild(c); requestAnimationFrame(() => c.classList.add('on')); };
        A.onUnmark = () => { leg.innerHTML = ''; };
      }
      return A;
    };
    const setStep = (i) => lis.forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('done', j < i); });
    const lock = (on) => { busy = on; fig.classList.toggle('playing', on); ['play', 'next', 'reset'].forEach((k) => { const b = btn(k); if (b) b.disabled = on || (k === 'next' && !fig.classList.contains('played')); }); };
    const prep = async () => {
      for (let i = 0; i < 80; i++) { const d = doc(); if (d && d.readyState === 'complete' && d.querySelector('button')) break; await sleep(150); }
      const A = H();
      await S.setup(A);
      ready = true;
      return A;
    };
    const play = async () => {
      if (busy) return;
      lock(true);
      try {
        if (fig.classList.contains('played')) { await reset(true); }
        const A = ready ? H() : await prep();
        for (const [i, s] of S.steps.entries()) { setStep(i); if (note) note.textContent = s.t; await s.run(A); await sleep(260); }
        setStep(S.steps.length);
        lis.at(-1)?.classList.add('on');
        fig.classList.add('played');
        ki = 2;
      } catch (e) { console.warn('自动演示停在：', e.message); }
      lock(false);
    };
    const reset = async (inner) => {
      if (busy && !inner) return;
      if (!inner) lock(true);
      fig.classList.remove('played');
      setStep(-1);
      if (leg) leg.innerHTML = '';
      ready = false;
      const live = MH.live(box);
      live.reload();
      await sleep(400);
      await prep().catch(() => {});
      if (!inner) lock(false);
    };
    btn('play')?.addEventListener('click', play);
    btn('reset')?.addEventListener('click', () => reset());
    btn('next')?.addEventListener('click', async () => {
      if (busy || !S.next) return;
      lock(true);
      try { const n = await S.next(H(), ki++); if (note) note.textContent = '换成 ' + n + '，还在'; } catch (e) { console.warn(e.message); }
      lock(false);
    });
    lock(false);
    // 真组件加载好了先摆到第一步之前的样子
    const onLive = (e) => { if (e.detail?.box === box) prep().catch(() => {}); };
    document.addEventListener('mh:live', onLive);
  });
  // 别的页面脚本也用这只假鼠标（04-2 的侧栏、对话框）
  if (window.MH) window.MH.hands = hands;
})();
