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

    <!-- Step 3: 確認變更 -->
    <div v-else-if="currentStep === 3" class="sp-step-body">
      <p class="sp-step-title">掃描完成，偵測到以下變更：</p>
      <div class="sp-diff-list">
        <div class="sp-diff-item sp-diff--add">
          <span class="sp-diff-badge">新增</span>
          <span>外幣業務作業規範_v3.3.pdf</span>
        </div>
        <div class="sp-diff-item sp-diff--update">
          <span class="sp-diff-badge">更新</span>
          <span>貸款審核SOP_v2.1.docx</span>
        </div>
        <div class="sp-diff-item sp-diff--delete">
          <span class="sp-diff-badge">刪除</span>
          <span>2024年結存利率說明.xlsx</span>
        </div>
      </div>
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
        <button class="custom-btn custom-main-btn" @click="startImport">開始匯入 ▶</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import compModal from '@/components/compModal/compModal.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'complete'): void
}>()

const stepLabels = ['連線', '掃描', '確認', '匯入']
const currentStep = ref(1)
const scanProgress = ref(0)

const importFiles = ref([
  { name: '外幣業務作業規範_v3.3.pdf', progress: 0 },
  { name: '貸款審核SOP_v2.1.docx', progress: 0 },
  { name: '2024年結存利率說明.xlsx（刪除）', progress: 0 },
])

let scanInterval: ReturnType<typeof setInterval> | null = null

function resetState() {
  currentStep.value = 1
  scanProgress.value = 0
  importFiles.value.forEach(f => { f.progress = 0 })
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
}

function handleModelUpdate(val: boolean) {
  if (!val) {
    emit('update:modelValue', false)
    resetState()
  }
}

function startImport() {
  currentStep.value = 4
  setTimeout(() => { importFiles.value[0].progress = 50 }, 300)
  setTimeout(() => { importFiles.value[0].progress = 100 }, 800)
  setTimeout(() => { importFiles.value[1].progress = 30 }, 500)
  setTimeout(() => { importFiles.value[1].progress = 70 }, 1000)
  setTimeout(() => { importFiles.value[1].progress = 100 }, 1500)
  setTimeout(() => { importFiles.value[2].progress = 100 }, 500)
  setTimeout(() => {
    emit('complete')
    emit('update:modelValue', false)
    resetState()
  }, 3500)
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
