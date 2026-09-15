<template>
  <div class="skill-suggest-card" :class="`skill-suggest-card--${props.stage}`">
    <!-- ask：只問要不要，卡片本體先不出現 -->
    <template v-if="props.stage === 'ask'">
      <p class="ssg-ask">
        我留意到「{{ props.suggestion.reason }}」這類流程你之後可能會重複用到。要不要我把它建立成你的個人技能？
      </p>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" data-action="skill-suggest-build" :data-id="props.suggestion.id">是，建立成個人技能</span>
        <span class="conv1-quick-btn" data-action="skill-suggest-skip" :data-id="props.suggestion.id">不用了</span>
      </div>
    </template>

    <!-- preview：讓使用者確認設定 -->
    <template v-else-if="props.stage === 'preview'">
      <p class="ssg-lead">好的，我先整理這個流程的設定，請確認以下內容：</p>
      <div class="ssg-card">
        <span class="ssg-icon material-symbols-outlined">extension</span>
        <div class="ssg-card-body">
          <div class="ssg-name">{{ props.suggestion.name }}</div>
          <div class="ssg-row"><span class="ssg-label">觸發條件</span>{{ props.suggestion.triggerHint }}</div>
          <div class="ssg-row">
            <span class="ssg-label">執行步驟</span>
            <ol class="ssg-steps">
              <li v-for="(step, i) in props.suggestion.steps" :key="i" class="ssg-step">{{ step }}</li>
            </ol>
          </div>
        </div>
      </div>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" data-action="skill-suggest-confirm" :data-id="props.suggestion.id">確認並建立</span>
      </div>
    </template>

    <!-- saved：已寫入 skillStore -->
    <template v-else-if="props.stage === 'saved'">
      <p class="ssg-lead">✅ 已建立個人技能「{{ props.suggestion.name }}」，目前只有你可以使用。</p>
      <div class="ssg-links">
        <span class="ssg-link" data-action="goto-skill-studio" :data-value="props.skillId">
          <i class="material-symbols-outlined">auto_fix_high</i>到 AI 賦能 調整與測試
        </span>
        <span class="ssg-link" data-action="goto-skill-management">
          <i class="material-symbols-outlined">auto_awesome</i>到技能管理
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
// 「建議建立成個人技能」卡片，純呈現：三個階段的內容都由 stage 決定，
// 按鈕不 emit、只掛 data-action／data-id，交給 AiViewerRightBox 的
// handleChatAreaClick 事件委派（跟 .conv1-quick-btn／DelegateStatusCard 同一套機制）
import type { SkillSuggestion, SkillSuggestStage } from '@/composables/useSkillSuggestion'

const props = defineProps<{
  suggestion: SkillSuggestion
  stage: SkillSuggestStage
  skillId?: string
}>()
</script>
