---
name: borrow-the-method
description: 已有项目（比如一个用 Ant Design 写好的后台）不换结构，只借 Mihua Blocks 的方法让它和设计稿 Design.md 对上：规范变成 CSS 变量、主题接口、样式覆盖文件、检查。Use when the user wants to align an existing app with a Design.md without adopting this repo's views or kits.
---

# 只借方法

照 `docs/只借方法.md` 做（那份是唯一的说明）。要点：

1. 用 `@mihua/spec` 把 Design.md 算成 `--mh-*`（语义角色）和 `--mh-c-*`（控件规格）变量，写到页面根上。
2. 组件库主题接口能管的交给主题接口（照对应套件的 Provider 抄）。
3. 主题改不到的写进一个样式覆盖文件（照对应套件的 `styles.css` 抄用到的几节，作用域换成项目的根类；取值读变量，不用 `!important`）；键盘、读屏缺的照套件补。
4. 检查：轻量的「对照规格里的数」（一段在页面里跑的对照代码）；要完整检查就把最在意的一块搬进这个仓库的检查页，和 shadcn 参照并排比。

只改用户项目里的样式和包组件库的那一层，不动页面结构、状态管理、路由。
