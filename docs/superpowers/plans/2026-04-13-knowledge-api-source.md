# Knowledge API 來源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓知識庫支援「從外部 REST API 同步」作為第二種知識條目來源，支援手動觸發與排程（每天/每週），同步後直接建立草稿條目，略過現有 wizard 流程。

**Architecture:** 新增 `KnowledgeApiSources.vue` 頁面（獨立路由）管理 API 來源設定；`ApiSourceModal.vue` 處理新增/編輯；`knowledgeStore.ts` 擴充 `apiSources` 狀態與同步 actions；`KnowledgeBase.vue` 的新增按鈕改為下拉，提供兩種入口。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vue Router、SCSS（`src/scss/views/`）

---

## 檔案清單

| 動作 | 路徑 | 說明 |
|---|---|---|
| 修改 | `src/stores/knowledgeStore.ts` | 新增 `ApiSource` 型別、`apiSources` 陣列、CRUD actions、`triggerSync` |
| 修改 | `src/router/index.ts` | 新增 `/view/KnowledgeApiSources` 路由 |
| 修改 | `src/views/KnowledgeBase.vue` | 新增按鈕改為下拉選單（上傳文件 / API 來源管理） |
| 新增 | `src/components/Knowledge/ApiSourceModal.vue` | 新增/編輯 API 來源的 Modal |
| 新增 | `src/views/KnowledgeApiSources.vue` | API 來源管理列表頁 |
| 新增 | `src/scss/views/_KnowledgeApiSources.scss` | 頁面樣式 |
| 修改 | `src/scss/views/_index.scss` | `@import "./KnowledgeApiSources"` |

---

## Task 1：擴充 knowledgeStore — ApiSource 型別與假資料

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1：在 knowledgeStore.ts 頂部（`SourceFileRef` interface 之前）新增 ApiSource 型別**

在 `src/stores/knowledgeStore.ts` 的第 1 行之後、`export interface SourceFileRef` 之前，插入：

```typescript
export interface ApiSourceHeader {
  key: string;
  value: string;
}

export interface ApiSource {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: ApiSourceHeader[];
  body: string;
  titleField: string;
  contentField: string;
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY';
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null;
  lastSyncCount: number;
  lastSyncError: string | null;
}
```

- [ ] **Step 2：在 store 的 `defineStore` 內，`knowledgeList` 宣告之後，新增 `apiSources` 假資料**

找到 `const knowledgeList = ref<KnowledgeItem[]>([` 這一行，在 `knowledgeList` 整個 `ref([...])` 結束後，緊接著加入：

```typescript
  const apiSources = ref<ApiSource[]>([
    {
      id: 'api-1',
      name: '商品目錄 API',
      url: 'https://api.example.com/products',
      method: 'GET',
      headers: [{ key: 'Authorization', value: 'Bearer demo-token' }],
      body: '',
      titleField: 'productName',
      contentField: 'description',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-04-12 09:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 5,
      lastSyncError: null,
    },
    {
      id: 'api-2',
      name: '庫存狀態 API',
      url: 'https://erp.internal/inventory',
      method: 'POST',
      headers: [{ key: 'X-API-Key', value: 'erp-key-456' }],
      body: '{"storeId": "TW001"}',
      titleField: 'itemName',
      contentField: 'stockInfo',
      schedule: 'MANUAL',
      enabled: false,
      lastSyncAt: '2026-04-10 14:30',
      lastSyncStatus: 'FAILED',
      lastSyncCount: 0,
      lastSyncError: '連線逾時：無法連接至 erp.internal',
    },
  ]);
```

- [ ] **Step 3：在 store 內新增 apiSources 的 CRUD actions 與 triggerSync**

在 `dismissSourceStale` function 之後、`return {` 之前，新增：

