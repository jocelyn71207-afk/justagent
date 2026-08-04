# conv3~conv6 靜態報告視覺豐富化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a shared "editorial analyst" visual-enrichment system (accented stat cards with line-icons, badges, inline-SVG bar charts, inline-SVG donut charts) to all 7 existing self-contained static report HTML files produced by conv3/conv4/conv5/conv6, without changing any underlying data/copy or any Vue/TS source file.

**Architecture:** Each of the 7 files is an independent, self-contained static HTML document (own inline `<style>`, no external CSS/JS/CDN). This plan touches only `public/*.html` files — no `.vue`/`.ts` changes anywhere. Every task pastes the same small shared CSS block (icon-sizing, badge, bar-chart, donut helpers) into that file's own `<style>`, plus file-specific accent/icon/chart markup computed from that file's own existing data. All chart values (bar widths, donut arc lengths) are pre-computed decimal numbers baked directly into `style="width:...%"` / `stroke-dasharray="..."` attributes — no JavaScript, no build step.

**Tech Stack:** Plain HTML + inline CSS + inline SVG. No frameworks, no dependencies.

## Global Constraints

- 不修改任何 `.vue`、`.ts`、Pinia store 檔案；只修改 `public/*.html`。
- 不接任何外部 CDN／字型／圖表庫／圖片；一切圖表都是 inline SVG，數值全部手算後寫死成屬性。
- 不新增、不竄改任何現有數字或文案內容——只把既有資料換一種呈現方式（新增視覺元件是「並列補充」，不是「取代刪除」，除非明確寫成 badge 這種同義呈現轉換）。
- 每份檔案維持自包式（own `<style>`），不建共用外部 CSS 檔。
- 這是純靜態 HTML 視覺改動，沒有自動化測試可跑；每個任務的驗證方式是「直接用瀏覽器開啟該 `.html` 檔案，目視確認」（`open public/<file>.html` 或直接把檔案路徑貼到瀏覽器網址列）。
- 規格文件：`docs/superpowers/specs/2026-08-03-report-visual-enrichment-design.md`（已核准）。

---

## 共用元件參考（每個任務都會用到，複製貼上到該檔案自己的 `<style>` 內）

**Shadow 變數**（貼到 `:root` 內，若已存在同名變數則不重複新增）：
```css
--shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

**Stat card 升級**（貼到 `<style>` 內，`.stat-card` 選擇器若檔案已有自己的定義，這些是新增規則，不是取代）：
```css
.stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
.stat-card.accent-green { border-left-color: var(--green); }
.stat-card.accent-purple { border-left-color: var(--purple); }
.stat-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
```

**Badge 元件：**
```css
.badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge-up { background: var(--green-light); color: var(--green); }
.badge-down { background: var(--red-light); color: var(--red); }
```

**Mini bar chart 元件：**
```css
.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.bar-row .bar-name { width: 92px; flex-shrink: 0; color: var(--text-2); }
.bar-row .bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
.bar-row .bar-fill { height: 100%; border-radius: 4px; background: var(--blue); }
.bar-row .bar-val { width: 56px; text-align: right; font-weight: 700; flex-shrink: 0; }
.bar-row.is-top .bar-fill { background: var(--green); }
.bar-row.is-top .bar-name { color: var(--green); font-weight: 700; }
```

**細線 SVG icon 庫**（每個都是 `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-icon"`，用在 `.stat-top` 內，顏色透過外層文字色 `color` 屬性繼承給 `currentColor` —— 所以要在 `.stat-top` 或其父層設 `color: var(--blue)` / `var(--green)` / `var(--purple)`，或直接在每個 `<svg>` 上加 `style="color:var(--blue)"`）：

```html
<!-- icon-document（來源文件/訂單） -->
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>

<!-- icon-box（數量/件數/SKU/庫存） -->
<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>

<!-- icon-tag（分類/維度/主打商品） -->
<path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.58 3.24H4a2 2 0 0 0-2 2v5.58a2 2 0 0 0 .59 1.42l9.58 9.58a2 2 0 0 0 2.82 0l6.18-6.18a2 2 0 0 0 0-2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>

<!-- icon-check-circle（完成率） -->
<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>

<!-- icon-trend-up（成長率） -->
<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>

<!-- icon-money（金額/營收） -->
<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>

<!-- icon-repeat（回購率） -->
<path d="M17 2l4 4-4 4"/><path d="M3 12v-2a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/>

<!-- icon-calendar（檔期） -->
<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>

<!-- icon-pie（預算配置） -->
<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
```

**Donut chart 範本**（composition 資料，例如兩三段式佔比；`r=40` 的圓周長 ≈ 251.3，`stroke-dasharray` 第一個數字 = 該段百分比 ÷ 100 × 251.3，實作時依各任務指定數值代入）：
```html
<svg viewBox="0 0 100 100" width="72" height="72" style="flex-shrink:0">
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface2)" stroke-width="14"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="14"
    stroke-dasharray="171 251" stroke-linecap="round" transform="rotate(-90 50 50)"/>
  <text x="50" y="55" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">68%</text>
</svg>
```

---

### Task 1: conv3 特徵貼標報告（2 個檔案：`teva_feature_tagging_report.html`、`teva_feature_tagging_report-1.html`）

**Files:**
- Modify: `public/teva_feature_tagging_report.html`
- Modify: `public/teva_feature_tagging_report-1.html`

**Interfaces:** 無（純靜態 HTML，無跨檔案依賴）。

兩個檔案結構幾乎相同（`-1.html` 是修正版，多了 `.revision-note`/`.fixed-badge`），下面步驟兩個檔案都要做，差異處會特別標註。

- [ ] **Step 1：兩個檔案的 `:root` 都加入 `--shadow`**

