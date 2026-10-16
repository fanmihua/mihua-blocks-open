/*
 * 「先认识这个仓库」：仓库里每个文件是干什么的。
 * 文件清单和行数来自 assets/data/repo.js（_tools/data.mjs 从 git ls-files 生成）；说明是人写的，写在下面。
 * 清单里有、下面没写说明的文件，页面上会标「（还没写说明）」，方便发现漏了谁。
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const R = window.MH_REPO;
  if (!R) return;
  const LINES = new Map(R.files);

  // 文件 → [是干什么的, 哪一篇讲到]
  const D = {
    'README.md': ['仓库的说明：这是什么、怎么跑起来、怎么让 AI 接你自己的组件库、在代码里怎么用、做到哪', '00'],
    'AGENTS.md': ['写给 AI 的说明：要做的事指到哪份做法说明、目录、规则、怎么检查。所有 AI 编程工具共用这一份', '06'],
    'CLAUDE.md': ['给 Claude Code 的入口，内容就是引用 AGENTS.md', '06'],
    '.claude/skills': ['指向 skills/ 的链接，Claude Code 从这里找到四个 Skill', '06'],
    'LICENSE': ['源码的许可：Apache-2.0', ''],
    'NOTICE': ['版权声明', ''],
    'THIRD_PARTY_NOTICES.md': ['用到的组件库、图标、依赖，各自是什么许可', ''],
    'package.json': ['工作区和常用命令：dev、build、typecheck、test、audit:kits、check', '00'],
    'tsconfig.json': ['TypeScript 的设置', ''],
    'tsconfig.base.json': ['TypeScript 的共用设置', ''],
    'vitest.config.ts': ['测试的设置', ''],
    'vitest.setup.ts': ['测试环境里补上几个浏览器接口', ''],
    '.prettierrc.json': ['代码格式的设置', ''],
    '.prettierignore': ['哪些文件不排格式', ''],
    '.gitignore': ['不进仓库的东西：依赖、编译结果、检查报告', ''],

    'designs/mono/Design.md': ['黑白规范：所有角色的默认值，每一项都写出来了。改这里的数，演示页和检查都跟着变', '02-1'],
    'designs/blue/Design.md': ['蓝色规范：蓝色主色、偏冷的中性色', '02-1'],
    'designs/stress/Design.md': ['压力测试：把取值推到边上（控件 34 / 46、直角、15px 字、换一套图标），看对齐是不是真的跟着规范走', '02-1'],

    'spec/package.json': ['规范层这个包（@mihua/spec）的说明', ''],
    'spec/src/roles.ts': ['语义角色：主操作、正文、选中面、控件高度……每个角色是什么意思、能填多少、默认值', '02-1'],
    'spec/src/spec.ts': ['规范就是一组「角色 → 取值」：校验、补上默认值、算成页面上的 CSS 变量', '02-1'],
    'spec/src/markdown.ts': ['读写 Design.md：正文随便写，机器只读 mihua-tokens 那一块', '02-1'],
    'spec/src/builtin.ts': ['内置的黑白、蓝色规范，就是从 designs/ 里读出来的', '02-1'],
    'spec/src/color.ts': ['颜色换算：按比例混白混黑、换成 R,G,B 三个数、算对比度', '02-1'],
    'spec/src/controls.ts': ['控件规格：接上规范以后，所有组件库要对齐到的同一份控件设计。按钮多高、开关多大、聚焦外圈多粗都在这里', '03-1'],
    'spec/src/adaptation.ts': ['适配记录和组件库档案的格式：差异分哪几类、对齐用了哪种手段', '附录'],
    'spec/src/parts.ts': ['部件名：自动检查要量「用户看得见的那个框」，每个部件叫什么', '05'],
    'spec/src/icons.ts': ['语义图标（26 个）和两套图标集：Lucide、Mihua 自绘', '02-3'],
    'spec/src/items.ts': ['几种控件的数据长什么样：选项、菜单项、表格的列，React 和 Vue 共用', ''],
    'spec/src/mapping.ts': ['记下每个主题变量的值是从哪个角色来的', ''],
    'spec/src/index.ts': ['规范层对外的出口', ''],
    'spec/src/spec.test.ts': ['测试：规范校验、正文对底色的对比度', '02-1'],
    'spec/src/design-files.test.ts': ['测试：三份 Design.md 都能读出来', ''],

    'core/package.json': ['骨架这个包（@mihua/core）的说明', ''],
    'core/src/index.ts': ['骨架对外的出口', ''],
    'core/src/shared/config.ts': ['配置字段的描述：配置面板、说明、给 AI 的上下文都从它生成', ''],
    'core/src/shared/contract.ts': ['控件角色：视图只说「这里要一个主按钮」，由套件决定用哪个组件库的组件', '01'],
    'core/src/login/types.ts': ['登录框的类型，和你的业务系统要实现的那几个函数', ''],
    'core/src/login/variants.ts': ['登录框的五种布局：居中、双栏、分步、第三方优先、扫码优先', ''],
    'core/src/login/config.ts': ['登录框的配置：校验、补默认值，写错直接报错', ''],
    'core/src/login/controller.ts': ['登录的状态控制器：登录方式、输入、校验、验证码倒计时、提交。React、Vue 共用', '01'],
    'core/src/login/contract.ts': ['登录组件的契约：任务、分区、状态', ''],
    'core/src/login/messages.ts': ['登录框的中英文案', ''],
    'core/src/login/demo.ts': ['演示用的假后端：只在内存里模拟，不发短信、不连任何服务', ''],
    'core/src/login/validation.ts': ['手机号、验证码这些怎么校验', ''],
    'core/src/login/index.ts': ['登录框对外的出口', ''],
    'core/src/login/controller.test.ts': ['测试：校验、请求取消、计时器、暂停和恢复', ''],
    'core/src/admin/frame.ts': ['后台页面框架的结构：有哪些区域、导航项、文案', '04'],
    'core/src/admin/controller.ts': ['后台页面框架的业务状态：侧栏收没收起、选中哪一项、哪些子菜单展开', '01'],
    'core/src/admin/index.ts': ['后台页面框架对外的出口', ''],
    'core/src/customers/list.ts': ['客户列表的结构：筛选栏、表格的列、对话框的表单、文案', '04'],
    'core/src/customers/controller.ts': ['客户列表的业务状态：筛选、排序、页码、勾选的行、对话框里填了什么', '01'],
    'core/src/customers/data.ts': ['客户列表的演示数据：50 位客户，每次生成的都一样', ''],
    'core/src/customers/index.ts': ['客户列表对外的出口', ''],
    'core/styles/root.css': ['共用的根样式，和接上规范时五个套件共用的密码显隐按钮', '02-3'],
    'core/styles/login.css': ['登录框的布局。React、Vue 共用这一份', '04'],
    'core/styles/admin.css': ['后台页面框架的布局：顶栏多高、侧栏多宽、收起多宽。React、Vue 共用这一份', '04'],
    'core/styles/customers.css': ['客户列表的布局：区块怎么排、间距多少。React、Vue 共用这一份', '04'],

    'react/package.json': ['React 这一侧的包（@mihua/react），组件库是可选依赖', ''],
    'react/src/index.ts': ['React 这一侧对外的出口', ''],
    'react/src/MihuaProvider.tsx': ['三件事在这里汇合：规范变成 CSS 变量；规范交给套件变成组件库的主题；语言和弹层挂在哪', '01'],
    'react/src/context.tsx': ['上下文：当前的套件、语言、弹层挂载点、图标集', ''],
    'react/src/icon.tsx': ['语义图标：只说要哪个，画成哪一套由规范决定', '02-3'],
    'react/src/kit/types.ts': ['套件接口：一个组件库要提供哪些控件，每个控件的属性、状态归谁', '03-1'],
    'react/src/kit/PasswordToggle.tsx': ['统一的密码显隐按钮：接上规范时 Ant Design、Arco、shadcn/ui 都用它', '02-3'],
    'react/src/kit/pending.tsx': ['还没做的控件先放一个占位', ''],
    'react/src/kit/useFocusOnOpen.ts': ['对话框打开时，把焦点放进第一个能输入的框', ''],
    'react/src/kits/antd/index.tsx': ['Ant Design 的套件：主题怎么给、每个控件怎么翻译，还有它的组件库档案和适配记录', '02-1'],
    'react/src/kits/antd/styles.css': ['Ant Design 套件里主题改不到的那几处样式', '02-3'],
    'react/src/kits/arco/index.tsx': ['Arco Design 的套件，含组件库档案和适配记录', '02-1'],
    'react/src/kits/arco/styles.css': ['Arco 套件的样式覆盖（只在对齐那一档生效）', '03-1'],
    'react/src/kits/arco/index.test.tsx': ['测试：Arco 套件', ''],
    'react/src/kits/shadcn/index.tsx': ['shadcn/ui 的套件：源码在手里，直接换类名；含组件库档案和适配记录', '02-1'],
    'react/src/kits/shadcn/styles.css': ['shadcn/ui 套件的样式：让 Tailwind 扫描套件里的类名、把颜色变量接到 Tailwind 主题', ''],
    'react/src/kits/hooks.test.tsx': ['测试：切换外观时 Hook 的调用顺序不能变', '06'],
    'react/src/blocks/login/Login.tsx': ['登录框的 React 视图：用部件拼出来，控件都从套件拿', ''],
    'react/src/blocks/login/parts.tsx': ['登录框的各个部件：头部、登录方式、输入、协议……', ''],
    'react/src/blocks/login/icons.tsx': ['登录框里第三方登录的标识', ''],
    'react/src/blocks/login/useLogin.ts': ['React 订阅登录控制器', ''],
    'react/src/blocks/login/Login.test.tsx': ['测试：登录流程', ''],
    'react/src/blocks/admin/AdminFrame.tsx': ['后台页面框架的 React 视图', '04'],
    'react/src/blocks/customers/CustomerList.tsx': ['客户列表的 React 视图：筛选栏、表格、分页、对话框', '04'],

    'vue/package.json': ['Vue 这一侧的包（@mihua/vue），组件库是可选依赖', ''],
    'vue/tsconfig.json': ['Vue 的 TypeScript 设置', ''],
    'vue/src/index.ts': ['Vue 这一侧对外的出口', ''],
    'vue/src/MihuaProvider.ts': ['和 React 版一样的三件事：规范变成 CSS 变量、交给套件、语言和弹层', '01'],
    'vue/src/context.ts': ['上下文：当前的套件、语言、弹层挂载点、图标集', ''],
    'vue/src/icon.ts': ['语义图标（和 React 版用同一份图形）', '02-3'],
    'vue/src/kit/types.ts': ['Vue 版套件接口，和 React 版一一对应', '03-1'],
    'vue/src/kit/pending.ts': ['还没做的控件先放一个占位', ''],
    'vue/src/kits/element/index.ts': ['Element Plus 的套件，含组件库档案和适配记录', '02-1'],
    'vue/src/kits/element/styles.css': ['Element Plus 套件的样式覆盖（只在对齐那一档生效）', '02-2'],
    'vue/src/kits/element/index.test.ts': ['测试：Element Plus 套件', ''],
    'vue/src/kits/tdesign/index.ts': ['TDesign 的套件，含组件库档案和适配记录；要补的地方最多', '02-1'],
    'vue/src/kits/tdesign/styles.css': ['TDesign 套件的样式覆盖（只在对齐那一档生效）', '03-1'],
    'vue/src/blocks/admin/AdminFrame.vue': ['后台页面框架的 Vue 视图', '04'],
    'vue/src/blocks/customers/CustomerList.vue': ['客户列表的 Vue 视图', '04'],
    'vue/src/blocks/customers/CustomerDialog.vue': ['客户列表里编辑客户的对话框', '04'],
    'vue/src/blocks/customers/FormField.vue': ['对话框里的一个表单字段', ''],
    'vue/src/blocks/login/Login.vue': ['登录框的 Vue 视图：用部件拼出来，控件都从套件拿', ''],
    'vue/src/blocks/login/useLogin.ts': ['Vue 订阅登录控制器', ''],
    'vue/src/blocks/login/Login.test.ts': ['测试：登录流程', ''],

    'audit/README.md': ['自动检查的说明：量什么、量法的规则、不量什么（已知的盲区）', '05'],
    'audit/package.json': ['检查工具这个包的说明', ''],
    'audit/run.mjs': ['检查的主程序：起页面、开 Chrome、逐个场景逐项检查、写报告', '05'],
    'audit/lib/chrome.mjs': ['一个最小的 Chrome 遥控器：打开页面、真实的鼠标和按键', '05'],
    'audit/lib/compare.mjs': ['对比规则（数字允许 0.6px 误差）和报告里的中文路径', '05'],
    'audit/page/harness.ts': ['检查页这一侧：把量取的函数挂到页面上，给检查工具调用', '05'],
    'audit/page/measure.ts': ['量取：只量用户看得到的东西，文字、框、图标的位置、大小、颜色', '05'],
    'audit/page/types.ts': ['检查工具和检查页之间的约定：组件库、目标、检查项、场景', '05'],

    'examples/package.json': ['演示页这个包的说明', ''],
    'examples/index.html': ['演示页：五个组件库并排，能切场景、组件库、外观、规范', '01'],
    'examples/audit.html': ['检查页：五个组件库并排渲染同一个场景、同一个状态，自动检查打开它来量', '05'],
    'examples/vite.config.ts': ['演示页的构建设置：React、Vue 两个插件并存', '02-1'],
    'examples/src/kits.ts': ['组件库登记表：演示页、检查页、自动检查都按它决定有哪些组件库。接新库就在这里加一行', '06'],
    'examples/src/kits.css': ['组件库样式表的登记：每个库自带的全局样式放进单独的层，改不到页面和套件', '02-1'],
    'examples/src/specs.ts': ['演示页和检查用的三套规范，从 designs/ 读出来', ''],
    'examples/src/KitView.tsx': ['用一个组件库渲染一格；三档外观就在这里切', '01'],
    'examples/src/VueHost.tsx': ['在 React 写的页面里挂一个 Vue 应用', ''],
    'examples/src/vue-shim.d.ts': ['让 TypeScript 认识 .vue 文件', ''],
    'examples/src/demo/main.tsx': ['演示页的主程序：工具条、并排的格子、切换时保留状态', '01'],
    'examples/src/demo/demo.css': ['演示页自己的样式：工具条和格子', ''],
    'examples/src/audit/main.tsx': ['检查页的主程序：按网址参数决定场景和组合', '05'],
    'examples/src/audit/audit.css': ['检查页的样式', ''],
    'examples/src/scenes/index.ts': ['场景登记表：登录框、控件样张、后台页面框架、客户列表', ''],
    'examples/src/scenes/types.ts': ['场景的格式：渲染什么、有哪些状态、每个状态查什么', '05'],
    'examples/src/scenes/login.tsx': ['场景：登录框，五种布局 × 各种状态', ''],
    'examples/src/scenes/controls/index.tsx': ['场景：控件样张，每种基础控件默认和大号两档各摆一行', '02-2'],
    'examples/src/scenes/controls/ControlsView.tsx': ['控件样张的 React 版', ''],
    'examples/src/scenes/controls/ControlsViewVue.ts': ['控件样张的 Vue 版', ''],
    'examples/src/scenes/controls/state.ts': ['控件样张的状态', ''],
    'examples/src/scenes/controls/controls.css': ['控件样张的布局', ''],
    'examples/src/scenes/admin/index.tsx': ['场景：后台页面框架，侧栏展开 / 收起', '04'],
    'examples/src/scenes/admin/admin.css': ['后台页面框架场景的样式', ''],
    'examples/src/scenes/customers/index.tsx': ['场景：客户列表，勾选、排序、加载、空、出错、对话框……各种状态', ''],
    'examples/src/scenes/customers/customers.css': ['客户列表场景的样式', ''],
    'examples/src/KitView.test.tsx': ['测试：换场景时格子跟着换', ''],
    'examples/src/structure.test.tsx': ['测试：React、Vue 两份页面结构一样', '05'],
    'examples/src/shell-styles.test.ts': ['测试：演示页的外壳样式不碰组件', ''],

    'docs/architecture.md': ['架构：五层、四层在仓库里的位置、七条原则、怎么新增组件 / 组件库 / 规范 / 图标', '01'],
    'docs/接入一个新组件库.md': ['做法说明：接一个新组件库，第 0 步到第 10 步，每一步做什么、改哪个文件、怎么算做完', '06'],
    'docs/给套件加一个新控件.md': ['做法说明：给套件加一个新控件，七步', '06'],
    'docs/只借方法.md': ['做法说明：已有项目不换结构，只借规格、样式覆盖和检查', '06'],
    'docs/取舍记录.md': ['几个组件库做法不一样、要人来定统一成什么的地方：判断顺序、四种情况、已定的每一条', '附录 C'],

    'skills/connect-component-library/SKILL.md': ['Skill：接一个新组件库（内容指向 docs/ 里那份说明）', '06'],
    'skills/add-kit-control/SKILL.md': ['Skill：给套件加一个新控件', '06'],
    'skills/borrow-the-method/SKILL.md': ['Skill：只借方法', '06'],
    'skills/record-tradeoff/SKILL.md': ['Skill：记一条取舍', '06'],
  };
  const ART = { '00': '00-repo.html', '01': '01-switch.html', '02-1': '02-visual.html', '02-2': '02-size.html', '02-3': '02-icons.html', '03-1': '03-controls.html', '03-2': '03-nav.html', '03-3': '03-display.html', '04': '04-structure.html', '05': '05-audit.html', '06': '06-ai.html', 附录: 'a1-libraries.html', '附录 C': 'a3-tradeoffs.html' };
  const desc = (f) => {
    if (D[f]) return D[f];
    if (f.startsWith('licenses/')) return ['许可证原文：' + f.slice(9).replace('.txt', ''), ''];
    if (/^vue\/src\/blocks\/login\//.test(f)) return ['登录框的一个 Vue 部件', ''];
    return ['（还没写说明）', ''];
  };
  const ref = (a) => (a && ART[a] ? `<a href="${ART[a]}">${a.startsWith('附录') ? a : '第 ' + a + ' 篇'}</a>` : '');

  // ── 每个目录一张表：<div class="ftable" data-dir="spec/"></div>
  $$('.ftable[data-dir]').forEach((box) => {
    const dir = box.dataset.dir;
    const only = (box.dataset.only || '').split(',').filter(Boolean);
    const rows = R.files.filter(([f]) => (dir === '.' ? !f.includes('/') || f.startsWith('.claude/') : f.startsWith(dir)) && (!only.length || only.some((o) => f.startsWith(o))));
    const hideTests = box.dataset.tests === 'hide';
    const list = rows.filter(([f]) => !(hideTests && /\.test\./.test(f)));
    // data-cols="220,,64,104"：给定列宽（同一节里几张表上下对齐）；手机上排成一条一条时不起作用
    const cols = (box.dataset.cols || '').split(',');
    const cg = cols.length > 1 ? `<colgroup>${cols.map((w) => `<col${w ? ` style="width:${w}px"` : ''}>`).join('')}</colgroup>` : '';
    box.innerHTML = `<div class="tbl-wrap"><table class="tbl ft"${cg ? ' style="table-layout:fixed"' : ''}>${cg}<tr><th>文件</th><th>是干什么的</th><th class="n">行数</th><th>哪一篇讲到</th></tr>${list
      .map(([f, n]) => { const [d, a] = desc(f); return `<tr><td class="f">${f.slice(dir === '.' ? 0 : dir.length)}</td><td>${d}</td><td class="n">${n || ''}</td><td>${ref(a)}</td></tr>`; })
      .join('')}</table></div>`;
  });

  // ── 目录总览：点一个目录看它里面有什么
  const tree = $('#tree');
  if (tree) {
    const TOP = [
      ['designs/', '规范', 'Design.md：品牌的取值，规范的源头'],
      ['spec/', '规范层', '语义角色、控件规格、图标集、档案和适配记录的格式'],
      ['core/', '骨架', '业务状态和布局，React、Vue 共用一份'],
      ['react/', 'React', '套件接口、三个 React 组件库的套件、视图'],
      ['vue/', 'Vue', '套件接口、两个 Vue 组件库的套件、视图'],
      ['audit/', '自动检查', '量看得见的东西，五个库逐项对比'],
      ['examples/', '演示页和检查页', '组件库登记表、检查场景'],
      ['docs/', '做法说明', '架构、三份做法说明、取舍记录'],
      ['skills/', '给 AI 的 Skill', '内容都指向 docs/'],
      ['.', '根目录', 'README、AGENTS.md、许可、命令'],
      ['licenses/', '许可原文', '组件库和图标各自的许可'],
    ];
    // 根目录连 .claude/ 一起算（和 0.16 那张表一样），各项加起来就是全部文件
    const inDir = (f, d) => (d === '.' ? !f.includes('/') || f.startsWith('.claude/') : f.startsWith(d));
    const sec = (d) => (d === '.' || d === 'licenses/' ? 'r-root' : 'r-' + d.replace('/', ''));
    const count = (d) => R.files.filter(([f]) => inDir(f, d)).length;
    tree.innerHTML = `<div class="tree-l">${TOP.map(([d, n, s]) => `<button data-d="${d}"><b>${d === '.' ? '（根目录）' : d}</b><span><i>${n} · </i>${count(d)} 个文件</span><small>${s}</small></button>`).join('')}</div><div class="tree-r" id="tree-r"></div>`;
    const show = (d) => {
      $$('button', tree).forEach((b) => b.classList.toggle('on', b.dataset.d === d));
      const rows = R.files.filter(([f]) => inDir(f, d) && !/\.test\./.test(f));
      $('#tree-r').innerHTML = `<div class="tr-h"><b>${d === '.' ? '根目录' : d}</b><a href="#${sec(d)}">看这一节 ↓</a></div>${rows.slice(0, 40).map(([f, n]) => `<div class="tr-f"><code>${(d === '.' ? f : f.slice(d.length)).replace(/\//g, '/<wbr>')}</code><span>${desc(f)[0]}</span></div>`).join('')}${rows.length > 40 ? `<div class="tr-f"><span>…还有 ${rows.length - 40} 个</span></div>` : ''}`;
    };
    $$('button', tree).forEach((b) => b.addEventListener('click', () => show(b.dataset.d)));
    show('designs/');
  }
  // ── 文件清单收在折叠里：标题上写几个文件
  const inDir2 = (f, d) => (d === '.' ? !f.includes('/') || f.startsWith('.claude/') : f.startsWith(d));
  $$('[data-cnt]').forEach((el) => { el.textContent = ` · ${R.files.filter(([f]) => inDir2(f, el.dataset.cnt)).length} 个文件，点开看`; });

  // ── spec/：两套图标集各画几个
  $$('.ico-row[data-set]').forEach((el) => { el.innerHTML = ['chevron-down', 'check', 'eye', 'calendar', 'bell', 'x'].map((n) => (window.mhIcon ? window.mhIcon(n, el.dataset.set, 22) : '')).join(''); });

  // ── react/、vue/：几个组件库的登录框，原生 / 对齐切换
  $$('.kitrow-seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    $$('button', seg).forEach((x) => x.classList.toggle('on', x === b));
    $$('img[data-a]', seg.closest('figure')).forEach((im) => (im.src = im.dataset[b.dataset.v]));
  }));

  // ── docs/：三份做法说明，每份几步（读 docs/ 里的小标题）
  const ds = $('#dsteps'), DOCS = window.MH_DOCS;
  if (ds && DOCS) ds.innerHTML = [['connect', '接一个新组件库'], ['control', '给套件加一个新控件'], ['borrow', '只借方法']].map(([k, t]) => DOCS[k] && `<div class="dsd"><div class="dsd-h"><i></i><b>${t}</b><code>${DOCS[k].file.replace('docs/', '')}</code></div><ol>${DOCS[k].steps.map((x) => `<li${/检查|过眼/.test(x.title) ? ' class="ck"' : ''}><span>${x.no.replace('第 ', '').replace(' 步', '')}</span>${x.title}</li>`).join('')}</ol></div>`).join('');

  // ── 根目录：像文件夹窗口那样摆一遍
  const fg = $('#fgrid');
  if (fg) {
    const dirs = [...new Set(R.files.filter(([f]) => f.includes('/') && !f.startsWith('.claude/')).map(([f]) => f.split('/')[0]))];
    const files = R.files.filter(([f]) => !f.includes('/')).map(([f]) => f);
    const KEY = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'LICENSE'];
    fg.innerHTML = dirs.map((d) => `<a class="fi d" href="#${d === 'licenses' ? 'r-root' : 'r-' + d}"><i></i><span>${d}</span></a>`).join('') + files.map((f) => `<span class="fi f${KEY.includes(f) ? ' key' : ''}"><i></i><span>${f}</span></span>`).join('');
  }

  const gen = $('#repo-gen');
  if (gen) gen.textContent = `${R.files.length} 个文件，${R.generated} 从 git 列出来的`;

  // ── 三档外观：真组件切换
  if (window.MH && window.MH.seg) window.MH.seg('looks', (v) => window.MH.live('#looks-live').reload(`scene=login&spec=mono&variant=centered&state=initial&mode=${v}`));

  // ── 0.18 改一个数：32 / 36（截图是把 Design.md 临时改成 36 以后截的，见 02 篇 2.1）
  window.MH && MH.seg('h36b', (v) => {
    $$('img[data-h36b]').forEach((im) => (im.src = `assets/img/02-controls-mono-aligned${v === '36' ? '-36' : ''}-${im.dataset.h36b}.png`));
    $$('#s18 .code .l').forEach((l) => { if ($('.ln', l)?.textContent === '53') $('.tx', l).textContent = `size.control: ${v}px${v === '36' ? '    ← 改成 36' : ''}`; });
  });
})();
