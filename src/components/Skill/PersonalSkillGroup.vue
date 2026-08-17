<template>
  <div class="PersonalSkillGroup" @click="emit('manage', skill)">
    <i class="material-symbols-outlined psg-icon">person</i>
    <span class="psg-name">{{ skill.name }}</span>
    <span v-if="statusLabel" :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
    <span class="psg-status">
      <span :class="['psg-status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
      {{ skill.isEnabled ? '啟用中' : '停用中' }}
    </span>
    <i class="material-symbols-outlined psg-arrow">chevron_right</i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill }>()
const emit = defineEmits<{
  manage: [skill: Skill]
}>()

const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'draft') return '草稿'
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  if (props.skill.personalStatus === 'has_library') {
    const scope = props.skill.targetScope
    if (scope === 'team') return `已有Library版（團隊・${props.skill.targetTeamName ?? '未指定團隊'}）`
    if (scope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return null
})

const statusTagClass = computed(() => {
  if (props.skill.personalStatus === 'draft') return 'tag--draft'
  if (props.skill.personalStatus === 'reviewing') return 'tag--reviewing'
  if (props.skill.personalStatus === 'has_library') return 'tag--has-library'
  return ''
})
</script>
