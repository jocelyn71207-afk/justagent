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

      <!-- JUSTKA: 選機器人 -->
      <template v-else-if="selectedSourceType === 'JUSTKA'">
        <div class="mb-3">
          <label class="form-label">JustKa 機器人 <span style="color:#dc2626;">*</span></label>
          <select v-model="selectedJustkaBot" class="custom-input w-100">
            <option value="">選擇機器人...</option>
            <option v-for="b in JUSTKA_BOTS" :key="b.id" :value="b.id">
              {{ b.name }}（{{ b.cardCount }} 題卡）
            </option>
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
          <i class="material-symbols-outlined">{{ selectedSourceType === 'MANUAL' ? 'edit' : selectedSourceType === 'FILE' ? 'auto_awesome' : selectedSourceType === 'JUSTKA' ? 'auto_awesome' : 'upload' }}</i>
          {{ selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : selectedSourceType === 'FILE' ? '建立並 AI 生成內容' : selectedSourceType === 'JUSTKA' ? '匯入並 AI 整理題庫' : '上傳並開始處理' }}
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
  (e: 'done', payload: { fileId: string; knowledgeId: string }): void
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
  { value: 'FILE' as SourceType,   label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API' as SourceType,    label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL' as SourceType, label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
  { value: 'JUSTKA' as SourceType, label: 'JustKa',   icon: 'smart_toy',   desc: '匯入機器人題庫' },
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

// ── JUSTKA ──
const JUSTKA_BOTS = [
  { id: 'bot-1', name: '客服機器人',       cardCount: 48 },
  { id: 'bot-2', name: '銷售諮詢機器人',   cardCount: 32 },
  { id: 'bot-3', name: '退換貨處理機器人', cardCount: 24 },
] as const
const selectedJustkaBot = ref('')

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
  if (selectedSourceType.value === 'JUSTKA') return !!selectedJustkaBot.value
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
    selectedJustkaBot.value = ''
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
    const { knowledgeId } = knowledgeStore.createFromFile({
      fileId: props.prefillFile.fileId,
      fileName: props.prefillFile.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })
    emit('done', { fileId: props.prefillFile.fileId, knowledgeId })
    isOpenModal.value = false
    popDialog.toast('AI 正在解析檔案並生成知識內容…', 3000)
    simulateFileAiGeneration(knowledgeId, props.prefillFile.fileName)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
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

    const { knowledgeId } = knowledgeStore.createFromFile({
      fileId: fileRef.fileId,
      fileName: fileRef.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })

    const toastMsg = isFromLibrary
      ? 'AI 正在解析檔案並生成知識內容…'
      : '檔案已儲存至共用檔案管理，AI 正在解析並生成知識內容…'

    emit('done', { fileId: fileRef.fileId, knowledgeId })
    isOpenModal.value = false
    popDialog.toast(toastMsg, 3000)
    simulateFileAiGeneration(knowledgeId, fileRef.fileName)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
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
    return
  }

  if (selectedSourceType.value === 'JUSTKA') {
    const bot = JUSTKA_BOTS.find(b => b.id === selectedJustkaBot.value)
    if (!bot) return
    const { knowledgeId } = knowledgeStore.createFromJustka({
      botId: bot.id,
      botName: bot.name,
      cardCount: bot.cardCount,
      category: selectedCategory.value,
    })
    isOpenModal.value = false
    popDialog.toast('AI 正在整理題庫內容…', 3000)
    simulateJustkaGeneration(knowledgeId, bot)
    emit('created', knowledgeId)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
    return
  }
}

// 向量化：可結構化萃取（表格/純文字/markdown）
const VECTORIZABLE_EXTS = new Set(['xlsx','xls','csv','md','txt','html','htm'])
// 非向量化：以 Q&A 方式解析（pdf/word/ppt/圖片）
const NON_VECTORIZABLE_EXTS = new Set(['pdf','docx','doc','pptx','ppt','png','jpg','jpeg','gif','webp'])

function getFileExt(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}
function isVectorizable(fileName: string): boolean {
  return VECTORIZABLE_EXTS.has(getFileExt(fileName))
}

