# 技能管理大後台原型（skill-admin.html）視覺重新設計

**日期：** 2026-09-03
**範圍：** 重寫 `skill-admin.html` 的標記與樣式，建立獨立的 design token／共用元件系統；不改動任何業務邏輯或資料內容
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md` 等 Phase 0-6 系列文件——主 Vue App 既有的設計語言與 token 命名慣例，本次僅在**命名風格**上參考對齊（`--tag-*-bg/-text`、alpha 階梯等慣例），但不共用檔案，因為服務對象與色彩傾向不同（見「背景」）

---

## 1. 背景與目標

`skill-admin.html`（repo 根目錄）是一個獨立於 Vue App 之外的靜態 HTML/CSS/JS 原型，用來規劃「Agent Skill 管控」大後台的功能與版面，過去透過人工方式與 Vue 端的 `SkillManagement.vue` 邏輯變更同步（見 commit 769853d）。它目前尚未有對應的 Vue route，是**規格 mockup**，不是上線中的產品介面。

現況問題（使用者確認的四個面向）：
1. **排版配置/資訊層級**：8 個頁面 + 8 個 modal 全部靠 inline style 手刻，無間距/字級系統，`Tool 管理`頁尤其嚴重——4 個 MCP server 區塊幾乎逐字複製貼上同一份表格 HTML
2. **視覺風格老舊**：Ant Design 預設色盤直接寫死 hex（`#1890ff`/`#52c41a`/`#fa8c16`/`#ff4d4f`/`#001529`），零 design token
3. **元件不一致**：8 個 modal 各自有不同寬度/padding 邏輯，tag/pill、stat-box 等元件雖有共用 class 但顏色分岔嚴重
4. **整體資訊密度/易用性**：`Skills Repository` 表格中每一列衍生 skill 都重複寫出完整的「衍生自」來源文字，造成閱讀負擔

**目標**：在維持現有 8 個頁面、8 個 modal、現有功能與資料內容不變的前提下，建立一套獨立的視覺語言（design token + 共用元件），重寫標記與樣式，解決以上四個問題。

**視覺方向**（已透過瀏覽器 mockup 比較確認）：*Modern SaaS Console* ——大量留白、細邊框取代粗框線、圓角 pill 標籤、indigo（`#4f46e5` 系）主色，參考 Linear / Notion / Vercel 的資訊型後台美學。曾比較過的另外兩案：「現有深色側欄的保守進化版」（新穎感不足，pass）與「全深色 Technical/Ops Console」（辨識度最高但長表格深色閱讀負擔重，pass）。

---

## 2. 非目標

- 不新增功能、不修改任何顯示資料或業務邏輯（頁面數、欄位、按鈕行為維持現狀）
- 不把原型遷移進 Vue App（不建立新 route/component/store）——這是未來正式導入產品時的獨立任務，這次只重做原型本身
- 不改動既有 JS 互動函式的行為（`showPage`/`openModal`/`closeModal`/`switchStatsTab`/`switchAdminMode`/`selectTestSkill`/`toggleToolSource`），只允許因 DOM 結構調整而做的等價修改（例如 `id`/class 命名對應更新）
- 不追求 dark mode（這是原型，先做好 light mode 版本）
- 不做響應式/行動裝置優化（後台工具，桌面尺寸即可）

---

## 3. 檔案結構

原本單一 1068 行的 `skill-admin.html` 拆成：

```
skill-admin/
├── tokens.css       # 色彩／間距／字級／陰影／圓角 design token（CSS custom properties）
├── layout.css       # sidebar、topbar、page shell、grid 排版骨架
├── components.css   # 按鈕、表格、tag/pill、stat-card、tabs、modal、表單、chat bubble、server-card
├── app.js           # 現有 <script> 內容原封不動搬移
skill-admin.html      # 只留 DOM 結構（8 個 page 容器 + 8 個 modal 容器），<head> 內以 <link> 引入上述三份 css
```

`skill-admin.html` 檔名與路徑不變，維持既有「打開這個檔案就能看到原型」的使用習慣。`app.js` 抽成獨立檔案是唯一的非樣式改動，純粹是為了讓 `index.html` 不再是一份 1000+ 行的巨型檔案；函式簽名與呼叫方式不變。

---

## 4. Design Tokens（`tokens.css`）

**色彩**：
- 中性灰階 `--gray-50` ~ `--gray-900`（背景、邊框、次要文字）
- 單一主色 `--accent-50/100/500/600/700`（indigo，用於 active 狀態、主要按鈕、連結）
- 4 組語意色，每組「淺底 + 文字」兩層，取代目前 12 種雜牌 hex：
  - `--success-bg` / `--success-text`（綠，已發佈/Healthy/Connected）
  - `--warning-bg` / `--warning-text`（琥珀，待審核/Degraded/閒置）
  - `--danger-bg` / `--danger-text`（紅，已停用/Down/健康度異常）
  - `--info-bg` / `--info-text`（藍灰，系統層級標籤）
- 既有的分類 tag 色（indigo=企業、teal=團隊、gray=獨立能力、purple=MCP、cyan=Native）沿用相同色相，改用 `--tag-{name}-bg` / `--tag-{name}-text` 命名，與主 App token 慣例呼應但獨立成自己的一份檔案

