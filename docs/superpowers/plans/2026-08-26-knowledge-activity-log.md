# 知識庫活動紀錄（Activity Log）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把送審／核准／退回／撤回／發佈／切換版本這六種動作，統一記錄成一份掛在 `KnowledgeItem` 身上、跨版本、按時間排序的活動紀錄（`activityLog`），取代目前散落在各版本自己身上的 `reviewHistory`，並補上目前完全沒有互動路徑可達的「審核通過但先不發佈」狀態轉換，最後在詳情頁新增「活動紀錄」分頁呈現。

**Architecture:** 資料面：`KnowledgeItem.activityLog: ActivityRecord[]` 是唯一的稽核紀錄來源，各 store action 在既有狀態轉換邏輯之後追加一筆（或兩筆）紀錄，透過共用的 `pushActivity` helper 寫入，`versionId`/`replacedVersionId` 讓一筆紀錄可以描述橫跨兩個版本的事件（切換版本）。UI 面：`KnowledgeDetail.vue` 新增一個純粹時間軸樣式的分頁讀取這份資料；`isPipelineReview` 判斷邏輯改讀這份資料而不是版本自己的 `reviewHistory`；`ReviewDrawer.vue` 新增「僅核准（待發佈）」按鈕，讓 `reviewing → approved` 這個轉換第一次有真正的互動入口。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia setup store（`src/stores/knowledgeStore.ts`）、Vitest（`src/stores/__tests__/`、`src/views/__tests__/`）、SCSS（`src/scss/views/_KnowledgeDetail.scss`、`_KnowledgeBase.scss`，兩者皆已在 `_index.scss` 被 `@forward`，不需要新增檔案）。

**Spec:** `docs/superpowers/specs/2026-08-26-knowledge-activity-log-design.md`

## Global Constraints

- `by` 欄位一律沿用既有 `'Current User'` 佔位慣例（沒有真實登入系統），跟 `approveVersion` 現有寫法一致。
- 所有新增／修改的中文文案，比照現有 `statusLabelMap`／按鈕文字的用詞風格（例如「已核准・待發佈」已經是既有詞彙，直接沿用）。
- 不新增 SCSS 檔案；新樣式加進已經被 `_index.scss` `@forward` 的既有檔案（`_KnowledgeDetail.scss`、`_KnowledgeBase.scss`）。
- 每個 store action 只在既有邏輯**之後**追加 `activityLog` 寫入，不改動既有的狀態轉換／欄位賦值邏輯本身，確保 `knowledgeStore.multiFileSources.test.ts` 既有斷言不受影響。
- 實作偏離 spec 的地方：spec 描述 `KnowledgeItem.activityLog: ActivityRecord[]`（必填），本計畫改為 `activityLog?: ActivityRecord[]`（選填，讀取端一律 `?? []`／`?.` 防護）。這樣可以避免逐一修改另外 13 筆從未有審核紀錄、跟這次需求無關的 mock item，行為上兩者等價（沒有活動紀錄的項目一律顯示「尚無活動紀錄」）。

---

## Task 1：新增型別定義（additive only，不刪舊的）

**Files:**
- Modify: `src/stores/knowledgeStore.ts:15-21`（在 `hasEarnedVersionNumber` 後面插入）、`:214-233`（`KnowledgeItem` interface）

**Interfaces:**
- Produces: `ActivityAction`（union type）、`ActivityRecord`（interface）、`KnowledgeItem.activityLog?: ActivityRecord[]`

- [ ] **Step 1：在 `hasEarnedVersionNumber` 函式後面插入新型別**

在 `src/stores/knowledgeStore.ts` 找到：

```ts
export function hasEarnedVersionNumber(status: VersionStatus | undefined | null): boolean {
  return status === 'approved' || status === 'active' || status === 'history'
}
export type VersionType = 'MAJOR' | 'MINOR'
```

改成：

```ts
export function hasEarnedVersionNumber(status: VersionStatus | undefined | null): boolean {
  return status === 'approved' || status === 'active' || status === 'history'
}

// 知識庫條目層級的完整活動紀錄：送審／核准／退回／撤回／發佈／切換版本，
// 取代原本掛在每個版本自己身上的 reviewHistory——這幾種動作（尤其發佈、切換）
// 本質上常常牽涉兩個版本，掛在單一版本自己身上沒有自然的歸屬。
export type ActivityAction =
  | 'SUBMITTED'   // 送審
  | 'APPROVED'    // 核准
  | 'REJECTED'    // 退回
  | 'WITHDRAWN'   // 撤回審核
  | 'PUBLISHED'   // 正式發佈上線
  | 'SWITCHED'    // 切換回某個歷史版本

export interface ActivityRecord {
  id: string
  action: ActivityAction
  by: string
  time: string
  versionId: string             // 這筆事件主要對應哪個版本
  versionNumber: string         // 當時的版號快照，版本以後有異動也不影響這筆歷史紀錄
  note?: string
  replacedVersionId?: string    // 只有 SWITCHED 會用到：被換下去的是哪一版
  replacedVersionNumber?: string
}

export type VersionType = 'MAJOR' | 'MINOR'
```

- [ ] **Step 2：`KnowledgeItem` interface 新增 `activityLog` 欄位**

找到：

```ts
export interface KnowledgeItem {
  id: string
  title: string
  category: string
  status: ItemStatus
  sourceType: SourceType
  pipelineProgress: number
  pipelineStage: PipelineStage | null
  pipelineError: string | null
  sourceStale: boolean
  staleSourceFileIds: string[]
  lastSyncAt: string | null
  apiSourceId: string | null
  apiSourceName: string | null
  versions: KnowledgeVersion[]
  lastUpdateTime: string
  lastUpdateBy: string
  integrationSourceId?: string
  notionPageId?: string
}
```

改成（只加最後一行）：

```ts
export interface KnowledgeItem {
  id: string
  title: string
  category: string
  status: ItemStatus
  sourceType: SourceType
  pipelineProgress: number
  pipelineStage: PipelineStage | null
  pipelineError: string | null
  sourceStale: boolean
  staleSourceFileIds: string[]
  lastSyncAt: string | null
  apiSourceId: string | null
  apiSourceName: string | null
  versions: KnowledgeVersion[]
  lastUpdateTime: string
  lastUpdateBy: string
  integrationSourceId?: string
  notionPageId?: string
  activityLog?: ActivityRecord[]
}
```

- [ ] **Step 3：型別檢查確認純新增不報錯**

Run: `npx vue-tsc --noEmit -p tsconfig.json`
Expected: 無輸出（通過）。這一步是純新增型別，不可能有既有程式碼因此壞掉。