function generateStructuredContent(baseName: string, ext: string): { content: string; chunks: Array<{index:number;content:string;tokenCount:number}> } {
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    const chunks = [
      { index: 1, content: `${baseName} — 表頭列：欄位定義與說明`, tokenCount: 98 },
      { index: 2, content: `${baseName} — 資料列 1–10：主要資料內容`, tokenCount: 312 },
      { index: 3, content: `${baseName} — 資料列 11–20：補充資料`, tokenCount: 287 },
    ]
    const content = [
      `## ${baseName}`,
      ``,
      `> AI 已完成試算表解析，以下為結構化資料預覽。`,
      ``,
      `| 品號 | 品名 | 規格 | 庫存量 | 單價 |`,
      `| --- | --- | --- | ---: | ---: |`,
      `| A001 | 商品 A | M / 黑色 | 120 | $299 |`,
      `| A002 | 商品 B | L / 白色 | 85 | $399 |`,
      `| A003 | 商品 C | S / 藍色 | 204 | $199 |`,
      `| A004 | 商品 D | XL / 米色 | 47 | $499 |`,
      ``,
      `**共解析 ${chunks.reduce((s,c)=>s+c.tokenCount,0)} tokens，${chunks.length} 段。**`,
    ].join('\n')
    return { content, chunks }
  }

  if (ext === 'md') {
    const chunks = [
      { index: 1, content: `${baseName} — 標題與簡介`, tokenCount: 134 },
      { index: 2, content: `${baseName} — 主體段落`, tokenCount: 298 },
      { index: 3, content: `${baseName} — 結尾與參考資料`, tokenCount: 167 },
    ]
    const content = [
      `## ${baseName}`,
      ``,
      `> AI 已解析 Markdown 文件，以下為原始格式內容。`,
      ``,
      `### 一、背景說明`,
      ``,
      `本文件由 AI 自動解析，呈現原始 Markdown 結構與重點段落。`,
      ``,
      `### 二、主要內容`,
      ``,
      `- **項目 A**：說明文字，涵蓋核心定義與適用範疇。`,
      `- **項目 B**：補充細節，包含數值、條件或流程描述。`,
      `- **項目 C**：注意事項與例外情況處理原則。`,
      ``,
      `### 三、參考資料`,
      ``,
      `相關文件連結與引用出處於此列出。`,
    ].join('\n')
    return { content, chunks }
  }

  // txt / html / other vectorizable
  const chunks = [
    { index: 1, content: `${baseName} — 第 1 段：開頭摘要`, tokenCount: 210 },
    { index: 2, content: `${baseName} — 第 2 段：主要內容`, tokenCount: 334 },
    { index: 3, content: `${baseName} — 第 3 段：結語與補充`, tokenCount: 176 },
  ]
  const content = [
    `## ${baseName}`,
    ``,
    `> AI 已完成純文字解析。`,
    ``,
    `### 段落摘要`,
    ``,
    `| 段落 | 主題 | 內容摘要 | Token 數 |`,
    `| --- | --- | --- | ---: |`,
    ...chunks.map(c => `| ${c.index} | 第 ${c.index} 段 | ${c.content.replace(/\|/g, '｜')} | ${c.tokenCount} |`),
    ``,
    `**共解析 ${chunks.reduce((s,c)=>s+c.tokenCount,0)} tokens。**`,
  ].join('\n')
  return { content, chunks }
}

