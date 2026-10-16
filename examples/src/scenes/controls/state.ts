/**
 * 控件样张的状态：每个组件库一份（每一格各自能操作，互不影响）。
 * 一个最小的状态容器：React 用 useSyncExternalStore 订阅，Vue 用 shallowRef 订阅。
 */
export interface ControlsState {
  keyword: string;
  keywordLarge: string;
  status: string;
  statusLarge: string;
  agree: boolean;
  remember: boolean;
  notify: boolean;
  archive: boolean;
}

export const INITIAL: ControlsState = {
  keyword: '',
  keywordLarge: '',
  status: 'all',
  statusLarge: 'all',
  agree: true,
  remember: false,
  notify: true,
  archive: false,
};

export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'paused', label: '已停用' },
];

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
