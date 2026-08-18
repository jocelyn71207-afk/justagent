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
      <div v-if="skill.description" class="skill-card-desc">{{ skill.description }}</div>
      <div class="skill-card-stats">
        <span class="sk-stat">
          <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
        </span>
        <!-- 從沒被觸發過就不顯示測試通過率/延遲——0% 會誤讀成「測試失敗」，
             其實只是還沒有真實流量可以算 -->
        <template v-if="skill.usageCount > 0">
          <span :class="['sk-stat', rateClass]">
            <i class="material-symbols-outlined">verified</i>{{ Math.round(skill.testPassRate * 100) }}%
          </span>
          <span class="sk-stat">
            <i class="material-symbols-outlined">timer</i>{{ skill.avgLatencyMs }}ms
          </span>
        </template>
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

const rateClass = computed(() =>
  props.skill.testPassRate >= 0.9 ? 'sk-stat--good'
  : props.skill.testPassRate >= 0.75 ? 'sk-stat--warn'
  : 'sk-stat--bad'
)

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
</script>
