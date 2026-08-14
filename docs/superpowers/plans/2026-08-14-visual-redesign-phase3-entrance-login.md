# 全站視覺重新設計 Phase 3：入口與登入群組 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `AppEntrance.vue` 從空白 stub 改造成有品牌感的 loading 過渡畫面並接入登入流程，並把 `LoginView.vue` 從置中單欄卡片改為左右分栅版面（左品牌視覺/右表單），同時清掉 `_LoginView.scss` 的新舊重複死程式碼。

**Architecture:** 三個任務依序進行：(1) `AppEntrance.vue` 的內容 + 自動導覽邏輯 + 樣式一次到位；(2) `LoginView.vue` 的樣板結構改為左右分栅、`handleLogin` 導覽目的地改為 `/entrance`；(3) `_LoginView.scss` 整份重寫以支援新樣板結構、響應式斷點、dark mode，並移除舊檔案裡從未被樣板使用的重複 class。每個任務都是 TDD 循環（測試優先）+ 手動視覺檢查。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Vue Router 4、Pinia、Vitest + `@vue/test-utils`、SCSS（CSS Custom Properties 主題 token）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（專案 `CLAUDE.md`）
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`（專案 `CLAUDE.md`）
- 顏色使用 CSS Custom Properties，不寫死 hex（品牌 teal 漸層例外：品牌面板固定不隨主題切換，仍使用 `var(--primary)`/`var(--accent)` token，只有漸層終點色 `#00614A` 是手寫深色，因為它本來就不隨主題變化）
- Google/Facebook 登入按鈕的 SVG `<path>` markup（含 `d` 與 `fill` 屬性）必須逐字保留現有 `LoginView.vue` 的內容，不得更動或用佔位圖示取代
- `AppEntrance` 自動導覽延遲固定為 **1000ms**（落在 spec 訂的 900ms–1200ms 區間內），導覽目的地固定為 `/view/ProjectDashboard`
- `LoginView.vue` 的 `handleLogin()` 導覽目的地改為 `/entrance`（不再直接跳 `/view/ProjectDashboard`）
- 響應式斷點固定為 **899px**（`@media (max-width: 899px)` 隱藏品牌面板、社群登入按鈕改單欄）
- 套用 Phase 2 既有的活潑感系統 class：`.lively-stagger`（容器）、`.lively-card`（可互動卡片/按鈕）——定義在 `src/scss/_custom.scss`，本次不新增或修改該檔案
- 不修「忘記密碼」「創建帳號」「隱私政策」「服務條款」的 `href="#"` 假連結
- 不修 `handleLogin()` 裡 `console.log('Login attempt:', {...})` 印出明文密碼的問題
- 不刪除 `src/assets/logo-new.png` 檔案本身，只是 `LoginView.vue` 改用文字 wordmark、不再引用它

---

### Task 1: AppEntrance —— 品牌感 Loading 過渡畫面 + 自動導覽

**Files:**
- Modify: `src/views/AppEntrance.vue`（整份重寫）
- Modify: `src/scss/views/_AppEntrance.scss`（目前只有 3 行 `.AppEntrance { font-family: $font-family; }`，整份重寫）
- Test: `src/views/__tests__/AppEntrance.redirect.test.ts`（新檔）

**Interfaces:**
- Consumes: `src/scss/_custom.scss` 既有的 `.lively-stagger` class（不需 import，全域樣式已在 `style.scss` 載入鏈中）；`src/router/index.ts` 既有路由 `/view/ProjectDashboard`（`name: 'ProjectDashboard'`）
- Produces: `AppEntrance.vue` 掛載後固定 1000ms 呼叫 `router.push('/view/ProjectDashboard')`——Task 2 的 `LoginView.vue` 會依賴這個目的地路徑存在（該路徑已存在於路由表，不需新增）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/AppEntrance.redirect.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AppEntrance from '../AppEntrance.vue'

