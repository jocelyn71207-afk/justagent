<template>
  <div class="se-agent-grid lively-stagger">
    <button
      v-for="agent in AVAILABLE_AGENTS"
      :key="agent"
      type="button"
      :class="['se-agent-chip', 'lively-card', { 'is-selected': props.modelValue.includes(agent) }]"
      @click="toggleAgent(agent)"
    >
      <i class="material-symbols-outlined">smart_toy</i>
      {{ agent }}
      <i v-if="props.modelValue.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
    </button>
  </div>
</template>

<script setup lang="ts">
// 指派 Agent 的 chip 選擇器：原本分別寫在 SkillEditor.vue 與積木流程的
// 基本設定表單，抽成共用元件避免同一套 markup 重複兩份
import { AVAILABLE_AGENTS } from '@/stores/skillStore'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [agents: string[]] }>()

function toggleAgent(agent: string) {
  const idx = props.modelValue.indexOf(agent)
  const next = [...props.modelValue]
  if (idx === -1) next.push(agent)
  else next.splice(idx, 1)
  emit('update:modelValue', next)
}
</script>
