<template>
  <!-- 跟 Library 瀏覽 Modal／管理區的 Library 現有技能管理同一套卡片式目錄
       語言（掛 SkillTile class 直接沿用格狀磚塊樣式），整個技能管理頁
       不管在哪個分頁都是一致的瀏覽體驗。個人技能的操作（編輯/測試/複製/
       送審）都在點進去之後的詳情 drawer 裡，磚塊本身不需要重複放操作按鈕 -->
  <div class="PersonalSkillGroup SkillTile" @click="emit('manage', skill)">
    <div class="tile-icon icon--personal">
      <i class="material-symbols-outlined">{{ skillIconName }}</i>
    </div>

    <div class="tile-name">
      {{ skill.name }}
      <span v-if="statusLabel" :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
    </div>
    <div v-if="tileDesc" class="tile-desc">{{ tileDesc }}</div>

    <div class="tile-stats">
      <span class="sk-stat">
        <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
      </span>
    </div>

    <div class="tile-foot">
      <div class="tile-meta">
        <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : (skill.aiTestPassRate == null ? '尚未測試' : '停用中') }}</span>
      </div>
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

// has_library（已核准並發布至 Library）不顯示標籤——這只是後台狀態，
// 畫面上不用特別標出來，personalStatus 本身跟送審層級鎖定邏輯不受影響
const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'draft') return '草稿'
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  return null
})

const statusTagClass = computed(() => {
  if (props.skill.personalStatus === 'draft') return 'tag--draft'
  if (props.skill.personalStatus === 'reviewing') return 'tag--reviewing'
  return ''
})

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// 用「AI 賦能」建立的技能，圖示換成建立方式本身（跟 SkillMethodChooser 選卡同一組
// icon：對話 forum／積木 dashboard_customize），一眼看出這顆技能怎麼來的；
// 其他個人技能（手寫建立、複製副本）維持原本的 person
const skillIconName = computed(() => {
  if (props.skill.composition) return 'dashboard_customize'
  if (props.skill.creationMethod === 'ai_assisted') return 'forum'
  return 'person'
})

// 用第一筆使用情境的標題取代原本的技能描述，讓卡片一眼看出「什麼時候會用到」
// 而不是技能本身的功能說明；沒有使用情境的技能（例如剛手動建立的）才退回顯示描述
const tileDesc = computed(() => props.skill.usageScenarios?.[0]?.title || props.skill.description)
</script>
