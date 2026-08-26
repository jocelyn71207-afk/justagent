# 知識庫活動紀錄（Activity Log）Design

## 背景

知識庫版本目前已有的稽核相關欄位散落在兩處，且互相之間不構成一份完整的歷程：

- `KnowledgeVersion.reviewNote` / `reviewedBy` / `reviewedTime` / `reviewFeedback`：單一版本身上的「最新狀態快照」，只記得住最後一次送審/核准/退回的結果，看不到完整過程。
- `KnowledgeVersion.reviewHistory: ReviewRecord[]`：陣列型別的紀錄，但掛在**每個版本自己身上**，`SUBMITTED`/`APPROVED`/`REJECTED`/`WITHDRAWN` 四種動作。
- 完全沒有紀錄的動作：`publishApprovedVersion`（已核准 → 正式發佈）、`switchToVersion`（直接切換回歷史版本）——這兩個是本次會話新增的 store action，加入時沒有一併補上稽核紀錄。
- 「切換版本」「發佈」這類動作本質上牽涉兩個版本（例如切換是「A 被換下去、B 被換上來」），硬塞進某一版自己的 `reviewHistory` 沒有自然的歸屬。

使用者想要的是「這個知識庫的完整歷程」——單一、跨版本、按時間排序的時間軸，而不是要去每個版本自己的紀錄裡拼湊。

## 範圍

**這次要做：**
- 新增 `KnowledgeItem.activityLog: ActivityRecord[]`，取代 `KnowledgeVersion.reviewHistory` / `ReviewRecord`，成為送審／核准／退回／撤回／發佈／切換版本這六種動作的唯一紀錄來源。
- 補上目前完全沒有互動路徑可達的「審核通過但先不發佈」狀態轉換：新增 `approveVersionPending` action，讓 `reviewing → approved` 這個轉換可以透過畫面操作真正發生（目前 `approved` 狀態只存在於手寫的 k2 mock data）。
- `ReviewDrawer.vue` 審核抽屜新增「僅核准（待發佈）」按鈕，跟既有「通過並發布」並存。
- `KnowledgeDetail.vue` 新增「活動紀錄」分頁，顯示 `activityLog` 的完整時間軸。
- `isPipelineReview` 判斷邏輯改為讀 `activityLog`，取代原本讀 `version.reviewHistory`。
- k2（後台角色權限說明）既有的 `reviewNote`/`reviewedBy`/`reviewHistory` mock data 轉換成對應的 `activityLog` 紀錄。

**這次不做（YAGNI，明確排除）：**
- 其他 13 筆知識庫項目的活動紀錄補寫——它們目前是直接以 `active` 狀態塞入 mock data，從未有審核流程，遷移後 `activityLog` 就是空陣列，畫面顯示「尚無活動紀錄」空狀態即可。要幫這些項目補上完整活動歷程是另一輪內容豐富化工作，不在本次範圍。
- 更廣義的「條目活動時間軸」（建立、上傳來源、pipeline 處理完成、封存等事件）——這次只涵蓋版本審核／發佈／切換相關的六種動作，其餘事件類型留待未來需要時再擴充（`ActivityAction` 是可擴充的 union type，不會擋路）。
- 真實使用者系統／登入串接——`by` 欄位延續現有 `'Current User'` 佔位慣例，不在這次處理。
- `KnowledgeBase.vue` 列表頁不新增活動紀錄相關欄位或分頁——這次的「活動紀錄」是詳情頁專屬功能，列表頁維持現狀（已有的「核准資訊」展開列不受影響，因為它讀的是 `KnowledgeVersion` 上的 `reviewedBy`/`reviewedTime` 快照欄位，這兩個欄位保留不動）。

## 資料模型變更

### `src/stores/knowledgeStore.ts`

新增型別，取代 `ReviewRecord`：

```ts
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
```

`ReviewRecord` 型別與 `KnowledgeVersion.reviewHistory?: ReviewRecord[]` 欄位整個移除。

