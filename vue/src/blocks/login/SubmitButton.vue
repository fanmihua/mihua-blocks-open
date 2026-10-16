<script setup lang="ts">
import type { LoginMessageKey } from '@mihua/core';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

defineProps<{ label?: LoginMessageKey }>();
const { snapshot } = useLoginState();
const { Button } = useKit();
const t = useLoginText();
</script>

<template>
  <div data-region="submit">
    <Button
      variant="primary"
      size="large"
      type="submit"
      block
      :loading="snapshot.status === 'loading'"
    >
      {{ snapshot.status === 'loading' ? t('action.signingIn') : t(label ?? 'action.signIn') }}
    </Button>
  </div>
</template>