在兩個檔案的 `:root { ... }` 區塊內（例如 `teva_feature_tagging_report.html` 第 9-22 行），於最後一個變數（`--purple: #7c3aed;`）之後加一行：
```css
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

- [ ] **Step 2：兩個檔案的 `<style>` 都加入 Stat card / icon / bar-chart 共用 CSS**

在 `.stat-lbl { ... }` 規則之後（兩個檔案都有這行）插入：
```css
  .stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
  .stat-card.accent-purple { border-left-color: var(--purple); }
  .stat-card.accent-green { border-left-color: var(--green); }
  .stat-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
  .bar-chart { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .bar-row .bar-name { width: 92px; flex-shrink: 0; color: var(--text-2); }
  .bar-row .bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
  .bar-row .bar-fill { height: 100%; border-radius: 4px; background: var(--blue); }
  .bar-row .bar-val { width: 48px; text-align: right; font-weight: 700; flex-shrink: 0; }
  .bar-row.is-top .bar-fill { background: var(--purple); }
  .bar-row.is-top .bar-name { color: var(--purple); font-weight: 700; }
```
（這裡把 `is-top` 的強調色設成 `--purple` 而非共用預設的 `--green`，因為這份報告的品牌強調色是紫色 `dim-color`／`dim-theme` 呼應的貼標語意，維持檔案內既有配色慣例。）

- [ ] **Step 3：4 張 stat card 加 icon + accent class（兩個檔案都做，內容完全相同——因為這 4 個數字在兩版之間沒有變動）**

把現有：
```html
  <div class="stat-row">
    <div class="stat-card"><div class="stat-val">4</div><div class="stat-lbl">來源文件</div></div>
    <div class="stat-card"><div class="stat-val">12</div><div class="stat-lbl">識別 SKU</div></div>
    <div class="stat-card"><div class="stat-val">5</div><div class="stat-lbl">貼標維度</div></div>
    <div class="stat-card"><div class="stat-val">100%</div><div class="stat-lbl">完成率</div></div>
  </div>
```
改成：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><div class="stat-lbl">來源文件</div></div>
      <div class="stat-val">4</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg><div class="stat-lbl">識別 SKU</div></div>
      <div class="stat-val">12</div>
    </div>
    <div class="stat-card accent-purple">
      <div class="stat-top" style="color:var(--purple)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.58 3.24H4a2 2 0 0 0-2 2v5.58a2 2 0 0 0 .59 1.42l9.58 9.58a2 2 0 0 0 2.82 0l6.18-6.18a2 2 0 0 0 0-2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg><div class="stat-lbl">貼標維度</div></div>
      <div class="stat-val">5</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-top" style="color:var(--green)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><div class="stat-lbl">完成率</div></div>
      <div class="stat-val">100%</div>
    </div>
  </div>
```
（原本 `.stat-val` 在 `.stat-lbl` 之前，這裡調整為 icon+lbl 一行在上、數值在下——`.stat-val`/`.stat-lbl` 的 CSS 規則本身不用改，只是 HTML 排列順序變了，视觉上數值仍在卡片主要位置。）

- [ ] **Step 4：在「維度分佈」tag-summary 之後新增 bar chart**

在 `teva_feature_tagging_report.html` 裡，找到：
```html
  <div class="section-title">維度分佈</div>
  <div class="tag-summary">
    <span class="tag-chip">顏色：12 種</span>
    <span class="tag-chip">款式：11 種</span>
    <span class="tag-chip">材質：10 種組合</span>
    <span class="tag-chip">尺碼區間：8 種</span>
    <span class="tag-chip">風格：7 種</span>
  </div>
```
在這個 `</div>`（tag-summary 結束）之後新增：
```html
  <div class="bar-chart">
    <div class="bar-row is-top"><span class="bar-name">顏色</span><div class="bar-track"><div class="bar-fill" style="width:100%"></div></div><span class="bar-val">12 種</span></div>
    <div class="bar-row"><span class="bar-name">款式</span><div class="bar-track"><div class="bar-fill" style="width:92%"></div></div><span class="bar-val">11 種</span></div>
    <div class="bar-row"><span class="bar-name">材質</span><div class="bar-track"><div class="bar-fill" style="width:83%"></div></div><span class="bar-val">10 種</span></div>
    <div class="bar-row"><span class="bar-name">尺碼區間</span><div class="bar-track"><div class="bar-fill" style="width:67%"></div></div><span class="bar-val">8 種</span></div>
    <div class="bar-row"><span class="bar-name">風格</span><div class="bar-track"><div class="bar-fill" style="width:58%"></div></div><span class="bar-val">7 種</span></div>
  </div>
```

在 `teva_feature_tagging_report-1.html` 裡，這份檔案的「材質」已修正為 11 種組合（不是 10 種），所以百分比不同（12 為最大值，11/12=92%）。找到：
```html
  <div class="section-title">維度分佈</div>
  <div class="tag-summary">
    <span class="tag-chip">顏色：12 種</span>
    <span class="tag-chip">款式：11 種</span>
    <span class="tag-chip">材質：11 種組合</span>
    <span class="tag-chip">尺碼區間：8 種</span>
    <span class="tag-chip">風格：7 種</span>
  </div>
```
之後新增：
```html
  <div class="bar-chart">
    <div class="bar-row is-top"><span class="bar-name">顏色</span><div class="bar-track"><div class="bar-fill" style="width:100%"></div></div><span class="bar-val">12 種</span></div>
    <div class="bar-row"><span class="bar-name">款式</span><div class="bar-track"><div class="bar-fill" style="width:92%"></div></div><span class="bar-val">11 種</span></div>
    <div class="bar-row"><span class="bar-name">材質</span><div class="bar-track"><div class="bar-fill" style="width:92%"></div></div><span class="bar-val">11 種</span></div>
    <div class="bar-row"><span class="bar-name">尺碼區間</span><div class="bar-track"><div class="bar-fill" style="width:67%"></div></div><span class="bar-val">8 種</span></div>
    <div class="bar-row"><span class="bar-name">風格</span><div class="bar-track"><div class="bar-fill" style="width:58%"></div></div><span class="bar-val">7 種</span></div>
  </div>
```

- [ ] **Step 5：瀏覽器目視驗證**

用瀏覽器分別開啟 `public/teva_feature_tagging_report.html` 與 `public/teva_feature_tagging_report-1.html`（可直接用檔案路徑 `file:///...` 開啟，這是自包式靜態檔案，不需要跑 `npm run dev`）。確認：4 張 stat card 都有左側色條、icon、陰影；「維度分佈」區塊下方出現 5 條長度不同的長條圖，「顏色」那條最長且是紫色；`-1.html` 版本的「材質」bar 長度應該跟「款式」一樣長（都是 92%），跟基本版（材質只有 83%）不同。`-1.html` 既有的 `.revision-note`／`.fixed-badge`／`row-fixed` 綠色系內容應該完全沒變。

- [ ] **Step 6：Commit**

```bash
git add public/teva_feature_tagging_report.html public/teva_feature_tagging_report-1.html
git commit -m "feat(reports): add stat-card icons and dimension bar chart to conv3 tagging reports"
```

---

### Task 2: conv4 銷售報告（`sanuo_2026_06_sales_report.html`）

**Files:**
- Modify: `public/sanuo_2026_06_sales_report.html`

**Interfaces:** 無。

- [ ] **Step 1：`:root` 加入 `--green-light`、`--red`、`--red-light`、`--shadow`**

現有 `:root` 區塊（第 9-20 行）只有 `--blue`/`--blue-light`/`--green`，把它改成：
```css
  :root {
    --bg: #f7f8fa;
    --surface: #ffffff;
    --surface2: #f1f3f7;
    --border: #e4e7ed;
    --text: #1a1d23;
    --text-2: #5c6370;
    --text-3: #9ca3af;
    --blue: #3b72f6;
    --blue-light: rgba(59,114,246,0.08);
    --green: #16a34a;
    --green-light: rgba(22,163,74,0.08);
    --red: #dc2626;
    --red-light: rgba(220,38,38,0.08);
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
  }
```

- [ ] **Step 2：加入 stat-card / icon / badge / bar-chart 共用 CSS**

在既有 `.stat-val.up { color: var(--green); }` 這行之後插入：
```css
  .stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
  .stat-card.accent-green { border-left-color: var(--green); }
  .stat-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .badge-up { background: var(--green-light); color: var(--green); }
  .badge-down { background: var(--red-light); color: var(--red); }
  .bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .bar-row .bar-name { width: 150px; flex-shrink: 0; color: var(--text-2); }
  .bar-row .bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
  .bar-row .bar-fill { height: 100%; border-radius: 4px; background: var(--blue); }
  .bar-row .bar-val { width: 90px; text-align: right; font-weight: 700; flex-shrink: 0; }
  .bar-row.is-top .bar-fill { background: var(--green); }
  .bar-row.is-top .bar-name { color: var(--green); font-weight: 700; }
```

- [ ] **Step 3：4 張 stat card 加 icon + accent**

把：
```html
  <div class="stat-row">
    <div class="stat-card"><div class="stat-val">NT$19,650,000</div><div class="stat-lbl">總營業額</div></div>
    <div class="stat-card"><div class="stat-val up">+6.1%</div><div class="stat-lbl">較上月成長</div></div>
    <div class="stat-card"><div class="stat-val">10</div><div class="stat-lbl">熱銷品項數</div></div>
    <div class="stat-card"><div class="stat-val">3,420</div><div class="stat-lbl">訂單數</div></div>
  </div>
```
改成：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><div class="stat-lbl">總營業額</div></div>
      <div class="stat-val">NT$19,650,000</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-top" style="color:var(--green)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg><div class="stat-lbl">較上月成長</div></div>
      <div class="stat-val up">+6.1%</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg><div class="stat-lbl">熱銷品項數</div></div>
      <div class="stat-val">10</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><div class="stat-lbl">訂單數</div></div>
      <div class="stat-val">3,420</div>
    </div>
  </div>
```

- [ ] **Step 4：在「品類佔比」之後、「產品銷售明細」表格之前新增「熱銷品項 Top 5」bar chart**

在現有：
```html
  <div class="section-title">品類佔比</div>
  <div class="tag-summary">
    <span class="tag-chip">涼鞋 30%</span>
    <span class="tag-chip">機能健走鞋 26%</span>
    <span class="tag-chip">靴類 25%</span>
    <span class="tag-chip">生活配件 12%</span>
    <span class="tag-chip">拖鞋 7%</span>
  </div>

  <div class="section-title">產品銷售明細</div>
```
兩者之間插入（資料取自表格既有前 5 高銷售金額的品項，數字與表格完全一致，最大值為 NT$3,720,000）：
```html
  <div class="section-title">熱銷品項 Top 5（依銷售金額）</div>
  <div class="bar-chart">
    <div class="bar-row is-top"><span class="bar-name">UGG Classic Mini II 雪靴</span><div class="bar-track"><div class="bar-fill" style="width:100%"></div></div><span class="bar-val">NT$372萬</span></div>
    <div class="bar-row"><span class="bar-name">Hurricane Trailsetter 健走鞋</span><div class="bar-track"><div class="bar-fill" style="width:90%"></div></div><span class="bar-val">NT$335萬</span></div>
    <div class="bar-row"><span class="bar-name">TEVA Hurricane XLT2 涼鞋</span><div class="bar-track"><div class="bar-fill" style="width:75%"></div></div><span class="bar-val">NT$280萬</span></div>
    <div class="bar-row"><span class="bar-name">TEVA Original Universal</span><div class="bar-track"><div class="bar-fill" style="width:53%"></div></div><span class="bar-val">NT$199萬</span></div>
    <div class="bar-row"><span class="bar-name">Hurricane Verge 水陸機能鞋</span><div class="bar-track"><div class="bar-fill" style="width:45%"></div></div><span class="bar-val">NT$167萬</span></div>
  </div>
```

- [ ] **Step 5：表格「較上月成長」欄位改成 badge**

把表格 `tbody` 內全部 10 行的 `<td class="growth-up">+X%</td>` 改成 `<td><span class="badge badge-up">▲ +X%</span></td>`，`<td class="growth-down">-X%</td>` 改成 `<td><span class="badge badge-down">▼ -X%</span></td>`。逐行對照（保留原本的百分比數字，只改標籤樣式）：

```html
      <tr><td class="name-cell">UGG Classic Mini II 雪靴</td><td>UGG</td><td>靴類</td><td>1,240 雙</td><td>NT$3,720,000</td><td><span class="badge badge-up">▲ +4.2%</span></td></tr>
      <tr><td class="name-cell">Hurricane Trailsetter 健走鞋</td><td>Hurricane Trailsetter</td><td>機能健走鞋</td><td>1,860 雙</td><td>NT$3,348,000</td><td><span class="badge badge-up">▲ +7.1%</span></td></tr>
      <tr><td class="name-cell">TEVA Hurricane XLT2 涼鞋</td><td>TEVA</td><td>涼鞋</td><td>2,150 雙</td><td>NT$2,795,000</td><td><span class="badge badge-up">▲ +9.6%</span></td></tr>
      <tr><td class="name-cell">TEVA Original Universal</td><td>TEVA</td><td>涼鞋</td><td>1,530 雙</td><td>NT$1,988,000</td><td><span class="badge badge-up">▲ +5.8%</span></td></tr>
      <tr><td class="name-cell">Hurricane Verge 水陸機能鞋</td><td>Hurricane Trailsetter</td><td>機能健走鞋</td><td>760 雙</td><td>NT$1,672,000</td><td><span class="badge badge-up">▲ +11.4%</span></td></tr>
      <tr><td class="name-cell">UGG Tasman 拖鞋</td><td>UGG</td><td>拖鞋</td><td>980 雙</td><td>NT$1,470,000</td><td><span class="badge badge-up">▲ +2.3%</span></td></tr>
      <tr><td class="name-cell">UGG Neumel 短靴</td><td>UGG</td><td>靴類</td><td>690 雙</td><td>NT$1,242,000</td><td><span class="badge badge-down">▼ -1.8%</span></td></tr>
      <tr><td class="name-cell">瑜珈墊（環保材質）</td><td>自有品牌</td><td>生活配件</td><td>1,120 件</td><td>NT$1,344,000</td><td><span class="badge badge-up">▲ +6.9%</span></td></tr>
      <tr><td class="name-cell">TEVA ReEmber 保暖涼鞋</td><td>TEVA</td><td>涼鞋</td><td>540 雙</td><td>NT$1,021,000</td><td><span class="badge badge-up">▲ +8.0%</span></td></tr>
      <tr><td class="name-cell">機能運動襪 3 入組</td><td>自有品牌</td><td>生活配件</td><td>4,200 組</td><td>NT$1,050,000</td><td><span class="badge badge-up">▲ +3.5%</span></td></tr>
```
（`.growth-up`/`.growth-down` CSS 規則可以留著不用刪，不影響任何東西；若想順手清理也可以移除這兩行 CSS，兩者皆可。）

- [ ] **Step 6：瀏覽器目視驗證**

開啟 `public/sanuo_2026_06_sales_report.html`。確認：4 張 stat card 有色條/icon/陰影；「品類佔比」與「產品銷售明細」表格之間出現 5 條「熱銷品項 Top 5」長條圖，最長一條（UGG Classic Mini II）是綠色；表格「較上月成長」欄位全部變成圓角 badge（綠色▲或紅色▼），數字跟改之前完全一致。

- [ ] **Step 7：Commit**

```bash
git add public/sanuo_2026_06_sales_report.html
git commit -m "feat(reports): add stat-card icons, top-5 bar chart and growth badges to conv4 sales report"
```

---

### Task 3: conv5 庫存快照（`teva_inventory_snapshot.html`）

**Files:**
- Modify: `public/teva_inventory_snapshot.html`

**Interfaces:** 無。這份檔案沒有 `stat-row`，只有表格，所以只做 Step 1-2（不需要 stat-card/icon/badge，因為現有 `.status-chip` 已經是 badge 樣式）。

- [ ] **Step 1：加入 bar-chart CSS**

在既有 `.note { ... }` 規則之後插入：
```css
  .bar-track { display: inline-block; width: 90px; height: 6px; border-radius: 3px; background: var(--surface2); overflow: hidden; vertical-align: middle; margin-left: 8px; }
  .bar-fill { display: block; height: 100%; border-radius: 3px; }
```

- [ ] **Step 2：「現有庫存」欄位加水平 bar（庫存量 ÷ 表中最大庫存量 320 件；正常庫存用綠色、低庫存用橘色，呼應現有 `status-ok`/`status-low` 配色）**

把：
```html
      <tr><td class="sku-cell">TEVA-XLT2-2026</td><td class="name-cell">TEVA Hurricane XLT2 涼鞋</td><td>320 件</td><td><span class="status-chip status-ok">🟢 正常</span></td></tr>
      <tr><td class="sku-cell">TEVA-VERGE-2026</td><td class="name-cell">TEVA Hurricane Verge 水陸機能鞋</td><td>210 件</td><td><span class="status-chip status-ok">🟢 正常</span></td></tr>
      <tr><td class="sku-cell">TEVA-RIDGE-2026</td><td class="name-cell">TEVA Ridgeview 秋冬機能涼鞋（新品）</td><td>260 件</td><td><span class="status-chip status-ok">🟢 正常，新品剛到貨</span></td></tr>
      <tr class="row-low"><td class="sku-cell">TEVA-OU-2026</td><td class="name-cell">TEVA Original Universal</td><td>18 件</td><td><span class="status-chip status-low">🟡 低庫存</span></td></tr>
```
改成：
```html
      <tr><td class="sku-cell">TEVA-XLT2-2026</td><td class="name-cell">TEVA Hurricane XLT2 涼鞋</td><td>320 件<span class="bar-track"><span class="bar-fill" style="width:100%;background:var(--green)"></span></span></td><td><span class="status-chip status-ok">🟢 正常</span></td></tr>
      <tr><td class="sku-cell">TEVA-VERGE-2026</td><td class="name-cell">TEVA Hurricane Verge 水陸機能鞋</td><td>210 件<span class="bar-track"><span class="bar-fill" style="width:66%;background:var(--green)"></span></span></td><td><span class="status-chip status-ok">🟢 正常</span></td></tr>
      <tr><td class="sku-cell">TEVA-RIDGE-2026</td><td class="name-cell">TEVA Ridgeview 秋冬機能涼鞋（新品）</td><td>260 件<span class="bar-track"><span class="bar-fill" style="width:81%;background:var(--green)"></span></span></td><td><span class="status-chip status-ok">🟢 正常，新品剛到貨</span></td></tr>
      <tr class="row-low"><td class="sku-cell">TEVA-OU-2026</td><td class="name-cell">TEVA Original Universal</td><td>18 件<span class="bar-track"><span class="bar-fill" style="width:6%;background:var(--orange)"></span></span></td><td><span class="status-chip status-low">🟡 低庫存</span></td></tr>
```

- [ ] **Step 3：瀏覽器目視驗證**

開啟 `public/teva_inventory_snapshot.html`。確認：「現有庫存」欄位每一列數字後面多了一條小 bar，前三列是綠色且長度依 320/210/260 件比例不同，最後一列（18 件）是橘色且非常短，跟同一列的「低庫存」黃色狀態 chip 呼應。

- [ ] **Step 4：Commit**

```bash
git add public/teva_inventory_snapshot.html
git commit -m "feat(reports): add stock-level bars to conv5 inventory snapshot"
```

---

### Task 4: conv5 換季促銷策略（2 個檔案：`teva_seasonal_promotion_strategy.html`、`teva_seasonal_promotion_strategy-1.html`）

**Files:**
- Modify: `public/teva_seasonal_promotion_strategy.html`
- Modify: `public/teva_seasonal_promotion_strategy-1.html`

**Interfaces:** 無。

這兩份檔案已經有不少既有豐富元素（`.risk-level` 色彩badge、trend-item emoji icon、`-1.html` 的 `.limited-badge`/`.limited-stock-tag`），這次只補上：stat-card 色條/icon/陰影、廣告預算配置的 donut chart、tactic-list 的時機 badge、（僅 `-1.html`）revision-list 的「已修正」badge。**不要**動 `.risk-level`／emoji trend-icon／`.limited-card` 相關內容，這些已經是豐富化的樣式，維持原樣。

- [ ] **Step 1：兩個檔案的 `:root` 都加入 `--shadow`**

在兩個檔案 `:root` 區塊最後一行變數（`--purple-light: rgba(124,58,237,0.08);`）之後加：
```css
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

- [ ] **Step 2：兩個檔案都加入 stat-card / icon / badge CSS**

在既有 `.stat-sub { ... }` 規則之後插入：
```css
  .stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
  .stat-card.accent-purple { border-left-color: var(--purple); }
  .stat-card.accent-green { border-left-color: var(--green); }
  .stat-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
```

- [ ] **Step 3：兩個檔案的 4 張 stat card 都加 icon + accent（兩檔內容相同的卡片用相同 icon；`-1.html` 的「主打商品」文字不同但結構相同）**

`teva_seasonal_promotion_strategy.html` 把：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-lbl">主打商品</div>
      <div class="stat-val accent">TEVA Original Universal</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">促銷檔期</div>
      <div class="stat-val">8/15 – 9/30</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">廣告預算配置</div>
      <div class="stat-val" style="font-size:12.5px">社群廣告 60%</div>
      <div class="stat-sub">雜誌置入 20% ／電商首頁 20%</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">預期營收</div>
      <div class="stat-val">NT$4,200,000</div>
    </div>
  </div>
```
改成：
```html
  <div class="stat-row">
    <div class="stat-card accent-purple">
      <div class="stat-top" style="color:var(--purple)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.58 3.24H4a2 2 0 0 0-2 2v5.58a2 2 0 0 0 .59 1.42l9.58 9.58a2 2 0 0 0 2.82 0l6.18-6.18a2 2 0 0 0 0-2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg></div>
      <div class="stat-lbl">主打商品</div>
      <div class="stat-val accent">TEVA Original Universal</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
      <div class="stat-lbl">促銷檔期</div>
      <div class="stat-val">8/15 – 9/30</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></div>
      <div class="stat-lbl">廣告預算配置</div>
      <div class="stat-val" style="font-size:12.5px">社群廣告 60%</div>
      <div class="stat-sub">雜誌置入 20% ／電商首頁 20%</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-top" style="color:var(--green)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div class="stat-lbl">預期營收</div>
      <div class="stat-val">NT$4,200,000</div>
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-top:10px">
    <svg viewBox="0 0 100 100" width="64" height="64" style="flex-shrink:0">
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface2)" stroke-width="14"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--purple)" stroke-width="14" stroke-dasharray="151 251" stroke-linecap="round" transform="rotate(-90 50 50)"/>
      <text x="50" y="55" text-anchor="middle" font-size="17" font-weight="800" fill="var(--text)">60%</text>
    </svg>
    <div style="font-size:11px;color:var(--text-2);line-height:1.8">
      <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--purple);margin-right:5px"></span>社群廣告 60%</div>
      <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);margin-right:5px"></span>雜誌置入 20% ／電商首頁 20%</div>
    </div>
  </div>
