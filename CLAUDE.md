# CLAUDE.md

每次開始開發前，請先閱讀以下文件：

- [AI_RULES.md](./AI_RULES.md) — 程式規範、命名慣例、元件寫法
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — 業務背景、功能模組、術語表
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 技術架構、資料流、設計決策
- [TASK.md](./TASK.md) — 待實作項目清單

## 重要原則

- 使用 `<script setup lang="ts">`，禁止 Options API
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`
- HTTP 呼叫只能透過 `src/services/http.ts`
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties，不寫死 hex
- 修改架構後主動更新 `ARCHITECTURE.md`
