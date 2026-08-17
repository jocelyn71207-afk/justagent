# 個人技能區重新設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除個人技能（我的技能）的多版本並存機制，統一 Library／個人技能內部的「複製」為同一套「建立副本」流程，新增 `skillName`／`name` 分離以支援複製後的名稱衝突提示，並讓「來源更新」提示改為動態計算。

**Architecture:** 這是一個 Vue 3 + Pinia 的前端 demo 專案（無真實後端，資料全為 mock）。所有異動集中在 `src/stores/skillStore.ts`（資料模型與商業邏輯）與 `src/components/Skill/*.vue` / `src/views/Skill*.vue`（UI）。Library 技能既有的審核版本治理（`Skill.versions`）完全不受影響，只有個人技能（`zone: 'personal'`）的資料結構被簡化。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest（`src/stores/__tests__/skillStore.test.ts`）、SCSS（手動 `@forward` 註冊，見 `src/scss/components/_index.scss`）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`。
- 所有 import 使用 `@/` alias。
- Library 技能的 `versions` / `SkillVersion` 審核治理流程不可異動。
- `myDrafts` / `DraftSkill` / `createDraft` / `saveDraft` / `updateDraft` / `deleteDraft` / `submitDraft` 既有草稿機制不可異動（除了移除 `duplicateSkill` 這一個函式，因為它是本次要被取代的唯一呼叫點）。
- 每個 task 完成後執行 `npm run test:unit -- skillStore` （或相關檔案）確認通過後才 commit。

---

## 參考：現況追蹤（規劃時已確認，實作時可直接信任）

- `store.findSkill(id)` 已經會同時查 `flatSkills`（Library）與 `myPersonalSkillsRef`（個人），且回傳的是「原始物件參考」而非複本。這代表 `SkillEditor.vue` 現有的 `isEditMode` 分支（呼叫 `store.updateSkill`）**已經可以正確編輯個人技能**，不需要另外新增「個人技能編輯模式」。
- `router.push('/view/Skills')` 就是 `SkillManagement.vue` 的路由（`src/router/index.ts:111-115`，`name: 'SkillManagement'`），儲存後導頁邏輯不用改。
- `.drawer-confirm-overlay` / `.drawer-confirm-dialog` / `.confirm-icon` / `.confirm-actions` 這組 class 定義在 `src/scss/components/_SkillDetailDrawer.scss` 的**頂層**（不在 `.SkillDetailDrawer { }` 巢狀內，看 line 849 起的 `// ── Confirm dialog ──` 區塊），本來就是全域樣式，`SkillManagement.vue` 可以直接複用，不需要新增或搬移 CSS。
- `route.query.versionId`（`SkillManagement.vue` 現有 `@edit` handler 裡組出來的參數）在 `SkillEditor.vue` 裡從未被讀取，是死參數，可以安全移除。

---

### Task 1: `skillStore.ts` — 資料模型與函式

**Files:**
- Modify: `src/stores/skillStore.ts`
- Test: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces（後續 task 會用到的型別／函式簽章）：
  - `Skill.skillName: string`
  - `Skill.derivedFromVersion?: string`
  - `Skill.reviewedBy?: string`
  - `Skill.reviewedAt?: string`
  - `Skill.hasLibraryUpdate?: boolean`（保留在 interface 上，但改為由 `myPersonalSkills` computed 動態算出，不再是 mock 寫死值）
  - `PersonalSkillVersion` interface 與 `Skill.personalVersions` 欄位整個移除
  - `duplicateAsPersonalSkill(sourceId: string): Skill`
  - `hasSkillNameConflict(skillId: string): boolean`
  - `submitPersonalSkill(id, mode, note, targetScope?, targetTeamName?): void`（簽章不變）
  - `approvePersonalSkill(id: string): void`（**簽章變更**：移除 `versionId?` 參數）
  - `rejectPersonalSkill(id: string, feedback: string): void`（**簽章變更**：移除 `versionId?` 參數）
  - `applyLibraryUpdate(id: string): void`（簽章不變，行為改為覆蓋而非新增版本）
  - `duplicateSkill`、`duplicatePersonalVersion`、`setActiveVersion` 從 store 移除（不再 export）

- [ ] **Step 1: 修改 `Skill` / `PersonalSkillVersion` interface**

移除 `PersonalSkillVersion` interface（`src/stores/skillStore.ts:115-129`）整段。

修改 `Skill` interface（`src/stores/skillStore.ts:74-113`），把：

```typescript
  personalVersions?: PersonalSkillVersion[]
```

換成：

```typescript
  skillName: string
  derivedFromVersion?: string
  reviewedBy?: string
  reviewedAt?: string
```

（`hasLibraryUpdate?: boolean` 保留在原本位置不動；`derivedFrom?`、`submitNote?`、`submitMode?`、`targetScope?`、`targetTeamName?`、`submittedBy?` 也保留不動，這些欄位本來就已經在 `Skill` 上。）

- [ ] **Step 2: 攤平 `MOCK_PERSONAL_SKILLS`**

把 `MOCK_PERSONAL_SKILLS`（`src/stores/skillStore.ts:646-840`）裡每一筆的 `personalVersions: [...]` 陣列移除，改成直接在 `Skill` 本身補上 `skillName` 與（若有 `derivedFrom`）`derivedFromVersion`：