```

`teva_seasonal_promotion_strategy-1.html` 做同樣的事，唯一差異是「主打商品」的值是 `TEVA Hurricane XLT2`（不是 `TEVA Original Universal`），其餘 3 張卡片與 donut 區塊文字/數值完全相同（廣告預算仍是社群60%/雜誌20%/電商20%，因為修訂說明②講的是「隨主打商品一併轉移」，佔比配置本身沒變）。把：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-lbl">主打商品</div>
      <div class="stat-val accent">TEVA Hurricane XLT2</div>
    </div>
```
的開頭 `<div class="stat-card">` 改成 `<div class="stat-card accent-purple">`，並在 `<div class="stat-lbl">主打商品</div>` 之前插入跟上面相同的 tag icon `<div class="stat-top">...</div>`；其餘 3 張卡片與 donut 區塊，複製上面 `teva_seasonal_promotion_strategy.html` Step 3 改好的內容（促銷檔期／廣告預算配置／預期營收／donut 區塊那 4 段），貼到 `-1.html` 對應的相同位置（結構、文字、數值都相同，唯獨最上面主打商品卡片文字不同）。

- [ ] **Step 4：`tactic-list` 每項加「時機」badge（兩個檔案的 4 個 tactic-item 文字完全相同，只做一次即可比照套用兩檔）**

