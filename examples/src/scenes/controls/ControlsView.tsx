import { useSyncExternalStore } from 'react';
import { useKit } from '@mihua/react';
import { STATUS_OPTIONS, type ControlsState, type Store } from './state';

/**
 * 控件样张（React）：每种基础控件、两档尺寸各摆一行。和 Vue 那份（ControlsViewVue.ts）结构一样，
 * 控件全部来自套件（useKit），换组件库这里一行不改。
 */
export function ControlsView({ store }: { store: Store<ControlsState> }) {
  const kit = useKit();
  const s = useSyncExternalStore(store.subscribe, store.get);
  return (
    <section className="ex-controls">
      <p className="ex-controls__title">默认尺寸 · 后台页面</p>
      <div className="ex-controls__row" data-region="field">
        <div className="ex-controls__grow">
          <kit.Input
            name="keyword"
            value={s.keyword}
            onChange={(keyword) => store.set({ keyword })}
            placeholder="客户名称"
            aria-label="客户名称"
          />
        </div>
        <kit.Select
          value={s.status}
          onChange={(status) => store.set({ status })}
          options={STATUS_OPTIONS}
          width={128}
          aria-label="状态"
        />
      </div>
      <div className="ex-controls__row" data-region="button">
        <kit.Button variant="primary">查询</kit.Button>
        <kit.Button variant="secondary">重置</kit.Button>
      </div>
      <div className="ex-controls__row" data-region="checkbox">
        <kit.Checkbox checked={s.agree} onChange={(agree) => store.set({ agree })}>
          只看我负责的
        </kit.Checkbox>
        <kit.Checkbox checked={s.remember} onChange={(remember) => store.set({ remember })}>
          包含已停用
        </kit.Checkbox>
      </div>
      <div className="ex-controls__row" data-region="switch">
        <kit.Switch
          checked={s.notify}
          onChange={(notify) => store.set({ notify })}
          aria-label="消息通知"
        />
        <kit.Switch
          checked={s.archive}
          onChange={(archive) => store.set({ archive })}
          aria-label="自动归档"
        />
        <kit.Switch checked disabled onChange={() => {}} aria-label="已锁定（开）" />
        <kit.Switch checked={false} disabled onChange={() => {}} aria-label="已锁定（关）" />
      </div>
      <p className="ex-controls__title">大号 · 登录等关键表单</p>
      <div className="ex-controls__row" data-region="field-large">
        <div className="ex-controls__grow">
          <kit.Input
            name="keywordLarge"
            size="large"
            value={s.keywordLarge}
            onChange={(keywordLarge) => store.set({ keywordLarge })}
            placeholder="客户名称"
            aria-label="客户名称（大号）"
          />
        </div>
        <kit.Select
          size="large"
          value={s.statusLarge}
          onChange={(statusLarge) => store.set({ statusLarge })}
          options={STATUS_OPTIONS}
          width={128}
          aria-label="状态（大号）"
        />
      </div>
      <div className="ex-controls__row" data-region="button-large">
        <kit.Button variant="primary" size="large">
          保存
        </kit.Button>
        <kit.Button variant="secondary" size="large">
          取消
        </kit.Button>
      </div>
    </section>
  );
}
