# SkillTest AI 快速測試實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在技能測試沙盒中新增「AI 快速測試」Tab（自動生成情境、批量執行、AI 判斷報告），並移除 JSON 模式相關程式碼。

**Architecture:** skillStore 新增 AI 測試型別、state 與 actions（mock 資料），SkillTestAI.vue 元件實作三段式 UI（idle → 情境列表 → 報告），SkillTest.vue 加入雙 Tab 切換。SkillTestJson.vue 直接刪除。

**Tech Stack:** Vue 3 `<script setup lang="ts">`，Pinia defineStore（ref/computed composition 模式），SCSS（與現有 _SkillTest.scss 同規），Vitest

## Global Constraints

- `<script setup lang="ts">` — 禁止 Options API
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`
- 所有 import 使用 `@/` alias
- 顏色使用現有 SCSS 變數（`$color_main_1` 等）或 CSS Custom Properties（`var(--success)` 等），不寫死 hex
- 新增 SCSS 檔案後在對應 `_index.scss` 加 `@import`（與現有格式一致）

---

## 檔案對照

| 動作 | 路徑 |
|------|------|
| 修改 | `src/stores/skillStore.ts` |
| 刪除 | `src/components/Skill/SkillTestJson.vue` |
| 建立 | `src/components/Skill/SkillTestAI.vue` |
| 建立 | `src/scss/components/_SkillTestAI.scss` |
| 修改 | `src/scss/components/_index.scss` |
| 修改 | `src/views/SkillTest.vue` |
| 修改 | `src/scss/views/_SkillTest.scss` |
| 建立 | `src/stores/__tests__/skillStore.ai.test.ts` |

---

### Task 1: skillStore — 移除 JSON，加入 AI 測試型別與 state

**Files:**
- Modify: `src/stores/skillStore.ts`
- Create: `src/stores/__tests__/skillStore.ai.test.ts`

**Interfaces:**
- Produces: `AITestTag`, `AITestScenario`, `AITestReport` (exported)；state: `aiTestScenarios`, `aiTestReport`, `aiTestIsGenerating`, `aiTestIsRunning`

- [ ] **Step 1: 刪除 SkillTestJson.vue**

```bash
rm /Users/jocelyn/Desktop/規劃/demosite/src/components/Skill/SkillTestJson.vue
```

Expected: 檔案消失，無相關 import 需要清理（SkillTest.vue 未引入此元件）。

- [ ] **Step 2: 在 skillStore.ts 加入 AI 測試型別**

在 `ChatMessage` interface 之後（約 line 88）插入：

```ts
export type AITestTag = 'normal' | 'boundary' | 'trigger_edge'

export interface AITestScenario {
  id: string
  tag: AITestTag
  input: string
  expectedBehavior: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  agentReply?: string
  aiJudgment?: string
}

