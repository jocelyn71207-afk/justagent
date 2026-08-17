# 全站視覺重新設計 Phase 6：AiViewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `_AiViewer.scss`（4214 行，全站最大 SCSS 檔案）裡 146+ 處寫死的顏色轉成既有 token，補上正確回應 `[data-theme="dark"]` 手動切換的 dark mode（目前只有 4 處只認 OS 層級的 `prefers-color-scheme`，手動切換 dark mode 時會漏掉），旅程執行狀態面板改用 Phase 4/5 建立的同一套 token，並清掉已確認的死程式碼。

**Architecture:** 按檔案內既有的區塊（section-header 註解）拆成 7 個任務，每個任務處理一段獨立的顏色/樣式範圍，彼此不互相依賴、可以照順序個別測試（build 成功 + 手動/Playwright 視覺檢查無跑掉）。每個任務都是純顏色/樣式轉換，不改任何 Vue 樣板的互動邏輯（唯一例外是 Task 1 刪除一個確認死掉的按鈕元素）。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（CSS Custom Properties 主題 token）、Konva.js（不修改，只是背景知識）。

## Global Constraints

- 顏色使用 CSS Custom Properties，不寫死 hex；**不新增任何新 token**——全部對應到 `src/scss/base/_theme.scss`/`_themeDark.scss` 既有的 token
- **重要背景**：由於這個檔案巨大，每個任務執行時實際的行號會跟這份計畫寫的行號有落差（前面任務的修改會讓後面任務的行號往前/往後偏移）。**每個任務開始時，先用區塊的 section-header 註解文字（例如 `// ── StageMap 迷你地圖 ──`）或該任務要改的精確 hex 值/class 名稱去搜尋，不要直接相信這份計畫寫的行號**——行號只是給你定位大概範圍用的參考，不是精確座標
- 這次**不改**任何畫布互動邏輯、Vue 樣板的功能行為（唯一例外：Task 1 明確要刪除一個已確認的死按鈕元素）
- `AiViewerLeftBox.vue`、`AiViewerRightBox.vue`、`AiViewerContentBox.vue`、`FullAiViewerBlockBox.vue`、`StageMap.vue` 這幾個子元件都沒有自己的 `<style>` block，樣式全部集中在 `_AiViewer.scss` 裡——這份計畫的範圍已經涵蓋這些子元件的全部樣式，不需要額外處理子元件檔案
- 這個檔案目前**沒有** `[data-theme="dark"]` 區塊，但有 4 處 `@media (prefers-color-scheme: dark)` 區塊（只回應 OS 層級深色模式，不回應 app 內手動切換的 `[data-theme="dark"]`）——轉成 token 後這幾處會自動修好這個既有 bug，不需要額外邏輯
- `left-ctrl-box`（永遠 `v-if="false"` 的死按鈕）**只刪按鈕本身跟對應 CSS**，`AiViewerLeftBox` 元件、`isShowLeftFrame` 狀態、resizer 邏輯維持不動（雖然目前也碰不到，但這次不做這麼大的結構判斷）
- `.debug-views`/`AiViewerContentResize` 這個 debug overlay 區塊**是真的在用的功能**（`?debug=true` 或連續點擊觸發），不是死程式碼——只轉換顏色，不要刪除
- 不修 12 處 console.log、不做真的「TODO 動態顏色」功能實作
- 沒有既有的 CSS 顏色值單元測試（這個專案本來就沒有這種測試工具），每個任務的驗證方式是：`npm run build` 成功 + 手動/Playwright 視覺檢查 light/dark 兩種模式下沒有跑掉

## 顏色 → Token 對照表（跨任務共用參考）

以下是這次會用到的既有 token（全部已存在於 `_theme.scss`/`_themeDark.scss`，不新增）：