把：
```html
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>檔期前 2 週於 Instagram / 小紅書 投放大量素人穿搭與 KOL 開箱內容，導流電商首頁</span>
      </div>
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>洽談時尚雜誌置入報導，呼應「機能涼鞋＋機能襪」秋冬過渡穿搭話題</span>
      </div>
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>檔期首週推出 doorbuster 開賣折扣，衝刺初期買氣與聲量</span>
      </div>
```
改成（加一個 `<span class="badge" style="background:var(--surface2);color:var(--text-2);flex-shrink:0">時機標籤</span>`，第 4 項「電商首頁主視覺全面替換」那行維持不變，因為它本身就是「貫穿整個檔期」的敘述，不需要額外標籤）：
```html
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>檔期前 2 週於 Instagram / 小紅書 投放大量素人穿搭與 KOL 開箱內容，導流電商首頁</span>
        <span class="badge" style="background:var(--surface2);color:var(--text-2);margin-left:auto;flex-shrink:0">檔期前 2 週</span>
      </div>
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>洽談時尚雜誌置入報導，呼應「機能涼鞋＋機能襪」秋冬過渡穿搭話題</span>
        <span class="badge" style="background:var(--surface2);color:var(--text-2);margin-left:auto;flex-shrink:0">前期籌備</span>
      </div>
      <div class="tactic-item">
        <span class="tactic-dot"></span>
        <span>檔期首週推出 doorbuster 開賣折扣，衝刺初期買氣與聲量</span>
        <span class="badge" style="background:var(--surface2);color:var(--text-2);margin-left:auto;flex-shrink:0">檔期首週</span>
      </div>
```
（第 4 項 `電商首頁主視覺全面替換為 ... 換季形象圖，貫穿整個檔期` 這一行本身文字已經講了時機，不用加 badge，維持原樣不動。）`.tactic-item` 目前是 `display:flex`，`margin-left:auto` 會讓 badge 自動貼右對齊，不需要額外改 `.tactic-item` 的 CSS。

