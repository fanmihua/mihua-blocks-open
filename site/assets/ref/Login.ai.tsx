import { Tabs, Input, Select, Checkbox, Button } from 'antd';

export function Login() {
  return (
    <div className="login-card">
      <Tabs size="large" items={[{ key: 'phone', label: '手机号' },
                                 { key: 'account', label: '账号' }]} />
      <Input size="large" addonBefore={<Select defaultValue="+86" />} />
      <Input size="large" suffix={<a>获取验证码</a>} />
      <Checkbox>我已阅读并同意用户协议</Checkbox>
      <Button type="primary" size="large" block>登录</Button>
    </div>
  );
}
