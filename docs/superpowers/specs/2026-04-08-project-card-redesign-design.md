# 專案卡片重設計 — Design Spec

Date: 2026-04-08

## 需求摘要

對 `ProjectListContent.vue` 中的卡片模式（card view）進行以下四項改動：

1. 顯示協作人數
2. 顯示專案狀態（待啟動 / 進行中 / 待驗收 / 已完成）
3. 整張卡片可點擊（原本只有圖片）
4. 滑鼠停留時，圖片區切換為近一週使用次數長條圖；footer 下方文字同步換成「近一週 N 次」

---

## 資料模型

現有 mock 資料（`getProjectList()`）新增三個欄位，後端銜接時也須提供：

```ts
interface Project {
  // 既有欄位
  showMoreOption: boolean       // 前端 UI 控制，後端不提供，前端自行初始化 false
  id: string
  name: string
  agents: string[]
  imgSrc: string
  owner: { userId: string; uaerName: string }
  team: { id: string; name: string }
  company: { id: string; name: string }
  lastModify: string

  // 新增欄位
  isHovered: boolean            // 前端 UI 控制，後端不提供，前端自行初始化 false
  status: 'pending' | 'active' | 'review' | 'done'
  collaborators: { userId: string; name: string }[]
  weeklyUsage: number[]         // 長度 7，index 0 = 6天前，index 6 = 今天
}
```

狀態對應中文標籤：

| value     | 中文   |
|-----------|--------|
| `pending` | 待啟動 |
| `active`  | 進行中 |
| `review`  | 待驗收 |
| `done`    | 已完成 |

---

## 元件變更：`ProjectListContent.vue`

### 卡片根節點

- 加上 `@click="gotoAiViewer(item)"` — 整張卡片可點擊
- 加上 `@mouseenter="item.isHovered = true"` / `@mouseleave="item.isHovered = false; item.showMoreOption = false"`
- 原本只有 `@mouseleave="item.showMoreOption = false"` → 合併進上方

### 圖片 / 圖表切換區

```html
<!-- 圖片（預設） -->
<div class="img-box" v-show="!item.isHovered">
  <img :src="item.imgSrc" alt="">
  <!-- 協作人數疊層（左下） -->
  <div class="img-collab">
    <div class="avatar-group">
      <div class="avatar-sm" v-for="(c, ci) in item.collaborators.slice(0, 3)" ...>
        {{ c.name.slice(0, 1) }}
      </div>
    </div>
    <span class="collab-count">{{ item.collaborators.length }} 人</span>
  </div>
</div>

<!-- 長條圖（hover） -->
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
```

`barHeight(count, arr)` — 將 count 對 max(arr) 比例換算為 0–80px 高度。  
`weekLabel(index)` — index 0–5 回傳「N天前」，index 6 回傳「今天」。

### footer 變更

```html
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
        近一週共 {{ item.weeklyUsage.reduce((a, b) => a + b, 0) }} 次
      </template>
    </div>
  </div>
  <!-- owner-box 與 more-btn 保留，more-btn 加 @click.stop -->
</div>
```

`statusLabel(status)` — 回傳中文對照字串。

---

## SCSS 變更：`src/scss/_layout.scss`

在 `.one-card-box.project-card` 下新增 / 修改：

```scss
cursor: pointer;  // 整張卡片 pointer

.img-box {
  position: relative;  // 為 img-collab 提供定位基準
  transition: opacity 0.2s;

  > img {
    cursor: default;  // 移除原本只有圖片的 cursor: pointer
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
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 2px solid var(--color-background);
      font-size: 9px; font-weight: 700;
      color: $white;
      display: flex; align-items: center; justify-content: center;
      margin-left: -6px;
      &:first-child { margin-left: 0; }
    }
    .collab-count {
      font-size: 11px; font-weight: 600; color: $white;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 10px;
      padding: 2px 7px;
    }
  }
}

.chart-box {
  height: 205px;  // 同 .img-box 高度
  background: var(--color-background-1);
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 8px;
  transition: opacity 0.2s;

  .chart-title {
    font-size: 11px; font-weight: 700;
    color: var(--color-text-alpha50);
    margin-bottom: 8px;
  }
  .chart-bars {
    display: flex;
    align-items: flex-end;
    flex: 1;
    gap: 8px;
  }
  .bar-wrap {
    display: flex; flex-direction: column;
    align-items: center; gap: 3px; flex: 1;
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

.status-row {
  margin: 4px 0;
}
.status-badge {
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 11px; font-weight: 600;

  &.status-pending { background: var(--color-background-2); color: var(--color-text-alpha50); }
  &.status-active  { background: rgba(74, 222, 128, 0.15);  color: #16a34a; }
  &.status-review  { background: rgba(251, 191, 36, 0.15);  color: #ca8a04; }
  &.status-done    { background: rgba(139, 92, 246, 0.15);  color: #7c3aed; }
}
```

---

## Mock 資料更新

每筆 project 補上：

```ts
isHovered: false,
status: 'active',  // 依各項目自訂
collaborators: [
  { userId: 'user1', name: 'Lucas' },
  { userId: 'user2', name: '滷卡酥' },
],
weeklyUsage: [12, 8, 20, 15, 5, 3, 18],
```

---

## 不在此次範圍內

- 表格（list）模式不做任何變動
- 協作人數不超過 3 位時全顯示；超過 3 位只顯示前 3 位頭像（計數仍顯示實際人數）
- 狀態的 CRUD（新增/修改狀態）不在此次範圍，只做顯示
