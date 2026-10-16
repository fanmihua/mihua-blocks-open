<script setup lang="ts">
import { Icon } from '../../icon';
defineProps<{ label: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
  <button type="button" class="mh-back" @click="$emit('click')">
    <Icon name="chevron-left" :size="16" />
    {{ label }}
  </button>
</template>
