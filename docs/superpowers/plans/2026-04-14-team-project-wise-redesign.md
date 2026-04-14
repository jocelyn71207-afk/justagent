# TeamProject Wise 風格重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 SCSS + 局部 template 調整將 TeamProject / ProjectListContent 改成 Wise 風格，不動任何業務邏輯、props、emits 及 AppMenuTree。

**Architecture:** `_TeamProject.scss` 移除 `views-page` padding 讓 banner 全出血；新建 `_ProjectListContent.scss` 提供 Wise banner、toolbar、卡片 grid（4欄）、table、empty state 樣式；`ProjectListContent.vue` 重排 template 結構（banner + toolbar 取代原 views-page-header，卡片 HTML 重組），邏輯全不動。

**Tech Stack:** Vue 3 Composition API、SCSS (global, no scoped)、CSS Custom Properties (`--color-wise-*`)、Google Material Symbols

---

## File Map

| 路徑 | 動作 | 說明 |
|---|---|---|
| `src/scss/views/_TeamProject.scss` | 修改 | 移除 `.empty-box`，覆寫 `.views-page` padding 為 0 |
| `src/scss/components/_ProjectListContent.scss` | 新增 | 全部 Wise 樣式 |
| `src/scss/components/_index.scss` | 修改 | 加入 `@import "./ProjectListContent"` |
| `src/components/ProjectListContent/ProjectListContent.vue` | 修改 | template 重排（banner、toolbar、card、empty state） |
| `src/views/TeamProject.vue` | 修改 | 建立按鈕改 Wise 樣式 class |

---

## Task 1：Setup — SCSS 骨架與 `_index.scss` 登記

**Files:**
- Create: `src/scss/components/_ProjectListContent.scss`
- Modify: `src/scss/components/_index.scss`
- Modify: `src/scss/views/_TeamProject.scss`

- [ ] **Step 1：建立空 SCSS 骨架**

建立 `src/scss/components/_ProjectListContent.scss`，內容：

```scss
.ProjectListContent {
  // Wise styles — 依後續 Task 填入
}
```

- [ ] **Step 2：登記到 `_index.scss`**

在 `src/scss/components/_index.scss` 末尾加入：

```scss
@import "./ProjectListContent";
```

- [ ] **Step 3：更新 `_TeamProject.scss`**

將原本內容完全取代為以下（移除舊 `.empty-box`，覆寫 `.views-page` padding）：

```scss
.TeamProject {
  &.views-page {
    padding: 0;
    overflow-y: auto;
  }
}
```

- [ ] **Step 4：確認 build 無 error**

```bash
npm run build 2>&1 | tail -20
```

預期：無 error，正常完成。

- [ ] **Step 5：Commit**

```bash
git add src/scss/components/_ProjectListContent.scss src/scss/components/_index.scss src/scss/views/_TeamProject.scss
git commit -m "feat(wise): scaffold ProjectListContent SCSS, reset TeamProject padding"
```

---

## Task 2：Banner + Toolbar — SCSS

**Files:**
- Modify: `src/scss/components/_ProjectListContent.scss`

- [ ] **Step 1：寫 banner + toolbar SCSS**

將 `_ProjectListContent.scss` 替換為：

```scss
.ProjectListContent {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  // ── Banner ──────────────────────────────────────
  .plc-banner {
    background: var(--color-wise-green);
    padding: 28px 46px 22px;
    flex-shrink: 0;

    .plc-banner-breadcrumb {
      font-size: 11px;
      color: var(--color-wise-dark-green);
      opacity: 0.6;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .plc-banner-title {
      font-size: 26px;
      font-weight: 700;
      color: var(--color-wise-dark-green);
      letter-spacing: -0.3px;
    }

    .plc-banner-subtitle {
      font-size: 13px;
      color: var(--color-wise-dark-green);
      opacity: 0.6;
      margin-top: 3px;
    }
  }

  // ── Toolbar ─────────────────────────────────────
  .plc-toolbar {
    background: var(--color-wise-bg);
    padding: 12px 46px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-wise-surface);
    flex-shrink: 0;

    .plc-toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .plc-toolbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  // ── Wise 建立按鈕 ───────────────────────────────
  .wise-create-btn {
    background: var(--color-wise-dark-green);
    color: var(--color-wise-green);
    border: none;
    border-radius: 24px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    transition: opacity 0.15s;

    &:hover { opacity: 0.88; }

    i { font-size: 18px; }
  }

  // ── Content 區域 ────────────────────────────────
  .plc-content {
    padding: 24px 46px 46px;
    flex: 1;
  }
}
```

