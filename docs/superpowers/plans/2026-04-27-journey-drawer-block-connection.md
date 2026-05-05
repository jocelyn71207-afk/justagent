# Journey Drawer ↔ Block 視覺連動 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hover drawer 旅程區段 → 畫布自動 pan 到對應 iframe 區塊並高亮，另一個區塊淡出。

**Architecture:** 在 `AiViewer.vue` 新增 hover intent refs 與 pan/highlight 邏輯，template 中將兩個旅程區段各自包進 `<div class="jcd-section">` 並加上 mouseenter/mouseleave。Highlight 透過 DOM 操作對 `VueDragResizeRotate` 的根元素（id = block.id）加/移除 CSS class。

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Konva.js（`setMainStagePosition` 已存在）, SCSS

---

## File Map

| 動作 | 路徑 |
|------|------|
| Modify | `src/views/AiViewer.vue` |
| Modify | `src/scss/views/_AiViewer.scss` |

---

### Task 1：SCSS — 新增 section 容器、hover 狀態、chip、block 高亮/淡出

**Files:**
- Modify: `src/scss/views/_AiViewer.scss` — 在 `.journey-canvas-drawer` 區塊內新增樣式，並在檔案尾端新增 block highlight 全域樣式

- [ ] **Step 1：在 `.journey-canvas-drawer` 內的 `// ── Journey-type section header ──` 之前插入 `.jcd-section` 相關樣式**

在 [src/scss/views/_AiViewer.scss:3428](src/scss/views/_AiViewer.scss#L3428)，找到這行：
```scss
  // ── Journey-type section header ──
```
在它**上方**插入：
```scss
  // ── Section 容器（hover 互動範圍）──
  .jcd-section {
    border-radius: 8px;
    border: 1.5px solid transparent;
    padding: 4px 4px 2px;
    transition: background 0.2s, border-color 0.2s;
    cursor: default;
    &--hover-marketing {
      background: #eff6ff;
      border-color: #3b72f6;
    }
    &--hover-birthday {
      background: #f5f3ff;
      border-color: #7c3aed;
    }
  }

```

- [ ] **Step 2：在 `.jcd-type-name` 後插入 `.jcd-locate-chip` 樣式**

在 [src/scss/views/_AiViewer.scss:3443](src/scss/views/_AiViewer.scss#L3443)，找到這段：
```scss
  .jcd-type-name {
    font-size: 11px;
    font-weight: 700;
    color: #1a1d23;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
```
在它**後面**（緊接著）插入：
```scss
  .jcd-locate-chip {
    font-size: 9px;
    font-weight: 700;
    border-radius: 4px;
    padding: 2px 5px;
    opacity: 0;
    transition: opacity 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    .jcd-section--hover-marketing & {
      opacity: 1;
      background: #3b72f6;
      color: #fff;
    }
    .jcd-section--hover-birthday & {
      opacity: 1;
      background: #7c3aed;
      color: #fff;
    }
  }

```

- [ ] **Step 3：在檔案尾端（`.jcd-fab-pop-leave-to` block 之後）新增 block 高亮 / 淡出全域 class**

在檔案最後一行（3658 行）之後 append：
```scss

// ── Journey block hover highlight（套用在 AiViewerContentBox 的根元素）──
.jcd-highlight-marketing {
  outline: 3px solid #3b72f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 114, 246, 0.2), 0 0 24px rgba(59, 114, 246, 0.12) !important;
  transition: outline 0.2s, box-shadow 0.2s;
  z-index: 50 !important;
}
.jcd-highlight-birthday {
  outline: 3px solid #7c3aed !important;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2), 0 0 24px rgba(124, 58, 237, 0.12) !important;
  transition: outline 0.2s, box-shadow 0.2s;
  z-index: 50 !important;
}
.jcd-dimmed {
  opacity: 0.35 !important;
  transition: opacity 0.2s;
}
```

- [ ] **Step 4：type-check 確認 SCSS 沒有問題**

```bash
npm run type-check
```
Expected: 0 errors（SCSS 不會在 type-check 報錯，確認 ts 沒有被影響即可）

- [ ] **Step 5：Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "style: add jcd-section hover, locate-chip, and block highlight SCSS"
```

---

### Task 2：AiViewer.vue script — 新增 hover refs 與 pan/highlight 邏輯

**Files:**
- Modify: `src/views/AiViewer.vue:480-528`（journey drawer 的 refs 區段，在 `jcdStats` computed 之前）

- [ ] **Step 1：在現有 journey drawer refs 之後插入新 refs 與 timer 變數**

在 [src/views/AiViewer.vue:483](src/views/AiViewer.vue#L483)，找到這行：
```typescript
watch(() => journeyStore.journeys.length, (n) => { if (n > 0) showJourneyDrawer.value = true; });
```
在它**後面**插入（空一行）：
```typescript
const jcdHoverType = ref<'marketing' | 'birthday' | null>(null);
let jcdHoverTimer: ReturnType<typeof setTimeout> | null = null;
```

- [ ] **Step 2：在 `jcdStats` computed 之後插入三個 helper functions**

在 [src/views/AiViewer.vue:528](src/views/AiViewer.vue#L528)，找到這行（`jcdStats` computed 的結尾）：
```typescript
});
```
確認上下文：`jcdStats` computed 的末尾是 `});`，緊接著是一個空行和 `// konva.js 主場景物件`。