export interface AITestReport {
  total: number
  passed: number
  byTag: Record<AITestTag, { total: number; passed: number }>
  summary: string
}
```

- [ ] **Step 3: 移除 JSON state，加入 AI test state**

在 `useSkillStore` 的 state 區塊（`defineStore` 內，約 line 383 後）：

移除這三行：
```ts
const testJsonInput = ref<string>('{\n  "user_message": "",\n  "context": {}\n}')
const testJsonOutput = ref<string | null>(null)
```
（`testIsRunning` 保留，仍供 chat 使用）

在這兩行原位置後加入：
```ts
const aiTestScenarios = ref<AITestScenario[]>([])
const aiTestReport = ref<AITestReport | null>(null)
const aiTestIsGenerating = ref(false)
const aiTestIsRunning = ref(false)
```

- [ ] **Step 4: 更新 setSelectedSkill，切換技能時重置 AI 狀態**

將現有：
```ts
function setSelectedSkill(id: string): void {
  selectedSkillId.value = id
}
```

改為：
```ts
function setSelectedSkill(id: string): void {
  selectedSkillId.value = id
  aiTestScenarios.value = []
  aiTestReport.value = null
  aiTestIsGenerating.value = false
  aiTestIsRunning.value = false
}
```

- [ ] **Step 5: 移除 runJsonTest action**

刪除整個 `runJsonTest` 函式（約 lines 667–678）：
```ts
async function runJsonTest(_skillId: string, _input: string): Promise<void> {
  testIsRunning.value = true
  testJsonOutput.value = null
  await new Promise(r => setTimeout(r, 600))
  testJsonOutput.value = JSON.stringify({
    reply: '（Mock）已收到輸入並完成處理',
    action: 'processed',
    confidence: 0.92,
    tools_called: ['query-knowledge-base'],
  }, null, 2)
  testIsRunning.value = false
}
```

- [ ] **Step 6: 更新 return 物件**

在 `return {` 區塊：
- 移除：`testJsonInput`, `testJsonOutput`, `runJsonTest`
- 新增：`aiTestScenarios`, `aiTestReport`, `aiTestIsGenerating`, `aiTestIsRunning`

最終 return 新增部分：
```ts
return {
  // ... 現有項目（保留所有原有項目除了三個 JSON 項目）...
  aiTestScenarios,
  aiTestReport,
  aiTestIsGenerating,
  aiTestIsRunning,
  // actions 會在 Task 2 加入
}
```

- [ ] **Step 7: 寫 test — setSelectedSkill 重置 AI state**

建立 `src/stores/__tests__/skillStore.ai.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore — AI test state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('setSelectedSkill resets AI test state', () => {
    const store = useSkillStore()
    // Seed some state
    store.aiTestScenarios.push({
      id: 'x', tag: 'normal', input: 'test', expectedBehavior: 'pass',
      status: 'pass', agentReply: 'ok', aiJudgment: 'ok',
    })
    store.aiTestReport = {
      total: 1, passed: 1,
      byTag: { normal: { total: 1, passed: 1 }, boundary: { total: 0, passed: 0 }, trigger_edge: { total: 0, passed: 0 } },
      summary: 'all good',
    }

    store.setSelectedSkill('sys-cs-001')

    expect(store.aiTestScenarios).toHaveLength(0)
    expect(store.aiTestReport).toBeNull()
    expect(store.aiTestIsGenerating).toBe(false)
    expect(store.aiTestIsRunning).toBe(false)
  })
})
```

- [ ] **Step 8: 執行測試**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npx vitest run src/stores/__tests__/skillStore.ai.test.ts
```

Expected: 1 test PASS

- [ ] **Step 9: 執行 type-check**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run type-check
```

Expected: 無 type error（若有，修正後再繼續）

- [ ] **Step 10: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.ai.test.ts
git commit -m "feat(skill-test): add AI test types/state, remove JSON mode from store"
```

---

### Task 2: skillStore — 加入 mock 情境資料與 AI 測試 actions

**Files:**
- Modify: `src/stores/skillStore.ts`

**Interfaces:**
- Consumes: `AITestScenario`, `AITestReport`, `AITestTag`（Task 1 定義）
- Produces: actions `generateAITestScenarios`, `runSingleAITest`, `runAllAITests`

- [ ] **Step 1: 加入 MOCK_AI_SCENARIO_TEMPLATES 常數**

在 `MOCK_DRAFTS` 常數之後，`useSkillStore` 之前，插入：