- [ ] **Step 2：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3：Commit**

```bash
git add src/scss/components/_ProjectListContent.scss
git commit -m "feat(wise): add banner and toolbar SCSS"
```

---

## Task 3：Banner + Toolbar — Template

**Files:**
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`
- Modify: `src/views/TeamProject.vue`

- [ ] **Step 1：替換 `ProjectListContent.vue` 的 root div 與 header**

找到這一段（第 1–15 行）：

```html
<template>
  <!-- 產品列表組件, "最近使用/團隊專案" 兩個大單元共用此組件 -->
  <div class="ProjectListContent views-page-content-box">

    <div class="views-page-header">
      <h3>
        {{ title }}
        <div v-if="subtitle" class="secondary-box">{{ subtitle }}</div>
      </h3>
      <div class="header-right-box">
        <!-- 建立新專案按鈕區 (由父層透過 scoped slot 自訂) -->
        <slot name="createBtnSlot" :openProjectSettingModal="openProjectSettingModal" />
        <compListCardSwitch v-model="projectListMode"/>
      </div>
    </div>

    <!-- Agent 過濾 Tabs (只有 recent 模式才有) -->
    <compTabs class="mb-2"
      v-if="mode === 'recent'"
      v-model="filterAgent"
      :tabs="agentTabs"
    />

    <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <template v-else>

      <!-- 排序條件 -->
      <div class="d-flex flex-justify-end" v-if="projectList.length">
        <compDropDown
```

替換成：

```html
<template>
  <!-- 產品列表組件, "最近使用/團隊專案" 兩個大單元共用此組件 -->
  <div class="ProjectListContent">

    <!-- Wise Banner Header -->
    <div class="plc-banner">
      <div v-if="mode === 'team'" class="plc-banner-breadcrumb">團隊</div>
      <div class="plc-banner-title">{{ mode === 'team' ? subtitle : title }}</div>
      <div v-if="!isLoading && !hasError" class="plc-banner-subtitle">
        {{ displayProjectList.length }} 個專案
      </div>
    </div>

    <!-- Toolbar -->
    <div class="plc-toolbar">
      <div class="plc-toolbar-left">
        <slot name="createBtnSlot" :openProjectSettingModal="openProjectSettingModal" />
        <compDropDown
          v-if="!isLoading && !hasError && projectList.length"
          :options="[
            { name: '時間排序 新 → 舊', value: 'desc' },
            { name: '時間排序 舊 → 新', value: 'asc' },
          ]"
          :show-search="false"
          :showClearTriggerIcon="false"
          :default-value="'desc'"
          :width="'190px'"
          :indent="'10px'"
          placeholder="依時間排序"
          @select="(item) => {
            sortValue = item.value;
            sortFn();
          }"
        />
      </div>
      <div class="plc-toolbar-right">
        <compListCardSwitch v-model="projectListMode"/>
      </div>
    </div>

    <!-- Agent 過濾 Tabs (只有 recent 模式才有) -->
    <compTabs class="mb-2"
      v-if="mode === 'recent'"
      v-model="filterAgent"
      :tabs="agentTabs"
    />

    <div class="plc-content">
    <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <template v-else>