describe('AppEntrance 品牌 Loading 過渡畫面', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountEntrance() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(AppEntrance, { global: { plugins: [router] } })
    return { wrapper, pushSpy }
  }

  it('掛載後延遲 1000ms 導覽至 /view/ProjectDashboard', () => {
    const { wrapper, pushSpy } = mountEntrance()
    expect(pushSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(pushSpy).toHaveBeenCalledWith('/view/ProjectDashboard')
    wrapper.unmount()
  })

  it('品牌標記、spinner、文字都套用 lively-stagger 進場容器', () => {
    const { wrapper } = mountEntrance()
    expect(wrapper.find('.entrance-content').classes()).toContain('lively-stagger')
    expect(wrapper.find('.entrance-mark').exists()).toBe(true)
    expect(wrapper.find('.entrance-spinner').exists()).toBe(true)
    expect(wrapper.find('.entrance-text').text()).toBe('正在為您準備工作環境...')
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- AppEntrance.redirect`
Expected: FAIL —— 目前 `AppEntrance.vue` 沒有 `.entrance-content`/`.entrance-mark`/`.entrance-spinner`/`.entrance-text`，也沒有 `router.push` 呼叫

- [ ] **Step 3: 重寫 `AppEntrance.vue`**

```vue
<template>
  <div class="AppEntrance">
    <div class="entrance-content lively-stagger">
      <div class="entrance-mark">
        <span class="entrance-dot" aria-hidden="true"></span>
        <span>JustAgent</span>
      </div>
      <div class="entrance-spinner" role="status" aria-label="載入中"></div>
      <p class="entrance-text">正在為您準備工作環境...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const REDIRECT_DELAY_MS = 1000

let redirectTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  redirectTimer = setTimeout(() => {
    router.push('/view/ProjectDashboard')
  }, REDIRECT_DELAY_MS)
})

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})
</script>
```

- [ ] **Step 4: 重寫 `_AppEntrance.scss`**

```scss
@use 'sass:color';

.AppEntrance {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--page-bg);
  font-family: $font-family;
}

.entrance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.entrance-mark {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
  color: var(--text);
}

.entrance-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

.entrance-spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid var(--primary-a20);
  border-top-color: var(--primary);
}

@media (prefers-reduced-motion: no-preference) {
  .entrance-spinner {
    animation: entrance-spin 0.9s linear infinite;
  }
}

@keyframes entrance-spin {
  to { transform: rotate(360deg); }
}

.entrance-text {
  font-size: 13.5px;
  color: var(--text-muted);
}
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npm run test:unit -- AppEntrance.redirect`
Expected: PASS（2 個測試）

- [ ] **Step 6: Commit**

```bash
git add src/views/AppEntrance.vue src/scss/views/_AppEntrance.scss src/views/__tests__/AppEntrance.redirect.test.ts
git commit -m "feat(AppEntrance): 品牌感 loading 過渡畫面 + 自動導覽至 ProjectDashboard"
```

---

### Task 2: LoginView —— 左右分栅樣板結構 + 導覽目的地改為 /entrance

**Files:**
- Modify: `src/views/LoginView.vue`（整份重寫樣板與 `handleLogin`；`email`/`password`/`rememberMe`/`showPassword` 這 4 個 `ref` 不變）
- Test: `src/views/__tests__/LoginView.layout.test.ts`（新檔）

**Interfaces:**
- Consumes: Task 1 產生的 `/view/ProjectDashboard` 目的地不直接使用；本任務改為導覽至 `/entrance`（該路由已存在於 `src/router/index.ts:21-24`，`name: 'AppEntrance'`）
- Produces: 新 class 名稱供 Task 3 的 SCSS 套用樣式——`.login-split`、`.login-brand`、`.login-brand-nodes`、`.login-brand-mark`、`.login-brand-dot`、`.login-brand-copy`、`.login-brand-headline`、`.login-brand-sub`、`.login-brand-features`、`.login-brand-feature`、`.login-brand-foot`、`.login-form-side`、`.login-form-inner`、`.login-form-title`、`.login-form-sub`（沿用既有 `.social-login`/`.social-btn`/`.google-btn`/`.facebook-btn`/`.divider`/`.login-form`/`.input-group`/`.visibility-toggle`/`.form-actions`/`.remember-me`/`.forgot-password`/`.login-submit-btn`/`.login-footer`/`.create-account` 舊 class 名）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/LoginView.layout.test.ts`：

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../LoginView.vue'

const GOOGLE_PATHS = [
  'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z',
  'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
  'M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z',
  'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z',
]
const FACEBOOK_PATH = 'M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 12V15.56H7.13V12.07h2.99V9.41c0-2.96 1.76-4.59 4.44-4.59 1.28 0 2.63.23 2.63.23v2.9h-1.48c-1.46 0-1.92.91-1.92 1.84v2.21h3.26l-.52 3.49h-2.74V24.07C19.59 23.09 24 18.1 24 12.07z'