在那個 `});` 之後、`// konva.js 主場景物件` 之前插入：

```typescript

function findJourneyBlock(type: 'marketing' | 'birthday') {
  const keyword = type === 'marketing' ? 'journey_dashboard' : 'birthday_journey';
  return (aiViewerBlocks.value as any[]).find(
    (b: any) => b.data?.data?.fileUrl?.includes(keyword)
  ) ?? null;
}

function panToJourneyBlock(type: 'marketing' | 'birthday') {
  const block = findJourneyBlock(type);
  if (!block || !mainStage.value) return;
  const s = mainStage.value.scaleX();
  const newX = centerViewWidth.value / 2 / s - (block.x + block.width / 2);
  const newY = centerViewHeight.value / 2 / s - (block.y + block.height / 2);
  setMainStagePosition(newX, newY);
}

function applyJourneyBlockHighlight(type: 'marketing' | 'birthday') {
  const focusBlock = findJourneyBlock(type);
  const otherType: 'marketing' | 'birthday' = type === 'marketing' ? 'birthday' : 'marketing';
  const otherBlock = findJourneyBlock(otherType);
  if (focusBlock) {
    document.getElementById(focusBlock.id)?.classList.add(`jcd-highlight-${type}`);
  }
  if (otherBlock) {
    document.getElementById(otherBlock.id)?.classList.add('jcd-dimmed');
  }
}

function clearJourneyBlockHighlight() {
  document.querySelectorAll('.jcd-highlight-marketing, .jcd-highlight-birthday, .jcd-dimmed')
    .forEach(el => {
      el.classList.remove('jcd-highlight-marketing', 'jcd-highlight-birthday', 'jcd-dimmed');
    });
}

function onJcdSectionEnter(type: 'marketing' | 'birthday') {
  if (jcdHoverTimer) clearTimeout(jcdHoverTimer);
  jcdHoverTimer = setTimeout(() => {
    jcdHoverType.value = type;
    panToJourneyBlock(type);
    applyJourneyBlockHighlight(type);
  }, 400);
}

function onJcdSectionLeave() {
  if (jcdHoverTimer) { clearTimeout(jcdHoverTimer); jcdHoverTimer = null; }
  jcdHoverType.value = null;
  clearJourneyBlockHighlight();
}
```

- [ ] **Step 3：在 `onUnmounted` 裡加入 timer cleanup**

