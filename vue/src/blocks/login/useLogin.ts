import {
  computed,
  inject,
  provide,
  shallowRef,
  toValue,
  watch,
  watchEffect,
  type InjectionKey,
  type MaybeRefOrGetter,
  type ShallowRef,
} from 'vue';
import {
  LOGIN_VARIANTS,
  createLoginController,
  createLoginDemoAdapter,
  type LoginAdapter,
  type LoginConfig,
  type LoginConfigInput,
  type LoginController,
  type LoginMethod,
  type LoginSnapshot,
} from '@mihua/core';
import { useLocale } from '../../context';

export interface LoginState {
  snapshot: ShallowRef<LoginSnapshot>;
  config: ShallowRef<LoginConfig>;
  formMethods: ShallowRef<LoginMethod[]>;
  send: LoginController['send'];
}

const LoginStateKey: InjectionKey<LoginState> = Symbol('mihua-login');

/**
 * Vue 与控制器之间的全部胶水代码：配置变了就换一个控制器；用 watchEffect 订阅快照，
 * 组件卸载或控制器被替换时自动退订——控制器没人订阅就会自动暂停。
 */
export function useLogin(
  config: MaybeRefOrGetter<LoginConfigInput>,
  adapter?: LoginAdapter,
  /** 传入现成的控制器时，多个视图（包括 React 视图）共用同一个登录过程。 */
  external?: LoginController,
): LoginState {
  const locale = useLocale();
  const create = () =>
    external ??
    createLoginController(
      toValue(config),
      adapter ?? createLoginDemoAdapter({ locale: locale.value }),
    );
  const controller = shallowRef(create());
  if (!external)
    watch(
      () => [JSON.stringify(toValue(config)), locale.value],
      () => (controller.value = create()),
    );
  const snapshot = shallowRef(controller.value.getSnapshot());
  watchEffect((onCleanup) => {
    const current = controller.value;
    snapshot.value = current.getSnapshot();
    onCleanup(current.subscribe(() => (snapshot.value = current.getSnapshot())));
  });
  const resolved = computed(() => controller.value.config);
  const state: LoginState = {
    snapshot,
    config: resolved,
    formMethods: computed(() =>
      LOGIN_VARIANTS[resolved.value.variant].methods.filter((m) => m !== 'qr'),
    ),
    send: (action) => controller.value.send(action),
  };
  provide(LoginStateKey, state);
  return state;
}

export function useLoginState(): LoginState {
  const state = inject(LoginStateKey, null);
  if (!state) throw new Error('登录部件必须放在 <Login> 里面。');
  return state;
}