- [ ] **Step 5：僅 `teva_seasonal_promotion_strategy-1.html` — `revision-list` 每項加「已修正」badge**

把：
```html
    <div class="revision-list">
      <div class="revision-item">① 主打商品由 <b>TEVA Original Universal</b> 改為 <b>TEVA Hurricane XLT2</b>。</div>
      <div class="revision-item">② 廣告預算 60% 隨主打商品一併轉移至 Hurricane XLT2。</div>
      <div class="revision-item">③ 庫存風險評級由「低／無虞」更正為「高」。</div>
    </div>
```
改成：
```html
    <div class="revision-list">
      <div class="revision-item">① 主打商品由 <b>TEVA Original Universal</b> 改為 <b>TEVA Hurricane XLT2</b>。<span class="badge" style="background:var(--blue-light);color:var(--blue);margin-left:6px">已修正</span></div>
      <div class="revision-item">② 廣告預算 60% 隨主打商品一併轉移至 Hurricane XLT2。<span class="badge" style="background:var(--blue-light);color:var(--blue);margin-left:6px">已修正</span></div>
      <div class="revision-item">③ 庫存風險評級由「低／無虞」更正為「高」。<span class="badge" style="background:var(--blue-light);color:var(--blue);margin-left:6px">已修正</span></div>
    </div>
```