**間距**：4px 基準等比例尺 `--space-1`(4px) 到 `--space-8`(32px)，取代散落各處的手寫 px 值

**字級**：`--text-xs`(11px) / `--text-sm`(12px) / `--text-base`(13px) / `--text-md`(14px) / `--text-lg`(15px) / `--text-xl`(16px) / `--text-stat`(22px)，對應 label/內文/標題/統計數字

**圓角/陰影**：`--radius-sm`(6px)／`--radius-md`(10px)；卡片、表格預設**不用陰影**、只用 `--gray-200` 細邊框，陰影 `--shadow-sm`(hover)／`--shadow-md`(modal) 只用在真正浮起的層

數字欄位（使用次數、統計值）一律加 `font-variant-numeric: tabular-nums`。

---

## 5. 共用元件（`components.css`）

沿用瀏覽器 mockup 中已確認的樣式，逐一對應到現有元件：

| 元件 | 取代對象 | 重點調整 |
|---|---|---|
| `.side-nav` / `.nav-link` | 現有 `.sidebar`/`.nav-link` | 淺色側欄（`--gray-50` 底），active 用 `--accent-50` 底 + `--accent-600` 文字，不再用深色 `#001529` |
| `.topbar` | 現有 `.page-header` | 加上主要動作按鈕靠右對齊的固定位置 |
| `.filter-chip` | 現有 `.search-bar` 內的 label+input/select | 改成外框 chip 觀感，維持原本的 input/select 語意 |
| `.data-table` | 現有 `table`/`.table-wrap` | 表頭改大寫字距、`--gray-50` 底，列 hover 用 `--accent-50` |
| `.stat-card` | 現有 `.stat-box` | 數值依語意上色（危險/警告時 `--danger-text`/`--warning-text`），取代目前 inline `style="color:#ff4d4f"` |
| `.pill` | 現有 `.tag` | 圓角改 pill 形（`border-radius:20px`），配色改用第 4 節的語意/分類 token |
| `.tabs` | 現有 `.tabs-bar` | 底線改用 `--accent-500`，字重 active 時加粗 |
| `.server-card` | **新元件**，取代 Tool 管理頁 4 段複製貼上的 inline table | 一個 server 一張卡：header（名稱/連線狀態/meta/動作）+ 底下的 tool 列表，樣式只寫一次，4 個 server 共用同一組 class |
| `.modal` | 現有 `.modal-mask`/`.modal-box` | 收斂成 3 種標準寬度（480/560/680px），取代目前 8 個 modal 各自寫死寬度 |
| `.chat-bubble` | 現有 `.chat-bubble` | bot 訊息維持淺底，user 訊息改實心 `--accent-500` 底 + 白字，取代目前雙方都用淺色底、僅邊框顏色區分的低對比設計 |
| `.form-item` | 現有 `.form-item` | 只換間距與 focus 樣式（focus ring 用 `--accent-500`），結構不變 |

---

## 6. 頁面資訊架構微調

不新增/移除任何欄位或功能，僅解決密度問題：

- **Skills Repository**：衍生 skill（企業/團隊版）目前每列重複寫出完整「衍生自」來源文字。改為主列（系統 skill）+ 縮排子列（衍生版本）的視覺群組，子列不重複顯示完整來源文字，改成一個可 hover 顯示全文的簡短標記（例如「↳ 衍生」+ tooltip），減少重複資訊
- **Tool 管理**：套用 `.server-card`，4 個 MCP server 區塊改成資料驅動的重複結構（原本是 4 段幾乎相同的 inline HTML，重寫時改成同一個標記樣板套 4 次資料，而非繼續複製貼上）
- **企業擴充追蹤／使用統計／草稿管理／Agent 配置**：欄位與資料不動，只套用新 token 與元件
- **Skill Builder／Skill 測試中心**：聊天氣泡、分段控制（試跑預覽/觸發測試）套新樣式，版面配置（左側選擇欄+右側主區）不變

---

## 7. 驗收方式

無單元測試對象（純靜態原型）。驗收流程：

1. 用 `run` skill 在瀏覽器開啟 `skill-admin.html`
2. 逐一走過 8 個頁籤（Skills Repository / 企業擴充追蹤 / 使用統計 / Skill Builder / Skill 測試中心 / 草稿管理 / Tool 管理 / Agent 配置）與 8 個 modal，確認顯示正確
3. 確認既有 JS 互動未因 DOM 結構調整而壞掉：nav group 展開/收合、tab 切換（`showPage`/`switchStatsTab`/`switchAdminMode`）、modal 開關、`selectTestSkill`、`toggleToolSource`
4. 截圖比對重寫前後的版面差異，確認資訊架構微調（Skills Repository 衍生列分組、Tool 管理 server-card）沒有遺漏原始資料

---

## 8. 觸及檔案範圍

- `skill-admin.html`（改寫為純 DOM 結構）
- 新增 `skill-admin/tokens.css`、`skill-admin/layout.css`、`skill-admin/components.css`、`skill-admin/app.js`

不觸及 `src/` 下任何 Vue App 檔案。