```typescript
const MOCK_PERSONAL_SKILLS: Skill[] = [
  {
    id: 'personal-001',
    name: '週報自動生成',
    description: '根據本週的會議記錄、任務清單，自動整理生成週報摘要',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'available',
    skillName: '會議摘要',
    derivedFrom: 'sys-meeting-001',
    derivedFromVersion: '2.2.0',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是一個週報助理，協助使用者根據本週資料自動生成結構化週報。',
  },
  {
    id: 'personal-002',
    name: '客服對話品質評估',
    description: '自動分析客服對話品質，評估回答準確度與客戶滿意度',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '通用客服機器人',
    derivedFrom: 'sys-cs-001',
    derivedFromVersion: '2.4.0',
    submitMode: 'version_update',
    submitNote: '新增多輪對話品質評估邏輯，支援情緒分析',
    targetScope: 'enterprise',
    submittedBy: '陳雅婷',
    aiAnalysis: [
      '適合用於處理多輪對話的客服場景，尤其涉及退換貨等複雜流程時表現更穩定',
      '支援即時情緒辨識，可協助優先處理高風險或情緒激動的對話',
      '相較現有版本，預估準確率提升 12–15%，誤判率下降約 8%',
    ],
    version: '1.0.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是客服品質評估助理，分析客服對話品質。',
  },
  {
    id: 'personal-004',
    name: '合約審核摘要',
    description: '自動擷取合約關鍵條款，生成風險摘要與審核建議',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '合約審核摘要',
    submitMode: 'new_skill',
    submitNote: '支援中英文合約自動摘要，標註高風險條款',
    targetScope: 'team',
    targetTeamName: '法務部',
    submittedBy: '林志明',
    aiAnalysis: [
      '適合法務、採購等需頻繁審閱合約的場景，可大幅縮短人工閱讀時間',
      '對常見條款類型（保密、違約、終止）識別率達 91%',
      '建議後續版本補充對特殊行業合約（金融、醫療）的識別能力',
    ],
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是合約審核助理，負責擷取合約中的關鍵條款並評估潛在法律風險。請以條列方式輸出摘要，並標示高風險條款。',
  },
  {
    id: 'personal-005',
    name: '會議記錄自動生成',
    description: '根據會議逐字稿或音訊，自動輸出結構化會議記錄與行動項目',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '會議摘要',
    derivedFrom: 'sys-meeting-001',
    derivedFromVersion: '2.2.0',
    submitMode: 'version_update',
    submitNote: '新增行動項目追蹤欄位，支援多位發言人識別',
    targetScope: 'enterprise',
    submittedBy: '黃思婷',
    aiAnalysis: [
      '多發言人識別功能在 5 人以下會議場景準確率達 95%，可有效減少後製時間',
      '行動項目自動配對負責人，相較舊版減少約 40% 的手動整理工作',
    ],
    version: '2.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是會議記錄助理，根據逐字稿整理結構化會議記錄，包含主題、決議、行動項目與負責人。',
  },
  {
    id: 'personal-006',
    name: '產品 FAQ 自動回覆',
    description: '根據產品文件與常見問題資料庫，自動回答用戶提問',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '產品 FAQ 自動回覆',
    submitMode: 'new_skill',
    submitNote: '',
    targetScope: 'team',
    targetTeamName: '客服部',
    submittedBy: '王建豪',
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是產品 FAQ 助理，根據內部文件與常見問題資料庫回答用戶問題，無法回答時請引導至人工客服。',
  },
  {
    id: 'personal-003',
    name: 'ERP 報表彙整',
    description: '整合 ERP 系統數據，自動生成週期性報表',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'has_library',
    skillName: 'ERP 報表彙整',
    targetScope: 'team',
    targetTeamName: '業務部',
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是 ERP 報表助理，整合多系統數據生成週期性報表。',
  },
]
```

注意：`personal-001` 與 `personal-005` 的 `skillName` 都是 `'會議摘要'`（兩者都源自同一個 Library 技能 `sys-meeting-001`，只是使用者各自改了顯示名稱）——這是刻意保留，用來讓 Task 6 的名稱衝突提示有 mock 資料可以展示。

- [ ] **Step 3: 執行既有測試，確認目前哪些會因為 Step 1/2 壞掉**

Run: `npm run test:unit -- skillStore`
Expected: `PersonalSkill` 與 `版本測試選擇（SkillTest 沙盒）` 兩個 describe 區塊出現 TypeScript / assertion 錯誤（`personalVersions` 不存在、`getVersionOptions('personal-001')` 回傳值不再是多筆）。這是預期中的失敗，先不要修——等 Step 4-9 把函式改完再一起處理測試。

- [ ] **Step 4: 移除版本同步相關的私有函式與呼叫**

刪除 `_syncPersonalStatus`（`src/stores/skillStore.ts:1228-1232`）、`_appendPersonalVersion`（`1238-1253`）整段。

- [ ] **Step 5: 簡化 `hasPendingReview`**

```typescript
function hasPendingReview(skill: Skill): boolean {
  return skill.personalStatus === 'reviewing'
}
```

- [ ] **Step 6: 簡化 `submitPersonalSkill`（移除版本 append，直接寫欄位）**

```typescript
function submitPersonalSkill(
  id: string,
  mode: 'new_skill' | 'version_update',
  note: string,
  targetScope: 'enterprise' | 'team' = 'enterprise',
  targetTeamName?: string
): void {
  const skill = myPersonalSkillsRef.value.find(s => s.id === id)
  if (!skill) return
  skill.personalStatus = 'reviewing'
  skill.submitNote = note
  skill.submitMode = mode
  skill.targetScope = targetScope
  skill.targetTeamName = targetScope === 'team' ? targetTeamName : undefined
  skill.submittedBy = 'jocelyn.tseng'
}
```

- [ ] **Step 7: 簡化 `approvePersonalSkill` / `rejectPersonalSkill`（移除 `versionId` 參數）**

取代 `src/stores/skillStore.ts:1332-1359` 原本兩個函式：

```typescript
function approvePersonalSkill(id: string): void {
  const skill = myPersonalSkillsRef.value.find(s => s.id === id)
  if (!skill || skill.personalStatus !== 'reviewing') return
  skill.personalStatus = 'has_library'
  skill.reviewedBy = 'jocelyn.tseng'
  skill.reviewedAt = new Date().toISOString()
}

function rejectPersonalSkill(id: string, feedback: string): void {
  const skill = myPersonalSkillsRef.value.find(s => s.id === id)
  if (!skill || skill.personalStatus !== 'reviewing') return
  skill.personalStatus = 'available'
  skill.reviewedBy = 'jocelyn.tseng'
  skill.reviewedAt = new Date().toISOString()
  skill.reviewFeedback = feedback
}
```

（`reviewFeedback` 已經是 Step 1 新增到 `Skill` 上的欄位。）

- [ ] **Step 8: 重寫 `applyLibraryUpdate`，移除 `duplicatePersonalVersion` / `setActiveVersion`**

取代 `src/stores/skillStore.ts:1305-1328`：

```typescript
function applyLibraryUpdate(id: string): void {
  const skill = myPersonalSkillsRef.value.find(s => s.id === id)
  if (!skill?.derivedFrom) return
  const source = flatSkills.value.find(s => s.id === skill.derivedFrom)
  if (!source) return
  skill.instructions = source.instructions
  skill.triggerHint = source.triggerHint
  skill.capabilities = source.capabilities ? [...source.capabilities] : undefined
  skill.derivedFromVersion = source.version
}
```

（`duplicatePersonalVersion`、`setActiveVersion` 直接刪除，不留任何呼叫端——Task 3 會確認 `SkillDetailDrawer.vue` 不再呼叫它們。）

