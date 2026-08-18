<template>
  <!-- 沿用 SkillCard 的視覺語言（圖示/內文/統計列/狀態），不再是只有一行文字的
       陽春清單——「我的技能」是這頁最常用的分頁，卻是全頁面資訊量最少的地方，
       skillStore 裡其實有 description/usageCount/testPassRate/avgLatencyMs
       這些資料，原本完全沒有用上 -->
  <!-- 注意：不套用 SkillCard 的 .is-disabled（opacity 0.45 + pointer-events:none）——
       那是給 Library 技能「不可用/不可互動」用的。個人技能的「停用中」只是開關
       關閉，使用者仍然要能點進來管理／重新啟用，用右側的狀態文字表達就夠了 -->
  <div class="PersonalSkillGroup SkillCard" @click="emit('manage', skill)">
    <div class="skill-card-icon icon--personal">
      <i class="material-symbols-outlined">person</i>
    </div>

    <div class="skill-card-body">
      <div class="skill-card-name">
        {{ skill.name }}
        <span class="skill-tag tag--version">v{{ skill.version }}</span>
        <span v-if="statusLabel" :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
      </div>
      <div v-if="skill.description" class="skill-card-desc">{{ skill.description }}</div>
      <div class="skill-card-stats">
        <span class="sk-stat">
          <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
        </span>
        <!-- 從沒被觸發過的草稿沒有真實的測試數據，顯示「0%」會誤讀成測試失敗，
             不如不顯示 -->
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
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : '停用中' }}</span>
      </div>
      <i class="material-symbols-outlined psg-arrow">chevron_right</i>
    </div>
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

// 跟 SkillCard.vue 同一套判斷邏輯：測試通過率分級上色、觸發次數超過千次縮寫成 k
const rateClass = computed(() =>
  props.skill.testPassRate >= 0.9 ? 'sk-stat--good'
  : props.skill.testPassRate >= 0.75 ? 'sk-stat--warn'
  : 'sk-stat--bad'
)
function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
</script>
