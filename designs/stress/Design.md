---
id: stress
name: 压力测试
revision: 1
---

# 压力测试

这是一份设计规范（Design.md）。人读正文，机器只读下面 `mihua-tokens` 代码块里的「角色: 取值」。

这一份不是给页面用的，是给检查用的：把取值推到边上（主色换成青绿、控件 34 / 46 高、正文 15px、控件直角、换一套图标），看五个组件库的对齐是不是真的跟着规范走，而不是碰巧和默认值一样。改这里的数，演示页的「规范：压力测试」和自动检查都跟着变。

每个角色是什么意思、能填什么，见 `spec/src/roles.ts`；没改的就是黑白的默认值。

```mihua-tokens
# 操作
action.primary: #0F766E
action.primaryHover: #14968A
action.onPrimary: #FFFFFF

# 文字
text.strong: #0A0A0A
text.body: #262626
text.secondary: #737373
text.placeholder: #A3A3A3
text.disabled: #C4C4C4
text.link: #0F766E

# 表面
surface.canvas: #F5F5F5
surface.base: #FFFFFF
surface.subtle: #F5F5F5
surface.hover: #F0F0F0
surface.selected: #DDF3EF

# 边框
border.default: #E5E5E5
border.control: #9AA4AE

# 反馈
feedback.danger: #DC2626
feedback.success: #16A34A
feedback.warning: #D97706

# 形状
radius.control: 0px
radius.panel: 12px

# 尺寸
size.control: 34px
size.controlLarge: 46px
space.field: 16px
space.panel: 32px

# 字体
type.body: 15px
type.small: 12px
type.title: 22px
font.sans: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif

# 图标
icon.set: mihua
size.icon: 16px

# 动效
motion.duration: 150ms
```