```typescript
  // ── API 來源 CRUD ──
  function createApiSource(payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>) {
    const newSource: ApiSource = {
      ...payload,
      id: `api-${Date.now()}`,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncCount: 0,
      lastSyncError: null,
    };
    apiSources.value.unshift(newSource);
    return newSource.id;
  }

  function updateApiSource(id: string, payload: Partial<Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>>) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) Object.assign(source, payload);
  }

  function deleteApiSource(id: string) {
    apiSources.value = apiSources.value.filter(s => s.id !== id);
  }

  function toggleApiSourceEnabled(id: string) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) source.enabled = !source.enabled;
  }

  // 模擬同步
  function triggerSync(id: string): Promise<void> {
    const source = apiSources.value.find(s => s.id === id);
    if (!source) return Promise.resolve();

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2;
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

        if (success) {
          const count = Math.floor(Math.random() * 8) + 1;
          source.lastSyncStatus = 'SUCCESS';
          source.lastSyncAt = now;
          source.lastSyncCount = count;
          source.lastSyncError = null;

          // 建立草稿知識條目
          for (let i = 0; i < count; i++) {
            const newId = `k-api-${Date.now()}-${i}`;
            const draftId = `v1.0-draft-${Date.now()}-${i}`;
            knowledgeList.value.unshift({
              id: newId,
              title: `[API] ${source.name} — 條目 ${i + 1}`,
              category: '',
              currentVersion: 'v1.0',
              status: 'DRAFT',
              lastUpdateTime: now,
              lastUpdateBy: `API 同步（${source.name}）`,
              versions: [{
                id: draftId,
                knowledgeId: newId,
                versionNumber: 'v1.0',
                status: 'DRAFT',
                title: `[API] ${source.name} — 條目 ${i + 1}`,
                summary: `由 API 來源「${source.name}」同步建立`,
                content: `來源 API：${source.url}\n欄位對應：標題=${source.titleField}，內容=${source.contentField}\n\n（此為示範草稿，實際內容由 API 回傳資料填入）`,
                category: '',
                tags: [],
                lastUpdateBy: `API 同步`,
                lastUpdateTime: now,
                updateNote: `由 API 來源「${source.name}」自動同步建立`,
              }],
            });
          }
        } else {
          source.lastSyncStatus = 'FAILED';
          source.lastSyncAt = now;
          source.lastSyncCount = 0;
          source.lastSyncError = '連線失敗：API 回應狀態 503';
        }

        resolve();
      }, 2000);
    });
  }
```

- [ ] **Step 4：在 return 物件中加入新 actions 與 apiSources**

找到 `return {` 區塊，在最後的 `dismissSourceStale,` 之後加入：

```typescript
    apiSources,
    createApiSource,
    updateApiSource,
    deleteApiSource,
    toggleApiSourceEnabled,
    triggerSync,
```

- [ ] **Step 5：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(knowledge): add ApiSource type, mock data, and sync actions to store"
```

---

## Task 2：新增路由

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1：在 KnowledgeEditor 路由之後新增 KnowledgeApiSources 路由**

找到：
```typescript
      {
        path: '/view/KnowledgeEditor/:knowledgeId/:versionId',
        name: 'KnowledgeEditor',
        component: () => import('@/views/KnowledgeEditor.vue'),
        props: true,
      },
```

在其後插入：
```typescript
      {
        path: '/view/KnowledgeApiSources',
        name: 'KnowledgeApiSources',
        component: () => import('@/views/KnowledgeApiSources.vue'),
      },
```

- [ ] **Step 2：Commit**

```bash
git add src/router/index.ts
git commit -m "feat(router): add KnowledgeApiSources route"
```

---

## Task 3：修改 KnowledgeBase 按鈕為下拉選單

**Files:**
- Modify: `src/views/KnowledgeBase.vue`

- [ ] **Step 1：將「新增知識條目」按鈕改為下拉選單**

找到 template 中：
```html
          <button class="custom-btn custom-main-btn" @click="createNewKnowledge">
            <i class="material-symbols-outlined">add_circle</i>
            新增知識條目
          </button>
```

替換為：
```html
          <div class="add-knowledge-dropdown" ref="addDropdownRef">
            <button class="custom-btn custom-main-btn" @click="showAddDropdown = !showAddDropdown">
              <i class="material-symbols-outlined">add_circle</i>
              新增知識條目
              <i class="material-symbols-outlined fs-18 ml-1" :class="{ 'rotate-180': showAddDropdown }">expand_more</i>
            </button>
            <div v-show="showAddDropdown" class="next-option-box add-dropdown-menu">
              <div class="option-item" @click="createNewKnowledge">
                <i class="material-symbols-outlined">upload_file</i>
                上傳文件
              </div>
              <div class="option-item" @click="goToApiSources">
                <i class="material-symbols-outlined">api</i>
                API 來源管理
              </div>
            </div>
          </div>
