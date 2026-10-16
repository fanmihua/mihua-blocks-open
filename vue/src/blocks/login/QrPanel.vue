<script setup lang="ts">
import { computed } from 'vue';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

defineProps<{ compact?: boolean }>();
const { snapshot, config, send } = useLoginState();
const { Button } = useKit();
const t = useLoginText();
const qr = computed(() => snapshot.value.qr);
const notice = computed(() =>
  qr.value.notice ? ('key' in qr.value.notice ? t(qr.value.notice.key) : qr.value.notice.text) : '',
);
const covered = computed(() => ['expired', 'error', 'scanned'].includes(qr.value.status));
</script>

<template>
  <div class="mh-qr" data-region="qr" :data-compact="compact || undefined">
    <div class="mh-qr__frame" :aria-busy="qr.status === 'loading'">
      <img v-if="qr.session" class="mh-qr__image" :src="qr.session.imageUrl" :alt="t('qr.title')" />
      <span v-if="qr.status === 'loading'" class="mh-qr__hint">{{ t('qr.loading') }}</span>
      <div v-if="covered" class="mh-qr__cover">
        <strong>{{
          qr.status === 'expired'
            ? t('qr.expired')
            : qr.status === 'scanned'
              ? t('qr.scanned')
              : notice
        }}</strong>
        <Button
          v-if="qr.status !== 'scanned'"
          variant="secondary"
          @click="send({ type: 'refresh-qr' })"
        >
          {{ t('qr.refresh') }}
        </Button>
      </div>
    </div>
    <p class="mh-qr__caption" role="status" aria-live="polite">
      {{ qr.status === 'scanned' && notice ? notice : t('qr.hint', { brand: config.brand }) }}
    </p>
  </div>
</template>
