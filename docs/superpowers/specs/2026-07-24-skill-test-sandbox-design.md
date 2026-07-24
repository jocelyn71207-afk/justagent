# 技能測試沙盒（SkillTest）配色與技能清單改版設計規格

**日期：** 2026-07-24
**範圍：** SkillTest.vue、SkillTestChat.vue、skillStore.ts、`src/scss/views/_SkillTest.scss`
**相關設計文件：** `docs/superpowers/specs/2026-07-09-skill-management-personal-zone-design.md`

---

## 背景

技能管理頁面（SkillManagement）已完成「我的技能」個人區塊與 Library 分區重構，但技能測試沙盒（SkillTest）的左側技能選擇清單沒有跟上：

- 側邊欄只讀 `store.flatSkills`（Library 技能），完全沒有「我的技能」個人區塊，個人技能只能靠網址帶 `?skillId=` 硬塞進去測試
- Library 清單是父技能與其擴充版本混雜的原始順序，沒有系統／企業／團隊的分類
- 不排除已停用（`isEnabled === false`）的技能
- Agent 對話泡泡背景色跟外層面板背景完全相同（都是 `var(--page-bg)`），泡泡形狀視覺上等於隱形

本次一併處理這兩個問題。

---

## 一、Agent 對話泡泡配色（SkillTestChat.vue）

| 元素 | 現況 | 改版 |
|---|---|---|
| `.bubble--agent` 背景 | `var(--page-bg)`（跟容器同色） | `var(--surface)` |
| `.bubble--agent` 邊框 | 無 | `1px solid var(--divider-a50)` |
| `.bubble-label`（AI Agent 字樣）顏色 | `var(--text-muted)`，opacity 0.6 | `$color_main_2`，opacity 1 |
| User 泡泡（`.bubble--user`） | `$color_main_1` 底、白字 | 不變 |
| 立體感 | 無 | 不加陰影，純邊框，維持全站扁平風格 |

只異動 `.chat-bubble.bubble--agent` 與 `.bubble-label` 兩處 CSS 規則，light/dark 主題都靠既有 CSS variable 自動適配。

---

## 二、側邊欄技能清單重構（SkillTest.vue）

### 資料來源

```ts
const personalSkills = computed(() => store.myPersonalSkills)          // 不篩狀態，全部個人技能列出
const enabledLibrarySkills = computed(() =>
  store.flatSkills.filter(s => s.isEnabled)                            // 排除已停用
)
```

預設選中邏輯：URL `?skillId=` 優先 → 否則「我的技能」第一筆 → 否則 Library 第一筆。

### 區塊結構

側邊欄分成兩個區塊，標題各自用色底標籤區隔：

- **我的技能**：品牌色底標籤（`background: $color_main_5; color: $color_main_2`）
- **Library 技能**：中性灰底標籤（`background: var(--divider-a50); color: var(--text-muted)`）

Library 技能區塊內，再依 `scope` 分成三個子群組（純文字子標題，不加色底）：

```
Library 技能
  系統技能
    （scope === 'system' 的技能）
  企業擴充
    （scope === 'enterprise' 的技能）
  團隊擴充
    （scope === 'team' 的技能）
```

任一區塊或子群組若為空，整組（含標題）不顯示。

### 每個技能列（統一單行呈現）

不論個人技能或 Library 技能、不論版本數量，每個技能固定一行：

```
[色點（Library 限定：系統=紫點/擴充=琥珀點）] 技能名稱  [scope 標籤（企業/團隊名，系統無標籤）]  [版本控制]
```

**版本控制**（取代原本的狀態 badge）：
- 只有 1 個版本 → 純文字顯示版本號（如 `v1.0`），不可互動
- 有多個版本 → 小型下拉選單（如 `v1.1 ▾`），點開列出所有版本，選哪個就用哪個版本測試；下拉選單內用 `使用中` 小標籤標示目前生效版本

點擊技能列本身（非版本下拉）＝用目前選定版本測試該技能；點擊下拉選單中的其他版本＝切換到該版本並直接開始測試。

**移除項目**：原本規劃的「可使用／審核中／已有Library版」狀態 badge 不採用 —— 沙盒的用途是測試技能行為與各版本表現，不是審核狀態管理，因此個人技能與 Library 技能都能任選版本測試，不因 `personalStatus` 或 `isEnabled` 限制可測試性（`isEnabled` 只影響 Library 技能是否**列出**，不影響已列出技能的可測試版本範圍）。

### 附帶清理

- 移除 `_SkillTest.scss` 裡沒用到的 `.dot--draft` 死代碼

---

## Store 變更摘要

```ts
// 新增：目前選定測試的版本（技能切換時重置為該技能使用中版本）
const selectedVersionTag = ref<string | null>(null)

function setSelectedSkill(id: string, versionTag?: string) {
  selectedSkillId.value = id
  const skill = findSkill(id)
  selectedVersionTag.value =
    versionTag ??
    skill?.personalVersions?.find(v => v.isActive)?.versionTag ??
    skill?.versions?.find(v => v.status === 'active')?.versionTag ??
    skill?.version ??
    null
}
```

版本切換目前只影響顯示與測試時帶的 `versionTag` 參數；mock 資料沒有針對不同版本模擬不同的對話/測試結果差異，各版本測試行為一致。

---

## 不在此次範圍

- 版本間測試結果的差異化模擬（例如舊版本回覆內容不同）——目前 mock 資料不支援，維持所有版本共用同一組測試回應
- `PersonalSkillGroup.vue` 既有的 `tag--available` / `tag--has-library` CSS 缺失問題（探索時發現的既有 bug，與本次沙盒改版無關，不在此次處理）
- 右側面板 header 的 `v{{version}}` / 系統技能/企業擴充 標籤樣式（維持現狀）
- `SkillTestChat.vue` / `SkillTestAI.vue` 內部邏輯（不用改，技能 id 本來就能被 `findSkill` 解析）