```

- [ ] **Step 2：在 `<script setup>` 中新增 dropdown 相關邏輯**

在 `const router = useRouter();` 之後插入：

```typescript
// 新增知識條目下拉
const showAddDropdown = ref(false);
const addDropdownRef = ref<HTMLElement | null>(null);

function goToApiSources() {
  showAddDropdown.value = false;
  router.push({ name: 'KnowledgeApiSources' });
}

// 點外部關閉下拉
function handleOutsideClick(e: MouseEvent) {
  if (addDropdownRef.value && !addDropdownRef.value.contains(e.target as Node)) {
    showAddDropdown.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick));
onUnmounted(() => document.removeEventListener('click', handleOutsideClick));
```

- [ ] **Step 3：確認 import 有 onMounted / onUnmounted**

找到：
```typescript
import { ref, computed, watch, reactive } from 'vue';
```
改為：
```typescript
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
```

- [ ] **Step 4：在 `src/scss/views/_KnowledgeBase.scss` 最末尾加入下拉樣式**

```scss
// ── 新增知識條目下拉選單 ──
.add-knowledge-dropdown {
  position: relative;

  .add-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 160px;
    z-index: 20;
  }

  .rotate-180 {
    transform: rotate(180deg);
    transition: transform 0.2s ease;
  }
}
```

- [ ] **Step 5：Commit**

```bash
git add src/views/KnowledgeBase.vue src/scss/views/_KnowledgeBase.scss
git commit -m "feat(KnowledgeBase): convert add button to dropdown with API sources entry"
```

---

## Task 4：建立 ApiSourceModal 元件

**Files:**
- Create: `src/components/Knowledge/ApiSourceModal.vue`

- [ ] **Step 1：建立 ApiSourceModal.vue**

建立 `src/components/Knowledge/ApiSourceModal.vue`，完整內容：

```vue
<template>
  <compModal
    class="ApiSourceModal"
    v-model="isOpenModal"
    :width="600"
  >
    <template #title>
      <h4>{{ isEdit ? '編輯 API 來源' : '新增 API 來源' }}</h4>
    </template>

    <div class="api-source-form">
      <!-- 來源名稱 -->
      <div class="form-field">
        <label class="form-label">來源名稱 <span class="required">*</span></label>
        <input class="custom-input" v-model="form.name" placeholder="例：商品目錄 API" />
      </div>

      <!-- API URL -->
      <div class="form-field">
        <label class="form-label">API URL <span class="required">*</span></label>
        <input class="custom-input" v-model="form.url" placeholder="https://api.example.com/endpoint" />
        <div v-if="urlError" class="form-error">{{ urlError }}</div>
      </div>

      <!-- HTTP Method -->
      <div class="form-field">
        <label class="form-label">HTTP Method</label>
        <div class="method-toggle">
          <button
            v-for="m in ['GET', 'POST']"
            :key="m"
            :class="['method-btn', { 'is-active': form.method === m }]"
            @click="form.method = m as 'GET' | 'POST'"
          >{{ m }}</button>
        </div>
      </div>

      <!-- Headers -->
      <div class="form-field">
        <label class="form-label">Headers</label>
        <div class="kv-list">
          <div class="kv-row" v-for="(header, i) in form.headers" :key="i">
            <input class="custom-input kv-key" v-model="header.key" placeholder="Key" />
            <input class="custom-input kv-value" v-model="header.value" placeholder="Value" />
            <button class="kv-remove-btn" @click="removeHeader(i)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <button class="custom-btn add-kv-btn" @click="addHeader">
            <i class="material-symbols-outlined">add</i>
            新增 Header
          </button>
        </div>
      </div>

      <!-- Body (POST only) -->
      <div class="form-field" v-if="form.method === 'POST'">
        <label class="form-label">Request Body <span class="form-hint">（JSON 格式）</span></label>
        <textarea class="custom-input body-textarea" v-model="form.body" placeholder='{"key": "value"}'></textarea>
      </div>

      <!-- 欄位對應 -->
      <div class="form-field">
        <label class="form-label">回傳欄位對應 <span class="required">*</span></label>
        <div class="field-map-row">
          <div class="field-map-item">
            <span class="field-map-label">標題欄位名稱</span>
            <input class="custom-input" v-model="form.titleField" placeholder="例：title" />
          </div>
          <div class="field-map-item">
            <span class="field-map-label">內容欄位名稱</span>
            <input class="custom-input" v-model="form.contentField" placeholder="例：content" />
          </div>
        </div>
        <div class="form-hint-text">對應 API 回傳 JSON 中的欄位 key，用來對應至知識條目的標題與內容</div>
      </div>

      <!-- 同步頻率 -->
      <div class="form-field">
        <label class="form-label">同步頻率</label>
        <div class="schedule-options">
          <label
            v-for="opt in scheduleOptions"
            :key="opt.value"
            :class="['schedule-option', { 'is-active': form.schedule === opt.value }]"
          >
            <input type="radio" :value="opt.value" v-model="form.schedule" />
            <i class="material-symbols-outlined">{{ opt.icon }}</i>
            {{ opt.label }}
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <button class="custom-btn" @click="isOpenModal = false">取消</button>
        <button class="custom-btn custom-main-btn" :disabled="!isValid" @click="handleSave">
          {{ isEdit ? '儲存變更' : '新增來源' }}
        </button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ApiSource, ApiSourceHeader } from '@/stores/knowledgeStore';
