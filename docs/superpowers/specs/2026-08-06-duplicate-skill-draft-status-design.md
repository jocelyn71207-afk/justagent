# 複製技能建立草稿狀態與內容警示 — 設計文件

日期：2026-08-06

## 背景

目前使用者可以從「Library 技能庫」或「我的技能」點擊「建立副本」，統一透過 `store.duplicateAsPersonalSkill()` 在「我的技能」內建立一份內容完全相同的個人技能複本。複本建立後會立即彈出「已建立複本」對話框，讓使用者選擇「跟 Agent 對話修改」或「直接編輯」，但目前：

1. 複本的 `personalStatus` 直接設為 `'available'`，跟一份已經修改過、確認可用的技能無法區分。
2. 「已建立複本」對話框只問「接下來想怎麼修改這份複本？」，沒有提示使用者：內容跟原技能一模一樣，若不修改就留著，容易在後續維運時難以分辨，也可能造成 Agent 判斷失準。

本次要補上「草稿」狀態與對應提示，讓使用者清楚知道這份複本尚未修改，需要處理。

## 目標

- 複製出來的個人技能，狀態標示為「草稿」，在「我的技能」列表與詳情頁都能一眼看出。
- 使用者透過「直接編輯」或「跟 Agent 對話修改」任一路徑實際儲存過內容後，自動脫離草稿狀態，轉為「可使用」，不需要額外的手動切換動作。
- 「已建立複本」對話框加上明確的警示文案，說明內容相同的風險，引導使用者去修改。

## 非目標

- 不阻擋使用者在草稿狀態下送審或啟用技能（維持既有寬鬆流程，只做視覺提示，不做強制卡關）。
- 不處理「skillName 重複」的警告（`hasSkillNameConflict` / `name-conflict-banner`），那是既有的獨立功能，本次不變動。
- 不重構 `DraftSkill`（從零建立技能的暫存草稿）資料模型，複製副本走的是完整 `Skill` 物件的 `personalStatus`，跟 `DraftSkill` 是兩條不相關的路徑。

## 設計

### 1. 資料模型：`personalStatus` 新增 `'draft'`

`src/stores/skillStore.ts`：

```ts
personalStatus?: 'draft' | 'available' | 'reviewing' | 'has_library'
```

`duplicateAsPersonalSkill(sourceId)` 建立副本時，`personalStatus` 由 `'available'` 改為 `'draft'`。其餘欄位（`isEnabled: false`、`usageCount: 0` 等）維持不變。

### 2. 草稿 → 可使用 的自動轉換

兩條既有的「修改既存個人技能內容」路徑都要加上判斷：更新完成後，若該 skill 目前 `personalStatus === 'draft'`，轉為 `'available'`。

- `updateSkill(id, data)`（`src/stores/skillStore.ts:1016-1025`，供 `SkillEditor.vue` 直接編輯儲存使用）：在寫入 `instructions` 等欄位之後，補上：
  ```ts
  if (skill.personalStatus === 'draft') skill.personalStatus = 'available'
  ```
- `sendEditChatMessage(skillId, message)`（`src/stores/skillStore.ts:1432-1452`，供 `SkillEditChatModal.vue` 對話式修改使用）：在寫入 `skill.instructions` 之後，同樣補上上述判斷。

`updateSkill` 對 library skill 呼叫時 `personalStatus` 通常是 `undefined`，判斷不會誤觸發。

### 3. UI：草稿標籤顯示

沿用既有的 `.skill-tag` / `.tag--*` 家族樣式（`.tag--draft` 已定義在 `src/scss/components/_SkillCard.scss:239`，目前無人使用，本次重用，不新增樣式）。

- `PersonalSkillGroup.vue`（`statusLabel` / `statusTagClass`，L23-38）新增分支：
  ```ts
  if (props.skill.personalStatus === 'draft') return '草稿'
  // ...
  if (props.skill.personalStatus === 'draft') return 'tag--draft'
  ```
  放在 `reviewing` 判斷之後、`has_library` 判斷之前皆可（四個狀態互斥）。
- `SkillDetailDrawer.vue`（`personalStatusLabel` / `personalStatusClass`，L400-417）同步新增對應分支。
- 編輯／送審按鈕的顯示條件（`v-if="skill.personalStatus !== 'reviewing'"`，L292、L302）維持不變：草稿狀態下這兩個按鈕正常顯示，可編輯、可送審。

