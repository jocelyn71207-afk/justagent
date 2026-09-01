<template>
  <div class="KnowledgeBase KnowledgeDetail views-page">
    <AppSkeleton v-if="isLoading" type="detail" class="p-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <div class="views-page-content-box" v-else-if="knowledge">

      <!-- Header -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ viewedVer?.title ?? knowledge.title }}</div>
        </div>
      </div>

      <div class="views-page-header">
        <div class="d-flex align-items-center gap-2">
          <button class="custom-btn" @click="router.push({ name: 'KnowledgeBase' })">
            <i class="material-symbols-outlined">arrow_back</i>
            返回列表
          </button>
          <span class="category-tag">{{ knowledge.category }}</span>
        </div>
        <div class="header-right-box">
          <button class="custom-btn" @click="isMetadataOpen = !isMetadataOpen">
            <i class="material-symbols-outlined">{{ isMetadataOpen ? 'right_panel_close' : 'right_panel_open' }}</i>
            {{ isMetadataOpen ? '隱藏詳細資訊' : '顯示詳細資訊' }}
          </button>
          <template v-if="knowledge.status === 'active'">
            <button v-if="draftVersion" class="custom-btn ml-2" @click="goToEditor">
              <i class="material-symbols-outlined">edit</i>繼續編輯草稿
            </button>
            <button class="custom-btn custom-main-btn ml-2" @click="isCreateVersionOpen = true">
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
          <template v-else-if="knowledge.status === 'approved'">
            <span class="d-flex align-items-center gap-1 fc-grey-1 fs-13 mr-2">
              <i class="material-symbols-outlined fs-16">task_alt</i>
              已核准，待發佈
            </span>
            <button class="custom-btn custom-main-btn ml-2" @click="handlePublish">
              <i class="material-symbols-outlined">rocket_launch</i>立即發佈
            </button>
          </template>
          <template v-else-if="knowledge.status === 'processing'">
            <span class="d-flex align-items-center gap-1 fc-grey-1 fs-13">
              <i class="material-symbols-outlined fs-16">sync</i>
              Pipeline 處理中，請稍候
            </span>
          </template>
          <template v-else-if="draftVersion">
            <button class="custom-btn custom-main-btn" @click="goToEditor">
              <i class="material-symbols-outlined">edit</i>繼續編輯草稿
            </button>
          </template>
          <template v-else-if="knowledge.status === 'needs_update' || knowledge.status === 'failed'">
            <button class="custom-btn custom-main-btn" @click="handleRetriggerPipeline">
              <i class="material-symbols-outlined">refresh</i>重新觸發 Pipeline
            </button>
          </template>
          <template v-else-if="knowledge.status === 'pending'">
            <span class="d-flex align-items-center gap-1 fc-grey-1 fs-13">
              <i class="material-symbols-outlined fs-16">schedule</i>
              待處理
            </span>
          </template>
        </div>
      </div>

      <!-- 正在檢視非目前版本的提示列 -->
      <div v-if="isViewingOtherVersion" class="viewing-other-version-banner">
        <i class="material-symbols-outlined">visibility</i>
        <span>
          您正在檢視
          <strong v-if="hasEarnedVersionNumber(viewedVer?.status)">{{ viewedVer?.versionNumber }}</strong>
          <strong v-else>{{ viewedVer?.title }}</strong>
          （{{ statusLabelMap[viewedVer?.status ?? ''] }}）的內容，非目前版本。
        </span>
        <button class="custom-btn fs-12 py-1 px-2 viewing-banner-back-btn" @click="backToCurrentVersion">
          <i class="material-symbols-outlined fs-14">undo</i>返回目前版本
        </button>
      </div>

      <!-- 導覽列 + 主內容 + metadata 抽屜 -->
      <div class="detail-shell">

        <!-- 左：導覽列 -->
        <div class="detail-nav-rail">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['detail-nav-item', { 'is-active': activeTabKey === tab.key }]"
            @click="activeTabKey = tab.key"
          >
            <i class="material-symbols-outlined">{{ tab.icon }}</i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- 中：主內容 -->
        <div class="detail-main">

          <!-- Tab 1: 概覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">

            <!-- Pipeline 審核提示 banner -->
            <div v-if="isPipelineReview" class="pipeline-review-banner">
              <i class="material-symbols-outlined">smart_toy</i>
              <span>此條目由 Pipeline 處理完成，以下為 AI 生成的知識摘要。請切換至「分段預覽」審查內容品質，確認無誤後點擊「開始審核」批准發佈。</span>
            </div>

            <div class="content-preview">
              <div class="article-meta">
                <span class="fc-grey-1 fs-14">{{ viewedVer?.summary || '（無摘要）' }}</span>
              </div>
              <div class="article-body">
                <div class="markdown-body" v-html="renderedContent"></div>
              </div>
            </div>
          </div>

          <!-- Tab 2: 版本歷程 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="fc-grey-1 fs-13">共 {{ knowledge.versions.length }} 個版本</div>
            </div>
            <div class="version-timeline lively-stagger">
              <div
                v-for="(ver, idx) in [...knowledge.versions].reverse()"
                :key="ver.id"
                :class="['version-timeline-item', 'lively-card', { 'is-viewing': ver.id === viewedVer?.id }]"
              >
                <div class="version-timeline-node">
                  <div :class="['node-dot', { 'is-active': ver.status === 'active' }]"></div>
                  <div v-if="idx < knowledge.versions.length - 1" class="node-line"></div>
                </div>
                <div class="version-timeline-body">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="d-flex gap-2 align-items-center">
                      <span class="fw-600 fs-14">{{ hasEarnedVersionNumber(ver.status) ? ver.versionNumber : '—' }}</span>
                      <span :class="['status-badge', `status-badge--${ver.status}`]">{{ statusLabelMap[ver.status] }}</span>
                      <span v-if="ver.versionType" class="tag-chip">{{ ver.versionType }}</span>
                      <span v-if="ver.status === 'active'" class="current-version-tag">
                        <i class="material-symbols-outlined fs-13">check_circle</i>目前版本
                      </span>
                    </div>
                    <span class="fc-grey-1 fs-13">{{ ver.lastUpdateTime }}</span>
                  </div>
                  <div class="fc-grey-1 fs-13">{{ ver.updateNote }} ・ {{ ver.lastUpdateBy }}</div>
                  <div v-if="ver.reviewedBy" class="d-flex align-items-center gap-1 fc-grey-1 fs-13">
                    <i class="material-symbols-outlined fs-13">task_alt</i>
                    {{ ver.reviewedBy }} 於 {{ ver.reviewedTime }} 核准
                  </div>
                  <div class="d-flex gap-2 mt-2">
                    <button
                      v-if="ver.id !== viewedVer?.id"
                      class="custom-btn fs-12 py-1 px-2"
                      @click="viewVersion(ver.id)"
                    >
                      <i class="material-symbols-outlined fs-14">visibility</i>檢視此版本
                    </button>
                    <template v-if="ver.status === 'history'">
                      <button class="custom-btn fs-12 py-1 px-2" @click="handleSwitchVersion(ver.id)">
                        <i class="material-symbols-outlined fs-14">sync_alt</i>切換當前版本
                      </button>
                      <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                        <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                      </button>
                    </template>
                    <template v-if="ver.status === 'approved'">
                      <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                        <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                      </button>
                      <button class="custom-btn custom-main-btn fs-12 py-1 px-2" @click="handlePublish">
                        <i class="material-symbols-outlined fs-14">rocket_launch</i>立即發佈
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: 分段預覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
            <ChunkPreviewTab
              :chunks="viewedVer?.chunks ?? []"
              :source-type="knowledge.sourceType"
            />
          </div>

          <!-- Tab 4: 轉換結果 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]">
            <ConversionLogTab
              :conversion-log="viewedVer?.conversionLog ?? []"
              :status="knowledge.status"
            />
          </div>

        </div>

        <!-- 右：metadata 抽屜（4 個導覽項目共用，不隨 activeTabKey 卸載） -->
        <div v-if="isMetadataOpen" class="detail-metadata-drawer">
          <!-- 版本 & 狀態 -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">版本資訊</div>
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span
                class="version-badge"
                :class="{ major: hasEarnedVersionNumber(viewedVer?.status) && viewedVer?.versionNumber?.endsWith('.0') }"
              >
                {{ hasEarnedVersionNumber(viewedVer?.status) ? viewedVer?.versionNumber : '—' }}
              </span>
              <span :class="['status-badge', `status-badge--${viewedVer?.status}`]">
                {{ statusLabelMap[viewedVer?.status ?? ''] }}
              </span>
              <span v-if="viewedVer?.versionType" class="tag-chip">{{ viewedVer.versionType }}</span>
            </div>
            <div class="sidebar-row">
              <span class="sidebar-label">更新人</span>
              <span>{{ viewedVer?.lastUpdateBy }}</span>
            </div>
            <div class="sidebar-row">
              <span class="sidebar-label">更新時間</span>
              <span>{{ viewedVer?.lastUpdateTime }}</span>
            </div>
            <div v-if="viewedVer?.updateNote" class="sidebar-row sidebar-row--top">
              <span class="sidebar-label">說明</span>
              <span class="fc-grey-1">{{ viewedVer.updateNote }}</span>
            </div>
            <div v-if="viewedVer?.reviewedBy" class="sidebar-row">
              <span class="sidebar-label">核准人</span>
              <span>{{ viewedVer.reviewedBy }}</span>
            </div>
            <div v-if="viewedVer?.reviewedTime" class="sidebar-row">
              <span class="sidebar-label">核准時間</span>
              <span>{{ viewedVer.reviewedTime }}</span>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- 分類 & 標籤 -->
          <div class="sidebar-section">
            <div class="sidebar-row">
              <span class="sidebar-label">分類</span>
              <span class="category-tag">{{ knowledge.category }}</span>
            </div>
            <div class="sidebar-row sidebar-row--top">
              <span class="sidebar-label">標籤</span>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="tag in viewedVer?.tags"
                  :key="tag"
                  :class="['tag-chip', { 'tag-chip--system': viewedVer?.systemTags?.includes(tag) }]"
                >
                  <i v-if="viewedVer?.systemTags?.includes(tag)" class="material-symbols-outlined fs-11 mr-1">smart_toy</i>
                  {{ tag }}
                </span>
                <span v-if="!viewedVer?.tags?.length" class="fc-grey-1 fs-13">無標籤</span>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- Pipeline -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pipeline</div>
            <template v-if="knowledge.status === 'processing'">
              <div class="pipeline-progress-wrap">
                <div class="pipeline-progress-bar" style="flex:1; max-width:120px;">
                  <div class="pipeline-progress-fill" :style="{ width: knowledge.pipelineProgress + '%' }"></div>
                </div>
                <span class="pipeline-stage-label">{{ pipelineStageLabelMap[knowledge.pipelineStage ?? ''] ?? knowledge.pipelineStage }} {{ knowledge.pipelineProgress }}%</span>
              </div>
            </template>
            <template v-else>
              <div class="pipeline-stages">
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>分段</span>
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>向量化</span>
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>建立索引</span>
              </div>
            </template>
            <div v-if="knowledge.pipelineError" class="fs-12 mt-2 pipeline-error-text">
              {{ knowledge.pipelineError }}
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- 來源附件 -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">來源附件</div>
            <div v-if="viewedVer?.sourceFiles?.length" class="d-flex flex-column gap-2">
              <div
                v-for="f in viewedVer.sourceFiles"
                :key="f.fileId"
                class="sidebar-file-item"
              >
                <i class="material-symbols-outlined fs-14">description</i>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.fileName }}</span>
                <button
                  class="custom-btn fs-11 py-0 px-2"
                  style="white-space:nowrap;"
                  @click="openFilePreview(f.fileId, f.fileName)"
                >查看原檔</button>
              </div>
            </div>
            <div v-else class="fc-grey-1 fs-13">尚未關聯任何來源檔案</div>
          </div>
        </div>

      </div>

    </div>

    <!-- 查無資料 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <h4>找不到該知識條目</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 建立新版本 Modal -->
    <CreateVersionModal v-model="isCreateVersionOpen" @confirm="handleCreateVersion" />

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
    <FilePreviewModal
      v-model="showFilePreview"
      :file-name="previewFileName"
      :file-url="previewFileUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { useKnowledgeStore, hasEarnedVersionNumber } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { useApiCall } from '@/composables/useApiCall'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue'
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue'
import FilePreviewModal from '@/components/Knowledge/FilePreviewModal.vue'
import ChunkPreviewTab from '@/components/Knowledge/ChunkPreviewTab.vue'
import ConversionLogTab from '@/components/Knowledge/ConversionLogTab.vue'
import popDialog from '@/services/popDialog'

