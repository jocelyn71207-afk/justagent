<template>
  <div class="explore-skill-card lively-card" @click="emit('click')">
    <span v-if="skill.badge" :class="['agent-badge', `agent-badge--${skill.badge.type}`]">
      {{ skill.badge.label }}
    </span>
    <div class="agent-icon" :style="{ background: skill.bgColor }">
      <i class="material-symbols-outlined" :style="{ color: skill.accentColor }">{{ skill.icon }}</i>
    </div>
    <span class="skill-function-badge">{{ skill.functionType }}</span>
    <h4>{{ skill.name }}</h4>
    <p>{{ skill.capability }}</p>
  </div>
</template>

<script setup lang="ts">
interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

interface ExploreSkill {
  name: string
  functionType: SkillFunctionType
  capability: string
  icon: string
  bgColor: string
  accentColor: string
  badge?: AgentBadge
}

defineProps<{
  skill: ExploreSkill
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
