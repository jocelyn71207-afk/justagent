# 側邊欄技能列移除 scope badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 測試沙盒側邊欄的 Library 技能列移除企業/團隊 scope badge，避免跟上方灰字子群組標題重複。

**Architecture:** 單一任務、純樣板刪除：`SkillTest.vue` 的 Library 技能迴圈裡，刪掉兩行 scope badge。不動 store、不動任何其他元件或 CSS。

**Tech Stack:** Vue 3 `<script setup lang="ts">`

## Global Constraints

- 所有元件使用 `<script setup lang="ts">`，禁止 Options API
- 系統技能不提供版本切換的邏輯（已完成）不受影響
- 我的技能區塊不受影響（原本就沒有 scope badge，不用改）
- `.skill-tag.tag--enterprise`／`.skill-tag.tag--team` 這兩個全域 CSS class 不刪除，只是這個畫面不再使用

---

### Task 1: 移除 Library 技能列的 scope badge

**Files:**
- Modify: `src/views/SkillTest.vue:45-46`

**Interfaces:**
- 不新增/不變更任何 store 或元件的對外介面，純樣板刪除

- [ ] **Step 1: 刪除兩個 scope badge**

在 `src/views/SkillTest.vue` 第 45-46 行，把：

```vue
                  <span v-if="skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>
                  <span v-else-if="skill.scope === 'team' && skill.teamName" class="skill-tag tag--team">{{ skill.teamName }}</span>
```

整段刪除（這兩行之間、之前、之後都不需要再加任何東西——刪除後第 44 行的技能名稱 `<span class="si-name">` 後面直接接原本第 47 行的版本控制區塊）。

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

- 「企業擴充」子群組底下的技能（例如「客服機器人 (退貨版)」「ERP 庫存查詢」）不再顯示「企業」標籤
- 「團隊擴充」子群組底下的技能（例如「會議摘要 (工程版)」「業績週報生成」「行銷文案生成」）不再顯示團隊名稱標籤
- 「系統技能」子群組（灰字分類仍在，只是這組本來就沒有 badge）不受影響
- 版本控制（純文字／下拉選單）跟色點仍正常顯示，沒有被誤刪
- 「我的技能」區塊不受影響

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
git commit -m "feat(skill-test): remove redundant scope badges from sidebar rows"
```
