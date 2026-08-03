# conv3～conv6 靜態報告視覺豐富化 — 設計文件

**日期：** 2026-08-03
**狀態：** 已核准，待轉換為實作計畫
**涉及模組：** `public/*.html`（7 份既有靜態報告檔案，純 HTML/CSS，不涉及任何 Vue 元件或 Pinia store）

---

## 背景與目標

conv3～conv6 目前共產出 7 份靜態洞察報告 HTML（透過 `addReportBlock` 載入畫布 iframe 呈現），全部沿用同一套 CSS 變數命名（`--bg`/`--surface`/`--border`/`--blue`/`--green`/`--orange`/`--purple` 等）與相同結構（header + `stat-row`/`stat-card` + 表格/chip 清單），但視覺上很平淡：無圖表、無 icon、無漸層/陰影，純表格與純文字數字。使用者要求讓這 7 份報告視覺上更豐富。

透過視覺companion 比較 3 個方向（A 繽紛漸層、B 編輯感分析報告、C 深色數據主控台）後，確定採用 **B：編輯感分析報告**——延續現有白底、克制配色的既有調性，用左側色條、細線圖表、badge 做「精緻」而非「花俏」的豐富化；icon 採用細線 inline SVG（而非 emoji 或無 icon）。

決定套用**同一套共用視覺系統**到全部 7 份檔案（而非每份各自設計風格），確保一致性、且未來新報告也能沿用同一套規範。

這是純前端靜態資源的視覺升級，**不改動任何 `.vue` 元件、Pinia store、或 `addReportBlock`/`htmlFileViewBox` 的載入方式**——每份報告依然是自包式的單一 HTML 檔（inline `<style>`，無外部 CDN／JS 圖表庫依賴），只是把純文字/純表格資料改用圖表化元件呈現。

---

## 共用視覺系統（貼到每份檔案自己的 `<style>` 內，不建外部共用 CSS 檔）

每份檔案在自己既有的 `:root` 變數基礎上新增（若已存在同名變數則沿用既有值，不覆蓋）：