```

> 注意：原本的排序 `compDropDown` 整段從 `<template v-else>` 內移除（已移到 toolbar）。

- [ ] **Step 2：找到並移除原本在 `<template v-else>` 內的排序 dropdown**

找到這一段並刪除整個 div（約第 29–46 行原始位置）：

```html
      <!-- 排序條件 -->
      <div class="d-flex flex-justify-end" v-if="projectList.length">
        <compDropDown
          :options="[
            { name: '時間排序 新 → 舊', value: 'desc' },
            { name: '時間排序 舊 → 新', value: 'asc' },
          ]"
          :show-search="false"
          :showClearTriggerIcon="false"
          :default-value="'desc'"
          :width="'190px'"
          :indent="'10px'"
          placeholder="依時間排序"
          @select="(item) => {
            sortValue = item.value;
            sortFn();
          }"
        />
      </div>
```

- [ ] **Step 3：在 `</template>` 結尾（`v-else` 結束的那個）之後，加上 `</div>` 關閉 `.plc-content`**

找到：

```html
    </template>

  </div>

  <!-- 專案設定 Modal -->
```

替換成：

```html
    </template>
    </div><!-- /plc-content -->

  </div>

  <!-- 專案設定 Modal -->
```

- [ ] **Step 4：更新 `TeamProject.vue` 的建立按鈕 class**

找到：

```html
        <button class="custom-btn custom-main-btn"
          @click="openProjectSettingModal(null, true, teamId as string)">
          <i class="material-symbols-outlined">add</i>
          建立新專案
        </button>
```

替換成：

```html
        <button class="wise-create-btn"
          @click="openProjectSettingModal(null, true, teamId as string)">
          <i class="material-symbols-outlined">add</i>
          建立新專案
        </button>
```

- [ ] **Step 5：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 6：啟動 dev server 確認 banner + toolbar 正確渲染**

```bash
npm run dev
```

在瀏覽器開啟 TeamProject 頁面，確認：
- 綠色 banner 全寬顯示，顯示「團隊」breadcrumb + 團隊名稱
- Toolbar 有建立按鈕（深綠底萊姆綠字）+ 排序下拉 + 視圖切換

- [ ] **Step 7：Commit**

```bash
git add src/components/ProjectListContent/ProjectListContent.vue src/views/TeamProject.vue
git commit -m "feat(wise): restructure banner and toolbar template"
```

---

## Task 4：卡片 Grid — SCSS

**Files:**
- Modify: `src/scss/components/_ProjectListContent.scss`

- [ ] **Step 1：在 `.ProjectListContent { }` 內的 `.plc-content` 之後加入卡片相關 SCSS**

在 `_ProjectListContent.scss` 的 `.ProjectListContent { }` 內，`.plc-content { }` 規則之後，加入以下（不要改動前面已寫的 banner/toolbar）：

```scss
  // ── 覆寫全域 card-list-box：固定 4 欄 ───────────
  .card-list-box {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    place-items: unset;
    justify-content: unset;
    width: 100%;
  }

  // ── 專案卡片 ────────────────────────────────────
  .project-card {
    border-radius: 14px;
    background: var(--color-wise-card);
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    cursor: pointer;
    max-width: unset;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    position: relative;

    &:hover {
      transform: translateY(-4px) scale(1);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.11), 0 2px 8px rgba(0, 0, 0, 0.06);
      border-color: transparent;
    }

    // ── 圖片區 ───────────────────────────────────
    .card-img {
      position: relative;
      height: 148px;
      overflow: hidden;
      background: var(--color-wise-surface);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .card-img-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.38) 0%, transparent 55%);
      }

      .card-star {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.65);
        cursor: pointer;
        background: none;
        padding: 0;
        border-radius: 0;
        z-index: 3;

        &.material-fill,
        &.active {
          color: var(--color-wise-green);
          background: none;
        }
      }

      .card-avatars {
        position: absolute;
        bottom: 10px;
        left: 12px;
        display: flex;
        align-items: center;
        z-index: 3;

        .avatar-chip {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid $white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          color: $white;
          margin-left: -6px;
          position: relative;

          &:first-child { margin-left: 0; }

          .owner-crown {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            line-height: 1;
          }
        }

        .collab-count {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          margin-left: 7px;
        }
      }

      .team-name-box {
        position: absolute;
        left: 10px;
        top: 10px;
        background: rgba(0, 0, 0, 0.45);
        color: $white;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        z-index: 3;
      }
    }

    // ── 長條圖區（hover） ─────────────────────────
    .card-chart {
      height: 148px;
      padding: 12px 14px 10px;
      background: #f8faf6;
      display: flex;
      flex-direction: column;

      .chart-title {
        font-size: 11px;
        color: var(--color-wise-gray);
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
        background: var(--color-wise-green);
        min-height: 4px;
      }

      .bar-label { font-size: 9px; color: var(--color-wise-gray); }
      .bar-count  { font-size: 9px; color: var(--color-wise-warm-dark); font-weight: 600; }

      .chart-total {
        font-size: 11px;
        color: var(--color-wise-dark-green);
        font-weight: 600;
        margin-top: 8px;
        flex-shrink: 0;
      }
    }

    // ── 卡片 footer ───────────────────────────────
    .card-footer {
      padding: 12px 14px 14px;
      position: relative;

      .card-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--color-wise-black);
        line-height: 1.35;
        margin-bottom: 8px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .card-meta-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .card-time {
          font-size: 11px;
          color: var(--color-wise-gray);
        }
      }

      .more-btn {
        font-size: 20px;
        color: var(--color-wise-gray);
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 0;
        padding: 0;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;

        &:hover {
          background: var(--color-wise-bg);
          color: var(--color-wise-black);
        }
      }

      .next-option-box {
        position: absolute;
        right: 14px;
        top: calc(100% - 4px);
        visibility: hidden;
        z-index: 10;

        &.show { visibility: visible; }
      }
    }

    // ── 狀態 badge ────────────────────────────────
    .status-badge {
      font-size: 11px;
      font-weight: 600;
      border-radius: 20px;
      padding: 3px 10px;

      &.status-active  { background: var(--color-wise-mint);          color: var(--color-wise-dark-green); }
      &.status-review  { background: var(--color-wise-badge-hot-bg);  color: var(--color-wise-badge-hot-text); }
      &.status-done    { background: var(--color-wise-surface);       color: var(--color-wise-warm-dark); }
      &.status-pending { background: #f0f0ef;                         color: var(--color-wise-gray); }
    }
  }
