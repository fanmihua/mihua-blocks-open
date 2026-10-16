<script setup lang="ts">
import { computed } from 'vue';
import type { LoginMethod } from '@mihua/core';
import { useKit, useLoginText } from '../../context';
import Agreement from './Agreement.vue';
import IdentityField from './IdentityField.vue';
import LoginNotice from './LoginNotice.vue';
import MethodTabs from './MethodTabs.vue';
import SubmitButton from './SubmitButton.vue';
import VerificationField from './VerificationField.vue';
import { useLoginState } from './useLogin';

/** 表单：方式切换 → 身份 → 验证 → 偏好 → 协议 → 登录 → 状态播报。与 React 版结构一致。 */
const { snapshot, config, formMethods, send } = useLoginState();
const { Checkbox, Button } = useKit();
const t = useLoginText();
const showForgot = computed(() => snapshot.value.verification === 'password');
const methods = computed<LoginMethod[]>(() => formMethods.value);
</script>

<template>
  <form class="mh-login__stack" novalidate @submit.prevent="send({ type: 'submit' })">
    <MethodTabs :methods="methods" />
    <IdentityField />
    <VerificationField />
    <div v-if="config.showRemember || showForgot" class="mh-login__row">
      <Checkbox
        v-if="config.showRemember"
        :model-value="snapshot.remember"
        @update:model-value="(value: boolean) => send({ type: 'remember', value })"
      >
        {{ t('label.remember') }}
      </Checkbox>
      <span v-else />
      <Button
        v-if="showForgot"
        variant="link"
        @click="send({ type: 'event', event: 'forgot-password' })"
      >
        {{ t('action.forgot') }}
      </Button>
    </div>
    <Agreement />
    <SubmitButton />
    <LoginNotice />
  </form>
</template>