const props = defineProps<{ id: string }>()
const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const resourceStore = useResourceStore()
const md = new MarkdownIt({ html: false, breaks: true, linkify: false })

const showFilePreview = ref(false)
const previewFileName = ref('')
const previewFileUrl = ref('')

function openFilePreview(fileId: string, fileName: string) {
  previewFileName.value = fileName
  previewFileUrl.value = resourceStore.getFileById(fileId)?.fileUrl ?? ''
  showFilePreview.value = true
}

const {
  data: knowledgeData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.id))

const knowledge = computed(() => knowledgeData.value ?? null)

// 系統認定的「目前版本」：已發布中的版本，若無已發布版本則退回最後一筆（如剛送審、尚未曾發布過）
const activeVer = computed(() => {
  if (!knowledge.value) return null
  return knowledge.value.versions.find(v => v.status === 'active')
    ?? knowledge.value.versions[knowledge.value.versions.length - 1]
})

// 使用者於「版本歷程」點選「檢視」時，暫時切換要瀏覽的版本；未選擇時預設顯示目前版本
const viewingVersionId = ref<string | null>(null)
const viewedVer = computed(() => {
  if (!knowledge.value) return null
  if (viewingVersionId.value) {
    return knowledge.value.versions.find(v => v.id === viewingVersionId.value) ?? activeVer.value
  }
  return activeVer.value
})
const isViewingOtherVersion = computed(() => viewedVer.value?.id !== activeVer.value?.id)