| 用途 | Token |
|---|---|
| 純白文字/圖示（在有色底上） | `var(--primary-fg)` |
| 一般文字 | `var(--text)` |
| 次要文字 | `var(--text-muted)` |
| 極淡文字 | `var(--text-faint)` |
| 邊框/分隔線 | `var(--divider)` |
| 完成/成功狀態 | `var(--success)` |
| 警告狀態 | `var(--warning)` |
| 錯誤/危險狀態 | `var(--danger)` |
| 藍色分類（執行中/資訊） | `var(--tag-blue-bg)` / `var(--tag-blue-text)` |
| 紫色分類（生日旅程/等） | `var(--tag-violet-bg)` / `var(--tag-violet-text)` |
| 琥珀分類 | `var(--tag-amber-bg)` / `var(--tag-amber-text)` |
| 青綠分類 | `var(--tag-teal-bg)` / `var(--tag-teal-text)` |
| 品牌色透明度階梯（濾鏡玻璃效果等） | `var(--primary-a08)` / `var(--primary-a12)` / `var(--primary-a20)` / `var(--primary-a40)` |
| 卡片半透明白底（濾鏡玻璃效果） | `var(--surface-a90)` / `var(--surface-a70)` / `var(--surface-a50)` |
| 陰影（RGB triplet，需搭配 `rgba(var(--shadow), 透明度)` 語法） | `var(--shadow)` |

---

### Task 1: `.AiViewer` 根容器 + 畫布控制 + 浮動控制列（含左側面板死按鈕清理）

**Files:**
- Modify: `src/views/AiViewer.vue`（刪除 `left-ctrl-box` 死按鈕，約第 62-76 行）
- Modify: `src/scss/views/_AiViewer.scss`（`.AiViewer` 根容器～`.AiViewer-next-option-box` 區段，約第 3-1106 行；刪除死程式碼註解）

**Interfaces:**
- Consumes: 無前置任務
- Produces:（本任務無後續任務依賴）

**這個範圍要處理的區段**（用 section-header 註解定位，不要用行號）：
- `.AiViewer` 根容器（grid 版面、`#mainStage`、frame resizer、`.scaleBox`）
- `.in-multi-choice-mode` 多選模式覆蓋層
- `.AiViewr-ctrl-box`（左右切換按鈕、`.user-project-ctrl-box` 使用者/專案控制列、`.next-option-box` 選單）
- `.AiViewer-next-option-box` 共用下拉選單

- [ ] **Step 1: 刪除 `left-ctrl-box` 死按鈕**

在 `src/views/AiViewer.vue` 裡搜尋 `left-ctrl-box`，找到這個區塊（目前約在第 62-76 行）：

```html
<div :class="['AiViewr-ctrl-box left-ctrl-box', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]" v-if="false" ...>
  ...
</div>
```

確認這個 `<div>` 整段（開頭 `v-if="false"` 到對應的閉合 `</div>`）**確實是唯一一處** `left-ctrl-box` 的樣板使用（執行 `grep -n "left-ctrl-box" src/views/AiViewer.vue` 確認只有這一段），然後整段刪除。

- [ ] **Step 2: 刪除 `left-ctrl-box` 對應的 CSS**

在 `src/scss/views/_AiViewer.scss` 裡搜尋 `.left-ctrl-box`（目前約在第 908 跟 918-922 行），刪除這兩處規則。**執行 `grep -n "left-ctrl-box" src/scss/views/_AiViewer.scss` 確認刪除後沒有殘留引用。**

- [ ] **Step 3: 刪除這個範圍內已確認的死程式碼註解**

搜尋並刪除以下確認是死程式碼的 SCSS 註解（純註解，不影響任何實際輸出，可以直接刪除）：
- `.center-box` 區塊內，一段被註解掉的網格背景漸層（註解文字包含「網格背景 TODO.. 先不給」，緊接在目前生效中的十字網格圖案規則之前）
- 第 122 行附近的 `// background-color: blue;` 測試用註解殘留

- [ ] **Step 4: 修正第一處寫死的紅色佔位色**

