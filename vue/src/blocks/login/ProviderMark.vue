<script setup lang="ts">
import type { SocialProvider } from '@mihua/core';

/** 企业身份标识：品牌色加首字，不复制各家商标图形；接入时换成获得授权的官方图标。 */
const props = withDefaults(defineProps<{ provider: SocialProvider; size?: number }>(), {
  size: 20,
});
const MARK: Record<SocialProvider, { glyph: string; color: string }> = {
  dingtalk: { glyph: '钉', color: '#0089FF' },
  wecom: { glyph: '企', color: '#07C160' },
  sso: { glyph: 'ID', color: 'var(--mh-text-strong)' },
};
</script>

<template>
  <span
    class="mh-provider-mark"
    aria-hidden="true"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
      background: MARK[props.provider].color,
      fontSize: `${props.size * 0.5}px`,
    }"
  >
    {{ MARK[props.provider].glyph }}
  </span>
</template>
