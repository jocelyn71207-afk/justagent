# 探索頁面改版：Agent／Skill 雙分頁 — 設計文件

日期：2026-08-18

## 背景

`src/views/Explore.vue`（338 行）目前是單一、純 Agent 導向的探索頁：搜尋列、快捷 chip、Hero Banner、使用熱度榜（頒獎台）、大家都在用、個人化推薦（依分類 chip 篩選）。資料完全是寫死在 `<script setup>` 裡的 10 筆 `Agent` mock 資料，沒有 store，也完全沒有 Skill 的概念。

專案裡另有一份 2026-08-14 的視覺改版 spec（`docs/superpowers/specs/2026-08-14-visual-redesign-phase4-workspace-explore-design.md`），範圍是「頒獎台版型 + 動畫系統」的純視覺調整，非目標明確排除「搜尋/篩選/hero banner/為你推薦邏輯」。本次是全新方向——把探索頁從單一 Agent 清單，重新設計成 Agent／Skill 雙分頁，屬於後續規劃，不與該份 spec 衝突，只是換了範圍。

**2026-08-18 修訂說明：** Task 1 完成後才發現，實際實作所在的 `main`（`origin/main`）分支上，`Explore.vue` 的圖示配色仍是舊版的 `bgColor`/`accentColor`（inline style、寫死 hex）欄位，不是本文件原始版本以為的 `colorKey: ColorKey`（CSS class 設計 token）——那個 `colorKey` 版本只存在於另一個尚未合併回 main 的並行分支上，是探索/寫這份 spec 時誤把該分支的檔案內容當成 main 的現況。以下第 2-4 節已修正為使用實際的 `bgColor`/`accentColor` 欄位，不再假設 `colorKey` 存在。

**2026-08-21 merge 後更新：** 上面那個「尚未合併回 main 的並行分支」（`redesign/entry-and-sidebar-taste-pass`）後來合併回 main 了，合併時把這份 spec 涵蓋的 Skill 探索分頁功能，跟該分支既有的 `colorKey: ColorKey` dark-mode token 化改動做了整合——最終落地的程式碼是 `colorKey`，不是本文件第 2-4 節寫的 `bgColor`/`accentColor`。上一段「不再假設 colorKey 存在」的結論，在合併之後已經不成立，請勿依照第 2-4 節的 `bgColor`/`accentColor` 寫法去逆向修改現有程式碼。

## 目標

- 探索頁分成兩個分頁籤：「Agent 探索」與「Skill 探索」。
- Agent 探索主打「使用情境／痛點」——每個 Agent 用一句情境式痛點文字取代現在中性的功能說明，出現在卡片上。
- Skill 探索主打「功能類型」——每個 Skill 標示清楚的功能分類（文字生成／資料查詢／流程自動化／分析報表／溝通協作），版面比 Agent 分頁更精簡、更工具化，不做人氣競賽式的頒獎台。
- 兩種卡片拆成獨立元件，讓各自的版面差異不會擠在同一個 template 裡混雜條件判斷。

## 非目標

- 不接真實的 `skillStore`／後端資料——Skill 探索沿用 Agent 現在的做法，資料寫死在 `Explore.vue` 內的 mock 陣列，之後有真實資料源再串接。
- 不建立正式的 `AgentStore`／全站共用 `Agent` 型別——`Explore.vue` 內的 `Agent` interface 維持是這個頁面自己的展示用型別，不影響 `CompanyTeamSettings.vue` 或 `skillStore.ts` 裡各自獨立的 Agent 相關欄位。
- 不動 2026-08-14 那份 spec 已經做的頒獎台版型／動畫系統（`lively-*` class、`podium-card--rank-*` 版面），Agent 分頁直接沿用，只換卡片內顯示的文字欄位。
- 不做兩個分頁籤之間的搜尋/篩選狀態同步——各自獨立的 `searchKeyword`、chip 篩選狀態。

## 設計

### 1. 分頁籤切換

`Explore.vue` 頂部（原本搜尋列之前）新增分頁籤列：

```html
<div class="explore-tabs">
  <button
    :class="['explore-tab', { active: activeExploreTab === 'agent' }]"
    @click="activeExploreTab = 'agent'"
  >
    <i class="material-symbols-outlined">support_agent</i>Agent 探索
  </button>
  <button
    :class="['explore-tab', { active: activeExploreTab === 'skill' }]"
    @click="activeExploreTab = 'skill'"
  >
    <i class="material-symbols-outlined">psychology</i>Skill 探索
  </button>
</div>
```

