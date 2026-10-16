import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LOGIN_VARIANTS, type LoginVariant } from '@mihua/core';
import { KITS } from '../kits';
import { KitView, type LookMode } from '../KitView';
import { SCENES } from '../scenes';
import type { OpenedScene } from '../scenes/types';
import { SPECS, specOf } from '../specs';
import '../kits.css';
import './demo.css';

/**
 * 演示页：所有登记的组件库并排渲染同一个场景。
 * 三档外观对比「只把取值交给组件库」为什么不够：原生 → 只设主题 → 对齐到控件规格。
 * 登录框的业务状态只有一份：在一个组件库里输入，其他组件库跟着变。
 * 整页的场景（后台页面框架）一次只看一个组件库，用「组件库」来回切；业务状态在场景的控制器里，
 * 换组件库、换外观、换规范都不会丢（侧栏收起没有、选中的菜单项、展开的子菜单）。
 */

/** 一格放得下的场景并排看；整页的场景一次看一个组件库。 */
const PAGE_SCENES = new Set(['admin', 'customers']);

const MODES: Array<[LookMode, string]> = [
  ['native', '组件库原生'],
  ['theme', '只设主题'],
  ['aligned', '对齐到控件规格'],
];

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="demo__seg">
      <legend>{label}</legend>
      {options.map(([id, name]) => (
        <button key={id} type="button" aria-pressed={id === value} onClick={() => onChange(id)}>
          {name}
        </button>
      ))}
    </fieldset>
  );
}

function Demo() {
  const [sceneId, setSceneId] = useState(SCENES[0]!.id);
  const [mode, setMode] = useState<LookMode>('aligned');
  const [specId, setSpecId] = useState('mono');
  const [variant, setVariant] = useState<LoginVariant>('centered');
  const [kitId, setKitId] = useState(KITS[0]!.kit.id);
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const single = PAGE_SCENES.has(sceneId);
  // 规范只影响检查项，不影响状态：换规范不重新打开场景，填好的、选好的都还在；
  // shared：所有组件库共用一份业务状态（检查页上每个组件库各一份）
  const opened = useMemo(
    () => scene.open({ variant, state: 'initial', shared: 'yes' }),
    [scene, variant],
  );
  // 严格模式（npm run dev）下 React 会把 effect「清理再重跑」一次，场景还是这一个、界面还在用它：
  // 这时不能真的释放（登录框的控制器释放以后就不再工作），也不用再进入一次。
  // 所以清理时先记下要释放谁，等一个微任务再判断——和控制器里 subscribe 的做法一样。
  const leaving = useRef<OpenedScene | null>(null);
  useEffect(() => {
    if (leaving.current === opened) leaving.current = null;
    else void opened.enter();
    return () => {
      leaving.current = opened;
      queueMicrotask(() => {
        if (leaving.current === opened) opened.dispose();
      });
    };
  }, [opened]);
  const spec = specOf(specId);

  return (
    <div className="demo">
      <header className="demo__bar">
        <h1>一份设计，{KITS.length} 个组件库</h1>
        <Seg
          label="场景"
          value={sceneId}
          options={SCENES.map((s) => [s.id, s.name])}
          onChange={setSceneId}
        />
        {sceneId === 'login' && (
          <Seg
            label="布局"
            value={variant}
            options={Object.values(LOGIN_VARIANTS).map((v) => [v.id, v.name.zh])}
            onChange={setVariant}
          />
        )}
        {single && (
          <Seg
            label="组件库"
            value={kitId}
            options={KITS.map((entry) => [entry.kit.id, entry.kit.name])}
            onChange={setKitId}
          />
        )}
        <Seg label="外观" value={mode} options={MODES} onChange={setMode} />
        <Seg
          label="规范"
          value={specId}
          options={Object.values(SPECS).map((s) => [s.id, s.name])}
          onChange={setSpecId}
        />
      </header>
      <main className={single ? 'demo__grid demo__grid--single' : 'demo__grid'}>
        {(single ? KITS.filter((entry) => entry.kit.id === kitId) : KITS).map((entry) => (
          <section key={entry.kit.id} className="demo__cell">
            <h2 className="demo__kit">
              {entry.kit.name}
              <span>{entry.framework === 'react' ? 'React' : 'Vue'}</span>
            </h2>
            <KitView entry={entry} spec={spec} mode={mode} scene={opened} />
          </section>
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
