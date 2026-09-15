# 探索單元重新設計：打通資料/互動 + 視覺翻新 — 設計文件

日期：2026-09-15

## 修訂說明（2026-09-15，實作完成後補充）

本文件下方「資料流」章節原本描述 `AssignSkillToAgentModal` 會讀 `exploreStore.agents` 來列出可選的 Agent（`→ AssignSkillToAgentModal（讀 exploreStore.agents）` 那一行），這個假設在實作階段被推翻了：實際動手串接時發現，`skillStore.ts` 裡的 mock 技能資料早就已經預先塞好 `assignedAgents`，用的是一套跟 `exploreStore.agents` 完全脫鉤的名稱字串詞彙（`AVAILABLE_AGENTS`，同一份清單也是 `SkillEditor.vue` 指派 chip 選擇器在用的），而不是 `exploreStore` 的 Agent id。如果照原設計讀 `exploreStore.agents`，選出來的會是 id（例如 `agent-content-creator`），寫入 `assignedAgents` 後會跟既有 mock 資料裡已經存在的名稱字串（例如 `'知識管理助理'`）格式不一致、互相對不上，等於弄壞既有資料。

因此最終上線的實作改成讀寫 `skillStore.ts` 自己的 `AVAILABLE_AGENTS`，不讀 `exploreStore.agents`。下面「資料流」章節裡 `AssignSkillToAgentModal（讀 exploreStore.agents）` 那一行、以及緊接著「兩個 store 之間唯一的耦合點是 `AssignSkillToAgentModal`」那段描述，都已被本說明取代，請以此處為準。

## 背景

`src/views/Explore.vue`（476 行）是側邊選單 rail 上的全域頁面，分「Agent 探索」與「Skill 探索」兩個分頁籤，出自 [`2026-08-18-explore-agent-skill-split-design.md`](./2026-08-18-explore-agent-skill-split-design.md)。該份 spec 當時明確把以下兩件事列為非目標：

- 不接真實的 `skillStore`／後端資料——Skill 探索沿用 Agent 現在的做法，資料寫死在 `Explore.vue` 內
- 不建立正式的 `AgentStore`／全站共用 `Agent` 型別

這次重新設計，就是要把上述兩個當時刻意延後的事項做掉，同時處理三個目前確實存在的落差：

1. **資料是假的**：`allAgents`、`allExploreSkills` 都是元件內寫死的陣列，`skillStore.ts` 裡其實已經有 `Skill` 這個真正的技能型別，而且已經預留了 `assignedAgents?: string[]` 欄位，只是完全沒被 Explore 使用。
2. **互動是假的**：Agent 詳情 Modal 的「立即使用此 Agent」、Skill 詳情 Modal 的「加入我的技能」都只是彈一個 toast 就關窗，沒有任何狀態真的改變。
3. **PRD 落差**：`PRD-v1.4.md` 4.7 章節只定義了 Agent 探索的規格，完全沒提到程式碼裡已存在的 Skill 探索分頁；`PROJECT_CONTEXT.md` 3.9 節仍是「待補」狀態。本次會一併把這兩份文件的探索相關章節補上。

## 目標

- Agent 探索：「立即使用此 Agent」改為把該 Agent **加入使用者的常用清單**（favorite），可切換加入/移出，狀態持久化（重新整理後仍在）。
- Skill 探索：資料源改成真正的 `skillStore` 技能清單（不再自建假資料）；「加入我的技能」改為挑選一個 Agent，把該 Skill **實際裝到選定的 Agent 上**（寫入 `skill.assignedAgents`），可挑選全體 Agent（不限已加入常用清單的）。
- 「使用熱度榜」與「大家都在用」合併成一個「熱門 Agent」區塊——兩者本質上是同一份使用量排序資料，只是呈現方式不同（頒獎台 vs 卡片列），分開放容易讓人誤以為是兩份不同排名。
- Badge 視覺對齊 2026-08-25 那次全站 badge/tag 統一（`%badge-shape` + `--tag-*`）——`_Explore.scss` 當時沒被納入那次的稽核範圍。
- 補齊 `PRD-v1.4.md`／`PROJECT_CONTEXT.md` 裡探索相關的章節。

