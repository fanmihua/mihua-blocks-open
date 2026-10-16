// @vitest-environment jsdom
import { act } from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { KITS } from '../kits';

/**
 * 演示页用严格模式渲染（npm run dev 打开的就是它）：开发模式下 React 会把 effect「清理再重跑」一次。
 * 登录框的控制器 dispose 以后就不再工作，演示页不能在这一下里把它释放掉——
 * 否则切标签、打字、点登录都没有反应。检查页不用严格模式，所以自动检查碰不到这个问题。
 */
it('demo page: the login form still works under StrictMode', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  await act(async () => {
    await import('./main');
  });
  const cells = [...document.querySelectorAll<HTMLElement>('.demo__cell')];
  expect(cells).toHaveLength(KITS.length);
  const react = cells[KITS.findIndex((entry) => entry.framework === 'react')]!;
  const vue = cells[KITS.findIndex((entry) => entry.framework === 'vue')]!;
  const inputs = (name: string) =>
    cells.map((cell) => cell.querySelector<HTMLInputElement>(`input[name=${name}]`));

  // 在 React 的格子里点「账号」：业务状态只有一份，每一格（包括 Vue 的）都出现密码框
  fireEvent.click(within(react).getByRole('tab', { name: '账号' }));
  await waitFor(() => expect(inputs('password').every(Boolean)).toBe(true));

  // 在 Vue 的格子里打字：每一格的输入框里都有这几个字
  const identity = vue.querySelector<HTMLInputElement>('input[name=identity]')!;
  fireEvent.input(identity, { target: { value: 'zhangsan' } });
  await waitFor(() =>
    expect(inputs('identity').map((input) => input?.value)).toEqual(cells.map(() => 'zhangsan')),
  );

  // 没填密码就点登录：每一格都提示「请输入密码」
  fireEvent.click(within(react).getByRole('button', { name: '登录' }));
  await waitFor(() =>
    cells.forEach((cell) => expect(within(cell).getByText('请输入密码')).toBeTruthy()),
  );
});
