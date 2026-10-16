---
id: blue
name: 蓝色
revision: 1
description: 蓝色主色、偏冷的中性色、6px 控件圆角。
---

# 蓝色

这是一份设计规范（Design.md）。人读正文，机器只读下面 `mihua-tokens` 代码块里的「角色: 取值」。

**改一个数，五个组件库一起变。** 比如把 `size.control` 从 32px 改成 36px：它先变成 CSS 变量 `--mh-size-control`，再算进控件规格（`spec/src/controls.ts`），按钮、输入框、选择框、分页的方块、日期框在 Ant Design、Arco Design、shadcn/ui、Element Plus、TDesign 里一起变高——每个套件读的是同一个数。

每个角色是什么意思、能填什么，见 `spec/src/roles.ts`。

蓝色规范只改了和黑白不一样的那些（主色、文字、表面、边框的颜色，反馈色，面板留白）；这里为了从头读一遍，把每个角色都写了出来，没改的就是黑白的默认值。

```mihua-tokens
# 操作
action.primary: #3370FF
action.primaryHover: #4E83FD
action.onPrimary: #FFFFFF

# 文字
text.strong: #1F2329
text.body: #1F2329
text.secondary: #646A73
text.placeholder: #8F959E
text.disabled: #BBBFC4
text.link: #245BDB

# 表面
surface.canvas: #F5F6F7
surface.base: #FFFFFF
surface.subtle: #F5F6F7
surface.hover: #F2F3F5
surface.selected: #E1EAFF

# 边框
border.default: #DEE0E3
border.control: #D0D3D6

# 反馈
feedback.danger: #F54A45
feedback.success: #34C724
feedback.warning: #FF8800

# 形状
radius.control: 6px
radius.panel: 12px

# 尺寸
size.control: 32px
size.controlLarge: 40px
space.field: 16px
space.panel: 36px

# 字体
type.body: 14px
type.small: 12px
type.title: 22px
font.sans: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif

# 图标
icon.set: lucide
size.icon: 16px

# 动效
motion.duration: 150ms
```