## 非目標

- **不做 IA 大改**：不拿掉 Agent／Skill 兩個分頁籤、不改成無分頁的統一 grid（曾在方案討論中提出，判斷為「解決一個還沒被驗證存在的問題」，予以擱置）。
- **不接真後端 API**：`exploreStore`／`skillStore` 的資料仍是本機 mock；「持久化」指的是 `localStorage`（跟現有 `apiSimulatorStore.ts`、`http.ts` 的 token 儲存同一套做法），不是真的伺服器端儲存。
- **不動個人化推薦區塊（`rec-card`）的版面／篩選邏輯**：只是把它讀的資料來源換成含 favorite 標記的 Agent 清單，卡片版面、`categories` 篩選機制不變。
- **不重新設計 Hero Banner**：`featuredAgent` 精選邏輯維持現況（寫死指定「內容創作者」），不在本次範圍內做「真正智慧推薦」。
- **不改 `skillStore.ts` 既有的 `Skill` 型別欄位語意**，只新增一個選填欄位（見下）。

## 設計

### 1. `skillStore.ts`：新增 `functionType` 選填欄位

```ts
export type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

export interface Skill {
  // ...既有欄位不變
  functionType?: SkillFunctionType   // 新增：供 Skill 探索頁分類/篩選使用，選填不影響既有消費者
}
```

`MOCK_SKILLS`（top-level、`zone !== 'personal'` 的 35 筆已知資料）逐筆補上對應的 `functionType`。`MOCK_PERSONAL_SKILLS`（`zone: 'personal'`，個人草稿/審核中技能）**不補**這個欄位，因為它們本來就不會出現在 Explore 的公開技能牆上（見下方篩選規則）。

### 2. 新增 `src/stores/exploreStore.ts`

```ts
export type ColorKey = 'violet' | 'blue' | 'amber' | 'teal' | 'green' | 'rust' | 'rose'

export interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

export interface Agent {
  id: string          // 新增：favorite/assignedAgents 都用 id 關聯，不再用 name 當 key
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

export const useExploreStore = defineStore('exploreStore', () => {
  const agents = ref<Agent[]>(/* 沿用現有 10 筆，補上 id */)
  const favoriteAgentIds = ref<string[]>(loadFavoritesFromLocalStorage())

  const isFavorite = (agentId: string) => favoriteAgentIds.value.includes(agentId)
  function toggleFavorite(agentId: string) { /* push/splice + 寫回 localStorage */ }

  return { agents, favoriteAgentIds, isFavorite, toggleFavorite }
})
```

- `Agent`、`AgentCard.vue`、`ExploreSkillCard.vue` 目前各自重複定義 `Agent`/`AgentBadge`/`ColorKey` 型別——統一從 `exploreStore.ts` export，其餘檔案 import，不再各自宣告。
- `localStorage` key：`explore.favoriteAgentIds`，格式為 JSON string array；讀取失敗（損毀/不存在）時 fallback 為空陣列，不拋錯。

### 3. `Explore.vue` 重構：拆出 Modal，改讀 store

- `AgentDetailModal.vue`、`SkillDetailModal.vue` 從 `Explore.vue` 拆出（各自接收 `agent`/`skill` + `v-model:open`，內部呼叫 store action），`Explore.vue` 只負責分頁籤切換、搜尋/篩選 state、組裝子元件。
- Agent 卡片「立即使用此 Agent」按鈕：
  - 文案依 `isFavorite(agent.id)` 動態顯示「加入常用清單」／「已加入常用清單」
  - 點擊呼叫 `toggleFavorite(agent.id)`，toast 訊息同步依動作是加入或移出而不同（「已加入常用清單」／「已從常用清單移除」）
- 「熱門 Agent」合併區塊：`podiumAgents`（前 3，頒獎台）+ `fourthRankedAgent`（第 4，次要列）維持現有版面與資料來源（`rankingAgents`），只是把原本「大家都在用」那個獨立的 `agent-grid agent-grid--4` 區塊拿掉，不重複顯示同一份排名資料的另一種呈現。

