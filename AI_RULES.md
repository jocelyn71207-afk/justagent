# AI_RULES.md — Coding Standards & Architecture Rules

This file defines the conventions, architecture rules, and standards that AI tools must follow when contributing to this repository.

---

## 1. Tech Stack

| Concern | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Language | TypeScript 5 |
| Bundler | Vite |
| Router | Vue Router 4 |
| State | Pinia 3 |
| Styling | SCSS (global + component classes) |
| HTTP | Axios (via `src/services/http.ts`) |
| Icons | Google Material Symbols (outlined) |
| Dialogs | SweetAlert2 (via `src/services/popDialog.ts`) |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## 2. Language & Naming

### Code
- All identifiers (variables, functions, types, interfaces) must be in **English**.
- **camelCase** for variables, functions, and reactive refs.
- **PascalCase** for component names, interfaces, and type aliases.
- **kebab-case** for CSS class names.
- No SCREAMING_SNAKE_CASE (except for true constants if absolutely necessary).

### Comments & UI Text
- Comments and UI-facing strings may be in **Traditional Chinese**.
- Do not mix Chinese into identifier names.

### File Names
- Vue components: `PascalCase.vue` (e.g., `ProjectDashboard.vue`)
- Reusable UI components: `camelCase/PascalCase.vue` (e.g., `compModal/compModal.vue`)
- Services and utilities: `camelCase.ts` (e.g., `http.ts`, `popDialog.ts`)
- SCSS partials: `_camelCase.scss` with underscore prefix

---

## 3. Component Rules

### Always use `<script setup lang="ts">`
```vue
<script setup lang="ts">
// ...
</script>
```
Never use Options API (`export default defineComponent({})`) or `<script lang="ts">` without `setup`.

### Props and Emits
- Always define props with `defineProps<{}>()` and use `withDefaults()` when defaults are needed.
- Always define emits with `defineEmits<{}>()`.
```typescript
const props = withDefaults(defineProps<{
  title: string
  count?: number
}>(), {
  count: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()
```

### Store Usage
- Always use `storeToRefs()` when destructuring reactive state from a store.
- Never destructure store state directly (it loses reactivity).
```typescript
const rootStore = useRootStore()
const { isShowBatchUpload, testGroups } = storeToRefs(rootStore)
const { openBatchUploadFn } = rootStore // actions can be destructured directly
```

### Template
- Use `v-bind` shorthand (`:`) and `v-on` shorthand (`@`).
- Use `<template>` for conditional wrapper elements.
- Prefer `v-show` for frequent toggle visibility; use `v-if` for one-time or rare renders.

---

## 4. File & Directory Structure

```
src/
├── assets/            # Static images and media
├── components/        # Shared/reusable Vue components
│   └── compXxx/       # Complex components get their own folder
├── container/         # Layout wrapper components
├── router/            # Vue Router definitions
├── services/          # HTTP, API, and utility services
├── stores/            # Pinia stores
├── scss/              # Global styles
│   ├── base/          # Variables, themes, resets
│   ├── components/    # Per-component SCSS files
│   ├── views/         # Per-view SCSS files
│   └── libs/          # Third-party overrides
├── types/             # Shared TypeScript type declarations
├── utils/             # Pure utility functions
└── views/             # Page-level components (route targets)
```

### Rules
- Page components go in `src/views/`.
- Reusable UI components go in `src/components/`.
- Complex components with sub-parts get a dedicated folder (e.g., `src/components/AiViewer/`).
- All imports use the `@/` path alias — never use relative `../../` paths.

---

## 5. SCSS / Styling Rules

### Architecture
- **Do not use `<style scoped>`** in components. Styles are managed globally in `src/scss/`.
- Each component has a corresponding SCSS file in `src/scss/components/_ComponentName.scss`.
- Each view has a corresponding SCSS file in `src/scss/views/_ViewName.scss`.
- New SCSS files must be registered in the respective `_index.scss` barrel file.

### Naming
- CSS classes use **kebab-case**: `.project-list-item`, `.header-box`.
- Top-level class names match the component name: `.AppMenuTree`, `.ProjectListContent`.
- Nest child selectors under the component root class to scope them.

### Theming
- Use **CSS custom properties** for all colors, not hardcoded hex values.
- Defined in `src/scss/base/_theme.scss` (light) and `src/scss/base/_themeDark.scss` (dark).
- Examples: `var(--color-background-1)`, `var(--color-text-alpha50)`.
- Brand colors from `src/scss/base/_variables.scss`: `$color_main_1`, `$grey-border`, etc.

### Utility Classes
- Use existing utilities from `src/scss/base/`: `.d-flex`, `.flex-align-center`, `.mt-2`, `.p-1`, `.fs-14`, etc.
- Do not create new utility classes unless they are truly reusable across 3+ components.