`KnowledgeVersion` 上的 `reviewNote?` / `reviewedBy?` / `reviewedTime?` / `reviewFeedback?` **保留不動**——繼續作為「這一版最新狀態」的快照欄位，供側邊欄、審核抽屜、列表展開列直接讀取，不用每次都去 `activityLog` 裡查詢。

`KnowledgeItem` 新增：

```ts
export interface KnowledgeItem {
  // ...既有欄位
  activityLog: ActivityRecord[]
}
```

## Store Action 變更

各 action 寫入 `activityLog` 的對照表：

| Action | 寫入 activityLog | 版本狀態變化 | 備註 |
|---|---|---|---|
| `submitForReview` | `SUBMITTED` | → `reviewing` | 沿用既有 `reviewNote` 一併寫入 `note` |
| `approveVersionPending`（新） | `APPROVED` | → `approved` | 新增 action；同時設 `k.status = 'approved'`，讓既有「已核准，待發佈」頭部 UI 真正可觸發 |
| `approveVersion`（既有，一步到位） | `APPROVED` + `PUBLISHED`（同一時間戳，兩筆） | → `active` | 兩筆分開寫，讓時間軸語意一致：「核准」永遠代表審核通過，「發佈」永遠代表正式上線，不因為一步到位就省略 |
| `publishApprovedVersion` | `PUBLISHED` | `approved` → `active` | |
| `rejectVersion` | `REJECTED` | → `rejected` | 沿用既有 `reviewFeedback` 寫入 `note` |
| `withdrawReview` | `WITHDRAWN` | → `draft` | |
| `switchToVersion` | `SWITCHED`（`versionId`=換上來的版本，`replacedVersionId`=被換下去的版本） | 兩版狀態互換 | 只寫一筆，不拆成兩筆 |

```ts
// 新增
const approveVersionPending = (knowledgeId: string, versionId: string) => {
  const k = getKnowledgeById(knowledgeId);
  if (!k) return;
  const v = k.versions.find(ver => ver.id === versionId);
  if (!v || v.status !== 'reviewing') return;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  v.status = 'approved';
  v.reviewedBy = 'Current User';
  v.reviewedTime = now;

  k.activityLog.push({
    id: `act-${Date.now()}`,
    action: 'APPROVED',
    by: 'Current User',
    time: now,
    versionId: v.id,
    versionNumber: v.versionNumber,
  });

  k.status = 'approved';
};
```

其餘既有 action（`submitForReview`／`approveVersion`／`rejectVersion`／`withdrawReview`／`publishApprovedVersion`／`switchToVersion`）維持原本的狀態轉換邏輯不變，只在各自的既有邏輯之後**新增** `k.activityLog.push(...)` 呼叫，不刪改既有行為（避免影響 `knowledgeStore.multiFileSources.test.ts` 裡對 `approveVersion` 的既有斷言）。

## UI：新增「活動紀錄」分頁

### `KnowledgeDetail.vue`

分頁清單插入新項目：

```ts
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'activity', label: '活動紀錄', icon: 'timeline' },   // 新增
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
```

Tab 內容：純粹的時間軸列表（新到舊排序，跟現有版本歷程排序習慣一致），每列一個 icon＋文字，沒有版本卡片分組：

```html
<div class="detail-tab-panel" :class="{ 'is-active': activeTabKey === 'activity' }">
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
```

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

樣式：icon 顏色比照既有 status-badge 色系（送審藍 `--tag-blue`、核准/發佈綠 `--success`/`--accent-soft`、退回紅 `--danger`/`--danger-soft`、撤回灰 `--tag-slate`、切換紫 `--tag-violet`），沿用 `_KnowledgeDetail.scss` 既有 token，不新增色票。

### `isPipelineReview` 重新接上

```ts
const isPipelineReview = computed(() => {
  if (viewedVer.value?.status !== 'reviewing') return false
  const hasSubmitRecord = knowledge.value?.activityLog?.some(
    e => e.action === 'SUBMITTED' && e.versionId === viewedVer.value?.id
  )
  return !hasSubmitRecord
})
```

