# 知識庫資料來源重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重設計知識庫資料來源 — 修正同步邏輯（1 來源 = 1 知識條目）、改為 App 授權卡片介面、新增三步驟 Wizard。

**Architecture:** `KnowledgeBase.vue` 新增 Tab 切換，「資料來源」Tab 由新的 `DataSourceTab.vue` 負責，內含 App 卡片 Grid 與 `ConnectApiWizard.vue` 三步驟 Wizard。`knowledgeStore` 修正同步邏輯並新增 `createKnowledgeFromApiSource` action。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest（單元測試）、SCSS（無 scoped）

---

## 檔案清單

| 路徑 | 動作 | 說明 |
|---|---|---|
| `src/stores/__tests__/knowledgeStore.datasource.test.ts` | 新增 | Store 單元測試 |
| `src/stores/knowledgeStore.ts` | 修改 | KnowledgeItem 新欄位、WizardPayload 介面、createKnowledgeFromApiSource、修正 triggerSync |
| `src/scss/components/_DataSourceTab.scss` | 新增 | DataSourceTab + ConnectApiWizard 所有樣式 |
| `src/scss/components/_index.scss` | 修改 | `@import "./DataSourceTab"` |
| `src/scss/views/_Knowledge.scss` | 修改 | 新增 `.api-source-badge`、`.knowledge-icon--api` |
| `src/components/Knowledge/ConnectApiWizard.vue` | 新增 | 三步驟 Wizard Modal |
| `src/components/Knowledge/DataSourceTab.vue` | 新增 | App 授權卡片 Tab |
| `src/views/KnowledgeBase.vue` | 修改 | Tab 切換 + DataSourceTab + API badge |
| `src/views/KnowledgeApiSources.vue` | 刪除 | 由 DataSourceTab 取代 |
| `src/components/Knowledge/ApiSourceModal.vue` | 刪除 | 由 ConnectApiWizard 取代 |
| `src/router/index.ts` | 修改 | 移除 KnowledgeApiSources 路由 |

---

## Task 1：寫 failing 單元測試

**Files:**
- Create: `src/stores/__tests__/knowledgeStore.datasource.test.ts`

- [ ] **Step 1：建立測試檔案**

```typescript
// src/stores/__tests__/knowledgeStore.datasource.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — datasource 功能', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createKnowledgeFromApiSource', () => {
    it('建立一個 KnowledgeItem，且 sourceType 為 API', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      const id = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-test-1',
        apiSourceName: '測試 API',
        name: '測試知識條目',
        category: '商品文件',
      })

      expect(store.knowledgeList.length).toBe(before + 1)
      const item = store.knowledgeList.find(k => k.id === id)
      expect(item).toBeDefined()
      expect(item!.sourceType).toBe('API')
      expect(item!.apiSourceId).toBe('api-test-1')
      expect(item!.apiSourceName).toBe('測試 API')
      expect(item!.title).toBe('測試知識條目')
      expect(item!.category).toBe('商品文件')
      expect(item!.status).toBe('DRAFT')
      expect(item!.versions.length).toBe(1)
      expect(item!.versions[0].status).toBe('DRAFT')
      expect(item!.versions[0].versionNumber).toBe('v1.0')
    })
  })

  describe('triggerSync', () => {
    it('成功同步後：不新增額外 KnowledgeItem，只在已關聯的條目建立新版本', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 強制走成功分支
      const store = useKnowledgeStore()

      const knowledgeId = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      const beforeCount = store.knowledgeList.length

      await store.triggerSync('api-1')

      expect(store.knowledgeList.length).toBe(beforeCount) // 沒有新增條目
      const item = store.knowledgeList.find(k => k.id === knowledgeId)!
      expect(item.versions.length).toBeGreaterThan(1)      // 多了一個新版本
      expect(item.status).toBe('DRAFT')
    })

    it('成功同步後：ApiSource.lastSyncStatus 為 SUCCESS', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9)
      const store = useKnowledgeStore()

      store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      await store.triggerSync('api-1')

      const source = store.apiSources.find(s => s.id === 'api-1')!
      expect(source.lastSyncStatus).toBe('SUCCESS')
      expect(source.lastSyncAt).not.toBeNull()
    })

    it('失敗同步後：KnowledgeItem 版本數不變', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0) // 強制走失敗分支
      const store = useKnowledgeStore()

      const knowledgeId = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      const versionsBefore = store.knowledgeList.find(k => k.id === knowledgeId)!.versions.length

      await store.triggerSync('api-1')

      const versionsAfter = store.knowledgeList.find(k => k.id === knowledgeId)!.versions.length
      expect(versionsAfter).toBe(versionsBefore)
    })
  })
})
```

- [ ] **Step 2：執行測試，確認 FAIL**

```bash
npm run test:unit -- src/stores/__tests__/knowledgeStore.datasource.test.ts
```

預期：3 個測試失敗（`createKnowledgeFromApiSource is not a function` 之類）

---

## Task 2：更新 KnowledgeItem 介面 + 新增 createKnowledgeFromApiSource

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1：在 KnowledgeItem interface 新增三個選填欄位**

