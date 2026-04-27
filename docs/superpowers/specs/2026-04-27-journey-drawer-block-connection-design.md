# Journey Drawer ↔ Block 視覺連動設計

**日期：** 2026-04-27
**問題：** 旅程執行狀態 drawer 懸浮在左側，與畫布上的旅程 iframe 區塊沒有明確視覺關聯，使用者難以快速對應「這個數字 = 那個旅程區塊」。

---

## 設計決策

### 核心互動：Hover → 高亮 + 自動定位

**觸發：** 使用者 hover 旅程 drawer 中的某個旅程區段（行銷旅程 或 生日旅程），停留 0.4 秒（hover intent delay）後觸發。

**效果：**

1. **Drawer 區段高亮**
   - 行銷旅程區段：背景變 `#eff6ff`，邊框 `#3b72f6`
   - 生日旅程區段：背景變 `#f5f3ff`，邊框 `#7c3aed`
   - 區段標題右側出現「定位 ↗」chip（顏色對應旅程類型）

2. **畫布自動 pan**
   - 畫布以動畫方式 pan（easing: easeInOut，約 300ms）至對應旅程 iframe 區塊，使其居中於可視區域
   - 不改變當前 scale（縮放比例不變）

3. **旅程區塊高亮**
   - 對應 iframe 區塊出現彩色光暈：`box-shadow: 0 0 0 3px rgba(accent, 0.25), 0 0 20px rgba(accent, 0.15)`
   - 行銷旅程：accent = `#3b72f6`；生日旅程：accent = `#7c3aed`

4. **非對應區塊淡出**
   - 另一個旅程 iframe 區塊 opacity 降至 0.35
   - 強化視覺焦點，讓使用者明確知道「我在看這個」

**取消：** 滑鼠離開 drawer 區段時，所有效果立即還原（高亮消失、淡出還原）。畫布停留在最後 pan 到的位置，不自動 pan 回原位。

---

## Hover Intent 防抖

使用 `setTimeout + clearTimeout` 實作 0.4s delay：

```
onMouseEnter(type) → clearTimeout(hoverTimer) → hoverTimer = setTimeout(activate, 400)
onMouseLeave()     → clearTimeout(hoverTimer) → deactivate()
```

避免滑鼠快速掃過 drawer 時畫布不斷跳動。

---

## 技術實作要點

### Drawer 區段（AiViewer.vue template）
- 每個 `.jcd-section`（行銷 / 生日）加上 `@mouseenter` / `@mouseleave` handler
- 新增 `activeJourneyHover: 'marketing' | 'birthday' | null` ref
- 「定位 ↗」chip：`v-show="activeJourneyHover === type"`

### 畫布 Pan 邏輯
- 需取得對應旅程 iframe 區塊在畫布座標系的位置（x, y, width, height）
- 計算 pan offset 使其居中：`targetX = -(blockCenterX * scale - viewW / 2)`
- 動畫：以 `requestAnimationFrame` 或 CSS transition 插值 `centerContentX` / `centerContentY`

### 旅程區塊高亮
- 若 iframe 區塊以 HTML 絕對定位疊在 canvas 上：直接加 CSS class
- 若在 Konva stage 內：在對應 Konva node 外圍繪製 highlight rect（stroke + shadow）
- 實作時需確認 iframe 區塊的渲染方式

### 淡出效果
- 對非對應 iframe 區塊的包裝元素加 `opacity: 0.35; transition: opacity 0.2s`

---

## 範圍

此設計**只影響** drawer hover 互動，不改動：
- Drawer 的資料結構或統計邏輯
- 旅程執行流程（startJourneyBatch、journeyStore）
- iframe 內部 HTML
- FAB 折疊/展開行為

---

## 成功標準

- Hover drawer 行銷旅程區段 → 畫布自動移至行銷旅程 iframe，該區塊發藍光，生日旅程淡出
- Hover drawer 生日旅程區段 → 畫布自動移至生日旅程 iframe，該區塊發紫光，行銷旅程淡出
- 快速掃過 drawer 不觸發 pan（0.4s delay 生效）
- 離開 hover 後效果還原，畫布停在當前位置
