<template>
  <compModal
    v-model="props.modelValue"
    title="SharePoint 整合"
    :width="560"
    :show-close="currentStep < 4"
    @update:model-value="handleModelUpdate"
  >
    <!-- 步驟進度條 -->
    <div class="sp-steps">
      <div
        v-for="(label, i) in stepLabels"
        :key="i"
        :class="['sp-step', { 'is-done': currentStep > i + 1, 'is-active': currentStep === i + 1 }]"
      >
        <div class="sp-step-dot">
          <i v-if="currentStep > i + 1" class="material-symbols-outlined">check</i>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="sp-step-label">{{ label }}</span>
      </div>
    </div>

    <!-- Step 1: 連線中 -->
    <div v-if="currentStep === 1" class="sp-step-body sp-step-connecting">
      <i class="material-symbols-outlined sp-spinner">sync</i>
      <p class="sp-step-title">正在連接 SharePoint...</p>
      <p class="sp-step-sub">驗證服務帳號憑證</p>
    </div>

    <!-- Step 2: 掃描中 -->
    <div v-else-if="currentStep === 2" class="sp-step-body">
      <p class="sp-step-title">正在掃描檔案變更...</p>
      <div class="sp-progress-bar">
        <div class="sp-progress-fill" :style="{ width: scanProgress + '%' }"></div>
      </div>
      <p class="sp-step-sub">已掃描 {{ Math.round(scanProgress * 2.47) }} / 247 個檔案 {{ scanProgress }}%</p>
    </div>

    <!-- Step 3: 確認變更（帶 checkbox） -->
    <div v-else-if="currentStep === 3" class="sp-step-body">
      <div class="sp-step3-header">
        <p class="sp-step-title">掃描完成，請選擇要匯入的項目：</p>
        <label class="sp-select-all">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
          全選
        </label>
      </div>
      <div class="sp-diff-list">
        <label
          v-for="item in diffItems"
          :key="item.name"
          :class="['sp-diff-item', `sp-diff--${item.type}`, { 'sp-diff--unchecked': !item.selected }]"
        >
          <input type="checkbox" v-model="item.selected" class="sp-diff-checkbox" />
          <span class="sp-diff-badge">{{ typeLabelMap[item.type] }}</span>
          <span class="sp-diff-filename">{{ item.fileName }}</span>
        </label>
      </div>
      <p class="sp-select-hint">已選 {{ selectedCount }} 個項目</p>
    </div>

    <!-- Step 4: 匯入中 -->
    <div v-else-if="currentStep === 4" class="sp-step-body">
      <p class="sp-step-title">正在匯入...</p>
      <div class="sp-import-list">
        <div v-for="file in importFiles" :key="file.name" class="sp-import-item">
          <i
            class="material-symbols-outlined sp-file-icon"
            :class="{ 'sp-spinner': file.progress > 0 && file.progress < 100 }"
          >
            {{ file.progress >= 100 ? 'check_circle' : file.progress > 0 ? 'sync' : 'radio_button_unchecked' }}
          </i>
          <span class="sp-import-name">{{ file.name }}</span>
          <span class="sp-import-pct">{{ file.progress >= 100 ? '完成' : file.progress > 0 ? file.progress + '%' : '待處理' }}</span>
        </div>
      </div>
    </div>

    <!-- Footer：Step 3 才顯示確認按鈕 -->
    <template #footer>
      <div v-if="currentStep === 3" class="sp-footer-actions">
        <button class="custom-btn" @click="handleModelUpdate(false)">取消</button>
        <button
          class="custom-btn custom-main-btn"
          :disabled="selectedCount === 0"
          @click="startImport"
        >
          開始匯入 {{ selectedCount }} 筆 ▶
        </button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import compModal from '@/components/compModal/compModal.vue'

export interface SpDiffItem {
  type: 'add' | 'update' | 'delete'
  name: string
  fileName: string
  category: string
  selected: boolean
}

export interface SpCompletePayload {
  toCreate: Array<{ title: string; category: string }>
  toArchiveTitles: string[]
  syncedCount: number
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'complete', payload: SpCompletePayload): void
}>()

const typeLabelMap: Record<string, string> = { add: '新增', update: '更新', delete: '刪除' }
const stepLabels = ['連線', '掃描', '確認', '匯入']
const currentStep = ref(1)
const scanProgress = ref(0)

const diffItems = ref<SpDiffItem[]>([
  { type: 'add',    name: '外幣業務作業規範_v3.3', fileName: '外幣業務作業規範_v3.3.pdf', category: '規則說明', selected: true },
  { type: 'update', name: '貸款審核SOP_v2.1',       fileName: '貸款審核SOP_v2.1.docx',    category: '規則說明', selected: true },
  { type: 'delete', name: '2024年結存利率說明',      fileName: '2024年結存利率說明.xlsx',   category: '規則說明', selected: true },
])

const selectedCount = computed(() => diffItems.value.filter(d => d.selected).length)
const allSelected = computed(() => diffItems.value.every(d => d.selected))

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  diffItems.value.forEach(d => { d.selected = checked })
}

// importFiles is derived from the selected diff items
const importFiles = ref<Array<{ name: string; progress: number }>>([])

let scanInterval: ReturnType<typeof setInterval> | null = null

function resetState() {
  currentStep.value = 1
  scanProgress.value = 0
  diffItems.value.forEach(d => { d.selected = true })
  importFiles.value = []
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
}

function handleModelUpdate(val: boolean) {
  if (!val) {
    emit('update:modelValue', false)
    resetState()
  }
}

function startImport() {
  // Build importFiles from selected items only
  importFiles.value = diffItems.value
    .filter(d => d.selected)
    .map(d => ({ name: d.fileName, progress: 0 }))

  currentStep.value = 4

  // Simulate per-file progress with staggered timeouts
  importFiles.value.forEach((file, idx) => {
    const delay = idx * 600
    setTimeout(() => { file.progress = 40 }, delay + 200)
    setTimeout(() => { file.progress = 100 }, delay + 700)
  })

  const totalDuration = importFiles.value.length * 600 + 1000
  setTimeout(() => {
    const selected = diffItems.value.filter(d => d.selected)
    const payload: SpCompletePayload = {
      toCreate: selected
        .filter(d => d.type === 'add' || d.type === 'update')
        .map(d => ({ title: d.name, category: d.category })),
      toArchiveTitles: selected.filter(d => d.type === 'delete').map(d => d.name),
      syncedCount: selected.filter(d => d.type !== 'delete').length,
    }
    emit('complete', payload)
    emit('update:modelValue', false)
    resetState()
  }, totalDuration)
}

watch(() => props.modelValue, (val) => {
  if (!val) return
  resetState()
  setTimeout(() => {
    currentStep.value = 2
    scanInterval = setInterval(() => {
      scanProgress.value = Math.min(scanProgress.value + 3, 100)
      if (scanProgress.value >= 100) {
        clearInterval(scanInterval!)
        scanInterval = null
        setTimeout(() => { currentStep.value = 3 }, 300)
      }
    }, 80)
  }, 1500)
})
</script>