- [ ] **Step 9: 新增 `duplicateAsPersonalSkill`**

加在 `applyLibraryUpdate` 之後：

```typescript
function duplicateAsPersonalSkill(sourceId: string): Skill {
  const source = findSkill(sourceId)
  if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
  const copy: Skill = {
    id: `personal-${Date.now()}`,
    name: source.name,
    description: source.description,
    type: source.type,
    origin: 'manually_created',
    creationMethod: source.creationMethod,
    zone: 'personal',
    personalStatus: 'available',
    skillName: source.zone === 'personal' ? source.skillName : source.name,
    derivedFrom: sourceId,
    derivedFromVersion: source.version,
    version: source.version,
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: source.instructions,
    triggerHint: source.triggerHint,
    capabilities: source.capabilities ? [...source.capabilities] : undefined,
  }
  myPersonalSkillsRef.value.unshift(copy)
  return copy
}
```

- [ ] **Step 10: 新增 `hasSkillNameConflict`**

```typescript
function hasSkillNameConflict(skillId: string): boolean {
  const skill = myPersonalSkillsRef.value.find(s => s.id === skillId)
  if (!skill) return false
  return myPersonalSkillsRef.value.some(
    s => s.id !== skillId && !s.deletedAt && s.skillName === skill.skillName
  )
}
```

- [ ] **Step 11: 移除 `duplicateSkill`**

刪除 `duplicateSkill`（`src/stores/skillStore.ts:1175-1190`）整個函式（回傳 `DraftSkill` 那個版本，會在 Task 5 被 `duplicateAsPersonalSkill` 取代）。

- [ ] **Step 12: `getVersionOptions` 移除個人技能多版本分支**

`getVersionOptions`（`src/stores/skillStore.ts:988-998`）目前是：

```typescript
  function getVersionOptions(skillId: string): { versionTag: string; isActive: boolean }[] {
    const skill = findSkill(skillId)
    if (!skill) return []
    if (skill.zone === 'personal' && skill.personalVersions?.length) {
      return skill.personalVersions.map(v => ({ versionTag: v.versionTag, isActive: v.isActive }))
    }
    if (skill.versions?.length) {
      return skill.versions.map(v => ({ versionTag: v.versionTag, isActive: v.status === 'active' }))
    }
    return [{ versionTag: skill.version, isActive: true }]
  }
```

移除中間那個 `if (skill.zone === 'personal' ...)` 分支（個人技能會自然落到最後的 `return [{ versionTag: skill.version, isActive: true }]`，天生就是單一版本）：

```typescript
  function getVersionOptions(skillId: string): { versionTag: string; isActive: boolean }[] {
    const skill = findSkill(skillId)
    if (!skill) return []
    if (skill.versions?.length) {
      return skill.versions.map(v => ({ versionTag: v.versionTag, isActive: v.status === 'active' }))
    }
    return [{ versionTag: skill.version, isActive: true }]
  }
```

- [ ] **Step 13: `myPersonalSkills` computed 動態算出 `hasLibraryUpdate`**

取代原本（`src/stores/skillStore.ts:879-881` 附近）：

```typescript
  const myPersonalSkills = computed<Skill[]>(() =>
    myPersonalSkillsRef.value.filter(s => !s.deletedAt)
  )
```

改成：

```typescript
  const myPersonalSkills = computed<Skill[]>(() =>
    myPersonalSkillsRef.value
      .filter(s => !s.deletedAt)
      .map(s => ({
        ...s,
        hasLibraryUpdate: !!(
          s.derivedFrom &&
          s.derivedFromVersion &&
          flatSkills.value.find(p => p.id === s.derivedFrom)?.version !== s.derivedFromVersion
        ),
      }))
  )
```

（`flatSkills` 是同一個 store 裡稍後定義的 computed；因為這裡是 lazy getter closure，不會有 TDZ 問題。）

- [ ] **Step 14: 更新 store 的 `return { ... }`**

在 `src/stores/skillStore.ts` 的 `return { ... }`（約 line 1563 起）：
- 移除：`duplicateSkill`、`duplicatePersonalVersion`、`setActiveVersion`
- 新增：`duplicateAsPersonalSkill`、`hasSkillNameConflict`

- [ ] **Step 15: 更新 `skillStore.test.ts` 既有測試**

`describe('PersonalSkill', ...)`（`src/stores/__tests__/skillStore.test.ts:156-191`）維持大部分不變（`personalStatus` 已經是 flat 欄位，測試本來就直接讀 `skill.personalStatus`），不需要改動。

`describe('版本測試選擇（SkillTest 沙盒）', ...)`（`212-244`）裡的「多版本個人技能」測試需要整段替換，因為個人技能不再有多版本：

```typescript
  describe('版本測試選擇（SkillTest 沙盒）', () => {
    it('getVersionOptions 對個人技能一律回傳單一項目（不做版控）', () => {
      const store = useSkillStore()
      expect(store.getVersionOptions('personal-001')).toEqual([{ versionTag: '1.1.0', isActive: true }])
      expect(store.getVersionOptions('personal-002')).toEqual([{ versionTag: '1.0.0', isActive: true }])
    })

    it('getVersionOptions 對多版本 Library 技能依 status 判斷使用中版本', () => {
      const store = useSkillStore()
      const options = store.getVersionOptions('sys-cs-001')
      expect(options).toContainEqual({ versionTag: '2.4.0', isActive: true })
      expect(options).toContainEqual({ versionTag: '2.4.1', isActive: false })
    })

    it('getVersionOptions 對不存在的技能回傳空陣列', () => {
      const store = useSkillStore()
      expect(store.getVersionOptions('nonexistent')).toEqual([])
    })

    it('setSelectedSkill 未指定 versionTag 時預設使用技能目前版本', () => {
      const store = useSkillStore()
      store.setSelectedSkill('personal-001')
      expect(store.selectedVersionTag).toBe('1.1.0')
    })
  })
```

新增一個 describe 區塊測試新函式（加在 `PersonalSkill` describe 區塊後面）：

