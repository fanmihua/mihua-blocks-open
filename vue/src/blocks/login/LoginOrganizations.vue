<script setup lang="ts">
import { useLoginText } from '../../context';
import BackLink from './BackLink.vue';
import LoginHeader from './LoginHeader.vue';
import LoginNotice from './LoginNotice.vue';
import { useLoginState } from './useLogin';

const { snapshot, send } = useLoginState();
const t = useLoginText();
</script>

<template>
  <div class="mh-login__stack">
    <LoginHeader :title="t('org.title')" :subtitle="t('org.subtitle')" />
    <ul class="mh-orgs">
      <li v-for="org in snapshot.organizations" :key="org.id">
        <button
          type="button"
          class="mh-org"
          :aria-busy="snapshot.selectedOrganizationId === org.id && snapshot.status === 'loading'"
          @click="send({ type: 'organization', organizationId: org.id })"
        >
          <span class="mh-org__avatar">{{ org.name.slice(0, 1) }}</span>
          <span class="mh-org__name">{{ org.name }}</span>
          <span v-if="org.description" class="mh-org__meta">{{ org.description }}</span>
        </button>
      </li>
    </ul>
    <BackLink :label="t('action.back')" @click="send({ type: 'back' })" />
    <LoginNotice />
  </div>
</template>