```css
--shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

### 1. Stat card 升級

既有 `.stat-card` 加上：左側 3px 實色色條（依語意上色：主要指標/營收類 → `var(--blue)`；正向成長/完成度 → `var(--green)`；風險/警示/待處理 → `var(--orange)` 或既有的 `--red`）、`box-shadow: var(--shadow)`、卡片內新增一行 icon + label（原本的 `stat-lbl` 上方）：

```css
.stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
.stat-card.accent-green { border-left-color: var(--green); }
.stat-card.accent-orange { border-left-color: var(--orange); }
.stat-card.accent-red { border-left-color: var(--red, #dc2626); }
.stat-top { display: flex; align-items: center; gap: 6px; }
.stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
```

每個 stat card 依內容語意搭一個細線 SVG icon（`viewBox="0 0 24 24" fill="none" stroke-width="2"`，顏色跟色條同色），從下方共用圖示庫挑選：

- 金額/營收 → 錢幣/鈔票造型
- 成長率/趨勢 → 折線向上箭頭
- 回購/循環類 → 循環箭頭
- 數量/件數/SKU 類 → 箱子/清單造型
- 完成率/百分比 → 打勾圓圈
- 風險/警示類 → 三角驚嘆號
- 維度/分類類 → 標籤/tag 造型

（沒有強制一一對應，各檔案依自己的 4 張 stat card 語意挑選即可，只要同一份檔案內 4 個 icon 不重複。）

### 2. Badge / chip 元件（取代純文字的成長率、狀態字樣）

```css
.badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge-up { background: var(--green-light, rgba(22,163,74,.1)); color: var(--green); }
.badge-down { background: var(--red-light, rgba(220,38,38,.1)); color: var(--red, #dc2626); }
.badge-neutral { background: var(--surface2); color: var(--text-2); border: 1px solid var(--border); }
```

`.badge-up`/`.badge-down` 內文包含 ▲/▼ 符號（例如 `<span class="badge badge-up">▲ 18%</span>`）。若檔案原本沒有 `--green-light`/`--red-light` 變數，於 `:root` 補上（不改動既有同名變數的值）。

### 3. Mini bar chart（水平長條，取代排名類純表格/純 chip 資料）

```css
.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.bar-row .bar-name { width: 88px; flex-shrink: 0; color: var(--text-2); }
.bar-row .bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
.bar-row .bar-fill { height: 100%; border-radius: 4px; background: var(--blue); }
.bar-row .bar-val { width: 56px; text-align: right; font-weight: 700; flex-shrink: 0; }
.bar-row.is-top .bar-fill { background: var(--green); }
.bar-row.is-top .bar-name { color: var(--green); font-weight: 700; }
```

`bar-fill` 的 `width` 百分比 = 該項數值 ÷ 該組資料最大值 × 100%（純手算 inline style，不需 JS）。数值最大的一列加 `is-top` class 呼應「重點」。

### 4. Donut chart（inline SVG，取代單一百分比數字這種其實是佔比/組成的資料）

用 `stroke-dasharray`/`stroke-dashoffset` 畫圓弧，2 段式組成範例（可依資料段數擴充）：

```html
<svg viewBox="0 0 100 100" width="88" height="88">
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface2)" stroke-width="14" />
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" stroke-width="14"
    stroke-dasharray="{percent*2.51} 251" stroke-dashoffset="0" transform="rotate(-90 50 50)" />
  <text x="50" y="54" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text)">{percent}%</text>
</svg>
```
（`2.51 ≈ 2πr/100`，`r=40`。數值由實作時依各檔案實際資料手算好再寫死成 SVG 屬性，不需要 JS 計算。）搭配旁邊的圖例（色塊 + 標籤 + 數值）。

---

## 逐檔案異動範圍

| 對話 | 檔案 | 現況 | 新增/改為 |
|------|------|------|-----------|
| conv3 | `public/teva_feature_tagging_report.html`、`public/teva_feature_tagging_report-1.html` | 4 張純文字 stat card；「維度分佈」是純文字 tag-chip（顏色12種/款式11種/材質10種組合/尺碼區間8種/風格7種）；貼標結果純表格 | stat card 加色條+icon+陰影；「維度分佈」改成 bar chart（5 個維度的種類數量排名，取代或並列於現有 tag-chip）；表格不變（純特徵資料，非數值排名，不需圖表化） |
| conv4 | `public/sanuo_2026_06_sales_report.html` | 4 張純文字 stat card；純表格列出品名/品牌/類別/銷售數量/銷售金額/較上月成長 | stat card 加色條+icon+陰影；表格「較上月成長」欄位文字改成 `.badge-up`/`.badge-down`；表格上方新增「熱銷品項 Top 5」bar chart（依銷售金額排名，資料取表格既有前 5 高的列，不新增假資料） |
| conv5 | `public/teva_inventory_snapshot.html` | 無 stat-row；純表格列出 SKU/品名/庫存量/狀態 chip | 表格「庫存量」欄位旁加水平 bar（bar 長度 = 庫存量 ÷ 表中最大庫存量；低庫存列的 bar 用 orange，呼應既有 `status-low`） |
| conv5 | `public/teva_seasonal_promotion_strategy.html`、`public/teva_seasonal_promotion_strategy-1.html` | 4 張純文字 stat card；`trend-list`／`strategy-card`／`tactic-list` 純文字清單；風險評估純表格 | stat card 加色條+icon+陰影；`tactic-list` 每項戰術加優先度 `.badge`（高/中/低，依內容語意判斷，取代或並列於現有純文字）；風險評估表格的風險等級欄位改 `.badge`（沿用 `.badge-up`/`-down`/`-neutral` 語意，紅=高風險/綠=低風險）；`-1.html` 額外把 `revision-list` 每項改動加「已修正」`.badge-neutral` |
| conv6 | `public/teva_channel_sales_report.html` | 4 張純文字 stat card；通路明細純表格；洞察建議純文字清單 | stat card 加色條+icon+陰影；通路明細表格上方新增 bar chart（5 個通路銷售額排名，資料需與 `AiViewerRightBox.vue` 的 `conv6RunAnalysis` 圖表數字、`knowledgeStore.ts` 的 `k13` chunk 內容口徑一致，沿用既有數字，不新增/更改任何數值）；「會員回購率 68%」改為 donut chart（68% 回購／32% 新會員兩段） |

原則：**只把既有資料換一種呈現方式，不新增、不竄改任何數字或文案內容**（sales/inventory/tagging 的底層數字必須與現況完全一致，尤其 conv6 要跟畫布圖表與知識庫 chunk 保持口徑一致）。

---

## 不在此次範圍內

- conv6 的「會員輪廓與行為洞察報告」「行銷策略建議報告」目前是純文字佔位訊息、沒有實際 HTML 檔案——不在此次範圍內（沒有檔案可以豐富化）。
- 不建立共用外部 CSS/圖示檔——每份報告維持自包式單一 HTML（避免跨檔案相對路徑相依、避免破壞現有「一個檔案可獨立搬移/預覽」的慣例）。
- 不接 Chart.js、CDN 字型、或任何外部資源——所有圖表都是 inline SVG／CSS，數值手算後寫死成屬性。
- 不修改 `AiViewerRightBox.vue`、`AiViewerStore.ts`、`knowledgeStore.ts` 或任何 `.vue`／`.ts` 檔案；不修改這些報告被載入畫布的方式。
- 不因為新增 icon/badge/chart 而調整既有版面的資訊架構（章節順序、標題文字維持原樣，只在既有區塊內新增/替換視覺元件）。

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `public/teva_feature_tagging_report.html` | 修改 |
| `public/teva_feature_tagging_report-1.html` | 修改 |
| `public/sanuo_2026_06_sales_report.html` | 修改 |
| `public/teva_inventory_snapshot.html` | 修改 |
| `public/teva_seasonal_promotion_strategy.html` | 修改 |
| `public/teva_seasonal_promotion_strategy-1.html` | 修改 |
| `public/teva_channel_sales_report.html` | 修改 |