function mountLoginView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(LoginView, { global: { plugins: [router] } })
}

describe('LoginView 左右分栅版面', () => {
  it('左側品牌面板與右側表單面板同時存在', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-split').exists()).toBe(true)
    expect(wrapper.find('.login-brand').exists()).toBe(true)
    expect(wrapper.find('.login-form-side').exists()).toBe(true)
  })

  it('Google/Facebook 登入按鈕的 SVG icon 逐字保留原始設計', () => {
    const wrapper = mountLoginView()
    const googlePaths = wrapper.findAll('.google-btn svg path').map(p => p.attributes('d'))
    expect(googlePaths).toEqual(GOOGLE_PATHS)
    const facebookPath = wrapper.find('.facebook-btn svg path').attributes('d')
    expect(facebookPath).toBe(FACEBOOK_PATH)
  })

  it('版權資訊只出現在左側品牌面板，不在右側表單重複顯示', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-brand').text()).toContain('莫比機器人股份有限公司')
    expect(wrapper.find('.login-form-side').text()).not.toContain('莫比機器人股份有限公司')
  })

  it('送出表單會導覽到 /entrance，不再直接跳 ProjectDashboard', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('form.login-form').trigger('submit')
    expect(pushSpy).toHaveBeenCalledWith('/entrance')
  })

  it('表單面板套用 lively-stagger 進場容器，社群/送出按鈕套用 lively-card', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-form-inner').classes()).toContain('lively-stagger')
    expect(wrapper.find('.google-btn').classes()).toContain('lively-card')
    expect(wrapper.find('.facebook-btn').classes()).toContain('lively-card')
    expect(wrapper.find('.login-submit-btn').classes()).toContain('lively-card')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- LoginView.layout`
Expected: FAIL —— 目前樣板是 `.login-wrapper > .login-card` 單欄結構，沒有 `.login-split`/`.login-brand`/`.login-form-side`，`handleLogin` 目前導覽到 `/view/ProjectDashboard`

- [ ] **Step 3: 重寫 `LoginView.vue`**

```vue
<template>
  <div class="login-split">
    <div class="login-brand">
      <svg class="login-brand-nodes" aria-hidden="true" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#fff" stroke-width="1" fill="none">
          <line x1="40" y1="60" x2="140" y2="130" />
          <line x1="140" y1="130" x2="90" y2="230" />
          <line x1="140" y1="130" x2="260" y2="110" />
          <line x1="260" y1="110" x2="330" y2="200" />
          <line x1="90" y1="230" x2="200" y2="300" />
          <line x1="200" y1="300" x2="330" y2="200" />
          <line x1="200" y1="300" x2="150" y2="410" />
          <line x1="200" y1="300" x2="300" y2="400" />
        </g>
        <g fill="#fff">
          <circle cx="40" cy="60" r="5" />
          <circle cx="140" cy="130" r="7" />
          <circle cx="260" cy="110" r="5" />
          <circle cx="90" cy="230" r="5" />
          <circle cx="330" cy="200" r="6" />
          <circle cx="200" cy="300" r="8" />
          <circle cx="150" cy="410" r="5" />
          <circle cx="300" cy="400" r="5" />
        </g>
      </svg>
      <div class="login-brand-mark">
        <span class="login-brand-dot" aria-hidden="true"></span>
        <span>JustAgent</span>
      </div>
      <div class="login-brand-copy">
        <h1 class="login-brand-headline">讓每個 Agent，都學會你的企業專業</h1>
        <p class="login-brand-sub">集中管理技能、審核流程與版本，跨團隊共享同一套 Agent 能力。</p>
        <ul class="login-brand-features">
          <li class="login-brand-feature">技能治理與審核流程</li>
          <li class="login-brand-feature">跨團隊技能共享與擴充</li>
          <li class="login-brand-feature">版本控管與異動稽核</li>
        </ul>
      </div>
      <p class="login-brand-foot">© 2026 莫比機器人股份有限公司</p>
    </div>

    <div class="login-form-side">
      <div class="login-form-inner lively-stagger">
        <h2 class="login-form-title">歡迎回來</h2>
        <p class="login-form-sub">登入以繼續管理你的技能與團隊</p>

        <div class="social-login">
          <button type="button" class="social-btn google-btn lively-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button type="button" class="social-btn facebook-btn lively-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 12V15.56H7.13V12.07h2.99V9.41c0-2.96 1.76-4.59 4.44-4.59 1.28 0 2.63.23 2.63.23v2.9h-1.48c-1.46 0-1.92.91-1.92 1.84v2.21h3.26l-.52 3.49h-2.74V24.07C19.59 23.09 24 18.1 24 12.07z" fill="#1877F2"/>
            </svg>
            Facebook
          </button>
        </div>

        <div class="divider">
          <span>或使用 email 繼續</span>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <i class="material-symbols-rounded">mail</i>
            <input type="text" placeholder="Email" v-model="email" />
          </div>
          <div class="input-group">
            <i class="material-symbols-rounded">lock</i>
            <input :type="showPassword ? 'text' : 'password'" placeholder="Password" v-model="password" />
            <i class="material-symbols-rounded visibility-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'visibility' : 'visibility_off' }}
            </i>
          </div>

          <div class="form-actions">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" />
              <span>記住帳號</span>
            </label>
            <a href="#" class="forgot-password">忘記密碼？</a>
          </div>

          <button type="submit" class="login-submit-btn lively-card">登入</button>
        </form>

        <div class="login-footer">
          <p>還沒有帳號？ <a href="#" class="create-account">創建帳號</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);

