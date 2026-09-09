# 畫布拖曳/縮放元件替換設計

**日期**：2026-09-09
**狀態**：待審閱

## 背景與問題

`AiViewerContentBox.vue`（畫布區塊本體）目前用 `@gausszhou/vue3-drag-resize-rotate`（一個已停止維護、最新版仍是 `3.0.2`、宣告相容 `vue: ^3.2.37` 的第三方套件）處理每個畫布區塊的拖曳與縮放。

這個套件跟目前專案的 Vue 版本（`^3.5.18`）有已知相容性問題：它渲染 8 個縮放控制點（`tl/tm/tr/mr/br/bm/bl/ml`）時呼叫 Vue 內部的 `renderSlot`，觸及 Vue 3.4+ 對「hoisted vnode 搭配 slot 渲染時機」更嚴格的內部檢查，導致 `renderSlot` 內部讀取 `currentRenderingInstance.ce` 時對象是 `null`，拋出：

```
TypeError: Cannot read properties of null (reading 'ce')
```

這個例外目前已經用 `onErrorCaptured`（error boundary）攔截，讓崩潰的區塊改顯示「此區塊無法顯示」佔位框，避免拖垮整個畫布／頁面（見 `AiViewerContentBox.vue` 的 `hasRenderError`）。但這只是止血，被攔到的區塊本身依然無法正常顯示內容或被拖曳/縮放。

實測發現這個崩潰會發生在**任何**啟用縮放控制點的區塊類型上（`IMAGE`／`HTML`／`PDF`／`EXCEL`／`TXT`／`MD`／`CHART`／`REPORT`，見 `AiViewerContentBox.vue:43-57` 的 `:resizable` 判斷式），且觸發時機看起來跟畫面更新時機有關、不是每次都會發生——但只要發生，該區塊就完全無法使用。

## 目標

寫一個新元件 `src/components/AiViewer/DragResizeBox.vue`，取代 `VueDragResizeRotate`，做為現有畫布區塊拖曳/縮放互動的直接替換（drop-in replacement）：

- 徹底移除對 `@gausszhou/vue3-drag-resize-rotate` 的依賴，從根本解決 Vue 版本不相容問題
- 對外的 props / events / slots 介面跟現有用法保持一致，讓 `AiViewerContentBox.vue` 現有的業務邏輯（`handleResizeDrag`／`checXY`／`activated`／多選同步拖曳／`_AiViewer.scss` 既有樣式）**不需要修改**
- 使用瀏覽器原生 **Pointer Events API**（`pointerdown`/`pointermove`/`pointerup`），統一處理滑鼠與觸控，不用像舊套件那樣分開維護兩套邏輯

## 範圍確認（已與使用者對過）

**保留**：
- 觸控裝置拖曳/縮放（手機/平板）
- 寬高比鎖定（`lockAspectRatio`，由 Shift 鍵觸發，觸控裝置強制關閉——這個開關邏輯在 `AiViewer.vue` 裡，元件本身只要正確吃 `lockAspectRatio` prop 即可）
- 多選區塊一起拖曳——**這其實不是套件的功能**，是 `AiViewerContentBox.vue` 自己在 `checXY`（拖曳結束回呼）裡算座標差值、手動同步給其他被選取區塊（`AiViewerContentBox.vue:556-576`）。新元件只要在拖曳結束時正確觸發 `dragstop` 事件並回報最終座標，這段既有邏輯就會繼續正常運作，**不需要在新元件裡重新實作**
- 對齊格點（snap to grid）：現況是 `:snap="true" :snapToGrid="false" :grid="[2,2]"`，做基本版（吸附到 2px 格點）即可，跟現有效果一致

**不做**：
- 旋轉功能（全站兩處用法的 `:rotatable` 都寫死 `false`，確認沒人在用）
- `AiViewer.vue` 裡那個隱藏 debug 面板（`v-if="lookDebug"`）的用法——它的 `draggable`/`resizable` 全部是 `false`，其實只是拿新元件當一個定位容器用，不涉及任何拖曳/縮放邏輯，直接換成一般 `<div>` 加 inline style 定位即可，不需要透過新元件

## 元件設計

### 對外介面（對照現有 `VueDragResizeRotate` 用法逐一列出）