```ts
type ScenarioTemplate = Omit<AITestScenario, 'id' | 'status'>

const MOCK_AI_SCENARIO_TEMPLATES: Record<string, ScenarioTemplate[]> = {
  'sys-cs-001': [
    { tag: 'normal', input: '我的訂單什麼時候會到？訂單號是 #20241201-0023', expectedBehavior: '技能觸發，查詢訂單狀態並回覆預計到貨時間' },
    { tag: 'normal', input: '你們支援哪些付款方式？可以用信用卡分期嗎？', expectedBehavior: '技能觸發，列出支援付款方式並說明分期條件' },
    { tag: 'normal', input: '我想退貨，請問流程是什麼？', expectedBehavior: '技能觸發，說明退貨步驟與所需文件' },
    { tag: 'boundary', input: '你好！', expectedBehavior: '技能觸發一般問候回覆，不強制進入特定流程' },
    { tag: 'boundary', input: '你這破客服都沒在聽！我等了三天！', expectedBehavior: '情緒分析觸發，識別高情緒並轉介人工客服' },
    { tag: 'boundary', input: '幫我查 #99999999，是我朋友的訂單', expectedBehavior: '技能查詢但說明需驗證訂單歸屬' },
    { tag: 'trigger_edge', input: '退款 換貨 保固', expectedBehavior: '關鍵字觸發，引導使用者說明具體問題' },
    { tag: 'trigger_edge', input: 'I want to return my order please', expectedBehavior: '多語言觸發，以英文說明退貨流程' },
  ],
  'ext-cs-return-001': [
    { tag: 'normal', input: '我在 2024/11/15 購買了一件外套，現在可以退貨嗎？', expectedBehavior: '觸發退貨資格判斷，確認是否在 30 天內並給出建議' },
    { tag: 'normal', input: '退貨後多久可以收到退款？', expectedBehavior: '觸發，說明退款時程' },
    { tag: 'boundary', input: '我超過 30 天了，但商品真的有問題，有辦法嗎？', expectedBehavior: '觸發，提供超期但瑕疵品的彈性處理流程' },
    { tag: 'boundary', input: '我是 VIP 客戶，退貨期限是幾天？', expectedBehavior: '觸發 VIP 識別，說明 45 天優惠退貨期' },
    { tag: 'trigger_edge', input: '退貨 換貨 瑕疵 VIP', expectedBehavior: '關鍵字觸發，確認技能正確識別退貨相關意圖' },
  ],
  'sys-doc-001': [
    { tag: 'normal', input: '請幫我摘要以下季報重點：第三季營收較去年同期成長 12%...', expectedBehavior: '技能觸發，生成結構化摘要條列式重點' },
    { tag: 'normal', input: '請從這份文件中提取 5 個最重要的關鍵字', expectedBehavior: '技能觸發，提取並列出 5 個核心關鍵字' },
    { tag: 'normal', input: '請將這篇文章摘要成 JSON 格式，包含標題、重點列表與結論', expectedBehavior: '技能觸發，輸出 JSON 格式摘要' },
    { tag: 'boundary', input: '這份文件只有一句話，請摘要', expectedBehavior: '技能觸發，對超短文件給出合理的摘要或說明' },
    { tag: 'trigger_edge', input: '摘要 PDF Word Markdown 文件', expectedBehavior: '關鍵字觸發，確認多格式文件技能正確識別' },
  ],
  'sys-meeting-001': [
    { tag: 'normal', input: '本次週會決定將上線日期延後兩週，請整理決策事項', expectedBehavior: '技能觸發，識別並條列決策事項' },
    { tag: 'normal', input: 'John 要在週五前完成 API 文件，Lisa 負責 QA，請列出 action items', expectedBehavior: '技能觸發，生成含負責人的 action item 清單' },
    { tag: 'boundary', input: '今天的會議沒有結論，請摘要', expectedBehavior: '技能觸發，說明無明確決策並建議後續追蹤方式' },
    { tag: 'trigger_edge', input: '會議 摘要 action items 決策', expectedBehavior: '關鍵字觸發，確認會議相關意圖被正確識別' },
  ],
  'ext-erp-001': [
    { tag: 'normal', input: '查詢 SKU-00123 目前在所有倉庫的庫存數量', expectedBehavior: '技能觸發，呼叫庫存查詢 tool 並回傳各倉庫數量' },
    { tag: 'normal', input: '台北倉現在有多少 SKU-00456 的庫存？', expectedBehavior: '技能觸發，指定倉庫查詢並回傳結果' },
    { tag: 'normal', input: '哪些產品目前庫存低於安全存量？請列出清單', expectedBehavior: '技能觸發，掃描並回傳低庫存清單' },
    { tag: 'boundary', input: '我要查 SKU-99999，但我不確定這個 SKU 存不存在', expectedBehavior: '技能觸發，查詢後提示查無此 SKU' },
    { tag: 'trigger_edge', input: '庫存 SKU 倉庫 查詢', expectedBehavior: '關鍵字觸發，確認庫存相關意圖被正確識別' },
  ],
}

const DEFAULT_AI_SCENARIOS: ScenarioTemplate[] = [
  { tag: 'normal', input: '請執行這個技能的主要功能', expectedBehavior: '技能正確觸發並執行主要功能，回傳預期輸出' },
  { tag: 'normal', input: '我需要協助處理一個標準任務', expectedBehavior: '技能觸發，提供清晰的處理結果' },
  { tag: 'boundary', input: '這個任務有點不一樣，你能處理嗎？', expectedBehavior: '技能在邊界情境下仍給出合理回應或適當引導' },
  { tag: 'boundary', input: '（空白輸入）', expectedBehavior: '技能不崩潰，主動引導使用者提供必要資訊' },
  { tag: 'trigger_edge', input: '觸發關鍵詞測試', expectedBehavior: '關鍵字觸發測試，確認技能正確識別意圖' },
]
```

