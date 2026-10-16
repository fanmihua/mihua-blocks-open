<script setup lang="ts">
import { computed } from 'vue';
import type { LoginMessageKey, LoginMethod } from '@mihua/core';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

const props = defineProps<{ methods: LoginMethod[] }>();
const { snapshot, send } = useLoginState();
const { Tabs } = useKit();
const t = useLoginText();
const LABEL: Record<LoginMethod, LoginMessageKey> = {
  phone: 'method.phone',
  account: 'method.account',
  email: 'method.email',
  qr: 'method.qr',
};
const items = computed(() => props.methods.map((m) => ({ value: m, label: t(LABEL[m]) })));
</script>

<template>
  <div v-if="items.length > 1" data-region="methods">
    <Tabs
      :aria-label="t('methods.label')"
      :model-value="snapshot.method"
      :items="items"
      @update:model-value="
        (method: string) => send({ type: 'method', method: method as LoginMethod })
      "
    />
  </div>
</template>
