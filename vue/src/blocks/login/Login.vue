<script setup lang="ts">
import type { LoginAdapter, LoginConfigInput, LoginController } from '@mihua/core';
import '@mihua/core/styles/login.css';
import { useKit, useLoginText } from '../../context';
import { Icon } from '../../icon';
import AccountForm from './AccountForm.vue';
import Agreement from './Agreement.vue';
import BackLink from './BackLink.vue';
import IdentityField from './IdentityField.vue';
import LoginHeader from './LoginHeader.vue';
import LoginNotice from './LoginNotice.vue';
import LoginOrganizations from './LoginOrganizations.vue';
import LoginSuccess from './LoginSuccess.vue';
import MethodTabs from './MethodTabs.vue';
import ProviderMark from './ProviderMark.vue';
import QrPanel from './QrPanel.vue';
import SocialFooter from './SocialFooter.vue';
import SubmitButton from './SubmitButton.vue';
import VerificationField from './VerificationField.vue';
import { useLogin } from './useLogin';

/**
 * 登录组件（Vue）。与 React 版共用同一个控制器、同一份契约、同一份布局样式；
 * 五种布局对应模板里的五个分支，每个分支就是组件契约里的一组结构分区。
 */
const props = withDefaults(
  defineProps<{
    config?: LoginConfigInput;
    adapter?: LoginAdapter;
    controller?: LoginController;
  }>(),
  {
    config: () => ({}),
  },
);
const { snapshot, config, formMethods, send } = useLogin(
  () => props.config,
  props.adapter,
  props.controller,
);
const { Button } = useKit();
const t = useLoginText();
</script>

<template>
  <section class="mh-login" :data-variant="config.variant">
    <LoginSuccess v-if="snapshot.status === 'success'" />
    <LoginOrganizations v-else-if="snapshot.stage === 'organization'" />

    <!-- 居中：扫码入口在右上角折角 -->
    <template v-else-if="config.variant === 'centered'">
      <button
        type="button"
        class="mh-corner"
        data-region="qr-corner"
        :aria-label="t(snapshot.method === 'qr' ? 'qr.toForm' : 'qr.toQr')"
        :title="t(snapshot.method === 'qr' ? 'qr.toForm' : 'qr.toQr')"
        @click="send({ type: 'method', method: snapshot.method === 'qr' ? formMethods[0] : 'qr' })"
      >
        <Icon :name="snapshot.method === 'qr' ? 'monitor' : 'qr'" :size="20" />
      </button>
      <div v-if="snapshot.method === 'qr'" class="mh-login__stack">
        <LoginHeader :title="t('qr.title')" />
        <QrPanel />
        <Agreement />
      </div>
      <template v-else>
        <LoginHeader />
        <AccountForm />
        <p v-if="config.showRegister" class="mh-login__footnote">
          {{ t('register.prompt') }}
          <Button variant="link" @click="send({ type: 'event', event: 'register' })">{{
            t('action.register')
          }}</Button>
        </p>
      </template>
      <SocialFooter />
    </template>

    <!-- 双栏：左边表单、右边二维码 -->
    <template v-else-if="config.variant === 'split'">
      <div class="mh-split">
        <div class="mh-split__form" data-region="form">
          <LoginHeader />
          <AccountForm />
          <p v-if="config.showRegister" class="mh-login__footnote">
            {{ t('register.prompt') }}
            <Button variant="link" @click="send({ type: 'event', event: 'register' })">{{
              t('action.register')
            }}</Button>
          </p>
        </div>
        <div class="mh-split__qr">
          <h3 class="mh-login__section-title">{{ t('qr.title') }}</h3>
          <QrPanel compact />
        </div>
      </div>
      <SocialFooter />
    </template>

    <!-- 分步：第一步确认身份，第二步验证 -->
    <template v-else-if="config.variant === 'step'">
      <p class="mh-steps" data-region="progress">
        {{ t(snapshot.stage === 'identity' ? 'step.identity' : 'step.verify') }}
      </p>
      <LoginHeader />
      <form
        v-if="snapshot.stage === 'identity'"
        class="mh-login__stack"
        novalidate
        @submit.prevent="send({ type: 'submit' })"
      >
        <MethodTabs :methods="formMethods" />
        <IdentityField />
        <Agreement />
        <SubmitButton label="action.continue" />
        <LoginNotice />
      </form>
      <form v-else class="mh-login__stack" novalidate @submit.prevent="send({ type: 'submit' })">
        <div class="mh-identity">
          <span>{{
            snapshot.method === 'phone'
              ? `${snapshot.countryCode} ${snapshot.identity}`
              : snapshot.identity
          }}</span>
          <BackLink :label="t('action.back')" @click="send({ type: 'back' })" />
        </div>
        <VerificationField />
        <div class="mh-login__row">
          <button
            type="button"
            class="mh-inline-link"
            @click="
              send({
                type: 'verification',
                verification: snapshot.verification === 'otp' ? 'password' : 'otp',
              })
            "
          >
            {{ t(snapshot.verification === 'otp' ? 'step.usePassword' : 'step.useCode') }}
          </button>
        </div>
        <SubmitButton />
        <LoginNotice />
      </form>
      <SocialFooter />
    </template>

    <!-- 第三方优先：企业身份在最上方 -->
    <template v-else-if="config.variant === 'social'">
      <LoginHeader />
      <div class="mh-login__stack" data-region="providers">
        <Button
          v-for="provider in config.socialProviders"
          :key="provider"
          variant="secondary"
          size="large"
          block
          :disabled="snapshot.status === 'loading'"
          @click="send({ type: 'social', provider })"
        >
          <template #icon><ProviderMark :provider="provider" /></template>
          {{ t('social.continue', { provider: t(`social.${provider}`) }) }}
        </Button>
      </div>
      <div class="mh-divider">{{ t('label.orForm') }}</div>
      <AccountForm />
      <p v-if="config.showRegister" class="mh-login__footnote">
        {{ t('register.prompt') }}
        <Button variant="link" @click="send({ type: 'event', event: 'register' })">{{
          t('action.register')
        }}</Button>
      </p>
    </template>

    <!-- 扫码优先：默认只有二维码 -->
    <template v-else-if="snapshot.method === 'qr'">
      <LoginHeader :title="t('qr.title')" />
      <QrPanel />
      <Agreement />
      <div class="mh-login__switches">
        <button
          v-for="method in formMethods"
          :key="method"
          type="button"
          class="mh-inline-link"
          @click="send({ type: 'method', method })"
        >
          {{ t(method === 'phone' ? 'method.phone' : 'method.account') }}
        </button>
      </div>
      <SocialFooter />
    </template>
    <template v-else>
      <BackLink :label="t('qr.title')" @click="send({ type: 'method', method: 'qr' })" />
      <LoginHeader />
      <AccountForm />
      <SocialFooter />
    </template>
  </section>
</template>