import compModal from '@/components/compModal/compModal.vue';

const props = defineProps<{
  modelValue: boolean;
  source: ApiSource | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>): void;
}>();

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isEdit = computed(() => props.source !== null);

const scheduleOptions = [
  { value: 'MANUAL', label: '手動', icon: 'touch_app' },
  { value: 'DAILY', label: '每天', icon: 'today' },
  { value: 'WEEKLY', label: '每週', icon: 'date_range' },
] as const;

// ── 表單狀態 ──
const defaultForm = (): Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'> => ({
  name: '',
  url: '',
  method: 'GET',
  headers: [],
  body: '',
  titleField: '',
  contentField: '',
  schedule: 'MANUAL',
  enabled: true,
});

const form = ref(defaultForm());

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = props.source
      ? {
          name: props.source.name,
          url: props.source.url,
          method: props.source.method,
          headers: props.source.headers.map(h => ({ ...h })),
          body: props.source.body,
          titleField: props.source.titleField,
          contentField: props.source.contentField,
          schedule: props.source.schedule,
          enabled: props.source.enabled,
        }
      : defaultForm();
  }
});

// ── 驗證 ──
const urlError = computed(() => {
  if (!form.value.url) return '';
  try {
    new URL(form.value.url);
    return '';
  } catch {
    return '請輸入有效的 URL（需包含 https://）';
  }
});

const isValid = computed(() =>
  !!form.value.name.trim() &&
  !!form.value.url.trim() &&
  !urlError.value &&
  !!form.value.titleField.trim() &&
  !!form.value.contentField.trim()
);

// ── Headers 操作 ──
function addHeader() {
  form.value.headers.push({ key: '', value: '' });
}

function removeHeader(index: number) {
  form.value.headers.splice(index, 1);
}