- [ ] **Step 6：瀏覽器目視驗證**

分別開啟兩個檔案。確認：4 張 stat card 有色條/icon/陰影；stat-row 下方新增一個 donut chart 區塊，顯示「60%」與紫色圓弧，旁邊有社群廣告/雜誌+電商兩行圖例；`tactic-list` 前 3 項右側出現淺灰色時機 badge，第 4 項維持原樣；`-1.html` 的 `revision-list` 3 項後面都多了藍色「已修正」badge；既有的 `.risk-level` 色彩、emoji trend icon、`.limited-card`／`.limited-badge` 完全沒變。

- [ ] **Step 7：Commit**

```bash
git add public/teva_seasonal_promotion_strategy.html public/teva_seasonal_promotion_strategy-1.html
git commit -m "feat(reports): add stat-card icons, budget donut chart and timing/revision badges to conv5 strategy reports"
```

---

### Task 5: conv6 通路銷售深度分析報告（`teva_channel_sales_report.html`）

**Files:**
- Modify: `public/teva_channel_sales_report.html`

**Interfaces:** 無。**此檔案的所有數字必須維持與現況完全一致**（`AiViewerRightBox.vue` 的 `conv6RunAnalysis` 圖表資料與 `knowledgeStore.ts` 的 `k13` chunk 都引用這份報告的數字，不能有任何出入）。

- [ ] **Step 1：`:root` 加入 `--shadow`**