- [ ] **Step 4：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(knowledge): add ActivityRecord type and KnowledgeItem.activityLog field"
```

---

## Task 2：新增 `pushActivity` 共用寫入函式

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（`getKnowledgeById`／`getVersionById` 附近，store 內部函式區）
- Test: `src/stores/__tests__/knowledgeStore.activityLog.test.ts`（新建）

**Interfaces:**
- Consumes: `KnowledgeItem`（Task 1）、`ActivityRecord`（Task 1）
- Produces: `pushActivity(k: KnowledgeItem, entry: Omit<ActivityRecord, 'id'>): void`——後面所有 action 都呼叫這個函式寫入紀錄

- [ ] **Step 1：寫失敗的測試**

新建 `src/stores/__tests__/knowledgeStore.activityLog.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — activityLog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('submitForReview 寫入 activityLog', () => {
    it('送審後，activityLog 新增一筆 SUBMITTED 紀錄，帶正確的 versionId/versionNumber/by/note', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      // v2.0 在 mock data 裡已經是 reviewing 狀態，先撤回讓它變回 draft 才能重新送審
      store.withdrawReview('k2', versionId)
      store.submitForReview('k2', versionId, 'Tester', '測試送審備註')

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('SUBMITTED')
      expect(entry.by).toBe('Tester')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
      expect(entry.note).toBe('測試送審備註')
      expect(entry.id).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2：跑測試，確認失敗（因為 `submitForReview` 還沒寫入 `activityLog`）**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: FAIL —— `entry` 是 `undefined`（`log` 是空陣列），或是 `Cannot read properties of undefined`。

- [ ] **Step 3：新增 `pushActivity` 函式**

在 `src/stores/knowledgeStore.ts` 找到 `getVersionById` 的定義（在 `getKnowledgeById` 附近），在它後面插入：

```ts
  // 統一寫入活動紀錄的入口：所有 action（送審／核准／退回／撤回／發佈／切換）
  // 都透過這個函式追加，不直接操作 k.activityLog，確保欄位一致、id 一律自動產生。
  function pushActivity(k: KnowledgeItem, entry: Omit<ActivityRecord, 'id'>) {
    if (!k.activityLog) k.activityLog = []
    k.activityLog.push({ id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...entry })
  }
```

（`getKnowledgeById`／`getVersionById` 目前在 `src/stores/knowledgeStore.ts:114-120` 一帶，若行號因為 Task 1 已經位移，用函式名稱搜尋定位即可。）

- [ ] **Step 4：把 `pushActivity` 接上 `submitForReview`**

找到（此時內容應該還是 Task 1 之前的樣子，因為 Task 1 沒有動這段）：

```ts
  const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && (v.status === 'draft' || v.status === 'rejected')) {
      v.status = 'reviewing';
      v.reviewNote = note;
      v.reviewHistory = [
        ...(v.reviewHistory ?? []),
        {
          action: 'SUBMITTED',
          by: reviewerId,
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note,
        },
      ];
      k.status = 'reviewing';
    }
  };
```

改成（`reviewHistory` 寫入先保留不動，Task 11 才會整個移除——這裡只是在後面加一段）：

```ts
  const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && (v.status === 'draft' || v.status === 'rejected')) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      v.status = 'reviewing';
      v.reviewNote = note;
      v.reviewHistory = [
        ...(v.reviewHistory ?? []),
        { action: 'SUBMITTED', by: reviewerId, time: now, note },
      ];
      k.status = 'reviewing';

      pushActivity(k, {
        action: 'SUBMITTED',
        by: reviewerId,
        time: now,
        versionId: v.id,
        versionNumber: v.versionNumber,
        note,
      });
    }
  };
```

- [ ] **Step 5：跑測試，確認通過**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: PASS

- [ ] **Step 6：型別檢查 + 既有測試回歸**

Run: `npx vue-tsc --noEmit -p tsconfig.json`
Expected: 無輸出

Run: `npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`
Expected: 6 個測試全數 PASS（`submitForReview` 的既有行為完全沒變，只是多寫了一筆 `activityLog`）

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts
git commit -m "feat(knowledge): add pushActivity helper, wire into submitForReview"
```

---

## Task 3：把 `rejectVersion` / `withdrawReview` 接上 `activityLog`

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（`rejectVersion`、`withdrawReview`）
- Test: `src/stores/__tests__/knowledgeStore.activityLog.test.ts`

**Interfaces:**
- Consumes: `pushActivity`（Task 2）

- [ ] **Step 1：新增失敗的測試**

在 `knowledgeStore.activityLog.test.ts` 的 `describe('knowledgeStore — activityLog', ...)` 區塊內，`submitForReview 寫入 activityLog` 這個 `describe` 後面新增：

```ts
  describe('rejectVersion 寫入 activityLog', () => {
    it('退回後，activityLog 新增一筆 REJECTED 紀錄，帶 note', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.rejectVersion('k2', versionId, '權限矩陣有誤，請修正後重新送審')

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('REJECTED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
      expect(entry.note).toBe('權限矩陣有誤，請修正後重新送審')
    })
  })

  describe('withdrawReview 寫入 activityLog', () => {
    it('撤回審核後，activityLog 新增一筆 WITHDRAWN 紀錄', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.withdrawReview('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('WITHDRAWN')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
    })
  })
```

- [ ] **Step 2：跑測試，確認兩個新測試都失敗**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 前一個（`submitForReview`）PASS，新增的兩個 FAIL（`entry` 是 `undefined`）

- [ ] **Step 3：`rejectVersion` 接上 `pushActivity`**

找到：

```ts
  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'rejected';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'pending';
  };
```

改成：

```ts
  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'rejected';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'pending';

    pushActivity(k, {
      action: 'REJECTED',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
      note: feedback,
    });
  };
```

- [ ] **Step 4：`withdrawReview` 接上 `pushActivity`**

找到：

```ts
  const withdrawReview = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'draft';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'pending';
  };
```

改成：

```ts
  const withdrawReview = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'draft';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'pending';

    pushActivity(k, {
      action: 'WITHDRAWN',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
    });
  };
```

- [ ] **Step 5：跑測試，確認全部通過**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 3 個測試全數 PASS

- [ ] **Step 6：既有測試回歸**

Run: `npx vue-tsc --noEmit -p tsconfig.json && npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`
Expected: 型別檢查無輸出；既有 6 個測試全數 PASS

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts
git commit -m "feat(knowledge): wire rejectVersion and withdrawReview into activityLog"
```

---

## Task 4：把 `approveVersion`（一步到位）接上 `activityLog`（寫兩筆）

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（`approveVersion`）
- Test: `src/stores/__tests__/knowledgeStore.activityLog.test.ts`

**Interfaces:**
- Consumes: `pushActivity`（Task 2）

- [ ] **Step 1：新增失敗的測試**

新增：

```ts
  describe('approveVersion（一步到位）寫入 activityLog', () => {
    it('核准並發布後，activityLog 依序新增 APPROVED 與 PUBLISHED 兩筆紀錄，同一時間戳', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.approveVersion('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const last2 = log.slice(-2)
      expect(last2.map(e => e.action)).toEqual(['APPROVED', 'PUBLISHED'])
      last2.forEach(entry => {
        expect(entry.by).toBe('Current User')
        expect(entry.versionId).toBe(versionId)
        expect(entry.versionNumber).toBe('v2.0')
      })
      expect(last2[0].time).toBe(last2[1].time)
    })
  })
```

- [ ] **Step 2：跑測試，確認失敗**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 新測試 FAIL（`log` 沒有這兩筆）

- [ ] **Step 3：`approveVersion` 接上 `pushActivity`**

找到：

```ts
    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    if (syncMembership) {
```

