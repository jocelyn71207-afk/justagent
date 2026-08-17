## Status
DONE

## Commits
8b48139 feat(skill-test): add AI test types/state, remove JSON mode from store

## Tests
`npx vitest run src/stores/__tests__/skillStore.ai.test.ts` — 1 test passed (1 test file)

## Self-review
- All 10 steps from the brief completed in order.
- `SkillTestJson.vue` deleted; confirmed no imports of it existed in views or other components.
- `testJsonInput`, `testJsonOutput`, `runJsonTest` removed from store state, implementation, and return object.
- `AITestTag`, `AITestScenario`, `AITestReport` interfaces exported after `ChatMessage`.
- `aiTestScenarios`, `aiTestReport`, `aiTestIsGenerating`, `aiTestIsRunning` added to state and return.
- `setSelectedSkill` updated to reset all four AI state refs on skill switch.
- `npm run type-check` passed with no errors.
- Test file matches the spec verbatim and passes.
- No concerns; implementation is clean and matches spec exactly.
