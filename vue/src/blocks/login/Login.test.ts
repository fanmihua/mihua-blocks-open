// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { h } from 'vue';
import { createLoginDemoAdapter } from '@mihua/core';
import { blueSpec } from '@mihua/spec';
import { Login, MihuaProvider } from '../../index';
import { elementKit } from '../../kits/element';

const settle = async () => {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 5));
  await flushPromises();
};

function setup() {
  const adapter = createLoginDemoAdapter({ latency: 0 });
  return mount(MihuaProvider, {
    props: { kit: elementKit, spec: blueSpec },
    slots: { default: () => h(Login, { adapter }) },
    attachTo: document.body,
  });
}

describe('<Login> (Vue)', () => {
  it('maps the spec onto Element Plus variables', () => {
    const wrapper = setup();
    const kit = wrapper.find<HTMLElement>('.mh-kit-element').element;
    expect(kit.style.getPropertyValue('--el-color-primary')).toBe('#3370FF');
    wrapper.unmount();
  });

  it('signs in with the same controller as the React view', async () => {
    const wrapper = setup();
    await wrapper.find('input[name="identity"]').setValue('13800138000');
    const sendCode = wrapper.findAll('button').find((b) => b.text() === '获取验证码')!;
    await sendCode.trigger('click');
    await settle();
    expect(wrapper.text()).toContain('秒后重发');
    await wrapper.find('input[name="code"]').setValue('123456');
    await wrapper
      .find('.mh-login__agreement')
      .element.closest('label')!
      .querySelector('input')!
      .click();
    await wrapper.find('form').trigger('submit');
    await settle();
    expect(wrapper.text()).toContain('登录成功');
    wrapper.unmount();
  });
});
