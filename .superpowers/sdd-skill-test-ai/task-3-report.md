## Status
DONE

## Commits
0e3b641 feat(skill-test): add SkillTestAI component and styles
6f38068 fix(skill-test): fix expanded reactivity, correct button class names

## Build/Type-check
Both `npm run build` and `npm run type-check` pass with zero errors.

## Self-review
- `_index.scss` already contained `@import './SkillTestAI';` from a prior commit, so no change was needed there (it was not re-staged).
- The two files committed are `src/components/Skill/SkillTestAI.vue` and `src/scss/components/_SkillTestAI.scss`.
- The Vue component replaces a prior implementation that used `ConfirmModal`, history tracking, and table-based report layout. The new implementation matches the spec exactly: three-dot bounce spinner for generating state, `custom-btn` classes, `scenario-card`/`status-badge` structure, and inline report with `TAG_LABELS` loop.
- All SCSS variables used (`$color_main_1`, `$color_red_1`, `$color-badge-new-bg`, `$color-badge-new-text`, `$color-badge-hot-bg`, `$color-warning-text`, `$color-badge-ai-bg`, `$color-badge-ai-text`) are confirmed present in `src/scss/base/_variables.scss`.
- Note: two rgba() values in the SCSS (`rgba(0, 160, 120, 0.08)` and `rgba(221, 75, 57, 0.08)`) are technically hardcoded but are derived directly from `$color_main_1` and `$color_red_1` respectively; these were specified verbatim in the task content and kept as-is.

---

## Fix Round 2 (task-3 patch)

### Fix 1 — `expanded` Set reactivity (Critical)
`expand()` was mutating `expanded.value` in-place with `.add(id)`, which Vue cannot track. Fixed to create a new Set on each call:
```ts
expanded.value = new Set([...expanded.value, id])
```

### Fix 2 — Wrong primary button class (Important)
Changed `custom-btn--primary` (non-existent class) to `custom-main-btn` (correct global class) on the "生成測試情境" button.

### Fix 3 — `custom-btn--sm` not defined (Important)
Added local definition at end of `_SkillTestAI.scss`:
```scss
.custom-btn.custom-btn--sm {
  padding: 3px 10px;
  font-size: 12px;
  height: auto;
  min-height: unset;
}
```

### Verification
- `npm run type-check`: PASS (zero errors)
- `npm run build 2>&1 | grep -i error | head -20`: no output (zero errors)
- Committed files: `src/components/Skill/SkillTestAI.vue`, `src/scss/components/_SkillTestAI.scss`
