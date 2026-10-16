import { ADMIN_FRAME, parentOf, type AdminFrameStructure } from './frame';

/**
 * 后台页面框架的业务状态：侧栏收起没有、选中哪个菜单项、哪些子菜单展开、最后点了哪个操作。
 * 纯 TypeScript，React 用 useSyncExternalStore 订阅，Vue 用 shallowRef 订阅；状态只有一份，
 * 所以换组件库、换外观、换框架都不会丢。控件（导航菜单、下拉菜单）自己不存这些。
 */
export interface AdminState {
  collapsed: boolean;
  selected: string;
  open: string[];
  /** 最后一次点的操作（用户菜单的项、页头按钮），没有点过是 null。 */
  lastAction: string | null;
}

export type AdminEvent =
  | { type: 'select'; key: string }
  | { type: 'open'; keys: string[] }
  | { type: 'collapse'; collapsed: boolean }
  | { type: 'action'; key: string };

export interface AdminController {
  readonly frame: AdminFrameStructure;
  getSnapshot(): AdminState;
  subscribe(listener: () => void): () => void;
  send(event: AdminEvent): void;
}

export const ADMIN_INITIAL: AdminState = {
  collapsed: false,
  selected: 'customer-list',
  open: ['customers'],
  lastAction: null,
};

export function createAdminController(
  initial: Partial<AdminState> = {},
  frame: AdminFrameStructure = ADMIN_FRAME,
): AdminController {
  let state: AdminState = { ...ADMIN_INITIAL, ...initial };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<AdminState>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  return {
    frame,
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(event) {
      switch (event.type) {
        case 'select': {
          if (event.key === state.selected) return;
          // 选中子菜单里的项（比如在收起后的弹层里选的）：把它的子菜单记成展开，展开侧栏时能看到它
          const parent = parentOf(frame.nav, event.key);
          const open =
            parent && !state.open.includes(parent.key) ? [...state.open, parent.key] : state.open;
          return set({ selected: event.key, open });
        }
        case 'open':
          return set({ open: [...event.keys] });
        case 'collapse':
          return event.collapsed === state.collapsed
            ? undefined
            : set({ collapsed: event.collapsed });
        case 'action':
          return set({ lastAction: event.key });
      }
    },
  };
}
