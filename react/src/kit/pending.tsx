/**
 * 还没做的控件：加新控件时，先给还没轮到的组件库放一个占位，类型检查能过、页面能打开。
 * 每个组件库做到这个控件时换成真的实现（照 docs/给套件加一个新控件.md），做完以后不应该还有人用它。
 */
export const pendingControl = (name: string) =>
  function Pending() {
    return <div data-pending={name}>（{name} 还没接）</div>;
  };

/** 还没做的控件的部件：什么也找不到。 */
export const PENDING_PART = '[data-pending-part]';