搜尋 `.user-project-ctrl-box .user-name`（使用者頭像圓圈），找到：
```scss
background-color: red; // TODO... 之後 js 改成動態給予顏色
```
改為：
```scss
background-color: var(--text-faint); // TODO... 之後 js 改成動態給予顏色
```
**保留 TODO 註解文字**，只換顏色值。

- [ ] **Step 5: 這個範圍內的其餘寫死色轉 token**

在這個範圍內（`.AiViewer` 根容器～`.AiViewer-next-option-box`），逐一搜尋以下寫死值並替換：
- `#fff`（純白文字，例如 `.in-multi-choice-mode` 覆蓋層文字、`.user-name` 頭像文字）→ `var(--primary-fg)`
- 任何 `rgba(0, 160, 120, ...)` 字面值（品牌色透明度）→ 依透明度數值對應到最接近的 `var(--primary-a08/-a12/-a20/-a40)`
- 任何 `rgba(255, 255, 255, ...)` 字面值（半透明白底）→ 依透明度數值對應到最接近的 `var(--surface-a90/-a70/-a50)`
- 檢查這個範圍內是否有 `@media (prefers-color-scheme: dark)` 區塊（目前已知第 43-49 行附近有一處）——確認轉成 token 後這個區塊裡的顏色都改用 CSS 變數（而不是寫死的深色 rgba），這樣手動切換 `[data-theme="dark"]` 時也會正確套用，不用另外寫額外邏輯

- [ ] **Step 6: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 7: 執行既有測試套件確認沒有破壞任何東西**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 8: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`：
- 確認左側面板切換按鈕原本就是隱藏的，刪除死按鈕後畫面沒有任何變化（因為它本來就不會顯示）
- 確認多選模式覆蓋層、使用者頭像圓圈顏色在 light/dark 兩種模式下都正確
- 確認 light 模式手動切換到 dark 模式（不是靠 OS 設定）時，這個範圍內的樣式都正確跟著變深色

- [ ] **Step 9: Commit**

```bash
git add src/views/AiViewer.vue src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): 根容器+浮動控制列 token 化，刪除死按鈕與死程式碼註解"
```

---

### Task 2: `StageMap` 迷你地圖 + `AiViewerContentResize` + `AiViewerContentBox`

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（`.StageMap`～`.AiViewerContentBox` 區段）

**Interfaces:**
- Consumes: Task 1 完成後的檔案狀態（純接續，無資料依賴）
- Produces:（本任務無後續任務依賴）

**這個範圍要處理的區段：**
- `.StageMap`（迷你地圖覆蓋層）
- `.AiViewerContentResize`（拖拉調整大小的包裝層——**這個 class 名稱同時被 debug overlay 的 `AiViewerContentResize` 共用，但 debug overlay 本身的樣式在 `.debug-views` 規則裡，屬於 Task 6 的範圍，這裡只處理 `.AiViewerContentResize` 本身的樣式**）
- `.AiViewerContentBox`（實際內容區塊的外框、header、ctrl-box、毛玻璃濾鏡效果）

- [ ] **Step 1: 這個範圍內的寫死色轉 token**

搜尋這個範圍內所有 `rgba(0, 160, 120, ...)` 跟 `rgba(255, 255, 255, ...)` 字面值（`.AiViewerContentBox` 的毛玻璃濾鏡效果大量使用這兩種），對應到最接近透明度的 `var(--primary-a08/-a12/-a20/-a40)` 或 `var(--surface-a90/-a70/-a50)`。

檢查這個範圍內的 `@media (prefers-color-scheme: dark)` 區塊（目前已知第 1244-1247 跟 1447-1450 行附近各有一處），確認顏色改用 token 後能同時正確回應 `[data-theme="dark"]` 手動切換。

- [ ] **Step 2: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 3: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 4: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`：
- 確認迷你地圖顯示正常
- 確認畫布上的內容區塊（拖拉調整大小的毛玻璃效果卡片）在 light/dark 模式下都正確
- 確認手動切換 dark mode 時毛玻璃效果正確變深色

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): StageMap/ContentResize/ContentBox token 化"
```

---

### Task 3: 檔案類型檢視框 + `MemoPaperView` + `FullAiViewerBlockBox` + `oneFileItem` + `AiViewerRecord`

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（檔案檢視框～`AiViewerRecord` 區段）

**Interfaces:**
- Consumes: Task 2 完成後的檔案狀態
- Produces:（本任務無後續任務依賴）

**這個範圍要處理的區段：**
- 各種檔案類型檢視框：`.viewBoxLoading`/`.Failure`、`.otherViewBox`、`.excelViewBox`、`.pdfViewBox`、`.ppfViewBox`、`.txtViewBox`、`.imageViewBox`、`.htmlFileViewBox`、`.markdownViewBox`、`.chartViewBox`、`.wordViewBox`
- `.magic-wand-view`
- `.MemoPaperView`（便利貼/備註 UI）
- `.FullAiViewerBlockBox`（單一區塊全螢幕檢視）
- `.oneFileItem`
- `.AiViewerRecord`（右側面板聊天紀錄項目）
- 翻譯確認卡片、下載清單、快速按鈕（這幾個區塊接續在 `AiViewerRecord` 後面）

- [ ] **Step 1: 修正第二處寫死的紅色佔位色**

搜尋 `.MemoPaperView .memo-content-box .one-memo-msg .comment-header .userNameIcon`，找到：
```scss
background-color: red; // TODO... 之後 js 改成動態給予顏色
```
改為：
```scss
background-color: var(--text-faint); // TODO... 之後 js 改成動態給予顏色
```

- [ ] **Step 2: 刪除這個範圍內已確認的死程式碼註解**

搜尋並刪除：
- `.content-header-box` 區塊內三行被註解掉、從未組成完整規則的漸層樣式（45° 對角線漸層 + 一行孤兒漸層 + 放射狀漸層點狀圖案）
- `.FullAiViewerBlockBox .fullAiViewer-header-box` 裡同樣的 45° 對角線漸層註解殘留
- 第 820 行附近 `// background-color: rgba(red, 0.2);`、第 1385 行附近 `// background-color: rgba(pink, 0.2);` 這兩處開發測試殘留註解