改成：

```ts
    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    pushActivity(k, { action: 'APPROVED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });
    pushActivity(k, { action: 'PUBLISHED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });

    if (syncMembership) {
```

（一步到位的核准，「核准」跟「發佈」是同一刻發生，所以兩筆紀錄用同一個 `now` 時間戳，維持時間軸語意一致：不管走一步到位還是分兩步，`APPROVED` 永遠代表審核通過、`PUBLISHED` 永遠代表正式上線。）

- [ ] **Step 4：跑測試，確認通過**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 全數 PASS

- [ ] **Step 5：既有測試回歸（這個最重要——`approveVersion` 有既有測試覆蓋）**

Run: `npx vue-tsc --noEmit -p tsconfig.json && npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`
Expected: 型別檢查無輸出；既有 6 個測試全數 PASS（`approveVersion — syncMembership callback` 那兩個測試只斷言 `.status` 跟 `syncResult`，不受這次改動影響）

- [ ] **Step 6：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts
git commit -m "feat(knowledge): wire approveVersion into activityLog (APPROVED + PUBLISHED)"
```

---

## Task 5：新增 `approveVersionPending` action（補上 reviewing → approved 的互動路徑）

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（新增 action + 加入 `return {}` 匯出清單）
- Test: `src/stores/__tests__/knowledgeStore.activityLog.test.ts`

**Interfaces:**
- Consumes: `pushActivity`（Task 2）
- Produces: `approveVersionPending(knowledgeId: string, versionId: string): void`——供 Task 9 的 `ReviewDrawer.vue` 呼叫

- [ ] **Step 1：新增失敗的測試**

新增：

```ts
  describe('approveVersionPending（新）', () => {
    it('核准但不發布：版本狀態變 approved、item 狀態變 approved、寫入一筆 APPROVED（不寫 PUBLISHED）', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.approveVersionPending('k2', versionId)

      const updated = store.getKnowledgeById('k2')!
      const version = updated.versions.find(v => v.id === versionId)!
      expect(version.status).toBe('approved')
      expect(version.reviewedBy).toBe('Current User')
      expect(version.reviewedTime).toBeTruthy()
      expect(updated.status).toBe('approved')

      const log = updated.activityLog ?? []
      const last = log[log.length - 1]
      expect(last.action).toBe('APPROVED')
      expect(last.versionId).toBe(versionId)
      expect(log.some(e => e.action === 'PUBLISHED' && e.versionId === versionId)).toBe(false)
    })

    it('版本狀態不是 reviewing 時，不做任何事', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const activeVersionId = item.versions.find(v => v.status === 'active')!.id
      const beforeLogLength = (item.activityLog ?? []).length

      store.approveVersionPending('k2', activeVersionId)

      const updated = store.getKnowledgeById('k2')!
      expect(updated.versions.find(v => v.id === activeVersionId)!.status).toBe('active')
      expect((updated.activityLog ?? []).length).toBe(beforeLogLength)
    })
  })
```

- [ ] **Step 2：跑測試，確認失敗**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: FAIL — `store.approveVersionPending is not a function`

- [ ] **Step 3：新增 `approveVersionPending` action**

在 `src/stores/knowledgeStore.ts` 找到 `approveVersion` 函式結尾的 `};`（Task 4 改完後，函式最後會是 `if (k.sourceType === 'MANUAL') { ... } else { ... }\n  };`），緊接著插入：

```ts
  // 核准但先不發佈：reviewing → approved。這是目前系統裡唯一能讓版本停在
  // 「已核准・待發佈」狀態的互動路徑（之前這個狀態只存在於手寫的展示資料）。
  // item 狀態一併設為 approved，觸發既有的「已核准，待發佈」頭部 UI 與「立即發佈」按鈕。
  const approveVersionPending = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    v.status = 'approved';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;

    k.status = 'approved';
    k.lastUpdateBy = 'Current User';

    pushActivity(k, { action: 'APPROVED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });
  };
```

- [ ] **Step 4：加入 store 的匯出清單**

找到（`return {` 區塊內）：

```ts
    approveVersion,
    publishApprovedVersion,
    switchToVersion,
```

改成：

```ts
    approveVersion,
    approveVersionPending,
    publishApprovedVersion,
    switchToVersion,
```

- [ ] **Step 5：跑測試，確認通過**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 全數 PASS

- [ ] **Step 6：型別檢查 + 既有測試回歸**

Run: `npx vue-tsc --noEmit -p tsconfig.json && npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`
Expected: 兩者皆通過

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts
git commit -m "feat(knowledge): add approveVersionPending action (reviewing -> approved)"
```

---

## Task 6：把 `publishApprovedVersion` / `switchToVersion` 接上 `activityLog`

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（`publishApprovedVersion`、`switchToVersion`）
- Test: `src/stores/__tests__/knowledgeStore.activityLog.test.ts`

**Interfaces:**
- Consumes: `pushActivity`（Task 2）

- [ ] **Step 1：新增失敗的測試**

新增：

```ts
  describe('publishApprovedVersion 寫入 activityLog', () => {
    it('發佈已核准版本後，activityLog 新增一筆 PUBLISHED 紀錄', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v1.2')!.id // mock data 裡已經是 approved

      store.publishApprovedVersion('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('PUBLISHED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v1.2')
    })
  })

  describe('switchToVersion 寫入 activityLog', () => {
    it('切換回歷史版本後，activityLog 新增一筆 SWITCHED 紀錄，帶 replacedVersionId/replacedVersionNumber', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const targetVersion = item.versions.find(v => v.versionNumber === 'v1.0')! // mock data 裡是 history
      const previouslyActive = item.versions.find(v => v.status === 'active')!

      store.switchToVersion('k2', targetVersion.id)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('SWITCHED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(targetVersion.id)
      expect(entry.versionNumber).toBe('v1.0')
      expect(entry.replacedVersionId).toBe(previouslyActive.id)
      expect(entry.replacedVersionNumber).toBe(previouslyActive.versionNumber)
    })
  })
```

- [ ] **Step 2：跑測試，確認兩個都失敗**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 兩個新測試 FAIL

- [ ] **Step 3：`publishApprovedVersion` 接上 `pushActivity`**

找到：

```ts
    v.status = 'active';

    k.lastUpdateBy = 'Current User';

    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };

  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
```

（這段開頭的 `v.status = 'active';` 若前面沒有 `v.reviewedBy` 賦值，代表是 `publishApprovedVersion` 而不是 `approveVersion`——用整段比對，包含後面緊接的 `const rejectVersion`，確保改到的是正確的函式。）

改成：

```ts
    v.status = 'active';

    k.lastUpdateBy = 'Current User';

    pushActivity(k, { action: 'PUBLISHED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });

    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };

  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
```

- [ ] **Step 4：`switchToVersion` 接上 `pushActivity`**

找到：

```ts
  const switchToVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'history') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }
    v.status = 'active';
    k.status = 'active';
    k.lastUpdateTime = now;
    k.lastUpdateBy = 'Current User';
  };
```

改成：

```ts
  const switchToVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'history') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const previouslyActive = k.versions.find(ver => ver.status === 'active');

    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }
    v.status = 'active';
    k.status = 'active';
    k.lastUpdateTime = now;
    k.lastUpdateBy = 'Current User';

    pushActivity(k, {
      action: 'SWITCHED',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
      replacedVersionId: previouslyActive?.id,
      replacedVersionNumber: previouslyActive?.versionNumber,
    });
  };
```

- [ ] **Step 5：跑測試，確認通過**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts`
Expected: 全數 PASS（累積到現在應該有 8 個測試：submitForReview 1、rejectVersion 1、withdrawReview 1、approveVersion 1、approveVersionPending 2、publishApprovedVersion 1、switchToVersion 1）

- [ ] **Step 6：型別檢查 + 既有測試回歸**

Run: `npx vue-tsc --noEmit -p tsconfig.json && npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`
Expected: 兩者皆通過

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts
git commit -m "feat(knowledge): wire publishApprovedVersion and switchToVersion into activityLog"
```

---

## Task 7：`isPipelineReview` 改讀 `activityLog`

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`（`isPipelineReview` computed）
- Test: `src/views/__tests__/KnowledgeDetail.activityLog.test.ts`（新建）

**Interfaces:**
- Consumes: `knowledge.value.activityLog`（Task 1 型別、Task 2-6 各 action 寫入的資料）

- [ ] **Step 1：新增失敗的測試**

新建 `src/views/__tests__/KnowledgeDetail.activityLog.test.ts`。注意：`mountDetail` helper 內部會自己呼叫 `setActivePinia(createPinia())` 建立全新的 store 實例，所以「先攔到 store、改資料、再掛載元件」這種測試**不能**透過 `mountDetail` helper 做（helper 建立的是另一個全新實例，先前的資料異動不會反映到元件實際掛載時讀到的 store 上）——這類測試要比照 `KnowledgeDetail.tokens.test.ts` 裡 `mountDetailWithPipelineError` 的寫法，自己依序呼叫 `setActivePinia` → `useKnowledgeStore()` → 改資料 → `mount(...)`，全部用同一個 store 實例：

```ts
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

const STUBS = { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true }

function newRouter() {
  return createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
}

// 簡單案例：不需要在掛載前改資料，直接用既有 mock data
async function mountDetail(knowledgeId: string) {
  setActivePinia(createPinia())
  const wrapper = mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: { plugins: [newRouter()], stubs: STUBS },
  })
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 600))
  return wrapper
}