```typescript
  describe('複製為個人技能與名稱衝突', () => {
    it('duplicateAsPersonalSkill 從 Library 技能建立新的個人技能，skillName 沿用來源名稱', () => {
      const store = useSkillStore()
      const before = store.myPersonalSkills.length
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(store.myPersonalSkills.length).toBe(before + 1)
      expect(copy.zone).toBe('personal')
      expect(copy.skillName).toBe('通用客服機器人')
      expect(copy.name).toBe('通用客服機器人')
      expect(copy.derivedFrom).toBe('sys-cs-001')
    })

    it('duplicateAsPersonalSkill 從個人技能複製時，skillName 沿用來源的 skillName（不是來源的 name）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('personal-001')
      expect(copy.skillName).toBe('會議摘要')
      expect(copy.derivedFrom).toBe('personal-001')
    })

    it('hasSkillNameConflict 偵測到相同 skillName 的其他個人技能', () => {
      const store = useSkillStore()
      // personal-001 與 personal-005 的 skillName 都是「會議摘要」（mock 資料刻意設計）
      expect(store.hasSkillNameConflict('personal-001')).toBe(true)
      expect(store.hasSkillNameConflict('personal-005')).toBe(true)
    })

    it('hasSkillNameConflict 對沒有同名技能的個人技能回傳 false', () => {
      const store = useSkillStore()
      expect(store.hasSkillNameConflict('personal-004')).toBe(false)
    })

    it('myPersonalSkills 動態計算 hasLibraryUpdate：來源版本不同才為 true', () => {
      const store = useSkillStore()
      const p002 = store.myPersonalSkills.find(s => s.id === 'personal-002')!
      const p001 = store.myPersonalSkills.find(s => s.id === 'personal-001')!
      expect(p002.hasLibraryUpdate).toBe(true) // derivedFromVersion 2.4.0 != sys-cs-001 目前 2.5.0
      expect(p001.hasLibraryUpdate).toBe(false) // derivedFromVersion 2.2.0 == sys-meeting-001 目前 2.2.0
    })

    it('applyLibraryUpdate 覆蓋內容並清除 hasLibraryUpdate', () => {
      const store = useSkillStore()
      store.applyLibraryUpdate('personal-002')
      const updated = store.myPersonalSkills.find(s => s.id === 'personal-002')!
      expect(updated.hasLibraryUpdate).toBe(false)
      expect(updated.instructions).toBe(store.flatSkills.find(s => s.id === 'sys-cs-001')!.instructions)
    })
  })
```

- [ ] **Step 16: 執行測試，確認全部通過**

Run: `npm run test:unit -- skillStore`
Expected: 全部 PASS。

- [ ] **Step 17: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "$(cat <<'EOF'
refactor(skill-store): drop personal skill version control, add skillName split

Personal skills collapse from a version array to a single flat state.
Adds duplicateAsPersonalSkill + hasSkillNameConflict for the unified
copy flow, and makes hasLibraryUpdate a computed comparison instead of
a hardcoded mock flag.
EOF
)"
```

---

### Task 2: `SkillReviewCard.vue` — 移除 `personalVersions` 依賴

**Files:**
- Modify: `src/components/Skill/SkillReviewCard.vue`

**Interfaces:**
- Consumes: `Skill.aiAnalysis` / `Skill.reviewFeedback`（Task 1 新增到 `Skill` 上）
- Produces: `emit('approve', skill: Skill)` / `emit('reject', skill: Skill, feedback: string)`（父層 `SkillManagement.vue` 在 Task 5 會改接這個新簽章）

- [ ] **Step 1: 移除 `reviewingVersion` computed，改讀 `props.skill` 本身**

刪除 `src/components/Skill/SkillReviewCard.vue:139-141` 的 `reviewingVersion` computed。

把 template 裡所有 `reviewingVersion?.xxx` 改成直接讀 `skill.xxx`：
- Line 26-28：`reviewingVersion?.submitNote` → `skill.submitNote`
- Line 43-50：`reviewingVersion?.aiAnalysis` → `skill.aiAnalysis`

- [ ] **Step 2: 簡化 `submitMode` / `targetScope` / `targetTeamName` / `submittedBy` computed**

取代 `src/components/Skill/SkillReviewCard.vue:156-176`：

```typescript
const submitMode = computed(() => props.skill.submitMode ?? 'new_skill')
const submitModeLabel = computed(() =>
  submitMode.value === 'version_update' ? '更新版本' : '建立新技能'
)
const targetScope = computed(() => props.skill.targetScope ?? 'enterprise')
const targetTeamName = computed(() => props.skill.targetTeamName)
const submittedBy = computed(() => props.skill.submittedBy)
```

- [ ] **Step 3: 更新 emit 簽章與呼叫**

取代 `emit` 型別（`src/components/Skill/SkillReviewCard.vue:126-130`）：

```typescript
const emit = defineEmits<{
  view: [skill: Skill]
  approve: [skill: Skill]
  reject: [skill: Skill, feedback: string]
}>()
```

更新 `confirmReject` / `confirmApprove`（`143-152`）：

```typescript
function confirmReject() {
  emit('reject', props.skill, rejectFeedback.value.trim())
  showRejectDialog.value = false
  rejectFeedback.value = ''
}

function confirmApprove() {
  emit('approve', props.skill)
  showApproveDialog.value = false
}
```

- [ ] **Step 4: 移除未使用的 `useSkillStore` import（如果 `derivedFromName` computed 還需要 store 就保留）**

檢查 `derivedFromName` computed（`178-181`）仍然使用 `store.flatSkills`，`useSkillStore` import 保留不動。

- [ ] **Step 5: 手動驗證**

Run: `npm run type-check`
Expected: 無 TypeScript 錯誤（`SkillReviewCard.vue` 內不再有 `personalVersions` 相關型別錯誤）。

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/SkillReviewCard.vue
git commit -m "refactor(SkillReviewCard): read flat Skill fields instead of personalVersions"
```

---

### Task 3: `SkillDetailDrawer.vue` — 移除版本管理 UI，改為單一狀態卡片

**Files:**
- Modify: `src/components/Skill/SkillDetailDrawer.vue`
- Modify: `src/scss/components/_SkillDetailDrawer.scss`

**Interfaces:**
- Consumes: `store.hasSkillNameConflict`（不在這個元件用，略過）；`skill.hasLibraryUpdate`（Task 1 已改為 computed 動態值，這裡沿用原本的讀法不用改）
- Produces: `emit('edit', skill: Skill)`（移除 `versionId` 參數）、`emit('submit', skill: Skill)`（移除 `versionId` 參數）、`emit('duplicate', skill: Skill)`（個人技能現在也會觸發，行為與 Library 技能相同）

- [ ] **Step 1: 移除「個人技能版本管理」整段 template**

刪除 `src/components/Skill/SkillDetailDrawer.vue:242-334`（`<!-- 個人技能版本管理 -->` 整個 `div.drawer-section`）。

- [ ] **Step 2: 新增「目前狀態」單一卡片，取代原本整段**

在原本位置（`isPersonal` 判斷之後，「危險操作」之前）插入：

