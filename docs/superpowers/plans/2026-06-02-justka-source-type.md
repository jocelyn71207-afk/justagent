# JustKa 知識來源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「建立知識條目」wizard 新增第四種來源類型 JUSTKA，讓用戶選擇 JustKa 機器人後，由 AI 以 Q&A 表格格式生成知識草稿。

**Architecture:** 兩個檔案異動：`knowledgeStore.ts` 新增 `SourceType` 值與 `createFromJustka()` action；`CreateKnowledgeWizardModal.vue` 新增 source card、機器人選單、pipeline 模擬與送出分支。mock 機器人資料以常數形式放在 wizard 元件內，不另建 store。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest

---

## 檔案異動總覽

| 檔案 | 類型 |
|------|------|
| `src/stores/knowledgeStore.ts` | 修改 |
| `src/stores/__tests__/knowledgeStore.pipeline.test.ts` | 修改（新增測試） |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | 修改 |

---

## Task 1：knowledgeStore 新增 JUSTKA SourceType 與 createFromJustka()

**Files:**
- Modify: `src/stores/knowledgeStore.ts:16`
- Modify: `src/stores/__tests__/knowledgeStore.pipeline.test.ts`

---

- [ ] **Step 1: 先寫測試（預期會失敗）**

在 `src/stores/__tests__/knowledgeStore.pipeline.test.ts` 末尾，`describe` 塊結尾之前加入：

```ts
describe('createFromJustka', () => {
  it('建立 pending 狀態條目，sourceType 為 JUSTKA，title 包含機器人名稱', () => {
    const store = useKnowledgeStore()
    const before = store.knowledgeList.length

    const { knowledgeId, versionId } = store.createFromJustka({
      botId: 'bot-1',
      botName: '客服機器人',
      cardCount: 48,
      category: '客服',
    })

    expect(store.knowledgeList.length).toBe(before + 1)
    const item = store.knowledgeList.find(k => k.id === knowledgeId)!
    expect(item.status).toBe('pending')
    expect(item.sourceType).toBe('JUSTKA')
    expect(item.title).toBe('客服機器人 題庫')
    expect(item.pipelineProgress).toBe(0)
    expect(item.pipelineStage).toBeNull()
    const ver = item.versions.find(v => v.id === versionId)!
    expect(ver.status).toBe('draft')
    expect(ver.summary).toContain('48')
  })
})
```

- [ ] **Step 2: 確認測試失敗**

```bash
npm run test:unit -- --reporter=verbose 2>&1 | grep -A 5 "createFromJustka"
```

預期：FAIL，`store.createFromJustka is not a function`

- [ ] **Step 3: 擴充 SourceType**

在 `src/stores/knowledgeStore.ts` 第 16 行，將：
```ts
export type SourceType = 'FILE' | 'API' | 'MANUAL'
```
改為：
```ts
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA'
```

- [ ] **Step 4: 新增 createFromJustka() action**

在 `src/stores/knowledgeStore.ts` 中，找到 `const createFromFile = (params: {` 函式（約第 537 行）之後，加入：

