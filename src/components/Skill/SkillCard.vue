<template>
  <div
    :class="[
      'SkillCard',
      { 'is-extension': isExtension },
      { 'is-standalone': isExtension && !skill.forkSourceId },
      { 'is-disabled': !skill.isEnabled },
    ]"
    @click="emit('click', skill)"
  >
    <div :class="['skill-card-icon', scopeIconClass]">
      <i class="material-symbols-outlined">{{ isExtension ? 'extension' : 'psychology' }}</i>
    </div>

    <div class="skill-card-body">
      <div class="skill-card-name">
        {{ skill.name }}
        <span class="skill-tag tag--version">v{{ skill.version }}</span>
      </div>
      <div v-if="cardDesc" class="skill-card-desc">{{ cardDesc }}</div>
      <div class="skill-card-stats">
        <span class="sk-stat">
          <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
        </span>
      </div>
    </div>

    <div class="skill-card-right">
      <div class="skill-card-meta">
        <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : '已停用' }}</span>
      </div>
      <div class="skill-card-actions" @click.stop>
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

const props = withDefaults(defineProps<{
  skill: Skill
  isExtension?: boolean
}>(), {
  isExtension: false,
})

const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  duplicate: [skill: Skill]
}>()

// 圖示配色改為跟著技能的分類（系統／企業／團隊）走，跟 Library 技能庫的分類標籤配色一致，
// 不再只是依 isExtension 分兩色。
const scopeIconClass = computed(() => {
  if (props.skill.scope === 'enterprise') return 'icon--enterprise'
  if (props.skill.scope === 'team') return 'icon--team'
  return 'icon--system'
})

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// 用第一筆使用情境的標題取代原本的技能描述，讓卡片一眼看出「什麼時候會用到」
// 而不是技能本身的功能說明；沒有使用情境的技能（例如剛手動建立的）才退回顯示描述
const cardDesc = computed(() => props.skill.usageScenarios?.[0]?.title || props.skill.description)
</script>
