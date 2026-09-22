<template>
  <div class="SkillTestAI">

    <!-- ① Idle / Generating -->
    <div v-if="store.aiTestIsGenerating" class="ai-idle">
      <div class="ai-idle-spinner">
        <span></span><span></span><span></span>
      </div>
      <p>AI 正在分析技能描述並生成測試情境...</p>
    </div>

    <div v-else-if="!store.aiTestScenarios.length" class="ai-idle">
      <i class="material-symbols-outlined ai-idle-icon">auto_awesome</i>
      <p class="ai-idle-hint">AI 將依技能描述自動產生 6–8 個測試案例</p>
      <button class="custom-btn custom-main-btn" @click="generate">
        <i class="material-symbols-outlined">play_circle</i>
        生成測試情境
      </button>
    </div>

    <!-- ② Scenarios：選擇題形式，AI 出題、使用者判斷該不該觸發 -->
    <template v-else>
      <div class="ai-toolbar">
        <div class="ai-toolbar-left">
          <span class="ai-progress-text">已作答 {{ answeredCount }} / {{ store.aiTestScenarios.length }}</span>
        </div>
        <button class="custom-btn" @click="regenerate">
          <i class="material-symbols-outlined">refresh</i>
          重新生成
        </button>
      </div>

      <div class="ai-scenarios">
        <div
          v-for="sc in store.aiTestScenarios"
          :key="sc.id"
          :class="['scenario-card', `status--${sc.status}`]"
        >
          <div class="scenario-header">
            <span :class="['scenario-tag', `tag--${sc.tag}`]">{{ tagLabel(sc.tag) }}</span>
            <div class="scenario-actions">
              <span v-if="sc.status === 'correct'" class="status-badge badge--pass">
                <i class="material-symbols-outlined">check_circle</i>答對了
              </span>
              <span v-else-if="sc.status === 'incorrect'" class="status-badge badge--fail">
                <i class="material-symbols-outlined">cancel</i>答錯了
              </span>
            </div>
          </div>

          <div class="scenario-input">{{ sc.input }}</div>
          <p class="scenario-question">這句話該不該觸發這顆技能？</p>

          <div v-if="sc.status === 'pending'" class="scenario-answer-btns">
            <button class="custom-btn custom-btn--sm" @click="answer(sc.id, true)">該觸發</button>
            <button class="custom-btn custom-btn--sm" @click="answer(sc.id, false)">不該觸發</button>
          </div>

          <div v-else :class="['result-judgment', sc.status === 'correct' ? 'judgment--pass' : 'judgment--fail']">
            <i class="material-symbols-outlined">
              {{ sc.status === 'correct' ? 'check_circle' : 'cancel' }}
            </i>
            <strong>{{ sc.status === 'correct' ? '答對了' : '答錯了' }}</strong>
            <span>正確答案是「{{ sc.expectedTrigger ? '該觸發' : '不該觸發' }}」。{{ sc.expectedBehavior }}</span>
          </div>
        </div>

        <!-- ③ Report -->
        <div v-if="store.aiTestReport" class="ai-report">
          <div class="report-header">
            <span class="report-title">測試報告</span>
            <span class="report-rate">
              {{ store.aiTestReport.correct }} / {{ store.aiTestReport.total }} 答對
              <em>（{{ ratePercent }}%）</em>
            </span>
          </div>
          <div class="report-by-tag">
            <div
              v-for="(label, tag) in TAG_LABELS"
              :key="tag"
              class="report-tag-row"
            >
              <span :class="['scenario-tag', `tag--${tag}`]">{{ label }}</span>
              <span class="tag-stat">
                {{ store.aiTestReport.byTag[tag as AITestTag].correct }}
                / {{ store.aiTestReport.byTag[tag as AITestTag].total }}
              </span>
              <i
                class="material-symbols-outlined tag-result-icon"
                :class="store.aiTestReport.byTag[tag as AITestTag].correct === store.aiTestReport.byTag[tag as AITestTag].total && store.aiTestReport.byTag[tag as AITestTag].total > 0 ? 'icon--pass' : 'icon--fail'"
              >
                {{ store.aiTestReport.byTag[tag as AITestTag].correct === store.aiTestReport.byTag[tag as AITestTag].total && store.aiTestReport.byTag[tag as AITestTag].total > 0 ? 'check_circle' : 'error' }}
              </i>
            </div>
          </div>
          <p class="report-summary">{{ store.aiTestReport.summary }}</p>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { AITestTag } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()

const TAG_LABELS: Record<AITestTag, string> = {
  normal: '正常流程',
  boundary: '邊界情況',
  trigger_edge: '觸發邊緣',
}

function tagLabel(tag: AITestTag): string {
  return TAG_LABELS[tag]
}

const answeredCount = computed(() =>
  store.aiTestScenarios.filter(s => s.status !== 'pending').length
)

const ratePercent = computed(() => {
  if (!store.aiTestReport || !store.aiTestReport.total) return 0
  return Math.round((store.aiTestReport.correct / store.aiTestReport.total) * 100)
})

function generate() {
  store.generateAITestScenarios(props.skillId)
}

function regenerate() {
  store.generateAITestScenarios(props.skillId)
}

function answer(scenarioId: string, userAnswer: boolean) {
  store.answerAITestScenario(props.skillId, scenarioId, userAnswer)
}
</script>
