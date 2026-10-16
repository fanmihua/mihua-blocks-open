/*
 * 画代码面板和图标（数据在 assets/data/code.js、icons.js，都是脚本从仓库真文件里读出来的）。
 *   <div class="code" data-code="design-size"></div>            代码面板：标题一句人话，右边文件和行号，关键行亮
 *   <div class="code" data-code="x" data-say="换一句标题"></div>
 *   标亮的行带大白话解释（写在 _tools/code-notes.mjs）：鼠标停在行上出浮层，手机上点一下；
 *   面板右上角「显示全部解释」把解释排进代码里。默认样子和尺寸不变（录视频的静帧照旧）。
 *   <i class="ico" data-icon="check" data-set="lucide"></i>        画一个语义图标
 */
(function () {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const C = window.MH_CODE || {};
  // 「文件 · 行号」：路径只在 / 后面换行，一段行号（比如 238–244）不拆开
  const where = (w) => {
    const i = w.lastIndexOf(' · ');
    const path = i < 0 ? w : w.slice(0, i), lines = i < 0 ? '' : w.slice(i + 3);
    return `<span class="wp">${esc(path).replace(/\//g, '/<wbr>')}</span>${lines ? ` <span class="wl">${lines.split('、').map((x, i) => `<span class="nb">${i ? '' : '· '}${esc(x)}</span>`).join('、<wbr>')}</span>` : ''}`;
  };
  document.querySelectorAll('.code[data-code]').forEach((el) => {
    const s = C[el.dataset.code];
    if (!s) { el.innerHTML = `<div class="tab"><span class="s">没有这段代码：${esc(el.dataset.code)}</span></div>`; return; }
    // 每一行属于第几条解释；解释排在它那几行的最后一行后面（平时藏着）
    const notes = s.notes || [];
    const at = (n) => notes.findIndex((x) => n >= x.a && n <= x.b);
    const rows = s.rows
      .map((r) => {
        if (r.gap) return '<span class="l gap"><span class="ln">⋯</span><span class="tx"></span></span>';
        const k = r.h ? at(r.n) : -1, x = notes[k];
        const mark = x && r.n === x.a ? `<button type="button" class="nm" data-k="${k}" data-n="${k + 1}" aria-label="第 ${k + 1} 条解释"></button>` : '';
        const line = `<span class="l${r.h ? ' h' : ''}${x ? ' nt' : ''}"${x ? ` data-k="${k}"` : ''}>${mark}<span class="ln">${r.n}</span><span class="tx">${esc(r.t)}</span></span>`;
        return x && r.n === x.b ? line + `<span class="l nr" data-k="${k}"><span class="ln"><i data-n="${k + 1}"></i></span><span class="tx">${esc(x.t)}</span></span>` : line;
      })
      .join('');
    const extra = el.innerHTML;
    el.innerHTML = `<div class="tab"><span class="s">${el.dataset.say || s.say}</span><b>${where(s.where)}</b></div><pre class="${s.packed ? 'packed' : ''}">${rows}</pre>${extra}`;
    if (notes.length) { el.classList.add('has-notes'); el.insertAdjacentHTML('beforeend', '<button type="button" class="nall" title="鼠标停在标亮的行上，也能看那一行的解释">显示全部解释</button>'); }
  });

  // ── 解释浮层：全页一个，挂在 body 上（面板自己裁掉溢出的部分）；放大看时跟着图一起放大。
  //   摆在这一整块标亮行的下面（放不下就上面），不盖住别的标亮行；鼠标停着时浮层不挡鼠标，往下挪照样换行
  const pop = document.createElement('div');
  pop.className = 'cnote';
  pop.hidden = true;
  pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);
  let cur = null, pinned = false, timer = 0;
  const group = (code, k) => Array.from(code.querySelectorAll(`.l.nt[data-k="${k}"]`));
  const range = (x) => (x.a === x.b ? `第 ${x.a} 行` : `第 ${x.a}–${x.b} 行`);
  // 连着的一整块标亮行（中间藏着的解释行不算断开）
  const block = (l) => {
    const lit = (e) => e && e.classList.contains('l') && (e.classList.contains('h') || e.classList.contains('nr'));
    let a = l, b = l;
    for (let e = l.previousElementSibling; lit(e); e = e.previousElementSibling) if (e.classList.contains('h')) a = e;
    for (let e = l.nextElementSibling; lit(e); e = e.nextElementSibling) if (e.classList.contains('h')) b = e;
    return [a, b];
  };
  const place = () => {
    if (!cur) return;
    const ls = group(cur.code, cur.k);
    if (!ls.length || !cur.code.isConnected) return hide();
    const top = block(ls[0])[0].getBoundingClientRect(), bot = block(ls[ls.length - 1])[1].getBoundingClientRect(), tx = ls[0].querySelector('.tx').getBoundingClientRect();
    if (bot.bottom < 0 || top.top > innerHeight) return hide();
    const fig = cur.code.closest('.staged');
    const k = fig && fig.offsetWidth ? fig.getBoundingClientRect().width / fig.offsetWidth : 1;
    pop.style.transform = k !== 1 ? `scale(${k})` : '';
    const w = pop.offsetWidth * k, h = pop.offsetHeight * k, g = 6 * k;
    const left = Math.max(12, Math.min(innerWidth - w - 12, tx.left));
    const below = bot.bottom + g + h <= innerHeight - 12 || top.top - g - h < 56;
    pop.style.left = left + 'px';
    pop.style.top = (below ? bot.bottom + g : top.top - g - h) + 'px';
  };
  const show = (code, k, pin) => {
    clearTimeout(timer);
    const s = C[code.dataset.code], x = s && s.notes && s.notes[k];
    if (!x) return;
    if (cur && (cur.code !== code || cur.k !== k)) group(cur.code, cur.k).forEach((l) => l.classList.remove('on'));
    cur = { code, k };
    pinned = !!pin;
    group(code, k).forEach((l) => l.classList.add('on'));
    pop.innerHTML = `<div class="cn-h"><i data-n="${+k + 1}"></i><span>${range(x)}</span></div><p>${esc(x.t)}</p>${pin && !code.classList.contains('notes-on') ? '<button type="button" class="cn-all">显示这段的全部解释</button>' : ''}`;
    pop.classList.toggle('pinned', pinned);
    pop.hidden = false;
    place();
  };
  const hide = () => {
    clearTimeout(timer);
    if (cur) group(cur.code, cur.k).forEach((l) => l.classList.remove('on'));
    cur = null; pinned = false; pop.hidden = true;
  };
  const later = () => { clearTimeout(timer); if (!pinned) timer = setTimeout(hide, 160); };
  const lineOf = (e) => e.target.closest && e.target.closest('.code.has-notes .l.nt');
  // 鼠标：停在行上就出；挪到浮层上不消失（浮层里有按钮）
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const l = lineOf(e);
    if (l) { if (!pinned || cur?.code !== l.closest('.code') || cur?.k !== l.dataset.k) show(l.closest('.code'), l.dataset.k, false); }
    else if (e.target.closest && e.target.closest('.cnote')) clearTimeout(timer);
    else if (cur && !pinned) later();
  });
  // 点一下（手机、键盘、鼠标都行）：钉住；再点一下收起；点别处收起
  document.addEventListener('click', (e) => {
    const all = e.target.closest && e.target.closest('.code .nall, .cnote .cn-all');
    if (all) { const code = all.closest('.code') || cur?.code; if (code) toggleAll(code); return; }
    const l = e.target.closest && (e.target.closest('.code.has-notes .nm') ? e.target.closest('.l') : lineOf(e));
    if (l && !(window.getSelection && String(getSelection()).length)) {
      const code = l.closest('.code');
      if (pinned && cur?.code === code && cur?.k === l.dataset.k) hide(); else show(code, l.dataset.k, true);
      return;
    }
    if (!(e.target.closest && e.target.closest('.cnote'))) hide();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cur) hide(); });
  addEventListener('scroll', place, { passive: true, capture: true });
  addEventListener('resize', place);
  // 显示全部解释：解释排进代码里（这块会变高），再点收起
  const toggleAll = (code) => {
    const on = code.classList.toggle('notes-on');
    code.querySelector('.nall').textContent = on ? '收起解释' : '显示全部解释';
    hide();
    if (window.MH && MH.relayout) MH.relayout();
  };

  const I = window.MH_ICONS;
  window.mhIcon = (name, set, size = 24, stroke) => {
    if (!I) return '';
    const S = I.sets[set] || I.sets.lucide;
    const g = S.glyphs[name] || [];
    const body = g.map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke ?? S.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  };
  document.querySelectorAll('.ico[data-icon]').forEach((el) => { el.innerHTML = window.mhIcon(el.dataset.icon, el.dataset.set || 'lucide', +(el.dataset.size || 24)); });
})();
