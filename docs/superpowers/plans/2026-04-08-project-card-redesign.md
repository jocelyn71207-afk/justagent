# 專案卡片重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為專案卡片新增協作人數、專案狀態、整卡可點擊，以及 hover 切換近一週使用圖。

**Architecture:** 所有變更集中在單一元件 `ProjectListContent.vue`（模板 + helper functions）與 `src/scss/_layout.scss`（新增 `.chart-box`、`.img-collab`、`.status-badge` 樣式）。不引入外部 library，長條圖以純 CSS div 實作，高度由 helper function `barHeight()` 計算。

**Tech Stack:** Vue 3 Composition API (`<script setup lang="ts">`), SCSS with CSS Custom Properties, Vitest for unit tests

---

## 檔案變更清單

| 動作 | 路徑 | 說明 |
|------|------|------|
| Modify | `src/components/ProjectListContent/ProjectListContent.vue` | 模板、helper functions、mock 資料 |
| Modify | `src/scss/_layout.scss` | 新增 chart-box、img-collab、status-badge 樣式 |
| Create | `src/utils/projectCard.ts` | `barHeight`、`weekLabel`、`statusLabel` 三個 pure helper functions |
| Create | `src/utils/__tests__/projectCard.test.ts` | 上述 helpers 的單元測試 |

---

### Task 1: 建立 helper functions 並通過測試

**Files:**
- Create: `src/utils/projectCard.ts`
- Create: `src/utils/__tests__/projectCard.test.ts`

- [ ] **Step 1: 建立測試檔**

建立 `src/utils/__tests__/projectCard.test.ts`，內容如下：

```typescript
import { describe, it, expect } from 'vitest';
import { barHeight, weekLabel, statusLabel } from '@/utils/projectCard';

describe('barHeight', () => {
  it('最大值回傳 80', () => {
    expect(barHeight(20, [12, 8, 20, 15, 5, 3, 18])).toBe(80);
  });
  it('0 回傳 4（min-height）', () => {
    expect(barHeight(0, [12, 8, 20, 15, 5, 3, 18])).toBe(4);
  });
  it('一半的值約回傳 40', () => {
    expect(barHeight(10, [20, 10])).toBe(40);
  });
  it('所有值相同時全部回傳 80', () => {
    expect(barHeight(5, [5, 5, 5])).toBe(80);
  });
});

describe('weekLabel', () => {
  it('index 6 回傳「今天」', () => {
    expect(weekLabel(6)).toBe('今天');
  });
  it('index 5 回傳「1天前」', () => {
    expect(weekLabel(5)).toBe('1天前');
  });
  it('index 0 回傳「6天前」', () => {
    expect(weekLabel(0)).toBe('6天前');
  });
});

describe('statusLabel', () => {
  it('pending → 待啟動', () => {
    expect(statusLabel('pending')).toBe('待啟動');
  });
  it('active → 進行中', () => {
    expect(statusLabel('active')).toBe('進行中');
  });
  it('review → 待驗收', () => {
    expect(statusLabel('review')).toBe('待驗收');
  });
  it('done → 已完成', () => {
    expect(statusLabel('done')).toBe('已完成');
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npm run test:unit -- src/utils/__tests__/projectCard.test.ts
```

預期：FAIL — `Cannot find module '@/utils/projectCard'`

- [ ] **Step 3: 建立 helper 實作**

建立 `src/utils/projectCard.ts`，內容如下：

```typescript
export type ProjectStatus = 'pending' | 'active' | 'review' | 'done';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: '待啟動',
  active:  '進行中',
  review:  '待驗收',
  done:    '已完成',
};

/**
 * 將單一數值依照陣列最大值比例換算為長條高度（px），最小值為 4。
 */
export function barHeight(count: number, arr: number[]): number {
  const max = Math.max(...arr);
  if (max === 0) return 4;
  return Math.max(4, Math.round((count / max) * 80));
}

/**
 * 將 index（0 = 6天前, 6 = 今天）轉換為中文標籤。
 */
export function weekLabel(index: number): string {
  const daysAgo = 6 - index;
  return daysAgo === 0 ? '今天' : `${daysAgo}天前`;
}

/**
 * 將 status value 轉換為中文標籤。
 */
export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm run test:unit -- src/utils/__tests__/projectCard.test.ts
```

