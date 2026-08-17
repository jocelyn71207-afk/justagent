# Spec: 知識來源新增 JustKa 機器人題庫

**日期：** 2026-06-02
**功能：** 在「建立知識條目」wizard 新增第四種來源類型 — 從 JustKa 機器人題庫匯入 Q&A 題卡。

---

## 背景

目前知識條目支援三種來源：FILE（上傳檔案）、API（外部 API）、MANUAL（手動撰寫）。JustKa 是公司使用的 AI 對話商務平台，其機器人管理大量 Q&A 題卡（問答卡片）。本功能讓用戶可直接將機器人的題庫匯入為知識條目，不需手動複製貼上。

---

## 需求摘要

1. wizard 新增第四個來源 card：JustKa
2. 選中後顯示「選擇機器人」下拉選單，列出 mock 機器人清單
3. 送出後執行 pipeline 模擬，AI 以 Q&A 表格格式生成草稿內容
4. 導向 KnowledgeDetail（與 FILE 路徑一致）

---

## 元件設計

### 修改：`knowledgeStore.ts`

**SourceType**
```ts
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA'
```

### 修改：`CreateKnowledgeWizardModal.vue`

#### 新增 source card
```ts
const sourceTypes = [
  { value: 'FILE',   label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API',    label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL', label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
  { value: 'JUSTKA', label: 'JustKa',   icon: 'smart_toy',   desc: '匯入機器人題庫' },
]
```

#### Mock 機器人資料（常數，不另建 store）
```ts
const JUSTKA_BOTS = [
  { id: 'bot-1', name: '客服機器人',       cardCount: 48 },
  { id: 'bot-2', name: '銷售諮詢機器人',   cardCount: 32 },
  { id: 'bot-3', name: '退換貨處理機器人', cardCount: 24 },
]
```

#### 新增 ref
```ts
const selectedJustkaBot = ref('')
```

#### JUSTKA 模式 template
與 API 來源版面一致：
```
JustKa 機器人  *
[ 選擇機器人... ▼ ]
  選項：「{name}（{cardCount} 題卡）」
```

#### `canSubmit` 新增 JUSTKA case
```ts
if (selectedSourceType.value === 'JUSTKA') return !!selectedJustkaBot.value
```

#### 表單重置
```ts
selectedJustkaBot.value = ''
```

#### `handleSubmit` JUSTKA 分支
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
}
```

#### `simulateJustkaGeneration(id, bot)`
Pipeline 同 FILE：chunking → embedding → indexing（4.5 秒）。
完成後內容格式：

```markdown
## {botName} — 題庫知識

> AI 已整理 {cardCount} 張題卡，以下為結構化 Q&A 內容。

| # | 問題 | 參考答案 |
| --- | --- | --- |
| 1 | 如何查詢訂單狀態？ | 可至官網會員中心查詢，或提供訂單編號由客服協助確認。 |
| 2 | 退貨流程為何？ | 請於購買後 7 天內聯繫客服，提供訂單編號與退貨原因… |
| … | … | … |

**共整理 {cardCount} 題，可於「分段預覽」查看完整題卡。**
```

---

### 修改：`knowledgeStore.ts`

#### 新增 `createFromJustka()`
```ts
createFromJustka(params: {
  botId: string;
  botName: string;
  cardCount: number;
  category: string;
}): { knowledgeId: string; versionId: string }
```

建立 KnowledgeItem：
- `title`: `{botName} 題庫`
- `sourceType`: `'JUSTKA'`
- `status`: `'pending'`
- `lastUpdateBy`: `'AI 生成'`
- version content 初始為空，由 `simulateJustkaGeneration` 完成後注入

---

## 資料流

```
用戶選 JUSTKA card
  → 顯示機器人下拉選單
  → 選分類 → canSubmit = true
  → handleSubmit
    → knowledgeStore.createFromJustka(...)
    → simulateJustkaGeneration() 非同步啟動
    → router.push KnowledgeDetail
    → 4.5 秒後 markPipelineDone(aiContent = Q&A 表格)
    → toast「AI 整理完成，可前往審閱草稿」
```

---

## 邊界條件

| 情境 | 處理 |
|------|------|
| 未選機器人 | canSubmit = false，按鈕 disabled |
| 關閉 wizard 後重開 | selectedJustkaBot 重置為 '' |
| JUSTKA 條目在 KnowledgeBase 列表 | sourceType badge 顯示「JustKa」 |

---

## 不在此次範圍

- 實際 JustKa API 呼叫（維持 mock）
- 題卡分頁瀏覽
- 機器人分類篩選
