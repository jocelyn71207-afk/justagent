<!-- src/components/Knowledge/ConnectApiWizard.vue -->
<template>
  <compModal
    class="ConnectApiWizard"
    v-model="isOpenModal"
    :width="560"
  >
    <template #title>
      <h4>連接自訂 API</h4>
    </template>

    <!-- 步驟指示器 -->
    <div class="wizard-step-indicator">
      <template v-for="n in 3" :key="n">
        <div :class="['step-node', stepNodeClass(n)]">
          <span v-if="currentStep > n">✓</span>
          <span v-else>{{ n }}</span>
        </div>
        <div v-if="n < 3" :class="['step-line', { 'is-done': currentStep > n }]"></div>
      </template>
    </div>

    <div class="wizard-body">
      <!-- ── Step 1：API 設定 ── -->
      <template v-if="currentStep === 1">
        <div class="form-field">
          <label class="form-label">API URL <span class="required">*</span></label>
          <input class="custom-input" v-model="form.url" placeholder="https://api.example.com/endpoint" />
          <div v-if="urlError" class="form-error">{{ urlError }}</div>
        </div>

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

        <div class="form-field">
          <label class="form-label">Authorization <span class="form-hint">（選填，如 Bearer token）</span></label>
          <input class="custom-input" v-model="form.authorization" placeholder="Bearer xxxxxxxx" />
        </div>

        <div class="form-field">
          <label class="form-label">Headers <span class="form-hint">（選填）</span></label>
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

        <div class="form-field" v-if="form.method === 'POST'">
          <label class="form-label">Request Body <span class="form-hint">（JSON 格式）</span></label>
          <textarea class="custom-input body-textarea" v-model="form.body" placeholder='{"key": "value"}'></textarea>
        </div>
      </template>

      <!-- ── Step 2：欄位對應 ── -->
      <template v-if="currentStep === 2">
        <div class="api-test-box">
          <div class="api-test-header">
            <span class="api-test-title">API 回傳預覽</span>
            <button class="custom-btn custom-main-btn" style="font-size:11px;padding:4px 12px;" @click="testApi" :disabled="isTesting">
              <i class="material-symbols-outlined" :class="{ 'spin': isTesting }">{{ isTesting ? 'sync' : 'play_arrow' }}</i>
              {{ isTesting ? '測試中...' : '測試 API' }}
            </button>
          </div>
          <pre v-if="mockResponse" class="api-response-preview"><code>{{ mockResponse }}</code></pre>
          <div v-else class="api-test-placeholder">點擊「測試 API」查看回傳資料結構</div>
        </div>

        <div class="form-field">
          <label class="form-label">回傳欄位對應 <span class="required">*</span></label>
          <div class="field-map-row">
            <div>
              <span class="field-map-label">標題欄位名稱</span>
              <input class="custom-input" v-model="form.titleField" placeholder="例：productName" />
            </div>
            <div>
              <span class="field-map-label">內容欄位名稱</span>
              <input class="custom-input" v-model="form.contentField" placeholder="例：description" />
            </div>
          </div>
          <div class="form-hint-text">對應 API 回傳 JSON 中的 key 名稱</div>
        </div>
      </template>

      <!-- ── Step 3：條目設定 ── -->
      <template v-if="currentStep === 3">
        <div class="form-field">
          <label class="form-label">知識條目名稱 <span class="required">*</span></label>
          <input class="custom-input" v-model="form.name" placeholder="例：商品目錄" />
        </div>

        <div class="form-field">
          <label class="form-label">分類</label>
          <select class="custom-input" v-model="form.category">
            <option value="">（不分類）</option>
            <option value="商品文件">商品文件</option>
            <option value="系統文件">系統文件</option>
            <option value="客服知識">客服知識</option>
            <option value="規則說明">規則說明</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">同步頻率</label>
          <div class="schedule-options">
            <label
              v-for="opt in scheduleOptions"
              :key="opt.value"
              :class="['schedule-option', { 'is-active': form.schedule === opt.value }]"
            >
              <input type="radio" :value="opt.value" v-model="form.schedule" />
              <i class="material-symbols-outlined" style="font-size:15px;">{{ opt.icon }}</i>
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div class="confirm-hint">
          ✓ 完成後將建立「{{ form.name || '（未命名）' }}」知識條目，並自動執行首次同步
        </div>
      </template>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <button class="custom-btn" v-if="currentStep > 1" @click="currentStep--">← 上一步</button>
        <span v-else></span>
        <button
          v-if="currentStep < 3"
          class="custom-btn custom-main-btn"
          :disabled="!isStepValid"
          @click="currentStep++"
        >下一步 →</button>
        <button
          v-if="currentStep === 3"
          class="custom-btn custom-main-btn"
          :disabled="!isStepValid"
          @click="handleComplete"
        >完成並同步 ✓</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import compModal from '@/components/compModal/compModal.vue';