```ts
const activeExploreTab = ref<'agent' | 'skill'>('agent')
```

現有的搜尋列、快捷 chip、Hero Banner、熱度榜、大家都在用、個人化推薦整段包在 `<template v-if="activeExploreTab === 'agent'">` 裡，維持現在的結構與 `lively-*` 動畫 class 不變。Skill 探索的版面（見第 3 節）包在 `<template v-if="activeExploreTab === 'skill'">` 裡。

### 2. Agent 探索：新增 `painPoint` 欄位

`Agent` interface（`Explore.vue:202-210`）新增一個欄位：

```ts
interface Agent {
  name: string
  desc: string       // 保留，Modal 詳情裡的完整說明
  painPoint: string  // 新增：卡片上主打的一句情境/痛點
  icon: string
  bgColor: string
  accentColor: string
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}
```

10 筆 `allAgents` mock 資料（`Explore.vue:212-298`）都要補上 `painPoint`，語氣是情境式問句／陳述句，例如：

| Agent | painPoint |
|---|---|
| 內容創作者 | 還在對著空白文件發呆，不知道從何下筆？ |
| 社群管理 | 每天要顧好幾個社群帳號，回覆訊息回到分身乏術？ |
| 專案管理 | 專案時程一多，資源分配跟進度追蹤就開始亂？ |
| 財務分析師 | 一堆報表數字擺在眼前，卻看不出關鍵趨勢？ |
| SEO 專家 | 網站流量怎麼做都上不去，搜尋排名一直卡關？ |
| 顧客服務管理 | 客訴訊息一多，回覆速度跟服務品質很難兼顧？ |
| 記帳助理 | 帳務單據一多就對不上，報帳核銷永遠卡在對帳？ |
| 人資行政助理 | 職缺說明跟履歷篩選佔掉大半天，招募進度卻停滯不前？ |
| 設計助理 | 想要的視覺效果說不清楚，設計來回改版改到懷疑人生？ |
| 會議記錄員 | 開完會才發現重點都忘了，行動項目沒人跟進？ |

**卡片顯示邏輯調整**：所有目前顯示 `{{ agent.desc }}` 的卡片位置（頒獎台 `podium-card`、第四名 `ranking-more`、大家都在用 `agent-card`、個人化推薦 `rec-card`）全部改顯示 `{{ agent.painPoint }}`。Hero Banner 的 `hero-cta-desc`（`Explore.vue:35`）也改用 `painPoint`。Modal 詳情（`Explore.vue:147`）維持顯示 `desc`（完整說明），並在 `desc` 上方新增一行 `painPoint` 當引言：

```html
<p class="explore-modal-painpoint">{{ selectedAgent.painPoint }}</p>
<p class="explore-modal-desc">{{ selectedAgent.desc }}</p>
```

### 3. Skill 探索：新的資料模型與精簡版面

新的型別與 mock 資料（放在 `Explore.vue` 的 `<script setup>` 裡，`Agent` 相關定義之後）：

```ts
type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

interface ExploreSkill {
  name: string
  functionType: SkillFunctionType
  capability: string   // 一句話說明「能做什麼」，功能導向、非情境導向
  icon: string
  bgColor: string
  accentColor: string
  badge?: AgentBadge    // 沿用同一個 badge 型別（new/hot/sat）
}

const allExploreSkills: ExploreSkill[] = [
  { name: '週報自動生成', functionType: '文字生成', capability: '依本週資料自動產出結構化週報草稿。', icon: 'summarize', bgColor: '#EEEDFE', accentColor: '#534AB7' },
  { name: '會議摘要', functionType: '文字生成', capability: '將會議逐字稿摘要成重點與待辦事項。', icon: 'mic', bgColor: '#E6F1FB', accentColor: '#185FA5', badge: { type: 'hot', label: '熱門' } },
  { name: 'ERP 庫存查詢', functionType: '資料查詢', capability: '用自然語言查詢 ERP 系統即時庫存數量。', icon: 'inventory_2', bgColor: '#E1F5EE', accentColor: '#0F6E56' },
  { name: '客服對話品質評估', functionType: '分析報表', capability: '自動評分客服對話紀錄，標記待改進案例。', icon: 'reviews', bgColor: '#FAEEDA', accentColor: '#854F0B', badge: { type: 'new', label: '新上架' } },
  { name: '合約審核摘要', functionType: '文字生成', capability: '擷取合約關鍵條款，產出審核重點摘要。', icon: 'gavel', bgColor: '#FAECE7', accentColor: '#993C1D' },
  { name: '產品 FAQ 自動回覆', functionType: '溝通協作', capability: '依知識庫內容自動回覆常見產品問題。', icon: 'forum', bgColor: '#EAF3DE', accentColor: '#3B6D11', badge: { type: 'hot', label: '熱門' } },
  { name: 'ERP 報表彙整', functionType: '分析報表', capability: '跨系統彙整報表數據，產出單一檢視視圖。', icon: 'bar_chart', bgColor: '#FBEAF0', accentColor: '#993556' },
  { name: '訂單流程通知', functionType: '流程自動化', capability: '訂單狀態變更時自動通知相關人員與系統。', icon: 'sync_alt', bgColor: '#E6F1FB', accentColor: '#185FA5' },
]
```