const handleLogin = () => {
  console.log('Login attempt:', { email: email.value, password: password.value, rememberMe: rememberMe.value });
  // 導向品牌 loading 過渡畫面，由 AppEntrance 完成後再轉往 ProjectDashboard
  router.push('/entrance');
};
</script>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm run test:unit -- LoginView.layout`
Expected: PASS（5 個測試）——此時畫面還沒有 Task 3 的樣式，版面會是無樣式的堆疊，這是預期中間狀態

- [ ] **Step 5: Commit**

```bash
git add src/views/LoginView.vue src/views/__tests__/LoginView.layout.test.ts
git commit -m "feat(LoginView): 樣板改為左右分栅結構，登入後導覽至 /entrance"
```

---

### Task 3: LoginView SCSS —— 左右分栅樣式、響應式、Dark Mode、死程式碼清理

**Files:**
- Modify: `src/scss/views/_LoginView.scss`（整份重寫，取代舊的單欄卡片樣式與新舊重複 class）

**Interfaces:**
- Consumes: Task 2 樣板產生的 class 名稱（見 Task 2 的 Produces 清單）；`src/scss/base/_theme.scss`/`_themeDark.scss` 既有 token：`--primary`、`--accent`、`--primary-hover`、`--primary-fg`、`--primary-a20`、`--text`、`--text-muted`、`--text-faint`、`--surface`、`--divider`、`--page-bg`、`--sidebar-bg`
- Produces:（本任務為最終任務，無後續任務依賴其產物）

- [ ] **Step 1: 整份重寫 `_LoginView.scss`**

```scss
// ── LoginView：左右分栅登入頁 ──────────────────────────────
// 左側品牌面板固定深色 teal（品牌識別，不隨 light/dark 切換）
// 右側表單面板跟隨 --surface/--text/--divider 等 token

.login-split {
  min-height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: 'Microsoft JhengHei', sans-serif;
}

// ── 左側品牌面板 ────────────────────────────────────────────
.login-brand {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 56px 48px;
  color: #fff;
  background:
    radial-gradient(1200px 600px at 20% 0%, var(--accent) 0%, transparent 55%),
    linear-gradient(160deg, var(--primary) 0%, #00614A 100%);
}

.login-brand-nodes {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.22;
  pointer-events: none;
}

.login-brand-mark {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.01em;
}

.login-brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
}

.login-brand-copy {
  position: relative;
}

.login-brand-headline {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.35;
  max-width: 380px;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

.login-brand-sub {
  font-size: 14px;
  opacity: 0.85;
  max-width: 360px;
  line-height: 1.6;
  margin: 0;
}

.login-brand-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 28px 0 0;
  padding: 0;
}

.login-brand-feature {
  position: relative;
  padding-left: 34px;
  font-size: 13.5px;
  opacity: 0.92;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 2px;
    width: 22px;
    height: 22px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.16);
  }
}

.login-brand-foot {
  position: relative;
  font-size: 11.5px;
  opacity: 0.6;
  margin: 0;
}

// ── 右側表單面板 ────────────────────────────────────────────
.login-form-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--page-bg);
}

.login-form-inner {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-form-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.login-form-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 4px;
}