- [ ] **Step 2: 實作 generateAITestScenarios**

在 `setSelectedSkill` 函式之後加入：

```ts
async function generateAITestScenarios(skillId: string): Promise<void> {
  aiTestIsGenerating.value = true
  aiTestScenarios.value = []
  aiTestReport.value = null
  await new Promise(r => setTimeout(r, 900))
  const templates = MOCK_AI_SCENARIO_TEMPLATES[skillId] ?? DEFAULT_AI_SCENARIOS
  aiTestScenarios.value = templates.map((t, i) => ({
    ...t,
    id: `ai-sc-${skillId}-${i}`,
    status: 'pending',
  }))
  aiTestIsGenerating.value = false
}
```

- [ ] **Step 3: 實作 _computeAITestReport（私有 helper）**

在 `generateAITestScenarios` 之後加入：

```ts
function _computeAITestReport(): void {
  const all = aiTestScenarios.value
  const allDone = all.every(s => s.status === 'pass' || s.status === 'fail')
  if (!allDone) return

  const byTag: AITestReport['byTag'] = {
    normal: { total: 0, passed: 0 },
    boundary: { total: 0, passed: 0 },
    trigger_edge: { total: 0, passed: 0 },
  }
  let total = 0
  let passed = 0
  for (const s of all) {
    byTag[s.tag].total++
    total++
    if (s.status === 'pass') { byTag[s.tag].passed++; passed++ }
  }

  const rate = total > 0 ? passed / total : 0
  const failedBoundary = byTag.boundary.total - byTag.boundary.passed
  let summary: string
  if (rate === 1) {
    summary = '所有測試情境均通過，技能行為符合預期，可考慮擴大使用範圍。'
  } else if (rate >= 0.7) {
    summary = failedBoundary > 0
      ? `技能在正常情境下穩定觸發，建議調整邊界情況的觸發描述（${failedBoundary} 個案例未達預期）以提高整體覆蓋率。`
      : `技能整體表現良好，${total - passed} 個案例有改善空間，建議檢視對應的觸發描述。`
  } else {
    summary = '技能觸發穩定性有待改善，建議重新審視 triggerHint 與 instructions 的設定。'
  }

  aiTestReport.value = { total, passed, byTag, summary }
}
```

- [ ] **Step 4: 實作 runSingleAITest**

在 `_computeAITestReport` 之後加入：

