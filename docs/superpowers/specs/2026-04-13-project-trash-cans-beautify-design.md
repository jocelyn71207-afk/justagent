# ProjectTrashCans 美化設計文件

**日期**：2026-04-13  
**範圍**：`src/views/ProjectTrashCans.vue`、`src/scss/views/_ProjectTrashCans.scss`

---

## 1. 設計目標

將「專案垃圾桶」頁面由目前的最小樣式升級為有明確視覺語意的 UI：
- 讓使用者一眼辨識哪些專案即將到期（≤3 天）
- 強化「已刪除」狀態感（灰階圖片）
- 改善空狀態與危險操作的視覺回饋

---

## 2. 選定方向

**方向 A：灰階圖片 + 色碼到期標籤**

卡片圖片套灰階濾鏡，角落依剩餘天數顯示紅/黃/灰色標籤，info 提示列升級為帶色彩的警示橫幅，空狀態加入垃圾桶圖示。

---

## 3. 改動清單

### 3.1 圖片灰階 + 半透明

```scss
// _ProjectTrashCans.scss
.ProjectTrashCans {
  .card-list-box .one-card-box.project-card {
    cursor: default;  // 垃圾桶卡片不可點擊進入
    &:hover {
      transform: translateY(-2px) scale(1.005); // 縮小 hover 效果
    }
    .img-box img {
      filter: grayscale(1);
      opacity: 0.55;
      cursor: default;
    }
  }
}
```

### 3.2 到期標籤（Expiry Badge）

在 `.img-box` 內右上角放置絕對定位的 badge，顏色依剩餘天數決定：

| 剩餘天數 | class | 顏色 |
|---|---|---|
| ≤ 3 天 | `expiry-badge--urgent` | 紅色 `#e53935` |
| 4–7 天 | `expiry-badge--warning` | 琥珀 `#f59e0b` |
| > 7 天 | `expiry-badge--normal` | 半透明黑 `rgba(0,0,0,0.38)` |

Vue computed 邏輯：
```ts
function expiryUrgency(dateStr: string): 'urgent' | 'warning' | 'normal' {
  const days = calcRemainingDays(dateStr);
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'normal';
}
```

### 3.3 垃圾桶角標

`.img-box` 左上角加一個半透明黑色圓角方塊，內含 `delete` Material Icon，強化語意。

### 3.4 Info 橫幅升級

將目前的 `d-flex` 行內提示，改為帶黃底邊框的 alert 橫幅：

```html
<div class="trash-info-banner">
  <i class="material-symbols-outlined">warning</i>
  <span>
    專案將依剩餘天數自動永久刪除。
    <strong>紅色</strong>代表 3 天內到期，請盡快還原或確認刪除。
  </span>
</div>
```

```scss
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
}
```

### 3.5 空狀態升級

```html
<div class="trash-empty-state">
  <div class="empty-icon-wrap">
    <i class="material-symbols-outlined">delete</i>
  </div>
  <div class="empty-title">垃圾桶是空的</div>
  <div class="empty-sub">已刪除的專案會顯示在這裡</div>
</div>
```

### 3.6 危險選項紅色

`.next-option-box` 內「永久刪除」的 `.option-item` 加 `danger` class，顯示紅色文字，hover 時紅色背景。

---

## 4. 不改動的部分

- Vue 邏輯（`restoreProject`、`permanentlyDelete`、`getTrashList`）不變
- `compDropDown` 篩選器不變
- `popDialog.confirm` 不變
- 路由與 props 不變

---

## 5. 檔案異動範圍

| 檔案 | 異動類型 |
|---|---|
| `src/views/ProjectTrashCans.vue` | template 新增 badge / 角標 / 橫幅 / 空狀態標記；script 新增 `expiryUrgency()` |
| `src/scss/views/_ProjectTrashCans.scss` | 新增所有樣式規則 |