```html
            <!-- 個人技能目前狀態 -->
            <div v-if="isPersonal" class="drawer-section">
              <div class="section-label">目前狀態</div>
              <div class="psv-card">
                <div class="psv-head">
                  <span
                    v-if="personalStatusLabel"
                    :class="['skill-tag', personalStatusClass]"
                  >
                    {{ personalStatusLabel }}
                  </span>
                  <span v-if="skill.submitMode" class="psv-mode">
                    {{ skill.submitMode === 'version_update' ? '更新版本' : '建立新技能' }}
                  </span>
                  <span
                    v-if="skill.personalStatus === 'reviewing' && skill.targetScope"
                    class="skill-tag psv-scope-tag"
                    :class="skill.targetScope === 'team' ? 'tag--team' : 'tag--enterprise'"
                  >
                    <i class="material-symbols-outlined">{{ skill.targetScope === 'team' ? 'group' : 'corporate_fare' }}</i>
                    預計發布：{{ skill.targetScope === 'team' ? `團隊技能（${skill.targetTeamName ?? '未指定團隊'}）` : '企業技能' }}
                  </span>
                </div>

                <div v-if="skill.hasLibraryUpdate" class="psv-upstream-hint">
                  <i class="material-symbols-outlined">system_update_alt</i>
                  <span>
                    Library 來源技能有新版本
                    <span v-if="derivedFromName" class="psv-upstream-src">「{{ derivedFromName }}」</span>
                  </span>
                  <button class="custom-btn psv-upstream-btn" @click="showApplyUpdateConfirm = true">
                    <i class="material-symbols-outlined">download</i>更新
                  </button>
                </div>

                <div v-if="skill.submitNote" class="psv-note">
                  <i class="material-symbols-outlined">sticky_note_2</i>{{ skill.submitNote }}
                </div>
                <div v-if="skill.reviewFeedback" class="psv-reject-feedback">
                  <i class="material-symbols-outlined">feedback</i>
                  <div>
                    <div class="psv-reject-feedback-label">審核退回原因</div>
                    <div>{{ skill.reviewFeedback }}</div>
                  </div>
                </div>

                <div class="psv-actions">
                  <button class="custom-btn psv-ver-btn" @click="emit('test', skill!)">
                    <i class="material-symbols-outlined">science</i>測試
                  </button>
                  <button
                    v-if="skill.personalStatus !== 'reviewing'"
                    class="custom-btn psv-ver-btn"
                    @click="emit('edit', skill!)"
                  >
                    <i class="material-symbols-outlined">edit</i>編輯
                  </button>
                  <button class="custom-btn psv-ver-btn" @click="emit('duplicate', skill!)">
                    <i class="material-symbols-outlined">content_copy</i>複製
                  </button>
                  <button
                    v-if="skill.personalStatus !== 'reviewing'"
                    class="custom-btn psv-submit-btn"
                    @click="emit('submit', skill!)"
                  >
                    <i class="material-symbols-outlined">send</i>送審
                  </button>
                  <span v-else class="psv-reviewing">
                    <i class="material-symbols-outlined">hourglass_top</i>審核進行中
                  </span>
                </div>
              </div>
            </div>
```

注意：這裡的「更新」按鈕不再直接 `emit('update', skill!)`，而是先開本地確認 dialog（`showApplyUpdateConfirm`），見 Step 4——因為 `applyLibraryUpdate` 現在是「直接覆蓋內容」，需要跟使用者確認一次。

- [ ] **Step 3: 移除版本切換相關的 dialog 與「已建立複本」選擇 dialog**

刪除：
- `src/components/Skill/SkillDetailDrawer.vue:363-384`（「切換版本時的上游更新 dialog」整段，`switchVersionId` 相關）
- `401-420`（「複製後：選擇修改方式」整段，`duplicatedVersionId` 相關——這個選擇彈窗搬去 `SkillManagement.vue`，見 Task 5）
- `422-427`（`<SkillEditChatModal>` 實例——同樣搬去 `SkillManagement.vue`）

- [ ] **Step 4: 新增「套用來源更新」確認 dialog**

在被刪除的區塊原本位置，加入：

```html
    <!-- 套用來源更新確認 -->
    <Transition name="confirm-fade">
      <div v-if="showApplyUpdateConfirm && skill" class="drawer-confirm-overlay" @click.self="showApplyUpdateConfirm = false">
        <div class="drawer-confirm-dialog">
          <div class="confirm-icon confirm-icon--update">
            <i class="material-symbols-outlined">system_update_alt</i>
          </div>
          <h4>套用來源技能更新？</h4>
          <p>
            套用後將以來源技能<template v-if="derivedFromName">「{{ derivedFromName }}」</template>目前的內容
            覆蓋這份技能的指令內容，且無法復原。
          </p>
          <div class="confirm-actions">
            <button class="custom-btn" @click="showApplyUpdateConfirm = false">取消</button>
            <button class="custom-btn custom-main-btn" @click="confirmApplyUpdate">
              <i class="material-symbols-outlined">download</i>確定套用
            </button>
          </div>
        </div>
      </div>
    </Transition>
```

- [ ] **Step 5: 更新 header actions，個人技能也顯示「複製」**

取代 `src/components/Skill/SkillDetailDrawer.vue:25-36`：

```html
            <div class="dh-actions">
              <template v-if="!isPersonal">
                <button class="custom-btn dh-btn" @click="emit('edit', skill!)">
                  <i class="material-symbols-outlined">edit</i>編輯
                </button>
                <button class="custom-btn dh-btn" @click="emit('test', skill!)">
                  <i class="material-symbols-outlined">science</i>測試
                </button>
              </template>
              <button class="custom-btn dh-btn" @click="emit('duplicate', skill!)">
                <i class="material-symbols-outlined">content_copy</i>複製
              </button>
              <button class="custom-btn dh-btn" @click="showMarkdown = true">
                <i class="material-symbols-outlined">description</i>skill.md
              </button>
              <button class="drawer-close-btn" @click="emit('close')">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
```

（個人技能的「編輯」與「測試」已經在 Step 2 的狀態卡片裡了，header 這邊只讓「複製」對兩種技能都顯示，避免重複兩個編輯/測試按鈕。）

- [ ] **Step 6: 更新 `<script setup>` — 移除死狀態、新增 `showApplyUpdateConfirm` 與相關 computed**

