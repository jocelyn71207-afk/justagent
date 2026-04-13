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
