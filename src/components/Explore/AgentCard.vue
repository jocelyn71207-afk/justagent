<template>
  <div
    :class="[
      'agent-card-unit',
      'lively-card',
      rank !== undefined ? `podium-card podium-card--rank-${rank}` : 'agent-card',
    ]"
    @click="emit('click')"
  >
    <div v-if="rank !== undefined" class="rank-badge">{{ rank }}</div>
    <span
      v-else-if="agent.badge"
      :class="['agent-badge', `agent-badge--${agent.badge.type}`]"
    >
      {{ agent.badge.label }}
    </span>
    <div class="agent-icon" :style="{ background: agent.bgColor }">
      <i class="material-symbols-outlined" :style="{ color: agent.accentColor }">{{ agent.icon }}</i>
    </div>
    <h4>{{ agent.name }}</h4>
    <p>{{ agent.painPoint }}</p>
  </div>
</template>

<script setup lang="ts">
interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

interface Agent {
  name: string
  desc: string
  painPoint: string
  icon: string
  bgColor: string
  accentColor: string
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

defineProps<{
  agent: Agent
  rank?: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