### 4. Skill 探索：資料源換成 `skillStore`

```ts
const skillStore = useSkillStore()

// 只列出「公開的技能」：非個人 zone、且目前啟用中
const publicSkills = computed(() =>
  skillStore.skills.filter(s => s.zone !== 'personal' && s.isEnabled)
)

const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    (activeSkillChip.value === '全部' || s.functionType === activeSkillChip.value) &&
    (!skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim()))
  )
)
```

`ExploreSkillCard.vue` 的 props 型別從自建的 `ExploreSkill` 改成 `skillStore` 的 `Skill`；卡片上顯示的 `capability` 文字改讀 `skill.capabilities?.[0]?.description`（取第一項能力描述），若該技能沒有 `capabilities` 則 fallback 顯示 `skill.description`。

### 5. 新增 `AssignSkillToAgentModal.vue`：Skill →「加入我的技能」的真實流程

```
點技能卡片 → SkillDetailModal（顯示 functionType badge + capability）
  → 按「加入我的技能」→ 開 AssignSkillToAgentModal
    → 列出 exploreStore 全體 Agent（不限常用清單），已裝過此技能的 Agent 顯示灰階「已裝入」且不可點選，可搜尋
    → 選定一個尚未裝過的 Agent → 呼叫 skillStore 的 action，把該 Agent id push 進該 Skill 的 assignedAgents
    → 成功 toast「已將「{skill.name}」加入「{agent.name}」」，關閉兩層 Modal
```

- `skillStore.ts` 新增一個 action（例如 `assignSkillToAgent(skillId: string, agentId: string)`），內部仍會判斷「已存在則不重複 push」再回傳結果——UI 層已經用灰階禁用擋掉重複點選，這層判斷是防止未來有其他呼叫路徑（例如批次操作）繞過 UI 直接呼叫 action 時仍能保持資料一致，`Explore.vue`／`AssignSkillToAgentModal.vue` 一律透過這個 action 改動，不直接改 `assignedAgents` 陣列。
- Agent 選擇器的清單項目沿用 `exploreStore` 的 `Agent`（含 icon/colorKey），視覺上是簡化版的小卡片（icon + name），不需要完整 `AgentCard.vue` 的版面（頒獎台/badge 那些跟這裡無關）。清單裡已經在 `skill.assignedAgents` 裡的 Agent 顯示「已裝入」灰階狀態且不可再點選（而不是允許重複點擊後才在 action 裡擋下來），把「不能重複安裝」這件事在 UI 層就講清楚。

### 6. 視覺：Badge 對齊既有的統一系統

- `_Explore.scss` 裡的 `.agent-badge`／`.skill-function-badge` 目前各自宣告 padding/radius/字重，改為 `@extend %badge-shape`（跟 `.skill-tag`／`.status-badge` 等其餘全站 badge 同一份 placeholder），顏色維持現有 `--color-wise-badge-*`／`--tag-*` token 不變（這兩組 token 本身沒問題，08-25 那次只是沒把 `_Explore.scss` 納入稽核範圍，不是 token 本身有 bug）。
- 新增的「已加入常用清單」星形圖示，顏色用 `--tag-amber-text`（跟其他「已收藏/已標記」語意一致的色相），不新增新的色彩 token。

### 7. `PRD-v1.4.md` / `PROJECT_CONTEXT.md` 補齊

- `PRD-v1.4.md` 4.7 章節新增 4.7.3「Skill 探索」小節，內容依本文件第 4-5 節的實際行為撰寫（含 `assignedAgents` 安裝流程），並在附註標明「本節於 2026-09-15 補齊，此前程式碼已先行實作但未同步文件」。
- `PROJECT_CONTEXT.md` 3.9 節從「待補」改為實際內容摘要（頁面結構、Agent/Skill 兩個子功能、常用清單與技能安裝的資料流），並連結本份 spec。

## 資料流