function viewVersion(versionId: string) {
  viewingVersionId.value = versionId
  activeTabKey.value = 'overview'
}
function backToCurrentVersion() {
  viewingVersionId.value = null
}
watch(() => props.id, () => { viewingVersionId.value = null })

const draftVersion = computed(() =>
  knowledge.value?.versions.find(v => v.status === 'draft' || v.status === 'rejected') ?? null
)

// Pipeline 審核狀態：reviewing 但 activityLog 裡沒有這個版本的 SUBMITTED 紀錄（尚未人工送審）
const isPipelineReview = computed(() => {
  if (viewedVer.value?.status !== 'reviewing') return false
  const hasSubmitRecord = knowledge.value?.activityLog?.some(
    e => e.action === 'SUBMITTED' && e.versionId === viewedVer.value?.id
  )
  return !hasSubmitRecord
})

const renderedContent = computed(() => {
  const c = viewedVer.value?.content
  if (c) return md.render(c)

  // 內容為空時，若有 chunk gist，改為顯示 AI 摘要摘要列表
  const chunks = viewedVer.value?.chunks ?? []
  const hasGist = chunks.some(ch => ch.gist)
  if (hasGist) {
    const items = chunks
      .filter(ch => ch.gist)
      .map(ch => `**${ch.sectionPath ?? `知識單元 #${ch.index}`}**\n\n${ch.gist}`)
      .join('\n\n---\n\n')
    return md.render(items)
  }

  return '<span style="color:var(--text-faint)">（此版本無內容）</span>'
})

// ── Tabs ──
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
const activeTabKey = ref('overview')
const isMetadataOpen = ref(true)

// ── Breadcrumb ──
const { setDynamic } = useBreadcrumb()
watch(viewedVer, (val) => { if (val?.title) setDynamic(val.title) }, { immediate: true })

// ── Status maps ──
const statusLabelMap: Record<string, string> = {
  active: '已發布', processing: '處理中', reviewing: '審核中', approved: '已核准・待發佈',
  needs_update: '需更新', pending: '待處理', failed: '失敗',
  archived: '已封存', draft: '草稿', history: '歷史版本', rejected: '已退回',
}

const pipelineStageLabelMap: Record<string, string> = {
  chunking:  '分段中',
  embedding: '向量化',
  indexing:  '建立索引',
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

// ── 發佈已核准版本 ──
function handlePublish() {
  const v = knowledge.value?.versions.find(ver => ver.status === 'approved')
  if (!v) return
  popDialog.confirm(`確定要將 ${v.versionNumber} 發佈上線嗎？發佈後將取代目前的正式版本。`, () => {
    knowledgeStore.publishApprovedVersion(props.id, v.id)
    popDialog.toast('已發佈上線', 2000)
  })
}

// ── 重新觸發 Pipeline ──
function handleRetriggerPipeline() {
  knowledgeStore.retriggerPipeline(props.id)
  popDialog.toast('已送出重新處理請求', 2000)
}

// ── 審核 ──
const isReviewDrawerOpen = ref(false)
const reviewVersionId = computed(
  () => knowledge.value?.versions.find(v => v.status === 'reviewing')?.id ?? ''
)

// ── 切換當前版本（歷史版本曾經正式發布過，直接重新生效，不需再走草稿／審核）──
function handleSwitchVersion(versionId: string) {
  const v = knowledge.value?.versions.find(ver => ver.id === versionId)
  if (!v) return
  popDialog.confirm(`確定要切換回 ${v.versionNumber} 嗎？切換後將立即取代目前的正式版本。`, () => {
    knowledgeStore.switchToVersion(props.id, versionId)
    viewingVersionId.value = null
    popDialog.toast(`已切換為 ${v.versionNumber}`, 2000)
  })
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