// ── 儲存 ──
function handleSave() {
  if (!isValid.value) return;
  emit('save', { ...form.value });
  isOpenModal.value = false;
}
</script>
```

- [ ] **Step 2：Commit**

```bash
git add src/components/Knowledge/ApiSourceModal.vue
git commit -m "feat(knowledge): add ApiSourceModal component"
```

---

## Task 5：建立 KnowledgeApiSources 頁面

**Files:**
- Create: `src/views/KnowledgeApiSources.vue`

- [ ] **Step 1：建立 KnowledgeApiSources.vue**

建立 `src/views/KnowledgeApiSources.vue`，完整內容：

```vue
<template>
  <div class="KnowledgeApiSources views-page">
    <div class="views-page-content-box">

      <!-- 頁面標題 -->
      <div class="views-page-header">
        <div class="page-title-group">
          <button class="back-btn" @click="router.push({ name: 'KnowledgeBase' })">
            <i class="material-symbols-outlined">arrow_back</i>
          </button>
          <h3>API 來源管理</h3>
          <i class="material-symbols-outlined fc-grey-1 fs-18 ml-2" v-tooltip="'設定外部 REST API 作為知識條目來源，支援手動與排程自動同步'" style="cursor: default;">info</i>
        </div>
        <button class="custom-btn custom-main-btn" @click="openCreateModal">
          <i class="material-symbols-outlined">add_circle</i>
          新增 API 來源
        </button>
      </div>

      <!-- 空狀態 -->
      <div v-if="apiSources.length === 0" class="empty-state">
        <i class="material-symbols-outlined empty-icon">api</i>
        <div class="empty-title">尚未設定任何 API 來源</div>
        <div class="empty-desc">新增 API 來源後，系統可自動從外部 API 同步資料並建立知識條目草稿</div>
        <button class="custom-btn custom-main-btn mt-4" @click="openCreateModal">
          <i class="material-symbols-outlined">add_circle</i>
          新增 API 來源
        </button>
      </div>

      <!-- 列表 -->
      <div v-else class="api-source-list">
        <div class="api-source-card" v-for="source in apiSources" :key="source.id">
          <!-- 左側資訊 -->
          <div class="source-main">
            <div class="source-icon">
              <i class="material-symbols-outlined">api</i>
            </div>
            <div class="source-info">
              <div class="source-name">{{ source.name }}</div>
              <div class="source-url">{{ source.url }}</div>
              <div class="source-meta">
                <span class="meta-badge">{{ source.method }}</span>
                <span class="meta-badge">{{ scheduleLabelMap[source.schedule] }}</span>
                <!-- 上次同步狀態 -->
                <span v-if="source.lastSyncAt" :class="['sync-status', `sync-status--${source.lastSyncStatus?.toLowerCase()}`]">
                  <i class="material-symbols-outlined">{{ source.lastSyncStatus === 'SUCCESS' ? 'check_circle' : 'error' }}</i>
                  <span v-if="source.lastSyncStatus === 'SUCCESS'">
                    上次同步 {{ source.lastSyncCount }} 筆（{{ source.lastSyncAt }}）
                  </span>
                  <span
                    v-else
                    v-tooltip="source.lastSyncError ?? ''"
                    class="sync-error-text"
                  >
                    同步失敗（{{ source.lastSyncAt }}）
                  </span>
                </span>
                <span v-else class="sync-status sync-status--none">尚未同步</span>
              </div>
            </div>
          </div>

          <!-- 右側操作 -->
          <div class="source-actions">
            <!-- 啟用/停用 toggle -->
            <div
              :class="['enable-toggle', { 'is-enabled': source.enabled }]"
              @click="knowledgeStore.toggleApiSourceEnabled(source.id)"
              v-tooltip="source.enabled ? '停用此來源' : '啟用此來源'"
            >
              <div class="toggle-track">
                <div class="toggle-thumb"></div>
              </div>
              <span class="toggle-label">{{ source.enabled ? '啟用' : '停用' }}</span>
            </div>

            <!-- 手動同步按鈕 -->
            <button
              class="custom-btn sync-btn"
              :disabled="syncingId === source.id"
              @click="handleSync(source.id)"
            >
              <i class="material-symbols-outlined" :class="{ 'spin': syncingId === source.id }">sync</i>
              {{ syncingId === source.id ? '同步中...' : '立即同步' }}
            </button>

            <!-- 編輯 -->
            <button class="icon-btn" @click="openEditModal(source)" v-tooltip="'編輯'">
              <i class="material-symbols-outlined">edit</i>
            </button>

            <!-- 刪除 -->
            <button class="icon-btn icon-btn--danger" @click="handleDelete(source.id)" v-tooltip="'刪除'">
              <i class="material-symbols-outlined">delete</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <ApiSourceModal
      v-model="showModal"
      :source="editingSource"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { ApiSource } from '@/stores/knowledgeStore';
import ApiSourceModal from '@/components/Knowledge/ApiSourceModal.vue';
import popDialog from '@/services/popDialog';

const router = useRouter();
const knowledgeStore = useKnowledgeStore();
const { apiSources } = storeToRefs(knowledgeStore);

const showModal = ref(false);
const editingSource = ref<ApiSource | null>(null);
const syncingId = ref<string | null>(null);

const scheduleLabelMap: Record<string, string> = {
  MANUAL: '手動',
  DAILY: '每天',
  WEEKLY: '每週',
};

function openCreateModal() {
  editingSource.value = null;
  showModal.value = true;
}

function openEditModal(source: ApiSource) {
  editingSource.value = source;
  showModal.value = true;
}