```ts
async function runSingleAITest(_skillId: string, scenarioId: string): Promise<void> {
  const scenario = aiTestScenarios.value.find(s => s.id === scenarioId)
  if (!scenario || scenario.status === 'running') return

  scenario.status = 'running'
  await new Promise(r => setTimeout(r, 600 + Math.floor(Math.random() * 400)))

  const idx = aiTestScenarios.value.findIndex(s => s.id === scenarioId)
  // normal 和 trigger_edge 固定通過；boundary 每三個中第二個失敗（demo 效果）
  const passes = scenario.tag !== 'boundary' || idx % 3 !== 1

  const shortInput = scenario.input.length > 40
    ? scenario.input.slice(0, 40) + '...'
    : scenario.input

  scenario.agentReply = passes
    ? `（Mock）已處理您的請求：「${shortInput}」，並完成對應動作。`
    : `（Mock）您好，這個問題需要更多資訊，請提供相關細節以便進一步協助。`
  scenario.aiJudgment = passes
    ? '技能正確觸發，回覆內容符合預期行為。'
    : '技能未如預期觸發，回覆為一般性回應，未執行對應功能。'
  scenario.status = passes ? 'pass' : 'fail'

  _computeAITestReport()
}
```

- [ ] **Step 5: 實作 runAllAITests**

在 `runSingleAITest` 之後加入：

```ts
async function runAllAITests(skillId: string): Promise<void> {
  if (aiTestIsRunning.value) return
  aiTestIsRunning.value = true
  const pending = aiTestScenarios.value.filter(s => s.status === 'pending')
  for (const scenario of pending) {
    await runSingleAITest(skillId, scenario.id)
  }
  aiTestIsRunning.value = false
}
```

- [ ] **Step 6: 加入 actions 到 return 物件**

在 Task 1 Step 6 的 return 物件中，補入新 actions：

```ts
return {
  // ... 所有現有項目 ...
  aiTestScenarios,
  aiTestReport,
  aiTestIsGenerating,
  aiTestIsRunning,
  generateAITestScenarios,
  runSingleAITest,
  runAllAITests,
}
```

- [ ] **Step 7: 寫 tests — generateAITestScenarios**

在 `skillStore.ai.test.ts` 新增：

```ts
describe('generateAITestScenarios', () => {
  it('sets scenarios with correct structure for known skillId', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')

    expect(store.aiTestScenarios.length).toBeGreaterThanOrEqual(6)
    expect(store.aiTestIsGenerating).toBe(false)
    expect(store.aiTestReport).toBeNull()

    const first = store.aiTestScenarios[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('tag')
    expect(first).toHaveProperty('input')
    expect(first).toHaveProperty('expectedBehavior')
    expect(first.status).toBe('pending')
  })

  it('uses DEFAULT_AI_SCENARIOS for unknown skillId', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('unknown-skill-xyz')
    expect(store.aiTestScenarios.length).toBeGreaterThan(0)
    expect(store.aiTestScenarios[0].status).toBe('pending')
  })

  it('resets previous scenarios and report when called again', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    store.aiTestScenarios[0].status = 'pass'
    await store.generateAITestScenarios('sys-cs-001')
    expect(store.aiTestScenarios.every(s => s.status === 'pending')).toBe(true)
  })
})
```

- [ ] **Step 8: 寫 tests — runSingleAITest 和 report**

在 `skillStore.ai.test.ts` 新增：

```ts
describe('runSingleAITest', () => {
  it('sets status to pass or fail and populates agentReply + aiJudgment', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    const sc = store.aiTestScenarios[0]
    await store.runSingleAITest('sys-cs-001', sc.id)

    const updated = store.aiTestScenarios.find(s => s.id === sc.id)!
    expect(['pass', 'fail']).toContain(updated.status)
    expect(updated.agentReply).toBeTruthy()
    expect(updated.aiJudgment).toBeTruthy()
  })
})

describe('runAllAITests', () => {
  it('runs all pending scenarios and populates aiTestReport', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('ext-erp-001')
    await store.runAllAITests('ext-erp-001')

    expect(store.aiTestIsRunning).toBe(false)
    expect(store.aiTestScenarios.every(s => s.status === 'pass' || s.status === 'fail')).toBe(true)
    expect(store.aiTestReport).not.toBeNull()
    expect(store.aiTestReport!.total).toBe(store.aiTestScenarios.length)
    expect(store.aiTestReport!.passed).toBeLessThanOrEqual(store.aiTestReport!.total)
  })
})
```