describe('KnowledgeDetail — isPipelineReview 改讀 activityLog', () => {
  it('有 SUBMITTED 活動紀錄的 reviewing 版本，不顯示 Pipeline 提示 banner', async () => {
    const wrapper = await mountDetail('k2') // k2 的 v2.0 是 reviewing，且 mock data 裡有對應的 SUBMITTED 活動紀錄
    expect(wrapper.find('.pipeline-review-banner').exists()).toBe(false)
  })

  it('reviewing 但完全沒有活動紀錄時，顯示 Pipeline 提示 banner', async () => {
    // 先建 pinia、取得 store、直接改資料，再用同一個 store 實例掛載元件
    setActivePinia(createPinia())
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k3')! // k3 的 v1.0 目前是 draft，先手動改成 reviewing 但不寫活動紀錄
    item.versions[0].status = 'reviewing'
    item.activityLog = []

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k3' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.find('.pipeline-review-banner').exists()).toBe(true)
  })
})
```

（這個測試檔目前先不 stub `RestoreVersionModal`，因為它在 `KnowledgeDetail.vue` 裡已經不再被 import——沿用既有兩個 layout/tokens 測試檔仍然把它列在 stubs 裡是歷史遺留，不影響行為，這裡不重複那個非必要的 stub。）

- [ ] **Step 2：跑測試，確認第二個案例失敗**

Run: `npx vitest run src/views/__tests__/KnowledgeDetail.activityLog.test.ts`
Expected: 第一個 PASS（因為 `isPipelineReview` 現在還是讀 `reviewHistory`，k2 的 v2.0 mock data 剛好也還留著 `reviewHistory` 且非空，巧合通過）；第二個 FAIL——k3 被改成 `status: 'reviewing'` 且 `activityLog: []`，但 `isPipelineReview` 現在還是讀 `reviewHistory`（仍是 `undefined`），舊邏輯 `!reviewHistory || reviewHistory.length === 0` 剛好也會判斷「沒送審過」而顯示 banner，理論上會 PASS——如果這裡意外 PASS，代表這個案例目前還無法把新舊邏輯的差異逼出來，先跳過这一步的嚴格 FAIL 要求，直接進 Step 3 改完程式碼後在 Step 4 用「兩個測試都要為了正確原因通過」來把關即可，不需要在这一步卡住。

- [ ] **Step 3：`isPipelineReview` 改讀 `activityLog`**

在 `src/views/KnowledgeDetail.vue` 找到：

```ts
// Pipeline 審核狀態：reviewing 但沒有 reviewHistory（尚未人工送審）
const isPipelineReview = computed(() =>
  viewedVer.value?.status === 'reviewing' &&
  (!viewedVer.value?.reviewHistory || viewedVer.value.reviewHistory.length === 0)
)
```

改成：

```ts
// Pipeline 審核狀態：reviewing 但 activityLog 裡沒有這個版本的 SUBMITTED 紀錄（尚未人工送審）
const isPipelineReview = computed(() => {
  if (viewedVer.value?.status !== 'reviewing') return false
  const hasSubmitRecord = knowledge.value?.activityLog?.some(
    e => e.action === 'SUBMITTED' && e.versionId === viewedVer.value?.id
  )
  return !hasSubmitRecord
})
```

- [ ] **Step 4：跑測試，確認兩個都通過（且是真正驗證新邏輯，不是巧合）**

Run: `npx vitest run src/views/__tests__/KnowledgeDetail.activityLog.test.ts`
Expected: 兩個測試皆 PASS

- [ ] **Step 5：型別檢查 + 既有 KnowledgeDetail 測試回歸**

Run:
```bash
npx vue-tsc --noEmit -p tsconfig.json
npx vitest run src/views/__tests__/KnowledgeDetail.tokens.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts
```
Expected: 型別檢查無輸出；既有測試全數 PASS（這兩個測試檔用的是 k1，不受 k2/k3 資料異動影響）

- [ ] **Step 6：Commit**

```bash
git add src/views/KnowledgeDetail.vue src/views/__tests__/KnowledgeDetail.activityLog.test.ts
git commit -m "refactor(knowledge): re-point isPipelineReview to read activityLog"
```

---

## Task 8：新增「活動紀錄」分頁

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`（`tabs` 陣列、新增 tab-panel、新增 icon/label map 與 helper 函式）
- Modify: `src/scss/views/_KnowledgeDetail.scss`（新增 `.activity-timeline` 系列樣式）
- Modify: `src/views/__tests__/KnowledgeDetail.layout.test.ts`（既有斷言從 4 個分頁改成 5 個）
- Test: `src/views/__tests__/KnowledgeDetail.activityLog.test.ts`（延續 Task 7 的檔案）

**Interfaces:**
- Consumes: `knowledge.value.activityLog`（Task 1-6）、`ActivityAction`（Task 1）

