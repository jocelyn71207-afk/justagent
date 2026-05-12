<template>
  <div class="KnowledgeBase KnowledgeDetail views-page">
    <AppSkeleton v-if="isLoading" type="detail" class="p-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <div class="views-page-content-box" v-else-if="knowledge">

      <!-- Header -->
      <div class="page-banner">
        <AppBreadcrumb />
        <div class="banner-title">{{ activeVer?.title ?? knowledge.title }}</div>
      </div>

      <div class="views-page-header">
        <span class="category-tag">{{ knowledge.category }}</span>
        <div class="header-right-box">
          <template v-if="knowledge.status === 'active'">
            <button class="custom-btn custom-main-btn" @click="isCreateVersionOpen = true">
              <i class="material-symbols-outlined">add_box</i>建立新版本
            </button>
          </template>
          <template v-else-if="knowledge.status === 'reviewing'">
            <button class="custom-btn ml-2" @click="handleWithdraw">
              <i class="material-symbols-outlined">undo</i>撤回審核
            </button>
            <button class="custom-btn custom-main-btn ml-2" @click="isReviewDrawerOpen = true">
              <i class="material-symbols-outlined">rate_review</i>開始審核
            </button>
          </template>
          <template v-else-if="draftVersion">
            <button class="custom-btn custom-main-btn" @click="goToEditor">
              <i class="material-symbols-outlined">edit</i>繼續編輯草稿
            </button>
          </template>
          <template v-else-if="knowledge.status === 'needs_update' || knowledge.status === 'failed'">
            <button class="custom-btn custom-main-btn" @click="knowledgeStore.retriggerPipeline(props.id)">
              <i class="material-symbols-outlined">refresh</i>重新觸發 Pipeline
            </button>
          </template>
          <template v-else-if="knowledge.status === 'processing' || knowledge.status === 'pending'">
            <span class="fc-grey-1 fs-13">
              <i class="material-symbols-outlined fs-16" style="vertical-align:middle;">sync</i>
              處理中，請稍候
            </span>
          </template>
        </div>
      </div>

      <!-- 4 Tabs -->
      <div class="detail-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['detail-tab-btn', { 'is-active': activeTabKey === tab.key }]"
          @click="activeTabKey = tab.key"
        >{{ tab.label }}</button>
      </div>

      <!-- Tab 1: 概覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">
        <div class="detail-overview-grid">
          <!-- 左：內容預覽 -->
          <div>
            <div class="content-preview">
              <div class="article-title">{{ activeVer?.title }}</div>
              <div class="article-meta">
                <span class="fc-grey-1">摘要：{{ activeVer?.summary || '（無摘要）' }}</span>
              </div>
              <div class="article-body">
                <div class="markdown-body" v-html="renderedContent"></div>
              </div>
            </div>
            <!-- 來源附件 -->
            <div class="mt-4 pt-4 border-top">
              <h6 class="fs-14 fw-600 mb-2">
                <i class="material-symbols-outlined fs-16 mr-1" style="vertical-align:middle;">attachment</i>
                來源附件
              </h6>
              <div class="d-flex flex-wrap gap-2" v-if="activeVer?.sourceFiles?.length">
                <div
                  v-for="f in activeVer.sourceFiles"
                  :key="f.fileId"
                  class="category-tag d-flex align-items-center px-3 py-2 fs-13"
                  style="border-radius:8px;cursor:pointer;"
                >
                  <i class="material-symbols-outlined fs-15 mr-1">description</i>
                  {{ f.fileName }}
                </div>
              </div>
              <div v-else class="fc-grey-1 fs-13">尚未關聯任何來源檔案</div>
            </div>
          </div>

          <!-- 右：Meta 卡片 -->
          <div class="d-flex flex-column gap-3">
            <!-- 版本資訊 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">版本資訊</div>
              <div class="d-flex gap-2 align-items-center mb-2">
                <span class="version-badge" :class="{ major: activeVer?.versionNumber?.endsWith('.0') }">
                  {{ activeVer?.versionNumber }}
                </span>
                <span :class="['status-badge', `status-badge--${activeVer?.status}`]">
                  {{ statusLabelMap[activeVer?.status ?? ''] }}
                </span>
                <span v-if="activeVer?.versionType" class="tag-chip">{{ activeVer.versionType }}</span>
              </div>
              <div class="fc-grey-1 fs-13">最後更新：{{ activeVer?.lastUpdateTime }}</div>
              <div class="fc-grey-1 fs-13">更新人：{{ activeVer?.lastUpdateBy }}</div>
              <div v-if="activeVer?.updateNote" class="fc-grey-1 fs-13 mt-1">{{ activeVer.updateNote }}</div>
            </div>
            <!-- 標籤 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">標籤</div>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="tag in activeVer?.tags"
                  :key="tag"
                  :class="['tag-chip', { 'tag-chip--system': activeVer?.systemTags?.includes(tag) }]"
                >
                  <i v-if="activeVer?.systemTags?.includes(tag)" class="material-symbols-outlined fs-11 mr-1">smart_toy</i>
                  {{ tag }}
                </span>
                <span v-if="!activeVer?.tags?.length" class="fc-grey-1 fs-13">無標籤</span>
              </div>
              <div v-if="activeVer?.systemTags?.length" class="fc-grey-1 fs-11 mt-1">綠色為系統自動標記</div>
            </div>
            <!-- Pipeline 狀態 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">Pipeline 狀態</div>
              <template v-if="knowledge.status === 'processing'">
                <div class="pipeline-progress-wrap mb-2">
                  <div class="pipeline-progress-bar" style="width:120px;">
                    <div class="pipeline-progress-fill" :style="{ width: knowledge.pipelineProgress + '%' }"></div>
                  </div>
                  <span class="pipeline-stage-label">{{ knowledge.pipelineStage }} {{ knowledge.pipelineProgress }}%</span>
                </div>
              </template>
              <template v-else>
                <div class="pipeline-stages">
                  <span class="pipeline-stage-badge is-done">✓ chunking</span>
                  <span class="pipeline-stage-badge is-done">✓ embedding</span>
                  <span class="pipeline-stage-badge is-done">✓ indexing</span>
                </div>
              </template>
              <div v-if="knowledge.pipelineError" class="fs-12 mt-2" style="color: var(--color-danger, #dc2626);">
                {{ knowledge.pipelineError }}
              </div>
            </div>
            <!-- 分類 -->
            <div class="detail-header-card">
              <div class="info-label mb-1">分類</div>
              <div>{{ knowledge.category }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: 版本歷程 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fc-grey-1 fs-13">共 {{ knowledge.versions.length }} 個版本</div>
        </div>
        <div class="version-timeline">
          <div
            v-for="(ver, idx) in [...knowledge.versions].reverse()"
            :key="ver.id"
            class="version-timeline-item"
          >
            <div class="version-timeline-node">
              <div :class="['node-dot', { 'is-active': ver.status === 'active' }]"></div>
              <div v-if="idx < knowledge.versions.length - 1" class="node-line"></div>
            </div>
            <div class="version-timeline-body">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex gap-2 align-items-center">
                  <span class="fw-600 fs-14">{{ ver.versionNumber }}</span>
                  <span :class="['status-badge', `status-badge--${ver.status}`]">{{ statusLabelMap[ver.status] }}</span>
                  <span v-if="ver.versionType" class="tag-chip">{{ ver.versionType }}</span>
                </div>
                <span class="fc-grey-1 fs-13">{{ ver.lastUpdateTime }}</span>
              </div>
              <div class="fc-grey-1 fs-13">{{ ver.updateNote }} ・ {{ ver.lastUpdateBy }}</div>
              <div v-if="ver.status === 'history'" class="d-flex gap-2 mt-2">
                <button class="custom-btn fs-12 py-1 px-2" @click="openRestore(ver.id)">
                  <i class="material-symbols-outlined fs-14">restore</i>還原為草稿
                </button>
                <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                  <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: 分段預覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
        <template v-if="activeVer?.chunks?.length">
          <div class="fc-grey-1 fs-13 mb-3">共 {{ activeVer.chunks.length }} 個 Chunk</div>
          <div
            v-for="chunk in activeVer.chunks"
            :key="chunk.index"
            class="chunk-card"
          >
            <div class="chunk-header">
              Chunk #{{ chunk.index }}
              <span class="chunk-token">tokens: {{ chunk.tokenCount }}</span>
            </div>
            <div class="chunk-content">{{ chunk.content }}</div>
          </div>
        </template>
        <div v-else class="fc-grey-1 fs-13 text-center py-4">尚無分段資料（Pipeline 尚未完成或無內容）</div>
      </div>

      <!-- Tab 4: 轉換結果 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'embedding' }]">
        <template v-if="activeVer?.embeddingModel">
          <div class="detail-header-card" style="max-width:480px;">
            <div class="info-label mb-3">Embedding 向量化狀態</div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">向量化狀態</span>
              <span class="status-badge status-badge--active">完成</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">Embedding 模型</span>
              <span>{{ activeVer.embeddingModel }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">向量維度</span>
              <span>{{ activeVer.embeddingDimension }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">已向量化 Chunks</span>
              <span>{{ activeVer.embeddingCount }} / {{ activeVer.chunks.length || activeVer.embeddingCount }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="fc-grey-1">最後更新</span>
              <span>{{ activeVer.lastUpdateTime }}</span>
            </div>
          </div>
        </template>
        <div v-else class="fc-grey-1 fs-13 text-center py-4">尚無向量化資料</div>
      </div>

    </div>

    <!-- 查無資料 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <h4>找不到該知識條目</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 建立新版本 Modal -->
    <CreateVersionModal v-model="isCreateVersionOpen" @confirm="handleCreateVersion" />

    <!-- 還原舊版 Modal -->
    <RestoreVersionModal
      v-model="isRestoreOpen"
      :versionNumber="restoreTargetNum"
      @confirm="confirmRestore"
    />

    <!-- 版本差異比較 Modal -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="props.id"
      :v1Id="compareV1Id"
      :v2Id="compareV2Id"
    />

    <!-- 審核 Drawer -->
    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="props.id"
      :versionId="reviewVersionId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { useApiCall } from '@/composables/useApiCall'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue'
import RestoreVersionModal from '@/components/Knowledge/RestoreVersionModal.vue'
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue'
import popDialog from '@/services/popDialog'

const props = defineProps<{ id: string }>()
const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const md = new MarkdownIt({ html: false, breaks: true, linkify: false })

const {
  data: knowledgeData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.id))

const knowledge = computed(() => knowledgeData.value ?? null)

const activeVer = computed(() => {
  if (!knowledge.value) return null
  return knowledge.value.versions.find(v => v.status === 'active')
    ?? knowledge.value.versions[knowledge.value.versions.length - 1]
})

const draftVersion = computed(() =>
  knowledge.value?.versions.find(v => v.status === 'draft' || v.status === 'rejected') ?? null
)

const renderedContent = computed(() => {
  const c = activeVer.value?.content
  if (!c) return '<span style="color:#999">（此版本無內容）</span>'
  return md.render(c)
})

// ── Tabs ──
const tabs = [
  { key: 'overview', label: '概覽' },
  { key: 'history', label: '版本歷程' },
  { key: 'chunks', label: '分段預覽' },
  { key: 'embedding', label: '轉換結果' },
]
const activeTabKey = ref('overview')

// ── Breadcrumb ──
const { setDynamic } = useBreadcrumb()
watch(activeVer, (val) => { if (val?.title) setDynamic(val.title) }, { immediate: true })

// ── Status maps ──
const statusLabelMap: Record<string, string> = {
  active: '已發布', processing: '處理中', reviewing: '審核中',
  needs_update: '需更新', pending: '待處理', failed: '失敗',
  archived: '已封存', draft: '草稿', history: '歷史版本', rejected: '已退回',
}

// ── 建立新版本 ──
const isCreateVersionOpen = ref(false)

function handleCreateVersion(data: { type: 'MINOR' | 'MAJOR', note: string }) {
  const newId = knowledgeStore.createDraftFromPublished(props.id, data.type, data.note)
  if (newId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: newId } })
  }
}