```ts
  function createFromJustka(params: {
    botId: string;
    botName: string;
    cardCount: number;
    category: string;
  }): { knowledgeId: string; versionId: string } {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const title = `${params.botName} 題庫`;

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title,
      category: params.category,
      status: 'pending',
      sourceType: 'JUSTKA',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title,
        summary: `從 JustKa「${params.botName}」整理 ${params.cardCount} 張題卡生成的知識條目草稿`,
        content: '',
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從 JustKa 機器人「${params.botName}」匯入，共 ${params.cardCount} 題卡`,
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  }
```

- [ ] **Step 5: 將 createFromJustka 加入 return 物件**

找到 `return {` 區塊（約第 961 行），在 `createFromFile,` 之後加入：
```ts
    createFromJustka,
```

- [ ] **Step 6: 確認測試通過**

```bash
npm run test:unit -- --reporter=verbose 2>&1 | grep -A 5 "createFromJustka"
```

預期：PASS，1 個測試通過。

- [ ] **Step 7: Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.pipeline.test.ts
git commit -m "feat: add JUSTKA SourceType and createFromJustka() to knowledgeStore"
```

---

## Task 2：CreateKnowledgeWizardModal — JUSTKA source card、選單、送出

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

---

- [ ] **Step 1: 新增 JustKa source card 到 sourceTypes 陣列**

找到（約第 185 行）：
```ts
const sourceTypes = [
  { value: 'FILE' as SourceType, label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API' as SourceType,  label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL' as SourceType, label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
]
```
改為：
```ts
const sourceTypes = [
  { value: 'FILE' as SourceType,   label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API' as SourceType,    label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL' as SourceType, label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
  { value: 'JUSTKA' as SourceType, label: 'JustKa',   icon: 'smart_toy',   desc: '匯入機器人題庫' },
]
```

- [ ] **Step 2: 新增 mock 機器人常數與 ref**

在 `const selectedApiSourceId = ref('')` 那一行之後加入：

```ts
// ── JUSTKA ──
const JUSTKA_BOTS = [
  { id: 'bot-1', name: '客服機器人',       cardCount: 48 },
  { id: 'bot-2', name: '銷售諮詢機器人',   cardCount: 32 },
  { id: 'bot-3', name: '退換貨處理機器人', cardCount: 24 },
] as const
const selectedJustkaBot = ref('')
```

- [ ] **Step 3: 在 template 加入 JUSTKA 選單區塊**

找到（約第 97 行）：
```html
      <!-- MANUAL: 標題輸入 -->
      <template v-else-if="selectedSourceType === 'MANUAL'">
```
在其之前插入：
```html
      <!-- JUSTKA: 選機器人 -->
      <template v-else-if="selectedSourceType === 'JUSTKA'">
        <div class="mb-3">
          <label class="form-label">JustKa 機器人 <span style="color:#dc2626;">*</span></label>
          <select v-model="selectedJustkaBot" class="custom-input w-100">
            <option value="">選擇機器人...</option>
            <option v-for="b in JUSTKA_BOTS" :key="b.id" :value="b.id">
              {{ b.name }}（{{ b.cardCount }} 題卡）
            </option>
          </select>
        </div>
      </template>
```

- [ ] **Step 4: 更新 canSubmit，加入 JUSTKA case**

找到：
```ts
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  return false
```
改為：
```ts
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  if (selectedSourceType.value === 'JUSTKA') return !!selectedJustkaBot.value
  return false
```

- [ ] **Step 5: 在表單重置 watch 加入 selectedJustkaBot**

找到重置 watch（`watch(isOpenModal, (open) => {`），在 `selectedApiSourceId.value = ''` 之後加入：
```ts
    selectedJustkaBot.value = ''
```

- [ ] **Step 6: 新增 simulateJustkaGeneration() 函式**

在 `function simulatePipeline(id: string) {` 之前加入：

```ts
function simulateJustkaGeneration(id: string, bot: { id: string; name: string; cardCount: number }) {
  const stages: Array<{ stage: 'chunking' | 'embedding' | 'indexing'; startPct: number; delay: number }> = [
    { stage: 'chunking',  startPct: 0,  delay: 0    },
    { stage: 'embedding', startPct: 33, delay: 1500 },
    { stage: 'indexing',  startPct: 67, delay: 3500 },
  ]
  stages.forEach(({ stage, startPct, delay }) => {
    setTimeout(() => knowledgeStore.updatePipelineProgress(id, stage, startPct), delay)
  })
  setTimeout(() => {
    const aiContent = [
      `## ${bot.name} — 題庫知識`,
      ``,
      `> AI 已整理 ${bot.cardCount} 張題卡，以下為結構化 Q&A 內容。`,
      ``,
      `| # | 問題 | 參考答案 |`,
      `| --- | --- | --- |`,
      `| 1 | 如何查詢訂單狀態？ | 可至官網會員中心查詢，或提供訂單編號由客服協助確認。 |`,
      `| 2 | 退貨流程為何？ | 請於購買後 7 天內聯繫客服，提供訂單編號與退貨原因，我們將於 3 個工作天內處理。 |`,
      `| 3 | 商品保固期多久？ | 依商品類型不同，一般為購買日起 1 年內，詳情請參閱商品說明頁。 |`,
      `| 4 | 如何修改訂單資訊？ | 訂單成立後 2 小時內可聯繫客服修改；超過時效請於收到商品後辦理換貨。 |`,
      `| … | … | … |`,
      ``,
      `**共整理 ${bot.cardCount} 題，可於「分段預覽」查看完整題卡。**`,
    ].join('\n')
    const chunks = Array.from({ length: 4 }, (_, i) => ({
      index: i + 1,
      content: `${bot.name} — Q&A 第 ${i + 1} 批（共 ${Math.ceil(bot.cardCount / 4)} 題）`,
      tokenCount: Math.floor(bot.cardCount * 8 / 4),
    }))
    knowledgeStore.markPipelineDone(id, chunks, aiContent)
    popDialog.toast('AI 整理完成，可前往審閱草稿', 3000)
  }, 4500)
}
```

- [ ] **Step 7: 在 handleSubmit 加入 JUSTKA 分支**

找到（約第 328 行）`if (selectedSourceType.value === 'API') {` 之後的 `}` 結尾，在其後加入：

```ts
  if (selectedSourceType.value === 'JUSTKA') {
    const bot = JUSTKA_BOTS.find(b => b.id === selectedJustkaBot.value)!
    const { knowledgeId } = knowledgeStore.createFromJustka({
      botId: bot.id,
      botName: bot.name,
      cardCount: bot.cardCount,
      category: selectedCategory.value,
    })
    isOpenModal.value = false
    popDialog.toast('AI 正在整理題庫內容…', 3000)
    simulateJustkaGeneration(knowledgeId, bot)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
    return
  }
```

- [ ] **Step 8: 送出按鈕文字加入 JUSTKA case**

找到：
```html
          {{ selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : selectedSourceType === 'FILE' ? '建立並 AI 生成內容' : '上傳並開始處理' }}
```
改為：
```html
          {{ selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : selectedSourceType === 'FILE' ? '建立並 AI 生成內容' : selectedSourceType === 'JUSTKA' ? '匯入並 AI 整理題庫' : '上傳並開始處理' }}
```

同樣更新 icon：
```html
          <i class="material-symbols-outlined">{{ selectedSourceType === 'MANUAL' ? 'edit' : selectedSourceType === 'FILE' ? 'auto_awesome' : selectedSourceType === 'JUSTKA' ? 'auto_awesome' : 'upload' }}</i>
```

- [ ] **Step 9: type-check**

```bash
npm run type-check 2>&1 | tail -5
```

預期：無錯誤輸出（只有指令本身）

- [ ] **Step 10: 執行所有單元測試確認通過**

```bash
npm run test:unit 2>&1 | tail -10
```

預期：所有測試 PASS

- [ ] **Step 11: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat: add JustKa source card, bot selector, and pipeline generation to wizard"
```