找到（第 62 行附近）：
```typescript
export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  currentVersion: string;
  status: 'PUBLISHED' | 'REVIEWING' | 'DRAFT' | 'REJECTED';
  lastUpdateTime: string;
  lastUpdateBy: string;
  versions: KnowledgeVersion[];
  sourceStale?: boolean;
  staleSourceFileIds?: string[];
}
```

改為：
```typescript
export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  currentVersion: string;
  status: 'PUBLISHED' | 'REVIEWING' | 'DRAFT' | 'REJECTED';
  lastUpdateTime: string;
  lastUpdateBy: string;
  versions: KnowledgeVersion[];
  sourceStale?: boolean;
  staleSourceFileIds?: string[];
  sourceType?: 'API' | 'FILE';
  apiSourceId?: string;
  apiSourceName?: string;
}
```

- [ ] **Step 2：在 store 的 `return {}` 上方新增 createKnowledgeFromApiSource action**

在 `// ── API 來源 CRUD ──` 區塊下方，`createApiSource` 函式後面加入：

```typescript
function createKnowledgeFromApiSource(params: {
  apiSourceId: string
  apiSourceName: string
  name: string
  category: string
}): string {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newId = `k-api-${Date.now()}`
  const draftId = `v1.0-draft-${Date.now()}`

  const newKnowledge: KnowledgeItem = {
    id: newId,
    title: params.name,
    category: params.category,
    currentVersion: 'v1.0',
    status: 'DRAFT',
    lastUpdateTime: now,
    lastUpdateBy: 'API 同步',
    sourceType: 'API',
    apiSourceId: params.apiSourceId,
    apiSourceName: params.apiSourceName,
    versions: [{
      id: draftId,
      knowledgeId: newId,
      versionNumber: 'v1.0',
      status: 'DRAFT',
      title: params.name,
      summary: `由 API 來源「${params.apiSourceName}」同步建立`,
      content: '',
      category: params.category,
      tags: [],
      lastUpdateBy: 'API 同步',
      lastUpdateTime: now,
      updateNote: `由 API 來源「${params.apiSourceName}」自動建立`,
    }],
  }

  knowledgeList.value.unshift(newKnowledge)
  return newId
}
```

- [ ] **Step 3：在 knowledgeStore.ts 頂部新增 WizardPayload 介面**

在 `export interface ApiSourceHeader` 前面加入：

```typescript
export interface WizardPayload {
  url: string;
  method: 'GET' | 'POST';
  headers: ApiSourceHeader[];
  body: string;
  titleField: string;
  contentField: string;
  name: string;
  category: string;
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY';
}
```

（注意：`ApiSourceHeader` 的定義在其後，所以這段要放在 `ApiSourceHeader` 後面）  
實際位置：在 `export interface ApiSource` 前面插入。

- [ ] **Step 4：將 createKnowledgeFromApiSource 加入 return 物件**

找到 `return {` 區塊，在 `createApiSource,` 後面加入 `createKnowledgeFromApiSource,`

---

## Task 3：修正 triggerSync 邏輯

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1：替換 triggerSync 函式**

找到現有的 `function triggerSync(id: string): Promise<void> {` 整段（約第 513–567 行），完整替換為：

```typescript
function triggerSync(id: string): Promise<void> {
  const source = apiSources.value.find(s => s.id === id)
  if (!source) return Promise.resolve()

  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.2
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

      if (success) {
        const count = Math.floor(Math.random() * 8) + 1
        source.lastSyncStatus = 'SUCCESS'
        source.lastSyncAt = now
        source.lastSyncCount = count
        source.lastSyncError = null

        // 找到關聯的 KnowledgeItem（1 來源 = 1 條目）
        const linked = knowledgeList.value.find(k => k.apiSourceId === id)
        if (linked) {
          const base =
            linked.versions.find(v => v.status === 'PUBLISHED') ??
            linked.versions[linked.versions.length - 1]
          const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number)
          const newNum = `v${major}.${minor + 1}`

          // 組合 Markdown 內容（mock：每筆資料為一個 ## 區塊）
          const content = Array.from({ length: count }, (_, i) =>
            `## ${source.titleField} 條目 ${i + 1}\n\n${source.contentField} 的示範內容（由 API 來源「${source.name}」同步）。`
          ).join('\n\n')

          const newVersion: KnowledgeVersion = {
            id: `${newNum}-api-${Date.now()}`,
            knowledgeId: linked.id,
            versionNumber: newNum,
            status: 'DRAFT',
            title: linked.title,
            summary: `由 API 來源「${source.name}」同步更新（${count} 筆資料）`,
            content,
            category: linked.category,
            tags: [],
            lastUpdateBy: 'API 同步',
            lastUpdateTime: now,
            updateNote: `API 同步（${source.name}），共 ${count} 筆`,
          }

          linked.versions.push(newVersion)
          linked.status = 'DRAFT'
          linked.lastUpdateTime = now
          linked.lastUpdateBy = 'API 同步'
        }
      } else {
        source.lastSyncStatus = 'FAILED'
        source.lastSyncAt = now
        source.lastSyncCount = 0
        source.lastSyncError = '連線失敗：API 回應狀態 503'
      }

      resolve()
    }, 2000)
  })
}
```

---

## Task 4：執行測試確認通過

- [ ] **Step 1：執行 datasource 測試**

```bash
npm run test:unit -- src/stores/__tests__/knowledgeStore.datasource.test.ts
```

預期：3 個測試全部 PASS

- [ ] **Step 2：執行全部 unit 測試，確認沒有 regression**

```bash
npm run test:unit
```

預期：全部 PASS

- [ ] **Step 3：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.datasource.test.ts
git commit -m "feat(knowledge): fix datasource data model and sync logic

- KnowledgeItem 新增 sourceType / apiSourceId / apiSourceName 欄位
- createKnowledgeFromApiSource：建立 API 來源關聯的知識條目
- triggerSync：改為更新單一關聯條目，不再建立多個獨立條目"
```