- [ ] **Step 1：新增失敗的測試**

在 `KnowledgeDetail.activityLog.test.ts` 新增。注意：k2 的 mock data 要到 Task 10 才會被填入完整的 `activityLog`（這個任務執行的當下 k2 還沒有），所以這裡驗證「時間軸正確渲染多筆紀錄、新到舊排序」不能依賴 k2 的真實 mock data，改成用 k4（信用卡申辦資格說明，`k4-v1.3` 版本）手動注入兩筆測試用的 `activityLog`，比照 Task 7 Step 1 第二個測試已經驗證過的「先改資料、再用同一個 store 實例掛載」寫法：

```ts
describe('KnowledgeDetail — 活動紀錄分頁', () => {
  it('導覽列有「活動紀錄」項目，插在版本歷程跟分段預覽中間', async () => {
    const wrapper = await mountDetail('k2')
    const labels = wrapper.findAll('.detail-nav-item').map(i => i.find('span').text())
    expect(labels).toEqual(['概覽', '版本歷程', '活動紀錄', '分段預覽', '轉換結果'])
  })

  it('點擊活動紀錄分頁，依時間新到舊顯示注入的紀錄', async () => {
    setActivePinia(createPinia())
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k4')!
    const versionId = item.versions[0].id // k4-v1.3
    item.activityLog = [
      { id: 'a1', action: 'SUBMITTED', by: 'Alice', time: '2026-01-01 09:00', versionId, versionNumber: 'v1.3', note: '測試送審' },
      { id: 'a2', action: 'APPROVED', by: 'Bob', time: '2026-01-02 09:00', versionId, versionNumber: 'v1.3' },
    ]

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k4' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    const tabBtn = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('活動紀錄'))
    await tabBtn!.trigger('click')

    const items = wrapper.findAll('.activity-timeline-item')
    expect(items.length).toBe(2)
    // 新到舊：後 push 的 APPROVED 排最上面
    expect(items[0].text()).toContain('核准')
    expect(items[0].text()).toContain('v1.3')
    expect(items[1].text()).toContain('送審')
    expect(items[1].text()).toContain('測試送審')
  })

  it('活動紀錄為空時顯示「尚無活動紀錄」', async () => {
    const wrapper = await mountDetail('k3') // k3 從未有任何審核動作，mock data 沒有 activityLog 欄位
    const tabBtn = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('活動紀錄'))
    await tabBtn!.trigger('click')
    expect(wrapper.text()).toContain('尚無活動紀錄')
  })
})
```

- [ ] **Step 2：跑測試，確認失敗**

Run: `npx vitest run src/views/__tests__/KnowledgeDetail.activityLog.test.ts`
Expected: 三個新測試皆 FAIL（分頁根本不存在）

- [ ] **Step 3：`tabs` 陣列插入新分頁**

找到：

```ts
// ── Tabs ──
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
```

改成：

```ts
// ── Tabs ──
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'activity', label: '活動紀錄', icon: 'timeline' },
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
```

- [ ] **Step 4：新增 icon／文案對照表與 label 函式**

在 `statusLabelMap` 附近（同一個 `// ── Status maps ──` 區塊）新增：

```ts
const activityIconMap: Record<ActivityAction, string> = {
  SUBMITTED: 'send',
  APPROVED: 'task_alt',
  REJECTED: 'cancel',
  WITHDRAWN: 'undo',
  PUBLISHED: 'rocket_launch',
  SWITCHED: 'sync_alt',
}

const activityActionLabelMap: Record<ActivityAction, string> = {
  SUBMITTED: '送審',
  APPROVED: '核准',
  REJECTED: '退回',
  WITHDRAWN: '撤回審核',
  PUBLISHED: '發佈上線',
  SWITCHED: '切換版本',
}

function activityLabel(entry: ActivityRecord): string {
  if (entry.action === 'SWITCHED' && entry.replacedVersionNumber) {
    return `將目前版本從 ${entry.replacedVersionNumber} 切換為 ${entry.versionNumber}`
  }
  return `${activityActionLabelMap[entry.action]} ${entry.versionNumber}`
}
```

並在檔案最上方 import 區塊，找到：

```ts
import { useKnowledgeStore, hasEarnedVersionNumber } from '@/stores/knowledgeStore'
```

改成：

```ts
import { useKnowledgeStore, hasEarnedVersionNumber } from '@/stores/knowledgeStore'
import type { ActivityAction, ActivityRecord } from '@/stores/knowledgeStore'
```

- [ ] **Step 5：新增 tab-panel 內容**

找到（Tab 2 版本歷程結束、Tab 3 分段預覽開始的交界）：

```html
          <!-- Tab 3: 分段預覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
```

改成（在前面插入新的 Tab）：

```html
          <!-- Tab 3: 活動紀錄 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'activity' }]">
            <div v-if="!knowledge.activityLog?.length" class="fc-grey-1 fs-13">尚無活動紀錄</div>
            <div v-else class="activity-timeline lively-stagger">
              <div
                v-for="entry in [...knowledge.activityLog].reverse()"
                :key="entry.id"
                class="activity-timeline-item lively-card"
              >
                <div :class="['activity-icon', `activity-icon--${entry.action.toLowerCase()}`]">
                  <i class="material-symbols-outlined">{{ activityIconMap[entry.action] }}</i>
                </div>
                <div class="activity-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <span><strong>{{ entry.by }}</strong> {{ activityLabel(entry) }}</span>
                    <span class="fc-grey-1 fs-13">{{ entry.time }}</span>
                  </div>
                  <div v-if="entry.note" class="fc-grey-1 fs-13">{{ entry.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: 分段預覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
```

（原本的「Tab 3: 分段預覽」註解文字改成「Tab 4」，「Tab 4: 轉換結果」也要跟著改成「Tab 5」，純粹是註解編號，不影響邏輯，找到 `<!-- Tab 4: 轉換結果 -->` 改成 `<!-- Tab 5: 轉換結果 -->`。）

- [ ] **Step 6：新增 SCSS 樣式**

在 `src/scss/views/_KnowledgeDetail.scss` 找到：

```scss
  .version-timeline-body { flex: 1; }
```

在它後面插入：

```scss
  .version-timeline-body { flex: 1; }

  // 活動紀錄時間軸（純事件流，不分版本卡片）
  .activity-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .activity-timeline-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--divider);

    &:last-child { border-bottom: none; }
  }

  .activity-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .material-symbols-outlined { font-size: 16px; }

    &--submitted { background: var(--tag-blue-bg); color: var(--tag-blue-text); }
    &--approved  { background: var(--accent-soft); color: var(--success); }
    &--published { background: var(--accent-soft); color: var(--success); }
    &--rejected  { background: var(--danger-soft); color: var(--danger); }
    &--withdrawn { background: var(--tag-slate-bg); color: var(--tag-slate-text); }
    &--switched  { background: var(--tag-violet-bg); color: var(--tag-violet-text); }
  }

  .activity-body { flex: 1; }
```

- [ ] **Step 7：更新既有的 layout 測試（分頁數量從 4 變 5）**

在 `src/views/__tests__/KnowledgeDetail.layout.test.ts` 找到：

