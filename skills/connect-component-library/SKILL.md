---
name: connect-component-library
description: 把一个新的组件库（比如 Naive UI、MUI、Vuetify、TDesign React）接进 Mihua Blocks：写套件、组件库档案、部件地图、适配记录，跑自动检查直到和已有的组件库量出来一样。Use when the user asks to add / connect / support a new UI component library in this repo.
---

# 接一个新组件库

照 `docs/接入一个新组件库.md` 一步一步做（那份是唯一的说明，这里只列要点）。先读 `AGENTS.md`。

1. **确认现在是好的**：新 worktree 先 `npm ci`，`npm run check` 全过（约 17 分钟，可以放后台），记下开始时间。
2. **调研**：装上组件库，读它的渲染代码，填组件库档案（`LibraryProfile`）：样式怎么写、主题从哪进、尺寸体系、图标、无障碍缺口（有没有 role、能不能 Tab）、样式是不是 JS 插进页面的。
3. **建套件**：`react/src/kits/<库>/` 或 `vue/src/kits/<库>/`，实现套件接口里的每个控件（`react/src/kit/types.ts`、`vue/src/kit/types.ts`）；还没做的先放 `pendingControl` 占位。
4. **先接上、不对齐**：Provider 只做「只设主题」；接上以后提交一次，跑第一次检查 `npm run audit:kits -- --kits=shadcn,<库>`，记下「几项里几项不一样、一共多少处」。
5. **部件地图**：每个部件写「看得见的那个框」的选择器。
6. **逐个控件对齐**：手段从省事到费事——全局主题变量 → 组件主题变量 → 属性 → 换类名 → 样式覆盖（只在对齐档）→ 补交互（只在对齐档）。接口约定（受控、挂载点、页面给的名字、点遮罩不关……）三档都成立。
7. **适配记录**：每处差异一条，写原生实测的数字（`--mode=native` 只量不比）。
8. **修到全部通过**：`npm run check` 全过。

**规则**
- 检查工具不认识任何组件库：量法有问题只能改成对所有组件库成立的通用规则。
- 碰到设计层的分歧（这个库的做法也有道理）不能悄悄定：记进 `docs/取舍记录.md`，标「待人决定」，最后列给人。
- 不推送、不发布。

**做完的标志**：`npm run check` 全过；档案、部件地图、适配记录齐全；把「第一次检查的数字」「卡住的地方」「待人决定」报告给人。
