<template>
  <div class="skill-suggest-card" :class="`skill-suggest-card--${props.stage}`">
    <!-- ask：只問要不要 -->
    <template v-if="props.stage === 'ask'">
      <p class="ssg-ask">
        我留意到「{{ props.suggestion.reason }}」這類流程你之後可能會重複用到。要不要我把它建立成你的個人技能？
      </p>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" :data-action="SKILL_SUGGEST_ACTIONS.build" :data-id="props.suggestion.id">是，建立成個人技能</span>
        <span class="conv1-quick-btn" :data-action="SKILL_SUGGEST_ACTIONS.skip" :data-id="props.suggestion.id">不用了</span>
      </div>
    </template>

    <!-- placed：block 已在畫布上，確認與儲存都在 block 內做 -->
    <template v-else-if="props.stage === 'placed'">
      <p class="ssg-lead">已在畫布放上「{{ props.suggestion.name }}」的技能建立工具，設定先幫你填好了，確認後在區塊裡按「儲存為個人技能」。</p>
      <div class="ssg-links">
        <span class="ssg-link" data-action="pan-to-block" :data-value="props.blockId">
          <i class="material-symbols-outlined">my_location</i>前往區塊
        </span>
      </div>
    </template>

    <!-- 其他 stage：只留名稱，不給任何按鈕 -->
    <template v-else>
      <div class="ssg-name">{{ props.suggestion.name }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 「建議建立成個人技能」卡片，純呈現：按鈕不 emit、只掛 data-action／data-id／data-value，
// 交給 AiViewerRightBox 的 handleChatAreaClick 事件委派
import { SKILL_SUGGEST_ACTIONS } from '@/composables/useSkillSuggestion'
import type { SkillSuggestion, SkillSuggestStage } from '@/composables/useSkillSuggestion'

const props = defineProps<{
  suggestion: SkillSuggestion
  stage: SkillSuggestStage
  blockId?: string
}>()
</script>
