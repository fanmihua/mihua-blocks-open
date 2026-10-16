<script setup lang="ts">
import { computed, useId } from 'vue';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

const { snapshot, send } = useLoginState();
const { Input, Button } = useKit();
const t = useLoginText();
const errorId = useId();

const byPassword = computed(() => snapshot.value.verification === 'password');
const error = computed(() =>
  byPassword.value ? snapshot.value.errors.password : snapshot.value.errors.code,
);
const sendLabel = computed(() =>
  snapshot.value.sendingCode
    ? t('action.sending')
    : snapshot.value.resendSeconds > 0
      ? t('action.resend', { seconds: snapshot.value.resendSeconds })
      : t('action.sendCode'),
);
</script>

<template>
  <div class="mh-field" data-region="fields">
    <Input
      v-if="byPassword"
      size="large"
      type="password"
      name="password"
      autocomplete="current-password"
      :model-value="snapshot.password"
      :placeholder="t('placeholder.password')"
      :aria-label="t('placeholder.password')"
      :invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      @update:model-value="(value: string) => send({ type: 'field', field: 'password', value })"
    />
    <Input
      v-else
      size="large"
      name="code"
      inputmode="numeric"
      autocomplete="one-time-code"
      :maxlength="6"
      :model-value="snapshot.code"
      :placeholder="t('placeholder.code')"
      :aria-label="t('placeholder.code')"
      :invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      @update:model-value="
        (value: string) => send({ type: 'field', field: 'code', value: value.replace(/\D/g, '') })
      "
    >
      <template #suffix>
        <Button
          variant="link"
          :disabled="snapshot.sendingCode || snapshot.resendSeconds > 0"
          @click="send({ type: 'send-code' })"
        >
          {{ sendLabel }}
        </Button>
      </template>
    </Input>
    <p v-if="error" :id="errorId" class="mh-field__error">{{ t(error) }}</p>
  </div>
</template>