---

## Task 5：新增 DataSourceTab SCSS

**Files:**
- Create: `src/scss/components/_DataSourceTab.scss`
- Modify: `src/scss/components/_index.scss`
- Modify: `src/scss/views/_Knowledge.scss`

- [ ] **Step 1：建立 _DataSourceTab.scss**

```scss
// src/scss/components/_DataSourceTab.scss

.DataSourceTab {
  padding: 24px 0;

  // ── 區塊標題 ──
  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--color-grey-1);
    margin-bottom: 12px;
  }

  .section-desc {
    font-size: 13px;
    color: var(--color-grey-1);
    margin-bottom: 20px;
  }

  // ── 已連接區塊 ──
  .connected-section {
    margin-bottom: 32px;
  }

  .source-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .source-card {
    background: white;
    border: 1.5px solid var(--color-primary, #5c35d9);
    border-radius: 12px;
    padding: 16px;
    position: relative;

    .source-card-status {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
    }

    .source-icon {
      width: 36px;
      height: 36px;
      background: #ede9fe;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      color: var(--color-primary, #5c35d9);
    }

    .source-name {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 2px;
    }

    .source-type-label {
      font-size: 11px;
      color: var(--color-grey-1);
      margin-bottom: 8px;
    }

    .source-sync-info {
      font-size: 11px;
      color: #555;
      margin-bottom: 10px;
    }

    .source-card-actions {
      display: flex;
      gap: 6px;

      button {
        flex: 1;
        padding: 5px 0;
        border: 1px solid var(--color-border, #e0e0e0);
        border-radius: 6px;
        font-size: 11px;
        background: white;
        cursor: pointer;

        &:hover {
          background: #f5f5f5;
        }
      }
    }
  }

  // ── App 卡片 Grid ──
  .app-section {
    margin-bottom: 24px;
  }

  .app-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .app-card {
    background: white;
    border: 1.5px solid var(--color-border, #e0e0e0);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease;

    &:hover:not(.app-card--disabled) {
      box-shadow: 0 4px 16px rgba(92, 53, 217, 0.12);
      border-color: rgba(92, 53, 217, 0.4);
    }

    &.app-card--disabled {
      background: #fafafa;
      cursor: default;
      opacity: 0.7;
    }

    .app-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      font-size: 18px;
    }

    .app-name {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 2px;
    }

    .app-desc {
      font-size: 11px;
      color: var(--color-grey-1);
      margin-bottom: 10px;
      min-height: 28px;
    }

    .app-connect-btn {
      width: 100%;
      padding: 6px 0;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;

      &.btn-primary {
        background: var(--color-primary, #5c35d9);
        color: white;

        &:hover {
          background: #4a27c0;
        }
      }

      &.btn-disabled {
        background: #e0e0e0;
        color: #aaa;
        cursor: not-allowed;
      }
    }
  }

  .app-card--more {
    border: 1.5px dashed #d0d0d0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #aaa;
    min-height: 140px;
    cursor: default;

    &:hover {
      box-shadow: none;
    }

    .more-icon {
      font-size: 22px;
      margin-bottom: 6px;
    }

    .more-text {
      font-size: 11px;
    }
  }
}

// ══════════════════════════════════════
// ConnectApiWizard Modal
// ══════════════════════════════════════

.ConnectApiWizard {
  // ── 步驟指示器 ──
  .wizard-step-indicator {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 24px;

    .step-node {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      transition: background 0.2s, color 0.2s;

      &.is-done {
        background: var(--color-primary, #5c35d9);
        color: white;
      }

      &.is-active {
        background: var(--color-primary, #5c35d9);
        color: white;
      }

      &.is-pending {
        background: #e0e0e0;
        color: #aaa;
      }
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: #e0e0e0;

      &.is-done {
        background: var(--color-primary, #5c35d9);
      }
    }
  }

  // ── 表單 ──
  .wizard-body {
    min-height: 260px;
  }

  .form-field {
    margin-bottom: 16px;

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 5px;
      color: var(--color-text);

      .required {
        color: var(--color-danger, #e53935);
        margin-left: 2px;
      }

      .form-hint {
        font-weight: 400;
        color: var(--color-grey-1);
      }
    }

    .form-error {
      font-size: 11px;
      color: var(--color-danger, #e53935);
      margin-top: 4px;
    }
  }

  .method-toggle {
    display: flex;
    gap: 6px;

    .method-btn {
      padding: 7px 20px;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: white;
      cursor: pointer;

      &.is-active {
        border-color: var(--color-primary, #5c35d9);
        background: #f3f0ff;
        color: var(--color-primary, #5c35d9);
      }
    }
  }

  .kv-list {
    .kv-row {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;

      .kv-key { flex: 0 0 140px; }
      .kv-value { flex: 1; }

      .kv-remove-btn {
        padding: 0 6px;
        border: none;
        background: transparent;
        color: var(--color-grey-1);
        cursor: pointer;
        font-size: 16px;

        &:hover { color: var(--color-danger, #e53935); }
      }
    }

    .add-kv-btn {
      font-size: 12px;
      padding: 5px 12px;
    }
  }

  .body-textarea {
    height: 80px;
    resize: vertical;
    font-family: monospace;
    font-size: 12px;
  }

  // ── Step 2：API 預覽 ──
  .api-test-box {
    background: #f0f4ff;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;

    .api-test-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .api-test-title {
        font-size: 12px;
        font-weight: 600;
      }
    }

    .api-response-preview {
      background: #1e1e2e;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 11px;
      color: #a8d8a8;
      max-height: 120px;
      overflow-y: auto;
      white-space: pre;
    }

    .api-test-placeholder {
      text-align: center;
      color: var(--color-grey-1);
      font-size: 12px;
      padding: 12px 0;
    }
  }

  .field-map-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .field-map-label {
      display: block;
      font-size: 11px;
      color: var(--color-grey-1);
      margin-bottom: 4px;
    }
  }

  .form-hint-text {
    font-size: 11px;
    color: var(--color-grey-1);
    margin-top: 5px;
  }

  // ── Step 3：同步頻率 ──
  .schedule-options {
    display: flex;
    gap: 8px;

    .schedule-option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;

      input[type='radio'] { display: none; }

      &.is-active {
        border-color: var(--color-primary, #5c35d9);
        background: #f3f0ff;
        color: var(--color-primary, #5c35d9);
        font-weight: 600;
      }
    }
  }

  // ── 完成確認提示 ──
  .confirm-hint {
    background: #f0fff4;
    border: 1px solid #c8e6c9;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    color: #2e7d32;
    margin-top: 12px;
  }

  // ── Footer ──
  .modal-footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
```

