<template>
  <div class="SkillTestAI">

    <!-- ① idle: 待生成 -->
    <div v-if="isIdle" class="ai-idle">
      <i class="material-symbols-outlined ai-idle-icon">science</i>
      <p class="ai-idle-text">AI 將依技能描述自動產生 6–8 個測試案例</p>
      <button class="btn-primary" @click="store.generateAITestScenarios(props.skillId)">
        生成測試情境
      </button>
    </div>

    <!-- ② generating: 生成中 -->
    <div v-else-if="store.aiTestIsGenerating" class="ai-loading">
      <span class="ai-spinner"></span>
      <p class="ai-loading-text">正在生成測試情境...</p>
    </div>

    <!-- ③ scenarios: 情境列表 -->
    <div v-else class="ai-scenarios-wrap">

      <!-- 工具列 -->
      <div class="ai-toolbar">
        <button
          class="btn-primary"
          :disabled="store.aiTestIsRunning || allDone"
          @click="handleRunAll"
        >
          全部執行
        </button>

        <span v-if="store.aiTestIsRunning" class="ai-progress">
          {{ completedCount }} / {{ store.aiTestScenarios.length }} 完成
        </span>

        <button
          class="btn-secondary ai-regen-btn"
          :disabled="store.aiTestIsRunning"
          @click="handleRegenerate"
        >
          重新生成
        </button>
      </div>

      <!-- 情境卡片列表 -->
      <div class="ai-scenario-list">
        <div
          v-for="scenario in store.aiTestScenarios"
          :key="scenario.id"
          :class="['ai-scenario-card', `card--${scenario.status}`]"
        >
          <div class="ai-card-header">
            <span :class="['ai-tag', `tag--${scenario.tag}`]">{{ tagLabel(scenario.tag) }}</span>
            <div class="ai-card-actions">
              <button
                v-if="scenario.status === 'pending'"
                class="btn-sm btn-secondary"
                @click="store.runSingleAITest(props.skillId, scenario.id)"
              >
                執行
              </button>
              <span v-else-if="scenario.status === 'running'" class="ai-spinner ai-spinner--sm"></span>
              <span v-else-if="scenario.status === 'pass'" class="ai-status-icon status--pass">
                <i class="material-symbols-outlined">check_circle</i>
              </span>
              <span v-else-if="scenario.status === 'fail'" class="ai-status-icon status--fail">
                <i class="material-symbols-outlined">cancel</i>
              </span>
            </div>
          </div>

          <div class="ai-card-body">
            <div class="ai-field">
              <span class="ai-field-label">輸入</span>
              <span class="ai-field-value">{{ scenario.input }}</span>
            </div>
            <div class="ai-field">
              <span class="ai-field-label">預期行為</span>
              <span class="ai-field-value ai-field-expected">{{ scenario.expectedBehavior }}</span>
            </div>
          </div>

          <!-- 結果區塊 -->
          <div v-if="scenario.status === 'pass' || scenario.status === 'fail'" class="ai-result">
            <div class="ai-result-row">
              <span class="ai-result-label">Agent 回覆</span>
              <span class="ai-result-reply">{{ scenario.agentReply }}</span>
            </div>
            <div class="ai-result-row">
              <span class="ai-result-label">AI 判斷</span>
              <span :class="['ai-judgment', scenario.status === 'pass' ? 'judgment--pass' : 'judgment--fail']">
                <i class="material-symbols-outlined">{{ scenario.status === 'pass' ? 'check' : 'close' }}</i>
                {{ scenario.status === 'pass' ? '通過' : '失敗' }}
                <span class="ai-judgment-detail"> — {{ scenario.aiJudgment }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 報告卡片 -->
      <div v-if="store.aiTestReport" class="ai-report-card">
        <div class="ai-report-header">
          <span class="ai-report-title">整體測試報告</span>
          <span class="ai-report-rate">
            {{ store.aiTestReport.passed }} / {{ store.aiTestReport.total }}
            （{{ Math.round((store.aiTestReport.passed / store.aiTestReport.total) * 100) }}%）
          </span>
        </div>

        <table class="ai-report-table">
          <thead>
            <tr>
              <th>類別</th>
              <th>通過/總計</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[tagKey, counts] in reportRows" :key="tagKey">
              <td>{{ tagLabel(tagKey as AITestTag) }}</td>
              <td>{{ counts.passed }} / {{ counts.total }}</td>
              <td>
                <i
                  :class="['material-symbols-outlined', 'report-status-icon',
                    counts.passed === counts.total ? 'status--pass' : 'status--fail']"
                >
                  {{ counts.passed === counts.total ? 'check_circle' : 'cancel' }}
                </i>
              </td>
            </tr>
          </tbody>
        </table>

        <p class="ai-report-summary">{{ store.aiTestReport.summary }}</p>

        <!-- 過往記錄 -->
        <div v-if="testHistory.length" class="ai-history">
          <button class="ai-history-toggle" @click="showHistory = !showHistory">
            <i class="material-symbols-outlined">{{ showHistory ? 'expand_less' : 'expand_more' }}</i>
            過往記錄（{{ testHistory.length }} 筆）
          </button>
          <div v-if="showHistory" class="ai-history-list">
            <div v-for="run in testHistory" :key="run.id" class="ai-history-item">
              <span class="ai-history-date">{{ formatHistoryDate(run.date) }}</span>
              <span class="ai-history-rate">通過率 {{ Math.round(run.passRate * 100) }}%</span>
              <span class="ai-history-detail">（{{ run.passed }}/{{ run.total }}）</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { AITestTag } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()

const store = useSkillStore()

// ── State ──────────────────────────────────────────────────────────────────
const showHistory = ref(false)

// ── Computed ───────────────────────────────────────────────────────────────
const isIdle = computed(
  () => store.aiTestScenarios.length === 0 && !store.aiTestIsGenerating
)

const completedCount = computed(
  () => store.aiTestScenarios.filter(s => s.status === 'pass' || s.status === 'fail').length
)

const allDone = computed(
  () =>
    store.aiTestScenarios.length > 0 &&
    store.aiTestScenarios.every(s => s.status === 'pass' || s.status === 'fail')
)

const reportRows = computed(() => {
  if (!store.aiTestReport) return []
  return Object.entries(store.aiTestReport.byTag) as [AITestTag, { total: number; passed: number }][]
})

const testHistory = computed(() => store.getTestRunHistory(props.skillId))

// ── Watchers ───────────────────────────────────────────────────────────────
watch(
  () => store.aiTestReport,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      store.saveTestRun(props.skillId, { total: newVal.total, passed: newVal.passed })
    }
  }
)

// ── Methods ────────────────────────────────────────────────────────────────
function tagLabel(tag: AITestTag): string {
  const map: Record<AITestTag, string> = {
    normal: '正常流程',
    boundary: '邊界情況',
    trigger_edge: '觸發邊緣',
  }
  return map[tag]
}

function handleRunAll(): void {
  store.runAllAITests(props.skillId)
}

function handleRegenerate(): void {
  if (store.aiTestIsRunning) return
  store.generateAITestScenarios(props.skillId)
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>