function handleSave(payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>) {
  if (editingSource.value) {
    knowledgeStore.updateApiSource(editingSource.value.id, payload);
  } else {
    knowledgeStore.createApiSource(payload);
  }
}

async function handleSync(id: string) {
  syncingId.value = id;
  await knowledgeStore.triggerSync(id);
  syncingId.value = null;

  const source = apiSources.value.find(s => s.id === id);
  if (source?.lastSyncStatus === 'SUCCESS') {
    popDialog.alert(`同步成功，已建立 ${source.lastSyncCount} 筆草稿知識條目`);
  } else {
    popDialog.alert(`同步失敗：${source?.lastSyncError ?? '未知錯誤'}`);
  }
}

function handleDelete(id: string) {
  popDialog.confirm('確定要刪除此 API 來源嗎？已同步的知識條目不受影響。', () => {
    knowledgeStore.deleteApiSource(id);
  });
}
</script>
```

- [ ] **Step 2：Commit**

```bash
git add src/views/KnowledgeApiSources.vue
git commit -m "feat(knowledge): add KnowledgeApiSources page"
```

---

## Task 6：SCSS — 建立頁面樣式並註冊

**Files:**
- Create: `src/scss/views/_KnowledgeApiSources.scss`
- Modify: `src/scss/views/_index.scss`

- [ ] **Step 1：建立 `src/scss/views/_KnowledgeApiSources.scss`**

```scss
.KnowledgeApiSources {

  // ── 空狀態 ──
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;

    .empty-icon {
      font-size: 56px;
      color: var(--color-text-alpha40);
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: var(--color-text-alpha60);
      max-width: 400px;
      line-height: 1.6;
    }
  }

  // ── 列表 ──
  .api-source-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .api-source-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--color-background);
    border: 1px solid var(--color-border-alpha50);
    border-radius: 12px;
    gap: 16px;

    &:hover {
      border-color: var(--color-border-1-alpha50);
      box-shadow: 0 2px 8px rgba(from var(--color-shadow) r g b / 0.08);
    }
  }

  .source-main {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  .source-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--color-main-alpha10);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 22px;
      color: var(--color-main);
    }
  }

  .source-info {
    flex: 1;
    min-width: 0;

    .source-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
    }

    .source-url {
      font-size: 12px;
      color: var(--color-text-alpha60);
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 8px;
    }

    .source-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .meta-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    background: var(--color-background-1);
    color: var(--color-text-alpha60);
    border: 1px solid var(--color-border-alpha50);
  }

  .sync-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;

    i { font-size: 14px; }

    &--success { color: var(--color-green); }
    &--failed { color: var(--color-red); }
    &--none { color: var(--color-text-alpha40); }

    .sync-error-text {
      cursor: default;
      text-decoration: underline dotted;
    }
  }

  // ── 右側操作 ──
  .source-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  // Enable toggle
  .enable-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;

    .toggle-track {
      width: 36px;
      height: 20px;
      border-radius: 10px;
      background: var(--color-border-1-alpha50);
      position: relative;
      transition: background 0.2s ease;

      .toggle-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #fff;
        position: absolute;
        top: 3px;
        left: 3px;
        transition: left 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
    }

    .toggle-label {
      font-size: 13px;
      color: var(--color-text-alpha60);
    }

    &.is-enabled {
      .toggle-track {
        background: var(--color-main);
        .toggle-thumb { left: 19px; }
      }
      .toggle-label { color: var(--color-main); }
    }
  }

  .sync-btn {
    gap: 4px;
    white-space: nowrap;

    .spin {
      animation: spin 1s linear infinite;
    }
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--color-border-alpha50);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-alpha60);
    transition: all 0.15s ease;

    i { font-size: 18px; }

    &:hover {
      background: var(--color-background-1);
      color: var(--color-text);
    }

    &--danger:hover {
      background: rgba(var(--color-red-rgb, 220 38 38) / 0.08);
      color: var(--color-red);
      border-color: var(--color-red);
    }
  }

  // 回頁面按鈕
  .back-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--color-border-alpha50);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-alpha60);
    margin-right: 8px;
    transition: all 0.15s ease;

    &:hover {
      background: var(--color-background-1);
      color: var(--color-text);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

// ── ApiSourceModal 樣式 ──
.ApiSourceModal {

  .api-source-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);

    .required { color: var(--color-red); margin-left: 2px; }
    .form-hint { font-weight: 400; color: var(--color-text-alpha60); }
  }

  .form-error {
    font-size: 12px;
    color: var(--color-red);
  }

  .form-hint-text {
    font-size: 12px;
    color: var(--color-text-alpha60);
    line-height: 1.5;
  }

  // Method toggle
  .method-toggle {
    display: flex;
    gap: 8px;

    .method-btn {
      padding: 6px 20px;
      border-radius: 8px;
      border: 1px solid var(--color-border-alpha50);
      background: transparent;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      color: var(--color-text-alpha60);
      transition: all 0.15s ease;

      &.is-active {
        background: var(--color-main);
        border-color: var(--color-main);
        color: #fff;
      }
    }
  }

  // Key-Value Headers
  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kv-row {
    display: flex;
    gap: 8px;
    align-items: center;

    .kv-key { flex: 1; }
    .kv-value { flex: 2; }
  }

  .kv-remove-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid var(--color-border-alpha50);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-alpha60);
    flex-shrink: 0;

    i { font-size: 16px; }

    &:hover {
      background: var(--color-background-1);
      color: var(--color-red);
    }
  }

  .add-kv-btn {
    align-self: flex-start;
    font-size: 13px;
    gap: 4px;
  }

  .body-textarea {
    min-height: 100px;
    resize: vertical;
    font-family: monospace;
    font-size: 13px;
  }

  // 欄位對應
  .field-map-row {
    display: flex;
    gap: 12px;

    .field-map-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .field-map-label {
        font-size: 12px;
        color: var(--color-text-alpha60);
      }
    }
  }

  // 排程選項
  .schedule-options {
    display: flex;
    gap: 8px;

    .schedule-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid var(--color-border-alpha50);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-alpha60);
      transition: all 0.15s ease;

      input[type="radio"] { display: none; }

      i { font-size: 18px; }

      &.is-active {
        border-color: var(--color-main);
        background: var(--color-main-alpha10);
        color: var(--color-main);
      }

      &:hover:not(.is-active) {
        background: var(--color-background-1);
      }
    }
  }

  .modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
