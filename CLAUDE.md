# CLAUDE.md

每次開始開發前，請先閱讀以下文件：

- [AI_RULES.md](./AI_RULES.md) — 程式規範、命名慣例、元件寫法
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — 業務背景、功能模組、術語表
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 技術架構、資料流、設計決策

## 常用指令

```bash
npm run dev          # 本地開發（Vite dev server）
npm run build        # 一般 build
npm run biz          # 生產環境 build
npm run test:unit    # Vitest 單元測試
npm run test:e2e     # Playwright E2E 測試
npm run lint         # ESLint 修正
npm run type-check   # TypeScript 型別檢查
```

## 重要原則

- 使用 `<script setup lang="ts">`，禁止 Options API
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`
- HTTP 呼叫只能透過 `src/services/http.ts`
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties，不寫死 hex
- 修改架構後主動更新 `ARCHITECTURE.md`

## Gotchas

- **S3 上傳例外**：直接上傳 S3 時用 `axios.put(uploadUrl, file)`，不走 `http.ts`（避免夾帶 auth header）
- **新增 SCSS 檔案**：需在對應的 `src/scss/components/_index.scss` 或 `src/scss/views/_index.scss` 中手動 `@forward` 新檔案，否則樣式不會被打包
