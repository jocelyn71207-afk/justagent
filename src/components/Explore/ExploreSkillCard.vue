<template>
  <div class="explore-row" @click="emit('click')">
    <div :class="['explore-row-icon', `agent-icon--${visual.colorKey}`]">
      <i class="material-symbols-outlined">{{ visual.icon }}</i>
    </div>
    <div class="explore-row-body">
      <p class="explore-row-question">{{ capabilityText }}</p>
      <div class="explore-row-meta">
        <span class="explore-row-name">{{ skill.name }}</span>
        <span v-if="skill.functionType" class="explore-row-tag">{{ skill.functionType }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { getSkillVisual } from '@/stores/exploreStore'

const props = defineProps<{
  skill: Skill
}>()

const emit = defineEmits<{
  click: []
}>()

const visual = computed(() => getSkillVisual(props.skill.functionType))
const capabilityText = computed(() => props.skill.capabilities?.[0]?.description ?? props.skill.description)
</script>
