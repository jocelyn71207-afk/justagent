# 系統技能不提供版本切換 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 測試沙盒側邊欄的系統技能（`scope === 'system'`）一律顯示純文字版本號，不再出現可切換的版本下拉選單。

**Architecture:** 單一任務、純樣板調整：`SkillTest.vue` 的 Library 技能迴圈裡，系統技能分支改渲染 `.version-inline` 純文字，其餘 scope 維持原本的 `SkillVersionPicker`。不動 store、不動 `SkillVersionPicker.vue`。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia

## Global Constraints

- 所有元件使用 `<script setup lang="ts">`，禁止 Options API
- 樣式在 `src/scss/` 管理，禁止 `<style scoped>`（本次不需要新增樣式，沿用既有 `.version-inline` class）
- 系統技能定義：`skill.scope === 'system'`
- 企業擴充（`scope === 'enterprise'`）、團隊擴充（`scope === 'team'`）、我的技能（`personalSkills`）的版本切換邏輯維持不變，不受影響
- `store.getVersionOptions`、`store.getDefaultVersionTag`、`store.setSelectedSkill`、`displayVersionTag()` 都不需要修改

---

### Task 1: 系統技能側邊欄改用純文字版本號

**Files:**
- Modify: `src/views/SkillTest.vue:47-51`

**Interfaces:**
- 不新增/不變更任何 store 或元件的對外介面，純樣板條件渲染調整

- [ ] **Step 1: 修改 Library 技能列的版本控制區塊**

在 `src/views/SkillTest.vue` 第 47-51 行，把：

```vue
                  <SkillVersionPicker
                    :versions="store.getVersionOptions(skill.id)"
                    :model-value="displayVersionTag(skill)"
                    @update:model-value="v => store.setSelectedSkill(skill.id, v)"
                  />
```

改成：

```vue
                  <span v-if="skill.scope === 'system'" class="version-inline">v{{ displayVersionTag(skill) }}</span>
                  <SkillVersionPicker
                    v-else
                    :versions="store.getVersionOptions(skill.id)"
                    :model-value="displayVersionTag(skill)"
                    @update:model-value="v => store.setSelectedSkill(skill.id, v)"
                  />
```

- [ ] **Step 2: 型別檢查**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run type-check
```

Expected: 無新增 error

- [ ] **Step 3: Lint**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run lint
```

Expected: `src/views/SkillTest.vue` 無新增 error

- [ ] **Step 4: 啟動 dev server 手動驗證**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run dev
```

開啟「技能測試沙盒」頁面，檢查：

- 「系統技能」子群組底下的技能（例如「通用客服機器人」，原本有 v2.4.0/v2.4.1 兩版）現在右側只顯示純文字版本號（如 `v2.4.0`），沒有下拉箭頭、點了不會跳出選單
- 「企業擴充」「團隊擴充」子群組的技能（例如「客服機器人 (退貨版)」「ERP 庫存查詢」「行銷文案生成」）版本下拉選單行為維持不變，仍可點開切換版本
- 「我的技能」區塊（例如「週報自動生成」）版本下拉選單行為維持不變
- 點擊系統技能整列仍可正常選中該技能開始測試（用預設版本）

- [ ] **Step 5: 執行既有測試確認沒有迴歸**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npx vitest run src/stores/__tests__/skillStore.test.ts
```

Expected: 全部通過（這個改動不涉及 store，不應該有任何測試受影響）

- [ ] **Step 6: Commit**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
git add src/views/SkillTest.vue
git commit -m "feat(skill-test): system skills always show a fixed version, no version switching"
```
