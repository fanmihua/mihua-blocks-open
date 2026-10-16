/* 第 06 篇的交互：说明的步骤（data/docs.js）、组件库档案（data/kits.js），都从仓库里读。 */
(function () {
  const MH = window.MH, K = window.MH_KITS, D = window.MH_DOCS;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const KIT = Object.fromEntries(K.kits.map((k) => [k.id, k]));

  // 6.2 三份说明的步骤
  const steps = $('#steps');
  const paint = (id) => { const d = D[id]; steps.innerHTML = d.steps.map((s) => `<li><b>${esc(s.no)}</b><span>${esc(s.title)}</span></li>`).join('') + `<li class="f"><code>${esc(d.file)}</code></li>`; };
  // 公开版里这一节收起了，没有 #steps
  if (steps) { MH.seg('howto', paint); paint('connect'); }

  // 6.3 档案：每一项只摆两句，全文在附录 A
  const FIELDS = [['styling', '样式怎么写'], ['theming', '主题从哪进'], ['sizing', '尺寸'], ['icons', '图标']]; // 这个系列不讲无障碍，档案里那一项不放
  const first = (t) => (t || '').split(/[。；]/)[0] + '。';
  const prof = $('#prof');
  const show = (id) => {
    const p = KIT[id].profile;
    // 字用附录 A 里重新编辑过的短句（data/edit.js），每一项前两句
    const ed = ((window.MH_EDIT || {}).profiles || {})[id];
    prof.innerHTML = `<div class="ph"><b>${KIT[id].name}</b>${(p.tags || []).map((t) => `<span class="chip">${esc(t.zh)}</span>`).join('')}</div>` + FIELDS.map(([k, zh]) => `<div class="pr"><i>${zh}</i><span>${ed && ed.rows[k] ? ed.rows[k].slice(0, 2).join('；') : esc(first(p[k] && p[k].zh))}</span></div>`).join('');
  };
  if (prof) { MH.seg('prof', show); show('tdesign'); }

  // 6.1 插画：手册上四个标签，第四个是取舍记录，底下的胶带也写上它；胶带压着画布下边，画布往下加高一点
  const ills = () => {
    if (window.MHILL) window.MHILL.draw();
    const svg = $('.ill[data-ill="manual"] svg');
    if (!svg || svg.dataset.fixed) return;
    svg.dataset.fixed = '1';
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h + 14}`);
    const bg = svg.querySelector(':scope > rect');
    if (bg) bg.setAttribute('height', h + 14);
    const t = Array.from(svg.querySelectorAll('text.tape')).find((el) => el.textContent === 'AGENTS.md + 三份做法说明');
    const r = t && t.parentNode.querySelector('rect');
    if (!r) return;
    t.textContent = 'AGENTS.md + 三份做法说明 + 取舍记录';
    // 胶带宽度照 ill.js 的算法：英文字 0.6 个字号、中文 1.02 个字号，再加 28
    const tw = Array.from(t.textContent).reduce((n, c) => n + (/[ -~]/.test(c) ? 17 * 0.6 : 17 * 1.02), 0) + 28;
    r.setAttribute('x', -tw / 2);
    r.setAttribute('width', tw);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ills); else ills();

  // 6.10 六篇
  const recap = $('#recap');
  if (recap) recap.innerHTML = MH.ARTICLES.filter(([f]) => f !== '00-repo.html').map(([f, n, t]) => `<a href="${f}"><span>${n}</span><b>${esc(t)}</b></a>`).join('');
})();