### 4. UI：「已建立複本」對話框新增警示 banner

`src/views/SkillManagement.vue`（L256-281）的既有對話框，在 `<h4>已建立複本</h4>` 與 `<p>接下來想怎麼修改這份複本？</p>` 之間插入一段警示 banner：

```html
<h4>已建立複本</h4>
<div class="confirm-warning-banner">
  <i class="material-symbols-outlined">info</i>
  這份複本內容目前與原技能完全相同。內容一模一樣的技能會讓後續維運難以區分，也可能造成 Agent 判斷失準，建議修改後再使用。
</div>
<p>接下來想怎麼修改這份複本？</p>
```

樣式新增於 `src/scss/components/_SkillDetailDrawer.scss`（`.drawer-confirm-dialog` 定義所在檔案），視覺風格沿用專案既有的琥珀色警示配色（與 `.name-conflict-banner` 一致，但獨立定義成 `.confirm-warning-banner`，因為情境不同、避免耦合到 `SkillEditChatModal`/`SkillEditor` 的既有 class）：

```scss
.confirm-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba($color-warning-amber, 0.08);
  border: 1px solid rgba($color-warning-amber, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
  text-align: left;
  margin: 4px 0 12px;

  .material-symbols-outlined { font-size: 18px; color: $color-warning-amber; flex-shrink: 0; }
}
```

彈窗本身的 icon 維持 `confirm-icon--update`（綠色 `content_copy`），不改變整體情緒調性，只在文字區塊加入警示。

此彈窗目前是「Library 瀏覽」與「我的技能詳情」兩個入口共用的同一個 `handleDuplicate` 流程（`SkillManagement.vue:532-538`），改一處即同時覆蓋兩個入口，不需要額外分流。

## 資料流

```
使用者點擊「建立副本」（LibraryBrowseModal / SkillDetailDrawer）
  → handleDuplicate(skill)
    → store.duplicateAsPersonalSkill(skill.id)   // personalStatus: 'draft'
    → duplicatedSkill.value = copy
  → 彈出「已建立複本」對話框（含新警示 banner）
    → 使用者選擇「直接編輯」→ SkillEditor.vue → store.updateSkill()      // draft → available
    → 使用者選擇「跟 Agent 對話修改」→ SkillEditChatModal.vue → store.sendEditChatMessage()  // draft → available
  → 「我的技能」列表 / 詳情頁上，該技能顯示「草稿」標籤，直到上述任一儲存動作發生
```

## 測試計畫

在 `src/stores/__tests__/skillStore.test.ts` 新增／擴充：

1. `duplicateAsPersonalSkill()` 建立的複本 `personalStatus` 為 `'draft'`。
2. 對一個 `personalStatus === 'draft'` 的 skill 呼叫 `updateSkill()` 後，`personalStatus` 變為 `'available'`。
3. 對一個 `personalStatus === 'draft'` 的 skill 呼叫 `sendEditChatMessage()` 後，`personalStatus` 變為 `'available'`。
4. 對非草稿狀態（如 `'available'`、`'reviewing'`）呼叫 `updateSkill()` 不應意外改動 `personalStatus`。

UI 層（badge 文字、彈窗文案）以現有專案慣例（無既存 component test 覆蓋此類 UI 文字）為準，不強制新增 component test，但需以 `npm run dev` 手動驗證兩個入口（Library 複製、我的技能複製）皆能看到草稿標籤與警示文案。

## 風險與邊界情況

- `updateSkill` 也會被 library skill 編輯路徑呼叫，但 library skill 沒有 `personalStatus`，不會誤觸發轉換，已在設計中確認。
- 若使用者複製後完全不編輯，直接「送審」（`submitPersonalSkill`），目前設計不阻擋，`personalStatus` 會被送審流程直接改為 `'reviewing'`（草稿標籤消失），符合「不做強制卡關，只做提示」的目標。
- 既有的 `hasSkillNameConflict` 警示（skillName 重複）與本次的「內容相同」警示是兩個獨立提示，觸發時機、UI 位置皆不同，彼此不衝突、不重疊。
