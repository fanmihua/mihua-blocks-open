---
name: add-kit-control
description: 给 Mihua Blocks 的套件加一个新控件（比如步骤条、抽屉、树、上传、固定列的表格），五个组件库都实现并对齐：控件规格、接口、部件、参照实现、每个库的套件、检查场景。Use when the user asks to add a new control / component to the kits, or to extend an existing one (e.g. fixed table columns).
---

# 给套件加一个新控件

照 `docs/给套件加一个新控件.md` 一步一步做（那份是唯一的说明，这里只列要点）。先读 `AGENTS.md`。

1. **控件规格**（`spec/src/controls.ts`）：写成看得见的数，写清楚「相对谁」；交互也是规格（状态归谁、键盘）。没有设计稿就参考现有项目，写明「第一版」，交给设计师在演示页里看。
2. **接口**（`react/src/kit/types.ts`、`vue/src/kit/types.ts`）：只放页面真正要用的属性；键盘和读屏的要求写进注释；数据形状放 `spec/src/items.ts`。
3. **部件名**（`spec/src/parts.ts`）：用户看得见的那个框，最好也是键盘聚焦的那个元素。
4. **先写参照实现**（shadcn，源码在自己手里），至少和另一个库比一次；还没轮到的库放 `pendingControl` 占位。
5. **每个库各实现一遍**：接上 → 提交 → 第一次检查记数字 → 对齐 → 适配记录。几个库可以同时做（各自一个 worktree，`--kits=shadcn,<库>` 一对一），共用文件只由一个人改。
6. **放进场景**（控件样张或页面场景），加检查项；有对话框这类模态弹层的场景要提供 `solo`。
7. `npm run check` 全过。

**规则**
- 参照实现也会错：检查证明的是「和参照一样」，要对照规格看。
- 接口约定三档都成立；补交互（角色、aria、键盘）只在对齐档；页面给的读屏名字三档都补。
- React Hook 无条件调用。
- 设计层的分歧不能悄悄定，记进 `docs/取舍记录.md`。

**做完的标志**：`npm run check` 全过；把用时、第一次检查的数字、卡点、待人决定报告给人，交给设计师在演示页（`npm run dev`）里看。
