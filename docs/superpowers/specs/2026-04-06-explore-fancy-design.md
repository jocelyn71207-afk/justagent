# Explore 頁面視覺升級 — 設計規格

**日期：** 2026-04-06  
**狀態：** 已確認，等待實作

---

## 一、設計方向摘要

**風格：** Liquid Glass × 彩色漸層背景  
**策略：** HTML + SCSS 一起調（`Explore.vue` + `_Explore.scss`）  
**核心結構：** 彩色光球背景 → 半透明白底大板 → Liquid Glass 元件浮在上面

---

## 二、背景層

### 彩色光球
頁面用 `position: fixed` 背景層，包含 5 個模糊光球（`filter: blur(90px)`）：

| 光球 | 顏色 | 位置 | 用途 |
|------|------|------|------|
| b1 | `#4ade80` 亮草綠 | 左上 | 主色調 |
| b2 | `#0891b2` 翠藍 | 右上 | 輔色 |
| b3 | `#65a30d` 黃綠 | 下方中 | 深層次 |
| b4 | `rgba(255,255,255,0.9)` 白光 | 中間 | 提亮 |
| b5 | `#22d3ee` 青 | 右下 | 點綴 |

底色：`linear-gradient(145deg, #4ade80 0%, #22c55e 35%, #06b6d4 100%)`

> 注意：全部使用綠→藍→青同色系，不混補色，避免混色變髒。

### 白底大板（`.views-page-content-box` 替換）
包住所有內容的外層容器改為半透明白板：

```scss
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(20px);
border-radius: 24px;
padding: 24px;
box-shadow: 0 12px 48px rgba(0, 60, 20, 0.18), 0 2px 0 rgba(255, 255, 255, 0.9) inset;
border: 1px solid rgba(255, 255, 255, 0.9);
```

---

## 三、Liquid Glass 材質規格

所有 UI 元件統一使用純白透明玻璃，**不帶任何色調**（顏色全部來自背景穿透）。

### 大區塊（`.explore-hero`, `.recs-box`, `.explore-search-bar`）
```scss
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(32px) saturate(1.6);
border: 1px solid rgba(255, 255, 255, 0.35);
border-top-color: rgba(255, 255, 255, 0.95);   // 折射高光
border-left-color: rgba(255, 255, 255, 0.70);
border-radius: 18px;
box-shadow:
  0 4px 20px rgba(0, 60, 20, 0.08),
  0 1px 0 rgba(255, 255, 255, 0.9) inset;       // 內折射
```

### Agent 卡片（`.agent-card`, `.rec-card`）
```scss
background: rgba(255, 255, 255, 0.50);
backdrop-filter: blur(24px) saturate(1.5);
border: 1px solid rgba(255, 255, 255, 0.35);
border-top-color: rgba(255, 255, 255, 0.95);
border-radius: 16px;
box-shadow:
  0 3px 14px rgba(0, 60, 20, 0.07),
  0 1px 0 rgba(255, 255, 255, 0.85) inset;
transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

&:hover {
  background: rgba(255, 255, 255, 0.68);
  border-top-color: rgba(255, 255, 255, 1);
  transform: translateY(-4px) scale(1.015);
  box-shadow: 0 12px 32px rgba(0, 60, 20, 0.12), 0 1px 0 rgba(255, 255, 255, 1) inset;
}
```

### 小元件（`.agent-icon`, `.rec-icon`, `.ag-badge`, `.recs-chip`, `.chip`）
```scss
background: rgba(255, 255, 255, 0.50~0.55);
border: 1px solid rgba(255, 255, 255, 0.38);
border-top-color: rgba(255, 255, 255, 0.88~0.95);
backdrop-filter: blur(8~12px);
box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65~0.7) inset;
```

---

## 四、升級項目細節

### 1. Hero Banner
- 背景改為 Liquid Glass 大板（原來的純白邊框改掉）
- Hero 左側光球裝飾：`::before` `::after` 偽元素，綠色/藍色 radial-gradient
- mascot 圓點改為 `linear-gradient(135deg, #22c55e, #06b6d4)`
- CTA 卡片：獨立 Liquid Glass capsule，"由我推薦" label 與 "立即使用 →" 用綠→藍漸層文字

### 2. Agent 卡片（使用熱度榜 + 大家都在用）
- icon 從小方塊改為 44×44px，白玻璃底（無識別色）
- **rank badge** 改為金/銀/銅漸層（非純黑）：
  - 第1：`linear-gradient(135deg, #f59e0b, #fcd34d)` + glow shadow
  - 第2：`linear-gradient(135deg, #94a3b8, #e2e8f0)` 銀
  - 第3：`linear-gradient(135deg, #b87333, #d4956c)` 銅
  - 第4：白玻璃樣式
- **agent-badge**（新上架/高滿意度）：白玻璃底，深色文字

### 3. 個人化推薦區塊
- 整個 `.recs-box` 改為 Liquid Glass 大板
- `.recs-avatar` 改為綠→藍漸層填色
- **chip active**：`rgba(255,255,255,0.75)` 更亮白玻璃 + 更深文字
- **rec-card** 加入 icon（agent-icon 相同尺寸但 32×32）
- rec-card 顯示各 Agent 對應的 Material Symbol icon

### 4. 搜尋列
- 下方加入快捷 tag chips（內容創作、財務分析、會議記錄、HR 行政、設計輔助）
- 搜尋框改為白玻璃樣式，border 上方折射高光

### 5. 微互動
- 所有卡片 hover：`translateY(-4px) scale(1.015)` + 玻璃亮度提升，`cubic-bezier(0.34, 1.4, 0.64, 1)` 彈性動畫
- chip active 切換：`transition: all 0.16s`
- 背景光球（可選）：`@keyframes float` 緩慢上下浮動，`8s ease-in-out infinite`

---

## 五、文字顏色

因白底襯板讓背景變亮，文字改回深色：

| 用途 | 顏色 |
|------|------|
| 標題 h3/h4 | `#0a2e18` |
| 正文 | `rgba(10, 46, 24, 0.52~0.55)` |
| see-all 連結 | `#16a34a` |
| 淡色文字 | `rgba(0, 50, 30, 0.62)` |

---

## 六、影響範圍

| 檔案 | 變更內容 |
|------|---------|
| `src/views/Explore.vue` | 外層加背景 blob divs；Hero 加裝飾 div；搜尋列加 chips；rec-card 加 icon |
| `src/scss/views/_Explore.scss` | 全面重寫視覺樣式（背景、玻璃材質、hover 動畫、文字色） |
| `src/scss/_layout.scss` 或 `Explore.vue` | `.views-page` 在 Explore 頁面加白底大板覆蓋，或在 `Explore.vue` 套一層 wrapper |

> **不動範圍：** 路由、Store、API 呼叫、功能邏輯

---

## 七、不在範圍內

- 深色模式適配（此次只做淺色）
- RWD / 手機版
- 動態資料串接（假資料維持現狀）