- [ ] **Step 3: 這個範圍內的其餘寫死色轉 token**

依照計畫開頭的顏色對照表，把這個範圍內所有 hex/rgba 字面值轉成對應 token（`#fff` → `--primary-fg`，一般文字灰階 → `--text`/`--text-muted`/`--text-faint`，邊框灰 `#e5e7eb` → `--divider`，等等）。

- [ ] **Step 4: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 5: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 6: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`，開啟任一內容區塊（不同檔案類型）跟備註功能，確認 light/dark 模式下顏色都正確，備註頭像顏色不再是刺眼的紅色。

- [ ] **Step 7: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): 檔案檢視框/MemoPaperView/FullAiViewerBlockBox token 化，修正紅色佔位色"
```

---

### Task 4: Conv2 模式選擇卡片 + Hurricane 銷售結果卡 + Conv2 浮動面板

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（conv2 模式選擇～`.conv2-fp` 區段）

**Interfaces:**
- Consumes: Task 3 完成後的檔案狀態
- Produces:（本任務無後續任務依賴）

**這個範圍要處理的區段：**
- conv2 模式選擇卡片、上傳/動作/產品卡片、標籤
- `.hurricane-result`（銷售資料結果卡，與旅程功能無關）
- conv2 搜尋/比較/初始化清單、網址卡片、直接方法清單、SKU 卡片、報告卡片
- `.conv2-fp`（Conv2 浮動面板：上傳面板、步驟追蹤器、步驟內容、按鈕）

