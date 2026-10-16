<script setup lang="ts">
import { useLoginText } from '../../context';
import ProviderMark from './ProviderMark.vue';
import { useLoginState } from './useLogin';

const { config, send } = useLoginState();
const t = useLoginText();
</script>

<template>
  <div v-if="config.socialProviders.length" class="mh-login__social" data-region="social">
    <div class="mh-divider">{{ t('label.others') }}</div>
    <div class="mh-login__providers">
      <button
        v-for="provider in config.socialProviders"
        :key="provider"
        type="button"
        class="mh-provider"
        :aria-label="t('social.continue', { provider: t(`social.${provider}`) })"
        @click="send({ type: 'social', provider })"
      >
        <ProviderMark :provider="provider" :size="32" />
        <span>{{ t(`social.${provider}`) }}</span>
      </button>
    </div>
  </div>
</template>
