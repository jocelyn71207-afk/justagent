# API 模擬器設計 Spec

**目標：** 在不串接真實後端的前提下，為整個 demo site 加入完整的 API 互動體驗——包含 loading 狀態、error 狀態、分頁延遲模擬，以及一個可即時切換模式的 Dev Toggle 面板。

---

## 核心架構

### `apiSimulatorStore`（Pinia setup store）

管理全域模擬狀態：

```ts
{
  mode: 'normal' | 'loading' | 'error'  // 預設 'normal'
  delay: 200 | 500 | 1000 | 2000        // ms，預設 500
  errorMessage: string                   // 預設 '伺服器發生錯誤，請稍後再試'
}
```

狀態持久化到 `localStorage`（key: `api-simulator`），重新整理後保留上次設定。

---

### `useApiCall<T>()` composable

所有頁面的資料讀取統一走這個 composable：

```ts
const { data, isLoading, hasError, retry } = useApiCall(() => getData())
```

內部行為：

| mode | 行為 |
|------|------|
| `normal` | 等待 `delay` ms 後回傳 mock data |
| `loading` | 永遠 pending，不 resolve（直到切換模式） |
| `error` | 等待 `delay` ms 後 reject，觸發 `hasError = true` |

- `retry()` 重新執行一次 fetch 流程
- 當 `apiSimulatorStore.mode` 改變時，所有活躍的 `useApiCall` 自動重新執行

---

## Dev Toggle 浮動面板（`AppDevToggle.vue`）

### 位置與外觀

- 固定在畫面**右下角**，`position: fixed; bottom: 24px; right: 24px; z-index: 9999`
- 預設**收合**：只顯示一個 32px 圓形按鈕（⚙ 圖示）
- 點擊後展開完整面板（向上展開，寬 240px）

### 面板內容

```
┌─────────────────────────────┐
│  ⚙ API 模擬器               │
├─────────────────────────────┤
│  模式                        │
│  ● 正常   ○ 載入中   ○ 錯誤 │
├─────────────────────────────┤
│  延遲時間                    │
│  [ 500ms ▼ ]                │
│  選項：200 / 500 / 1000 / 2000 |
├─────────────────────────────┤
│  錯誤訊息（mode=error 時）   │
│  [ 伺服器發生錯誤...     ]   │
└─────────────────────────────┘
```

### 行為

- 切換模式後**立即生效**，所有 `useApiCall` 監聽的頁面同步進入新狀態
- 切回「正常」後自動 retry，資料重新顯示
- **只在 `import.meta.env.DEV === true` 時渲染**，不進 production build

---

## Loading UI 策略

| 場景 | UI 元件 |
|------|---------|
| 列表頁（KnowledgeBase、ResourceLibrary、ProjectList） | `<AppSkeleton type="list" />` — 5 列灰色骨架列 |
| 詳情頁（KnowledgeDetail、AiViewer） | `<AppSkeleton type="detail" />` — 標題 + 段落骨架 |
| Modal / Drawer | `<AppSkeleton type="card" />` — 內容區 spinner 覆蓋 |
| 頁面切換（vue-router） | 頂部細 progress bar（NProgress 或手刻） |

`AppSkeleton` 接受 `type: 'list' | 'card' | 'detail'` prop，用 CSS animation `shimmer` 呈現掃光效果。

---

## Error UI 策略

| 場景 | UI 元件 |
|------|---------|
| 全頁錯誤（列表頁、詳情頁） | `<AppErrorState />` — 頁面中央 Error Card |
| Modal 內錯誤 | `<AppErrorState inline />` — inline 樣式，不全頁覆蓋 |

`AppErrorState` props：
- `message: string` — 錯誤訊息（來自 `apiSimulatorStore.errorMessage`）
- `inline?: boolean` — 是否使用 inline 樣式
- emit `@retry` — 觸發 `useApiCall` 的 `retry()`

Error Card 內容：`⚠ 圖示 + 錯誤訊息 + 「重試」按鈕`

---

## 頁面整合模式（統一模板）

所有頁面改為以下結構：

```vue
<AppSkeleton v-if="isLoading" type="list" />
<AppErrorState
  v-else-if="hasError"
  :message="errorMessage"
  @retry="retry"
/>
<div v-else>
  <!-- 原本的頁面內容 -->
</div>
```

---

## 新建檔案清單

| 檔案 | 說明 |
|------|------|
| `src/stores/apiSimulatorStore.ts` | 模式/延遲/錯誤訊息狀態 |
| `src/composables/useApiCall.ts` | 通用非同步包裝 composable |
| `src/components/AppDevToggle.vue` | 右下角浮動 Dev Toggle 面板 |
| `src/components/AppSkeleton.vue` | 骨架元件（type: list/card/detail） |
| `src/components/AppErrorState.vue` | 錯誤畫面元件 |
| `src/scss/components/_AppSkeleton.scss` | 骨架動畫樣式（shimmer） |
| `src/scss/components/_AppDevToggle.scss` | Dev Toggle 面板樣式 |

## 修改檔案清單

| 檔案 | 改動 |
|------|------|
| `App.vue` | 掛載 `<AppDevToggle />`、頂部 progress bar |
| `src/router/index.ts` | router beforeEach/afterEach 觸發 progress bar |
| `src/views/KnowledgeBase.vue` | 改用 `useApiCall`，加 skeleton/error |
| `src/views/KnowledgeDetail.vue` | 改用 `useApiCall`，加 skeleton/error |
| `src/views/ResourceLibrary.vue` | 改用 `useApiCall`，加 skeleton/error |
| `src/components/ProjectListContent/ProjectListContent.vue` | 改用 `useApiCall`，加 skeleton/error |
| 各 Modal / Drawer 元件 | 開啟時用 `useApiCall` 模擬載入，內部加 skeleton |
| `src/scss/components/_index.scss` | `@forward` 兩個新 SCSS 檔 |

---

## 不在此範圍內

- 真實 API 串接（endpoint、response mapping）
- 分頁 API 的 cursor / page token（只模擬 delay，資料一次全回）
- WebSocket / SSE 模擬
