# 專案 Agent 指派與分工顯示設計 spec

**日期：** 2026-09-04
**功能：** 建立/設定專案時可選擇要用哪些角色化 Agent；當專案指派了「產品助理＋數據經理」這個組合時，AiViewer 提供一個分工對話 demo，訊息依角色標示是哪個 Agent 回覆的

---

## 1. 背景與目標

延續 JustAgent 架構文件 3.1 節「角色化 Subagent（產品助理／數據分析／行銷專家／商業分析）」的概念，讓 demosite 具備「專案可以選擇要用哪些 Agent，專案內這些 Agent 直接分工」的產品體驗雛型。

這輪範圍刻意收斂在「視覺上標示誰回覆」這個層級（訊息帶角色標籤、各自從自己角度回一段話），不做真正的任務拆分/派工狀態機——那是更大規模的工作，YAGNI，先驗證分工顯示的體驗好不好用。

## 2. 範圍

### 2.1 這輪要做

1. 統一目前三處互不一致的 Agent 假資料，改成單一共用清單
2. `ProjectSettingModal.vue` 的「使用的Agent」欄位從純文字 autocomplete 升級為角色卡片式多選
3. 專案卡片開啟 AiViewer 時，把該專案指派的 Agent 一併帶過去（AiViewer 目前完全沒有讀專案資料，這輪補上這條線）
4. `ProjectUseAngentModal.vue` 改顯示真實資料（取代目前寫死的 5 個不相干名稱）
5. 新增一個分工對話 demo（conv9）：僅當專案指派的 Agent 剛好是「產品助理＋數據經理」組合時才出現入口，觸發方式比照 conv8（工具箱項目 + 打字關鍵字雙入口）
6. 對話河道訊息 UI 新增「角色標籤」顯示機制，讓分工對話裡每則 AI 訊息清楚標示是哪個角色回覆

### 2.2 這輪不做（明確排除）

- **不做真正的任務拆分/派工邏輯**：分工內容是腳本，不是系統依任務動態決定該找哪個 Agent
- **不做其他 Agent 組合的分工腳本**：只做「產品助理＋數據經理」這一組demo；其他組合（如行銷專員＋商業分析）只是可以選、可以存，但進 AiViewer 沒有對應腳本，不報錯、就是沒有入口
- **不動 `skillStore.ts` 的 `assignedAgents`**：那是「Skill 指派給哪些 Agent 可調用」的不同領域功能，命名雖然相似但語意不同，不共用清單、不一併重構
- **不做跨分頁/後端持久化**：專案的 Agent 指派這輪只存在 query string + 前端 mock 資料裡，重新整理分頁狀態還在（因為在 URL 上），但關掉分頁沒有真正保存

## 3. 現況相關機制（既有程式碼調查結果）

### 3.1 三處互不一致的 Agent 假資料

