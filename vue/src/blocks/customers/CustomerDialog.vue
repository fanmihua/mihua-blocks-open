<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useId } from 'vue';
import type {
  CustomerForm,
  CustomerFormErrors,
  CustomerListController,
  CustomerStatus,
} from '@mihua/core';
import { useKit } from '../../context';
import FormField from './FormField.vue';

/**
 * 编辑对话框（Vue）：新建或编辑一位客户，和 React 那份（CustomerList.tsx 里的 CustomerDialog）一样。
 * 表单的值、出错提示、对话框开没开都在控制器里；按 Esc、点关闭按钮、点取消都是「关」，点保存先校验。
 */
const props = defineProps<{ controller: CustomerListController }>();
const { Dialog, Input, Select, Radio, Textarea, Switch, Button } = useKit();
const list = props.controller.list;
const text = list.text;
const send = props.controller.send;
const id = useId();
const s = shallowRef(props.controller.getSnapshot());
onUnmounted(props.controller.subscribe(() => (s.value = props.controller.getSnapshot())));
const dialog = computed(() => s.value.dialog);
const errors = computed<CustomerFormErrors>(() => dialog.value?.errors ?? {});
const set = (patch: Partial<CustomerForm>) => send({ type: 'form', patch });
const described = (key: keyof CustomerFormErrors) =>
  errors.value[key] ? `${id}-${key}-error` : undefined;
const statusOptions = list.statuses.map(({ value, label }) => ({ value, label }));
const ownerOptions = list.owners.map((owner) => ({ value: owner, label: owner }));
</script>

<template>
  <Dialog
    :open="!!dialog"
    :title="dialog?.key ? text.editTitle : text.createTitle"
    :close-label="text.close"
    @close="send({ type: 'close' })"
  >
    <div v-if="dialog" class="mh-form" data-region="dialog-form">
      <FormField :id="`${id}-name`" :label="text.fields.name" required :error="errors.name">
        <Input
          :id="`${id}-name`"
          name="name"
          :model-value="dialog.form.name"
          :placeholder="text.namePlaceholder"
          :invalid="!!errors.name"
          :aria-describedby="described('name')"
          @update:model-value="(name: string) => set({ name })"
        />
      </FormField>
      <FormField :id="`${id}-phone`" :label="text.fields.phone" :error="errors.phone">
        <Input
          :id="`${id}-phone`"
          name="phone"
          type="tel"
          inputmode="tel"
          :model-value="dialog.form.phone"
          :placeholder="text.phonePlaceholder"
          :invalid="!!errors.phone"
          :aria-describedby="described('phone')"
          @update:model-value="(phone: string) => set({ phone })"
        />
      </FormField>
      <div class="mh-form__row">
        <FormField :label="text.fields.status">
          <Select
            :model-value="dialog.form.status"
            :options="statusOptions"
            :aria-label="text.fields.status"
            @update:model-value="(status: string) => set({ status: status as CustomerStatus })"
          />
        </FormField>
        <FormField :label="text.fields.owner">
          <Select
            :model-value="dialog.form.owner"
            :options="ownerOptions"
            :aria-label="text.fields.owner"
            @update:model-value="(owner: string) => set({ owner })"
          />
        </FormField>
      </div>
      <FormField :label="text.fields.level">
        <Radio
          :model-value="dialog.form.level"
          :options="list.levels"
          :aria-label="text.fields.level"
          @update:model-value="(level: string) => set({ level: level as CustomerForm['level'] })"
        />
      </FormField>
      <FormField :id="`${id}-note`" :label="text.fields.note" :error="errors.note">
        <Textarea
          :id="`${id}-note`"
          name="note"
          :model-value="dialog.form.note"
          :placeholder="text.notePlaceholder"
          :invalid="!!errors.note"
          :aria-describedby="described('note')"
          @update:model-value="(note: string) => set({ note })"
        />
      </FormField>
      <div class="mh-form__switch">
        <Switch
          :model-value="dialog.form.important"
          :aria-label="text.fields.important"
          @update:model-value="(important: boolean) => set({ important })"
        />
        <span aria-hidden="true">{{ text.fields.important }}</span>
      </div>
    </div>
    <template #footer>
      <div class="mh-form__footer" data-region="dialog-footer">
        <Button variant="secondary" @click="send({ type: 'close' })">{{ text.cancel }}</Button>
        <Button variant="primary" @click="send({ type: 'save' })">{{ text.save }}</Button>
      </div>
    </template>
  </Dialog>
</template>