| 現有 prop/event | 新元件對應 | 說明 |
|---|---|---|
| `:x` `:y` `:w` `:h` | 相同 | 區塊位置與尺寸（畫布座標系，不含縮放） |
| `:minWidth` `:minHeight` `:maxWidth` `:maxHeight` | 相同 | 縮放邊界 |
| `:draggable` `:resizable` | 相同 | 是否允許拖曳/縮放 |
| `:lockAspectRatio`（現有寫成 `:lock-aspect-ratio`） | `:lockAspectRatio` | 縮放時鎖定寬高比 |
| `:active` | 相同 | 是否為目前選取中的區塊（影響 class） |
| `:z` | 相同 | z-index |
| `:snap` `:grid` | 相同 | 對齊格點（`grid` 預設 `[2,2]`） |
| `:parent="false"` | 不需要 | 舊套件用來決定是否限制在父層容器內；新元件固定不限制（跟現況行為一致） |
| `:scaleRatio="1"` | 不需要 | 舊套件的縮放補償係數，專案裡永遠寫死 `1`（見程式碼註解：刻意不用實際縮放比例，避免多人協作時座標不同步），新元件直接不提供這個 prop，維持一樣「不做縮放補償」的行為 |
| `:enable-native-drag="false"` | 不需要 | 新元件本來就不使用瀏覽器原生 HTML5 drag-and-drop，用 pointer events 實作，無此問題 |
| `:aspectRatio`（`props.aspectRatio`，會傳到 `outsideAspectRatio`） | `:aspectRatio` | 外部指定的寬高比（目前全部呼叫端都傳 `false`，先保留 prop 但不強求完整驗證） |
| `@activated` | 相同 | 使用者點擊/觸碰區塊時觸發（不帶參數） |
| `@resizing` `@dragging` | 相同 | 拖曳/縮放進行中，持續觸發 `(x, y, width, height)` |
| `@resizestop` `@dragstop` | 相同 | 拖曳/縮放結束，觸發 `(x, y)` |
| `v-slot:tl/tm/tr/mr/br/bm/bl/ml` | 相同 | 8 個縮放控制點的插槽（角落 4 個 + 邊 4 個），內容由呼叫端提供 icon |
| 預設 slot | 相同 | 區塊內容本身 |
| `class` fallthrough（`isActive`/`isMultiActive`/`isDragResize`/`isTouch` 等） | 相同 | Vue 對元件的 `:class` 綁定會自動 fallthrough 到元件根元素，新元件維持單一根元素即可，呼叫端不需修改 |

### 根元素與既有 CSS 相容性

舊套件會在根元素加上 `vue-drag-resize-rotate` class，並依狀態加上 `active`/`draggable`/`resizable`/`dragging`/`resizing`；每個控制點 div 加上 `handle` + `handle-<position>`（如 `handle-tl`）。`_AiViewer.scss` 裡有直接依賴這些 class 名稱的既有樣式（例如 `.AiViewerContentResize.isActive .vue-drag-resize-rotate { border-radius: 12px }`、`.isTouch .handle { border-color: transparent }`）。

新元件的根元素與控制點 **沿用完全相同的 class 命名慣例**，這樣 `_AiViewer.scss` 完全不用修改。

### 座標系統

區塊位置存在畫布的「未縮放邏輯座標」裡（`aiViewerBlocks` 陣列的 `x`/`y`/`width`/`height`），實際視覺縮放由外層 `.scaleBox` 的 CSS transform（`scale + translate`）統一處理。新元件監聽 pointer 事件取得的是「螢幕像素位移」，需要除以 `.scaleBox` 目前的縮放比例才能還原成正確的邏輯座標位移——這點舊元件雖然把 `scaleRatio` 寫死成 `1`（不做縮放補償），但專案註解說明這是**刻意**的權衡（避免多人協作座標不同步的問題），所以新元件延續同樣的簡化：**不做縮放補償**，維持跟現有行為一致，不在這次順便修正。

### 觸控與滑鼠統一處理

用 `pointerdown`/`pointermove`/`pointerup` 監聽，透過 `event.pointerType`（`'mouse'` | `'touch'` | `'pen'`）分辨裝置類型：
- 觸控時放大控制點的可點擊熱區（比照現有 `isTouchDevice` 讓控制點視覺變大的邏輯）
- 觸控時停用寬高比鎖定（跟現有 `isAspectRatioMode = isTouchDevice ? false : isShift` 邏輯一致，這段判斷在呼叫端 `AiViewer.vue`，元件本身只要老實吃 `lockAspectRatio` prop 值即可）
- 監聽 `pointerdown` 時呼叫 `element.setPointerCapture(event.pointerId)`，確保拖到元素外面時仍能持續收到 `pointermove`/`pointerup`（原生 API 內建能力，舊套件用滑鼠事件模擬觸控時反而容易在快速滑動時失焦）