- [ ] **Step 2：在 _index.scss 最後加入 @import**

開啟 `src/scss/components/_index.scss`，在最後一行加入：

```scss
@import "./DataSourceTab";
```

- [ ] **Step 3：在 _Knowledge.scss 的 .KnowledgeBase 選擇器內新增 API badge 樣式**

找到 `src/scss/views/_Knowledge.scss`，在 `.knowledge-icon` 區塊後面加入：

```scss
  // ── API 來源條目標記 ──
  .knowledge-icon--api {
    background: rgba(92, 53, 217, 0.08);
    color: var(--color-primary, #5c35d9);
  }

  .api-source-badge {
    display: inline-flex;
    align-items: center;
    background: #ede9fe;
    color: var(--color-primary, #5c35d9);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
```

- [ ] **Step 4：Commit**

```bash
git add src/scss/components/_DataSourceTab.scss src/scss/components/_index.scss src/scss/views/_Knowledge.scss
git commit -m "feat(knowledge): add DataSourceTab and ConnectApiWizard SCSS"
```

---

## Task 6：建立 ConnectApiWizard.vue

**Files:**
- Create: `src/components/Knowledge/ConnectApiWizard.vue`

- [ ] **Step 1：建立元件檔案**

```vue
<!-- src/components/Knowledge/ConnectApiWizard.vue -->
<template>
  <compModal
    class="ConnectApiWizard"
    v-model="isOpenModal"
    :width="560"
  >
    <template #title>
      <h4>連接自訂 API</h4>
    </template>

    <!-- 步驟指示器 -->
    <div class="wizard-step-indicator">
      <template v-for="n in 3" :key="n">
        <div :class="['step-node', stepNodeClass(n)]">
          <span v-if="currentStep > n">✓</span>
          <span v-else>{{ n }}</span>
        </div>
        <div v-if="n < 3" :class="['step-line', { 'is-done': currentStep > n }]"></div>
      </template>
    </div>

    <div class="wizard-body">
      <!-- ── Step 1：API 設定 ── -->
      <template v-if="currentStep === 1">
        <div class="form-field">
          <label class="form-label">API URL <span class="required">*</span></label>
          <input class="custom-input" v-model="form.url" placeholder="https://api.example.com/endpoint" />
          <div v-if="urlError" class="form-error">{{ urlError }}</div>
        </div>

        <div class="form-field">
          <label class="form-label">HTTP Method</label>
          <div class="method-toggle">
            <button
              v-for="m in ['GET', 'POST']"
              :key="m"
              :class="['method-btn', { 'is-active': form.method === m }]"
              @click="form.method = m as 'GET' | 'POST'"
            >{{ m }}</button>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Headers <span class="form-hint">（選填）</span></label>
          <div class="kv-list">
            <div class="kv-row" v-for="(header, i) in form.headers" :key="i">
              <input class="custom-input kv-key" v-model="header.key" placeholder="Key" />
              <input class="custom-input kv-value" v-model="header.value" placeholder="Value" />
              <button class="kv-remove-btn" @click="removeHeader(i)">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
            <button class="custom-btn add-kv-btn" @click="addHeader">
              <i class="material-symbols-outlined">add</i>
              新增 Header
            </button>
          </div>
        </div>

        <div class="form-field" v-if="form.method === 'POST'">
          <label class="form-label">Request Body <span class="form-hint">（JSON 格式）</span></label>
          <textarea class="custom-input body-textarea" v-model="form.body" placeholder='{"key": "value"}'></textarea>
        </div>
      </template>

      <!-- ── Step 2：欄位對應 ── -->
      <template v-if="currentStep === 2">
        <div class="api-test-box">
          <div class="api-test-header">
            <span class="api-test-title">API 回傳預覽</span>
            <button class="custom-btn custom-main-btn" style="font-size:11px;padding:4px 12px;" @click="testApi" :disabled="isTesting">
              <i class="material-symbols-outlined" :class="{ 'spin': isTesting }">{{ isTesting ? 'sync' : 'play_arrow' }}</i>
              {{ isTesting ? '測試中...' : '測試 API' }}
            </button>
          </div>
          <div v-if="mockResponse" class="api-response-preview">{{ mockResponse }}</div>
          <div v-else class="api-test-placeholder">點擊「測試 API」查看回傳資料結構</div>
        </div>

        <div class="form-field">
          <label class="form-label">回傳欄位對應 <span class="required">*</span></label>
          <div class="field-map-row">
            <div>
              <span class="field-map-label">標題欄位名稱</span>
              <input class="custom-input" v-model="form.titleField" placeholder="例：title" />
            </div>
            <div>
              <span class="field-map-label">內容欄位名稱</span>
              <input class="custom-input" v-model="form.contentField" placeholder="例：content" />
            </div>
          </div>
          <div class="form-hint-text">對應 API 回傳 JSON 中的 key 名稱</div>
        </div>
      </template>

      <!-- ── Step 3：條目設定 ── -->
      <template v-if="currentStep === 3">
        <div class="form-field">
          <label class="form-label">知識條目名稱 <span class="required">*</span></label>
          <input class="custom-input" v-model="form.name" placeholder="例：商品目錄" />
        </div>

        <div class="form-field">
          <label class="form-label">分類</label>
          <select class="custom-input" v-model="form.category">
            <option value="">（不分類）</option>
            <option value="商品文件">商品文件</option>
            <option value="系統文件">系統文件</option>
            <option value="客服知識">客服知識</option>
            <option value="規則說明">規則說明</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">同步頻率</label>
          <div class="schedule-options">
            <label
              v-for="opt in scheduleOptions"
              :key="opt.value"
              :class="['schedule-option', { 'is-active': form.schedule === opt.value }]"
            >
              <input type="radio" :value="opt.value" v-model="form.schedule" />
              <i class="material-symbols-outlined" style="font-size:15px;">{{ opt.icon }}</i>
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div class="confirm-hint">
          ✓ 完成後將建立「{{ form.name || '（未命名）' }}」知識條目，並自動執行首次同步
        </div>
      </template>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <button class="custom-btn" v-if="currentStep > 1" @click="currentStep--">← 上一步</button>
        <span v-else></span>
        <button
          v-if="currentStep < 3"
          class="custom-btn custom-main-btn"
          :disabled="!isStepValid"
          @click="currentStep++"
        >下一步 →</button>
        <button
          v-if="currentStep === 3"
          class="custom-btn custom-main-btn"
          :disabled="!isStepValid"
          @click="handleComplete"
        >完成並同步 ✓</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import compModal from '@/components/compModal/compModal.vue';
import type { WizardPayload } from '@/stores/knowledgeStore';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'complete', payload: WizardPayload): void;
}>();

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const currentStep = ref(1);
const isTesting = ref(false);
const mockResponse = ref('');

const scheduleOptions = [
  { value: 'MANUAL', label: '手動', icon: 'touch_app' },
  { value: 'DAILY',  label: '每天', icon: 'today' },
  { value: 'WEEKLY', label: '每週', icon: 'date_range' },
] as const;

const defaultForm = (): WizardPayload => ({
  url: '',
  method: 'GET',
  headers: [],
  body: '',
  titleField: '',
  contentField: '',
  name: '',
  category: '',
  schedule: 'MANUAL',
});

const form = ref<WizardPayload>(defaultForm());

// 每次開啟時重置
watch(() => props.modelValue, (val) => {
  if (val) {
    currentStep.value = 1;
    mockResponse.value = '';
    form.value = defaultForm();
  }
});

// ── 驗證 ──
const urlError = computed(() => {
  if (!form.value.url) return '';
  try { new URL(form.value.url); return ''; }
  catch { return '請輸入有效的 URL（需包含 https://）'; }
});

const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return !!form.value.url.trim() && !urlError.value;
  }
  if (currentStep.value === 2) {
    return !!form.value.titleField.trim() && !!form.value.contentField.trim();
  }
  return !!form.value.name.trim();
});

// ── Step 指示器 class ──
function stepNodeClass(n: number) {
  if (currentStep.value > n) return 'is-done';
  if (currentStep.value === n) return 'is-active';
  return 'is-pending';
}

// ── Headers 操作 ──
function addHeader() {
  form.value.headers.push({ key: '', value: '' });
}
function removeHeader(i: number) {
  form.value.headers.splice(i, 1);
}

// ── 測試 API（mock） ──
function testApi() {
  isTesting.value = true;
  mockResponse.value = '';
  setTimeout(() => {
    const t = form.value.titleField || 'title';
    const c = form.value.contentField || 'content';
    mockResponse.value = JSON.stringify(
      [1, 2, 3].map(i => ({ [t]: `範例標題 ${i}`, [c]: `範例內容 ${i}...` })),
      null,
      2
    );
    isTesting.value = false;
  }, 800);
}

// ── 完成 ──
function handleComplete() {
  if (!isStepValid.value) return;
  emit('complete', { ...form.value });
  isOpenModal.value = false;
}
</script>
```

