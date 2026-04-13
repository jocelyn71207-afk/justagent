# ProjectTrashCans 美化實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 美化專案垃圾桶頁面，加入灰階卡片、色碼到期標籤、升級 info 橫幅、改善空狀態，以及危險操作紅色提示。

**Architecture:** 純 UI 層改動，僅修改 `ProjectTrashCans.vue` 的 template 與 `_ProjectTrashCans.scss`。新增 `expiryUrgency()` helper 計算標籤顏色等級，所有新 class 都收斂在 `.ProjectTrashCans` scope 內。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（BEM-like class）、Material Symbols Outlined icon font

---

## 檔案範圍

| 檔案 | 動作 |
|---|---|
| `src/views/ProjectTrashCans.vue` | 修改 template；script 新增 `expiryUrgency()` |
| `src/scss/views/_ProjectTrashCans.scss` | 新增所有樣式規則（取代原有 5 行） |

---

## Task 1：圖片灰階 + hover 縮小（SCSS）

**Files:**
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：覆寫 `_ProjectTrashCans.scss` 為以下內容**

```scss
@use '../base/variables' as *;

.ProjectTrashCans {
  // ── 卡片整體 ─────────────────────────────────────
  .card-list-box .one-card-box.project-card {
    cursor: default;

    &:hover {
      transform: translateY(-2px) scale(1.005);
    }

    // ── 圖片灰階 ─────────────────────────────────
    .img-box {
      position: relative;

      img {
        filter: grayscale(1);
        opacity: 0.55;
        cursor: default;
      }
    }
  }
}
```

- [ ] **Step 2：啟動 dev server 目測確認**

```bash
npm run dev
```

瀏覽至垃圾桶頁面，確認：
- 卡片圖片已變灰階且半透明
- hover 動畫縮小（不再大幅浮起）
- 點擊卡片圖片不顯示手型游標

---

## Task 2：到期標籤 badge（template + SCSS）

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：在 `<script setup>` 區塊末尾新增 `expiryUrgency`**

在 `ProjectTrashCans.vue` 的 `onMounted` 之前插入：

```ts
// 依剩餘天數回傳顏色等級
function expiryUrgency(dateStr: string): 'urgent' | 'warning' | 'normal' {
  const days = calcRemainingDays(dateStr);
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'normal';
}
```

- [ ] **Step 2：在 `.img-box` 內加入 badge 標籤**

找到 template 中的：
```html
<div class="img-box">
  <img :src="item.imgSrc" alt="">
</div>
```

改為：
```html
<div class="img-box">
  <img :src="item.imgSrc" alt="">
  <div :class="['expiry-badge', `expiry-badge--${expiryUrgency(item.remainingDays)}`]">
    剩 {{ calcRemainingDays(item.remainingDays) }} 天
  </div>
</div>
```

- [ ] **Step 3：在 SCSS `.img-box` 區塊內新增 badge 樣式**

在 `.img-box img { ... }` 之後插入：

```scss
      // ── 右上到期標籤 ───────────────────────────
      .expiry-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        border-radius: 20px;
        padding: 3px 9px;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        line-height: 1;
        letter-spacing: 0.02em;
        z-index: 2;
        pointer-events: none;

        &--urgent  { background: $color-danger; }
        &--warning { background: #f59e0b; }
        &--normal  { background: rgba(0, 0, 0, 0.38); }
      }
```

- [ ] **Step 4：目測確認**

在 dev server 確認：
- 每張卡片右上角都有「剩 N 天」標籤
- `trash1`（4/9 到期）→ 已過期 → 剩 0 天 → 紅色
- `trash2/3`（4/7 到期）→ 已過期 → 剩 0 天 → 紅色
- `trash6`（3/11 到期）→ 已過期 → 紅色

  > 注意：假資料的日期均已過期，所以全部顯示為 0 天紅色是正確的。測試時可暫改 `getTrashList` 中某筆的 `remainingDays` 為未來日期驗證顏色：
  >
  > ```ts
  > remainingDays: '2026-04-20 12:00:00',  // 應顯示黃色（7天內）
  > remainingDays: '2026-04-28 12:00:00',  // 應顯示灰色（>7天）
  > ```