（顏色值直接沿用 `allAgents` 現有調色盤裡的既有 hex 組合，維持視覺一致性，不新增新的顏色值。）

版面（比 Agent 分頁精簡，不做頒獎台）：

```html
<template v-if="activeExploreTab === 'skill'">
  <div class="explore-search-bar">
    <i class="material-symbols-outlined">search</i>
    <input type="text" v-model="skillSearchKeyword" placeholder="搜尋技能..." @keydown.enter="onSkillSearchEnter" />
  </div>

  <div class="recs-chips mb-4">
    <span
      v-for="chip in skillFunctionTypeChips"
      :key="chip"
      :class="['recs-chip', { active: activeSkillChip === chip }]"
      @click="activeSkillChip = chip"
    >{{ chip }}</span>
  </div>

  <div class="section-header">
    <h3>熱門技能</h3>
  </div>
  <div class="skill-grid lively-stagger">
    <ExploreSkillCard
      v-for="skill in filteredExploreSkills"
      :key="skill.name"
      :skill="skill"
      @click="openSkillModal(skill)"
    />
  </div>
</template>
```

```ts
const skillFunctionTypeChips = ['全部', '文字生成', '資料查詢', '流程自動化', '分析報表', '溝通協作']
const activeSkillChip = ref('全部')
const skillSearchKeyword = ref('')

const filteredExploreSkills = computed(() =>
  allExploreSkills.filter(s =>
    (activeSkillChip.value === '全部' || s.functionType === activeSkillChip.value) &&
    (!skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim()))
  )
)

function onSkillSearchEnter() {
  const kw = skillSearchKeyword.value.trim()
  if (!kw) return
  if (!filteredExploreSkills.value.length) popDialog.toast('找不到相關技能')
}
```

Skill 詳情 Modal（獨立一組 state，不跟 Agent Modal 共用）：

```ts
const isSkillModalOpen = ref(false)
const selectedExploreSkill = ref<ExploreSkill | null>(null)

function openSkillModal(skill: ExploreSkill) {
  selectedExploreSkill.value = skill
  isSkillModalOpen.value = true
}

function useExploreSkill() {
  popDialog.toast('已加入我的技能')
  isSkillModalOpen.value = false
}
```

```html
<compModal v-model="isSkillModalOpen" :title="selectedExploreSkill?.name ?? ''" :width="440" :closeOnMask="true">
  <template v-if="selectedExploreSkill">
    <div class="Explore explore-modal-box">
      <div class="explore-modal-content">
        <div class="explore-modal-icon" :style="{ background: selectedExploreSkill.bgColor }">
          <i class="material-symbols-outlined" :style="{ color: selectedExploreSkill.accentColor }">{{ selectedExploreSkill.icon }}</i>
        </div>
        <span class="skill-function-badge">{{ selectedExploreSkill.functionType }}</span>
        <p class="explore-modal-desc">{{ selectedExploreSkill.capability }}</p>
      </div>
    </div>
  </template>
  <template #footer>
    <div class="Explore explore-modal-footer">
      <button class="custom-btn custom-main-btn" @click="useExploreSkill">加入我的技能</button>
      <button class="custom-btn" @click="isSkillModalOpen = false">取消</button>
    </div>
  </template>
</compModal>
```

### 4. 元件拆分

- `src/components/Explore/AgentCard.vue`：props `agent: Agent`、`rank?: number`（頒獎台名次用，`undefined` 時不顯示 rank badge），emit `click`。內部沿用現有 `podium-card`／`agent-card` 的 class 與版面結構，把目前分散在三個地方（頒獎台、大家都在用、個人化推薦用的是 `rec-card`，版面略有不同——`rec-card` 保留在 `Explore.vue` 不拆，因為它的版面（含 icon 圓形背景 `rec-icon`）跟頒獎台/大家都在用的 `agent-card` 不同，硬拆成同一元件會需要额外的 variant prop，不划算）。`AgentCard.vue` 只負責取代「頒獎台卡片」與「大家都在用卡片」這兩處重複的版面（原本兩處 template 幾乎一樣，只差 rank badge 有無）。
- `src/components/Explore/ExploreSkillCard.vue`：props `skill: ExploreSkill`，emit `click`。顯示 icon、`functionType` 標籤（優先於卡片標題上方或旁邊）、`name`、`capability`、`badge`（有的話）。