移除（`src/components/Skill/SkillDetailDrawer.vue:462-510` 附近）：`duplicatedVersionId`、`showEditChat`、`switchVersionId`、`suppressSwitchPrompt`、`handleDuplicateVersion`、`handleDirectEdit`、`handleChatEdit`、`handleVersionSwitch`、`doVersionSwitch`、`cancelVersionSwitch`。

移除 import：`SkillEditChatModal`（不再在這個元件使用）。

新增：

```typescript
const showApplyUpdateConfirm = ref(false)

function confirmApplyUpdate() {
  if (!props.skill) return
  emit('update', props.skill)
  showApplyUpdateConfirm.value = false
}

const personalStatusLabel = computed(() => {
  const s = props.skill
  if (!s) return null
  if (s.personalStatus === 'reviewing') return '審核中'
  if (s.personalStatus === 'has_library') {
    if (s.targetScope === 'team') return `已有Library版（團隊・${s.targetTeamName ?? '未指定團隊'}）`
    if (s.targetScope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return '可使用'
})

const personalStatusClass = computed(() => {
  const s = props.skill?.personalStatus
  if (s === 'reviewing') return 'tag--reviewing'
  if (s === 'has_library') return 'tag--has-library'
  return 'tag--available'
})
```

移除 `emit` 型別裡 `edit` / `submit` 的 `versionId?: string` 參數（`src/components/Skill/SkillDetailDrawer.vue:446-457`）：

```typescript
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
  edit: [skill: Skill]
  delete: [skill: Skill]
  duplicate: [skill: Skill]
  review: [skillId: string, versionId: string]
  openUpstreamUpdate: [skill: Skill]
  submit: [skill: Skill]
  update: [skill: Skill]
}>()
```

（`review` 保留 `versionId`——那是 Library 技能 `versions` 審核流程用的，跟本次調整無關。）

移除不再使用的 `PersonalSkillVersion` type import（如果檔案上方有 `import type { ... PersonalSkillVersion ... } from '@/stores/skillStore'`，把它從 import 清單移掉）。

- [ ] **Step 7: SCSS 清理**

在 `src/scss/components/_SkillDetailDrawer.scss`：
- 移除 `.psv-dot`（line 691-698）、`.psv-using`（700-704 附近，含 `.psv-ver` 若不再使用也一併移除——`.psv-ver` 原本顯示 `v{{ver.versionTag}}`，新卡片不顯示版本號，故移除）、`.psv-activate-btn`（791-801，跟 `.psv-ver-btn` 合併宣告的部分要拆開，只留 `.psv-ver-btn`）。
- 移除 `&.psv-switch-dialog { ... }`（line 875 附近，在 `.drawer-confirm-dialog` 規則內）。
- 其餘 `.psv-card` / `.psv-head` / `.psv-mode` / `.psv-scope-tag` / `.psv-note` / `.psv-reject-feedback` / `.psv-actions` / `.psv-upstream-hint`（+ 子類別）/ `.psv-ver-btn` / `.psv-submit-btn` / `.psv-reviewing` 全部保留（新卡片繼續用這些 class）。

- [ ] **Step 8: 執行 type-check 與現有測試**

Run: `npm run type-check && npm run test:unit -- skillStore`
Expected: 無錯誤（這個 task 沒有新增 store 測試，只是確保沒有引用到已刪除的 store 函式）。

- [ ] **Step 9: Commit**

```bash
git add src/components/Skill/SkillDetailDrawer.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "$(cat <<'EOF'
refactor(SkillDetailDrawer): replace version list with single status card

Removes the per-version management UI and the version-switch upstream
dialog now that personal skills don't carry multiple versions. The
"duplicate → choose edit mode" flow moves up to SkillManagement.vue so
it can be shared with the library-copy entry point.
EOF
)"
```

---

### Task 4: `PersonalSkillGroup.vue` — 移除版本標籤

**Files:**
- Modify: `src/components/Skill/PersonalSkillGroup.vue`
- Modify: `src/scss/components/_PersonalSkillGroup.scss`

- [ ] **Step 1: 移除 `activeVersion` computed 與版本標籤**

刪除 `src/components/Skill/PersonalSkillGroup.vue:9`：

```html
    <span v-if="activeVersion" class="psg-active-tag">v{{ activeVersion.versionTag }} 使用中</span>
```

刪除 `activeVersion` computed（`28-30`）：

```typescript
const activeVersion = computed(() =>
  props.skill.personalVersions?.find(v => v.isActive)
)
```

`statusLabel` computed（`34-43`）裡引用到 `activeVersion.value?.targetScope` 的地方，改用 `props.skill.targetScope` 直接讀：

```typescript
const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  if (props.skill.personalStatus === 'has_library') {
    const scope = props.skill.targetScope
    if (scope === 'team') return `已有Library版（團隊・${props.skill.targetTeamName ?? '未指定團隊'}）`
    if (scope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return null
})
```

- [ ] **Step 2: SCSS — 移除 `.psg-active-tag`，把 `margin-left: auto` 移到 `.psg-status`**

在 `src/scss/components/_PersonalSkillGroup.scss`：刪除 `.psg-active-tag` 規則（line 35-45）。在 `.psg-status` 規則（line 63-71）加上 `margin-left: auto;`，讓「啟用中/停用中」狀態維持靠右對齊（原本這個效果是靠 `.psg-active-tag` 撐的）。

- [ ] **Step 3: 執行 type-check**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/PersonalSkillGroup.vue src/scss/components/_PersonalSkillGroup.scss
git commit -m "refactor(PersonalSkillGroup): drop per-version active tag"
```

---

### Task 5: `SkillManagement.vue` — 統一複製流程與審核 handler

**Files:**
- Modify: `src/views/SkillManagement.vue`

**Interfaces:**
- Consumes: `store.duplicateAsPersonalSkill(sourceId): Skill`、`store.approvePersonalSkill(id)`、`store.rejectPersonalSkill(id, feedback)`（Task 1 新簽章）；`SkillReviewCard` 的 `approve`/`reject` emit（Task 2 新簽章）；`SkillDetailDrawer` 的 `edit`/`submit`/`duplicate` emit（Task 3 新簽章）
- Produces: 無其他 task 依賴此檔案的輸出

- [ ] **Step 1: import `SkillEditChatModal`**

在 `src/views/SkillManagement.vue` 的 `<script setup>` import 區塊加入：

```typescript
import SkillEditChatModal from '@/components/Skill/SkillEditChatModal.vue'
```

- [ ] **Step 2: 新增複製後的狀態**

在 `showLibraryModal` 定義之後加入：

```typescript
const duplicatedSkill = ref<Skill | null>(null)
const showEditChatForDuplicate = ref(false)
```

- [ ] **Step 3: 重寫 `handleDuplicate`**

取代 `src/views/SkillManagement.vue:488-491`：

```typescript
function handleDuplicate(skill: Skill) {
  const copy = store.duplicateAsPersonalSkill(skill.id)
  detailSkill.value = null
  duplicatedSkill.value = copy
}

