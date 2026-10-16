<script setup lang="ts">
import { useId } from 'vue';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

const { snapshot, config, send } = useLoginState();
const { Checkbox } = useKit();
const t = useLoginText();
const errorId = useId();
</script>

<template>
  <div v-if="config.requireAgreement" class="mh-field" data-region="agreement">
    <Checkbox
      :model-value="snapshot.agreed"
      :invalid="!!snapshot.errors.agreement"
      :aria-describedby="snapshot.errors.agreement ? errorId : undefined"
      @update:model-value="(value: boolean) => send({ type: 'agreement', value })"
    >
      <span class="mh-login__agreement">
        {{ t('label.agree') }}
        <button
          type="button"
          class="mh-inline-link"
          @click.prevent="send({ type: 'event', event: 'terms' })"
        >
          {{ t('label.terms') }}
        </button>
        {{ t('label.and') }}
        <button
          type="button"
          class="mh-inline-link"
          @click.prevent="send({ type: 'event', event: 'privacy' })"
        >
          {{ t('label.privacy') }}
        </button>
      </span>
    </Checkbox>
    <p v-if="snapshot.errors.agreement" :id="errorId" class="mh-field__error">
      {{ t(snapshot.errors.agreement) }}
    </p>
  </div>
</template>
