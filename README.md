# Mihua Blocks · 一份设计，适配不同组件库

> 网页文字版：[fanmihua.github.io/mihua-blocks-open](https://fanmihua.github.io/mihua-blocks-open/) · 在线演示页：[打开](https://fanmihua.github.io/mihua-blocks-open/demo/)。配合视频系列「组件库差异」看；完整版文字版和全部视频在课程「[给设计师的零基础 AI 课](https://fanstudio.cn/zh/courses/ai-for-designers?from=learning)」里。

设计规范只写一次（Design.md），每个组件库一个「套件」把它翻译成自己的组件。同一个登录框、同一个后台页面——顶栏、可收起的侧栏导航、面包屑，内容区是一个客户列表（筛选栏、数据表格、编辑对话框）——用 **Ant Design、Arco Design、shadcn/ui（React）和 Element Plus、TDesign（Vue）** 渲染，**量出来一样、用起来一样**：自动检查逐项证明这一点（299 项，五个组件库全部一致）。

这里开源的不是一个什么都有的组件库，而是**一套方法 + 能直接跑的范例**，让你用 AI 照着说明，把**你自己的组件库**接进来，或者让**你已有的项目**和设计稿对上。

## 跑起来

需要 Node.js 22 或 24 的长期支持版（22.22.2、24.15 以上），或者 26 及以后；自动检查需要本机装有 Chrome（或设置 `CHROME_PATH`）。用 Node 25 这类已经停止维护的单数版本，`npm ci` 会出 `EBADENGINE` 警告（本项目和测试工具间接用到的 `nopt`、`abbrev` 都不认这个版本），不影响运行，换成 24 就没有了。

```bash
npm ci
npm run dev     # 演示页 http://127.0.0.1:4182
npm run check   # 类型检查 + 测试 + 构建 + 自动检查（约 17 分钟）
```

演示页上可以切：**场景**（登录框、控件样张、后台页面框架、客户列表）、**组件库**、**外观**（组件库原生 / 只设主题 / 对齐到控件规格——三档对比「只把取值交给组件库为什么不够」）、**规范**（黑白、蓝色、压力测试）。在客户列表里筛选、排序、翻页、勾几行、打开对话框改到一半，再切组件库，状态都还在。

**改一个数试试**：打开 [`designs/mono/Design.md`](designs/mono/Design.md)，把 `size.control: 32px` 改成 `36px` 保存，演示页里五个组件库的按钮、输入框、选择框、分页、日期框一起变高。规范就是这几份文件（黑白、蓝色、压力测试），演示页和检查都从它们读。

只查一部分：`npm run audit:kits -- --scene=customers`；只比两个组件库：`--kits=shadcn,antd`；只量不比、看组件库原生的样子：`--mode=native`。

## 让 AI 接你自己的组件库

用 Claude Code、Cursor 或别的 AI 编程工具打开这个仓库，它会读 [`AGENTS.md`](AGENTS.md)（Claude Code 还会用到 [`skills/`](skills/) 里的 Skill）。然后直接说：

- 「照 `docs/接入一个新组件库.md`，把 Naive UI 接进来」——它会写套件、组件库档案、部件地图、适配记录，跑检查直到和已有的五个组件库量出来一样；
- 「照 `docs/给套件加一个新控件.md`，加一个抽屉」——控件规格、接口、参照实现、五个组件库各一份；
- 「照 `docs/只借方法.md`，让我这个 antd 后台和 Design.md 对上」——不换结构，只借规格、样式覆盖和检查。

做的过程中碰到「几个组件库做法各有道理、统一成什么要人来定」的地方，AI 会记进 [`docs/取舍记录.md`](docs/取舍记录.md)、标「待人决定」，最后列给你，而不是自己悄悄定。

## 这套方法由什么组成

| | 是什么 | 在哪 |
|---|---|---|
| 设计规范 | 一份 Design.md：品牌的取值（主色、圆角、控件高度……）。黑白、蓝色、压力测试三份，演示页和检查都从它们读 | `designs/` |
| 规范层 | 语义角色（主色、正文色、控件高度……）、控件规格（每种控件统一成什么样：多大、什么颜色、悬停和聚焦怎么变、键盘怎么用） | `spec/` |
| 套件接口 | 一个组件库要提供哪些控件、每个控件的属性和状态归谁 | `react/src/kit/types.ts`、`vue/src/kit/types.ts` |
| 套件 | 每个组件库一份：把控件翻译成这个组件库的组件，再对齐到控件规格 | `react/src/kits/*`、`vue/src/kits/*` |
| 组件库档案、适配记录 | 这个组件库是怎么写的；每处和统一设计不一样的地方，原来是多少、怎么对齐的 | 每个套件的 `profile`、`adaptations` |
| 业务状态 | 登录、后台框架、客户列表的状态控制器，React、Vue 共用一份 | `core/` |
| 自动检查 | 所有组件库并排渲染同一个场景，按区域、按部件量位置、文字、颜色、边线、圆角、图标，再用真实的鼠标键盘核对聚焦、悬停、弹层、Tab 顺序、按键、点击 | `audit/`、`examples/` |
| 做法说明 | 接一个新组件库、加一个新控件、只借方法；取舍记录 | `docs/` |

架构说明见 [`docs/architecture.md`](docs/architecture.md)（里面有「视觉、控件、结构、逻辑」四层在仓库里的位置）。从一份 Design.md 开始读：[`designs/mono/Design.md`](designs/mono/Design.md)。

## 在代码里用

包没有发布到 npm，在这个仓库里直接用（`@mihua/*` 是工作区里的包），或者把需要的目录拷进你的项目。

```tsx
import { createAdminController, createCustomerListController } from '@mihua/core';
import { AdminFrame, CustomerList, MihuaProvider } from '@mihua/react';
import { antdKit } from '@mihua/react/kits/antd';
import { blueSpec } from '@mihua/spec';

const list = createCustomerListController();
<MihuaProvider kit={antdKit} spec={blueSpec}>
  <AdminFrame
    controller={createAdminController()}
    onAction={(key) => key === 'create' && list.send({ type: 'edit', key: null })}
  >
    <CustomerList controller={list} />
  </AdminFrame>
</MihuaProvider>;
```

换 `kit` 就是换组件库，换 `spec` 就是换规范，把 `@mihua/react` 换成 `@mihua/vue` 就是换框架。登录框是 `<Login config={…} adapter={…} />`，用法一样。

页面布局（顶栏、侧栏、内容区怎么排）归结构层，在 `core/styles/`，不用组件库的 Layout：每个组件库的 Layout 默认尺寸都不一样，而页面怎么排是设计的决定。

## 做到哪、没做什么

- 控件：按钮、输入框、选择框、复选框、标签栏、开关、导航菜单、面包屑、下拉菜单、头像、徽标、表格、分页、标签、日期范围、对话框、单选、多行输入。
- 表格只做到列、勾选、排序、状态标签、操作列、分页、空状态、加载中；**固定列、虚拟滚动、展开行、拖拽、树形表格没有做**——要的话照 `docs/给套件加一个新控件.md` 自己加。
- 检查证明「几个组件库一样」，不证明「好看」；它说「全部一致」，只代表它量了的那些一致（盲区写在 [`audit/README.md`](audit/README.md)）。
- 还没有深色模式、窄屏的场景。
- 已知问题：`npm run dev` 打开演示页，浏览器控制台有 3 条红字「Accessing element.ref was removed in React 19」，切到 Arco 的客户列表再多 1 条。都出在 Arco Design 内部（选择框、标签栏、日期范围读了子元素的 `ref`），最新的 2.66.17 也还没改（[arco-design#2891](https://github.com/arco-design/arco-design/issues/2891)）。只在开发模式出现，`npm run build` 出来的页面没有，不影响使用。

## 目录

| 目录 | 内容 |
|---|---|
| `designs/` | 设计规范（Design.md）：黑白、蓝色、压力测试，是规范的源头 |
| `spec/` | 规范层：语义角色、内置规范、控件规格、适配记录和组件库档案、部件名、图标集 |
| `core/` | 与框架无关的逻辑和共用布局样式 |
| `react/` | React 套件接口和套件：Ant Design、Arco Design、shadcn/ui |
| `vue/` | Vue 套件接口和套件：Element Plus、TDesign |
| `audit/` | 自动检查（不认识任何组件库，接新组件库不用改它） |
| `examples/` | 演示页、检查页、组件库登记表、检查场景 |
| `docs/` | 架构、三份做法说明、取舍记录 |
| `skills/` | Claude Code 的 Skill |

## 许可

本项目的源码采用 Apache-2.0，见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。第三方组件库、图标和依赖保留各自的许可，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 `licenses/`。