```

- [ ] **Step 2：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3：Commit**

```bash
git add src/scss/components/_ProjectListContent.scss
git commit -m "feat(wise): add card grid SCSS (4-col, Wise tokens)"
```

---

## Task 5：卡片 Grid — Template

**Files:**
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`

- [ ] **Step 1：替換卡片 HTML 結構**

找到（約第 49–118 行）：

```html
      <!-- 卡片樣式列表 -->
      <div class="card-list-box mt-2" v-if="projectListMode === 'card' && projectList.length">
        <div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="'card' + i"
          @click="gotoAiViewer(item)"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false; item.showMoreOption = false">

          <!-- 只有 recent 才要出現 -->
          <div class="team-name-box" v-if="mode === 'recent'">{{ item.team.name }}</div>
          <i :class="['material-symbols-outlined favorite-btn', {
            'material-fill': i === 0,
            'active': i === 0
          }]" @click.stop>star</i>

          <!-- 圖片（預設顯示） -->
          <div class="img-box" v-show="!item.isHovered">
            <img :src="item.imgSrc" alt="">
            <div class="img-collab">
              <div class="avatar-group">
                <div
                  :class="['avatar-sm', { 'avatar-owner': ci === 0 }]"
                  v-for="(c, ci) in item.collaborators.slice(0, 3)"
                  :key="ci"
                  :style="{ backgroundColor: avatarColor(ci) }"
                >
                  {{ c.name.slice(0, 1) }}
                  <span v-if="ci === 0" class="owner-crown">👑</span>
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
            <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
            <!-- 更多選項小介面 -->
            <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
              <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
              <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
            </div>
          </div>
        </div>
      </div>
```