- [ ] **Step 2：Commit**

```bash
git add src/components/Knowledge/ConnectApiWizard.vue
git commit -m "feat(knowledge): add ConnectApiWizard 3-step modal"
```

---

## Task 7：建立 DataSourceTab.vue

**Files:**
- Create: `src/components/Knowledge/DataSourceTab.vue`

- [ ] **Step 1：建立元件**

```vue
<!-- src/components/Knowledge/DataSourceTab.vue -->
<template>
  <div class="DataSourceTab">

    <div class="section-desc">連接外部資料來源，系統將自動同步資料並在知識庫建立對應的知識條目</div>

    <!-- 已連接 -->
    <div v-if="connectedSources.length > 0" class="connected-section">
      <div class="section-label">已連接（{{ connectedSources.length }}）</div>
      <div class="source-cards">
        <div class="source-card" v-for="source in connectedSources" :key="source.id">
          <div class="source-card-status">已連接</div>
          <div class="source-icon">
            <i class="material-symbols-outlined">api</i>
          </div>
          <div class="source-name">{{ source.name }}</div>
          <div class="source-type-label">自訂 REST API</div>
          <div class="source-sync-info">
            <template v-if="source.lastSyncAt">
              上次同步：{{ source.lastSyncAt }}
            </template>
            <template v-else>尚未同步</template>
          </div>
          <div class="source-card-actions">
            <button @click="handleSync(source.id)" :disabled="syncingId === source.id">
              <i class="material-symbols-outlined" style="font-size:14px;" :class="{ 'spin': syncingId === source.id }">sync</i>
              {{ syncingId === source.id ? '同步中' : '立即同步' }}
            </button>
            <button @click="openEdit(source.id)" v-tooltip="'設定'">
              <i class="material-symbols-outlined" style="font-size:14px;">settings</i>
              設定
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 可連接的 App Grid -->
    <div class="app-section">
      <div class="section-label">可連接的應用程式</div>
      <div class="app-grid">

        <!-- 自訂 API（唯一真實功能） -->
        <div class="app-card" @click="showWizard = true">
          <div class="app-icon" style="background:#f0f0ff;">
            <i class="material-symbols-outlined" style="color:#5c35d9;">api</i>
          </div>
          <div class="app-name">自訂 API</div>
          <div class="app-desc">連接任意 REST API 端點</div>
          <button class="app-connect-btn btn-primary">連接</button>
        </div>

        <!-- 佔位 App 卡片 -->
        <div
          class="app-card app-card--disabled"
          v-for="app in placeholderApps"
          :key="app.name"
        >
          <div class="app-icon" :style="{ background: app.iconBg }">
            <i class="material-symbols-outlined" :style="{ color: app.iconColor }">{{ app.icon }}</i>
          </div>
          <div class="app-name">{{ app.name }}</div>
          <div class="app-desc">{{ app.desc }}</div>
          <button class="app-connect-btn btn-disabled" disabled>即將推出</button>
        </div>

        <!-- 更多整合 -->
        <div class="app-card app-card--more">
          <div class="more-icon">＋</div>
          <div class="more-text">更多整合即將推出</div>
        </div>

      </div>
    </div>

    <!-- Wizard -->
    <ConnectApiWizard v-model="showWizard" @complete="handleWizardComplete" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import ConnectApiWizard from '@/components/Knowledge/ConnectApiWizard.vue';
import type { WizardPayload } from '@/stores/knowledgeStore';
import popDialog from '@/services/popDialog';

const knowledgeStore = useKnowledgeStore();
const { apiSources, knowledgeList } = storeToRefs(knowledgeStore);

const showWizard = ref(false);
const syncingId = ref<string | null>(null);

// 已連接：apiSources 中有對應 KnowledgeItem 的
const connectedSources = computed(() =>
  apiSources.value.filter(s =>
    knowledgeList.value.some(k => k.apiSourceId === s.id)
  )
);

const placeholderApps = [
  { name: 'Google 雲端硬碟', desc: '同步雲端文件至知識庫', icon: 'folder', iconBg: '#e8f0fe', iconColor: '#4285F4' },
  { name: 'Notion', desc: '從 Notion 頁面匯入知識', icon: 'article', iconBg: '#f5f5f5', iconColor: '#333' },
  { name: 'SharePoint', desc: '企業內部文件庫', icon: 'corporate_fare', iconBg: '#e8f4fd', iconColor: '#0078D4' },
  { name: 'Slack', desc: '頻道訊息轉化為知識條目', icon: 'forum', iconBg: '#fce8ff', iconColor: '#4A154B' },
];

async function handleWizardComplete(payload: WizardPayload) {
  // 1. 建立 ApiSource
  const apiSourceId = knowledgeStore.createApiSource({
    name: payload.name,
    url: payload.url,
    method: payload.method,
    headers: payload.headers,
    body: payload.body,
    titleField: payload.titleField,
    contentField: payload.contentField,
    schedule: payload.schedule,
    enabled: true,
  });

  // 2. 建立關聯的 KnowledgeItem
  knowledgeStore.createKnowledgeFromApiSource({
    apiSourceId,
    apiSourceName: payload.name,
    name: payload.name,
    category: payload.category,
  });

  // 3. 觸發首次同步
  syncingId.value = apiSourceId;
  try {
    await knowledgeStore.triggerSync(apiSourceId);
    const source = apiSources.value.find(s => s.id === apiSourceId);
    if (source?.lastSyncStatus === 'SUCCESS') {
      popDialog.alert(`「${payload.name}」已連接，成功同步 ${source.lastSyncCount} 筆資料`);
    } else {
      popDialog.alert(`「${payload.name}」已連接，但首次同步失敗，請稍後手動重試`);
    }
  } finally {
    syncingId.value = null;
  }
}

async function handleSync(id: string) {
  syncingId.value = id;
  try {
    await knowledgeStore.triggerSync(id);
    const source = apiSources.value.find(s => s.id === id);
    if (source?.lastSyncStatus === 'SUCCESS') {
      popDialog.alert(`同步成功，已更新知識條目（${source.lastSyncCount} 筆）`);
    } else {
      popDialog.alert(`同步失敗：${source?.lastSyncError ?? '未知錯誤'}`);
    }
  } finally {
    syncingId.value = null;
  }
}

function openEdit(id: string) {
  popDialog.alert('功能開發中：編輯 API 來源設定');
}
</script>
```

