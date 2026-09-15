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
    <i v-if="isFavorite" class="material-symbols-outlined material-fill agent-favorite-mark">star</i>
    <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
      <i class="material-symbols-outlined">{{ agent.icon }}</i>
    </div>
    <h4>{{ agent.name }}</h4>
    <p>{{ agent.painPoint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/stores/exploreStore'

defineProps<{
  agent: Agent
  rank?: number
  isFavorite?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