import type { WizardPayload } from '@/stores/knowledgeStore';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'complete', payload: WizardPayload): void;
}>();

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const currentStep = ref(1);
const isTesting = ref(false);
const mockResponse = ref('');
const testApiTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const scheduleOptions = [
  { value: 'MANUAL', label: '手動', icon: 'touch_app' },
  { value: 'DAILY',  label: '每天', icon: 'today' },
  { value: 'WEEKLY', label: '每週', icon: 'date_range' },
] as const;

const defaultForm = (): WizardPayload => ({
  url: '',
  authorization: '',
  method: 'GET',
  headers: [],
  body: '',
  titleField: '',
  contentField: '',
  name: '',
  category: '',
  schedule: 'MANUAL',
});

const form = ref<WizardPayload>(defaultForm());

// 每次開啟時重置
watch(() => props.modelValue, (val) => {
  if (val) {
    if (testApiTimer.value !== null) {
      clearTimeout(testApiTimer.value);
      testApiTimer.value = null;
    }
    currentStep.value = 1;
    mockResponse.value = '';
    form.value = defaultForm();
  }
});

watch(currentStep, (next, prev) => {
  if (prev === 2 && next === 1) {
    form.value.titleField = '';
    form.value.contentField = '';
    mockResponse.value = '';
    if (testApiTimer.value !== null) {
      clearTimeout(testApiTimer.value);
      testApiTimer.value = null;
    }
  }
});

// ── 驗證 ──
const urlError = computed(() => {
  if (!form.value.url) return '';
  try {
    const parsed = new URL(form.value.url);
    if (parsed.protocol !== 'https:') return '請輸入有效的 URL（需包含 https://）';
    return '';
  } catch {
    return '請輸入有效的 URL（需包含 https://）';
  }
});

const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return !!form.value.url.trim() && !urlError.value;
  }
  if (currentStep.value === 2) {
    return !!form.value.titleField.trim() && !!form.value.contentField.trim();
  }
  return !!form.value.name.trim();
});

// ── Step 指示器 class ──
function stepNodeClass(n: number) {
  if (currentStep.value > n) return 'is-done';
  if (currentStep.value === n) return 'is-active';
  return 'is-pending';
}

// ── Headers 操作 ──
function addHeader() {
  form.value.headers.push({ key: '', value: '' });
}
function removeHeader(i: number) {
  form.value.headers.splice(i, 1);
}

// ── 測試 API（mock） ──
function testApi() {
  isTesting.value = true;
  mockResponse.value = '';
  testApiTimer.value = setTimeout(() => {
    const t = form.value.titleField || 'title';
    const c = form.value.contentField || 'content';
    mockResponse.value = JSON.stringify(
      [1, 2, 3].map(i => ({ [t]: `範例標題 ${i}`, [c]: `範例內容 ${i}...` })),
      null,
      2
    );
    isTesting.value = false;
    testApiTimer.value = null;
  }, 800);
}

// ── 完成 ──
function handleComplete() {
  if (!isStepValid.value) return;
  emit('complete', { ...form.value });
  isOpenModal.value = false;
}
</script>