- [ ] **Step 2：Commit**

```bash
git add src/components/Knowledge/DataSourceTab.vue
git commit -m "feat(knowledge): add DataSourceTab with app card grid"
```

---

## Task 8：更新 KnowledgeBase.vue

**Files:**
- Modify: `src/views/KnowledgeBase.vue`

- [ ] **Step 1：在 `<script setup>` 新增 import 與 Tab 狀態**

在現有 import 區塊最後加入：

```typescript
import DataSourceTab from '@/components/Knowledge/DataSourceTab.vue';
```

在 `const router = useRouter()` 後面加入：

```typescript
const activeTab = ref<'items' | 'sources'>('items');
```

在 `const { knowledgeList, apiSources } = ...` 的 storeToRefs 中也引入 `apiSources`（用於 apiSourceMap）：

```typescript
const { apiSources } = storeToRefs(knowledgeStore);

const apiSourceMap = computed(() =>
  Object.fromEntries(apiSources.value.map(s => [s.id, s]))
);
```

- [ ] **Step 2：在 `<template>` 的 `views-page-header` 區塊後，加入 Tab 切換列**

找到：
```html
<AppSkeleton v-if="isLoading" type="list" class="mt-4" />
```

在它前面插入：
```html
<!-- Tab 切換 -->
<div class="kb-tab-nav">
  <button
    :class="['kb-tab', { 'is-active': activeTab === 'items' }]"
    @click="activeTab = 'items'"
  >
    <i class="material-symbols-outlined">menu_book</i>
    知識條目
  </button>
  <button
    :class="['kb-tab', { 'is-active': activeTab === 'sources' }]"
    @click="activeTab = 'sources'"
  >
    <i class="material-symbols-outlined">api</i>
    資料來源
  </button>
</div>

<!-- 資料來源 Tab -->
<DataSourceTab v-if="activeTab === 'sources'" />
```

