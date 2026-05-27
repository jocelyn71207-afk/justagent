<template>
  <compModal
    class="CreateKnowledgeWizardModal"
    v-model="isOpenModal"
    :width="560"
  >
    <template #title>建立知識條目</template>

    <div class="wizard-modal-body">
      <!-- 來源類型選擇（prefillFile 時隱藏）-->
      <div class="source-type-row mb-4" v-if="!prefillFile">
        <div
          v-for="t in sourceTypes"
          :key="t.value"
          :class="['source-type-card', { 'is-active': selectedSourceType === t.value }]"
          @click="selectedSourceType = t.value"
        >
          <i class="material-symbols-outlined fs-24 mb-1">{{ t.icon }}</i>
          <div class="fs-12 fw-600">{{ t.label }}</div>
          <div class="fs-11 fc-grey-1">{{ t.desc }}</div>
        </div>
      </div>

      <!-- FILE: 已預填來源檔案（從共用檔案管理建立）-->
      <template v-if="selectedSourceType === 'FILE' && prefillFile">
        <div class="upload-dropzone mb-3 has-file" style="cursor:default;">
          <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
          <div class="fs-13 fw-600">{{ prefillFile.fileName }}</div>
          <div class="fs-12 fc-grey-1 mt-1">來自共用檔案管理</div>
        </div>
      </template>

      <!-- FILE: 已從共用庫選取 -->
      <template v-else-if="selectedSourceType === 'FILE' && selectedLibraryFile">
        <div class="upload-dropzone mb-2 has-file" style="cursor:default;">
          <i class="material-symbols-outlined fs-28 mb-1" style="color:var(--success);">task_alt</i>
          <div class="fs-13 fw-600">{{ selectedLibraryFile.fileName }}</div>
          <div class="fs-12 fc-grey-1 mt-1">來自共用檔案管理</div>
          <button
            class="fs-11 fc-grey-1 mt-2"
            style="background:none;border:none;cursor:pointer;text-decoration:underline;"
            @click="selectedLibraryFile = null"
          >更換</button>
        </div>
      </template>

      <!-- FILE: 上傳區 -->
      <template v-else-if="selectedSourceType === 'FILE'">
        <div
          class="upload-dropzone mb-2"
          :class="{ 'has-file': uploadedFile }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <template v-if="!uploadedFile">
            <i class="material-symbols-outlined fs-32 mb-2" style="color:#93c5fd;">cloud_upload</i>
            <div class="fs-13 fw-500" style="color:#2563eb;">拖曳檔案至此或點擊選取</div>
            <div class="fs-12 fc-grey-1 mt-1">支援 PDF、DOCX、XLSX，最大 50MB</div>
          </template>
          <template v-else>
            <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
            <div class="fs-13 fw-600">{{ uploadedFile.name }}</div>
            <div class="fs-12 fc-grey-1 mt-1">{{ (uploadedFile.size / 1024).toFixed(0) }} KB</div>
            <button class="fs-11 fc-grey-1 mt-2" style="background:none;border:none;cursor:pointer;text-decoration:underline;" @click.stop="uploadedFile = null">更換檔案</button>
          </template>
        </div>
        <input ref="fileInputRef" type="file" accept=".pdf,.docx,.xlsx" style="display:none;" @change="handleFileSelect" />

        <!-- 上傳提示 + 共用庫按鈕 -->
        <div class="d-flex align-items-center justify-content-center gap-1 mb-2" style="font-size:11px;color:var(--text-faint);">
          <i class="material-symbols-outlined" style="font-size:13px;">info</i>
          上傳的檔案將同時儲存至共用檔案管理
        </div>
        <div class="text-center mb-3" style="font-size:11px;color:var(--text-faint);">— 或 —</div>
        <div class="text-center mb-3">
          <button
            class="custom-btn"
            style="font-size:12px;"
            @click.stop="showResourcePicker = true"
          >
            <i class="material-symbols-outlined fs-14">folder_open</i>
            從共用檔案管理選取
          </button>
        </div>
      </template>

      <!-- API: 選來源 -->
      <template v-else-if="selectedSourceType === 'API'">
        <div class="mb-3">
          <label class="form-label">API 來源 <span style="color:#dc2626;">*</span></label>
          <select v-model="selectedApiSourceId" class="custom-input w-100">
            <option value="">選擇已設定的 API 來源...</option>
            <option v-for="s in apiSources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </template>

      <!-- MANUAL: 標題輸入 -->
      <template v-else-if="selectedSourceType === 'MANUAL'">
        <div class="mb-3">
          <label class="form-label">標題 <span style="color:#dc2626;">*</span></label>
          <input v-model="manualTitle" class="custom-input w-100" placeholder="輸入知識條目標題" />
        </div>
      </template>

      <!-- 共用：分類 + 標籤 -->
      <div class="mb-3">
        <label class="form-label">分類 <span style="color:#dc2626;">*</span></label>
        <select v-model="selectedCategory" class="custom-input w-100">
          <option value="">選擇分類...</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="form-label">標籤（選填）</label>
        <div class="tags-input-wrap">
          <span
            v-for="tag in selectedTags"
            :key="tag"
            class="tag-chip"
          >
            {{ tag }}
            <i class="material-symbols-outlined fs-13 cursor-pointer ml-1" @click="removeTag(tag)">close</i>
          </span>
          <input
            v-model="tagInput"
            class="tags-input-field"
            placeholder="輸入後按 Enter 新增"
            @keydown.enter.prevent="addTag"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="d-flex justify-content-end gap-2">
        <button class="custom-btn" @click="isOpenModal = false">取消</button>
        <button
          class="custom-btn custom-main-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i class="material-symbols-outlined">{{ (prefillFile || selectedLibraryFile) ? 'edit' : selectedSourceType === 'MANUAL' ? 'edit' : 'upload' }}</i>
          {{ (prefillFile || selectedLibraryFile) ? '建立草稿並編輯' : selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : '上傳並開始處理' }}
        </button>
      </div>
    </div>
    <ResourceFilePicker v-model="showResourcePicker" @select="onPickerSelect" />
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import compModal from '@/components/compModal/compModal.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { SourceType } from '@/stores/knowledgeStore'
import popDialog from '@/services/popDialog'
import ResourceFilePicker from '@/components/Knowledge/ResourceFilePicker.vue'
import { useResourceStore } from '@/stores/resourceStore'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created', knowledgeId: string): void
}>()
const props = defineProps<{
  modelValue: boolean
  prefillFile?: { fileId: string; fileName: string }
}>()

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const resourceStore = useResourceStore()
const { knowledgeList, apiSources } = storeToRefs(knowledgeStore)

