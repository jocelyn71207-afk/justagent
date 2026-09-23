<template>
  <div class="explore-row" :class="{ 'explore-row--featured': featured }" @click="emit('click')">
    <div :class="['explore-row-icon', `agent-icon--${agent.colorKey}`]">
      <i class="material-symbols-outlined">{{ agent.icon }}</i>
    </div>
    <div class="explore-row-body">
      <p class="explore-row-question">{{ agent.painPoint }}</p>
      <div class="explore-row-meta">
        <span class="explore-row-name">{{ agent.name }}</span>
        <i v-if="isFavorite" class="material-symbols-outlined material-fill explore-row-star">star</i>
      </div>
    </div>
    <span v-if="badgeLabel" class="explore-row-badge">{{ badgeLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/stores/exploreStore'

defineProps<{
  agent: Agent
  featured?: boolean
  isFavorite?: boolean
  badgeLabel?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
