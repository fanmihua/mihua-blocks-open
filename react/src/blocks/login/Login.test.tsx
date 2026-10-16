// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createLoginDemoAdapter } from '@mihua/core';
import { blueSpec } from '@mihua/spec';
import { Login, MihuaProvider } from '../../index';
import { shadcnKit } from '../../kits/shadcn';

afterEach(cleanup);

function setup(config = {}) {
  const adapter = createLoginDemoAdapter({ latency: 0 });
  return render(
    <MihuaProvider kit={shadcnKit} spec={blueSpec}>
      <Login adapter={adapter} config={config} />
    </MihuaProvider>,
  );
}

describe('<Login> (React)', () => {
  it('turns the spec into CSS variables on the component root', () => {
    const { container } = setup();
    const root = container.querySelector<HTMLElement>('.mh-root')!;
    expect(root.style.getPropertyValue('--mh-action-primary')).toBe('#3370FF');
    expect(root.dataset.kit).toBe('shadcn');
  });

  it('signs in with a phone number and a one-time code', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));
    expect(await screen.findByRole('button', { name: /秒后重发/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('6 位验证码'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    expect(await screen.findByText('请先阅读并同意用户协议和隐私政策')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /我已阅读并同意/ }));
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    expect(await screen.findByText('登录成功')).toBeTruthy();
  });

  it('links field errors to their inputs', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('请输入手机号'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));
    const message = await screen.findByText('请输入正确的 11 位手机号');
    expect(screen.getByLabelText('请输入手机号').getAttribute('aria-describedby')).toBe(message.id);
  });

  it('renders every layout from the same parts', () => {
    for (const variant of ['centered', 'split', 'step', 'social', 'qr'] as const) {
      const { container, unmount } = setup({ variant });
      expect(container.querySelector('.mh-login')?.getAttribute('data-variant')).toBe(variant);
      unmount();
    }
  });
});
