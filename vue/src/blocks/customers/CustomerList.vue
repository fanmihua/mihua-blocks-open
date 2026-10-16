<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue';
import {
  customerPage,
  formatAmount,
  type CustomerListController,
  type CustomerStatus,
} from '@mihua/core';
import type { TableRow, TableSort } from '@mihua/spec';
import '@mihua/core/styles/customers.css';
import { useKit } from '../../context';
import { Icon } from '../../icon';
import CustomerDialog from './CustomerDialog.vue';

/**
 * 客户列表（Vue）：筛选栏、表格（勾选、排序、状态标签、开关、操作列）、分页。
 * 结构和文案来自 @mihua/core 的 CUSTOMER_LIST，布局来自 customers.css，和 React 那份（CustomerList.tsx）一样；
 * 控件全部来自套件（useKit），换组件库这里一行不改。业务状态都在控制器里。
 */
const props = defineProps<{ controller: CustomerListController }>();
const { Input, Select, DateRange, Button, Table, Pagination, Tag, Switch } = useKit();
const list = props.controller.list;
const text = list.text;
const send = props.controller.send;
const s = shallowRef(props.controller.getSnapshot());
onUnmounted(props.controller.subscribe(() => (s.value = props.controller.getSnapshot())));
const current = computed(() => customerPage(s.value, list));
const statusOf = (value: unknown) => list.statuses.find((x) => x.value === value)!;
const statusOptions = [
  { value: 'all', label: text.allStatuses },
  ...list.statuses.map(({ value, label }) => ({ value, label })),
];
const selectLabel = (row: TableRow) => text.select(row.name as string);
</script>

<template>
  <div class="mh-list">
    <form
      class="mh-list__filter"
      data-region="filter"
      role="search"
      @submit.prevent="send({ type: 'query' })"
    >
      <div class="mh-list__keyword">
        <Input
          name="keyword"
          :model-value="s.draft.keyword"
          :placeholder="text.keyword"
          :aria-label="text.keywordLabel"
          @update:model-value="(keyword: string) => send({ type: 'draft', patch: { keyword } })"
        />
      </div>
      <Select
        :model-value="s.draft.status"
        :options="statusOptions"
        :aria-label="text.status"
        :width="160"
        @update:model-value="
          (status: string) =>
            send({ type: 'draft', patch: { status: status as CustomerStatus | 'all' } })
        "
      />
      <div class="mh-list__range">
        <DateRange
          :model-value="s.draft.range"
          :placeholder="[text.rangeStart, text.rangeEnd]"
          :separator="text.rangeSeparator"
          :labels="[text.rangeStart, text.rangeEnd]"
          :aria-label="text.dateRange"
          @update:model-value="
            (range: [string, string] | null) => send({ type: 'draft', patch: { range } })
          "
        />
      </div>
      <div class="mh-list__filter-actions">
        <Button variant="primary" type="submit">{{ text.query }}</Button>
        <Button variant="secondary" @click="send({ type: 'reset' })">{{ text.reset }}</Button>
      </div>
    </form>
    <section class="mh-list__panel" :aria-label="text.table">
      <div class="mh-list__bar" data-region="toolbar">
        <template v-if="s.selected.length">
          <span>{{ text.selected(s.selected.length) }}</span>
          <Button variant="link" @click="send({ type: 'select', keys: [] })">{{
            text.clearSelection
          }}</Button>
        </template>
        <span v-else>{{ text.count(current.total) }}</span>
      </div>
      <div class="mh-list__table" data-region="table">
        <Table
          :columns="list.columns"
          :rows="current.rows"
          :selected="s.selected"
          :sort="s.sort"
          :loading="s.status === 'loading'"
          :select-label="selectLabel"
          :select-all-label="text.selectAll"
          :aria-label="text.table"
          @update:selected="(keys: string[]) => send({ type: 'select', keys })"
          @update:sort="(sort: TableSort | null) => send({ type: 'sort', sort })"
        >
          <template #cell="{ row, column }: { row: TableRow; column: { key: string } }">
            <span v-if="column.key === 'name'" class="mh-list__name">{{ row.name }}</span>
            <Tag v-else-if="column.key === 'status'" :tone="statusOf(row.status).tone">{{
              statusOf(row.status).label
            }}</Tag>
            <span v-else-if="column.key === 'amount'" class="mh-list__num">{{
              formatAmount(row.amount as number)
            }}</span>
            <Switch
              v-else-if="column.key === 'important'"
              :model-value="row.important as boolean"
              :aria-label="text.important(row.name as string)"
              @update:model-value="
                (value: boolean) => send({ type: 'important', key: row.key, value })
              "
            />
            <div v-else-if="column.key === 'actions'" class="mh-list__ops">
              <Button
                variant="link"
                :aria-label="text.editLabel(row.name as string)"
                @click="send({ type: 'edit', key: row.key })"
                >{{ text.edit }}</Button
              >
              <Button
                variant="link"
                :aria-label="text.followLabel(row.name as string)"
                @click="send({ type: 'action', key: `follow:${row.key}` })"
                >{{ text.follow }}</Button
              >
            </div>
            <template v-else>{{ row[column.key] }}</template>
          </template>
          <template #empty>
            <div v-if="s.status === 'error'" class="mh-list__empty" role="alert">
              <Icon name="alert" class="mh-list__empty-icon" />
              <p class="mh-list__empty-title">{{ text.errorTitle }}</p>
              <p class="mh-list__empty-desc">{{ text.errorDescription }}</p>
              <Button variant="link" @click="send({ type: 'retry' })">{{ text.retry }}</Button>
            </div>
            <div v-else class="mh-list__empty">
              <Icon name="inbox" class="mh-list__empty-icon" />
              <p class="mh-list__empty-title">{{ text.emptyTitle }}</p>
              <p class="mh-list__empty-desc">{{ text.emptyDescription }}</p>
              <Button variant="link" @click="send({ type: 'reset' })">{{ text.reset }}</Button>
            </div>
          </template>
        </Table>
      </div>
      <div v-if="current.total > 0" class="mh-list__pagination" data-region="pagination">
        <Pagination
          :page="current.page"
          :page-size="list.pageSize"
          :total="current.total"
          :total-text="text.total"
          :page-label="text.page"
          :prev-label="text.prev"
          :next-label="text.next"
          :aria-label="text.pagination"
          @update:page="(page: number) => send({ type: 'page', page })"
        />
      </div>
    </section>
    <CustomerDialog :controller="controller" />
  </div>
</template>