.social-login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 9999px;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: background 0.2s ease;

  &:hover {
    background: var(--sidebar-bg);
  }

  svg {
    flex-shrink: 0;
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--divider);
  }

  span {
    padding: 0 12px;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;

  .material-symbols-rounded {
    position: absolute;
    left: 16px;
    color: var(--text-muted);
    font-size: 20px;
    font-family: 'Material Symbols Rounded';
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 48px;
    background: var(--page-bg);
    border: 1px solid var(--divider);
    border-radius: 9999px;
    padding: 0 48px;
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--text-faint);
    }

    &:focus {
      outline: none;
      background: var(--surface);
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--primary-a20);
    }
  }

  .visibility-toggle {
    left: auto;
    right: 16px;
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      color: var(--primary);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: color 0.2s;
  color: var(--text-muted);

  &:hover {
    color: var(--text);
  }

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
  }
}

.forgot-password {
  color: var(--primary);
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.login-submit-btn {
  width: 100%;
  height: 52px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--primary);
  border: none;
  border-radius: 9999px;
  color: var(--primary-fg);
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: var(--primary-hover);
  }

  &:active {
    transform: scale(0.99);
  }
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);

  .create-account {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// ── 響應式：< 900px 隱藏品牌面板，只顯示置中表單 ───────────────
@media (max-width: 899px) {
  .login-split {
    grid-template-columns: 1fr;
  }

  .login-brand {
    display: none;
  }

  .social-login {
    grid-template-columns: 1fr;
  }
}

// ── Dark mode：只調整右側表單面板，左側品牌面板固定不變 ───────
@mixin login-dark {
  .social-btn:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .login-submit-btn {
    box-shadow: 0 1px 2px rgba(0, 200, 150, 0.2);

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 200, 150, 0.25), 0 8px 20px rgba(0, 0, 0, 0.3);
    }
  }
}

[data-theme="dark"] { @include login-dark; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @include login-dark; }
}
```

這份新內容整個取代舊檔案，因此舊檔案裡從未被樣板使用的重複 class（`.login-divider`、`.login-input-group`、`.login-form-actions`、`.login-remember-me`、`.login-forgot-password`、`.login-company-info`，以及舊的 `.login-wrapper`/`.login-card`/`.login-logo`/`.login-header` 單欄卡片樣式）全部一併移除，不需要逐條刪除。

- [ ] **Step 2: 執行 build 確認 SCSS 編譯無誤**

Run: `npm run build`
Expected: 編譯成功，無 SCSS 錯誤（例如未定義的 mixin/變數）

- [ ] **Step 3: 重新執行 Task 2 的測試確認樣式改動沒有破壞既有結構斷言**

Run: `npm run test:unit -- LoginView.layout`
Expected: PASS（5 個測試，跟 Task 2 完成時一致——這一步純粹確認 SCSS 改動沒有意外影響到樣板）

- [ ] **Step 4: 手動視覺檢查**

啟動 `npm run dev`，在瀏覽器打開登入頁（`/`）：
- 桌面寬度（≥900px）：確認左右分栅呈現，左側 teal 漸層品牌面板 + 節點圖案，右側白色表單
- 縮小視窗至 <900px：確認品牌面板消失，只剩置中表單，社群登入按鈕變單欄
- 切換 dark mode（`[data-theme="dark"]` 或系統 dark mode）：確認左側品牌面板顏色不變，右側表單面板正確變深色，沒有意外的深色/淺色不一致
- 確認 Google/Facebook 按鈕圖示跟原本設計一致（多色 Google 標誌、藍色 Facebook 標誌）
- 開啟系統的「減少動態效果」偏好設定，確認社群/送出按鈕的進場動畫停用（`.lively-stagger`/`.lively-card` 已由 `_custom.scss` 既有的 `prefers-reduced-motion` 判斷處理，這裡只需確認畫面上真的沒有動畫殘留）

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_LoginView.scss
git commit -m "style(LoginView): 左右分栅樣式、899px 響應式斷點、dark mode 調整，清除新舊重複 class 死程式碼"
```

---

## 執行後檢查

三個任務都完成後，執行一次全套驗證：

```bash
npm run test:unit
npm run build
npm run type-check
npm run lint
```

`test:unit`、`build` 必須全部通過；`type-check`、`lint` 只需確認沒有比修改前更多的錯誤數（既有技術債不在本次範圍）。