- [ ] **Step 3：在 AppSkeleton、AppErrorState 和 `<template v-else>` 整段，外層加上 v-show**

找到：
```html
<AppSkeleton v-if="isLoading" type="list" class="mt-4" />
<AppErrorState
  v-else-if="hasError"
  ...
/>
<template v-else>
  ...
</template>
```

在整個區塊外包一層：
```html
<div v-show="activeTab === 'items'">
  <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
  <AppErrorState v-else-if="hasError" ... />
  <template v-else>
    ...
  </template>
</div>
```

- [ ] **Step 4：修改知識條目列表的第一個 `<td>`，讓 API 來源條目顯示特殊圖示與 badge**

找到現有的 `<td>` 第一欄（含 `.knowledge-icon` 的那段），替換為：

```html
<td>
  <div class="d-flex align-items-center">
    <div :class="['knowledge-icon', 'mr-3', { 'knowledge-icon--api': item.sourceType === 'API' }]">
      <i class="material-symbols-outlined">{{ item.sourceType === 'API' ? 'api' : 'menu_book' }}</i>
    </div>
    <div>
      <div class="d-flex align-items-center gap-2">
        <div class="entry-title cursor-pointer" @click="goToDetail(item.id)">{{ item.title }}</div>
        <span v-if="item.sourceType === 'API'" class="api-source-badge">API 同步</span>
        <span
          v-if="item.sourceStale"
          class="source-stale-badge"
          @click.stop="openSourceUpdateModal(item)"
        >
          <i class="material-symbols-outlined">update</i>
          來源已更新
        </span>
      </div>
      <div class="entry-id">
        <template v-if="item.sourceType === 'API'">
          來源：{{ item.apiSourceName }} ・ 上次同步：{{ apiSourceMap[item.apiSourceId!]?.lastSyncAt ?? '—' }}
        </template>
        <template v-else>{{ item.id }}</template>
      </div>
    </div>
  </div>
</td>
```

