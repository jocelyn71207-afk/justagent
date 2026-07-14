<template>
  <compModal
    class="ConnectApiWizard EditApiSourceModal"
    v-model="isOpenModal"
    :width="580"
  >
    <template #title>API 來源設定</template>

    <div class="wizard-body edit-form-body">

      <!-- 名稱 -->
      <div class="form-field">
        <label class="form-label">名稱 <span class="required">*</span></label>
        <input class="custom-input w-100" v-model="form.name" placeholder="例：商品目錄 API" />
      </div>

      <!-- URL -->
      <div class="form-field">
        <label class="form-label">API URL <span class="required">*</span></label>
        <input class="custom-input w-100" v-model="form.url" placeholder="https://api.example.com/endpoint" />
        <div v-if="urlError" class="form-error">{{ urlError }}</div>
      </div>

      <!-- Method -->
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
        <label class="form-label">Headers <span class="form-hint">（選填）</span></label>
        <div class="kv-list">
          <div class="kv-row" v-for="(h, i) in form.headers" :key="i">
            <input class="custom-input kv-key" v-model="h.key" placeholder="Key" />
            <input class="custom-input kv-value" v-model="h.value" placeholder="Value" />
            <button class="kv-remove-btn" @click="removeHeader(i)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <button class="custom-btn add-kv-btn" @click="addHeader">
            <i class="material-symbols-outlined">add</i>新增 Header
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="form-field" v-if="form.method === 'POST'">
        <label class="form-label">Request Body <span class="form-hint">（JSON 格式）</span></label>
        <textarea class="custom-input body-textarea w-100" v-model="form.body" placeholder='{"key": "value"}'></textarea>
      </div>

      <!-- 欄位對應 -->
      <div class="form-field">
        <label class="form-label">回傳欄位對應 <span class="required">*</span></label>
        <div class="field-map-row">
          <div>
            <span class="field-map-label">標題欄位名稱</span>
            <input class="custom-input w-100" v-model="form.titleField" placeholder="例：productName" />
          </div>
          <div>
            <span class="field-map-label">內容欄位名稱</span>
            <input class="custom-input w-100" v-model="form.contentField" placeholder="例：description" />
          </div>
        </div>
        <div class="form-hint-text">對應 API 回傳 JSON 中的 key 名稱</div>
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
            <i class="material-symbols-outlined" style="font-size:15px;">{{ opt.icon }}</i>
            {{ opt.label }}
          </label>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <button class="edit-delete-btn" @click="handleDelete">
          <i class="material-symbols-outlined">delete</i>
          刪除此來源
        </button>
        <div class="d-flex gap-2">
          <button class="custom-btn no-border" @click="isOpenModal = false">取消</button>
          <button
            class="custom-btn custom-main-btn"
            :disabled="!isValid"
            @click="handleSave"
          >
            <i class="material-symbols-outlined">save</i>儲存設定
          </button>
        </div>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import compModal from '@/components/compModal/compModal.vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { ApiSourceHeader } from '@/stores/knowledgeStore';
import popDialog from '@/services/popDialog';

const props = defineProps<{
  modelValue: boolean;
  sourceId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'deleted'): void;
}>();

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const knowledgeStore = useKnowledgeStore();

const scheduleOptions = [
  { value: 'MANUAL', label: '手動', icon: 'touch_app' },
  { value: 'DAILY',  label: '每天', icon: 'today' },
  { value: 'WEEKLY', label: '每週', icon: 'date_range' },
] as const;

interface EditForm {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: ApiSourceHeader[];
  body: string;
  titleField: string;
  contentField: string;
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY';
}

const form = ref<EditForm>({
  name: '', url: '', method: 'GET', headers: [],
  body: '', titleField: '', contentField: '', schedule: 'MANUAL',
});

watch(() => props.modelValue, (open) => {
  if (!open) return;
  const source = knowledgeStore.apiSources.find(s => s.id === props.sourceId);
  if (!source) return;
  form.value = {
    name: source.name,
    url: source.url,
    method: source.method,
    headers: source.headers.map(h => ({ ...h })),
    body: source.body,
    titleField: source.titleField,
    contentField: source.contentField,
    schedule: source.schedule,
  };
});

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

const isValid = computed(() =>
  !!form.value.name.trim() &&
  !!form.value.url.trim() &&
  !urlError.value &&
  !!form.value.titleField.trim() &&
  !!form.value.contentField.trim()
);

function addHeader() {
  form.value.headers.push({ key: '', value: '' });
}

function removeHeader(i: number) {
  form.value.headers.splice(i, 1);
}

function handleSave() {
  if (!isValid.value) return;
  knowledgeStore.updateApiSource(props.sourceId, { ...form.value });
  isOpenModal.value = false;
  popDialog.toast('設定已儲存', 1500);
}

function handleDelete() {
  popDialog.confirm(
    '<div class="text-center"><div class="fs-18 fw-600 mb-1">確定刪除此 API 來源？</div><div class="fs-14 fc-grey-1">關聯的知識條目將不受影響，但後續不會再同步。</div></div>',
    () => {
      knowledgeStore.deleteApiSource(props.sourceId);
      isOpenModal.value = false;
      emit('deleted');
      popDialog.toast('已刪除 API 來源', 1800);
    }
  );
}
</script>
