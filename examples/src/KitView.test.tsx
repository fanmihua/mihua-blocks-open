// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { KITS } from './kits';
import { KitView } from './KitView';
import { SCENES } from './scenes';
import { specOf } from './specs';

afterEach(cleanup);

const spec = specOf('mono');

/** 演示页上切换场景：每一格（包括挂在 React 页面里的 Vue 应用）都要换成新场景。 */
describe.each(KITS)('$kit.name: switching the scene', (entry) => {
  it('renders the new scene', () => {
    const [login, controls, admin] = SCENES.map((scene) => scene.open({ spec: 'mono' }));
    const cell = (opened: typeof login) => <KitView entry={entry} spec={spec} scene={opened!} />;
    const { container, rerender } = render(cell(login));
    expect(container.querySelector(login!.root)).not.toBeNull();
    rerender(cell(controls));
    expect(container.querySelector(controls!.root)).not.toBeNull();
    expect(container.querySelector(login!.root)).toBeNull();
    rerender(cell(admin));
    expect(container.querySelector(admin!.root)).not.toBeNull();
    expect(container.querySelector(controls!.root)).toBeNull();
    for (const opened of [login, controls, admin]) opened!.dispose();
  });
});
