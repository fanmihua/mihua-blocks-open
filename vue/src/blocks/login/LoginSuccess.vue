<script setup lang="ts">
import { useLoginText } from '../../context';
import { Icon } from '../../icon';
import BackLink from './BackLink.vue';
import { useLoginState } from './useLogin';

const { snapshot, send } = useLoginState();
const t = useLoginText();
</script>

<template>
  <div class="mh-success" role="status">
    <span class="mh-success__icon">
      <Icon name="check" :size="28" />
    </span>
    <h2 class="mh-login__title">{{ t('success.title') }}</h2>
    <p class="mh-login__subtitle">{{ t('success.body', { name: snapshot.user?.name ?? '' }) }}</p>
    <BackLink :label="t('action.back')" @click="send({ type: 'reset' })" />
  </div>
</template>
