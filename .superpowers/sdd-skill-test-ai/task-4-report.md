## Status
DONE

## Commits
73869eb feat(skill-test): wire AI quick test tab into SkillTest view

## Type-check
PASS — zero errors (vue-tsc --build exited cleanly)

## Self-review
- SkillTest.vue replaced exactly per spec: uses `store.flatSkills` directly (no filtering), tabs moved out of `.test-panel-head` into their own `.test-panel-tabs` div, icons added, object-syntax class binding used
- _SkillTest.scss updated: `.test-tabs`/`.test-tab` blocks replaced with `.test-panel-tabs`/`.tab-btn` blocks matching the spec exactly; no hardcoded hex values
- Old `testableSkills` computed (which filtered `isEnabled && !deletedAt`) and drafts section removed — this is intentional per spec
- Only the two required files were staged and committed; all other modified files remain unstaged