```ts
  it('左側導覽列渲染 4 個項目，文字依序為概覽/版本歷程/分段預覽/轉換結果', async () => {
    const wrapper = await mountDetail()
    const items = wrapper.findAll('.detail-nav-item')
    expect(items.length).toBe(4)
    expect(items.map(i => i.find('span').text())).toEqual(['概覽', '版本歷程', '分段預覽', '轉換結果'])
  })
```

改成：

```ts
  it('左側導覽列渲染 5 個項目，文字依序為概覽/版本歷程/活動紀錄/分段預覽/轉換結果', async () => {
    const wrapper = await mountDetail()
    const items = wrapper.findAll('.detail-nav-item')
    expect(items.length).toBe(5)
    expect(items.map(i => i.find('span').text())).toEqual(['概覽', '版本歷程', '活動紀錄', '分段預覽', '轉換結果'])
  })
```

- [ ] **Step 8：跑所有相關測試，確認通過**

Run:
```bash
npx vitest run src/views/__tests__/KnowledgeDetail.activityLog.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts src/views/__tests__/KnowledgeDetail.tokens.test.ts
```
Expected: 全數 PASS

- [ ] **Step 9：型別檢查 + lint**

Run:
```bash
npx vue-tsc --noEmit -p tsconfig.json
npx eslint src/views/KnowledgeDetail.vue
```
Expected: 兩者皆無輸出

- [ ] **Step 10：Commit**

```bash
git add src/views/KnowledgeDetail.vue src/scss/views/_KnowledgeDetail.scss src/views/__tests__/KnowledgeDetail.layout.test.ts src/views/__tests__/KnowledgeDetail.activityLog.test.ts
git commit -m "feat(knowledge): add 活動紀錄 tab to KnowledgeDetail"
```

---

## Task 9：`ReviewDrawer.vue` 新增「僅核准（待發佈）」按鈕

**Files:**
- Modify: `src/components/Knowledge/ReviewDrawer.vue`
- Modify: `src/scss/views/_KnowledgeBase.scss`（`.review-footer` 系列樣式，`ReviewDrawer.vue` 用的是 `KnowledgeBase` class 命名空間）

**Interfaces:**
- Consumes: `knowledgeStore.approveVersionPending`（Task 5）

- [ ] **Step 1：新增按鈕與 handler**

在 `src/components/Knowledge/ReviewDrawer.vue` 找到：

```html
      <!-- Footer -->
      <div class="review-footer" v-if="knowledge && version && !drawerLoading && !drawerError">
        <button class="custom-btn review-footer__reject" @click="handleReject">
          <i class="material-symbols-outlined">undo</i>
          退回
        </button>
        <button class="custom-btn custom-main-btn review-footer__approve" @click="handleApprove">
          <i class="material-symbols-outlined">verified</i>
          通過並發布
        </button>
      </div>
```

改成：

```html
      <!-- Footer -->
      <div class="review-footer" v-if="knowledge && version && !drawerLoading && !drawerError">
        <button class="custom-btn review-footer__reject" @click="handleReject">
          <i class="material-symbols-outlined">undo</i>
          退回
        </button>
        <button class="custom-btn review-footer__approve-pending" @click="handleApprovePending">
          <i class="material-symbols-outlined">task_alt</i>
          僅核准（待發佈）
        </button>
        <button class="custom-btn custom-main-btn review-footer__approve" @click="handleApprove">
          <i class="material-symbols-outlined">verified</i>
          通過並發布
        </button>
      </div>
```

找到：

```ts
function handleApprove() {
  knowledgeStore.approveVersion(props.knowledgeId, props.versionId, ({ added, removed, knowledgeId }) => {
    added.forEach(fileId => resourceStore.addKnowledgeMembership(fileId, knowledgeId));
    removed.forEach(fileId => resourceStore.removeKnowledgeMembership(fileId, knowledgeId));
  });
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approved');
  popDialog.toast(`已發布 ${vNum}`, 2000);
}
```

在它後面（`handleReject` 前面）插入：

```ts
function handleApprovePending() {
  knowledgeStore.approveVersionPending(props.knowledgeId, props.versionId);
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approvedPending');
  popDialog.toast(`${vNum} 已核准，待發佈`, 2000);
}
```

找到：

```ts
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'approved': [];
  'rejected': [];
}>();
```

改成：

```ts
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'approved': [];
  'approvedPending': [];
  'rejected': [];
}>();
```

- [ ] **Step 2：調整 footer 三顆按鈕的排版**

在 `src/scss/views/_KnowledgeBase.scss` 找到：

```scss
  .review-footer {
    border-top: 1px solid var(--divider-a50);
    padding: 16px 24px;
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    background: var(--page-bg);

    &__reject {
      flex: 0 0 auto;
    }

    &__approve {
      flex: 1;
    }
  }
```

改成：

```scss
  .review-footer {
    border-top: 1px solid var(--divider-a50);
    padding: 16px 24px;
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    background: var(--page-bg);

    &__reject {
      flex: 0 0 auto;
    }

    &__approve-pending {
      flex: 1;
    }

    &__approve {
      flex: 1;
    }
  }
```

- [ ] **Step 3：型別檢查 + lint**

Run:
```bash
npx vue-tsc --noEmit -p tsconfig.json
npx eslint src/components/Knowledge/ReviewDrawer.vue
```
Expected: 兩者皆無輸出

- [ ] **Step 4：手動驗證（這個元件目前沒有專屬單元測試，兩個既有 KnowledgeDetail 測試檔把它 stub 掉了，改動不會被自動測試發現，需要手動跑一次 headless browser 確認）**

用 Playwright 對 dev server（`http://localhost:8088/justagent/`）跑一次：開啟 k2 詳情頁 → 「開始審核」→ 確認抽屜底部有三顆按鈕（退回／僅核准（待發佈）／通過並發布）→ 點「僅核准（待發佈）」→ 確認 toast 顯示「v2.0 已核准，待發佈」、抽屜關閉、頁面頂部出現「已核准，待發佈」＋「立即發佈」按鈕（這組 UI 在這次改動前只有手寫 mock data 能觸發，現在應該是第一次能透過真實互動走到）。

- [ ] **Step 5：Commit**

```bash
git add src/components/Knowledge/ReviewDrawer.vue src/scss/views/_KnowledgeBase.scss
git commit -m "feat(knowledge): add 僅核准（待發佈） button to ReviewDrawer"
```

---

## Task 10：遷移 k2 既有 mock data 到 `activityLog`

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（k2 的四個版本：`k2-v1.0`／`k2-v1.1`／`k2-v1.2`／`k2-v2.0`，以及 k2 條目本身）

**Interfaces:**
- Consumes: `ActivityRecord`（Task 1）

- [ ] **Step 1：移除四個版本上的 `reviewHistory` 陣列（保留 `reviewNote`/`reviewedBy`/`reviewedTime` 純欄位不動）**

`k2-v1.0`（約在 `src/stores/knowledgeStore.ts:386-402`）找到：

