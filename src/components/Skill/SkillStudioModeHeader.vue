<template>
  <div class="banner-title-row">
    <div class="banner-title">{{ props.title ?? (props.mode === 'create' ? '新增技能' : '修改技能') }}</div>
    <span :class="['ssc-mode-chip', `ssc-mode-chip--${props.mode}`]">
      <i class="material-symbols-outlined">{{ props.mode === 'create' ? 'auto_fix_high' : 'person' }}</i>
      {{ props.mode === 'create' ? '建立新技能' : `修改：${props.skillName}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { StudioMode } from '@/composables/useSkillStudioConversation'

// title：呼叫端想蓋掉預設標題時才給（例如 AI 建議建立的技能打開時已有預填草稿，標題用「編輯技能」）
const props = defineProps<{ mode: StudioMode; skillName: string; title?: string }>()
</script>