// ── 繼續編輯草稿 ──
function goToEditor() {
  if (draftVersion.value) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: draftVersion.value.id } })
  }
}

// ── 撤回審核 ──
function handleWithdraw() {
  const v = knowledge.value?.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  popDialog.confirm('確定要撤回此審核申請嗎？', () => {
    knowledgeStore.withdrawReview(props.id, v.id)
    popDialog.toast('已撤回審核', 2000)
  })
}

// ── 審核 ──
const isReviewDrawerOpen = ref(false)
const reviewVersionId = computed(
  () => knowledge.value?.versions.find(v => v.status === 'reviewing')?.id ?? ''
)

// ── 還原舊版 ──
const isRestoreOpen = ref(false)
const restoreTargetNum = ref('')
const restoreTargetId = ref('')

function openRestore(versionId: string) {
  const v = knowledge.value?.versions.find(ver => ver.id === versionId)
  if (!v) return
  restoreTargetNum.value = v.versionNumber
  restoreTargetId.value = versionId
  isRestoreOpen.value = true
}

function confirmRestore(note: string) {
  const newDraftId = knowledgeStore.restoreToDraft(props.id, restoreTargetId.value, note)
  if (newDraftId) {
    isRestoreOpen.value = false
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: newDraftId } })
      .then(() => popDialog.alert('已建立還原草稿，請繼續編輯。'))
  }
}

// ── 版本比較 ──
const isCompareOpen = ref(false)
const compareV1Id = ref('')
const compareV2Id = ref('')

function openCompare(versionId: string) {
  const versions = knowledge.value?.versions ?? []
  const idx = versions.findIndex(v => v.id === versionId)
  const activeIdx = versions.findIndex(v => v.status === 'active')
  if (activeIdx === -1 || idx === -1) return
  compareV1Id.value = versions[idx].id
  compareV2Id.value = versions[activeIdx].id
  isCompareOpen.value = true
}
</script>