### Mixins
- `@include no-scroll-bar()` — hide scrollbar visually
- `@include use-scroll-bar()` — show styled scrollbar
- Import sass:color with `@use "sass:color"` when doing color manipulation.

---

## 6. State Management (Pinia)

### Store Definition
Always use the **Composition API style** for stores:
```typescript
export const useExampleStore = defineStore('exampleStore', () => {
  const data = ref<string[]>([])
  const isLoading = ref(false)

  async function fetchData() {
    isLoading.value = true
    // ...
    isLoading.value = false
  }

  return { data, isLoading, fetchData }
})
```
Never use Options API stores (`defineStore('id', { state, getters, actions })`).

### Guidelines
- Keep stores focused on a single domain.
- Expose only what consumers need in the `return`.
- Use `computed()` for derived state (getters) inside the store.

---

## 7. HTTP & API Services

### HTTP Client
- All HTTP calls go through the wrapper in `src/services/http.ts`.
- Use typed generics: `httpService.get<ResponseType>(url, params)`.
- Never import Axios directly in components or views.

### API Modules
- Group API calls by domain in `src/services/`.
- Define request/response interfaces in the same service file or in `src/types/`.
- Handle errors at the service layer, not in components.

### Example
```typescript
// src/services/projectApi.ts
interface GetProjectsResponse {
  projects: Project[]
  total: number
}

export async function getProjects(teamId: string): Promise<GetProjectsResponse> {
  return httpService.get<GetProjectsResponse>('/api/projects', { teamId })
}
```

---

## 8. Routing

### Route Structure
- All authenticated routes are nested under the `/view/` layout (using `Full.vue` as the container).
- Routes use **lazy loading**: `component: () => import('@/views/SomePage.vue')`.
- Use `meta` for route-level configuration (e.g., `meta: { hideMenuTree: true }`).

### Adding a New Route
1. Create the view component in `src/views/`.
2. Create its SCSS file in `src/scss/views/` and register in `_index.scss`.
3. Add the route in `src/router/index.ts` as a child of the `/view` route.

---

## 9. TypeScript

- Enable and respect `strict: true` settings from `tsconfig.app.json`.
- Always type `ref<T>()` explicitly when the type is not inferrable.
- Prefer `interface` over `type` for object shapes; use `type` for unions and aliases.
- Never use `any` — use `unknown` and narrow types, or define proper interfaces.
- Place shared types in `src/types/`.

---

## 10. Icons

Use Google Material Symbols (outlined variant) via the CSS class approach:
```html
<span class="material-symbols-outlined">home</span>
```
Do not use other icon libraries unless already present in the project.

---

## 11. Dialogs & Notifications

Use the project's SweetAlert2 wrapper for all user-facing dialogs:
```typescript
import { popDialog } from '@/services/popDialog'

popDialog.confirm({ title: '確認刪除？' }).then(result => {
  if (result.isConfirmed) { /* ... */ }
})
```
Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.

---

## 12. Testing

### Unit Tests (Vitest)
- Place unit tests alongside the source file as `*.test.ts` or `*.spec.ts`.
- Test pure functions in `src/utils/` and `src/services/`.
- Use `jsdom` environment for DOM-related tests.

### E2E Tests (Playwright)
- Place E2E specs in `e2e/`.
- Test names and descriptions may be in Traditional Chinese to match product specs.
- Run with `npm run test:e2e`.

---

## 13. Environment & Build

### Environment Variables
- Prefix all custom vars with `VITE_`.
- Access via `import.meta.env.VITE_VAR_NAME`.
- Never hardcode API base URLs in source code.

### Build Modes
| Mode | Purpose |
|---|---|
| `dev` | Local development |
| `sit` | System Integration Testing |
| `uat` | User Acceptance Testing |
| `biz` | Business / Production |

Use `npm run build:biz` for production builds.

---

## 14. General Do's and Don'ts

### Do
- Follow the existing pattern in neighboring files before inventing a new approach.
- Keep components focused — split when a component exceeds ~300 lines of template + script.
- Use `computed()` for any value derived from reactive state.
- Clean up event listeners and subscriptions in `onUnmounted()`.
- Use the `@/` alias for all imports.

### Don't
- Don't add `<style scoped>` — use global SCSS files instead.
- Don't use Options API in new code.
- Don't import Axios directly — use `src/services/http.ts`.
- Don't introduce new third-party libraries without discussion.
- Don't use `any` in TypeScript.
- Don't hardcode colors — use CSS variables or SCSS variables.
- Don't create utility helpers for single-use logic.
- Don't add unnecessary comments — code should be self-documenting; use comments only for non-obvious logic.
