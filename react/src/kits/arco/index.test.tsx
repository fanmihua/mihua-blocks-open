// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MihuaProvider } from '../../index';
import { arcoKit } from './index';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

/**
 * Arco 的下拉菜单：菜单不挂 ref、菜单项不用 Fragment 包，打开时控制台不报错
 * （React 19 的 element.ref 弃用警告、Fragment 上的属性警告），键盘照样能用。
 */
describe('Arco dropdown', () => {
  it('opens without console errors and still moves focus by keyboard', async () => {
    const errors = vi.spyOn(console, 'error');
    const { Dropdown } = arcoKit;
    const { getByText } = render(
      <MihuaProvider kit={arcoKit}>
        <Dropdown
          aria-label="账号菜单"
          onSelect={() => {}}
          items={[
            { key: 'profile', label: '个人设置' },
            { key: 'logout', label: '退出登录', divided: true, danger: true },
          ]}
        >
          <button type="button">顾清和</button>
        </Dropdown>
      </MihuaProvider>,
    );
    const trigger = getByText('顾清和');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await wait(300);
    const menu = document.querySelector<HTMLElement>('.mh-arco-dropdown')!;
    const items = [...menu.querySelectorAll<HTMLElement>('[role=menuitem]')];
    expect(items.map((item) => item.textContent)).toEqual(['个人设置', '退出登录']);
    expect(menu.querySelectorAll('[role=separator]')).toHaveLength(1);
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    expect(errors).not.toHaveBeenCalled();
  });

  // 演示页（npm run dev）用严格模式：effect 会「清理再重跑」一次，用键盘打开以后焦点照样进第一项
  it('moves focus into the menu when opened by keyboard under StrictMode', async () => {
    const { Dropdown } = arcoKit;
    const { getByText } = render(
      <StrictMode>
        <MihuaProvider kit={arcoKit}>
          <Dropdown
            aria-label="账号菜单"
            onSelect={() => {}}
            items={[{ key: 'profile', label: '个人设置' }]}
          >
            <button type="button">顾清和</button>
          </Dropdown>
        </MihuaProvider>
      </StrictMode>,
    );
    fireEvent.keyDown(getByText('顾清和'), { key: 'ArrowDown' });
    // Arco 的弹层这时会被拆下来、过一会儿重新挂上（它的 Portal 在清理时移除容器），等焦点回到第一项
    await waitFor(() => {
      const first = document.querySelector<HTMLElement>('.mh-arco-dropdown [role=menuitem]');
      expect(first).not.toBeNull();
      expect(document.activeElement).toBe(first);
    });
  });
});