- [ ] **Step 9: 執行所有測試**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npx vitest run src/stores/__tests__/skillStore.ai.test.ts
```

Expected: 全部 PASS（6+ tests）

- [ ] **Step 10: Type-check**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run type-check
```

Expected: 無 error

- [ ] **Step 11: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.ai.test.ts
git commit -m "feat(skill-test): implement AI test actions with mock data"
```

---

### Task 3: 建立 SkillTestAI.vue + _SkillTestAI.scss

**Files:**
- Create: `src/components/Skill/SkillTestAI.vue`
- Create: `src/scss/components/_SkillTestAI.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Consumes: `useSkillStore` — `aiTestScenarios`, `aiTestReport`, `aiTestIsGenerating`, `aiTestIsRunning`, `generateAITestScenarios`, `runSingleAITest`, `runAllAITests`（Task 2 定義）
- Props: `skillId: string`

- [ ] **Step 1: 建立 SkillTestAI.vue**

建立 `src/components/Skill/SkillTestAI.vue`：

```vue
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
      <button class="custom-btn custom-btn--primary" @click="generate">
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
  expanded.value.add(id)
}
</script>
```

- [ ] **Step 2: 建立 _SkillTestAI.scss**

建立 `src/scss/components/_SkillTestAI.scss`：

```scss
.SkillTestAI {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// ── ① Idle ──
.ai-idle {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-faint);

  .ai-idle-icon {
    font-size: 48px;
    opacity: 0.35;
  }

  .ai-idle-hint {
    font-size: 14px;
    margin: 0;
    color: var(--text-muted);
  }

  .ai-idle-spinner {
    display: flex;
    gap: 5px;
    align-items: center;

    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: ai-bounce 1.2s infinite ease-in-out;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
}

@keyframes ai-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%            { transform: translateY(-6px); opacity: 1; }
}

// ── ② Toolbar ──
.ai-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider-a50);
  flex-shrink: 0;

  .ai-toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.ai-progress {
  display: flex;
  align-items: center;
  gap: 8px;

  .ai-progress-text {
    font-size: 12px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .ai-progress-bar {
    width: 100px;
    height: 4px;
    border-radius: 2px;
    background: var(--divider-a50);
    overflow: hidden;
  }

  .ai-progress-fill {
    height: 100%;
    background: $color_main_1;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

// ── ② Scenario list ──
.ai-scenarios {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scenario-card {
  background: var(--surface);
  border: 1px solid var(--divider-a50);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;

  &.status--pass { border-left: 3px solid $color_main_1; }
  &.status--fail { border-left: 3px solid $color_red_1; }
  &.status--running { opacity: 0.85; }
}

.scenario-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.scenario-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
  letter-spacing: 0.3px;

  &.tag--normal {
    background: $color-badge-new-bg;
    color: $color-badge-new-text;
  }

  &.tag--boundary {
    background: $color-badge-hot-bg;
    color: $color-warning-text;
  }

  &.tag--trigger_edge {
    background: $color-badge-ai-bg;
    color: $color-badge-ai-text;
  }
}

.scenario-actions {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;

  .material-symbols-outlined { font-size: 16px; }

  &.badge--running {
    gap: 3px;
    color: var(--text-muted);

    .spinner-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      animation: ai-bounce 1.2s infinite ease-in-out;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  &.badge--pass { color: $color_main_1; }
  &.badge--fail { color: $color_red_1; }
}

.scenario-input {
  font-size: 13.5px;
  color: var(--text);
  line-height: 1.5;
}

.scenario-expected {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--page-bg);
  border-radius: 6px;
  padding: 6px 10px;
  line-height: 1.5;
}

// ── Result expansion ──
.scenario-result {
  margin-top: 4px;
  border-top: 1px solid var(--divider-a50);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-reply {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .result-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .reply-text {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    &.is-expanded {
      display: block;
      -webkit-line-clamp: unset;
    }
  }

  .expand-btn {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    font-size: 12px;
    color: $color_main_1;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }
}

.result-judgment {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 7px 10px;
  border-radius: 6px;

  .material-symbols-outlined { font-size: 16px; flex-shrink: 0; }

  strong { font-weight: 600; }

  span { color: var(--text-muted); font-size: 12px; }

  &.judgment--pass {
    background: rgba(0, 160, 120, 0.08);
    color: $color_main_1;
  }

  &.judgment--fail {
    background: rgba(221, 75, 57, 0.08);
    color: $color_red_1;
  }
}

// ── ③ Report ──
.ai-report {
  background: var(--surface);
  border: 1px solid var(--divider-a50);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  .report-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .report-rate {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);

    em {
      font-style: normal;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      margin-left: 4px;
    }
  }
}

.report-by-tag {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-tag-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .tag-stat {
    font-size: 13px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    margin-left: auto;
  }

  .tag-result-icon {
    font-size: 18px;

    &.icon--pass { color: $color_main_1; }
    &.icon--fail { color: $color_red_1; }
  }
}

.report-summary {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
  padding: 10px 12px;
  background: var(--page-bg);
  border-radius: 6px;
}
```