**注意**：這個範圍內的「完成/進行中」狀態顏色（例如 `#166534`/`#f0fdf4`/`#1d4ed8`/`#eff6ff` 的 conv2 步驟追蹤器配色）**跟旅程執行狀態面板（Task 6）語意相同但不是同一組樣式**——這裡的 done/active 狀態一樣對應到 `var(--success)`/`var(--tag-blue-bg)`/`var(--tag-blue-text)`，讓整個 app 的「完成=綠、進行中=藍」語彙一致，但不要去改到 Task 6 範圍內 `.jcd-*`/`.rbox-jcd-*` 的規則。

- [ ] **Step 1: 這個範圍內的寫死色轉 token**

依照顏色對照表轉換，重點包含：
- `#166534`/`#f0fdf4`/`rgba(22,101,52,.28)`（conv2 完成狀態）→ `var(--success)`（文字/邊框）+ 找不到現成的淡綠底色 token 時，比照既有 `--tag-teal-bg` 或 `--hint` 中選一個視覺最接近的（不新增 token）
- `#1d4ed8`/`#eff6ff`（conv2 進行中狀態）→ `var(--tag-blue-text)`/`var(--tag-blue-bg)`
- `#a855f7`/`#4f7fff`/`#ec4899`/相關 rgba（Hurricane 銷售卡漸層/標籤）→ 分別對應到 `var(--tag-violet-text)`/`var(--tag-blue-text)`，粉紅色 `#ec4899` 沒有現成對應 token，選擇視覺最接近的既有分類色（例如 `--tag-violet-text`），不新增粉色 token
- `#f59e0b`（琥珀色統計數字）→ `var(--tag-amber-text)`
- 其餘灰階/白底維持既有對照表規則

- [ ] **Step 2: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 3: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 4: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`，觸發任一 conv2 對話流程（模式選擇卡片、Hurricane 銷售結果卡如果有測試資料的話），確認 light/dark 模式下顏色都正確。

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): conv2 模式選擇/Hurricane結果卡/conv2浮動面板 token 化"
```

---

### Task 5: Conv1 翻譯設定面板 + 待確認卡片 + 空狀態

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（`.conv1-transl-fp`～conv1 空狀態區段）

**Interfaces:**
- Consumes: Task 4 完成後的檔案狀態
- Produces:（本任務無後續任務依賴）

**這個範圍要處理的區段：**
- `.conv1-transl-fp`（Conv1 翻譯設定步驟面板）
- `.tc-pending-card`（未確認狀態卡片）
- `.ai-processing-dots` 動畫
- `.conv1-transl-action-bar`
- conv1 空狀態覆蓋層、圓點、離開列

- [ ] **Step 1: 刪除第 1385 行附近已在 Task 3 處理過的殘留註解（若有遺漏則在這裡補刪）**

執行 `grep -n "background-color: rgba(pink" src/scss/views/_AiViewer.scss` 確認 Task 3 已經清乾淨，若還有殘留則刪除。

- [ ] **Step 2: 這個範圍內的寫死色轉 token**

重點包含：
- `rgba(207,138,31,...)` 警告標籤底色 → `var(--warning)` 相關的淡色（這個 token 系統沒有 `--warning-soft`，選用視覺最接近的既有淡色 token，例如 `--tag-amber-bg`，因為警示琥珀色系跟 amber 分類色視覺相近）
- `#dc2626`（`.conv2-err` 錯誤文字——雖然 class 名稱是 conv2 但實際在這個範圍內，请依實際 grep 結果為準）→ `var(--danger)`
- 其餘灰階/白底維持既有對照表規則

- [ ] **Step 3: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 4: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 5: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`，觸發任一 conv1 翻譯設定流程，確認 light/dark 模式下顏色都正確，錯誤訊息顏色正確顯示為危險色。

- [ ] **Step 6: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): conv1 翻譯設定面板/待確認卡片/空狀態 token 化"
```

---

### Task 6: 旅程執行狀態面板（浮動抽屜 + FAB + 右側面板分頁）+ Debug Overlay Token 化 + 孤兒 Keyframe 清理