| 位置 | 現有清單 | 問題 |
|---|---|---|
| `ProjectSettingModal.vue` `totalAgent`（[L130-135](../../../src/components/AiViewer/ProjectSettingModal.vue#L130)） | `agentA`數據分析／`agentB`業務助理／`agentC`行銷專員員員…（**重複近 40 個「員」字的資料 bug**）／`agentD`行銷主管 | 4 個選項，label 有明顯錯字 bug |
| `ProjectListContent.vue` `agentTabs`（[L375-379](../../../src/components/ProjectListContent/ProjectListContent.vue#L375)） | `testAgent1`業務助理／`testAgent2`數據分析／`testAgent3`行銷專員 | 只有 3 個，id 跟上面那組完全不共用（`testAgent1` vs `agentB`） |
| `skillStore.ts` `AVAILABLE_AGENTS`（`SkillEditor.vue` [L230-234](../../../src/views/SkillEditor.vue#L230)） | 通用助理／客服中心助理／電商小幫手／知識管理助理／會議記錄助理／工程助理／業務分析助理／倉儲管理助理 | 不同領域（Skill 指派），這輪不動 |

### 3.2 專案資料現況

`ProjectListContent.vue` 沒有獨立的 `interface Project`，専案清單是 component-local 的 `any` 假資料（`projectListData = ref([]) as any`），欄位包含 `agents: string[]`（例如 `['testAgent1']`），用於現有的 `filterAgent` 篩選。

### 3.3 專案 → AiViewer 的既有導覽（半成品）

`gotoAiViewer()`（[ProjectListContent.vue:456-459](../../../src/components/ProjectListContent/ProjectListContent.vue#L456)）已經會用 `router.resolve({ name: 'AiViewer', query: { id: item.id } })` 開新分頁，**但 `AiViewer.vue` 完全沒有讀這個 query**——`projectId` 目前寫死 `'test'`（[AiViewer.vue:328-332](../../../src/views/AiViewer.vue#L328)），`ProjectUseAngentModal` 拿到的也是這個寫死值，且它的 `getUseAngent()` 內部根本沒用 `projectId` 查任何資料，畫面上的 5 個 Agent 名稱直接寫死在 template 裡。

由於 `gotoAiViewer` 用 `window.open(..., '_blank')` 開新分頁，新分頁是全新的 Pinia store 實例，沒辦法直接讀舊分頁 `ProjectListContent.vue` component-local 記憶體裡的資料——這是這次要解決的核心限制。

### 3.4 conv7/conv8 腳本模式（沿用）

`useReportAssemblyConversation.ts`／`useSecurityAuditConversation.ts` 已建立的慣例：獨立 composable 管理 `convNMsgs` ref + `convNInitFlow()`，工具箱項目跟打字關鍵字都能觸發，結尾用 `addReportBlock()` 在畫布放一個靜態 HTML Block。`AiViewerRightBox.vue` 每新增一個 convN 都要手動接 5 個點：`testMsgs` computed、`resetConversation()`、`currentConversationTitle`、工具箱項目/關鍵字分支、（若有自訂按鈕）`handleChatAreaClick()`。這輪的 conv9 照樣走這套慣例。

### 3.5 訊息渲染現況

`AiViewerRecord.vue` 的 `.ai-avatar`（[L7](../../../src/components/AiViewer/AiViewerRecord.vue#L7)）目前固定顯示文字「AI」，沒有依訊息來源顯示不同角色。`ChatMessage` 型別（`skillStore.ts`）的 `role` 只有 `'user' | 'agent'` 二元值，這是 Skill 測試對話用的型別，跟 AiViewer 的訊息物件（目前是鬆散的 `any`）是兩套不相關的資料結構。

## 4. 架構設計

### 4.1 統一 Agent 清單

新增 `src/constants/agents.ts`：

```typescript
export interface AgentOption {
  id: string      // 沿用 ProjectSettingModal 現有 id，避免既有 project.agents 資料全部要改
  label: string
  icon: string     // Material Symbols icon 名稱，供角色卡片與訊息角色標籤共用
}

export const AGENT_OPTIONS: AgentOption[] = [
  { id: 'agentB', label: '產品助理', icon: 'inventory_2' },
  { id: 'agentA', label: '數據經理', icon: 'bar_chart' },
  { id: 'agentC', label: '行銷專員', icon: 'campaign' },
  { id: 'agentD', label: '行銷主管', icon: 'supervisor_account' },
]

export function getAgentOption(id: string): AgentOption | undefined {
  return AGENT_OPTIONS.find(a => a.id === id)
}
```

- `id` 沿用現有的 `agentA-D`（只有 label 依這次確認的命名調整：`agentB` 原「業務助理」改「產品助理」，`agentA` 原「數據分析」改「數據經理」），`agentC` 順手修正錯字 bug。
- `ProjectSettingModal.totalAgent` 與 `ProjectListContent.agentTabs` 都改成 import `AGENT_OPTIONS`，移除各自的假資料常數。
- `ProjectListContent.vue` 現有 mock 專案資料裡的 `agents: ['testAgent1', ...]` 全部改成對應的真實 id（`testAgent1→agentB`、`testAgent2→agentA`、`testAgent3→agentC`，依語意對應：業務助理是舊名對應到現在的產品助理 id）。

### 4.2 ProjectSettingModal「使用的Agent」升級

原本的 `compAutocomplete` 下拉＋已選 chip 清單，改成角色卡片多選（比照 `SkillEditor.vue` 現有的 chip 多選 pattern，這次多帶一個 icon）：

```
┌─────────────────────────────┐
│ 使用的 Agent                  │
│ ┌──────────┐ ┌──────────┐    │
│ │ 📦 產品助理 ✓│ │ 📊 數據經理 ✓│    │
│ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐    │
│ │ 📢 行銷專員  │ │ 🧑‍💼 行銷主管  │    │
│ └──────────┘ └──────────┘    │
└─────────────────────────────┘
```

點擊卡片 toggle 選取狀態（`selectedAgent` 從清單改存 `string[]` 的 id 陣列，语意不變，只是輸入元件換掉）。`saveProjectSetting()` 存檔時把 `selectedAgent` 寫進專案資料的 `agents` 欄位（沿用現有欄位名，這輪維持前端 mock，不新增真實 API）。

### 4.3 專案 → AiViewer 帶入 Agent 資訊

`gotoAiViewer()` 導覽時，query 一併帶上 `agents`：

```typescript
function gotoAiViewer(item: any) {
  const { href } = router.resolve({
    name: 'AiViewer',
    query: { id: item.id, agents: (item.agents ?? []).join(',') }
  });
  window.open(href, '_blank', 'noopener');
}
```

`AiViewer.vue` 新增 `useRoute()`，解析 `route.query.agents`（逗號分隔字串 → id 陣列），取代寫死的 `projectId: 'test'`：

```typescript
const route = useRoute();
const currentProjectId = computed(() => (route.query.id as string) || 'test');
const currentProjectAgentIds = computed(() =>
  typeof route.query.agents === 'string' && route.query.agents
    ? route.query.agents.split(',')
    : []
);
```

`ProjectUseAngentModal.vue` 改吃 `currentProjectAgentIds`（透過 prop 或直接注入，實作時依現有 prop 傳遞慣例決定），用 `getAgentOption()` 查出 label/icon 顯示，取代目前寫死的 5 個名稱清單。

> 直接從沒有帶 `?agents=` 的舊連結進 AiViewer（例如目前既有的其他導覽路徑）時，`currentProjectAgentIds` 為空陣列——分工 demo 入口不會出現，`ProjectUseAngentModal` 顯示「尚無指派的 Agent」，不報錯。

### 4.4 分工對話 demo（conv9）

新增 `src/composables/useAgentCollabConversation.ts`，比照 conv8 的結構，訊息物件多帶一個 `agentId` 欄位：

```typescript
function c9Push(msg: any) {
  conv9Msgs.value.push({ id: `c9_${conv9IdCounter++}`, ...msg })
}

function conv9InitFlow() {
  if (conv9Msgs.value.length > 0) return
  conv9Title.value = '促銷活動優化建議'
  c9Push({ forUser: true, msg: '幫我看一下這次 26W 促銷活動可以怎麼優化' })
  setTimeout(() => {
    c9Push({
      agentId: 'agentB', // 產品助理
      msg: '從商品面來看，這次主打款庫存還算充足，但幾個中低單價商品的曝光度偏低，可以考慮加進主打清單。',
    })
  }, 500)
  setTimeout(() => {
    c9Push({
      agentId: 'agentA', // 數據經理
      msg: '數據上這次活動轉換率比上次低了 8%，主要卡在行動端結帳流程，付款頁面的跳出率偏高。',
    })
  }, 1300)
  setTimeout(() => {
    aiviewerStore.addReportBlock('/justagent/agent_collab_promo_report.html', '促銷活動優化建議（產品助理×數據經理）.html')
    c9Push({
      finishResponse: true,
      msg: '產品助理跟數據經理已經從各自角度整理好建議，完整內容放到畫布上了——兩邊觀察不衝突，可以一起參考。',
    })
  }, 2200)
}
```

**觸發條件**：只有當 `currentProjectAgentIds` 包含 `agentB` 且包含 `agentA` 時，工具箱才顯示「促銷優化建議」項目、打字關鍵字分支才生效；否則兩個入口都不存在（比照 2.2 排除項的 fallback 說明）。判斷邏輯：

```typescript
const canRunAgentCollabDemo = computed(() =>
  currentProjectAgentIds.value.includes('agentB') && currentProjectAgentIds.value.includes('agentA')
)
```

**注意**：這裡要的是「條件不符時項目整個不存在」，跟現有 `enabled: false` 的語意（灰化＋顯示「即將推出」）不同，不能沿用同一個旗標。`toolboxItems` 改成 `computed<ToolboxItem[]>`，用陣列展開語法依 `canRunAgentCollabDemo` 決定要不要包含這個項目：

```typescript
const toolboxItems = computed<ToolboxItem[]>(() => [
  { id: 'reportAssembly', icon: 'bar_chart', name: '行銷報告生成', description: '拖曳組裝行銷週報章節', enabled: true },
  ...(canRunAgentCollabDemo.value
    ? [{ id: 'agentCollab', icon: 'groups', name: '促銷優化建議', description: '產品助理×數據經理協作分析', enabled: true }]
    : []),
  { id: 'imageGen', icon: 'palette', name: '圖像生成', description: '即將推出', enabled: false },
  // ...其餘既有佔位項目
])
```

打字關鍵字比照 conv8 模式：`msg.includes('促銷優化') || msg.includes('分工建議')` 且 `canRunAgentCollabDemo.value` 為真才進入 conv9 分支；條件不符時關鍵字不比對（維持沉默，不回覆），跟其他既有分支的預設行為一致。

靜態報告頁 `public/agent_collab_promo_report.html`：比照 `security_audit_report.html` 的視覺風格，但改成左右並列兩欄——左欄「產品助理視角」、右欄「數據經理視角」，呼應文件 6.2 節「並列呈現、不代為裁定」的精神（雖然這裡不是資料衝突，是互補分工，但並列不預設誰優先的呈現方式一致）。

### 4.5 訊息角色標籤

`AiViewerRecord.vue` 新增角色標籤顯示，放在 `.message-wrap` 內、`.content-box` 之前：

```html
<div class="agent-role-tag" v-if="props.source.agentId" :class="`agent-role-tag--${props.source.agentId}`">
  <i class="material-symbols-outlined">{{ agentOption?.icon }}</i>
  {{ agentOption?.label }}
</div>
```

```typescript
import { getAgentOption } from '@/constants/agents'
const agentOption = computed(() => props.source.agentId ? getAgentOption(props.source.agentId) : undefined)
```

樣式上每個 `agentId` 給一個獨立的底色（沿用專案既有 CSS 慣例，色彩用 CSS 變數，不寫死 hex，比照 `AI_RULES.md` 規範），跟現有 `.ai-avatar` 固定顯示「AI」不衝突——`.ai-avatar` 維持顯示「AI」文字不變，角色標籤是額外資訊，不是取代頭像。

## 5. 資料流

```
使用者在 ProjectSettingModal 選「產品助理」+「數據經理」→ saveProjectSetting()
  → 專案資料 agents: ['agentB', 'agentA']（前端 mock，存在 ProjectListContent 的專案清單裡）

使用者點專案卡片 → gotoAiViewer(item)
  → window.open('/justagent/view/AiViewer?id=xxx&agents=agentB,agentA')

AiViewer.vue 讀 route.query.agents → currentProjectAgentIds = ['agentB', 'agentA']
  → canRunAgentCollabDemo = true → 工具箱出現「促銷優化建議」項目、打字關鍵字生效
  → 使用者觸發 → conv9InitFlow()（比照 conv8 腳本模式）
    → 訊息帶 agentId → AiViewerRecord.vue 顯示角色標籤
    → 流程結束 → addReportBlock(並列報告 html) → 畫布顯示彙整 Block
```

## 6. 檔案異動清單

| 檔案 | 異動類型 | 說明 |
|---|---|---|
| `src/constants/agents.ts` | 新增 | 統一 Agent 清單 + `getAgentOption()` |
| `src/composables/useAgentCollabConversation.ts` | 新增 | conv9 分工對話腳本（+ 對應測試檔） |
| `public/agent_collab_promo_report.html` | 新增 | 左右並列雙視角靜態報告頁 |
| `src/components/AiViewer/ProjectSettingModal.vue` | 修改 | 「使用的Agent」改角色卡片多選，改吃 `AGENT_OPTIONS` |
| `src/components/ProjectListContent/ProjectListContent.vue` | 修改 | `agentTabs` 改吃共用清單；mock 專案 `agents` 欄位改真實 id；`gotoAiViewer` 帶 `agents` query |
| `src/views/AiViewer.vue` | 修改 | 新增 `useRoute()`，解析 `id`/`agents` query 取代寫死值 |
| `src/components/AiViewer/ProjectUseAngentModal.vue` | 修改 | 改顯示真實 agents 資料 |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | conv9 接線（工具箱條件顯示、關鍵字分支、`testMsgs`/`resetConversation`/`currentConversationTitle`） |
| `src/components/AiViewer/AiViewerRecord.vue` | 修改 | 新增 `.agent-role-tag` 角色標籤渲染 |
| `src/scss/components/_AiViewerRecord.scss`（或現有對應 scss 檔） | 修改 | 角色標籤樣式（依 `AI_RULES.md`，記得在 `_index.scss` 手動 `@forward`） |

## 7. 錯誤處理 / Fallback

- 專案沒有指派任何 Agent，或指派的組合不是「產品助理＋數據經理」：`canRunAgentCollabDemo` 為 `false`，工具箱不顯示對應項目、打字關鍵字不生效——不報錯，就是沒有這個入口
- 從舊連結（沒有 `?agents=`）進 AiViewer：`currentProjectAgentIds` 為空陣列，行為同上
- `route.query.agents` 帶了未知 id（不在 `AGENT_OPTIONS` 裡）：`getAgentOption()` 回傳 `undefined`，角色標籤/`ProjectUseAngentModal` 該筆資料略過不顯示，不拋錯

## 8. 測試計畫

- **Vitest**：
  - `useAgentCollabConversation.ts`：比照 `useSecurityAuditConversation.test.ts` 既有 5 個測項模式（初始訊息、依序推入、Block 建立時機、重複呼叫不重複、reset 清空）
  - `AGENT_OPTIONS`／`getAgentOption()`：無重複 id、查詢存在/不存在 id 的回傳值
- **Playwright（手動驗證，比照上次資訊安全稽核的驗證方式）**：
  1. 建立專案時選「產品助理＋數據經理」→ 存檔 → 開啟該專案的 AiViewer → 確認工具箱出現「促銷優化建議」項目
  2. 跑完 conv9 腳本 → 確認訊息各自帶正確角色標籤、畫布出現彙整 Block
  3. 建立另一個只選「行銷專員」的專案 → 開啟 AiViewer → 確認工具箱**沒有**「促銷優化建議」項目、打字關鍵字也無反應

## 9. 開放問題

- 角色標籤的色彩配色（每個 `agentId` 對應的底色）留給實作階段依 `AI_RULES.md` 的 CSS 變數規範決定，這份 spec 不定案
- `ProjectSettingModal.vue` 角色卡片的排列順序（是否依 `AGENT_OPTIONS` 陣列順序）與卡片尺寸/RWD 細節留給實作階段
- 這次只解決「產品助理＋數據經理」單一組合的 demo；若之後要支援任意組合都能跑分工腳本，需要另外規劃一套「依角色動態生成腳本內容」的機制（不是這輪範圍，屬於 2.2 明確排除項）
