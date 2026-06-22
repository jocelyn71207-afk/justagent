# AI 思維鏈與知識來源顯示 — 設計文件

**日期：** 2026-06-22  
**狀態：** 已核准，待實作  
**涉及模組：** AiViewer 對話介面、Knowledge 知識管理

---

## 背景與目標

目前 AI 對話介面在 `isThinking: true` 狀態下只顯示一個轉圈圖示，使用者無法得知 AI 正在做什麼。目標是：

1. **顯示思維鏈**：AI 組織回答時，以動態條列步驟呈現推理過程
2. **標示知識來源**：若 AI 引用了知識管理中的資料，在回答底部顯示來源，並提供細節查看入口

---

## 資料結構

### 訊息物件擴充

```typescript
interface ChatMessage {
  // 現有欄位
  id: string
  forUser?: boolean
  msg?: string
  isThinking?: boolean
  finishResponse?: boolean
  cardType?: string
  files?: FileAttachment[]
  nextSteps?: NextStep[]

  // 新增欄位
  thinkingSteps?: ThinkingStep[]   // 思維鏈步驟（thinking 階段注入）
  sources?: KnowledgeSource[]      // 引用的知識來源（thinking + response 皆帶）
}
```

### 新增型別

```typescript
interface ThinkingStep {
  label: string        // 顯示文字，例如「分析問題意圖」
  detail?: string      // 補充說明，例如「找到 2 篇相關段落」
  type: 'think' | 'search' | 'synthesize'
  // think      → Material Symbol: psychology
  // search     → Material Symbol: travel_explore
  // synthesize → Material Symbol: auto_awesome
}

interface KnowledgeSource {
  knowledgeId: string     // 對應 knowledgeStore 的 knowledge id
  title: string           // 知識庫名稱（顯示用）
  chunkIndexes: number[]  // 引用的 chunk 索引（用於抽屜細節顯示）
}
```

---

## 元件設計

### 1. ThinkingChainCard.vue（新建）

**路徑：** `src/components/AiViewer/ThinkingChainCard.vue`

**Props：**
```typescript
props: {
  steps: ThinkingStep[]      // 思維步驟清單
  sources: KnowledgeSource[] // 查詢到的知識來源
  isThinking: boolean        // true = 展開動態狀態；false = 折疊為小標
}
```

**狀態一：展開（isThinking: true）**

- 標頭顯示「AI 正在思考...」＋ 旋轉動畫圖示
- 步驟每隔 800ms 依序 slide-in 出現
- 最後一個步驟未完成時，步驟文字後方附小 spinner
- 若某步驟 type 為 `search` 且有對應 source，在 detail 旁顯示藍色知識庫名稱標籤
- 背景色：淡灰底（`--color-surface-2`），圓角卡片

**狀態二：折疊（isThinking 變為 false 後 300ms 自動折疊）**

- 折疊成一行文字：`💭 查看推理過程 ∨`
- 樣式：灰色小標，font-size 12px
- 點擊展開回狀態一（steps 全部顯示，無逐步動畫）
- 位置：緊接在 AI 回答訊息泡泡上方

**動畫：**
- 展開 ↔ 折疊：300ms height + opacity transition

---

### 2. KnowledgeSourceDrawer.vue（新建）

**路徑：** `src/components/AiViewer/KnowledgeSourceDrawer.vue`

**Props / 外部狀態（透過 provide/inject 接收）：**
```typescript
// 由 AiViewerRightBox 提供
const drawerSources: Ref<KnowledgeSource[]>  // 當前顯示的來源清單
const drawerOpen: Ref<boolean>               // 開關狀態
```

**版面：**
- 寬度：360px，從右側 slide-in（transform: translateX）
- 模式：overlay（不壓縮對話區域），背景半透明遮罩
- 點擊遮罩或 ✕ 按鈕關閉

**內容結構（每個 KnowledgeSource 為一個分組）：**

```
📚 [知識庫名稱]
────────────────────
§ [sectionPath]
  [gist 摘要文字]
  引用 N 次

§ [sectionPath]
  [gist 摘要文字]
  引用 N 次

📚 [知識庫名稱 2]
────────────────────
...
```

