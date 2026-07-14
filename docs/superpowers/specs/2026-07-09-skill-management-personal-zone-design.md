# 技能管理頁面重構：個人技能區整合設計規格

**日期：** 2026-07-09
**範圍：** SkillManagement.vue、SkillCard.vue、送審 dialog、skillStore.ts
**相關設計文件：** `docs/superpowers/specs/2026-07-09-skill-lifecycle-governance-design.md`

---

## 背景

現有技能管理頁面分為「技能清單」與「草稿區」兩個 tab，草稿區僅作為送審前的暫存區。依照 Skill 生命週期治理規格，個人技能需要有獨立且持續存在的個人區，與 Library 技能並列展示，且 Library 技能需強制限制停用與刪除操作。

---

## 頁面結構變更

### 移除 Tab 切換
拿掉「技能清單 / 草稿區」tab 切換，改為單頁垂直 sections。

### 新 Section 排列順序
```
我的技能        ← 個人區，固定在最上方
系統技能        ← 現有，維持不動
企業技能        ← 現有，維持不動
團隊技能        ← 現有，維持不動
```

### 草稿區取消
不再有獨立草稿區。個人技能（含原草稿）統一在「我的技能」section 管理。

---

## 我的技能 Section

### SkillCard 狀態 Badge

每張個人技能 card 顯示一個狀態 badge：

| Badge | 說明 |
|-------|------|
| 可使用 | 技能已建立，可個人使用，尚未送審 |
| 審核中 | 已送審至 Library，等待主管審核 |
| 已有Library版 | 審核通過，Library 已有對應版本 |

### Card 佈局

```
┌─────────────────────────────────────────┐
│ ● 技能名稱                  [狀態badge] │
│ 描述文字...                             │
│ derived_from：系統技能 X  ⚠ 有更新     │
│                     [查看詳情]  [送審]  │
└─────────────────────────────────────────┘
```

**derived_from 顯示：**
- 有 `derived_from` 時顯示來源技能名稱
- 若對應 Library skill 有更新 → 顯示「⚠ 有更新」inline 文字，點擊開啟詳情面板查看更新內容

**[送審] 按鈕狀態：**
- 狀態為「可使用」→ 正常可點擊
- 狀態為「審核中」→ disabled（灰色，不可點擊）
- 狀態為「已有Library版」→ 顯示「再次送審」（允許更新版本送審）

### Card 動作
- **[查看詳情]**：開啟詳情面板
- **[送審]**：開啟送審 dialog

### 詳情面板動作（個人技能專屬）
詳情面板內提供：
- 停用 / 啟用 toggle
- 刪除按鈕

Library 技能詳情面板不出現上述兩項。

### 空狀態
我的技能 section 為空時顯示引導文字，不顯示新建按鈕（個人技能由對話生成或手寫建立，不在此處建立）。

---

## Library 技能 SkillCard 變更（系統 / 企業 / 團隊）

### 移除停用 Toggle
- 啟用 / 停用 toggle 從 card 上**完全移除**，不顯示、不 disabled
- 詳情面板內的停用按鈕同樣移除

### 移除刪除按鈕
- 詳情面板內的刪除按鈕移除

### 複製功能保留
- 複製後的 skill 進入「我的技能」section（個人區），屬於對話延伸來源，自動帶入 `derived_from`

---

## 送審 Dialog

### 觸發
點擊個人技能 card 上的 [送審] 或 [再次送審] 按鈕。

### Dialog 內容

```
┌────────────────────────────────────────┐
│  送審至 Library                   [✕] │
├────────────────────────────────────────┤
│  技能名稱：XXX                         │
│  來源：對話延伸 / 手寫建立             │
│  derived_from：系統技能 X（若有）      │
│                                        │
│  送審方式                              │
│  ┌──────────────────────────────────┐ │
│  │ ○ 更新版本                       │ │
│  │   提交為原技能的新版本            │ │
│  │ ○ 建立新技能                     │ │
│  │   作為獨立技能加入 Library        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  說明（選填）                          │
│  ┌──────────────────────────────────┐ │
│  │ placeholder（依送審方式調整）     │ │
│  └──────────────────────────────────┘ │
│                                        │
│          [取消]        [送出審核]      │
└────────────────────────────────────────┘
```

### 送審方式邏輯

| 條件 | 預設選項 | 「更新版本」可用性 |
|------|----------|-------------------|
| 有 `derived_from` | 更新版本 | 可選 |
| 無 `derived_from` | 建立新技能 | disabled |

### 說明欄 Placeholder
- 選「更新版本」→ 「說明此版本的改動重點...」
- 選「建立新技能」→ 「描述適用情境、與現有技能的差異...」

### 送出後行為
- 技能 badge 更新為「審核中」
- [送審] 按鈕變為 disabled
- 主管審核後：
  - 通過 → badge 改為「已有Library版」
  - 退回 → badge 回「可使用」，詳情面板顯示退回原因

---

## Store 變更摘要

### Skill 介面新增欄位
```ts
zone?: 'personal' | 'library'  // 區分個人區與 Library
personalStatus?: 'available' | 'reviewing' | 'has_library'
derivedFrom?: string            // Library skill id（原 forkSourceId 語意擴充）
hasLibraryUpdate?: boolean      // derived Library skill 有更新時為 true
submitNote?: string             // 送審說明
submitMode?: 'version_update' | 'new_skill'
```

### 我的技能資料來源
```ts
// 新增 computed
mySkills: computed(() =>
  skills.value.filter(s => s.zone === 'personal')
)
```

### 移除
- `myDrafts`（草稿區概念取消）
- `DraftSkill` 型別取消，原草稿資料統一以 `Skill`（`zone: 'personal'`）表示
- `createDraft()`、`deleteDraft()`、`submitDraft()` 替換為新的個人技能 actions

---

## 不在此次範圍

- 主管端審核介面（SkillReviewDrawer 維持現有功能）
- 個人技能的建立入口（由對話或手寫建立，不在此頁面）
- 更新提醒的詳細比較 UI（點擊後進詳情面板查看，詳情面板另行設計）
- 審核結果通知機制（系統通知）
