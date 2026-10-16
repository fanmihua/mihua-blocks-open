---
id: mono
name: Mihua 黑白
revision: 1
description: 黑白中性色，只保留状态色。颜色交给你的品牌规范。
---

# Mihua 黑白

这是一份设计规范（Design.md）。人读正文，机器只读下面 `mihua-tokens` 代码块里的「角色: 取值」。

**改一个数，五个组件库一起变。** 比如把 `size.control` 从 32px 改成 36px：它先变成 CSS 变量 `--mh-size-control`，再算进控件规格（`spec/src/controls.ts`），按钮、输入框、选择框、分页的方块、日期框在 Ant Design、Arco Design、shadcn/ui、Element Plus、TDesign 里一起变高——每个套件读的是同一个数。

每个角色是什么意思、能填什么，见 `spec/src/roles.ts`。

黑白规范是所有角色的默认值本身（`spec/src/builtin.ts` 里它一个值都没写）；这里为了从头读一遍，把每个角色都写了出来。

```mihua-tokens
# 操作
action.primary: #0A0A0A
action.primaryHover: #333333
action.onPrimary: #FFFFFF

# 文字
text.strong: #0A0A0A
text.body: #262626
text.secondary: #737373
text.placeholder: #A3A3A3
text.disabled: #C4C4C4
text.link: #0A0A0A

# 表面
surface.canvas: #F5F5F5
surface.base: #FFFFFF
surface.subtle: #F5F5F5
surface.hover: #F0F0F0
surface.selected: #EBEBEB

# 边框
border.default: #E5E5E5
border.control: #D4D4D4

# 反馈
feedback.danger: #DC2626
feedback.success: #16A34A
feedback.warning: #D97706

# 形状
radius.control: 6px
radius.panel: 12px

# 尺寸
size.control: 32px
size.controlLarge: 40px
space.field: 16px
space.panel: 32px

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