### 縮放控制點行為

8 個控制點（四角 `tl/tr/bl/br` + 四邊中點 `tm/bm/ml/mr`），每個對應調整寬高的方向組合（例如 `tl` 同時調整 x/y/width/height，`tm` 只調整 y/height）。縮放時套用 `minWidth`/`maxWidth`/`minHeight`/`maxHeight` 邊界；`lockAspectRatio` 為真時，依原始寬高比例連動調整另一軸。

### 對齊格點

`snap` 為真時，把計算出的 x/y（拖曳）或 width/height（縮放）四捨五入到最接近的 `grid[0]`/`grid[1]` 倍數，跟現有 `grid=[2,2]` 效果一致。

## 檔案異動

- **新增** `src/components/AiViewer/DragResizeBox.vue`
- **修改** `src/components/AiViewer/AiViewerContentBox.vue`：把 `<VueDragResizeRotate>` 換成 `<DragResizeBox>`，移除 `import VueDragResizeRotate from "@gausszhou/vue3-drag-resize-rotate"`；**保留** `hasRenderError`/`onErrorCaptured`/`.block-render-error`——雖然這次要修的崩潰源頭消失了，但這層 error boundary 幾乎零成本、又能防住「這個區塊以外」未來任何其他原因造成的渲染例外（例如某個 viewBox 元件本身的 bug），屬於通用的防護網，不因為這次根因解決就該拿掉
- **修改** `src/views/AiViewer.vue`：把那個 debug 面板的 `<VueDragResizeRotate>` 換成 `<div>` + inline style 定位，移除對應 import
- **移除** `package.json` 裡的 `@gausszhou/vue3-drag-resize-rotate` 依賴（連同 `npm uninstall`，並確認 `package-lock.json` 更新）
- `_AiViewer.scss` **不需要修改**（class 命名沿用，見上）

## 測試計畫

專案沒有針對畫布拖曳/縮放的既有自動化測試（`test:unit`/`test:e2e` 都沒有覆蓋這塊）。驗證方式：

1. `npm run type-check` / `npm run lint` — 確認沒有新增錯誤
2. `npm run dev` + 手動操作驗證（用瀏覽器自動化工具模擬滑鼠與觸控事件）：
   - 拖曳單一區塊到新位置，鬆手後座標正確保留
   - 用 8 個控制點各自縮放，確認方向正確、`min/max` 邊界生效
   - 按住 Shift 縮放，確認寬高比鎖定
   - 多選 2+ 個區塊後拖曳其中一個，確認其他區塊跟著位移相同差值
   - 模擬觸控事件（`pointerType: 'touch'`）走一次拖曳/縮放
   - 確認先前會崩潰的區塊類型（TXT/EXCEL/HTML report）現在能正常顯示內容，不再出現「此區塊無法顯示」
   - 確認 console 沒有新的錯誤或警告

3. 不會另外新增 Playwright e2e 測試框架或測試案例——這是既有demo 專案的既定範圍，維持現況（手動驗證為主）

## 風險與限制

- **座標縮放補償**：如前述，新元件延續現有「不做縮放補償」的簡化行為，如果這件事本身在極端縮放比例下有座標偏移的問題，屬於既有行為，不在這次修復範圍內
- **這是重寫，不是移植**：舊套件內部可能還有一些沒被目前程式碼用到、但未來可能被需要的邊界情況處理（例如衝突偵測 `isConflictCheck`、對齊容器邊界 `snapBorder`），新元件不會實作這些目前沒被使用的功能
- **回歸風險**：畫布拖曳/縮放是核心互動，雖然新元件介面設計成跟舊的一致、呼叫端程式碼不用改，但實際手感（例如慣性、邊界回彈）可能跟舊套件略有差異，需要實際手動操作比對

## 待實作計畫階段確認的細節

以下是寫實作計畫（implementation plan）時需要在動手前先確認、但不影響這份設計整體方向的技術細節：
- 8 個控制點各自確切的游標樣式（`nwse-resize`/`ns-resize` 等）與現有 CSS 是否已經定義好（`.handle-tl` 等 class 名稱沿用後，游標樣式應該會自動繼承現有 `_AiViewer.scss` 規則，需要實作時逐一核對）
- `dragHandle`/`dragCancel`（限定用某個子元素才能發動拖曳／排除某元素不觸發拖曳）目前專案程式碼裡沒有明確用到這兩個 prop，實作時需要確認是否有隱性依賴
