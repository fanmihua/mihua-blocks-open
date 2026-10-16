import { defineComponent, h, onUnmounted, shallowRef, type PropType } from 'vue';
import { useKit } from '@mihua/vue';
import { STATUS_OPTIONS, type ControlsState, type Store } from './state';

/**
 * 控件样张（Vue）：和 React 那份（ControlsView.tsx）结构一样，控件全部来自套件（useKit）。
 */
export const ControlsView = defineComponent({
  name: 'ControlsView',
  props: { store: { type: Object as PropType<Store<ControlsState>>, required: true } },
  setup(props) {
    const kit = useKit();
    const state = shallowRef(props.store.get());
    onUnmounted(props.store.subscribe(() => (state.value = props.store.get())));
    const set = (patch: Partial<ControlsState>) => props.store.set(patch);
    return () => {
      const s = state.value;
      return h('section', { class: 'ex-controls' }, [
        h('p', { class: 'ex-controls__title' }, '默认尺寸 · 后台页面'),
        h('div', { class: 'ex-controls__row', 'data-region': 'field' }, [
          h('div', { class: 'ex-controls__grow' }, [
            h(kit.Input, {
              name: 'keyword',
              modelValue: s.keyword,
              'onUpdate:modelValue': (keyword: string) => set({ keyword }),
              placeholder: '客户名称',
              ariaLabel: '客户名称',
            }),
          ]),
          h(kit.Select, {
            modelValue: s.status,
            'onUpdate:modelValue': (status: string) => set({ status }),
            options: STATUS_OPTIONS,
            width: 128,
            ariaLabel: '状态',
          }),
        ]),
        h('div', { class: 'ex-controls__row', 'data-region': 'button' }, [
          h(kit.Button, { variant: 'primary' }, () => '查询'),
          h(kit.Button, { variant: 'secondary' }, () => '重置'),
        ]),
        h('div', { class: 'ex-controls__row', 'data-region': 'checkbox' }, [
          h(
            kit.Checkbox,
            { modelValue: s.agree, 'onUpdate:modelValue': (agree: boolean) => set({ agree }) },
            () => '只看我负责的',
          ),
          h(
            kit.Checkbox,
            {
              modelValue: s.remember,
              'onUpdate:modelValue': (remember: boolean) => set({ remember }),
            },
            () => '包含已停用',
          ),
        ]),
        h('div', { class: 'ex-controls__row', 'data-region': 'switch' }, [
          h(kit.Switch, {
            modelValue: s.notify,
            'onUpdate:modelValue': (notify: boolean) => set({ notify }),
            ariaLabel: '消息通知',
          }),
          h(kit.Switch, {
            modelValue: s.archive,
            'onUpdate:modelValue': (archive: boolean) => set({ archive }),
            ariaLabel: '自动归档',
          }),
          h(kit.Switch, { modelValue: true, disabled: true, ariaLabel: '已锁定（开）' }),
          h(kit.Switch, { modelValue: false, disabled: true, ariaLabel: '已锁定（关）' }),
        ]),
        h('p', { class: 'ex-controls__title' }, '大号 · 登录等关键表单'),
        h('div', { class: 'ex-controls__row', 'data-region': 'field-large' }, [
          h('div', { class: 'ex-controls__grow' }, [
            h(kit.Input, {
              name: 'keywordLarge',
              size: 'large',
              modelValue: s.keywordLarge,
              'onUpdate:modelValue': (keywordLarge: string) => set({ keywordLarge }),
              placeholder: '客户名称',
              ariaLabel: '客户名称（大号）',
            }),
          ]),
          h(kit.Select, {
            size: 'large',
            modelValue: s.statusLarge,
            'onUpdate:modelValue': (statusLarge: string) => set({ statusLarge }),
            options: STATUS_OPTIONS,
            width: 128,
            ariaLabel: '状态（大号）',
          }),
        ]),
        h('div', { class: 'ex-controls__row', 'data-region': 'button-large' }, [
          h(kit.Button, { variant: 'primary', size: 'large' }, () => '保存'),
          h(kit.Button, { variant: 'secondary', size: 'large' }, () => '取消'),
        ]),
      ]);
    };
  },
});
