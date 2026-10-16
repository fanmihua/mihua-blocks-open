import type { ReactNode } from 'react';
import { useLocale } from '../context';
import { Icon } from '../icon';

/**
 * 密码显隐按钮：接上规范时 antd、Arco、shadcn 的套件都用它（Element 套件里有同样的 Vue 版）。
 * 一个真正的按钮：能用键盘聚焦，读屏读出「显示密码 / 隐藏密码」；隐藏时画「眼睛关上」。
 * 图标默认来自规范的图标集；规范写 icon.set: native 时，套件传入组件库自己的图标（glyphs）。
 */
export function PasswordToggle({
  visible,
  onToggle,
  glyphs,
}: {
  visible: boolean;
  onToggle: () => void;
  glyphs?: { shown: ReactNode; hidden: ReactNode };
}) {
  const zh = useLocale() === 'zh';
  return (
    <button
      type="button"
      className="mh-eye"
      aria-label={visible ? (zh ? '隐藏密码' : 'Hide password') : zh ? '显示密码' : 'Show password'}
      // 点按钮时不让输入框失去焦点
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      {glyphs ? (
        visible ? (
          glyphs.shown
        ) : (
          glyphs.hidden
        )
      ) : (
        <Icon name={visible ? 'eye' : 'eye-off'} />
      )}
    </button>
  );
}