在既有 `--red: #dc2626;` 之後加：
```css
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

- [ ] **Step 2：加入 stat-card / icon / bar-chart / donut 共用 CSS**

在既有 `.insight-list li:last-child { margin-bottom: 0; }` 之後插入：
```css
  .stat-card { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
  .stat-card.accent-green { border-left-color: var(--green); }
  .stat-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .stat-icon { width: 13px; height: 13px; flex-shrink: 0; }
  .bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .bar-row .bar-name { width: 88px; flex-shrink: 0; color: var(--text-2); }
  .bar-row .bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
  .bar-row .bar-fill { height: 100%; border-radius: 4px; background: var(--blue); }
  .bar-row .bar-val { width: 64px; text-align: right; font-weight: 700; flex-shrink: 0; }
  .bar-row.is-top .bar-fill { background: var(--green); }
  .bar-row.is-top .bar-name { color: var(--green); font-weight: 700; }
  .viz-row { display: flex; gap: 16px; align-items: flex-start; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; flex-wrap: wrap; }
  .viz-col { flex: 1; min-width: 220px; }
  .viz-col-label { font-size: 11px; font-weight: 700; color: var(--text-2); margin-bottom: 8px; }
```

- [ ] **Step 3：4 張 stat card 加 icon + accent**

把：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-val">NT$5,120萬</div>
      <div class="stat-lbl">總營業額</div>
    </div>
    <div class="stat-card">
      <div class="stat-val up">+12.6%</div>
      <div class="stat-lbl">整體年成長（YoY）</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">實體門市</div>
      <div class="stat-lbl">TOP 通路（1,530萬）</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">68%</div>
      <div class="stat-lbl">會員回購率</div>
    </div>
  </div>
```
改成：
```html
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div class="stat-val">NT$5,120萬</div>
      <div class="stat-lbl">總營業額</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-top" style="color:var(--green)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg></div>
      <div class="stat-val up">+12.6%</div>
      <div class="stat-lbl">整體年成長（YoY）</div>
    </div>
    <div class="stat-card">
      <div class="stat-top" style="color:var(--blue)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg></div>
      <div class="stat-val">實體門市</div>
      <div class="stat-lbl">TOP 通路（1,530萬）</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-top" style="color:var(--green)"><svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 12v-2a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/></svg></div>
      <div class="stat-val">68%</div>
      <div class="stat-lbl">會員回購率</div>
    </div>
  </div>
```

- [ ] **Step 4：在 stat-row 之後、「通路銷售明細」表格之前新增 bar chart + donut 區塊**

在 `</div>`（stat-row 結束）之後、`<div class="section-title">通路銷售明細</div>` 之前插入：
```html
  <div class="section-title">數據視覺化</div>
  <div class="viz-row">
    <div class="viz-col">
      <div class="viz-col-label">各通路銷售額（萬元）</div>
      <div class="bar-chart">
        <div class="bar-row is-top"><span class="bar-name">實體門市</span><div class="bar-track"><div class="bar-fill" style="width:100%"></div></div><span class="bar-val">1,530</span></div>
        <div class="bar-row"><span class="bar-name">官網直營</span><div class="bar-track"><div class="bar-fill" style="width:81%"></div></div><span class="bar-val">1,240</span></div>
        <div class="bar-row"><span class="bar-name">天貓旗艦店</span><div class="bar-track"><div class="bar-fill" style="width:64%"></div></div><span class="bar-val">980</span></div>
        <div class="bar-row"><span class="bar-name">蝦皮商城</span><div class="bar-track"><div class="bar-fill" style="width:50%"></div></div><span class="bar-val">760</span></div>
        <div class="bar-row"><span class="bar-name">經銷通路</span><div class="bar-track"><div class="bar-fill" style="width:40%"></div></div><span class="bar-val">610</span></div>
      </div>
    </div>
    <div class="viz-col" style="display:flex;align-items:center;gap:14px">
      <svg viewBox="0 0 100 100" width="72" height="72" style="flex-shrink:0">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface2)" stroke-width="14"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="14" stroke-dasharray="171 251" stroke-linecap="round" transform="rotate(-90 50 50)"/>
        <text x="50" y="55" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">68%</text>
      </svg>
      <div>
        <div class="viz-col-label">會員回購結構</div>
        <div style="font-size:11px;color:var(--text-2);line-height:1.8">
          <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:5px"></span>回購會員 68%</div>
          <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);margin-right:5px"></span>新會員 32%</div>
        </div>
      </div>
    </div>
  </div>
```
（`bar-fill` 寬度已依實際銷售額 ÷ 最大值 1,530 算好：1530/1530=100%、1240/1530≈81%、980/1530≈64%、760/1530≈50%、610/1530≈40%，跟 `AiViewerRightBox.vue` 裡 `conv6RunAnalysis` 的圖表資料與 `k13` chunk 數字完全一致，只是多了一個視覺化 bar，原本的表格與洞察清單完全不動。）

- [ ] **Step 5：瀏覽器目視驗證**

開啟 `public/teva_channel_sales_report.html`。確認：4 張 stat card 有色條/icon/陰影；stat-row 與「通路銷售明細」表格之間新增一個「數據視覺化」區塊，左邊是 5 條通路長條圖（實體門市最長且綠色），右邊是 68% 綠色 donut；下方原有的表格與「洞察與建議」清單內容完全沒變。

- [ ] **Step 6：Commit**

```bash
git add public/teva_channel_sales_report.html
git commit -m "feat(reports): add stat-card icons, channel bar chart and repurchase donut to conv6 report"
```

---

### Task 6: conv6 行銷策略與風險評估報告（`teva_channel_marketing_strategy_report.html`）

**新增背景：** 這份檔案是在最終 review 過程中發現的——conv6 後來新增了一個「Deep Research」流程（`conv6RunStrategyDeepResearch()`），會產出第二份實體報告 `teva_channel_marketing_strategy_report.html`，寫這份 spec 時還不存在，所以原本 7 檔清單漏了它。這份檔案結構跟前 7 份不同：沒有 `stat-row`/`stat-card`，而是 `.data-cols`（2 個資料欄，emoji 標題）、`.strategy-list`（3 個策略項目，已有 `.strategy-tag` chip）、`.keyword-chips`、以及風險評估表格（已有 `.risk-level` 色彩 badge）。**風險 badge、strategy-tag chip、emoji 標題維持原樣不動**——這些已經是豐富化過的元素，比照 Task 4 對 conv5 策略報告的處理原則。

**Files:**
- Modify: `public/teva_channel_marketing_strategy_report.html`

**Interfaces:** 無。**這份檔案的「會員回購率68%」數字必須與 conv6 其他報告（Task 5 的 `teva_channel_sales_report.html`）、`AiViewerRightBox.vue`、`knowledgeStore.ts` 完全一致**——本任務只加一個複用同樣 68/32 分佈的 donut，不改變任何數字。

- [ ] **Step 1：`:root` 加入 `--shadow`**

在既有 `--purple: #7c3aed;` 之後加：
```css
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
```

- [ ] **Step 2：`.data-col` 加左側色條 + 陰影（兩欄分別用 blue／purple 區分「內部數據」與「外部趨勢研究」）**

在既有 `.data-col { ... }` 規則後面插入：
```css
  .data-col { border-left: 3px solid var(--blue); box-shadow: var(--shadow); }
  .data-col.accent-purple { border-left-color: var(--purple); }
  .badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .badge-up { background: var(--green-light); color: var(--green); }
  .badge-down { background: rgba(220,38,38,0.08); color: var(--red); }
```

把：
```html
    <div class="data-col">
      <div class="data-col-title">📊 內部通路與會員數據</div>
```
改成：
```html
    <div class="data-col">
      <div class="data-col-title">📊 內部通路與會員數據</div>
```
（第一欄不用加 `accent-purple`，維持預設 blue 色條即可，不需要改這行；只要確保 CSS 規則生效即可，這步驟主要是加 CSS。）

把第二欄：
```html
    <div class="data-col">
      <div class="data-col-title">🔍 Deep Research 外部趨勢</div>
```
改成：
```html
    <div class="data-col accent-purple">
      <div class="data-col-title">🔍 Deep Research 外部趨勢</div>
```

- [ ] **Step 3：把「內部通路與會員數據」欄位的 2 個 growth 文字改成 badge，並在「會員回購率達68%」旁加小型 donut（複用 Task 5 conv6 donut 的 68/32 數字與樣式，不做 round cap）**

把：
```html
      <ul>
        <li>天貓旗艦店成長最快：<span class="growth-up">+32%</span></li>
        <li>實體門市年減：<span class="growth-down">-4%</span>（仍為 TOP 通路）</li>
        <li>會員回購率達 <strong>68%</strong></li>
      </ul>
```
改成：
```html
      <ul>
        <li>天貓旗艦店成長最快：<span class="badge badge-up">▲ +32%</span></li>
        <li>實體門市年減：<span class="badge badge-down">▼ -4%</span>（仍為 TOP 通路）</li>
        <li>會員回購率達 <strong>68%</strong></li>
      </ul>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <svg viewBox="0 0 100 100" width="56" height="56" style="flex-shrink:0">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface2)" stroke-width="14"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="14" stroke-dasharray="171 251" transform="rotate(-90 50 50)"/>
          <text x="50" y="55" text-anchor="middle" font-size="16" font-weight="800" fill="var(--text)">68%</text>
        </svg>
        <div style="font-size:10.5px;color:var(--text-2);line-height:1.7">
          <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:4px"></span>回購會員 68%</div>
          <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);margin-right:4px"></span>新會員 32%</div>
        </div>
      </div>
```
（注意：donut 弧形圓不要加 `stroke-linecap="round"`，直接用 butt cap，數值才會跟 `stroke-dasharray="171 251"` 精確對應——這是這次 final review 剛修好的教訓，不要在新檔案裡重蹈覆轍。）

- [ ] **Step 4：不要動的部分（明確列出，避免誤觸）**

`.data-col-title` 的 emoji（📊/🔍）、`.strategy-list`／`.strategy-item`／`.strategy-tag`（tag-channel/tag-trend/tag-member）、`.keyword-chips`、風險評估表格與 `.risk-level`（risk-high/mid/low）——這些全部維持原樣，不加 icon、不改 class、不改文字。

- [ ] **Step 5：瀏覽器目視驗證**

開啟 `public/teva_channel_marketing_strategy_report.html`。確認：「內部通路與會員數據」欄位左側變成藍色色條有陰影，「Deep Research 外部趨勢」欄位左側變成紫色色條有陰影；+32%/-4% 變成綠色▲／紅色▼ badge；「會員回購率達68%」下方新增一個 68% 綠色 donut（不是圓角端點，弧形長度精確對應 68%）；風險評估表格、strategy-tag、emoji 標題完全沒變。

- [ ] **Step 6：Commit**

```bash
git add public/teva_channel_marketing_strategy_report.html
git commit -m "feat(reports): add data-col accents, growth badges and repurchase donut to conv6 marketing strategy report"
```

---

## Self-Review Notes

- **Spec coverage**：共用視覺系統（stat-card 色條/陰影/icon、badge、bar chart、donut chart）— Task 1-5 都套用；逐檔案對照表 7 個檔案 — Task 1（2 檔）、Task 2（1 檔）、Task 3（1 檔）、Task 4（2 檔）、Task 5（1 檔）共 7 個檔案全部覆蓋，無遺漏。
- **Placeholder scan**：所有步驟皆為完整可直接使用的 HTML/CSS 內容與實際算好的數值，無 TBD/TODO/「同上」。
- **Type consistency**：不適用（純靜態 HTML，無函式簽章跨任務依賴）；共用 CSS class 命名（`.stat-card`/`.stat-top`/`.stat-icon`/`.badge`/`.badge-up`/`.badge-down`/`.bar-chart`/`.bar-row`/`.bar-name`/`.bar-track`/`.bar-fill`/`.bar-val`/`.is-top`）在 5 個任務間保持一致。
- 額外確認：conv6（Task 5）的所有數值（1,530/1,240/980/760/610 萬元、68%/32%）與現有 `AiViewerRightBox.vue`／`knowledgeStore.ts` 的口徑一致，未新增或竄改任何數字。

**Task 6 追加說明（2026-08-04）：** Task 1-5 完成後的最終 review 發現 conv6 在 spec 撰寫之後又新增了「Deep Research」流程，多產出了第二份報告 `teva_channel_marketing_strategy_report.html`，原 spec 的排除說明（誤以為該報告不存在）已過時。追加 Task 6 補上這份檔案的視覺豐富化，維持跟 Task 1-5 相同的原則（新增陰影/色條/badge/donut，不動既有的 `.risk-level`／`.strategy-tag`／emoji 標題）。同一輪 review 也修正了 Task 4/5 donut 圖表因 `stroke-linecap="round"` 造成視覺比例失真的問題（已修正為精確弧長，Task 6 的新 donut 從一開始就不用 round cap）。