- `sectionPath`、`gist`、`citationCount` 來自 `knowledgeStore` 中對應 chunk
- 若 chunk 無 gist，顯示 content 前 100 字
- 若 citationCount 為 0 或 undefined，不顯示引用數

---

### 3. AiViewerRecord.vue（修改）

**新增渲染邏輯：**

```html
<!-- AI 訊息：思維鏈卡片（在訊息泡泡上方） -->
<ThinkingChainCard
  v-if="!source.forUser && (source.isThinking || source.thinkingSteps?.length)"
  :steps="source.thinkingSteps ?? []"
  :sources="source.sources ?? []"
  :isThinking="source.isThinking ?? false"
/>

<!-- 訊息泡泡（現有） -->
<div class="message-bubble">...</div>

<!-- 知識來源 Chips（訊息底部） -->
<div v-if="source.finishResponse && source.sources?.length" class="source-chips">
  <span class="source-chips-label">參考來源：</span>
  <button
    v-for="src in source.sources"
    :key="src.knowledgeId"
    class="source-chip"
    @click="openDrawer(src)"
  >
    <i class="material-symbols-outlined">book</i>
    {{ src.title }}
  </button>
</div>
```

---

### 4. AiViewerRightBox.vue（修改）

**新增狀態：**
```typescript
const drawerOpen = ref(false)
const drawerSources = ref<KnowledgeSource[]>([])

function openDrawer(sources: KnowledgeSource[]) {
  drawerSources.value = sources
  drawerOpen.value = true
}

provide('drawerOpen', drawerOpen)
provide('drawerSources', drawerSources)
provide('openDrawer', openDrawer)
```

`AiViewerRecord.vue` 透過 `inject('openDrawer')` 取得此函式，供來源 Chip 的 click handler 呼叫。

**Mock 資料流調整（setTimeout 流程）：**

```typescript
// t=0：推入 thinking 訊息，帶入預設步驟與來源
conv1Msgs.value.push({
  id: 'ai-thinking-' + Date.now(),
  isThinking: true,
  thinkingSteps: [
    { type: 'think', label: '分析問題意圖' },
    { type: 'search', label: '查詢知識庫', detail: '找到 2 篇相關段落' },
    { type: 'synthesize', label: '整合資訊，組織回答' },
  ],
  sources: [
    { knowledgeId: 'k5', title: '商品目錄 Q2', chunkIndexes: [0, 1] },
  ],
})

// t=2400：移除 thinking 訊息，推入回答（帶相同 sources）
conv1Msgs.value.pop()
conv1Msgs.value.push({
  id: 'ai-resp-' + Date.now(),
  msg: '...',
  finishResponse: true,
  thinkingSteps: [...],  // 保留步驟供折疊卡片使用
  sources: [...],        // 保留來源供 Chips 使用
})
```

---

## 樣式

新增 SCSS 檔案：`src/scss/components/_thinkingChain.scss`  
需在 `src/scss/components/_index.scss` 加入 `@forward './thinkingChain'`

主要 class：
- `.thinking-chain-card` — 卡片容器
- `.thinking-chain-card--collapsed` — 折疊狀態
- `.thinking-step` — 單一步驟列
- `.thinking-step-icon` — 圖示
- `.thinking-step-tag` — 知識庫名稱藍色標籤
- `.source-chips` — 來源 chips 容器
- `.source-chip` — 單一來源按鈕
- `.knowledge-drawer` — 側邊抽屜
- `.knowledge-drawer-overlay` — 半透明遮罩

---

## 資料依賴

- `knowledgeStore.knowledgeList`：用於在抽屜中查找 chunk 細節（`title`、`chunks[].sectionPath`、`chunks[].gist`、`chunks[].citationCount`）
- Mock 資料預設引用知識庫 `k5`（商品目錄 Q2），對應 `knowledgeStore` 現有 mock

---

## 不在此次範圍內

- 真實 LLM streaming thinking 串接
- 思維鏈的持久化儲存
- 跨對話的知識來源統計

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `src/components/AiViewer/ThinkingChainCard.vue` | 新建 |
| `src/components/AiViewer/KnowledgeSourceDrawer.vue` | 新建 |
| `src/components/AiViewer/AiViewerRecord.vue` | 修改 |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 |
| `src/scss/components/_thinkingChain.scss` | 新建 |
| `src/scss/components/_index.scss` | 修改（加 @forward） |
