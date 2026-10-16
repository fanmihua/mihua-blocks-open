<script setup lang="ts">
import { computed, useId } from 'vue';
import { COUNTRY_CODES, type LoginCountryCode } from '@mihua/core';
import { useKit, useLoginText } from '../../context';
import { useLoginState } from './useLogin';

const { snapshot, send } = useLoginState();
const { Input, Select } = useKit();
const t = useLoginText();
const errorId = useId();

const method = computed(() => snapshot.value.method);
const placeholder = computed(() =>
  t(
    method.value === 'phone'
      ? 'placeholder.phone'
      : method.value === 'email'
        ? 'placeholder.email'
        : 'placeholder.account',
  ),
);
const countries = computed(() =>
  COUNTRY_CODES.map((code) => ({ value: code, label: t(`country.${code}`) })),
);
const error = computed(() => snapshot.value.errors.identity);
</script>

<template>
  <div class="mh-field" data-region="fields">
    <div :class="{ 'mh-field__group': method === 'phone' }">
      <Select
        v-if="method === 'phone'"
        size="large"
        :width="96"
        :aria-label="t('field.country')"
        :model-value="snapshot.countryCode"
        :options="countries"
        :display="(value: string) => value"
        @update:model-value="
          (value: string) => send({ type: 'country-code', value: value as LoginCountryCode })
        "
      />
      <Input
        size="large"
        name="identity"
        :model-value="snapshot.identity"
        :type="method === 'phone' ? 'tel' : method === 'email' ? 'email' : 'text'"
        :inputmode="method === 'phone' ? 'numeric' : method === 'email' ? 'email' : 'text'"
        :autocomplete="
          method === 'phone' ? 'tel-national' : method === 'email' ? 'email' : 'username'
        "
        :maxlength="method === 'phone' ? 11 : 80"
        :placeholder="placeholder"
        :aria-label="placeholder"
        :invalid="!!error"
        :aria-describedby="error ? errorId : undefined"
        @update:model-value="(value: string) => send({ type: 'field', field: 'identity', value })"
      />
    </div>
    <p v-if="error" :id="errorId" class="mh-field__error">{{ t(error) }}</p>
  </div>
</template>
