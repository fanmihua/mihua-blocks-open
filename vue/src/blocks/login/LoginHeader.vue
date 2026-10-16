<script setup lang="ts">
import { useLoginText } from '../../context';
import { useLoginState } from './useLogin';

defineProps<{ title?: string; subtitle?: string }>();
const { config } = useLoginState();
const t = useLoginText();
</script>

<template>
  <header class="mh-login__header" data-region="header">
    <h2 class="mh-login__title">{{ title ?? (config.title || t('title')) }}</h2>
    <p class="mh-login__subtitle">{{ subtitle ?? t('subtitle') }}</p>
  </header>
</template>