預期：全部 PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/projectCard.ts src/utils/__tests__/projectCard.test.ts
git commit -m "feat: add projectCard helper functions with tests"
```

---

### Task 2: 更新 mock 資料，新增三個欄位

**Files:**
- Modify: `src/components/ProjectListContent/ProjectListContent.vue:252-353`

- [ ] **Step 1: 更新 mock 資料**

在 `getProjectList()` 函式內，將六筆 mock 資料各自補上以下欄位（每筆 status 依下表設定，其餘欄位相同）：

| id  | status    |
|-----|-----------|
| aaa | `active`  |
| bbb | `review`  |
| ccc | `done`    |
| ddd | `active`  |
| eee | `pending` |
| fff | `pending` |

每筆補上：

```typescript
isHovered: false,
status: 'active',          // 依上表各自替換
collaborators: [
  { userId: 'user1', name: 'Lucas' },
  { userId: 'user2', name: '滷卡酥' },
  { userId: 'user3', name: '小烏龜' },
],
weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
```

`id: 'eee'` 和 `id: 'fff'` 的 collaborators 只放一人，以測試只有一個頭像的情況：

```typescript
collaborators: [{ userId: 'user1', name: 'Lucas' }],
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat: add status/collaborators/weeklyUsage to project mock data"
```

---

### Task 3: 新增 SCSS 樣式

**Files:**
- Modify: `src/scss/_layout.scss`

- [ ] **Step 1: 在 `.one-card-box.project-card` 中新增樣式**

在 `src/scss/_layout.scss` 的 `.one-card-box.project-card {` 區塊內（約第 137 行），做以下修改：

**1. 卡片根層加 `cursor: pointer`：**

```scss
&.project-card {
  position: relative;
  cursor: pointer;   // 新增這行
  // ...其餘既有樣式
```

**2. 在 `.img-box { }` 內新增 `position: relative` 與子樣式（原本 `.img-box` 只有 border-radius 等，沒有 position）：**

```scss
.img-box {
  border-radius: 16px;
  border: 1px solid var(--color-border-1-alpha50);
  box-shadow: 0 4px 10px -6px rgba(from var(--color-shadow) r g b / 0.5);
  height: 205px;
  overflow: hidden;
  position: relative;   // 新增，為 img-collab 提供定位基準
  > img {
    object-position: 50% 50%;
    object-fit: cover;
    width: 100%;
    height: 100%;
    cursor: default;   // 改：移除原本的 cursor: pointer
  }
  .img-collab {
    position: absolute;
    bottom: 10px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
    z-index: 2;
    .avatar-group { display: flex; }
    .avatar-sm {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--color-background);
      font-size: 9px;
      font-weight: 700;
      color: $white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: -6px;
      &:first-child { margin-left: 0; }
    }
    .collab-count {
      font-size: 11px;
      font-weight: 600;
      color: $white;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 10px;
      padding: 2px 7px;
    }
  }
}
```

**3. 在 `.img-box` 之後，`.footer-box` 之前，插入 `.chart-box`：**

```scss
.chart-box {
  height: 205px;
  background: var(--color-background-1);
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 8px;
  .chart-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-alpha50);
    margin-bottom: 8px;
  }
  .chart-bars {
    display: flex;
    align-items: flex-end;
    flex: 1;
    gap: 6px;
  }
  .bar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 1;
  }
  .bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--color-primary);
    min-height: 4px;
  }
  .bar-label { font-size: 9px; color: var(--color-text-alpha50); }
  .bar-count  { font-size: 9px; color: var(--color-text-alpha50); }
}
```

**4. 在 `.footer-box { }` 內的 `.info-box` 裡，新增 `.status-row` 與 `.status-badge`：**

```scss
.info-box {
  flex: 1;
  min-width: 0;
  .project-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
  }
  .status-row {
    margin: 4px 0;
  }
  .status-badge {
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    &.status-pending { background: var(--color-background-2); color: var(--color-text-alpha50); }
    &.status-active  { background: rgba(74, 222, 128, 0.15);  color: #16a34a; }
    &.status-review  { background: rgba(251, 191, 36, 0.15);  color: #ca8a04; }
    &.status-done    { background: rgba(139, 92, 246, 0.15);  color: #7c3aed; }
  }
  .lastModify {
    font-size: 14px;
    color: var(--color-text-alpha50);
    margin-top: 5px;
  }
}
```

- [ ] **Step 2: 啟動 dev server 目視確認樣式無跑版**

```bash
npm run dev
```

瀏覽器開啟專案列表頁，確認：
- 卡片整體有 `cursor: pointer`
- 卡片圖片高度與既有一致（205px）
- 尚未加入模板變更，畫面不應有破版

- [ ] **Step 3: Commit**

```bash
git add src/scss/_layout.scss
git commit -m "feat: add chart-box, img-collab, status-badge SCSS styles"
```

---

### Task 4: 更新卡片模板

**Files:**
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`（template 區段，約第 44–75 行）

- [ ] **Step 1: 在 `<script setup>` 中 import helpers 並新增 helper functions**

在現有 import 區段（約第 150–162 行），新增：

```typescript
import { barHeight, weekLabel, statusLabel } from '@/utils/projectCard';
import type { ProjectStatus } from '@/utils/projectCard';
```

在 `gotoAiViewer` 函式之前，新增以下 helper 的包裝（供模板使用，直接 re-export 即可，或直接在 template 呼叫 import 的函式）：

> 注意：Vue 3 `<script setup>` 中直接 import 的函式即可在模板使用，無需額外宣告。

- [ ] **Step 2: 替換卡片模板**

將現有卡片模板（第 46–74 行）整段替換為：

```html
<div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="'card' + i"
  @click="gotoAiViewer(item)"
  @mouseenter="item.isHovered = true"
  @mouseleave="item.isHovered = false; item.showMoreOption = false">

  <!-- 只有 recent 才要出現 -->
  <div class="team-name-box" v-if="mode === 'recent'">{{ item.team.name }}</div>
  <i :class="['material-symbols-outlined favorite-btn', {
    'material-fill': i === 0,
    'active': i === 0
  }]">star</i>

  <!-- 圖片（預設顯示） -->
  <div class="img-box" v-show="!item.isHovered">
    <img :src="item.imgSrc" alt="">
    <div class="img-collab">
      <div class="avatar-group">
        <div
          class="avatar-sm"
          v-for="(c, ci) in item.collaborators.slice(0, 3)"
          :key="ci"
          :style="{ backgroundColor: avatarColor(ci) }"
        >
          {{ c.name.slice(0, 1) }}
        </div>
      </div>
      <span class="collab-count">{{ item.collaborators.length }} 人</span>
    </div>
  </div>

  <!-- 長條圖（hover 時顯示） -->
  <div class="chart-box" v-show="item.isHovered">
    <span class="chart-title">近一週使用次數</span>
    <div class="chart-bars">
      <div class="bar-wrap" v-for="(count, di) in item.weeklyUsage" :key="di">
        <span class="bar-count">{{ count }}</span>
        <div class="bar" :style="{ height: barHeight(count, item.weeklyUsage) + 'px' }"></div>
        <span class="bar-label">{{ weekLabel(di) }}</span>
      </div>
    </div>
  </div>

  <div class="footer-box">
    <div class="info-box">
      <div class="project-name">{{ item.name }}</div>
      <div class="status-row">
        <span :class="['status-badge', `status-${item.status}`]">
          {{ statusLabel(item.status) }}
        </span>
      </div>
      <div class="lastModify">
        <template v-if="!item.isHovered">
          編輯於 {{ formatTimeToDisplay(item.lastModify) }}
        </template>
        <template v-else>
          近一週共 {{ item.weeklyUsage.reduce((a: number, b: number) => a + b, 0) }} 次
        </template>
      </div>
    </div>
    <div class="owner-box" v-tooltip="item.owner.uaerName">
      {{ item.owner.uaerName.slice(0,1) }}
    </div>

    <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
    <!-- 更多選項小介面 -->
    <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
      <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
      <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: 新增 `avatarColor` helper（script 區段）**

在 `<script setup>` 中，`gotoAiViewer` 函式前加入：

```typescript
const AVATAR_COLORS = ['#7c6aff', '#f472b6', '#34d399', '#fb923c', '#60a5fa'];
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
```

- [ ] **Step 4: 目視驗證**

```bash
npm run dev
```

開啟專案列表（Recent 模式），確認：
1. 每張卡片圖片左下角有協作人頭像與人數
2. footer 有狀態標籤（顏色正確）
3. 滑鼠移入 → 圖片換成長條圖，「編輯於」→「近一週共 N 次」
4. 滑鼠移出 → 恢復圖片
5. 點擊卡片任意區域（非 more-btn）→ 開啟專案
6. 點擊 more-btn → 開啟下拉選單，不觸發卡片點擊

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat: project card — clickable card, status badge, collaborators, hover usage chart"
```

---

## Self-Review

**Spec coverage check:**

| 需求 | 對應 Task |
|------|-----------|
| 顯示協作人數 | Task 4（img-collab 疊層） |
| 顯示專案狀態 | Task 4（status-badge）、Task 3（SCSS）|
| 整張卡片可點擊 | Task 4（@click on root）|
| hover 切換使用計數圖 | Task 4（v-show chart-box）|
| hover 時文字換成近一週 N 次 | Task 4（footer template）|
| helper functions 有測試 | Task 1 |
| mock 資料補欄位 | Task 2 |
| more-btn 加 @click.stop | Task 4 |

**Placeholder scan:** 無 TBD / TODO。

**Type consistency:**
- `barHeight`, `weekLabel`, `statusLabel` 在 Task 1 定義，Task 4 import 使用 — 一致。
- `ProjectStatus` type 在 Task 1 export，Task 4 import — 一致。
- `avatarColor` 在 Task 4 Step 3 定義，同 Step 2 模板使用 — 一致。
- `item.weeklyUsage` 在 Task 2 mock 中定義（length 7），Task 4 v-for 迭代 — 一致。
