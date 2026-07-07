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

    <!-- ② Scenarios -->
    <template v-else>
      <div class="ai-toolbar">
        <div class="ai-toolbar-left">
          <button
            class="custom-btn"
            :disabled="store.aiTestIsRunning || allDone"
            @click="runAll"
          >
            <i class="material-symbols-outlined">rocket_launch</i>
            全部執行
          </button>
          <div v-if="store.aiTestIsRunning" class="ai-progress">
            <span class="ai-progress-text">{{ completedCount }} / {{ store.aiTestScenarios.length }}</span>
            <div class="ai-progress-bar">
              <div class="ai-progress-fill" :style="{ width: progressPct + '%' }"></div>
            </div>
          </div>
        </div>
        <button
          class="custom-btn"
          :disabled="store.aiTestIsRunning"
          @click="regenerate"
        >
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
              <button
                v-if="sc.status === 'pending'"
                class="custom-btn custom-btn--sm"
                :disabled="store.aiTestIsRunning"
                @click="runOne(sc.id)"
              >
                執行
              </button>
              <span v-else-if="sc.status === 'running'" class="status-badge badge--running">
                <span class="spinner-dot"></span><span class="spinner-dot"></span><span class="spinner-dot"></span>
              </span>
              <span v-else-if="sc.status === 'pass'" class="status-badge badge--pass">
                <i class="material-symbols-outlined">check_circle</i>通過
              </span>
              <span v-else-if="sc.status === 'fail'" class="status-badge badge--fail">
                <i class="material-symbols-outlined">cancel</i>失敗
              </span>
            </div>
          </div>

          <div class="scenario-input">{{ sc.input }}</div>
          <div class="scenario-expected">{{ sc.expectedBehavior }}</div>

          <div v-if="sc.agentReply" class="scenario-result">
            <div class="result-reply">
              <span class="result-label">Agent 回覆</span>
              <span :class="['reply-text', { 'is-expanded': expanded.has(sc.id) }]">
                {{ sc.agentReply }}
              </span>
              <button
                v-if="!expanded.has(sc.id)"
                class="expand-btn"
                @click="expand(sc.id)"
              >展開</button>
            </div>
            <div :class="['result-judgment', sc.status === 'pass' ? 'judgment--pass' : 'judgment--fail']">
              <i class="material-symbols-outlined">
                {{ sc.status === 'pass' ? 'check_circle' : 'cancel' }}
              </i>
              <strong>{{ sc.status === 'pass' ? '通過' : '失敗' }}</strong>
              <span>{{ sc.aiJudgment }}</span>
            </div>
          </div>
        </div>

        <!-- ③ Report -->
        <div v-if="store.aiTestReport" class="ai-report">
          <div class="report-header">
            <span class="report-title">測試報告</span>
            <span class="report-rate">
              {{ store.aiTestReport.passed }} / {{ store.aiTestReport.total }}
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
                {{ store.aiTestReport.byTag[tag as AITestTag].passed }}
                / {{ store.aiTestReport.byTag[tag as AITestTag].total }}
              </span>
              <i
                class="material-symbols-outlined tag-result-icon"
                :class="store.aiTestReport.byTag[tag as AITestTag].passed === store.aiTestReport.byTag[tag as AITestTag].total && store.aiTestReport.byTag[tag as AITestTag].total > 0 ? 'icon--pass' : 'icon--fail'"
              >
                {{ store.aiTestReport.byTag[tag as AITestTag].passed === store.aiTestReport.byTag[tag as AITestTag].total && store.aiTestReport.byTag[tag as AITestTag].total > 0 ? 'check_circle' : 'error' }}
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
import { computed, ref } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { AITestTag } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()

const expanded = ref(new Set<string>())

const TAG_LABELS: Record<AITestTag, string> = {
  normal: '正常流程',
  boundary: '邊界情況',
  trigger_edge: '觸發邊緣',
}

function tagLabel(tag: AITestTag): string {
  return TAG_LABELS[tag]
}

const completedCount = computed(() =>
  store.aiTestScenarios.filter(s => s.status === 'pass' || s.status === 'fail').length
)

const progressPct = computed(() =>
  store.aiTestScenarios.length
    ? Math.round((completedCount.value / store.aiTestScenarios.length) * 100)
    : 0
)

const allDone = computed(() =>
  store.aiTestScenarios.length > 0 &&
  store.aiTestScenarios.every(s => s.status === 'pass' || s.status === 'fail')
)

const ratePercent = computed(() => {
  if (!store.aiTestReport) return 0
  return Math.round((store.aiTestReport.passed / store.aiTestReport.total) * 100)
})

function generate() {
  store.generateAITestScenarios(props.skillId)
}

function regenerate() {
  expanded.value.clear()
  store.generateAITestScenarios(props.skillId)
}

function runAll() {
  store.runAllAITests(props.skillId)
}

function runOne(scenarioId: string) {
  store.runSingleAITest(props.skillId, scenarioId)
}

function expand(id: string) {
  expanded.value = new Set([...expanded.value, id])
}
</script>