// ── 來源類型 ──
const sourceTypes = [
  { value: 'FILE' as SourceType, label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API' as SourceType,  label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL' as SourceType, label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
]
const selectedSourceType = ref<SourceType>('FILE')

// ── FILE ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const selectedLibraryFile = ref<{ fileId: string; fileName: string } | null>(null)
const showResourcePicker = ref(false)

function onPickerSelect(file: { fileId: string; fileName: string }) {
  selectedLibraryFile.value = file
  uploadedFile.value = null
  showResourcePicker.value = false
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadedFile.value = file
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

// ── API ──
const selectedApiSourceId = ref('')

// ── MANUAL ──
const manualTitle = ref('')

// ── 共用 ──
const selectedCategory = ref('')
const categoryOptions = computed(() => [...new Set(knowledgeList.value.map(k => k.category))])

const selectedTags = ref<string[]>([])
const tagInput = ref('')

function addTag() {
  const t = tagInput.value.trim()
  if (t && !selectedTags.value.includes(t)) selectedTags.value.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

const canSubmit = computed(() => {
  if (!selectedCategory.value) return false
  if (props.prefillFile) return true
  if (selectedSourceType.value === 'FILE') return !!(uploadedFile.value || selectedLibraryFile.value)
  if (selectedSourceType.value === 'API') return !!selectedApiSourceId.value
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  return false
})

// ── 表單重置 ──
watch(isOpenModal, (open) => {
  if (!open) {
    selectedSourceType.value = 'FILE'
    uploadedFile.value = null
    selectedLibraryFile.value = null
    showResourcePicker.value = false
    selectedApiSourceId.value = ''
    manualTitle.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    tagInput.value = ''
  }
})

// ── 送出 ──
function handleSubmit() {
  if (!canSubmit.value) return

  if (props.prefillFile) {
    const { knowledgeId, versionId } = knowledgeStore.createFromFile({
      fileId: props.prefillFile.fileId,
      fileName: props.prefillFile.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })
    isOpenModal.value = false
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
    return
  }

  if (selectedSourceType.value === 'MANUAL') {
    const { knowledgeId, versionId } = knowledgeStore.createManualDraft({
      title: manualTitle.value.trim(),
      category: selectedCategory.value,
      tags: selectedTags.value,
    })
    isOpenModal.value = false
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
    return
  }

  if (selectedSourceType.value === 'FILE') {
    const isFromLibrary = !!selectedLibraryFile.value
    const fileRef = isFromLibrary
      ? { fileId: selectedLibraryFile.value!.fileId, fileName: selectedLibraryFile.value!.fileName }
      : (() => {
          const saved = resourceStore.addFileFromUpload(uploadedFile.value!)
          return { fileId: saved.id, fileName: saved.fileName }
        })()

    const { knowledgeId, versionId } = knowledgeStore.createFromFile({
      fileId: fileRef.fileId,
      fileName: fileRef.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })

    const toastMsg = isFromLibrary
      ? '已建立知識條目草稿'
      : '檔案已儲存至共用檔案管理，知識條目草稿已建立'

    isOpenModal.value = false
    popDialog.toast(toastMsg, 3000)
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
    return
  }

  if (selectedSourceType.value === 'API') {
    const source = apiSources.value.find(s => s.id === selectedApiSourceId.value)
    if (!source) return
    const id = knowledgeStore.createKnowledgeFromApiSource({
      apiSourceId: source.id,
      apiSourceName: source.name,
      name: source.name,
      category: selectedCategory.value,
    })
    isOpenModal.value = false
    emit('created', id)
    popDialog.toast('API 來源已建立，Pipeline 處理中…', 3000)
    simulatePipeline(id)
  }
}

function simulatePipeline(id: string) {
  const stages: Array<{ stage: 'chunking' | 'embedding' | 'indexing'; startPct: number; delay: number }> = [
    { stage: 'chunking',   startPct: 0,   delay: 0    },
    { stage: 'embedding',  startPct: 33,  delay: 1500 },
    { stage: 'indexing',   startPct: 67,  delay: 3500 },
  ]

  stages.forEach(({ stage, startPct, delay }) => {
    setTimeout(() => knowledgeStore.updatePipelineProgress(id, stage, startPct), delay)
  })

  setTimeout(() => {
    knowledgeStore.markPipelineDone(id, [
      { index: 1, content: '（Pipeline 完成，實際分段由後端提供）', tokenCount: 0 },
    ])
    popDialog.toast('Pipeline 處理完成！可前往編輯草稿', 3000)
  }, 4500)
}
</script>
