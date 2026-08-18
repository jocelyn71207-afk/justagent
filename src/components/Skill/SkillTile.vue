<template>
  <!-- Library 技能庫改成卡片式目錄（多欄格狀），這張是格狀用的直式磚塊，
       跟 SkillCard（橫向長條，「我的技能」清單用）不是同一種版面，
       所以獨立一個元件，不硬掛在 SkillCard 上疊加修飾字 -->
  <div :class="['SkillTile', { 'is-disabled': !skill.isEnabled }]" @click="emit('click', skill)">
    <div :class="['tile-icon', scopeIconClass]">
      <i class="material-symbols-outlined">psychology</i>
    </div>

    <div class="tile-name">
      {{ skill.name }}
      <span class="skill-tag tag--version">v{{ skill.version }}</span>
    </div>
    <div class="tile-scope">{{ scopeLabel }}</div>
    <div v-if="skill.description" class="tile-desc">{{ skill.description }}</div>

    <div class="tile-stats">
      <span class="sk-stat">
        <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
      </span>
    </div>

    <div class="tile-foot">
      <div class="tile-meta">
        <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : '已停用' }}</span>
      </div>
      <div class="tile-actions" @click.stop>
        <button
          class="custom-btn skill-action-btn skill-action-btn--icon"
          title="複製至草稿"
          @click="emit('duplicate', skill)"
        >
          <i class="material-symbols-outlined">content_copy</i>
        </button>
        <button class="custom-btn skill-action-btn" @click="emit('test', skill)">測試</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill }>()
const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  duplicate: [skill: Skill]
}>()

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

const scopeIconClass = computed(() => {
  if (props.skill.scope === 'enterprise') return 'icon--enterprise'
  if (props.skill.scope === 'team') return 'icon--team'
  return 'icon--system'
})

const scopeLabel = computed(() => {
  if (props.skill.scope === 'enterprise') return '企業技能'
  if (props.skill.scope === 'team') return `團隊技能${props.skill.teamName ? '（' + props.skill.teamName + '）' : ''}`
  return '系統技能'
})
</script>