- [ ] **Step 5：commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss
git commit -m "feat(trash): add expiry badge with urgency color coding"
```

---

## Task 3：垃圾桶角標（template + SCSS）

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：在 `.img-box` 內加入角標 icon**

找到 Task 2 後的 `.img-box`：
```html
<div class="img-box">
  <img :src="item.imgSrc" alt="">
  <div :class="['expiry-badge', ...]">...</div>
</div>
```

改為（在 `<img>` 後、`expiry-badge` 前插入）：
```html
<div class="img-box">
  <img :src="item.imgSrc" alt="">
  <i class="material-symbols-outlined trash-icon-overlay">delete</i>
  <div :class="['expiry-badge', `expiry-badge--${expiryUrgency(item.remainingDays)}`]">
    剩 {{ calcRemainingDays(item.remainingDays) }} 天
  </div>
</div>
```

- [ ] **Step 2：在 SCSS `.img-box` 區塊內新增角標樣式**

在 `img { ... }` 之後、`.expiry-badge` 之前插入：

```scss
      // ── 左上垃圾桶角標 ─────────────────────────
      .trash-icon-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.30);
        border-radius: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #fff;
        z-index: 2;
        pointer-events: none;
      }
```

- [ ] **Step 3：目測確認**

卡片圖片左上角出現半透明黑底的垃圾桶圖示。

- [ ] **Step 4：commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss
git commit -m "feat(trash): add trash icon overlay on card image"
```

---

## Task 4：Info 橫幅升級（template + SCSS）

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：替換 info 提示的 template**

找到：
```html
<div class="d-flex flex-align-center fs-14 fc-grey-1" v-if="trashList.length">
  <i class="material-symbols-outlined fs-19 mr-1">info</i>
  專案會顯示剩餘天數。過了期限後，專案將被永久刪除且無法復原。
</div>
```

改為：
```html
<div class="trash-info-banner" v-if="trashList.length">
  <i class="material-symbols-outlined">warning</i>
  <span>專案將依剩餘天數自動永久刪除。<strong>紅色標籤</strong>代表 3 天內到期，請盡快還原或確認刪除。</span>
</div>
```

- [ ] **Step 2：在 SCSS 底部 `.ProjectTrashCans` 內新增橫幅樣式**

```scss
  // ── Info 橫幅 ──────────────────────────────────
  .trash-info-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    color: #78350f;
    margin-bottom: 20px;
    line-height: 1.5;

    .material-symbols-outlined {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    strong {
      font-weight: 700;
    }
  }
```

- [ ] **Step 3：目測確認**

頁面頂部（卡片列表上方）出現黃底警示橫幅，文字說明顏色規則。

- [ ] **Step 4：commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss
git commit -m "feat(trash): upgrade info banner with warning style"
```

---

## Task 5：空狀態升級（template + SCSS）

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：替換空狀態 template**

找到：
```html
<div class="p-5 mt-4 text-center fc-grey-1" v-if="!trashList.length">
  <div class="fs-16 mt-1">垃圾桶中沒有專案</div>
</div>
```

改為：
```html
<div class="trash-empty-state" v-if="!trashList.length">
  <div class="empty-icon-wrap">
    <i class="material-symbols-outlined">delete</i>
  </div>
  <div class="empty-title">垃圾桶是空的</div>
  <div class="empty-sub">已刪除的專案會顯示在這裡</div>
</div>
```

- [ ] **Step 2：新增空狀態 SCSS**

```scss
  // ── 空狀態 ────────────────────────────────────
  .trash-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 12px;

    .empty-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--color-background-2);
      display: flex;
      align-items: center;
      justify-content: center;

      .material-symbols-outlined {
        font-size: 34px;
        color: var(--color-text-alpha50);
      }
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-alpha50);
    }

    .empty-sub {
      font-size: 13px;
      color: var(--color-text-alpha30);
    }
  }
