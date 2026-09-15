<template>
  <div class="explore-skill-card lively-card" @click="emit('click')">
    <div :class="['agent-icon', `agent-icon--${visual.colorKey}`]">
      <i class="material-symbols-outlined">{{ visual.icon }}</i>
    </div>
    <span v-if="skill.functionType" class="skill-function-badge">{{ skill.functionType }}</span>
    <h4>{{ skill.name }}</h4>
    <p>{{ capabilityText }}</p>
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