替換成：

```html
      <!-- 卡片樣式列表 -->
      <div class="card-list-box" v-if="projectListMode === 'card' && projectList.length">
        <div class="project-card" v-for="(item, i) in displayProjectList" :key="'card' + i"
          @click="gotoAiViewer(item)"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false; item.showMoreOption = false">

          <!-- 圖片區（預設顯示） -->
          <div class="card-img" v-show="!item.isHovered">
            <div class="team-name-box" v-if="mode === 'recent'">{{ item.team.name }}</div>
            <img :src="item.imgSrc" alt="">
            <div class="card-img-overlay"></div>
            <i :class="['material-symbols-outlined card-star', {
              'material-fill': i === 0,
              'active': i === 0
            }]" @click.stop>star</i>
            <div class="card-avatars">
              <div
                :class="['avatar-chip', { 'avatar-owner': ci === 0 }]"
                v-for="(c, ci) in item.collaborators.slice(0, 3)"
                :key="ci"
                :style="{ backgroundColor: avatarColor(ci) }"
              >
                {{ c.name.slice(0, 1) }}
                <span v-if="ci === 0" class="owner-crown">👑</span>
              </div>
              <span class="collab-count">{{ item.collaborators.length }} 人</span>
            </div>
          </div>

          <!-- 長條圖區（hover 時顯示） -->
          <div class="card-chart" v-show="item.isHovered">
            <span class="chart-title">近一週使用次數</span>
            <div class="chart-bars">
              <div class="bar-wrap" v-for="(count, di) in item.weeklyUsage" :key="di">
                <span class="bar-count">{{ count }}</span>
                <div class="bar" :style="{ height: barHeight(count, item.weeklyUsage) + 'px' }"></div>
                <span class="bar-label">{{ weekLabel(di) }}</span>
              </div>
            </div>
            <div class="chart-total">
              近一週共 {{ item.weeklyUsage.reduce((a: number, b: number) => a + b, 0) }} 次
            </div>
          </div>

          <!-- 卡片 footer -->
          <div class="card-footer">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <span :class="['status-badge', `status-${item.status}`]">
                  {{ statusLabel(item.status) }}
                </span>
                <span class="card-time">{{ formatTimeToDisplay(item.lastModify) }}</span>
              </div>
              <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
            </div>
            <!-- 更多選項小介面 -->
            <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
              <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
              <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 2：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3：dev server 視覺驗收**

```bash
npm run dev
```

確認：
- 4 欄卡片 grid
- 卡片有縮圖 + 漸層 overlay + 頭像疊排 + 收藏星星
- hover 時切換到長條圖（萊姆綠），並顯示「近一週共 N 次」
- 卡片 footer 有專案名稱（粗體）+ 狀態 badge（Wise 色）+ 時間 + ⋯

- [ ] **Step 4：Commit**

```bash
git add src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat(wise): restructure project card template"
```

---

## Task 6：表格列表 (list view) — SCSS + Template

**Files:**
- Modify: `src/scss/components/_ProjectListContent.scss`
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`

- [ ] **Step 1：加入 table list SCSS**

在 `_ProjectListContent.scss` 的 `.ProjectListContent { }` 內，卡片 SCSS 之後加入：

