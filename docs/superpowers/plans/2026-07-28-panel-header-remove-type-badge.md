# 測試面板標題移除類型 badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 測試沙盒右側測試面板標題移除「系統技能／企業擴充」類型 badge。

**Architecture:** 單一任務、純樣板刪除：`SkillTest.vue` 面板標題裡刪掉類型 badge 的 `<span>`，版本號 badge 保留。

**Tech Stack:** Vue 3 `<script setup lang="ts">`

## Global Constraints

- 所有元件使用 `<script setup lang="ts">`，禁止 Options API
- 版本號 badge（`.tag--version`）保留，不動
- `.skill-tag.tag--sys`／`.tag--ext` 這兩個全域 CSS class 不刪除，其他地方可能還在用

---

### Task 1: 移除面板標題的類型 badge

**Files:**
- Modify: `src/views/SkillTest.vue:67-69`

**Interfaces:**
- 不新增/不變更任何 store 或元件的對外介面，純樣板刪除

- [ ] **Step 1: 刪除類型 badge**

在 `src/views/SkillTest.vue` 第 67-69 行，把：

```vue
              <span :class="['skill-tag', selectedSkill.type === 'system' ? 'tag--sys' : 'tag--ext']">
                {{ selectedSkill.type === 'system' ? '系統技能' : '企業擴充' }}
              </span>
```

整段刪除。刪除後第 66 行的版本號 badge（`<span class="skill-tag tag--version">v{{ selectedSkill.version }}</span>`）後面直接接第 70 行的 `</div>`（`.panel-title` 結束標籤）。

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

- 選擇任一系統技能（如「通用客服機器人」），右側面板標題只顯示技能名稱 + 版本號 badge，不再顯示「系統技能」字樣
- 選擇任一企業/團隊擴充技能，右側面板標題只顯示技能名稱 + 版本號 badge，不再顯示「企業擴充」字樣
- 側邊欄（技能列、色點、版本控制）不受影響

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
git commit -m "feat(skill-test): remove type badge from test panel header"
```