```

- [ ] **Step 3：目測確認空狀態**

暫時將 `getTrashList()` 中 `trashList.value = [...]` 改為 `trashList.value = []`，
確認頁面顯示垃圾桶圖示 + 兩行說明文字後，再改回去。

- [ ] **Step 4：commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss
git commit -m "feat(trash): upgrade empty state with icon"
```

---

## Task 6：永久刪除選項紅色（template + SCSS）

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/scss/views/_ProjectTrashCans.scss`

- [ ] **Step 1：替換選單 template**

找到：
```html
<div :class="['next-option-box', { 'show': item.showMoreOption }]">
  <div class="option-item" @click="restoreProject(item)">還原</div>
  <div class="option-item" @click="permanentlyDelete(item)">永久刪除</div>
</div>
```

改為：
```html
<div :class="['next-option-box', { 'show': item.showMoreOption }]">
  <div class="option-item" @click="restoreProject(item)">還原</div>
  <div class="option-item danger" @click="permanentlyDelete(item)">永久刪除</div>
</div>
```

- [ ] **Step 2：新增危險選項 SCSS**

在 `.img-box` 區塊之後，`cursor: default;` 同層加入：

```scss
    // ── 危險選項（永久刪除）───────────────────────
    .next-option-box .option-item.danger {
      color: $color-danger;

      &:hover {
        background-color: rgba($color-danger, 0.08);
      }
    }
```

- [ ] **Step 3：目測確認**

點擊任一卡片的 `•••` 按鈕，確認「永久刪除」顯示紅色，hover 時紅色背景。

- [ ] **Step 4：最終完整目測**

確認全部改動：
1. 卡片圖片灰階半透明
2. 左上垃圾桶角標
3. 右上色碼標籤（假資料到期 → 紅色）
4. hover 動畫輕微
5. 頂部黃色警示橫幅
6. 「永久刪除」紅色
7. 空狀態（暫改資料確認）

- [ ] **Step 5：commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss
git commit -m "feat(trash): add danger style for permanent delete option"
```

---

## 完整 SCSS 參考（最終狀態）

完成所有任務後，`_ProjectTrashCans.scss` 應如下：

```scss
@use '../base/variables' as *;

.ProjectTrashCans {
  // ── 卡片整體 ─────────────────────────────────────
  .card-list-box .one-card-box.project-card {
    cursor: default;

    &:hover {
      transform: translateY(-2px) scale(1.005);
    }

    // ── 圖片灰階 ─────────────────────────────────
    .img-box {
      position: relative;

      img {
        filter: grayscale(1);
        opacity: 0.55;
        cursor: default;
      }

      // ── 左上垃圾桶角標 ─────────────────────────
      .trash-icon-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.30);
        border-radius: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #fff;
        z-index: 2;
        pointer-events: none;
      }

      // ── 右上到期標籤 ───────────────────────────
      .expiry-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        border-radius: 20px;
        padding: 3px 9px;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        line-height: 1;
        letter-spacing: 0.02em;
        z-index: 2;
        pointer-events: none;

        &--urgent  { background: $color-danger; }
        &--warning { background: #f59e0b; }
        &--normal  { background: rgba(0, 0, 0, 0.38); }
      }
    }

    // ── 危險選項（永久刪除）──────────────────────
    .next-option-box .option-item.danger {
      color: $color-danger;

      &:hover {
        background-color: rgba($color-danger, 0.08);
      }
    }
  }

  // ── Info 橫幅 ──────────────────────────────────
  .trash-info-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    color: #78350f;
    margin-bottom: 20px;
    line-height: 1.5;

    .material-symbols-outlined {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    strong {
      font-weight: 700;
    }
  }

  // ── 空狀態 ────────────────────────────────────
  .trash-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 12px;

    .empty-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--color-background-2);
      display: flex;
      align-items: center;
      justify-content: center;

      .material-symbols-outlined {
        font-size: 34px;
        color: var(--color-text-alpha50);
      }
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-alpha50);
    }

    .empty-sub {
      font-size: 13px;
      color: var(--color-text-alpha30);
    }
  }
}
```
