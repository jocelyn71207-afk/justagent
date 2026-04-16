# Explore 頁面 Wise 設計系統改版

**日期：** 2026-04-09  
**影響範圍：** `src/views/Explore.vue`、`src/scss/views/_Explore.scss`

---

## 目標

將探索頁面從目前的 **Liquid Glass**（毛玻璃漸層背景）風格，完整改版為 **Wise** 設計系統風格，提升視覺清晰度與品牌一致性。

---

## 設計決策摘要

| 元素 | 現在（Liquid Glass） | 改版後（Wise） |
|------|---------------------|----------------|
| 頁面背景 | 綠/青漸層 + 動態光球 blob | 暖灰白 `#f2f4f0`，移除所有 blob |
| Hero 區塊 | 毛玻璃橫幅，rgba 透明 | 白底，頂部 4px 萊姆綠色條 |
| Hero 標題 | `font-size: 15px / weight 600` | `font-size: 22px / weight 900` |
| Hero eyebrow | 漸層文字 | 黑底萊姆綠文字 pill（`#0e0f0c` bg + `#9fe870` text）|
| Hero 推薦卡 | 毛玻璃小卡 | 整面萊姆綠底（`#9fe870`），按鈕反轉深綠 |
| 搜尋列 | 毛玻璃 blur | 純白圓角 pill，ring shadow |
| Chips | 透明玻璃 | `rgba(22,51,0,0.07)` 底，active = 萊姆綠 pill |
| Section 標題 | `font-size: 14px / weight 600` | `font-size: 20px / weight 900` |
| Agent 卡片 | 毛玻璃 blur + rgba | 純白，`rgba(14,15,12,0.12)` 邊框，hover scale(1.02) |
| 排名 badge | 金/銀/銅漸層 | #1 = 萊姆綠，#2 = 灰，#3 = 暖棕，其他 = 灰 |
| 個人化推薦區塊 | 毛玻璃 | 純白，`border-radius: 30px` |
| 推薦卡底色 | rgba 毛玻璃 | `#f2f4f0`（頁面背景色），hover 時加深 |
| Avatar（Lucas）| 綠/青漸層圓 | 萊姆綠圓，深綠文字 |
| hover 動效 | translateY + scale | 同上，保留 cubic-bezier(0.34,1.4,0.64,1) |

---

## 色彩對照

| 用途 | Token | Hex |
|------|-------|-----|
| 頁面背景 | — | `#f2f4f0` |
| 主文字 | near-black | `#0e0f0c` |
| 次要文字 | gray | `#868685` |
| 三級文字 | warm-dark | `#454745` |
| 主要 CTA / active chip | wise-green | `#9fe870` |
| CTA 文字 | dark-green | `#163300` |
| 淡綠底（badge / tag） | light-mint | `#e2f6d5` |
| 卡片邊框 | — | `rgba(14,15,12,0.12)` |
| Chip 預設底 | — | `rgba(22,51,0,0.07)` |

---

## Typography

| 元素 | font-size | font-weight | 備註 |
|------|-----------|-------------|------|
| Hero 標題 | 22px | 900 | line-height 1.15 |
| Section 標題 | 20px | 900 | letter-spacing -0.5px |
| Agent 卡片名稱 | 14px | 700 | — |
| Agent 卡片描述 | 12px | 400 | color: #868685 |
| 搜尋列 input | 15px | 600 | — |
| Chip / recs-chip | 13px | 600 | — |
| CTA 按鈕 | 12–13px | 600 | border-radius: 9999px |

所有文字套用 `font-feature-settings: "calt"`。

---

## 元件細節

### Hero 區塊
- 背景：`#ffffff`，`border-top: 4px solid #9fe870`，其餘三邊 `1px solid rgba(14,15,12,0.10)`
- border-radius：`20px`
- Eyebrow pill：`background: #0e0f0c; color: #9fe870; border-radius: 9999px; padding: 3px 10px`
- 推薦卡：`background: #9fe870; border-radius: 16px`，按鈕 `background: #163300; color: #9fe870`
- hover：推薦卡 `transform: scale(1.05)`

### 搜尋列
- `background: #ffffff; border-radius: 9999px`
- `box-shadow: rgba(14,15,12,0.06) 0px 2px 8px`
- focus-within：`box-shadow: rgba(14,15,12,0.12) 0px 0px 0px 2px`

### Agent 卡片
- `background: #ffffff; border: 1px solid rgba(14,15,12,0.12); border-radius: 20px`
- hover：`transform: translateY(-4px) scale(1.02); box-shadow: rgba(14,15,12,0.12) 0px 12px 32px`
- transition：`all 0.22s cubic-bezier(0.34,1.4,0.64,1)`

### 個人化推薦
- 外框：`background: #ffffff; border: 1px solid rgba(14,15,12,0.12); border-radius: 30px`
- 推薦小卡：`background: #f2f4f0; border-radius: 16px`，hover 時 `background: #e8ebe6`

---

## 實作範圍

**修改：**
- `src/scss/views/_Explore.scss` — 全部重寫，移除毛玻璃相關 CSS
- `src/views/Explore.vue` — 移除 `.explore-bg` blob HTML，Hero eyebrow pill 為新增 div

**不動：**
- Script 邏輯（資料、搜尋、Modal、computed）完全不變
- `compModal` 相關樣式不在本次範圍

**Template 小幅調整（僅結構，不動邏輯）：**
1. 移除 `.explore-bg` 及其五個 blob div
2. Hero 內新增 eyebrow pill div（`<div class="hero-eyebrow-pill">AI Agent 平台</div>`）
3. Hero `.hero-mascot` 換成上述 eyebrow pill，移除 mascot 相關 markup