function handleDuplicateDirectEdit() {
  if (!duplicatedSkill.value) return
  router.push({ path: '/view/SkillEditor', query: { skillId: duplicatedSkill.value.id } })
  duplicatedSkill.value = null
}

function handleDuplicateChatEdit() {
  showEditChatForDuplicate.value = true
}

function closeDuplicateChatEdit() {
  showEditChatForDuplicate.value = false
  duplicatedSkill.value = null
}
```

- [ ] **Step 4: 加入「已建立複本」選擇 dialog 與 `SkillEditChatModal`**

在 `<BatchUpdateModal>` 之後、送審 dialog 之前，加入：

```html
    <!-- 複製後：選擇修改方式 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="duplicatedSkill && !showEditChatForDuplicate"
          class="drawer-confirm-overlay"
          @click.self="duplicatedSkill = null"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>已建立複本</h4>
            <p>接下來想怎麼修改這份複本？</p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn" @click="handleDuplicateChatEdit">
                <i class="material-symbols-outlined">forum</i>跟 Agent 對話修改
              </button>
              <button class="custom-btn custom-main-btn" @click="handleDuplicateDirectEdit">
                <i class="material-symbols-outlined">edit</i>直接編輯
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <SkillEditChatModal
      v-model="showEditChatForDuplicate"
      :skill="duplicatedSkill"
      @done="closeDuplicateChatEdit"
    />
```

（`.drawer-confirm-overlay` / `.drawer-confirm-dialog` / `.confirm-icon` / `.confirm-actions` 是 `_SkillDetailDrawer.scss` 裡的全域樣式，這裡直接複用，不用新增 CSS。）

- [ ] **Step 5: 更新 `handleApprove` / `handleReject`（移除 `versionId`）**

取代 `src/views/SkillManagement.vue` 裡的兩個函式：

```typescript
function handleApprove(skill: Skill) {
  store.approvePersonalSkill(skill.id)
}

function handleReject(skill: Skill, feedback: string) {
  store.rejectPersonalSkill(skill.id, feedback)
}
```

同步修改 template 裡 `<SkillReviewCard>` 的 `@approve` / `@reject` 綁定（原本可能寫 `@approve="handleApprove"` 已經相容，因為 Vue 的 emit 只是把參數轉發，不用特別改 template，只要確認函式簽章對得上）。

- [ ] **Step 6: 更新 `handlePersonalSubmit`（移除依賴 `personalVersions` 的 `sourceVersion` 查找）**

取代 `src/views/SkillManagement.vue:495-505`：

```typescript
function handlePersonalSubmit(skill: Skill) {
  const teamAlreadyPublished = skill.personalStatus === 'has_library' && skill.targetScope === 'team'

  submitConfirmSkill.value = skill
  submitMode.value = skill.derivedFrom ? 'version_update' : 'new_skill'
  submitTeamLocked.value = teamAlreadyPublished
  submitScope.value = teamAlreadyPublished ? 'enterprise' : (skill.targetScope ?? 'enterprise')
  submitTeamName.value = skill.targetTeamName ?? knownTeamNames.value[0] ?? ''
  submitNote.value = ''
}
```

同步把 `<SkillDetailDrawer>` 的 `@submit="handlePersonalSubmit"` 綁定確認相容（emit 現在只帶 `skill`，函式簽章也只收 `skill`，一致）。

- [ ] **Step 7: 確認 `handlePersonalUpdate` 不用重複確認**

Task 3 的 `SkillDetailDrawer.vue` 已經在元件內部處理了「套用來源更新」的確認 dialog（`showApplyUpdateConfirm`），使用者按下「確定套用」才會觸發 `emit('update', skill)`。因此 `SkillManagement.vue` 的 `handlePersonalUpdate` 不需要再彈第二次確認，維持原本寫法即可，不用修改：

```typescript
function handlePersonalUpdate(skill: Skill) {
  store.applyLibraryUpdate(skill.id)
}
```

`PersonalSkillGroup.vue` 的 `psg-update-hint` 點擊目前也是觸發同一個 `update` emit，但那個入口沒有經過確認 dialog。為了讓「套用來源更新」永遠都要經過確認，把 `PersonalSkillGroup.vue` 的更新提示改成呼叫 `manage`（開啟詳情），讓使用者從狀態卡片走確認流程，而不是讓 `update` emit 繞過確認直接套用。

- [ ] **Step 8: `PersonalSkillGroup.vue` 更新提示改為開啟詳情**

在 `src/components/Skill/PersonalSkillGroup.vue`，把：

```html
    <div v-if="skill.hasLibraryUpdate" class="psg-update-hint" @click.stop="emit('update', skill)">
      <i class="material-symbols-outlined">upgrade</i>更新
    </div>
```

改成：

```html
    <div v-if="skill.hasLibraryUpdate" class="psg-update-hint" @click.stop="emit('manage', skill)">
      <i class="material-symbols-outlined">upgrade</i>更新
    </div>
```

並移除 `defineEmits` 裡的 `update`（改成只有 `manage`），因為這個元件不再需要單獨的 `update` 事件，一律導去詳情頁的狀態卡片走「套用來源更新」確認流程。

- [ ] **Step 9: 移除 `duplicateSkill` 殘留 import/型別（若有）**

確認 `src/views/SkillManagement.vue` 沒有其他地方引用已刪除的 `store.duplicateSkill`。

- [ ] **Step 10: 執行 type-check**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 11: Commit**

```bash
git add src/views/SkillManagement.vue src/components/Skill/PersonalSkillGroup.vue
git commit -m "$(cat <<'EOF'
feat(SkillManagement): unify library/personal duplicate into one flow

Both the library copy button and the personal-skill copy button now
call duplicateAsPersonalSkill and land on the same "choose edit mode"
dialog. Review approve/reject handlers drop the now-unused versionId
parameter.
EOF
)"
```

---

### Task 6: `SkillEditor.vue` + `SkillEditChatModal.vue` — 名稱衝突提示

**Files:**
- Modify: `src/views/SkillEditor.vue`
- Modify: `src/components/Skill/SkillEditChatModal.vue`

**Interfaces:**
- Consumes: `store.hasSkillNameConflict(skillId: string): boolean`（Task 1）

- [ ] **Step 1: `SkillEditor.vue` — 新增名稱衝突 computed**

在 `src/views/SkillEditor.vue` 的 `existingSkill` 定義之後加入：

```typescript
const hasNameConflict = computed(() => {
  if (!existingSkill || existingSkill.zone !== 'personal' || !existingSkill.derivedFrom) return false
  return store.hasSkillNameConflict(existingSkill.id)
})

