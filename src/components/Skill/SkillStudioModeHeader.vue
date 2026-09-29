<template>
  <div class="banner-title-row">
    <div class="banner-title">{{ props.mode === 'create' ? '新增技能' : '修改技能' }}</div>
    <span :class="['ssc-mode-chip', `ssc-mode-chip--${props.mode}`]">
      <i class="material-symbols-outlined">{{ props.mode === 'create' ? 'auto_fix_high' : 'person' }}</i>
      {{ props.mode === 'create' ? '建立新技能' : `修改：${props.skillName}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { StudioMode } from '@/composables/useSkillStudioConversation'

const props = defineProps<{ mode: StudioMode; skillName: string }>()
</script>