```scss
  // ── 覆寫全域 table-list-box：Wise 樣式 ─────────
  .table-list-box {
    background: var(--color-wise-card);
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;

    .custom-table {
      th, td {
        border-color: transparent;
        font-size: 13px;
        padding: 12px 16px;
      }

      thead tr {
        background: #f8f9f7;
        border-bottom: 1px solid var(--color-wise-surface);

        th {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-wise-gray);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
      }

      tbody tr {
        border-bottom: 1px solid var(--color-wise-bg);
        cursor: pointer;

        &:last-child { border-bottom: none; }

        td { background: transparent !important; }

        &:hover td { background: #f8f9f7 !important; }

        td:first-child { border-radius: 0 !important; }
        td:last-child  { border-radius: 0 !important; position: relative; }
      }
    }

    .td-thumb {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
      border: none;
      vertical-align: middle;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      border-radius: 20px;
      padding: 3px 10px;

      &.status-active  { background: var(--color-wise-mint);          color: var(--color-wise-dark-green); }
      &.status-review  { background: var(--color-wise-badge-hot-bg);  color: var(--color-wise-badge-hot-text); }
      &.status-done    { background: var(--color-wise-surface);       color: var(--color-wise-warm-dark); }
      &.status-pending { background: #f0f0ef;                         color: var(--color-wise-gray); }
    }

    .favorite-btn {
      color: var(--color-wise-gray);
      background: transparent;
      border-radius: 4px;
      padding: 4px;
      font-size: 18px;
      cursor: pointer;
      vertical-align: middle;

      &.active { color: var(--color-wise-green); }
    }

    .owner-box {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
    }

    .more-btn {
      font-size: 20px;
      color: var(--color-wise-gray);
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--color-wise-bg);
        color: var(--color-wise-black);
      }
    }

    .next-option-box {
      position: absolute;
      right: 14px;
      top: 55px;
      visibility: hidden;
      z-index: 10;

      &.show { visibility: visible; }
    }
  }
```

- [ ] **Step 2：更新 list view template 加入狀態欄與 td-thumb class**

找到（約為原始第 121–165 行）：

```html
      <!-- 表格樣式列表 -->
      <div class="table-list-box project-list mt-2" v-if="projectListMode === 'list' && projectList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>專案名稱</th>
              <th v-if="mode === 'recent'">所屬團隊</th>
              <th width="130">最後編輯時間</th>
              <th width="100"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in displayProjectList" :key="'list' + i"
              @mouseleave="item.showMoreOption = false;"
              @click="gotoAiViewer(item)">
              <td>
                <i :class="['material-symbols-outlined favorite-btn', {
                  'material-fill': i === 0,
                  'active': i === 0
                }]">star</i>

                <div class="img-box">
                  <img :src="item.imgSrc" alt="">
                </div>

                {{ item.name }}
              </td>
              <td v-if="mode === 'recent'">{{ item.team.name }}</td>
              <td class="fc-grey-1">{{ formatTimeToDisplay(item.lastModify) }}</td>
              <td>
                <div class="d-flex">
                  <div class="owner-box" v-tooltip="item.owner.uaerName">
                    {{ item.owner.uaerName.slice(0,1) }}
                  </div>
                  <i class="material-symbols-outlined material-fill more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
                <!-- 更多選項小介面 -->
                <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                  <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
                  <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
```

替換成：

```html
      <!-- 表格樣式列表 -->
      <div class="table-list-box mt-2" v-if="projectListMode === 'list' && projectList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>專案名稱</th>
              <th v-if="mode === 'recent'">所屬團隊</th>
              <th>狀態</th>
              <th width="130">最後編輯時間</th>
              <th width="100"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in displayProjectList" :key="'list' + i"
              @mouseleave="item.showMoreOption = false;"
              @click="gotoAiViewer(item)">
              <td>
                <div class="d-flex flex-align-center" style="gap: 10px">
                  <i :class="['material-symbols-outlined favorite-btn', {
                    'material-fill': i === 0,
                    'active': i === 0
                  }]">star</i>
                  <img :src="item.imgSrc" alt="" class="td-thumb">
                  <span style="font-weight: 600">{{ item.name }}</span>
                </div>
              </td>
              <td v-if="mode === 'recent'">{{ item.team.name }}</td>
              <td>
                <span :class="['status-badge', `status-${item.status}`]">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td style="color: var(--color-wise-gray); font-size: 12px">
                {{ formatTimeToDisplay(item.lastModify) }}
              </td>
              <td>
                <div class="d-flex flex-align-center" style="gap: 8px">
                  <div class="owner-box" v-tooltip="item.owner.uaerName"
                    :style="{ backgroundColor: avatarColor(0) }">
                    {{ item.owner.uaerName.slice(0,1) }}
                  </div>
                  <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
                <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                  <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
                  <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
```

