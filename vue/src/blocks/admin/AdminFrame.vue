<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useSlots } from 'vue';
import { breadcrumbOf, type AdminController } from '@mihua/core';
import '@mihua/core/styles/admin.css';
import { useKit } from '../../context';
import { Icon } from '../../icon';

/**
 * 后台页面框架（Vue）：顶栏、可收起的侧栏、内容区（面包屑 + 页头 + 内容）。
 * 结构和文案来自 @mihua/core 的 ADMIN_FRAME，布局来自 admin.css，和 React 那份（AdminFrame.tsx）一样；
 * 导航菜单、面包屑、下拉菜单、头像、徽标、按钮全部来自套件（useKit），换组件库这里一行不改。
 * 默认插槽是内容区，不给就显示一个占位；点了页头的操作按钮触发 action(key)。
 */
const props = defineProps<{ controller: AdminController }>();
/** 点了页头的操作按钮（比如「新建客户」），内容区的页面要接着做什么。 */
const emit = defineEmits<{ action: [key: string] }>();
const slots = useSlots();
const { NavMenu, Breadcrumb, Dropdown, Avatar, Badge, Button } = useKit();
const frame = props.controller.frame;
const send = props.controller.send;
const s = shallowRef(props.controller.getSnapshot());
onUnmounted(props.controller.subscribe(() => (s.value = props.controller.getSnapshot())));
const page = computed(() => frame.pages[s.value.selected] ?? { title: '', description: '' });
const trail = computed(() => breadcrumbOf(frame, s.value.selected));
</script>

<template>
  <div class="mh-admin" :data-collapsed="s.collapsed || undefined">
    <header class="mh-admin__header" data-region="header">
      <div class="mh-admin__brand">
        <span class="mh-admin__mark" aria-hidden="true">{{ frame.brand.mark }}</span>
        <span class="mh-admin__name">{{ frame.brand.name }}</span>
      </div>
      <div class="mh-admin__tools">
        <button
          type="button"
          class="mh-admin__icon-btn"
          :aria-label="frame.text.notifications(frame.unread)"
        >
          <Badge :count="frame.unread"><Icon name="bell" /></Badge>
        </button>
        <Dropdown
          :items="frame.userMenu"
          :aria-label="frame.text.userMenu"
          @select="(key: string) => send({ type: 'action', key })"
        >
          <!-- 名字写在按钮上：头像里的字不算进按钮的名字 -->
          <button type="button" class="mh-admin__user" :aria-label="frame.user.name">
            <Avatar :text="frame.user.avatar" />
            <span>{{ frame.user.name }}</span>
            <Icon name="chevron-down" class="mh-admin__caret" />
          </button>
        </Dropdown>
      </div>
    </header>
    <div class="mh-admin__body">
      <aside class="mh-admin__sider" data-region="sider">
        <div class="mh-admin__nav">
          <NavMenu
            :items="frame.nav"
            :selected="s.selected"
            :open="s.open"
            :collapsed="s.collapsed"
            :aria-label="frame.text.nav"
            @update:selected="(key: string) => send({ type: 'select', key })"
            @update:open="(keys: string[]) => send({ type: 'open', keys })"
          />
        </div>
        <div class="mh-admin__sider-foot">
          <button
            type="button"
            class="mh-admin__icon-btn"
            :aria-label="s.collapsed ? frame.text.expand : frame.text.collapse"
            @click="send({ type: 'collapse', collapsed: !s.collapsed })"
          >
            <Icon :name="s.collapsed ? 'sidebar-expand' : 'sidebar-collapse'" />
          </button>
        </div>
      </aside>
      <main class="mh-admin__main">
        <div data-region="breadcrumb">
          <Breadcrumb
            :items="trail"
            :aria-label="frame.text.breadcrumb"
            @navigate="(key: string) => send({ type: 'select', key })"
          />
        </div>
        <div class="mh-admin__page-head" data-region="page-head">
          <div>
            <h1 class="mh-admin__title">{{ page.title }}</h1>
            <p class="mh-admin__desc">{{ page.description }}</p>
          </div>
          <div class="mh-admin__actions">
            <Button
              v-for="action in frame.actions"
              :key="action.key"
              :variant="action.variant"
              @click="
                send({ type: 'action', key: action.key });
                emit('action', action.key);
              "
              >{{ action.label }}</Button
            >
          </div>
        </div>
        <div
          class="mh-admin__content"
          data-region="content"
          :data-placeholder="slots.default ? undefined : ''"
        >
          <slot>{{ frame.text.placeholder(page.title) }}</slot>
        </div>
      </main>
    </div>
  </div>
</template>
