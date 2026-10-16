<!-- 把上面的 Login.tsx 交给 AI：「改成 Vue + Element Plus」得到的结果 -->
<template>
  <div class="login-card">
    <el-tabs v-model="method" size="large">
      <el-tab-pane name="phone" label="手机号" />
      <el-tab-pane name="account" label="账号" />
    </el-tabs>
    <el-input size="large">
      <template #prepend><el-select model-value="+86" /></template>
    </el-input>
    <el-input size="large">
      <template #suffix><a>获取验证码</a></template>
    </el-input>
    <el-checkbox>我已阅读并同意用户协议</el-checkbox>
    <el-button type="primary" size="large" class="w-full">登录</el-button>
  </div>
</template>