- [ ] **Step 3：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4：Commit**

```bash
git add src/scss/components/_ProjectListContent.scss src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat(wise): Wise table list view SCSS and template"
```

---

## Task 7：Empty State — SCSS + Template

**Files:**
- Modify: `src/scss/components/_ProjectListContent.scss`
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`

- [ ] **Step 1：加入 empty state SCSS**

在 `_ProjectListContent.scss` 的 `.ProjectListContent { }` 內，table SCSS 之後加入：

```scss
  // ── Empty state ──────────────────────────────────
  .empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 40px;
    text-align: center;
    border: 2px dashed #d3d4d0;
    border-radius: 16px;
    cursor: pointer;
    max-width: 360px;
    margin: 40px auto;
    transition: border-color 0.15s, background 0.15s;
    width: auto;

    &:hover {
      border-color: var(--color-wise-green);
      background: rgba($color-wise-green, 0.05);
    }

    .empty-icon {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: var(--color-wise-mint);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;

      i {
        font-size: 24px;
        color: var(--color-wise-dark-green);
      }
    }

    .empty-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-wise-black);
      margin-bottom: 6px;
    }

    .empty-sub {
      font-size: 13px;
      color: var(--color-wise-gray);
    }
  }
```

- [ ] **Step 2：更新 empty state template**

找到：

```html
      <!-- mode 為 team 沒有任何專案時 -->
      <div class="empty-box" v-if="mode === 'team' && !projectList.length" @click="openProjectSettingModal(null, true, teamId as string)">
        <i class="material-symbols-outlined">add</i>
      </div>
      <div class="fs-14 fc-grey-1 mt-1" v-if="mode === 'team' && !projectList.length">建立新專案</div>
```

替換成：

```html
      <!-- mode 為 team 沒有任何專案時 -->
      <div class="empty-box" v-if="mode === 'team' && !projectList.length"
        @click="openProjectSettingModal(null, true, teamId as string)">
        <div class="empty-icon">
          <i class="material-symbols-outlined">add</i>
        </div>
        <div class="empty-title">建立第一個專案</div>
        <div class="empty-sub">點擊此處為這個團隊建立新專案</div>
      </div>
```

- [ ] **Step 3：確認 build 無 error**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4：dev server 視覺完整驗收**

```bash
npm run dev
```

完整驗收清單：
- [ ] 綠色 banner 全寬，顯示「團隊」breadcrumb + 團隊名稱 + 專案數量
- [ ] Toolbar：深綠建立按鈕 + 排序下拉 + 視圖切換，靠右
- [ ] 卡片 grid：4 欄，白底 14px 圓角，輕陰影
- [ ] 卡片圖片：漸層 overlay，頭像疊排在左下，收藏星在右上（active 時萊姆綠）
- [ ] Hover：卡片上浮 4px，顯示萊姆綠長條圖 + 總次數
- [ ] 狀態 badge 配色正確（進行中=淡綠, 審核中=淡黃, 已完成=淡灰, 待開始=灰）
- [ ] List view：無邊框 table，行 hover 淡底，有狀態欄
- [ ] Empty state：圓形淡綠圖示 + 標題 + 副標，hover 邊框變萊姆綠

- [ ] **Step 5：Commit**

```bash
git add src/scss/components/_ProjectListContent.scss src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat(wise): Wise empty state SCSS and template"
```

---

## Task 8：最終驗收

- [ ] **Step 1：TypeScript 型別檢查**

```bash
npm run type-check 2>&1 | tail -20
```

預期：無 error。

- [ ] **Step 2：Lint 檢查**

```bash
npm run lint 2>&1 | tail -20
```

預期：無 error。

- [ ] **Step 3：Production build**

```bash
npm run biz 2>&1 | tail -20
```

預期：成功完成。

- [ ] **Step 4：最終 Commit（如有遺漏的修正）**

```bash
git add -p
git commit -m "fix(wise): final adjustments after verification"
```