- [ ] **Step 3: 在 _index.scss 加 @import**

在 `src/scss/components/_index.scss` 最後一行（`@import "./DraftCard";`）之後加入：

```scss
@import "./SkillTestAI";
```

- [ ] **Step 4: 執行 build 驗證 SCSS 無報錯**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run build 2>&1 | grep -i error | head -20
```

Expected: 無 SCSS/CSS error（build 可能有其他非關聯警告，忽略即可）

- [ ] **Step 5: Commit**

```bash
git add src/components/Skill/SkillTestAI.vue src/scss/components/_SkillTestAI.scss src/scss/components/_index.scss
git commit -m "feat(skill-test): add SkillTestAI component and styles"
```

---

### Task 4: SkillTest.vue Tab 切換整合 + SCSS

**Files:**
- Modify: `src/views/SkillTest.vue`
- Modify: `src/scss/views/_SkillTest.scss`

**Interfaces:**
- Consumes: `SkillTestAI.vue`（Task 3 定義），`SkillTestChat.vue`（現有）

- [ ] **Step 1: 修改 SkillTest.vue — 加入 Tab 切換**

將 `src/views/SkillTest.vue` 完整替換為：

```vue
<template>
  <div class="SkillTest views-page">
    <div class="skill-test-layout">

      <!-- 左側：技能選擇 -->
      <div class="test-sidebar">
        <div class="sidebar-head">測試的技能</div>
        <div class="sidebar-list">
          <div
            v-for="skill in store.flatSkills"
            :key="skill.id"
            :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
            @click="store.setSelectedSkill(skill.id)"
          >
            <span :class="['skill-dot', skill.type === 'system' ? 'dot--sys' : 'dot--ext']"></span>
            {{ skill.name }}
          </div>
        </div>
      </div>

      <!-- 右側：測試面板 -->
      <div class="test-panel">
        <template v-if="selectedSkill">
          <div class="test-panel-head">
            <div class="panel-title">
              {{ selectedSkill.name }}
              <span class="skill-tag tag--version">v{{ selectedSkill.version }}</span>
              <span :class="['skill-tag', selectedSkill.type === 'system' ? 'tag--sys' : 'tag--ext']">
                {{ selectedSkill.type === 'system' ? '系統技能' : '企業擴充' }}
              </span>
            </div>
          </div>

          <div class="test-panel-tabs">
            <button
              :class="['tab-btn', { 'is-active': activeTab === 'chat' }]"
              @click="activeTab = 'chat'"
            >
              <i class="material-symbols-outlined">chat</i>
              對話測試
            </button>
            <button
              :class="['tab-btn', { 'is-active': activeTab === 'ai' }]"
              @click="activeTab = 'ai'"
            >
              <i class="material-symbols-outlined">auto_awesome</i>
              AI 快速測試
            </button>
          </div>

          <SkillTestChat v-if="activeTab === 'chat'" :skill-id="selectedSkill.id" />
          <SkillTestAI v-else :skill-id="selectedSkill.id" />
        </template>

        <div v-else class="panel-empty">
          <i class="material-symbols-outlined">science</i>
          <p>請從左側選擇要測試的技能</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import { useSkillStore } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const activeTab = ref<'chat' | 'ai'>('chat')