**這是這次 phase 在 spec 裡特別點名的任務**——讓 AiViewer 內嵌的旅程面板跟獨立的 `JourneyDashboard.vue` 視覺一致。

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（`@keyframes journey-blink` 刪除、`.debug-views`、`.journey-canvas-drawer`、`.journey-canvas-fab`、`.jcd-highlight-*`、`.rbox-journey-area`、`.rbox-jcd-*` 區段）

**Interfaces:**
- Consumes: Task 5 完成後的檔案狀態；`JourneyDashboard.vue`（Phase 4/5 已建立）用的 token 語彙：`--success`（完成）、`--tag-blue-bg`/`--tag-blue-text`（執行中）、`--divider`/`--text-faint`（尚未開始/中性）
- Produces:（本任務無後續任務依賴，但完成後應與 `JourneyDashboard.vue` 視覺一致，供人工比對驗證）

- [ ] **Step 1: 刪除孤兒 `@keyframes journey-blink`**

搜尋 `@keyframes journey-blink`，確認內容是：
```scss
@keyframes journey-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
```
執行 `grep -rn "journey-blink" src/` 確認除了這個定義本身之外，沒有任何 `animation: journey-blink` 的引用（`JourneyDashboard.vue` 已經改用 `jd-blink`），確認後整段刪除。

- [ ] **Step 2: `.debug-views` 顏色轉 token（不要刪除這個區塊——這是真的在用的 debug 功能）**

搜尋 `.debug-views`，把裡面的寫死色依對照表轉成 token。**不要移除任何規則或改變版面配置，只換顏色值。**

- [ ] **Step 3: 旅程面板（`.journey-canvas-drawer`、`.journey-canvas-fab`、`.jcd-*`）顏色轉成 `JourneyDashboard.vue` 的同一套 token**

依照下表把旅程相關的顏色全部替換（這些顏色目前也被非旅程的其他區塊共用同一個 hex 值，**只替換選擇器路徑落在 `.journey-canvas-drawer`/`.journey-canvas-fab`/`.jcd-*` 底下的規則，不要動到其他區塊已經在 Task 1-5 處理過、或還沒處理但屬於別的功能的同名 hex 值**）：

| 概念 | 目前寫死值 | 換成 |
|---|---|---|
| 完成（節點填色/圓點/標籤底色+文字） | `#16a34a`、`rgba(22,163,74,.12)` | `var(--success)`（文字/圖形色）、`var(--tag-teal-bg)`（標籤底色，視覺最接近既有淡色 token） |
| 執行中（節點填色/圓點/標籤底色+文字/FAB 光暈） | `#3b72f6`、`rgba(59,114,246,.12/.2/.35/.45)` | `var(--tag-blue-text)`（文字/圖形色）、`var(--tag-blue-bg)`（標籤底色）；FAB 光暈的 rgba 透明度層次比照選用最接近的 `--tag-blue-*` 或 `--primary-a*` 系列 |
| 尚未開始/中性 | `#e5e7eb` | `var(--divider)` |
| 節點/次要文字標籤 | `#9ca3af` | `var(--text-faint)` |
| 生日旅程強調色（`.jcd-highlight-birthday`） | `#7c3aed`、`rgba(124,58,237,...)` | `var(--tag-violet-text)`（既有分類色，語意上代表「另一種旅程類型」而非狀態，用既有的紫色分類 token 表示區別） |
| FAB 提醒角標（未讀/警示） | `#ef4444` | `var(--danger)` |

- [ ] **Step 4: 右側面板旅程分頁（`.rbox-journey-area`、`.rbox-jcd-*`）套用同一套對照表**

這個區段是右側面板裡的旅程分頁內容，跟 Step 3 的浮動抽屜是同一個功能的兩處不同 UI 呈現，套用完全相同的對照表。

- [ ] **Step 5: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 6: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 7: 手動視覺檢查 + 跟 JourneyDashboard 比對**

