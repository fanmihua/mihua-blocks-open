import { defineComponent, h, type PropType } from 'vue';
import { iconSetOf, type IconName } from '@mihua/spec';
import { useIconSet } from './context';

/**
 * 语义图标（与 React 版 Icon 相同）：只说要哪个图标，画成哪一套由规范的 icon.set 决定。
 * 视图和套件都用它，不直接引用任何图标库。data-mh-icon 写明是哪个图标，核对时用。
 */
export const Icon = defineComponent({
  name: 'MihuaIcon',
  props: {
    name: { type: String as PropType<IconName>, required: true },
    size: { type: [Number, String], default: 16 },
    /** 不给就用这一套图标自己的线宽。 */
    strokeWidth: { type: Number, default: undefined },
    /** 一直旋转（加载中）。 */
    spin: { type: Boolean, default: false },
  },
  setup(props) {
    const setId = useIconSet();
    return () => {
      const set = iconSetOf(setId.value);
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size,
          height: props.size,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': props.strokeWidth ?? set.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          'data-mh-icon': props.name,
          'data-mh-icon-set': setId.value,
          class: ['mh-icon', props.spin && 'mh-icon--spin'],
        },
        set.glyphs[props.name].map(([tag, attrs]) => h(tag, attrs)),
      );
    };
  },
});