- [ ] **Step 5：在 _Knowledge.scss 中新增 kb-tab-nav 樣式**

開啟 `src/scss/views/_Knowledge.scss`，在 `.KnowledgeBase` 選擇器內加入：

```scss
  // ── Tab 切換列 ──
  .kb-tab-nav {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-border, #e8e8e8);
    margin-bottom: 24px;
    padding: 0 0 0 2px;
  }

  .kb-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-grey-1);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;

    &:hover {
      color: var(--color-text);
    }

    &.is-active {
      color: var(--color-primary, #5c35d9);
      font-weight: 600;
      border-bottom-color: var(--color-primary, #5c35d9);
    }
  }
```

- [ ] **Step 6：移除 goToApiSources 函式（不再使用舊頁面）**

在 `KnowledgeBase.vue` 的 `<script setup>` 中，找到並刪除：

```typescript
function goToApiSources() {
  showAddDropdown.value = false;
  router.push({ name: 'KnowledgeApiSources' });
}
```

同時在 template 中，找到 `@click="goToApiSources"` 的按鈕（API 來源管理 option-item），整個 `<div class="option-item">` 刪除。

- [ ] **Step 7：Commit**

```bash
git add src/views/KnowledgeBase.vue src/scss/views/_Knowledge.scss
git commit -m "feat(knowledge): add datasource tab and API badge to knowledge list"
```

---

## Task 9：移除舊檔案 + 更新 Router

**Files:**
- Delete: `src/views/KnowledgeApiSources.vue`
- Delete: `src/components/Knowledge/ApiSourceModal.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1：刪除舊的 view 與 modal**

```bash
rm src/views/KnowledgeApiSources.vue
rm src/components/Knowledge/ApiSourceModal.vue
```

- [ ] **Step 2：移除 Router 路由**

開啟 `src/router/index.ts`，找到並刪除以下整個物件：

```typescript
{
  path: '/view/KnowledgeApiSources',
  name: 'KnowledgeApiSources',
  component: () => import('@/views/KnowledgeApiSources.vue'),
},
```

- [ ] **Step 3：確認 TypeScript 型別無誤**

```bash
npm run type-check
```

預期：無錯誤（若有 `KnowledgeApiSources` 相關的 type error 須一併修正）

- [ ] **Step 4：執行全部 unit 測試**

```bash
npm run test:unit
```

預期：全部 PASS

- [ ] **Step 5：啟動 dev server，手動驗證**

```bash
npm run dev
```

驗證清單：
- 進入知識庫管理頁，看到「知識條目」和「資料來源」兩個 Tab
- 切到「資料來源」Tab，看到 App 卡片 Grid
- 點「自訂 API」的「連接」，開啟三步驟 Wizard
- Step 1 填 URL（https://api.example.com/products），Next
- Step 2 點「測試 API」，出現 mock JSON 預覽；填 titleField = `title`、contentField = `content`，Next
- Step 3 填知識條目名稱「商品目錄」，選分類，按「完成並同步」
- 等待 2 秒，出現成功 alert
- 切回「知識條目」Tab，看到新的「商品目錄」條目，帶 🔌 icon 和「API 同步」badge
- 「資料來源」Tab 的已連接區塊出現「商品目錄」卡片，可手動再次同步

- [ ] **Step 6：最終 Commit**

```bash
git add src/router/index.ts
git commit -m "feat(knowledge): remove legacy KnowledgeApiSources and update router

舊的 KnowledgeApiSources.vue 與 ApiSourceModal.vue 已由 DataSourceTab 和
ConnectApiWizard 取代，移除對應路由與檔案"
```
