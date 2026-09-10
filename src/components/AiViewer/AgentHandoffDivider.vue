<template>
  <div class="agent-handoff-divider">
    <span class="ahd-side" :class="fromMeta.tag">
      <i class="material-symbols-outlined">{{ fromMeta.icon }}</i>{{ fromMeta.name }}
    </span>
    <i class="material-symbols-outlined ahd-arrow">arrow_forward</i>
    <span class="ahd-side" :class="toMeta.tag">
      <i class="material-symbols-outlined">{{ toMeta.icon }}</i>{{ toMeta.name }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { agentPersonaMeta, type AgentKey } from '@/utils/agentPersona'

const props = defineProps<{
  from: AgentKey
  to: AgentKey
}>()

const fromMeta = computed(() => agentPersonaMeta(props.from))
const toMeta = computed(() => agentPersonaMeta(props.to))
</script>