const selectedSkill = computed(() =>
  store.selectedSkillId ? store.findSkill(store.selectedSkillId) ?? null : null
)

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) {
    store.setSelectedSkill(skillId)
  } else if (store.flatSkills.length) {
    store.setSelectedSkill(store.flatSkills[0].id)
  }
})
</script>
```

- [ ] **Step 2: 在 _SkillTest.scss 加入 Tab 樣式**

在 `src/scss/views/_SkillTest.scss` 的 `.test-panel-head { ... }` 區塊之後（約 line 87）加入：

```scss
  .test-panel-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--divider-a50);
    background: var(--surface);
    flex-shrink: 0;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;

    .material-symbols-outlined { font-size: 17px; }

    &:hover:not(.is-active) {
      color: var(--text);
      background: var(--page-bg);
    }

    &.is-active {
      color: $color_main_1;
      border-bottom-color: $color_main_1;
      font-weight: 600;
    }
  }
```

- [ ] **Step 3: 執行 dev server，手動驗證**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run dev
```

打開瀏覽器前往 `/view/SkillTest`，逐一確認：

1. [ ] 頁面載入，預設選中第一個技能，顯示「對話測試」Tab
2. [ ] Tab 切換至「AI 快速測試」→ 看到 idle 畫面（auto_awesome icon + 按鈕）
3. [ ] 點擊「生成測試情境」→ 顯示 loading dots → 出現情境卡片
4. [ ] 點擊單張卡片的「執行」→ spinner → pass/fail 結果展開
5. [ ] 點「全部執行」→ 進度條出現並推進 → 全部完成後報告卡片出現
6. [ ] 切換左側技能 → AI 測試狀態重置（回到 idle）
7. [ ] 切換回「對話測試」Tab → SkillTestChat 正常運作

- [ ] **Step 4: 執行 type-check**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run type-check
```

Expected: 無 error

- [ ] **Step 5: Commit**

```bash
git add src/views/SkillTest.vue src/scss/views/_SkillTest.scss
git commit -m "feat(skill-test): wire AI quick test tab into SkillTest view"
```

---

## 自我審查

**Spec coverage check:**

| Spec 需求 | Task |
|-----------|------|
| 移除 JSON 模式（state、action、元件） | Task 1 Step 1, 3, 5, 6 |
| AITestScenario / AITestReport 型別 | Task 1 Step 2 |
| generateAITestScenarios action | Task 2 Step 2 |
| runSingleAITest / runAllAITests actions | Task 2 Step 4, 5 |
| setSelectedSkill 重置 AI 狀態 | Task 1 Step 4 |
| Idle 畫面（生成按鈕） | Task 3 Step 1 |
| 情境卡片（tag、input、expectedBehavior、status） | Task 3 Step 1 |
| 全部執行 + 進度條 | Task 3 Step 1 |
| 結果展開（agentReply + aiJudgment） | Task 3 Step 1, 2 |
| 整體報告卡片 | Task 3 Step 1, 2 |
| @import SkillTestAI | Task 3 Step 3 |
| SkillTest.vue Tab 切換 | Task 4 Step 1 |
| Tab SCSS | Task 4 Step 2 |

所有 spec 需求均有對應 task，無缺漏。