const conflictSourceName = computed(() => {
  if (!existingSkill?.derivedFrom) return ''
  return store.findSkill(existingSkill.derivedFrom)?.name ?? existingSkill.derivedFrom
})
```

- [ ] **Step 2: `SkillEditor.vue` — 顯示提示 banner**

在表單最上方（第一個 step 的內容區塊之前，或整個 `STEPS` 內容外層）加入：

```html
    <div v-if="hasNameConflict" class="name-conflict-banner">
      <i class="material-symbols-outlined">info</i>
      你已經有一份來自「{{ conflictSourceName }}」的技能了，建議修改顯示名稱以便區分。
    </div>
```

（確切插入位置需對照 `SkillEditor.vue` 現有 template 結構——放在整個表單卡片的最上方、`STEPS` 標題列之前即可，不影響既有 step 切換邏輯。）

- [ ] **Step 3: 新增 `.name-conflict-banner` SCSS**

在 `src/scss/views/_SkillEditor.scss`（若不存在則先確認實際檔名，這個專案的 view 層 scss 慣例是 `src/scss/views/_<ViewName>.scss`）內加入：

```scss
.name-conflict-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba($color-warning-amber, 0.08);
  border: 1px solid rgba($color-warning-amber, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;

  .material-symbols-outlined { font-size: 18px; color: $color-warning-amber; flex-shrink: 0; }
}
```

如果 `_SkillEditor.scss` 尚未被 `src/scss/views/_index.scss` `@forward`，依 CLAUDE.md 的 Gotcha 補上 `@forward './SkillEditor';`。

- [ ] **Step 4: `SkillEditChatModal.vue` — 同樣的提示**

在 `src/components/Skill/SkillEditChatModal.vue` 的 `<script setup>` 加入：

```typescript
const hasNameConflict = computed(() => {
  if (!props.skill || props.skill.zone !== 'personal' || !props.skill.derivedFrom) return false
  return store.hasSkillNameConflict(props.skill.id)
})

const conflictSourceName = computed(() => {
  if (!props.skill?.derivedFrom) return ''
  return store.flatSkills.find(s => s.id === props.skill!.derivedFrom)?.name
    ?? store.myPersonalSkills.find(s => s.id === props.skill!.derivedFrom)?.name
    ?? props.skill.derivedFrom
})
```

在 `.secm-head` 之後、`.secm-messages` 之前加入：

```html
          <div v-if="hasNameConflict" class="name-conflict-banner">
            <i class="material-symbols-outlined">info</i>
            你已經有一份來自「{{ conflictSourceName }}」的技能了，建議修改顯示名稱以便區分。
          </div>
```

在 `src/scss/components/_SkillEditChatModal.scss` 加入跟 Step 3 相同的 `.name-conflict-banner` 規則（兩處樣式重複是可接受的，因為兩個元件的 SCSS 檔案本來就各自獨立管理，不共用 mixin）。

- [ ] **Step 5: 執行 type-check**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 6: Commit**

```bash
git add src/views/SkillEditor.vue src/components/Skill/SkillEditChatModal.vue src/scss/views/_SkillEditor.scss src/scss/components/_SkillEditChatModal.scss src/scss/views/_index.scss
git commit -m "feat(skill-editor): warn when a duplicated personal skill shares a skillName"
```

---

### Task 7: 全面驗證

**Files:** 無新增/修改，純驗證步驟。

- [ ] **Step 1: 執行完整單元測試**

Run: `npm run test:unit`
Expected: 全部 PASS，特別確認 `src/stores/__tests__/skillStore.test.ts` 全綠。

- [ ] **Step 2: 執行型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 3: 啟動 dev server，手動走一次完整流程**

Run: `npm run dev`

手動驗證（在瀏覽器打開技能管理頁）：
1. 進入「技能管理」→「瀏覽 Library」→ 任一技能點「複製」→ 出現「已建立複本」選擇彈窗 → 選「直接編輯」→ 進入 `SkillEditor`。
2. 用 Library 技能「通用客服機器人」複製兩次，第二次進入編輯頁應該要看到名稱衝突提示（因為兩份個人技能的 `skillName` 都是「通用客服機器人」）。
3. 回到「我的技能」，找一個 `hasLibraryUpdate` 為 true 的技能（mock 資料裡是「客服對話品質評估」/`personal-002`）點進詳情，應該看到「Library 來源技能有新版本」提示，點「更新」出現確認 dialog，確認後內容被覆蓋且提示消失。
4. 「我的技能」列表裡不應該再出現任何版本切換 UI 或版本清單。
5. 「審核區」的送審卡片（`SkillReviewCard`）通過/退回操作仍正常運作。

- [ ] **Step 4: 若手動驗證發現問題，回到對應 Task 修正並重新提交**

不需要額外 commit——這一步是驗證關卡，若一切正常則直接結束。

---

## Self-Review 紀錄

- **Spec coverage**：五段設計（資料模型／統一複製流程／名稱衝突偵測／移除版控 UI／來源更新動態化）分別對應 Task 1（資料模型+函式）、Task 5（複製流程統一）、Task 6（名稱衝突提示）、Task 3+4（移除版控 UI）、Task 1 Step 13＋Task 3 Step 4（動態更新+覆蓋確認）。全部涵蓋。
- **Placeholder scan**：已移除所有「TBD / 依現況調整」字樣的初稿寫法，所有 code block 都是可直接套用的完整程式碼。
- **Type consistency**：`approvePersonalSkill(id)` / `rejectPersonalSkill(id, feedback)` / `duplicateAsPersonalSkill(sourceId): Skill` / `hasSkillNameConflict(skillId): boolean` 在 Task 1 定義後，Task 2、Task 5、Task 6 都是照同一份簽章呼叫，沒有不一致。
- **範圍修正**：規劃階段的 spec 曾假設 `SkillEditor.vue` 需要新增「個人技能編輯模式」，但追查 `findSkill`/`updateSkill` 的實作後確認不需要（詳見「參考：現況追蹤」），Task 6 因此只處理名稱衝突提示，比 spec 原本設想的範圍小，已在 Task 6 前的追蹤區塊註明原因。