```

- [ ] **Step 2：在 `src/scss/views/_index.scss` 最末尾加入 import**

找到：
```scss
@import "./Explore";
```
在其後插入：
```scss
@import "./KnowledgeApiSources";
```

- [ ] **Step 3：Commit**

```bash
git add src/scss/views/_KnowledgeApiSources.scss src/scss/views/_index.scss
git commit -m "feat(scss): add KnowledgeApiSources and ApiSourceModal styles"
```

---

## Task 7：手動驗證

- [ ] **Step 1：啟動 dev server**

```bash
npm run dev
```

- [ ] **Step 2：驗證清單**

逐一確認：

1. **KnowledgeBase 頁**：「新增知識條目」按鈕點下後出現下拉選單，有「上傳文件」和「API 來源管理」兩個選項
2. **API 來源管理入口**：點「API 來源管理」→ 跳轉至 `/view/KnowledgeApiSources`
3. **列表顯示**：頁面顯示 2 筆假資料（商品目錄 API 成功、庫存狀態 API 失敗）
4. **新增流程**：點「新增 API 來源」→ modal 開啟 → 填入名稱、URL、欄位對應 → 點「新增來源」→ 列表新增一筆
5. **編輯流程**：點編輯按鈕 → modal 帶入現有資料 → 修改後儲存 → 列表更新
6. **手動同步**：點「立即同步」→ 按鈕顯示「同步中...」旋轉動畫 → 2 秒後顯示結果 alert
7. **啟用/停用 toggle**：點 toggle → 狀態切換
8. **刪除**：點刪除 → 確認 dialog → 刪除後列表移除
9. **POST method**：新增時選 POST → 出現 Body textarea；切回 GET → Body 消失
10. **URL 驗證**：輸入無效 URL（如 `abc`）→ 顯示錯誤訊息，儲存按鈕 disabled

- [ ] **Step 3：type-check**

```bash
npm run type-check
```

Expected: 無 error

- [ ] **Step 4：Final commit**

```bash
git add -A
git commit -m "chore: final cleanup for knowledge API source feature"
```
