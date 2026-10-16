/*
 * 各篇的缩略图：用代码画（截图拼的太粗糙，视觉层三篇也会是同一张）。
 *   黑白为主，一篇一张示意图，16:9（320 × 180）。原生组件库的蓝只在「原生」那一格出现。
 *   用法：<span data-thumb="02-1"></span>，或者 MH_THUMB('02-1') 拿到 SVG 字符串。
 *   图标那一张用的是 assets/data/icons.js 里的真图标（要先加载它）。
 */
(function () {
  const INK = '#0a0a0a', G6 = '#525252', G5 = '#737373', G4 = '#a3a3a3', G3 = '#d4d4d4', G2 = '#e5e5e5', G1 = '#f5f5f5', SEL = '#ebebeb', BLUE = '#1677ff';
  const rect = (x, y, w, h, r, fill, stroke, sw = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill || 'none'}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;
  const text = (x, y, s, size, fill, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.mono ? ' class="m"' : ''}${o.bold ? ' font-weight="600"' : ''}>${s}</text>`;
  const bar = (x, y, w, fill = G2, h = 5) => rect(x, y, w, h, h / 2, fill);
  const check = (cx, cy, r = 9) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${INK}"/><path d="M${cx - r * 0.42} ${cy + r * 0.02} l${r * 0.3} ${r * 0.3} l${r * 0.56} -${r * 0.62}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  const folder = (x, y, c = G4) => `<path d="M${x} ${y + 2}a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H${x + 2}a2 2 0 0 1-2-2z" fill="${c}"/>`;
  const file = (x, y, c = G4) => `<path d="M${x} ${y}h8l4 4v9H${x}z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>`;
  // 迷你登录框：一个输入框 + 一个按钮
  const login = (x, y, w, h, btn = INK, line = G3) => rect(x, y, w, h, 5, '#fff', line) + bar(x + 7, y + h / 2 - 2.5, w * 0.42, G2) + rect(x + w - w * 0.34 - 6, y + h / 2 - 5, w * 0.34, 10, 3, btn);
  const icon = (name, set, x, y, size) => {
    const S = window.MH_ICONS?.sets?.[set];
    const g = S?.glyphs?.[name];
    if (!g) return rect(x, y, size, size, 4, 'none', G3);
    const body = g.map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="${S.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  };

  const DRAW = {
    // 导读：一份规范，交给五个组件库，长出五个一样的登录框
    导读: () => {
      let s = rect(28, 34, 92, 112, 8, '#fff', INK, 1.5) + text(40, 56, 'Design.md', 12, INK, { mono: 1, bold: 1 });
      [64, 52, 60, 40].forEach((w, i) => (s += bar(40, 70 + i * 14, w)));
      s += rect(40, 126, 10, 10, 2, INK) + bar(56, 128.5, 36);
      [0, 1, 2, 3, 4].forEach((i) => {
        const y = 27 + i * 27;
        s += `<path d="M120 90 C160 90 156 ${y + 11} 196 ${y + 11}" fill="none" stroke="${G4}" stroke-width="1.2"/>`;
        s += login(196, y, 100, 22);
      });
      return s + `<circle cx="120" cy="90" r="3.5" fill="${INK}"/>`;
    },
    // 00：仓库的目录
    '00': () => {
      let s = rect(16, 14, 288, 152, 10, '#fff', G3) + text(30, 34, 'mihua-blocks-open/', 13, INK, { mono: 1, bold: 1 }) + `<line x1="16" y1="44" x2="304" y2="44" stroke="${G2}"/>`;
      const a = ['designs/', 'spec/', 'core/', 'react/', 'vue/'], b = ['audit/', 'examples/', 'docs/', 'skills/', 'AGENTS.md'];
      s += rect(22, 50, 132, 22, 5, G1);
      a.forEach((n, i) => (s += folder(32, 55 + i * 22, i ? G4 : INK) + text(56, 66 + i * 22, n, 13, i ? G6 : INK, { mono: 1 })));
      b.forEach((n, i) => (s += (i === 4 ? file(176, 55 + i * 22) : folder(174, 55 + i * 22)) + text(198, 66 + i * 22, n, 13, G6, { mono: 1 })));
      return s;
    },
    // 01：三种外观模式，四层拆解
    '01': () => {
      let s = rect(40, 16, 240, 30, 15, '#fff', G3);
      s += rect(202, 19, 75, 24, 12, INK);
      s += text(80, 36, '原生', 13, G6, { anchor: 'middle' }) + text(160, 36, '只设主题', 13, G6, { anchor: 'middle' }) + text(240, 36, '对齐', 13, '#fff', { anchor: 'middle', bold: 1 });
      ['视觉', '控件', '结构', '逻辑'].forEach((n, i) => {
        const y = 62 + i * 27, x = 52, w = 216;
        s += `<path d="M${x + 14} ${y}H${x + w}l-14 22H${x}z" fill="${i ? '#fff' : SEL}" stroke="${i ? G3 : INK}" stroke-width="${i ? 1 : 1.4}" stroke-linejoin="round"/>`;
        s += text(x + 26, y + 15.5, n, 13, i ? G6 : INK, { bold: !i }) + text(x + w - 26, y + 15.5, `0${i + 1}`, 12, G4, { mono: 1, anchor: 'end' });
      });
      return s;
    },
    // 02-1：一个主色，算出整套状态色；五个库算出来一样
    '02-1': () => {
      let s = `<circle cx="66" cy="84" r="28" fill="${INK}"/>` + text(66, 132, '#0A0A0A', 12, G5, { mono: 1, anchor: 'middle' });
      s += `<path d="M104 84h22m-6-5 6 5-6 5" fill="none" stroke="${G4}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      const states = [['平时', INK], ['悬停', '#333333'], ['按下', '#262626'], ['选中', SEL], ['聚焦', '#fff']];
      for (let r = 0; r < 5; r++)
        states.forEach(([, c], i) => {
          const x = 140 + i * 33, y = 26 + r * 22;
          s += i === 4 ? rect(x + 1, y + 1, 24, 13, 4, '#fff', INK, 1.6) : rect(x, y, 26, 15, 4, c);
        });
      states.forEach(([n], i) => (s += text(153 + i * 33, 157, n, 12, G5, { anchor: 'middle' })));
      return s;
    },
    // 02-2：原来高矮不一（虚线），对齐后都是 32
    '02-2': () => {
      let s = '';
      const ghost = [46, 40, 34, 52, 44];
      s += `<line x1="44" y1="70" x2="306" y2="70" stroke="${INK}" stroke-width="0.8" stroke-dasharray="3 3"/><line x1="44" y1="110" x2="306" y2="110" stroke="${INK}" stroke-width="0.8" stroke-dasharray="3 3"/>`;
      ghost.forEach((h, i) => {
        const x = 54 + i * 51;
        s += rect(x, 90 - h / 2 - 8, 43, h + 16, 5, 'none', G3, 1) .replace('/>', ' stroke-dasharray="3 2"/>');
        s += rect(x, 70, 43, 40, 5, '#fff', INK, 1.4) + bar(x + 8, 87.5, 18, G3);
      });
      s += `<path d="M30 70v40m-4-40h8m-8 40h8" fill="none" stroke="${INK}" stroke-width="1.2"/>` + text(30, 136, '32', 13, INK, { mono: 1, anchor: 'middle', bold: 1 });
      return s;
    },
    // 02-3：五个组件库的下拉箭头各画各的，统一成一个语义图标，再换成同一套图形
    '02-3': () => {
      const xs = [60, 110, 160, 210, 260];
      const own = [
        (x) => `<path d="M${x - 7} 30l7 8 7-8z" fill="${G6}"/>`,
        (x) => `<path d="M${x - 8} 30l8 8 8-8" fill="none" stroke="${G6}" stroke-width="1"/>`,
        (x) => `<path d="M${x - 7} 29l7 8 7-8" fill="none" stroke="${G6}" stroke-width="3" stroke-linecap="square"/>`,
        (x) => `<path d="M${x - 5} 32l5 4 5-4" fill="none" stroke="${G6}" stroke-width="1.6" stroke-linecap="round"/><path d="M${x - 5} 27l5-4 5 4" fill="none" stroke="${G6}" stroke-width="1.6" stroke-linecap="round"/>`,
        (x) => `<path d="M${x - 4} 31l4 4.5 4-4.5z" fill="${G6}" stroke="${G6}" stroke-width="1.5" stroke-linejoin="round"/>`,
      ];
      let s = '';
      xs.forEach((x, i) => {
        s += rect(x - 18, 16, 36, 34, 7, G1) + own[i](x);
        s += `<path d="M${x} 52C${x} 66 160 62 160 76" fill="none" stroke="${G3}"/><path d="M160 104C160 118 ${x} 114 ${x} 128" fill="none" stroke="${G3}"/>`;
        s += rect(x - 18, 130, 36, 34, 7, '#fff', INK, 1.2) + icon('chevron-down', 'lucide', x - 11, 136, 22);
      });
      return s + rect(104, 76, 112, 28, 14, INK) + text(160, 94.5, 'chevron-down', 12, '#fff', { mono: 1, anchor: 'middle' });
    },
    // 03-1：数据录入——输入框、选择框、开关、复选框、日期格子
    '03-1': () => {
      let s = rect(24, 22, 150, 30, 6, '#fff', INK, 1.3) + bar(36, 34.5, 70, G3) + rect(190, 22, 106, 30, 6, '#fff', G3) + bar(202, 34.5, 50, G3) + `<path d="M276 34l5 5 5-5" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += rect(24, 70, 44, 22, 11, INK) + `<circle cx="57" cy="81" r="9" fill="#fff"/>` + rect(78, 70, 44, 22, 11, G3) + `<circle cx="89" cy="81" r="9" fill="#fff"/>`;
      s += rect(140, 72, 18, 18, 4, INK) + `<path d="M144 81l3.5 3.5 6.5-7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` + bar(166, 78.5, 40, G3) + rect(220, 72, 18, 18, 4, '#fff', G4, 1.3) + bar(246, 78.5, 40, G3);
      s += rect(24, 108, 272, 56, 8, '#fff', G3);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) { const x = 38 + c * 29, y = 118 + r * 20; s += (r === 1 && c === 4) ? rect(x - 2, y - 2, 20, 18, 4, INK) : rect(x, y, 16, 14, 3, G1); }
      return s;
    },
    // 03-2：导航——侧栏菜单（选中一项）、标签栏（指示条）、面包屑
    '03-2': () => {
      let s = rect(20, 20, 98, 140, 8, '#fff', G3);
      [0, 1, 2, 3].forEach((i) => {
        const y = 32 + i * 30;
        if (i === 1) s += rect(26, y - 6, 86, 26, 5, SEL);
        s += rect(34, y + 2, 10, 10, 3, i === 1 ? INK : G3) + bar(52, y + 4.5, [44, 38, 48, 32][i], i === 1 ? INK : G3);
      });
      s += bar(140, 30, 40, INK, 6) + bar(196, 30, 40, G3, 6) + bar(252, 30, 40, G3, 6) + `<line x1="136" y1="48" x2="300" y2="48" stroke="${G2}"/>` + rect(136, 46, 48, 3, 1.5, INK);
      s += bar(140, 76, 28, G4) + text(178, 81, '/', 12, G4, { mono: 1 }) + bar(188, 76, 34, G4) + text(232, 81, '/', 12, G4, { mono: 1 }) + bar(242, 76, 40, INK);
      s += rect(140, 104, 110, 56, 6, '#fff', G3) + bar(150, 116, 70, G3) + rect(144, 126, 102, 14, 3, SEL) + bar(150, 130.5, 60, INK) + bar(150, 148, 56, G3);
      return s;
    },
    // 03-3：数据展示——表格（勾选一行）、头像和徽标
    '03-3': () => {
      let s = rect(20, 22, 220, 138, 8, '#fff', G3) + rect(20.5, 22.5, 219, 22, 7.5, G1);
      [0, 1, 2, 3, 4].forEach((i) => {
        const y = 45 + i * 23;
        if (i === 1) s += rect(21, y, 218, 23, 0, SEL);
        if (i) s += `<line x1="21" y1="${y}" x2="239" y2="${y}" stroke="${G2}"/>`;
        s += i === 1 ? rect(30, y + 6.5, 10, 10, 2.5, INK) + `<path d="M32.5 ${y + 11.5}l2 2 3.5-4" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>` : rect(30.5, y + 7, 9, 9, 2.5, '#fff', G4);
        s += bar(52, y + 9, 70, i === 1 ? G6 : G3) + bar(140, y + 9, 40, G3) + rect(196, y + 6, 32, 11, 5.5, i % 2 ? G2 : '#fff', G3);
      });
      s += rect(30.5, 29, 9, 9, 2.5, '#fff', G4) + bar(52, 30.5, 50, G4) + bar(140, 30.5, 30, G4);
      s += `<circle cx="276" cy="58" r="18" fill="${SEL}" stroke="${G3}"/><circle cx="276" cy="52" r="6" fill="${G4}"/><path d="M265 69a11 9 0 0 1 22 0" fill="${G4}"/>`;
      s += rect(282, 34, 22, 14, 7, INK) + text(293, 44.5, '3', 10, '#fff', { mono: 1, anchor: 'middle', bold: 1 });
      return s;
    },
    // 04：后台页面的布局线框，标出顶栏 56、侧栏 220
    '04': () => {
      let s = rect(20, 16, 280, 148, 8, '#fff', INK, 1.4);
      s += `<line x1="20" y1="40" x2="300" y2="40" stroke="${INK}" stroke-width="1.2"/><line x1="96" y1="40" x2="96" y2="164" stroke="${INK}" stroke-width="1.2"/>`;
      s += rect(30, 24, 30, 8, 4, INK) + `<circle cx="286" cy="28" r="5" fill="${G3}"/>` + bar(240, 25.5, 34, G2);
      [0, 1, 2, 3, 4].forEach((i) => (s += i === 1 ? rect(26, 50 + i * 16, 64, 12, 3, SEL) + bar(34, 53.5 + i * 16, 36, INK) : bar(34, 53.5 + i * 16, 36 - (i % 2) * 8, G3)));
      s += rect(108, 52, 180, 22, 4, G1, G3) + rect(108, 82, 180, 70, 4, '#fff', G3);
      [0, 1, 2].forEach((i) => (s += bar(118, 96 + i * 16, 120 - i * 18, G2)));
      // 标注：顶栏高、侧栏宽
      s += `<path d="M312 16v24m-4-24h8m-8 24h8" fill="none" stroke="${INK}" stroke-width="1"/>` + text(312, 13, '56', 11, INK, { mono: 1, anchor: 'middle', bold: 1 });
      s += `<path d="M20 172h76m-76-4v8m76-8v8" fill="none" stroke="${INK}" stroke-width="1"/>` + text(58, 170, '220', 11, INK, { mono: 1, anchor: 'middle', bold: 1 }).replace('y="170"', 'y="168"');
      return s;
    },
    // 04-2：React 和 Vue 两个后台页面，选中的菜单和勾选的行一样（换组件库、换框架，状态还在）
    '04-2': () => {
      const page = (x, label) => {
        let s = text(x + 62, 30, label, 12, G5, { mono: 1, anchor: 'middle' }) + rect(x, 40, 124, 112, 7, '#fff', G3);
        s += `<line x1="${x}" y1="56" x2="${x + 124}" y2="56" stroke="${G3}"/><line x1="${x + 32}" y1="56" x2="${x + 32}" y2="152" stroke="${G3}"/>`;
        s += rect(x + 7, 45, 18, 6, 3, INK) + `<circle cx="${x + 114}" cy="48" r="3.5" fill="${G3}"/>`;
        [0, 1, 2, 3].forEach((i) => (s += i === 1 ? rect(x + 4, 63 + i * 14, 24, 10, 3, SEL) + bar(x + 8, 65.5 + i * 14, 14, INK) : bar(x + 8, 65.5 + i * 14, 14, G3)));
        s += bar(x + 40, 64, 30, G2, 8) + bar(x + 74, 64, 18, G2, 8) + rect(x + 98, 64, 18, 8, 2.5, INK);
        [0, 1, 2, 3, 4].forEach((i) => {
          const y = 82 + i * 13;
          if (i === 2) s += rect(x + 36, y - 3, 84, 12, 2, SEL);
          s += rect(x + 40, y, 6, 6, 1.5, i === 2 ? INK : '#fff', i === 2 ? null : G4) + bar(x + 52, y + 0.5, 34, i === 2 ? G6 : G3) + bar(x + 92, y + 0.5, 20, G3);
        });
        return s;
      };
      return page(20, 'React') + page(176, 'Vue') + `<path d="M150 88h20m-5-4 5 4-5 4M170 106h-20m5-4-5 4 5 4" fill="none" stroke="${G4}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    // 05：五个组件库逐项量，一样的打勾
    '05': () => {
      let s = '';
      const xs = [104, 146, 188, 230, 272];
      xs.forEach((x) => (s += login(x - 18, 18, 36, 20, INK, G3)));
      ['颜色', '尺寸', '交互', '阴影'].forEach((n, r) => {
        const y = 62 + r * 30;
        s += text(26, y + 4.5, n, 13, G6) + `<line x1="20" y1="${y - 15}" x2="300" y2="${y - 15}" stroke="${G2}"/>`;
        xs.forEach((x) => (s += check(x, y)));
      });
      return s;
    },
    // 06：说明文件交给 AI，接一个新组件库，检查全部通过
    '06': () => {
      let s = rect(36, 46, 92, 112, 8, '#fff', G3) + rect(30, 40, 92, 112, 8, '#fff', G3) + rect(24, 34, 92, 112, 8, '#fff', INK, 1.5);
      s += text(36, 56, 'AGENTS.md', 12, INK, { mono: 1, bold: 1 });
      [60, 48, 56, 36, 52].forEach((w, i) => (s += bar(36, 68 + i * 13, w)));
      s += `<path d="M130 90h20m-6-5 6 5-6 5" fill="none" stroke="${G4}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += rect(160, 30, 140, 64, 14, '#fff', G3) + text(174, 54, '接入一个新组件库', 13, INK) + `<circle cx="282" cy="78" r="9" fill="${INK}"/><path d="M282 82.5v-9m-3.5 3.5 3.5-3.5 3.5 3.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      [0, 1, 2, 3, 4, 5].forEach((i) => (s += i === 5 ? `<circle cx="${172 + i * 23}" cy="128" r="9" fill="#fff" stroke="${INK}" stroke-width="1.6"/><path d="M${168 + i * 23} 128.2l2.8 2.8 5-5.6" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : check(172 + i * 23, 128)));
      return s;
    },
  };

  const svg = (k) => {
    const d = DRAW[k];
    return d ? `<svg class="thumb" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${d()}</svg>` : '';
  };
  window.MH_THUMB = svg;
  document.querySelectorAll('[data-thumb]').forEach((el) => (el.innerHTML = svg(el.dataset.thumb)));
})();
