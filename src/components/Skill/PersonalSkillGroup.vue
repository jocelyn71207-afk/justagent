<template>
  <!-- 跟 Library 瀏覽 Modal／管理區的 Library 現有技能管理同一套卡片式目錄
       語言（掛 SkillTile class 直接沿用格狀磚塊樣式），整個技能管理頁
       不管在哪個分頁都是一致的瀏覽體驗。個人技能的操作（編輯/測試/複製/
       送審）都在點進去之後的詳情 drawer 裡，磚塊本身不需要重複放操作按鈕 -->
  <div class="PersonalSkillGroup SkillTile" @click="emit('manage', skill)">
    <div class="tile-icon icon--personal">
      <i class="material-symbols-outlined">person</i>
    </div>

    <div class="tile-name">
      {{ skill.name }}
      <span v-if="statusLabel" :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
    </div>
    <div v-if="skill.description" class="tile-desc">{{ skill.description }}</div>

    <div class="tile-stats">
      <span class="sk-stat">
        <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }} 次觸發
      </span>
    </div>

    <div class="tile-foot">
      <div class="tile-meta">
        <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : '停用中' }}</span>
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

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
</script>