```ts
          reviewNote: '首次建立後台角色權限規範，請審核後發佈。',
          reviewedBy: 'Ethan',
          reviewedTime: '2025-03-10 09:20',
          reviewHistory: [
            {
              action: 'SUBMITTED',
              by: 'Admin',
              time: '2025-03-10 09:00',
              note: '首次建立後台角色權限規範，請審核後發佈。',
            },
            {
              action: 'APPROVED',
              by: 'Ethan',
              time: '2025-03-10 09:20',
              note: '角色範圍清楚，同意發佈。',
            },
          ],
        },
```

改成：

```ts
          reviewNote: '首次建立後台角色權限規範，請審核後發佈。',
          reviewedBy: 'Ethan',
          reviewedTime: '2025-03-10 09:20',
        },
```

`k2-v1.1` 找到：

```ts
          reviewNote: '新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。',
          reviewedBy: 'Ethan',
          reviewedTime: '2025-11-21 09:10',
          reviewHistory: [
            {
              action: 'SUBMITTED',
              by: 'Rita',
              time: '2025-11-20 16:40',
              note: '新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。',
            },
            {
              action: 'APPROVED',
              by: 'Ethan',
              time: '2025-11-21 09:10',
              note: '客服角色範圍合理，同意發佈。',
            },
          ],
        },
```

改成：

```ts
          reviewNote: '新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。',
          reviewedBy: 'Ethan',
          reviewedTime: '2025-11-21 09:10',
        },
```

`k2-v1.2` 找到：

```ts
          reviewNote: '僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。',
          reviewedBy: 'Ethan',
          reviewedTime: '2026-03-19 09:40',
          reviewHistory: [
            {
              action: 'SUBMITTED',
              by: 'Rita',
              time: '2026-03-18 10:20',
              note: '僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。',
            },
            {
              action: 'APPROVED',
              by: 'Ethan',
              time: '2026-03-19 09:40',
              note: '用語修正合理，同意發佈。',
            },
          ],
        },
```

改成：

```ts
          reviewNote: '僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。',
          reviewedBy: 'Ethan',
          reviewedTime: '2026-03-19 09:40',
        },
```

`k2-v2.0` 找到：

```ts
          reviewNote: '已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。',
          reviewHistory: [
            {
              action: 'SUBMITTED',
              by: 'Rita',
              time: '2026-04-01 11:00',
              note: '已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。',
            },
          ],
          conversionLog: [
```

改成：

```ts
          reviewNote: '已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。',
          conversionLog: [
```

- [ ] **Step 2：k2 條目層級新增 `activityLog`**

找到 k2 條目開頭：

```ts
      id: 'k2',
      title: '後台角色權限說明',
      category: '系統文件',
      status: 'reviewing',
      sourceType: 'MANUAL',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-04-01 11:00',
      lastUpdateBy: 'Rita',
      versions: [
```

改成（`activityLog` 放在 `versions` 前面，跟 interface 定義順序一致）：

```ts
      id: 'k2',
      title: '後台角色權限說明',
      category: '系統文件',
      status: 'reviewing',
      sourceType: 'MANUAL',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-04-01 11:00',
      lastUpdateBy: 'Rita',
      activityLog: [
        { id: 'k2-act-1', action: 'SUBMITTED', by: 'Admin', time: '2025-03-10 09:00', versionId: 'k2-v1.0', versionNumber: 'v1.0', note: '首次建立後台角色權限規範，請審核後發佈。' },
        { id: 'k2-act-2', action: 'APPROVED', by: 'Ethan', time: '2025-03-10 09:20', versionId: 'k2-v1.0', versionNumber: 'v1.0', note: '角色範圍清楚，同意發佈。' },
        { id: 'k2-act-3', action: 'PUBLISHED', by: 'Ethan', time: '2025-03-10 09:20', versionId: 'k2-v1.0', versionNumber: 'v1.0' },
        { id: 'k2-act-4', action: 'SUBMITTED', by: 'Rita', time: '2025-11-20 16:40', versionId: 'k2-v1.1', versionNumber: 'v1.1', note: '新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。' },
        { id: 'k2-act-5', action: 'APPROVED', by: 'Ethan', time: '2025-11-21 09:10', versionId: 'k2-v1.1', versionNumber: 'v1.1', note: '客服角色範圍合理，同意發佈。' },
        { id: 'k2-act-6', action: 'PUBLISHED', by: 'Ethan', time: '2025-11-21 09:10', versionId: 'k2-v1.1', versionNumber: 'v1.1' },
        { id: 'k2-act-7', action: 'SUBMITTED', by: 'Rita', time: '2026-03-18 10:20', versionId: 'k2-v1.2', versionNumber: 'v1.2', note: '僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。' },
        { id: 'k2-act-8', action: 'APPROVED', by: 'Ethan', time: '2026-03-19 09:40', versionId: 'k2-v1.2', versionNumber: 'v1.2', note: '用語修正合理，同意發佈。' },
        { id: 'k2-act-9', action: 'SUBMITTED', by: 'Rita', time: '2026-04-01 11:00', versionId: 'k2-v2.0', versionNumber: 'v2.0', note: '已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。' },
      ],
      versions: [
```

- [ ] **Step 2b：型別檢查會抓到重複的物件鍵（`versions` 一定要在最後只出現一次），確認沒有寫錯**

上面 Step 2 的改法是在 `activityLog: [...]` 後面「保留」原本的 `versions: [` 那一行（原文只有一行 `versions: [`，改完後應該還是只有一行，不是兩行）。實際編輯時要小心：改的內容是「在 `lastUpdateBy: 'Rita',` 後面插入 `activityLog: [...],` 這一整段，`versions: [` 那一行維持原樣不動」，不是「取代」`versions: [`。

- [ ] **Step 3：新增驗證遷移結果的測試**

在 `src/stores/__tests__/knowledgeStore.activityLog.test.ts` 新增（這個測試檔在 Task 2 已經建立，這裡是延續新增一個 `describe` 區塊，不是新建檔案）：

```ts
  describe('k2 mock data 遷移結果', () => {
    it('剛從 mock data 載入時（尚未呼叫任何 action），k2.activityLog 有 9 筆紀錄，依序涵蓋四個版本的完整歷程', () => {
      const store = useKnowledgeStore()
      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      expect(log.length).toBe(9)
      expect(log.map(e => e.action)).toEqual([
        'SUBMITTED', 'APPROVED', 'PUBLISHED', // v1.0
        'SUBMITTED', 'APPROVED', 'PUBLISHED', // v1.1
        'SUBMITTED', 'APPROVED',              // v1.2（尚未發佈，對應目前「已核准・待發佈」狀態）
        'SUBMITTED',                          // v2.0（還在審核中）
      ])
      expect(log[log.length - 1].versionNumber).toBe('v2.0')
      expect(log[log.length - 1].by).toBe('Rita')
    })
  })
```

- [ ] **Step 4：型別檢查、lint、跑這個測試確認通過**

Run:
```bash
npx vue-tsc --noEmit -p tsconfig.json
npx eslint src/stores/knowledgeStore.ts
npx vitest run src/stores/__tests__/knowledgeStore.activityLog.test.ts
```
Expected: 型別檢查與 lint 皆無輸出；`knowledgeStore.activityLog.test.ts` 全數 PASS（累積到這個任務應該有 9 個測試：Task 2-6 累積的 8 個 + 這裡新增的 1 個）

