# Teva 換季促銷方案規劃對話（conv5）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth scripted AiViewer conversation (conv5) that simulates marketing requesting a Teva seasonal promotion plan — the agent checks inventory, researches trends, produces a marketing-strategy + risk-assessment report, gets a data-error correction from the user, and revises it.

**Architecture:** Pure front-end mock/demo addition, no backend calls. Follows the conv4 pattern exactly: all state and scripted logic live inline in `src/components/AiViewer/AiViewerRightBox.vue` (no new components/composables), driven by `setTimeout` chains that push message objects into a `conv5Msgs` ref array. Citation chips resolve against four new mock `knowledgeStore.ts` entries. The two report artifacts are standalone self-styled HTML files in `public/`, loaded into the canvas via the existing `addReportBlock` helper.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, no new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-07-31-teva-seasonal-promotion-conversation-design.md`

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（CLAUDE.md）
- 樣式禁止 `<style scoped>`；本次不新增獨立 SCSS 檔案，沿用既有 class（CLAUDE.md／spec）
- 所有 import 使用 `@/` alias（CLAUDE.md）
- 顏色使用 CSS Custom Properties，不寫死 hex（CLAUDE.md — 適用於兩份新 HTML 報告的 `:root` 變數）
- 不引入新 Vue 元件或 composable；conv5 腳本邏輯全部內聯在 `AiViewerRightBox.vue`（spec，與 conv1/2/4 一致慣例）
- 對話切換 guard 一律使用正向判斷 `currentConversationId === 'conv5'`，不得用否定式（spec — 吸取 conv1 `showJourneyModifyPill` guard 曾外洩的教訓）
- 新的 HTML 報告放在 repo-root `public/`（非 `public/justagent/`），透過 vite `base: '/justagent/'` 產生的 `/justagent/<file>.html` 路徑載入
- 每個 `KnowledgeSource.chunkIndexes` 是 **0-based 陣列位置**（對應 `versions[0].chunks` 的陣列索引），不是 chunk 物件裡 1-based 的 `index` 欄位值——`KnowledgeSourceDrawer` 用 `chunks[idx]` 直接取值

---

## File Structure

| 檔案 | 異動類型 | 責任 |
|------|----------|------|
| `src/stores/knowledgeStore.ts` | 修改 | 新增 `k9`–`k12` 四筆知識庫項目（Teva 庫存＋3 個趨勢來源）、`api-3`/`api-4` 兩個 API 來源、KnowledgeEditor 分類下拉多一個選項 |
| `public/teva_seasonal_promotion_strategy.html` | 新建 | 初版促銷策略報告（含刻意植入的庫存資料錯誤） |
| `public/teva_seasonal_promotion_strategy-1.html` | 新建 | 修正版促銷策略報告 |
| `src/components/AiViewer/conversationListModal.vue` | 修改 | 新增 conv5 列表項 |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | 新增 conv5 狀態、腳本函式、懸浮面板 template、`handleChatAreaClick` 分支；擴充既有的 `cannedTaskItems`／`sendCannedTask`／`testMsgs`／`resetConversation`／`currentConversationTitle`／`inputAreaHidden`／`watch(currentConversationId)` |

No test files — this codebase has no unit tests for conv1/2/4's scripted chat logic (pure setTimeout-driven UI content); verification is `npm run type-check` + `npm run lint` + manual click-through in the dev server, matching how conv4 was verified.

---

### Task 1: Add Teva inventory + trend knowledge base entries

**Files:**
- Modify: `src/stores/knowledgeStore.ts:788` (insert 4 new items right before the `]);` that closes `knowledgeList`)
- Modify: `src/stores/knowledgeStore.ts:823` (insert 2 new API sources right before the `]);` that closes `apiSources`)
- Modify: `src/views/KnowledgeEditor.vue:110` (add a category dropdown option)

**Interfaces:**
- Consumes: existing `KnowledgeItem`/`KnowledgeVersion`/`ChunkPreview`/`ApiSource` types from `src/stores/knowledgeStore.ts:112-225`.
- Produces: knowledge items `k9` (2 chunks), `k10`/`k11`/`k12` (1 chunk each) — referenced by `knowledgeId` in Task 3/4's `KnowledgeSource[]` arrays. `k9` chunk array positions: `[0]` = 商品線總覽, `[1]` = 低庫存警示. `k7` (pre-existing) chunk array position `[1]` = 熱銷品項明細 (chunk `index: 2`).

- [ ] **Step 1: Insert the four knowledge items**

Open `src/stores/knowledgeStore.ts`. Find the line `]);` that closes the `knowledgeList` array (currently line 789, right after the `k8` item's closing `},` on line 788). Insert these four items right before that `]);`:

```typescript
    {
      id: 'k9',
      title: 'Teva 商品庫存即時資料',
      category: '商品文件',
      status: 'active',
      sourceType: 'API',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: '2026-07-30 08:00',
      apiSourceId: 'api-3',
      apiSourceName: 'Teva 商品庫存 API',
      lastUpdateTime: '2026-07-30 08:00',
      lastUpdateBy: 'API 同步',
      versions: [
        {
          id: 'k9-v1.0',
          knowledgeId: 'k9',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: 'Teva 商品庫存即時資料',
          summary: '由 Teva 商品庫存 API 同步更新，涵蓋主力品項現有庫存量與低庫存警示，共 2 個知識單元。',
          content: `# Teva 商品庫存即時資料（2026-07-30 最新同步）

> **資料來源**：Teva 商品庫存 API｜**同步時間**：2026-07-30 08:00｜**版本**：v1.0

---

## 一、Teva 商品線總覽

| 商品編號 | 品名 | 現有庫存 | 狀態 |
|---------|------|---------|------|
| TEVA-XLT2-2026 | TEVA Hurricane XLT2 涼鞋 | 320 件 | 🟢 正常 |
| TEVA-VERGE-2026 | TEVA Hurricane Verge 水陸機能鞋 | 210 件 | 🟢 正常 |
| TEVA-RIDGE-2026 | TEVA Ridgeview 秋冬機能涼鞋（新品） | 260 件 | 🟢 正常，新品剛到貨 |
| TEVA-OU-2026 | TEVA Original Universal | 18 件 | 🟡 低庫存 |

---

## 二、低庫存警示

**TEVA Original Universal**（現有庫存 18 件）：因 6 月銷售暢旺（單月銷售額 NT$1,988,000，為當月熱銷第 4 名），現貨去化速度快，目前僅剩 18 件，預計 8/20 補貨到位。⚠️ **不建議作為大規模曝光的主打商品**，適合改以限量／稀缺角度操作。`,
          tags: ['商品', 'Teva', 'API'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-07-30 08:00',
          updateNote: 'API 自動同步，更新 Teva 商品線庫存與低庫存警示',
          sourceFiles: [],
          chunks: [
            {
              index: 1,
              sectionPath: '一、Teva 商品線總覽',
              content: 'Teva 商品線現有庫存：Hurricane XLT2 320 件（正常）、Hurricane Verge 210 件（正常）、新品 Ridgeview 260 件（正常，剛到貨）、Original Universal 18 件（低庫存）。',
              tokenCount: 312,
              sourceType: 'text',
              gist: '列出 Teva 四款主力品項的現有庫存量與狀態燈號。',
              qaPairs: [
                'Teva 目前有哪些主力品項？',
                'Hurricane XLT2 現在庫存多少？',
                '新品 Ridgeview 庫存狀況如何？',
                '哪一款 Teva 商品庫存偏低？',
              ],
              taxonomyTags: ['商品文件/庫存管理/Teva商品線'],
              citationCount: 3,
            },
            {
              index: 2,
              sectionPath: '二、低庫存警示',
              content: 'Original Universal 因 6 月銷售暢旺（NT$1,988,000，當月熱銷第4名）去化快，現貨僅剩 18 件，預計 8/20 補貨。不建議作為大規模曝光主打，適合改以限量／稀缺角度操作。',
              tokenCount: 268,
              sourceType: 'text',
              gist: 'Original Universal 因熱賣導致庫存偏低，說明原因、補貨時程與行銷操作建議。',
              qaPairs: [
                'Original Universal 為什麼庫存只剩18件？',
                'Original Universal 何時補貨？',
                '庫存這麼低適合當促銷主打嗎？',
                '低庫存商品可以怎麼操作行銷？',
              ],
              taxonomyTags: ['商品文件/庫存管理/低庫存警示'],
              citationCount: 6,
            },
          ],
          embeddingModel: 'BAAI/bge-m3',
          embeddingDimension: 1024,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k10',
      title: '2026換季社群輿情彙整',
      category: '市場情報',
      status: 'active',
      sourceType: 'API',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: '2026-07-29 07:00',
      apiSourceId: 'api-4',
      apiSourceName: '社群輿情監測 API',
      lastUpdateTime: '2026-07-29 07:00',
      lastUpdateBy: 'API 同步',
      versions: [
        {
          id: 'k10-v1.0',
          knowledgeId: 'k10',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '2026換季社群輿情彙整',
          summary: '社群輿情監測 API 彙整近期機能戶外穿搭聲量與熱門標籤、色彩偏好，共 1 個知識單元。',
          content: `# 2026換季社群輿情彙整（2026-07-29 最新同步）

> **資料來源**：社群輿情監測 API｜**同步時間**：2026-07-29 07:00｜**版本**：v1.0

---

## 一、社群聲量與熱門標籤

近 30 天「機能涼鞋」「戶外機能穿搭」相關貼文聲量較上季成長 42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。使用者偏好色彩以大地色系（卡其、軍綠、棕）為主，搭配螢光點綴色（螢光黃、螢光橘）作為視覺焦點。`,
          tags: ['市場情報', '社群', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-07-29 07:00',
          updateNote: 'API 自動同步，更新換季社群聲量與色彩偏好',
          sourceFiles: [],
          chunks: [
            {
              index: 1,
              sectionPath: '一、社群聲量與熱門標籤',
              content: '近30天機能涼鞋／戶外機能穿搭聲量較上季成長42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。色彩偏好：大地色系為主，螢光點綴色為視覺焦點。',
              tokenCount: 245,
              sourceType: 'text',
              gist: '說明近期社群上機能戶外穿搭的聲量成長幅度、熱門標籤與色彩偏好。',
              qaPairs: [
                '機能涼鞋在社群上的聲量如何？',
                '目前有哪些熱門標籤？',
                '消費者偏好什麼顏色？',
              ],
              taxonomyTags: ['市場情報/社群輿情/換季趨勢'],
              citationCount: 4,
            },
          ],
          embeddingModel: 'BAAI/bge-m3',
          embeddingDimension: 1024,
          embeddingCount: 1,
        },
      ],
    },
    {
      id: 'k11',
      title: '時尚雜誌趨勢報導彙整',
      category: '市場情報',
      status: 'active',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-07-25 10:00',
      lastUpdateBy: 'Ivy',
      versions: [
        {
          id: 'k11-v1.0',
          knowledgeId: 'k11',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '時尚雜誌趨勢報導彙整',
          summary: '彙整近期時尚雜誌對機能穿搭與永續材質趨勢的報導重點，共 1 個知識單元。',
          content: '# 時尚雜誌趨勢報導彙整\n\n彙整國內外時尚雜誌 7 月報導重點：Gorpcore（機能露營風）持續發燒，機能涼鞋搭配機能襪成為秋冬過渡穿搭示範重點；多篇報導點名永續回收材質是各品牌本季行銷主打話題。',
          tags: ['市場情報', '雜誌', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'Ivy',
          lastUpdateTime: '2026-07-25 10:00',
          updateNote: '彙整7月時尚雜誌報導重點',
          sourceFiles: [{ fileId: 'res-magazine-trend-2026-07', fileName: '2026年7月時尚雜誌趨勢彙整.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、機能穿搭與永續材質趨勢',
              content: 'Gorpcore機能露營風持續發燒，機能涼鞋+機能襪成秋冬過渡穿搭示範重點；永續回收材質是各品牌本季行銷主打話題。',
              tokenCount: 210,
              sourceType: 'text',
              gist: '說明時尚雜誌報導的機能穿搭風格與永續材質行銷話題。',
              qaPairs: [
                '時尚雜誌現在都在報導什麼穿搭風格？',
                '機能涼鞋要怎麼搭配？',
                '永續材質是熱門話題嗎？',
              ],
              taxonomyTags: ['市場情報/雜誌報導/機能穿搭'],
              citationCount: 2,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 1,
        },
      ],
    },
    {
      id: 'k12',
      title: '戶外機能鞋產業趨勢報告',
      category: '市場情報',
      status: 'active',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-07-20 09:30',
      lastUpdateBy: 'Ivy',
      versions: [
        {
          id: 'k12-v1.0',
          knowledgeId: 'k12',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '戶外機能鞋產業趨勢報告',
          summary: '產業分析報告彙整戶外機能鞋市場成長率、材質偏好與競品促銷風險，共 1 個知識單元。',
          content: '# 戶外機能鞋產業趨勢報告\n\n2026年戶外機能鞋市場年增率預估達 11%；消費者對永續回收材質的偏好持續上升。需留意競品品牌陸續祭出換季促銷折扣，價格戰風險升高，建議促銷方案應同步規劃差異化話題操作，而非單純比價。',
          tags: ['市場情報', '產業報告', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'Ivy',
          lastUpdateTime: '2026-07-20 09:30',
          updateNote: '新增2026戶外機能鞋產業趨勢報告',
          sourceFiles: [{ fileId: 'res-industry-trend-2026', fileName: '2026戶外機能鞋產業趨勢報告.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、市場成長與競品風險',
              content: '2026年戶外機能鞋市場年增率預估11%；消費者對永續回收材質偏好上升；競品陸續祭出換季促銷，價格戰風險升高，建議搭配差異化話題操作。',
              tokenCount: 232,
              sourceType: 'text',
              gist: '說明戶外機能鞋市場成長率、材質偏好趨勢，以及競品促銷帶來的價格戰風險。',
              qaPairs: [
                '戶外機能鞋市場成長率多少？',
                '消費者材質偏好趨勢是什麼？',
                '競品促銷會帶來什麼風險？',
              ],
              taxonomyTags: ['市場情報/產業報告/市場趨勢'],
              citationCount: 3,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 1,
        },
      ],
    },
```

- [ ] **Step 2: Insert the two new API sources**

In the same file, find `const apiSources = ref<ApiSource[]>([` and its closing `]);` (currently right after the `api-2` item, line 823-824). Insert these two entries right before that `]);`:

```typescript
    {
      id: 'api-3',
      name: 'Teva 商品庫存 API',
      url: 'https://erp.internal/teva/inventory',
      method: 'GET',
      headers: [{ key: 'X-API-Key', value: 'erp-key-teva-01' }],
      body: '',
      titleField: 'skuName',
      contentField: 'stockQty',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-07-30 08:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 4,
      lastSyncError: null,
    },
    {
      id: 'api-4',
      name: '社群輿情監測 API',
      url: 'https://social-listening.example.com/reports',
      method: 'GET',
      headers: [{ key: 'Authorization', value: 'Bearer social-demo-token' }],
      body: '',
      titleField: 'topic',
      contentField: 'summary',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-07-29 07:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 1,
      lastSyncError: null,
    },
```

- [ ] **Step 3: Add the new category to the KnowledgeEditor dropdown**

In `src/views/KnowledgeEditor.vue`, the `:options` array at line 106-111 currently lists 4 categories. Add a 5th entry so editing `k10`/`k11`/`k12` shows the correct category selected instead of falling back to blank:

```typescript
                :options="[
                  { name: '商品文件', value: '商品文件' },
                  { name: '系統文件', value: '系統文件' },
                  { name: '客服知識', value: '客服知識' },
                  { name: '規則說明', value: '規則說明' },
                  { name: '市場情報', value: '市場情報' },
                ]"
```

- [ ] **Step 4: Type-check and lint**

Run: `npm run type-check`
Expected: no errors related to `knowledgeStore.ts` or `KnowledgeEditor.vue`.

Run: `npm run lint`
Expected: no new lint errors (auto-fixes formatting if needed).

- [ ] **Step 5: Manual verification**

Run `npm run dev`, open the Knowledge Base view, and confirm `k9`–`k12` (Teva 商品庫存即時資料 / 2026換季社群輿情彙整 / 時尚雜誌趨勢報導彙整 / 戶外機能鞋產業趨勢報告) appear in the list with status "active" and open correctly. Confirm editing one of the `市場情報` items shows "市場情報" pre-selected in the 分類 dropdown.

- [ ] **Step 6: Commit**

```bash
git add src/stores/knowledgeStore.ts src/views/KnowledgeEditor.vue
git commit -m "$(cat <<'EOF'
feat(ai-viewer): add Teva inventory and trend knowledge base entries

Adds k9-k12 mock knowledge items (Teva stock levels, social/magazine/
industry trend sources) and their API source records, for the upcoming
conv5 seasonal promotion conversation.
EOF
)"
```

---

### Task 2: Build the two Teva promotion strategy HTML reports

**Files:**
- Create: `public/teva_seasonal_promotion_strategy.html`
- Create: `public/teva_seasonal_promotion_strategy-1.html`

**Interfaces:**
- Consumes: exact inventory/sales figures from Task 1 (`k9`, `k7`) — numbers must match verbatim.
- Produces: two static files served at `/justagent/teva_seasonal_promotion_strategy.html` and `/justagent/teva_seasonal_promotion_strategy-1.html`, referenced by `addReportBlock(...)` calls added in Task 3/4.

- [ ] **Step 1: Look at an existing reference report for visual language**

Read `public/hurricane_trailsetter_marketing_strategy.html` and `public/sanuo_2026_06_sales_report.html` — note their `:root` CSS custom properties (`--bg`, `--surface`, `--border`, `--blue`, etc.), card/table layout, and overall structure. The two new reports must visually match this existing series (same CSS variable naming convention, same general layout language: header with title/status badge, stat cards row, content sections, tables) — do not invent a different visual system.

- [ ] **Step 2: Invoke the frontend-design skill and build the v1 (initial) report**

Use the `frontend-design` skill to produce `public/teva_seasonal_promotion_strategy.html` as a standalone, self-styled HTML file (own `<style>` block, no dependency on the Vue app's CSS) with exactly this content:

- **頁首**：標題「Teva 2026 換季促銷方案」、副標「行銷策略與風險評估」、狀態標籤「草案 v1」。
- **摘要卡（4 張 stat-card）**：主打商品「TEVA Original Universal」、檔期「8/15–9/30」、預算配置「社群廣告 60% ／雜誌置入 20% ／電商首頁 20%」、預期營收（合理估算值，例如 NT$4,200,000）。
- **趨勢摘要區塊（3 條，呼應 k10/k11/k12）**：① Gorpcore／機能穿搭聲量成長 42%，熱門標籤 #機能涼鞋 #水陸兩用；② 時尚雜誌報導機能涼鞋＋機能襪的秋冬過渡穿搭與永續材質話題；③ 產業報告：戶外機能鞋市場年增率 11%，競品換季促銷／價格戰風險上升。
- **行銷策略內文**：說明選擇 Original Universal 作為主打的理由——它是 2026 年 6 月銷售第 4 名（NT$1,988,000），與本季 Gorpcore 趨勢契合，因此規劃大量社群與雜誌曝光、doorbuster 折扣、電商首頁主視覺。**不得提及任何庫存數字或庫存風險**——這是本版刻意植入的資料錯誤（初版只看了銷售排行，沒有交叉比對庫存）。
- **風險評估表（3 列）**：供應鏈風險（低—原物料供應穩定）、市場競爭風險（中—競品同步促銷）、**庫存風險（低—未特別說明，或直接寫「無虞」）**——這一列的錯誤評級是本版核心破綻，修正版會更正它。
- 全部顏色使用 CSS 自訂屬性（`:root` 變數），不得寫死 hex 色碼在內文樣式中。

- [ ] **Step 3: Build the v-1 (revised) report**

Using the same skill/session, produce `public/teva_seasonal_promotion_strategy-1.html` as a second standalone file, same structural skeleton as v1, with these changes:

- **頁首狀態標籤**改為「修正版 v2」。
- 頁首下方新增一段「本版修正說明」，逐條列出與初版的差異：① 主打商品由 Original Universal 改為 Hurricane XLT2；② 廣告預算 60% 隨主打商品一併轉移至 Hurricane XLT2；③ 庫存風險評級由「低／無虞」更正為「高」。
- **摘要卡**：主打商品改為「TEVA Hurricane XLT2」，其餘檔期/預算配置/預期營收沿用相同結構（預算配置的商品名稱同步替換）。
- **新增一個小節「限量珍藏款：Original Universal」**：說明 Original Universal 現貨僅剩 18 件、將以「每日限量 18 雙」的稀缺感行銷角度操作，而非取消曝光。
- **趨勢摘要區塊**維持與 v1 相同（趨勢資料本身沒有錯，錯誤只在庫存交叉比對）。
- **風險評估表**：庫存風險欄位更新為「高（Original Universal 現貨僅 18 件，已改列限量款操作；主力款 Hurricane XLT2 庫存 320 件無虞）」，其餘兩列維持不變。
- 兩份報告的數字必須完全一致（例如預期營收、供應鏈/市場競爭風險敘述），僅上述列出的項目不同——避免自相矛盾。

- [ ] **Step 4: Manual verification**

Open both files directly in a browser (e.g. `open public/teva_seasonal_promotion_strategy.html`) and confirm: layout renders correctly standalone (no console errors about missing assets), visual style matches `hurricane_trailsetter_marketing_strategy.html`'s CSS variable language, and the v1 report genuinely does not mention any stock/inventory numbers while the v-1 report does.

- [ ] **Step 5: Commit**

```bash
git add public/teva_seasonal_promotion_strategy.html public/teva_seasonal_promotion_strategy-1.html
git commit -m "$(cat <<'EOF'
feat(ai-viewer): add Teva seasonal promotion strategy report HTML

Adds the two standalone report artifacts for conv5: an initial draft
that recommends a low-stock hero product, and a revised version with
the corrected hero product and updated risk assessment.
EOF
)"
```

---

### Task 3: Wire up conv5 registration and the initial request/inventory/trend/report flow

**Files:**
- Modify: `src/components/AiViewer/conversationListModal.vue:19-22` (add conv5 `<li>` after the conv4 one)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` (multiple locations, listed per step below)

**Interfaces:**
- Consumes: `KnowledgeSource` interface (already declared locally at `AiViewerRightBox.vue:764`), `addReportBlock(fileUrl: string, blockName: string)` from `AiViewerStore.ts:957`, `htmlIcon` import at `AiViewerRightBox.vue:761`, the `k7`/`k9`/`k10`/`k11`/`k12` knowledge ids from Task 1, the two report files from Task 2.
- Produces: `conv5Msgs` (`Ref<any[]>`), `conv5Title` (`Ref<string>`), `conv5FollowUpDone` (`Ref<boolean>`), `conv5ConcernFpVisible` (`Ref<boolean>`), `conv5ConcernInput` (`Ref<string>`), functions `c5Push(msg: any)`, `c5Scroll()`, `conv5InitFlow()`, `conv5FlipSearchCard(from: string[], to: string[])`, `conv5Approve()` — all consumed by Task 4's correction-flow functions and by the template.

- [ ] **Step 1: Add the conv5 entry to the conversation list modal**

In `src/components/AiViewer/conversationListModal.vue`, after the conv4 `<li>` (lines 19-22) and before the closing `</ul>` (line 23), add:

```html
        <li :class="{ active: currentConversationId === 'conv5' }" @click="switchConversation('conv5')">
          <span>Teva 換季促銷方案規劃</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
```

- [ ] **Step 2: Add the conv5 state block and script functions in `AiViewerRightBox.vue`**

Right after the existing `// -------- end Conversation 4 流程 --------` marker (currently line 2560), insert a new section:

```typescript

// -------- Conversation 5 流程 --------
const conv5Msgs = ref<any[]>([]);
let conv5IdCounter = 2;
const conv5Title = ref('');
const conv5FollowUpDone = ref(false);
const conv5ConcernFpVisible = ref(false);
const conv5ConcernInput = ref('');

function c5Push(msg: any) {
  conv5Msgs.value.push({ id: `c5_${conv5IdCounter++}`, ...msg });
}
function c5Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

const CONV5_INVENTORY_SOURCE: KnowledgeSource[] = [
  { knowledgeId: 'k9', title: 'Teva 商品庫存即時資料', chunkIndexes: [0] },
];
const CONV5_TREND_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k10', title: '2026換季社群輿情彙整', chunkIndexes: [0] },
  { knowledgeId: 'k11', title: '時尚雜誌趨勢報導彙整', chunkIndexes: [0] },
  { knowledgeId: 'k12', title: '戶外機能鞋產業趨勢報告', chunkIndexes: [0] },
];
const CONV5_STRATEGY_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k7', title: '2026Q1產品銷售數據彙總', chunkIndexes: [1] },
  ...CONV5_INVENTORY_SOURCE,
  ...CONV5_TREND_SOURCES,
];

function conv5InitFlow() {
  if (conv5Msgs.value.length > 0) return;
  conv5Title.value = 'Teva 換季促銷方案規劃';
  c5Push({ forUser: true, msg: '換季檔期快到了，幫我提供一份 Teva 的促銷方案，記得先看一下目前庫存，也了解一下現在社群、時尚雜誌跟趨勢報告在流行什麼，最後整理成行銷策略和風險評估。' });

  setTimeout(() => {
    c5Push({ msg: `收到，我先查詢目前的商品庫存⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">InventoryQuery 查詢 Teva 商品線即時庫存</div>
</div>` });
    c5Scroll();

    setTimeout(() => {
      conv5FlipSearchCard(['conv2-ss--active'], ['conv2-ss--done']);
      c5Push({
        finishResponse: true,
        msg: '📦 庫存查詢完成：Hurricane XLT2、Hurricane Verge、新品 Ridgeview 庫存皆充足；Original Universal 是 6 月熱銷品之一。接著我來看看目前社群、時尚雜誌與趨勢報告在流行什麼⋯',
        sources: CONV5_INVENTORY_SOURCE,
      });
      c5Scroll();

      setTimeout(() => {
        c5Push({ msg: `<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">SocialTrendScan 社群輿情掃描</div>
  <div class="conv2-ss conv2-ss--wait">MagazineTrendScan 時尚雜誌趨勢彙整</div>
  <div class="conv2-ss conv2-ss--wait">IndustryReportScan 產業趨勢報告彙整</div>
</div>` });
        c5Scroll();

        setTimeout(() => {
          conv5FlipSearchCard(
            ['conv2-ss--active', 'conv2-ss--wait', 'conv2-ss--wait'],
            ['conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done'],
          );
          try {
            addReportBlock('/justagent/teva_seasonal_promotion_strategy.html', 'Teva 2026 換季促銷方案.html');
          } catch { /* 畫布可能尚未初始化 */ }
          c5Push({
            finishResponse: true,
            msg: `✅ 已完成 Teva 換季促銷方案，主打商品鎖定 6 月銷售亮眼的 Original Universal，並依 Gorpcore／機能穿搭趨勢規劃社群與雜誌曝光。報告已加入畫布，可直接查看或下載。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">Teva 2026 換季促銷方案.html</div>
    <div class="file-size">HTML · 7.1 KB · 已加到畫布</div>
  </div>
</div>
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv5-approve">✅ 沒問題，可以啟動</span>
  <span class="conv1-quick-btn" data-action="conv5-raise-concern">⚠️ 我有疑慮</span>
</div>`,
            sources: CONV5_STRATEGY_SOURCES,
          });
          c5Scroll();
        }, 1800);
      }, 500);
    }, 1600);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv4FlipSearchCard）
function conv5FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv5Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv5Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}

function conv5Approve() {
  if (conv5FollowUpDone.value) return;
  conv5FollowUpDone.value = true;
  c5Push({ forUser: true, msg: '沒問題，可以啟動' });
  c5Scroll();
  setTimeout(() => {
    c5Push({ msg: '太好了，方案已確認，8/15 檔期啟動前我會再提醒相關單位備貨與素材上架！' });
    c5Scroll();
  }, 500);
}
// -------- end Conversation 5 流程 --------
```

> Task 4 will add `submitConv5Concern()` and `conv5ReviseStrategy()` right after `conv5Approve()`, still inside this same `-------- Conversation 5 流程 --------` block (move the `// -------- end Conversation 5 流程 --------` marker down when doing so).

- [ ] **Step 3: Wire the canned-task entry point**

In `cannedTaskItems` (`AiViewerRightBox.vue:991`), after the existing `conv4` branch and before the final `return [ /* 既有 conv1 罐頭任務 */ ]`, add:

```typescript
  if (currentConversationId.value === 'conv5') {
    return [{ id: 'tevaPromotion', text: '提供 Teva 換季促銷方案' }];
  }
```

In `sendCannedTask` (`AiViewerRightBox.vue:1008`), after the existing conv4 branch and before `send();`, add:

```typescript
  if (currentConversationId.value === 'conv5' && item.id === 'tevaPromotion') {
    resetConversation();
    nextTick(() => conv5InitFlow());
    return;
  }
```

- [ ] **Step 4: Wire canvas reset, title, and message-array selection**

In the `watch(currentConversationId, ...)` block (`AiViewerRightBox.vue:943-951`), add a branch:

```typescript
  } else if (id === 'conv5') {
    aiViewerBlocks.value = [];
```

In `currentConversationTitle` (`AiViewerRightBox.vue:937-941`), add before the final `return conv1Title.value;`:

```typescript
  if (currentConversationId.value === 'conv5') return conv5Title.value || 'Teva 換季促銷方案規劃';
```

In `testMsgs` (`AiViewerRightBox.vue:2562-2568`), extend the ternary chain:

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv5' ? conv5Msgs.value
    : conv1Msgs.value;
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

In `resetConversation()` (`AiViewerRightBox.vue:2570-2615`), add a block parallel to (not `else if`) the existing conv4 block:

```typescript
  if (currentConversationId.value === 'conv5') {
    conv5IdCounter = 2;
    conv5Title.value = '';
    conv5Msgs.value = [];
    conv5FollowUpDone.value = false;
    conv5ConcernFpVisible.value = false;
    conv5ConcernInput.value = '';
  }
```

- [ ] **Step 5: Hide the input box while the concern panel is open**

In `inputAreaHidden` (`AiViewerRightBox.vue:1874`), extend it:

```typescript
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value || conv5ConcernFpVisible.value);
```

- [ ] **Step 6: Add the quick-reply button click handlers**

In `handleChatAreaClick` (`AiViewerRightBox.vue:2149`), right after the existing `conv4-build-skill`/`conv4-skip-skill` branches (ending at line 2184) and **before** the `if (currentConversationId.value !== 'conv2') return;` guard (line 2186), add:

```typescript
  // conv5 促銷方案確認／回報疑慮快速按鈕
  if (action === 'conv5-approve') {
    conv5Approve();
    return;
  }
  if (action === 'conv5-raise-concern') {
    conv5ConcernFpVisible.value = true;
    return;
  }
```

- [ ] **Step 7: Type-check and lint**

Run: `npm run type-check`
Expected: no errors. (`conv5ConcernFpVisible`/`conv5ConcernInput` are declared but the panel/submit function referencing them come in Task 4 — `handleChatAreaClick` only *sets* `conv5ConcernFpVisible.value = true`, which is valid Vue ref usage on its own.)

Run: `npm run lint`
Expected: no new lint errors.

- [ ] **Step 8: Manual verification**

Run `npm run dev`, open AiViewer, open the conversation list modal and confirm "Teva 換季促銷方案規劃" appears and switches to an empty conv5 canvas. Open the 快速任務 (⚡) list and click "提供 Teva 換季促銷方案" — confirm the full scripted flow plays: user request → inventory progress card flips to done → inventory summary message with a clickable source chip for `k9` → trend progress card (3 steps) flips to done → final report message with the two quick-reply buttons, and the report HTML block appears in the canvas. Click each source chip and confirm `KnowledgeSourceDrawer` shows real content (not empty).

- [ ] **Step 9: Commit**

```bash
git add src/components/AiViewer/conversationListModal.vue src/components/AiViewer/AiViewerRightBox.vue
git commit -m "$(cat <<'EOF'
feat(ai-viewer): wire up conv5 entry point and initial promotion flow

Adds the conv5 conversation list entry, canned-task entry point, and
the scripted inventory-lookup -> trend-research -> strategy-report flow,
following conv4's established inline-state conventions.
EOF
)"
```

---

### Task 4: Add the concern/correction round-trip (data-error revision flow)

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` (template floating panel + two new functions inside the Conversation 5 section)

**Interfaces:**
- Consumes: `conv5ConcernFpVisible`, `conv5ConcernInput`, `conv5FollowUpDone`, `c5Push`, `c5Scroll`, `conv5FlipSearchCard`, `addReportBlock`, `htmlIcon` — all from Task 3.
- Produces: `submitConv5Concern()` (bound to the panel's submit button), `conv5ReviseStrategy()` (internal, called by `submitConv5Concern`) — no later task depends on these, this is the terminal behavior.

- [ ] **Step 1: Add the floating "回報方案疑慮" panel to the template**

In `AiViewerRightBox.vue`, right after the conv1 「旅程修改需求」floating panel's closing `</div>` (currently line 642, immediately before the `<!-- Conv1 翻譯確認動作列 -->` comment), insert:

```html
        <!-- Conv5 促銷方案疑慮回饋懸浮面板 -->
        <div v-if="conv5ConcernFpVisible && currentConversationId === 'conv5'" class="conv2-fp" @click.stop>
          <div class="conv2-fp-top">
            <span class="conv2-fp-title">回報方案疑慮</span>
            <button class="conv2-fp-close-btn" @click.stop="conv5ConcernFpVisible = false">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="conv2-fp-body">
            <div class="conv2-info-note">✦ 描述您發現的問題</div>
            <textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv5ConcernInput" rows="3" @click.stop
              placeholder="例如：主打商品的庫存足夠支撐大量曝光嗎？"></textarea>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-submit-btn" @click.stop="submitConv5Concern()">確認送出 →</button>
            </div>
          </div>
        </div>
```

- [ ] **Step 2: Add `submitConv5Concern()` and `conv5ReviseStrategy()`**

In the script section, find `conv5Approve()` (added in Task 3, right before `// -------- end Conversation 5 流程 --------`). Insert these two functions right after it, still before the end marker:

```typescript

function submitConv5Concern() {
  if (conv5FollowUpDone.value) return;
  const msg = conv5ConcernInput.value.trim();
  if (!msg) return;
  conv5FollowUpDone.value = true;
  c5Push({ forUser: true, msg });
  conv5ConcernInput.value = '';
  conv5ConcernFpVisible.value = false;
  c5Scroll();
  conv5ReviseStrategy();
}

function conv5ReviseStrategy() {
  setTimeout(() => {
    c5Push({ msg: `您說得對，我重新核對一次庫存⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">InventoryQuery 重新核對 Teva 商品線即時庫存</div>
</div>` });
    c5Scroll();

    setTimeout(() => {
      conv5FlipSearchCard(['conv2-ss--active'], ['conv2-ss--done']);
      try {
        addReportBlock('/justagent/teva_seasonal_promotion_strategy-1.html', 'Teva 2026 換季促銷方案（修正版）.html');
      } catch { /* 畫布可能尚未初始化 */ }
      const CONV5_REVISED_SOURCES: KnowledgeSource[] = [
        { knowledgeId: 'k9', title: 'Teva 商品庫存即時資料', chunkIndexes: [0, 1] },
        { knowledgeId: 'k7', title: '2026Q1產品銷售數據彙總', chunkIndexes: [1] },
      ];
      c5Push({
        finishResponse: true,
        msg: `已修正：Original Universal 現貨僅剩 18 件，不適合作為大量曝光的主打商品，已改由庫存充足（320 件）、同樣熱銷的 Hurricane XLT2 接手主打，60% 廣告預算同步轉移；Original Universal 改包裝為「限量珍藏款」，用低庫存做稀缺感話題操作，風險評估表也已同步更新。修正版報告已加入畫布。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">Teva 2026 換季促銷方案（修正版）.html</div>
    <div class="file-size">HTML · 7.4 KB · 已加到畫布</div>
  </div>
</div>`,
        sources: CONV5_REVISED_SOURCES,
      });
      c5Scroll();
    }, 1800);
  }, 300);
}
```

> `CONV5_REVISED_SOURCES` is declared inline inside `conv5ReviseStrategy()` (rather than as a module-level const like `CONV5_STRATEGY_SOURCES`) since nothing else references it — keep it local to avoid an unused-at-module-scope lint warning.

- [ ] **Step 3: Type-check and lint**

Run: `npm run type-check`
Expected: no errors.

Run: `npm run lint`
Expected: no new lint errors.

- [ ] **Step 4: Manual verification — full correction round-trip**

Run `npm run dev`, trigger conv5 via the canned task again (reload or switch conversations to reset). After the initial report message appears, click "⚠️ 我有疑慮" — confirm the floating panel opens and the input box behind it is disabled/hidden. Type a concern (e.g. "主打商品庫存夠嗎？") and submit — confirm: the panel closes, your typed text appears as a user bubble, a progress card plays, and a revised report message appears citing both `k9` chunks (click the `k9` source chip and confirm the drawer shows *both* 商品線總覽 and 低庫存警示 sections, unlike the first citation which only showed 商品線總覽). Confirm the new HTML block (修正版) appears in the canvas alongside the original, not replacing it.

- [ ] **Step 5: Manual verification — approve path (regression check)**

Reset conv5 again, run through to the report message, and this time click "✅ 沒問題，可以啟動" instead. Confirm the approval closing message appears and no revision/panel is triggered. Confirm clicking the same button twice does nothing the second time (idempotency guard).

- [ ] **Step 6: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "$(cat <<'EOF'
feat(ai-viewer): add conv5 data-error correction round-trip

Lets the user flag that the initial Teva promotion plan recommended a
low-stock hero product; the agent rechecks inventory and produces a
revised report with the corrected hero product and risk assessment.
EOF
)"
```

---

### Task 5: Final verification pass

**Files:** none (verification only; fix forward in the relevant file above if something breaks)

- [ ] **Step 1: Full project type-check**

Run: `npm run type-check`
Expected: exits 0, no errors anywhere in the project.

- [ ] **Step 2: Full project lint**

Run: `npm run lint`
Expected: exits 0, no errors.

- [ ] **Step 3: Production build sanity check**

Run: `npm run build`
Expected: build succeeds; confirm `dist/teva_seasonal_promotion_strategy.html` and `dist/teva_seasonal_promotion_strategy-1.html` exist in the output (public/ files are copied as-is).

- [ ] **Step 4: End-to-end manual click-through**

Run `npm run dev`. Starting from a fresh conv5 (use conversation list → delete/reset if needed, or just switch away and back):

1. Open the conversation list — confirm all five conversations (conv1, conv2, conv4, conv5, plus whichever conv1 default entry) list correctly and conv5's title reads "Teva 換季促銷方案規劃" both in the list and in the top header once active.
2. Trigger "提供 Teva 換季促銷方案" from 快速任務 — watch the full initial flow play through without console errors.
3. Click through both branches once each in two separate resets: (a) approve, (b) raise a concern and confirm the revision. Confirm canvas ends up with 1 report block (approve path) or 2 report blocks (concern path, original + revised).
4. Switch to conv1/conv2/conv4 and back to conv5 mid-flow at least once — confirm no cross-conversation state leakage (e.g. conv5's floating panel does not appear while on conv1/conv2/conv4, and vice versa).

- [ ] **Step 5: Fix forward if anything fails**

If any check in Steps 1-4 fails, fix the issue in the relevant file from Task 1-4, re-run the failing check, and commit the fix with a `fix(ai-viewer): ...` message describing what broke and why. If everything passes, no commit is needed for this task.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec (對話列表變更／入口機制／訊息陣列串接／對話腳本／按鈕與面板／知識庫串接／結果報告／樣式／不在此次範圍內) maps to Task 1 (KB), Task 2 (reports), Task 3 (registration + initial flow), Task 4 (correction flow). The spec's illustrative `chunkIndexes` values were 1-based (matching `chunk.index`); this plan corrects them to the real 0-based array-position semantics used by `KnowledgeSourceDrawer` (verified against `k7`'s existing `chunkIndexes: [0, 1]` usage in `CONV4_SOURCES`).
- **No placeholders:** all knowledge content, HTML report content requirements, and code are fully spelled out; the only two open-ended items (exact visual HTML markup/CSS for the two reports) are explicitly delegated to the `frontend-design` skill with a fully specified content brief, matching how conv4's spec handled its own report file.
- **Type consistency:** `KnowledgeSource`, `conv5Msgs`, `c5Push`, `conv5FlipSearchCard`, `conv5ConcernFpVisible`/`conv5ConcernInput`/`conv5FollowUpDone` are used with identical names and shapes across Tasks 3 and 4.