在 [src/views/AiViewer.vue:1663](src/views/AiViewer.vue#L1663)，找到：
```typescript
onUnmounted(() => {
  // 移除 body 的 style
  document.body.style.overflow = "";
```
在 `document.body.style.overflow = "";` 之後插入：
```typescript
  if (jcdHoverTimer) { clearTimeout(jcdHoverTimer); jcdHoverTimer = null; }
  clearJourneyBlockHighlight();
```

- [ ] **Step 4：type-check 確認型別正確**

```bash
npm run type-check
```
Expected: 0 errors

- [ ] **Step 5：Commit**

```bash
git add src/views/AiViewer.vue
git commit -m "feat: add journey drawer hover-intent refs and pan/highlight logic"
```

---

### Task 3：AiViewer.vue template — 包 section div、加 chip、加 hover 事件

**Files:**
- Modify: `src/views/AiViewer.vue:363-442`（drawer template 的 marketing + birthday 兩個 section）

- [ ] **Step 1：改寫 marketing section — 包入 jcd-section div + 加 chip**

在 [src/views/AiViewer.vue:363](src/views/AiViewer.vue#L363)，找到並完整替換整個 marketing section：

Old（363–400 行）：
```html
        <!-- 行銷自動化旅程 section -->
        <template v-if="jcdStats.marketing.total > 0">
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--marketing"></span>
            <span class="jcd-type-name">行銷自動化旅程</span>
          </div>
```
New（只替換這一小段 header，**不動後面的 stat-row 與 node-dist**）：
```html
        <!-- 行銷自動化旅程 section -->
        <template v-if="jcdStats.marketing.total > 0">
          <div
            class="jcd-section"
            :class="{ 'jcd-section--hover-marketing': jcdHoverType === 'marketing' }"
            @mouseenter="onJcdSectionEnter('marketing')"
            @mouseleave="onJcdSectionLeave()"
          >
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--marketing"></span>
            <span class="jcd-type-name">行銷自動化旅程</span>
            <span class="jcd-locate-chip">定位 ↗</span>
          </div>
```

然後在 marketing section 結束的 `</template>` 之前（line 400 之前）加上 `</div>`，收合 `jcd-section`。

找到（line 399–400）：
```html
          <div v-if="jcdStats.marketing.total > 8" class="jcd-rows-more">+{{ jcdStats.marketing.total - 8 }} 人</div>
        </template>
```
替換為：
```html
          <div v-if="jcdStats.marketing.total > 8" class="jcd-rows-more">+{{ jcdStats.marketing.total - 8 }} 人</div>
          </div><!-- /jcd-section marketing -->
        </template>
```

- [ ] **Step 2：改寫 birthday section — 包入 jcd-section div + 加 chip**

找到 birthday section header（lines 404–409）：
```html
        <!-- 5月壽星專屬旅程 section -->
        <template v-if="jcdStats.birthday.total > 0">
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--birthday"></span>
            <span class="jcd-type-name">5月壽星專屬旅程</span>
          </div>
```
替換為：
```html
        <!-- 5月壽星專屬旅程 section -->
        <template v-if="jcdStats.birthday.total > 0">
          <div
            class="jcd-section"
            :class="{ 'jcd-section--hover-birthday': jcdHoverType === 'birthday' }"
            @mouseenter="onJcdSectionEnter('birthday')"
            @mouseleave="onJcdSectionLeave()"
          >
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--birthday"></span>
            <span class="jcd-type-name">5月壽星專屬旅程</span>
            <span class="jcd-locate-chip">定位 ↗</span>
          </div>
```

然後在 birthday section 結束的 `</template>` 之前加上 `</div>` 收合 `jcd-section`。

找到（lines 441–442）：
```html
          <div v-if="jcdStats.birthday.total > 8" class="jcd-rows-more">+{{ jcdStats.birthday.total - 8 }} 人</div>
        </template>
```
替換為：
```html
          <div v-if="jcdStats.birthday.total > 8" class="jcd-rows-more">+{{ jcdStats.birthday.total - 8 }} 人</div>
          </div><!-- /jcd-section birthday -->
        </template>
```

- [ ] **Step 3：type-check + lint**

```bash
npm run type-check && npm run lint
```
Expected: 0 errors, 0 lint errors

- [ ] **Step 4：Commit**

```bash
git add src/views/AiViewer.vue
git commit -m "feat: add hover-driven drawer↔block connection — section wrap + locate chip"
```

---

### Task 4：手動測試驗收

- [ ] **Step 1：啟動 dev server**

```bash
npm run dev
```

- [ ] **Step 2：進入 AiViewer，觸發旅程執行**

1. 開啟含旅程的 demo 頁面
2. 點擊「啟動旅程」讓 drawer 出現
3. 確認 drawer 顯示行銷旅程與生日旅程兩個區段

- [ ] **Step 3：驗收 hover 行為**

| 操作 | 預期結果 |
|------|---------|
| Hover「行銷自動化旅程」區段，停留 < 0.4s 即移開 | 畫布不移動（防抖生效）|
| Hover「行銷自動化旅程」區段，停留 ≥ 0.4s | 區段背景變藍、出現「定位 ↗」chip；畫布 pan 到行銷旅程 iframe；行銷區塊藍色光暈；生日區塊淡出 |
| Hover「5月壽星專屬旅程」區段，停留 ≥ 0.4s | 區段背景變紫、出現「定位 ↗」chip；畫布 pan 到生日旅程 iframe；生日區塊紫色光暈；行銷區塊淡出 |
| 移開 hover | 所有高亮/淡出還原；畫布停在最後 pan 位置 |
| 對應旅程 iframe 不在畫布上（尚未加入）| hover 不報錯，只是不移動也不高亮（`findJourneyBlock` 返回 null）|

- [ ] **Step 5：Commit（如無額外修正）**

```bash
git add -p  # 確認無意外改動
git commit -m "test: verify journey drawer hover connection — all cases pass"
```
（若 step 3 發現 bug，先修復再 commit）
