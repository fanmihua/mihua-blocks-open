<script setup lang="ts">
/** 一个表单项：上面是名字，下面是控件和出错提示（和 React 那份 CustomerList.tsx 里的 Field 一样）。 */
defineProps<{ id?: string; label: string; required?: boolean; error?: string }>();
</script>

<template>
  <div class="mh-form__item">
    <component :is="id ? 'label' : 'span'" class="mh-form__label" :for="id">
      <span v-if="required" class="mh-form__required" aria-hidden="true">*</span>{{ label }}
    </component>
    <slot />
    <p v-if="error" class="mh-form__error" :id="id && `${id}-error`" role="alert">{{ error }}</p>
  </div>
</template>