啟動 `npm run dev`：
- 打開 `/view/AiViewer`，觸發旅程執行狀態浮動抽屜/FAB，確認 light/dark 模式下顏色正確
- 開另一個分頁打開 `/view/journeys`（`JourneyDashboard.vue`），視覺比對兩處的完成/執行中/尚未開始三種狀態顏色是否一致（不用像素級比對，確認同樣是「綠=完成、藍=執行中、灰=尚未開始」的語彙一致即可）
- 確認 `?debug=true` 觸發的 debug overlay 功能正常運作，顏色在 light/dark 下都正確
- 開啟「減少動態效果」系統偏好設定，確認這個區段既有的動畫效果（例如 FAB 的 pop transition）仍正常運作（這次沒有新增或修改動畫邏輯，只是確認顏色轉換沒有意外破壞任何 transition）

- [ ] **Step 8: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): 旅程執行狀態面板改用 JourneyDashboard 同一套 token，清理孤兒 keyframe，debug overlay token 化"
```

---

### Task 7: 右側面板分頁列 + 成效報告分頁

**Files:**
- Modify: `src/scss/views/_AiViewer.scss`（`.rbox-tab-bar`、`.rbox-analytics` 區段）

**Interfaces:**
- Consumes: Task 6 完成後的檔案狀態
- Produces:（本任務無後續任務依賴——這是本計畫的最後一個任務）

**這個範圍要處理的區段：**
- `.rbox-tab-bar`（右側面板通用分頁列，多個分頁共用，不是旅程專屬）
- `.rbox-analytics`（成效報告分頁，統計卡片、圖表卡片，跟旅程功能是不同的獨立功能）

- [ ] **Step 1: 這個範圍內的寫死色轉 token**

依照顏色對照表轉換這個範圍內剩餘的寫死色。

- [ ] **Step 2: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 3: 執行既有測試套件**

Run: `npm run test:unit`
Expected: 全部通過

- [ ] **Step 4: 全檔案寫死色最終掃描**

執行以下指令，確認整個 `_AiViewer.scss` 已經沒有殘留的寫死色（除了刻意保留的例外——目前已知沒有任何品牌色例外需要保留，跟 Phase 5 的 DataSourceTab 第三方品牌色情況不同）：

```bash
grep -n "#[0-9a-fA-F]\{3,6\}" src/scss/views/_AiViewer.scss
grep -n "rgba([0-9]" src/scss/views/_AiViewer.scss
```

Expected: 除了明確是通用陰影效果（`rgba(0,0,0,0.0X)` 這類跟品牌/狀態顏色無關的陰影黑）、或 `rgba($scss-variable, ...)`/`rgba(var(--token), ...)` 這種已經是變數/token 只是語法上包在 rgba() 裡的用法之外，不應該再有任何字面 RGB 數字或 hex 色碼殘留。如果掃描出還有漏網的，回頭找到對應的區塊（可能落在 Task 1-6 已經處理過的範圍，代表當時漏掉了）補上轉換。

- [ ] **Step 5: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/AiViewer`，切到右側面板的各個分頁，確認分頁列樣式跟成效報告分頁在 light/dark 模式下都正確。

- [ ] **Step 6: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "refactor(AiViewer): 右側面板分頁列/成效報告分頁 token 化，最終寫死色掃描"
```

---

## 執行後檢查

七個任務都完成後，執行一次全套驗證：

```bash
npm run test:unit
npm run build
npm run type-check
npm run lint
```

`test:unit`、`build` 必須全部通過；`type-check`、`lint` 只需確認沒有比修改前更多的錯誤數（既有技術債不在本次範圍）。

另外執行一次完整的手動視覺巡覽：`npm run dev` 打開 `/view/AiViewer`，依序確認左右面板、迷你地圖、各種內容區塊類型、conv1/conv2 對話流程、旅程執行狀態面板、debug overlay、右側面板所有分頁，在 light 跟 dark 兩種模式下都沒有顏色跑掉或看起來像是誤觸的深色塊。