- [ ] **Step 5：既有測試回歸**

Run: `npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts src/views/__tests__/KnowledgeDetail.tokens.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts src/views/__tests__/KnowledgeDetail.activityLog.test.ts`
Expected: 全數 PASS（`KnowledgeDetail.activityLog.test.ts` 裡驗證分頁渲染的測試用的是 k4 手動注入的資料，不受 k2 遷移影響，見 Task 8 Step 1）

- [ ] **Step 6：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(knowledge): migrate k2 mock reviewHistory data to activityLog"
```

---

## Task 11：清除舊機制（`ReviewRecord` 型別、`reviewHistory` 欄位）

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

**Interfaces:**
- 這是收尾任務，確認全專案沒有任何地方還在讀寫 `reviewHistory`／`ReviewRecord` 之後才能移除。

- [ ] **Step 1：先搜尋確認沒有殘留的讀寫點**

Run: `grep -rn "reviewHistory\|ReviewRecord" src/`
Expected: 只剩 `src/stores/knowledgeStore.ts` 裡型別定義本身、以及 Task 2-6 每個 action 裡「先保留、還沒刪」的 `v.reviewHistory = [...]` 賦值語句。如果 grep 結果出現這份清單以外的檔案，先處理掉那些殘留點再繼續。

- [ ] **Step 2：移除各 action 裡的 `reviewHistory` 賦值**

依序在 `submitForReview`／`approveVersion`／`rejectVersion`／`withdrawReview` 裡刪掉對應的 `v.reviewHistory = [...]` 區塊。以 `submitForReview` 為例，找到：

```ts
      v.status = 'reviewing';
      v.reviewNote = note;
      v.reviewHistory = [
        ...(v.reviewHistory ?? []),
        { action: 'SUBMITTED', by: reviewerId, time: now, note },
      ];
      k.status = 'reviewing';

      pushActivity(k, {
```

改成：

```ts
      v.status = 'reviewing';
      v.reviewNote = note;
      k.status = 'reviewing';

      pushActivity(k, {
```

`approveVersion` 找到：

```ts
    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    pushActivity(k, { action: 'APPROVED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });
```

改成：

```ts
    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;

    pushActivity(k, { action: 'APPROVED', by: 'Current User', time: now, versionId: v.id, versionNumber: v.versionNumber });
```

`rejectVersion` 找到：

```ts
    v.status = 'rejected';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'pending';

    pushActivity(k, {
      action: 'REJECTED',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
      note: feedback,
    });
```

改成：

```ts
    v.status = 'rejected';
    v.reviewFeedback = feedback;

    k.status = 'pending';

    pushActivity(k, {
      action: 'REJECTED',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
      note: feedback,
    });
```

`withdrawReview` 找到：

```ts
    v.status = 'draft';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'pending';

    pushActivity(k, {
      action: 'WITHDRAWN',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
    });
```

改成：

```ts
    v.status = 'draft';

    k.status = 'pending';

    pushActivity(k, {
      action: 'WITHDRAWN',
      by: 'Current User',
      time: now,
      versionId: v.id,
      versionNumber: v.versionNumber,
    });
```

- [ ] **Step 3：移除 `KnowledgeVersion.reviewHistory` 欄位與 `ReviewRecord` 型別**

找到：

```ts
export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}
```

整段刪除。

找到 `KnowledgeVersion` interface 裡的：

```ts
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
  conversionLog?: ConversionStep[]
```

改成：

```ts
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  conversionLog?: ConversionStep[]
```

- [ ] **Step 4：型別檢查——這一步最關鍵，任何殘留的 `reviewHistory` 讀寫都會在這裡現形**

Run: `npx vue-tsc --noEmit -p tsconfig.json`
Expected: 無輸出。如果報錯，回頭找報錯位置補刪。

- [ ] **Step 5：全套測試回歸**

Run:
```bash
npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts src/views/__tests__/KnowledgeDetail.tokens.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts src/views/__tests__/KnowledgeDetail.activityLog.test.ts
```
Expected: 全數 PASS

- [ ] **Step 6：lint**

Run: `npx eslint src/stores/knowledgeStore.ts src/views/KnowledgeDetail.vue src/components/Knowledge/ReviewDrawer.vue`
Expected: 無新增錯誤（跟這個功能無關的既有錯誤，例如 `KnowledgeBase.vue` 的 `_id` unused，不在這次改動範圍內，不用管）

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "refactor(knowledge): remove superseded ReviewRecord type and reviewHistory field"
```

---

## Task 12：完整驗證

**Files:** 無新增修改，純驗證。

- [ ] **Step 1：型別檢查、lint、全套相關單元測試**

Run:
```bash
npx vue-tsc --noEmit -p tsconfig.json
npx eslint src/stores/knowledgeStore.ts src/views/KnowledgeDetail.vue src/views/KnowledgeBase.vue src/components/Knowledge/ReviewDrawer.vue
npx vitest run src/stores/__tests__/knowledgeStore.multiFileSources.test.ts src/stores/__tests__/knowledgeStore.activityLog.test.ts src/views/__tests__/KnowledgeDetail.tokens.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts src/views/__tests__/KnowledgeDetail.activityLog.test.ts
```
Expected: 三者皆無錯誤（lint 允許跟本次改動無關的既有錯誤，例如 `KnowledgeBase.vue:576` 的 `_id` unused）

- [ ] **Step 2：headless browser 端到端驗證（比照 spec 測試計畫的 5 個驗證點）**

確認 dev server 正在跑（`http://localhost:8088/justagent/`），用 Playwright 對同一個 SPA session（用站內導覽點擊，不要用 `page.goto()` 換頁，避免 Pinia store 狀態被重置）依序驗證：

1. 進入 k2 詳情頁，點「活動紀錄」分頁，確認顯示 9 筆紀錄，時間新到舊排序正確（第一筆是 v2.0 送審）。
2. 點「開始審核」，抽屜裡點「僅核准（待發佈）」→ 確認 toast「v2.0 已核准，待發佈」、頁面頂部出現「已核准，待發佈」＋「立即發佈」、「活動紀錄」分頁多一筆 APPROVED（v2.0）。
3. 在「版本歷程」分頁對 v2.0 按「立即發佈」→ 確認「活動紀錄」多一筆 PUBLISHED（v2.0）。
4. 對某個歷史版本按「切換當前版本」→ 確認「活動紀錄」多一筆內容是「將目前版本從 A 切換為 B」的 SWITCHED 紀錄。
5. 確認 v2.0 送審過（有 SUBMITTED 活動紀錄）時，概覽分頁不顯示「此條目由 Pipeline 處理完成」banner。

Expected: 5 點全部符合，且過程中瀏覽器 console 沒有出現任何 error（`page.on('console', ...)` 監聽 `type() === 'error'`）。

- [ ] **Step 3：確認沒有殘留的 scratch/測試檔案**

Run: `git status --short`
Expected: 只看到這次計畫實際修改的檔案，沒有任何臨時測試腳本被誤 commit。

這是最後一個任務，完成後這個功能就算實作完畢，可以請人 review 整批 commit。
