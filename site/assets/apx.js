/* 附录 A、B、C 的内容，都从仓库里读（data/kits.js、data/tradeoffs.js）。几篇共用，按页面上有没有对应的元素各画各的。 */
(function () {
  const MH = window.MH, K = window.MH_KITS, T = window.MH_TRADEOFFS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const KIT = K && Object.fromEntries(K.kits.map((k) => [k.id, k]));

  // 「定了：A」这种，展开成选项里 A 的原文
  const decision = (e) => {
    const d = e.fields.find(([k]) => k === '定了');
    // 12b 这种分几处写的，每处各有一句「定了：……」，摘出来连在一起
    if (!d) return e.fields.map(([, v]) => (v.match(/定了[：:]\s*([^（(；;。]+)/) || [])[1]).filter(Boolean).join('；');
    let v = d[1];
    const m = v.match(/^([A-D])(?![A-Za-z])[\s。：:，,]*(.*)$/);
    if (!m) return v.split('。')[0];
    const opt = (e.fields.find(([k]) => k === '选项') || [, ''])[1];
    const o = opt.match(new RegExp(m[1] + '\\.\\s*(.+?)(?=[；;]\\s*[A-D]\\.|。|$)'));
    const head = o ? `${m[1]}：${o[1].trim()}` : m[1];
    return head;
  };
  // A · 档案：网页上显示的是重新编辑过的短句（data/edit.js，由 _tools/edit.mjs 生成）；档案原文收进「全部细节」
  const E = window.MH_EDIT || {};
  const FIELDS = [['styling', '样式怎么写'], ['theming', '主题从哪进'], ['sizing', '尺寸'], ['look', '默认长相'], ['icons', '图标'], ['setup', '接进项目要做的事']];
  const RAW = FIELDS; // 这个系列不讲无障碍（键盘、读屏），档案原文里那一项也不放
  const li = (list) => `<ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  // 适配记录只列和样子有关的：无障碍那一类不列；键盘那一类只留「聚焦时什么样」（这个系列不讲键盘、读屏）
  const shown = (k, a, i) => { if (a.aspect === 'a11y') return false; if (a.aspect !== 'keyboard') return true; const e = ((E.records || {})[k] || [])[i], t = e ? e.join('') : a.native + a.aligned; return /外圈|轮廓/.test(t) && !/方向键|回车|空格|Esc|[↑↓←→]|Tab|键盘|读屏/.test(t); };
  const count = (k) => KIT[k].adaptations.filter((a, i) => shown(k, a, i)).length;
  $$('.pf[data-kit]').forEach((box) => {
    const k = KIT[box.dataset.kit], p = k.profile, ed = E.profiles && E.profiles[k.id];
    const val = (v) => (Array.isArray(v) ? `<ul>${v.map((x) => `<li>${esc(x.zh)}</li>`).join('')}</ul>` : esc(v && v.zh));
    const head = `<div class="ph">${(p.tags || []).map((t) => `<span class="chip">${esc(t.zh)}</span>`).join('')}<a href="${p.site}" target="_blank" rel="noopener">官网 ↗</a><a href="a2-adaptations.html?kit=${k.id}#r1">适配记录 ${count(k.id)} 条</a></div>`;
    const raw = RAW.filter(([f]) => p[f]).map(([f, zh]) => `<div class="pr"><i>${zh}</i><div>${val(p[f])}</div></div>`).join('') + `<p class="from"><code>${k.file}</code> 第 ${k.profileLine} 行</p>`;
    if (!ed) { box.innerHTML = head + raw; return; }
    // 默认长相：先摆色块和样子，再写几句
    const n = ed.nums;
    const look = `<div class="pl-chips"><span class="pl-c"><i style="background:${n.primary}"></i>主色 <b>${n.primary}</b></span><span class="pl-c"><i class="r" style="border-radius:${n.radius}px"></i>圆角 <b>${n.radius}</b></span><span class="pl-c"><i class="cb" style="width:${n.checkbox}px;height:${n.checkbox}px;border-radius:${Math.min(4, +n.radius)}px"></i>复选框 <b>${n.checkbox}</b></span></div>`;
    const rows = FIELDS.map(([f, zh]) => (ed.rows[f] ? `<div class="pr2"><h5>${zh}</h5><div>${f === 'look' ? look : ''}${li(ed.rows[f])}</div></div>` : '')).join('');
    box.innerHTML = head + rows + `<p class="from">档案原文：<code>${k.file}</code> 第 ${k.profileLine} 行</p>`;
  });
  // A · 每个库开头的总览卡：一句话 + 几个关键数（真控件条在页面里，见 a1-libraries.html）
  $$('[data-kov]').forEach((el) => {
    const ed = E.profiles && E.profiles[el.dataset.kov];
    if (!ed) return;
    const n = ed.nums;
    el.innerHTML = `<p class="kv-g">${ed.gist}</p><div class="kv-n"><div class="c"><small>主色</small><b><i style="background:${n.primary}"></i>${n.primary}</b></div><div><small>圆角</small><b>${n.radius}<em>px</em></b></div><div><small>复选框</small><b>${n.checkbox}<em>px</em></b></div><div class="h"><small>控件高度${n.heightsNote ? ` · ${n.heightsNote}` : ''}</small><b>${n.heights}<em>px</em></b></div></div>`;
  });

  // A · 总览：用什么写的、颜色和尺寸是三种情况里的哪一种（第 01 篇 1.13）、适配记录几条
  const kov = $('#kov');
  if (kov && K) {
    const CASE = { 1: '它自己会', 2: '要你说全', 3: '它改不了' };
    const C = { antd: [1, 1], element: [2, 3], shadcn: [2, 3], arco: [2, 3], tdesign: [2, 2] };
    const max = Math.max(...K.kits.map((k) => count(k.id)));
    const dots = (n) => `<span class="kd">${[1, 2, 3].map((i) => `<i class="${i === n ? 'on' : ''}"></i>`).join('')}<small>${CASE[n]}</small></span>`;
    kov.innerHTML = `<div class="kr kh"><span>组件库</span><span>写法</span><span>颜色上</span><span>尺寸上</span><span>适配记录</span></div>` + K.kits.map((k) => `<a class="kr" href="#k-${k.id}"><b>${k.name}</b><span>${k.framework === 'vue' ? 'Vue' : 'React'}</span>${dots(C[k.id][0])}${dots(C[k.id][1])}<span class="kb"><i style="width:${(count(k.id) / max) * 100}%"></i><em>${count(k.id)}</em></span></a>`).join('');
  }

  // B.1 适配记录：上面一张图（这个库的记录落在哪几个控件上），下面按控件分组，每组配「原生 → 对齐」两张截图
  const rec = $('#rec');
  if (rec) {
    let kit = 'antd', aspect = 'all';
    const CTL = Object.keys(K.controls);
    // 每个控件截的是哪一块（_tools/shots-b.mjs）；开关、日期范围用第 03 篇截好的
    const REGION = { avatar: 'header', badge: 'header' };
    const shot = (c, mode, k) => (c === 'switch' ? `assets/img/03-switch-${mode}-${k}.png` : c === 'dateRange' ? `assets/img/03-date-${mode}-${k}.png` : `assets/img/b-${REGION[c] || c}-${mode}-${k}.png`);
    const asp = $('#raspect');
    const ASP = Object.entries(K.aspects).filter(([k]) => k !== 'a11y' && k !== 'keyboard');
    asp.innerHTML = `<button data-v="all" class="on">全部</button>` + ASP.map(([k, zh]) => `<button data-v="${k}">${zh}</button>`).join('');
    const groups = $('#rec-groups');
    const paint = () => {
      const all = KIT[kit].adaptations;
      const list = all.filter((a, i) => shown(kit, a, i) && (aspect === 'all' || a.aspect === aspect));
      const by = CTL.map((c) => [c, list.filter((a) => a.control === c)]).filter(([, l]) => l.length);
      const max = Math.max(...by.map(([, l]) => l.length));
      rec.innerHTML = `<p class="cnt">${KIT[kit].name}：${list.length} 条，落在 ${by.length} 种控件上</p><div class="rbars">${by.map(([c, l]) => `<a class="rbar" href="#g-${c}"><span class="rb-n">${K.controls[c] || c}</span><span class="rb-b"><i style="width:${(l.length / max) * 100}%"></i></span><b>${l.length}</b></a>`).join('')}</div><p class="from"><code>${KIT[kit].file}</code> 第 ${KIT[kit].adaptationsLine} 行起</p>`;
      const name = KIT[kit].name;
      // 每条显示改写过的两句（data/edit.js）；原文收在每组末尾的「原文」里
      const ER = (E.records || {})[kit] || [];
      const idx = (a) => all.indexOf(a);
      groups.innerHTML = by.map(([c, l]) => `<section class="rgp" id="g-${c}"><div class="rgp-h"><b>${K.controls[c] || c}</b><span>${l.length} 条</span></div><div class="rgp-b"><div class="rgp-pic"><div><div class="lab">组件库原生</div><img src="${shot(c, 'native', kit)}" alt="${name} 的${K.controls[c]}，组件库原生" loading="lazy"></div><div><div class="lab">对齐到控件规格</div><img src="${shot(c, 'aligned', kit)}" alt="${name} 的${K.controls[c]}，对齐到控件规格" loading="lazy"></div></div><div><ul class="rgp-l">${l.map((a) => { const e = ER[idx(a)]; return `<li><span class="chip">${a.aspect === 'keyboard' ? '聚焦' : K.aspects[a.aspect] || a.aspect}</span><div><p>${e ? e[0] : esc(a.native)}</p><p class="to">${e ? e[1] : esc(a.aligned)}</p></div><span class="chip m">${K.methods[a.via] || a.via}</span></li>`; }).join('')}</ul></div></div></section>`).join('');
      MH.sameScale && MH.sameScale(groups);
    };
    const setKit = MH.seg('rkit', (v) => { kit = v; paint(); });
    MH.seg('raspect', (v) => { aspect = v; paint(); });
    const want = new URLSearchParams(location.search).get('kit');
    if (want && KIT[want]) { kit = want; setKit(want, true); }
    paint();
  }

  // C.5 全部取舍记录：每条一张小画面（assets/art.js）和「定了」一句；现象、各库、选项、理由收在下面，点开看
  // 原文「**定了：A**：行还看得见」，读出来时 A 后面的冒号丢了，这里补回去
  const show = (k, v) => (k === '定了' ? v.replace(/^([A-D])(?=[^\sA-Za-z0-9（(；;。：:，,、])/, '$1：') : v);
  const tl = $('#t-list');
  if (tl && T) {
    tl.innerHTML = T.sections.map((sec) => {
      const items = T.entries.filter((e) => e.section === sec.title && !((E.tradeoffs || {})[e.no] || {}).hide);
      const sn = (E.sections || {})[sec.title];
      return `<h3>${esc(sec.title)}</h3>${sn ? `<p class="note">${sn}</p>` : sec.note ? `<p class="note">${esc(sec.note.replace(/^记录人：[^。]*。/, ''))}</p>` : ''}${items.map((e) => {
        const d = decision(e);
        const art = MH.tradeoffArt ? MH.tradeoffArt(e.no) : '';
        // 字段名太长（12b 那种整句）就放在上面一行
        const stack = e.fields.some(([k]) => k.length > 6) ? ' stack' : '';
        const names = e.fields.map(([k]) => k).filter((k) => k && k !== '定了' && k.length <= 6);
        // 显示改写过的字（data/edit.js）：标题、定了、为什么、谁定的；各库怎么做和原文收进折叠
        const ed = (E.tradeoffs || {})[e.no];
        const raw = `${e.fields.map(([k, v]) => `<div class="pr${stack}"><i>${esc(k)}</i><div>${esc(show(k, v))}</div></div>`).join('')}<p class="from"><code>docs/取舍记录.md</code> 第 ${e.line} 行</p>`;
        if (!ed) return `<article class="trd" id="t-${e.no}"><div class="trd-h"><b>${e.no}</b><h4>${esc(e.title)}</h4></div>${art ? `<figure class="fig trd-fig" data-fig="t${e.no}">${art}</figure>` : ''}${d ? `<p class="trd-d"><i>定了</i><span>${esc(d)}</span></p>` : ''}<details class="trd-x"><summary>原文${names.length ? `：${names.join('、')}` : ''}</summary>${raw}</details></article>`;
        return `<article class="trd" id="t-${e.no}"><div class="trd-h"><b>${e.no}</b><h4>${esc(ed.t)}</h4></div>${art ? `<figure class="fig trd-fig" data-fig="t${e.no}">${art}</figure>` : ''}<div class="trd-k"><div class="trd-d"><i>定了</i><div>${ed.d.map((x) => `<p>${x}</p>`).join('')}</div></div>${ed.why ? `<div class="trd-d why"><i>为什么</i><div><p>${ed.why}</p></div></div>` : ''}<p class="trd-who">谁定的：${esc(ed.who)}</p></div>${ed.libs && ed.libs.length ? `<details class="trd-x"><summary>各库原来怎么做</summary><ul class="trd-libs">${ed.libs.map((x) => `<li>${x}</li>`).join('')}</ul></details>` : ''}<p class="from">原文：<code>docs/取舍记录.md</code> 第 ${e.line} 行</p></article>`;
      }).join('')}`;
    }).join('');
  }

  // ── C.2 判断顺序下面的四种情况（读编辑层 data/edit.js：这个系列不讲键盘、读屏，原文的括号和例子换掉了）
  const cases = $('#cases');
  if (cases && T) cases.innerHTML = '<tr><th>情况</th><th>怎么办</th><th>例子</th></tr>' + (((E.rules || {}).cases) || T.cases).map((c) => `<tr><td>${esc(c.when.replace(/（.*）/, ''))}</td><td>${esc(c.what)}</td><td>${esc(c.example)}</td></tr>`).join('');

  // ── C.4 谁定的：一条一格，黑的是设计师自己定的，白的是授权 AI 按推荐定的；点一格跳到下面那一条
  const sq = $('#to-sq');
  if (sq && T) {
    const batch = T.sections.find((x) => /客户列表/.test(x.title));
    const ENT = T.entries.filter((e) => !((E.tradeoffs || {})[e.no] || {}).hide);
    const mine = (e) => e.section !== (batch && batch.title);
    const tt = (e) => ((E.tradeoffs || {})[e.no] ? E.tradeoffs[e.no].t : e.title);
    sq.innerHTML = `<div class="tsq-g">${ENT.map((e) => `<a class="${mine(e) ? 'me' : ''}" href="#t-${e.no}" title="${esc(tt(e))}"><b>${e.no}</b><span>${esc(tt(e))}</span></a>`).join('')}</div><div class="tsq-l"><span><i class="me"></i>设计师定的 · ${ENT.filter(mine).length} 条</span><span><i></i>授权 AI 按推荐定的 · ${ENT.filter((e) => !mine(e)).length} 条</span></div>`;
  }

  // ── C.1 插画：底部的胶带标签压着画布下边，描边被裁掉一截。画布往下加高一点
  const growIll = (name, add) => {
    const svg = $(`.ill[data-ill="${name}"] svg`);
    if (!svg || svg.dataset.grown) return;
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h + add}`);
    const bg = svg.querySelector(':scope > rect');
    if (bg) bg.setAttribute('height', h + add);
    svg.dataset.grown = '1';
  };
  const ills = () => { if (window.MHILL) window.MHILL.draw(); growIll('decide', 14); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ills); else ills();
})();