### `ReviewDrawer.vue`

底部按鈕從「退回｜通過並發布」兩顆改成「退回｜僅核准（待發佈）｜通過並發布」三顆。「僅核准（待發佈）」呼叫新的 `knowledgeStore.approveVersionPending(...)`，關閉抽屜後 toast「已核准，待發佈」；「通過並發布」維持既有 `approveVersion` 呼叫與 toast 文案不變。

## Mock Data 遷移

### k2（後台角色權限說明）

移除各版本上的 `reviewNote`/`reviewedBy`/`reviewedTime`/`reviewHistory` 欄位改寫方式（保留 `reviewNote`/`reviewedBy`/`reviewedTime` 純欄位值不變，只移除 `reviewHistory`），並在 `k2.activityLog` 補上完整對照：

| 版本 | activityLog 紀錄 |
|---|---|
| v1.0 | `SUBMITTED`（Admin, 2025-03-10 09:00）→ `APPROVED`+`PUBLISHED`（Ethan, 2025-03-10 09:20，一步到位） |
| v1.1 | `SUBMITTED`（Rita, 2025-11-20 16:40）→ `APPROVED`+`PUBLISHED`（Ethan, 2025-11-21 09:10，一步到位） |
| v1.2 | `SUBMITTED`（Rita, 2026-03-18 10:20）→ `APPROVED`（Ethan, 2026-03-19 09:40）——沒有 `PUBLISHED`，對應現在「已核准・待發佈」的狀態 |
| v2.0 | `SUBMITTED`（Rita, 2026-04-01 11:00）——還在審核中，只有這一筆 |

共 7 筆紀錄，時間軸連貫，涵蓋 `SUBMITTED`／`APPROVED`／`PUBLISHED` 三種型態。`SWITCHED` 不預先埋假資料，讓使用者實際按下「切換當前版本」時才自然產生第一筆真實紀錄。

### 其他 13 筆項目

`activityLog: []`。不補寫內容，畫面顯示「尚無活動紀錄」空狀態。

## 測試計畫

- `vue-tsc --noEmit`：型別檢查，確認 `ReviewRecord` 移除、`ActivityRecord`/`activityLog` 型別在所有讀寫點（`knowledgeStore.ts`／`KnowledgeDetail.vue`／`ReviewDrawer.vue`）一致。
- `eslint`：確認新增檔案無新增 lint 錯誤。
- `knowledgeStore.multiFileSources.test.ts`：既有測試涵蓋 `approveVersion` 的 `syncMembership` 回呼與 `.status` 斷言，改動後重跑確認仍全數通過（本次改動只在既有邏輯後方新增 `activityLog.push`，不改動既有斷言涉及的欄位）。
- 手動／headless browser 驗證（沿用本次會話已使用的 Playwright 腳本模式，用站內導覽而非 `page.goto()` 換頁以保留 Pinia store 狀態）：
  1. k2 詳情頁「活動紀錄」分頁顯示 7 筆紀錄，時間排序正確。
  2. 對 v2.0 按「僅核准（待發佈）」→ 狀態變 `approved`、頭部出現「已核准，待發佈」＋「立即發佈」按鈕（驗證這組既有但先前無法觸達的 UI 現在是活的）、活動紀錄新增一筆 `APPROVED`。
  3. 對已核准版本按「立即發佈」→ 活動紀錄新增一筆 `PUBLISHED`。
  4. 對歷史版本按「切換當前版本」→ 活動紀錄新增一筆 `SWITCHED`，文字正確顯示「從 A 切換為 B」。
  5. `isPipelineReview` banner：確認手動送審過的版本不顯示 banner，維持既有行為。

## 修訂記錄

- 2026-08-26：初版設計，涵蓋送審／核准／退回／撤回／發佈／切換版本六種動作的統一活動紀錄。