function simulateFileAiGeneration(id: string, fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const stages: Array<{ stage: 'chunking' | 'embedding' | 'indexing'; startPct: number; delay: number }> = [
    { stage: 'chunking',  startPct: 0,  delay: 0    },
    { stage: 'embedding', startPct: 33, delay: 1500 },
    { stage: 'indexing',  startPct: 67, delay: 3500 },
  ]
  stages.forEach(({ stage, startPct, delay }) => {
    setTimeout(() => knowledgeStore.updatePipelineProgress(id, stage, startPct), delay)
  })
  setTimeout(() => {
    let aiContent: string
    let chunks: Array<{ index: number; content: string; tokenCount: number }>
    const ext = getFileExt(fileName)

    if (isVectorizable(fileName)) {
      const result = generateStructuredContent(baseName, ext)
      aiContent = result.content
      chunks = result.chunks
    } else {
      // Q&A for pdf / word / ppt / images
      chunks = [
        { index: 1, content: `Q: 這份檔案的主要用途是什麼？\nA: 根據 AI 解析，此檔案主要用於視覺呈現與設計參考，內容包含品牌相關的圖像素材。`, tokenCount: 142 },
        { index: 2, content: `Q: 檔案中有哪些可識別的關鍵元素？\nA: AI 識別到畫面中包含主視覺圖像、配色方案與版面構圖等設計要素。`, tokenCount: 118 },
        { index: 3, content: `Q: 此檔案適合用在哪些場景？\nA: 適合用於行銷素材製作、簡報配圖、網站視覺或社群媒體等使用場景。`, tokenCount: 107 },
      ]
      aiContent = [
        `## ${baseName} — AI 解析`,
        ``,
        `> 此格式由 AI 進行語意理解，以 Q&A 方式整理重點；原始檔案可透過「來源附件」查看原檔。`,
        ``,
        `**Q1: 這份檔案的主要用途是什麼？**`,
        ``,
        `A: 根據 AI 解析，此檔案主要用於視覺呈現與設計參考，內容包含品牌相關的圖像素材。`,
        ``,
        `**Q2: 檔案中有哪些可識別的關鍵元素？**`,
        ``,
        `A: AI 識別到畫面中包含主視覺圖像、配色方案與版面構圖等設計要素。`,
        ``,
        `**Q3: 此檔案適合用在哪些場景？**`,
        ``,
        `A: 適合用於行銷素材製作、簡報配圖、網站視覺或社群媒體等使用場景。`,
      ].join('\n')
    }

    knowledgeStore.markPipelineDone(id, chunks, aiContent)
    popDialog.toast('AI 內容生成完成，可前往審閱草稿', 3000)
  }, 4500)
}

function simulateJustkaGeneration(id: string, bot: { id: string; name: string; cardCount: number }) {
  const stages: Array<{ stage: 'chunking' | 'embedding' | 'indexing'; startPct: number; delay: number }> = [
    { stage: 'chunking',  startPct: 0,  delay: 0    },
    { stage: 'embedding', startPct: 33, delay: 1500 },
    { stage: 'indexing',  startPct: 67, delay: 3500 },
  ]
  stages.forEach(({ stage, startPct, delay }) => {
    setTimeout(() => knowledgeStore.updatePipelineProgress(id, stage, startPct), delay)
  })
  setTimeout(() => {
    const aiContent = [
      `## ${bot.name} — 題庫知識`,
      ``,
      `> AI 已整理 ${bot.cardCount} 張題卡，以下為結構化 Q&A 內容。`,
      ``,
      `| # | 問題 | 參考答案 |`,
      `| --- | --- | --- |`,
      `| 1 | 如何查詢訂單狀態？ | 可至官網會員中心查詢，或提供訂單編號由客服協助確認。 |`,
      `| 2 | 退貨流程為何？ | 請於購買後 7 天內聯繫客服，提供訂單編號與退貨原因，我們將於 3 個工作天內處理。 |`,
      `| 3 | 商品保固期多久？ | 依商品類型不同，一般為購買日起 1 年內，詳情請參閱商品說明頁。 |`,
      `| 4 | 如何修改訂單資訊？ | 訂單成立後 2 小時內可聯繫客服修改；超過時效請於收到商品後辦理換貨。 |`,
      `| … | … | … |`,
      ``,
      `**共整理 ${bot.cardCount} 題，可於「分段預覽」查看完整題卡。**`,
    ].join('\n')
    const chunks = Array.from({ length: 4 }, (_, i) => ({
      index: i + 1,
      content: `${bot.name} — Q&A 第 ${i + 1} 批（共 ${Math.ceil(bot.cardCount / 4)} 題）`,
      tokenCount: Math.floor(bot.cardCount * 8 / 4),
    }))
    knowledgeStore.markPipelineDone(id, chunks, aiContent)
    popDialog.toast('AI 整理完成，可前往審閱草稿', 3000)
  }, 4500)
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
