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
    <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
      <i class="material-symbols-outlined">{{ agent.icon }}</i>
    </div>
    <h4>{{ agent.name }}</h4>
    <p>{{ agent.painPoint }}</p>
  </div>
</template>

<script setup lang="ts">
// colorKey 對應 src/scss/base/_theme.scss 裡的 --tag-*-bg/text token（light/dark 都有定義）
type ColorKey = 'violet' | 'blue' | 'amber' | 'teal' | 'green' | 'rust' | 'rose'

interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

interface Agent {
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
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
