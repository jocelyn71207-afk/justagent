<!-- src/components/Knowledge/NotionConnectSteps.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { NotionConfig } from '@/stores/integrationStore'

const props = defineProps<{
  step: 2 | 3 | 4
}>()

const emit = defineEmits<{
  'update:config': [config: Partial<NotionConfig> & { name?: string; schedule?: 'MANUAL' | 'DAILY' | 'WEEKLY' }]
  validated: [valid: boolean]
}>()

// Step 2 state
const apiKey = ref('')
const databaseId = ref('')
const testStatus = ref<'idle' | 'testing' | 'success' | 'failed'>('idle')
const testMessage = ref('')

// Step 3 state
const titleProp = ref('Name')
const categoryProp = ref('')
const tagsProp = ref('')

// Step 4 state
const integrationName = ref('Notion 知識庫')
const defaultCategory = ref('商品文件')
const schedule = ref<'MANUAL' | 'DAILY' | 'WEEKLY'>('DAILY')

const mockProperties = ['Name', 'Title', 'Category', 'Tags', 'Status', 'Description']

function testConnection() {
  if (!apiKey.value || !databaseId.value) return
  testStatus.value = 'testing'
  setTimeout(() => {
    testStatus.value = 'success'
    testMessage.value = '連線成功 — 已找到 Database「' + integrationName.value + '」（共 24 筆資料）'
    emit('validated', true)
    emit('update:config', { apiKey: apiKey.value, databaseId: databaseId.value, includePageBody: true })
  }, 1000)
}

const step2Valid = computed(() => testStatus.value === 'success')
const step3Valid = computed(() => titleProp.value.length > 0)
const step4Valid = computed(() => integrationName.value.length > 0)

function emitStep3() {
  emit('update:config', {
    titleProp: titleProp.value,
    categoryProp: categoryProp.value || undefined,
    tagsProp: tagsProp.value || undefined,
  })
  emit('validated', step3Valid.value)
}

function emitStep4() {
  emit('update:config', {
    defaultCategory: defaultCategory.value,
    name: integrationName.value,
    schedule: schedule.value,
  })
  emit('validated', step4Valid.value)
}
</script>

<template>
  <!-- Step 2: 連線驗證 -->
  <div v-if="step === 2" class="notion-steps">
    <div class="notion-steps__tip">
      ℹ 在 Notion 設定 → 整合功能 建立 Internal Integration，複製 Token 後貼入下方
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">Integration Token <span class="notion-steps__required">*</span></label>
      <input
        v-model="apiKey"
        class="notion-steps__input"
        placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
        type="password"
        @input="testStatus = 'idle'"
      />
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">Database ID <span class="notion-steps__required">*</span></label>
      <input
        v-model="databaseId"
        class="notion-steps__input"
        placeholder="1a2b3c4d-5e6f-7890-abcd-ef1234567890"
        @input="testStatus = 'idle'"
      />
      <p class="notion-steps__hint">從 Notion Database 頁面 URL 複製</p>
    </div>
    <button
      class="notion-steps__test-btn"
      :disabled="!apiKey || !databaseId || testStatus === 'testing'"
      @click="testConnection"
    >
      {{ testStatus === 'testing' ? '測試中...' : '測試連線' }}
    </button>
    <div v-if="testStatus === 'success'" class="notion-steps__success">✅ {{ testMessage }}</div>
    <div v-if="testStatus === 'failed'" class="notion-steps__error">❌ 連線失敗，請確認 Token 和 Database ID 是否正確</div>
  </div>

  <!-- Step 3: 欄位對應 -->
  <div v-else-if="step === 3" class="notion-steps">
    <p class="notion-steps__desc">將 Notion Database 欄位對應至知識條目欄位：</p>
    <div class="notion-steps__mapping">
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">標題 <span class="notion-steps__required">*</span></span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="titleProp" class="notion-steps__select" @change="emitStep3">
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">內容</span>
        <span class="notion-steps__arrow">→</span>
        <span class="notion-steps__fixed">📄 頁面內文（自動）</span>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">分類</span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="categoryProp" class="notion-steps__select" @change="emitStep3">
          <option value="">（不對應）</option>
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">標籤</span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="tagsProp" class="notion-steps__select" @change="emitStep3">
          <option value="">（不對應）</option>
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
    </div>
    <div class="notion-steps__info">ℹ 內容欄位固定使用 Page Body（blocks 轉 Markdown）</div>
  </div>

  <!-- Step 4: 同步設定 -->
  <div v-else-if="step === 4" class="notion-steps">
    <div class="notion-steps__field">
      <label class="notion-steps__label">整合名稱 <span class="notion-steps__required">*</span></label>
      <input v-model="integrationName" class="notion-steps__input" @input="emitStep4" />
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">預設知識分類</label>
      <select v-model="defaultCategory" class="notion-steps__select" @change="emitStep4">
        <option>商品文件</option>
        <option>客服知識</option>
        <option>規則說明</option>
        <option>系統文件</option>
      </select>
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">自動同步頻率</label>
      <div class="notion-steps__schedule">
        <button
          v-for="opt in [{ val: 'MANUAL', label: '手動' }, { val: 'DAILY', label: '每日' }, { val: 'WEEKLY', label: '每週' }]"
          :key="opt.val"
          class="notion-steps__schedule-btn"
          :class="{ 'notion-steps__schedule-btn--active': schedule === opt.val }"
          @click="schedule = opt.val as 'MANUAL' | 'DAILY' | 'WEEKLY'; emitStep4()"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div class="notion-steps__info">完成後將立即執行首次同步</div>
  </div>
</template>