```
exploreStore
  agents: Agent[]（10 筆，含 id）
  favoriteAgentIds: string[]（localStorage 持久化）
      │
      ├─ Agent 探索 tab
      │    搜尋/chip 篩選 → Hero / 熱門 Agent（合併後的頒獎台+次要列）/ 個人化推薦
      │    → AgentDetailModal → toggleFavorite(agent.id)
      │
skillStore
  skills: Skill[]（含 functionType、assignedAgents）
      │
      └─ Skill 探索 tab
           publicSkills = skills.filter(zone !== 'personal' && isEnabled)
           搜尋/functionType chip 篩選 → 熱門技能 grid
           → SkillDetailModal →「加入我的技能」
             → AssignSkillToAgentModal（讀 exploreStore.agents）
             → skillStore.assignSkillToAgent(skillId, agentId)
```

兩個 store 之間唯一的耦合點是 `AssignSkillToAgentModal`：它同時讀 `exploreStore.agents`（選誰）跟寫 `skillStore` 的 `assignedAgents`（裝到誰身上），是刻意的交會點，不是意外耦合。

## 測試計畫

- `exploreStore`：`toggleFavorite` 加入/移出、`localStorage` 讀寫（含損毀 JSON fallback 空陣列）的單元測試。
- `skillStore`：新增的 `assignSkillToAgent` action——正常裝入、重複裝入不重複 push 兩種情境的單元測試。
- 既有 `Explore.skillTab.test.ts`／`Explore.ranking.test.ts` 需更新：
  - ranking 測試：改為驗證合併後的單一「熱門 Agent」區塊（不再各自驗證兩個區塊）
  - skillTab 測試：資料源改為 mock 過的 `skillStore`（測試裡建立測試用 Pinia store 並塞入固定 `Skill[]`），驗證 `functionType` 篩選、`zone==='personal'` 的技能不會出現在清單
- 新增 `AssignSkillToAgentModal` 的 component test：選定 Agent 後確認呼叫了 `assignSkillToAgent`；已裝過此技能的 Agent 項目確認渲染為 disabled 且點擊不觸發任何 emit。
- 型別檢查：`npm run type-check`；手動驗證（`npm run dev`）：
  1. 進 Agent 探索，收藏一個 Agent，重新整理頁面，確認「已加入常用清單」狀態還在（localStorage 生效）。
  2. 進 Skill 探索，確認清單是 `skillStore` 裡的真實技能名稱（不是舊的 8 筆假資料），且沒有出現任何 `zone: 'personal'` 的草稿技能。
  3. 用「功能類型」chip 篩選，確認只剩對應 `functionType` 的技能。
  4. 點一個技能 →「加入我的技能」→ 選一個 Agent → 確認 toast 顯示、跳轉回頁面後該 Skill 在 `skillStore` 裡的 `assignedAgents` 已包含選定的 Agent id（可從 SkillManagement 頁面該技能的詳情確認）。
  5. 對同一個 Skill 再次打開 `AssignSkillToAgentModal`，確認剛裝過的那個 Agent 顯示灰階「已裝入」且無法點選，`assignedAgents` 不會出現重複 id。

## 風險與邊界情況

- `functionType` 是選填欄位，`SkillManagement`／`SkillCard` 等既有消費者不受影響（沒有用到這個欄位，不會因為新增而型別錯誤）；但如果日後有人在 `SkillManagement` 建立新技能卻沒填 `functionType`，該技能就不會出現在 Explore 的任何 chip 篩選下（只會出現在「全部」）——這是可接受的降級行為，不是 bug。
- `assignSkillToAgent` 若對應的 Skill 已被刪除（`deletedAt` 有值）或 `isEnabled === false`，理論上不該再被安裝——但 Explore 的 `publicSkills` 篩選已經確保使用者看不到、點不到這種技能，所以 action 本身不用重複做這層防呆（YAGNI，防呆只做在使用者實際能觸發的路徑上）。
- `exploreStore.agents` 目前仍是 10 筆寫死清單，沒有跟 `skillStore` 的 `assignedAgents` 做「反向」一致性檢查（例如刪除一個 Agent 時，其他 Skill 裡殘留的 `assignedAgents` id 不會自動清掉）——因為 `exploreStore.agents` 本來就沒有刪除功能，這個情境目前不會發生，暫不處理。