樣式：不新增 scss 檔案。`AgentCard.vue`／`ExploreSkillCard.vue` 沿用／擴充 `src/scss/views/_Explore.scss`（本來就是這個頁面所有 class 的唯一來源，包含 `.agent-card`／`.podium-card` 等），新增的 class（`.explore-tabs`／`.explore-tab`／`.skill-grid`／`.skill-function-badge`／`.explore-modal-painpoint`）都加在這個既有檔案裡，不用動 `_index.scss`。

## 資料流

```
Explore.vue
  activeExploreTab: 'agent' | 'skill'
  ├─ 'agent' → 現有搜尋/chip/hero/熱度榜/大家都在用/個人化推薦（卡片顯示 painPoint）→ Agent Modal（painPoint + desc + tags）
  └─ 'skill' → 搜尋 + 功能類型 chip → 熱門技能網格（ExploreSkillCard）→ Skill Modal（functionType + capability）
```

兩個分頁籤的資料完全獨立（各自的 mock 陣列、各自的搜尋/篩選 state、各自的 Modal state），沒有共用資料或互相依賴。

## 測試計畫

專案已有現成的 Vue component test 基礎設施（`src/views/__tests__/Explore.ranking.test.ts`，用 `@vue/test-utils` + Pinia 掛載 `Explore.vue`），並非「沒有」——這點過去幾份 spec 的結論是錯的。本次分頁/篩選行為的測試覆蓋已補進 `src/views/__tests__/Explore.skillTab.test.ts`（涵蓋切換到 Skill 分頁、功能類型 chip 篩選、關鍵字搜尋篩選三種情境），另外仍搭配型別檢查 + 手動驗證：

- 型別檢查：`npm run type-check` 通過，確認 `Agent`／`ExploreSkill` 兩個型別、`AgentCard`／`ExploreSkillCard` 兩個元件的 props 型別正確串接。
- 手動驗證（`npm run dev`）：
  1. 預設進入探索頁，「Agent 探索」分頁為預設啟用狀態，畫面跟改版前一致（Hero Banner／熱度榜頒獎台／大家都在用／個人化推薦），但卡片文字都是 `painPoint`（情境式問句），不是原本的 `desc`。
  2. 點擊「Skill 探索」分頁籤，切換成精簡版面：搜尋列 + 功能類型 chip + 熱門技能網格，卡片上清楚顯示功能分類標籤。
  3. 用功能類型 chip 篩選（例如點「資料查詢」），確認網格只剩對應的技能卡片。
  4. 點一張技能卡片，確認 Modal 顯示 `functionType`、`capability`，footer 是「加入我的技能」／「取消」，點「加入我的技能」出現 toast 並關閉 Modal。
  5. 切回「Agent 探索」，點一張 Agent 卡片，確認 Modal 內 `painPoint` 在 `desc` 上方，兩者都顯示、且措辭不重複。
  6. 兩個分頁籤切換時，彼此的搜尋輸入框內容與 chip 選取狀態不互相影響（各自保留獨立 state）。

## 風險與邊界情況

- `AgentCard.vue` 只取代「頒獎台」與「大家都在用」兩處卡片，個人化推薦區塊的 `rec-card` 版面不同、故意不拆進同一元件，維持在 `Explore.vue` 內——避免為了共用而引入不必要的 variant prop（YAGNI）。
- Skill 探索的搜尋（`onSkillSearchEnter`）目前只做「找不到時 toast」，不像 Agent 搜尋會自動開 Modal——因為 Skill 分頁本來就是網格瀏覽為主，搜尋只是輔助篩選（`filteredExploreSkills` 已經即時反映 `skillSearchKeyword`），不需要額外跳出 Modal 的行為。
- `AgentBadge` 型別（`new`/`hot`/`sat`）在 Skill 資料裡沿用，語意上 `sat`（高滿意度）對 Skill 不一定貼切，但為了不新增第二套 badge 型別（YAGNI），Skill mock 資料只使用 `new`／`hot` 兩種，不使用 `sat`。
