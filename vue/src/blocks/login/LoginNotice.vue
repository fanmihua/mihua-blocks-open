<script setup lang="ts">
import { computed } from 'vue';
import { useLoginText } from '../../context';
import { useLoginState } from './useLogin';

/** 状态播报：发送验证码、登录失败等变化会被读屏软件朗读。 */
const { snapshot } = useLoginState();
const t = useLoginText();
const text = computed(() => {
  const notice = snapshot.value.notice;
  return notice ? ('key' in notice ? t(notice.key) : notice.text) : '';
});
</script>

<template>
  <p
    class="mh-login__notice"
    role="status"
    aria-live="polite"
    :data-tone="snapshot.status === 'error' ? 'error' : 'info'"
  >
    {{ text }}
  </p>
</template>
