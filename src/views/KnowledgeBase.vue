<template>
  <div class="KnowledgeBase views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">知識內容管理</div>
        </div>
      </div>

      <!-- Tab 切換 -->
      <div class="kb-tab-nav">
        <button :class="['kb-tab', { 'is-active': activeTab === 'items' }]" @click="activeTab = 'items'">
          <i class="material-symbols-outlined">menu_book</i>知識條目
        </button>
        <button :class="['kb-tab', { 'is-active': activeTab === 'sources' }]" @click="activeTab = 'sources'">
          <i class="material-symbols-outlined">api</i>資料來源
        </button>
      </div>

      <DataSourceTab v-if="activeTab === 'sources'" />

      <template v-if="activeTab === 'items'">
        <!-- 統計卡 -->
        <div class="stats-row lively-stagger" style="grid-template-columns: repeat(5, 1fr);">
          <div class="stat-card lively-card">
            <div class="stat-icon stat-icon--main"><i class="material-symbols-outlined">description</i></div>
            <div><div class="stat-number">{{ stats.total }}</div><div class="stat-label">全部</div></div>
          </div>
          <div class="stat-card lively-card">
            <div class="stat-icon stat-icon--green"><i class="material-symbols-outlined">verified</i></div>
            <div><div class="stat-number">{{ stats.active }}</div><div class="stat-label">已發布</div></div>
          </div>
          <div class="stat-card stat-card--needs-update lively-card">
            <div class="stat-icon stat-icon--needs-update"><i class="material-symbols-outlined">update</i></div>
            <div><div class="stat-number stat-number--needs-update">{{ stats.needsUpdate }}</div><div class="stat-label">需更新</div></div>
          </div>
          <div class="stat-card lively-card">
            <div class="stat-icon stat-icon--blue"><i class="material-symbols-outlined">rate_review</i></div>
            <div><div class="stat-number">{{ stats.reviewing }}</div><div class="stat-label">審核中</div></div>
          </div>
          <div class="stat-card stat-card--kpi lively-card">
            <span class="kpi-badge">KPI</span>
            <div class="stat-icon stat-icon--kpi"><i class="material-symbols-outlined">insights</i></div>
            <div>
              <div class="stat-number stat-number--kpi">{{ conversionRate }}%</div>
              <div class="stat-label">知識轉換率</div>
              <div class="kpi-target">目標 ≥ 95%</div>
            </div>
            <div class="kpi-progress-bar">
              <div class="kpi-progress-fill" :style="{ width: conversionRate + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 批次工具列 / 篩選列 -->
        <div v-if="selectedIds.length" class="batch-toolbar">
          <span class="batch-count">已選 {{ selectedIds.length }} 筆</span>
          <div class="batch-actions">
            <button class="batch-btn" @click="handleBatchArchive">批次封存</button>
            <button class="batch-btn is-danger" @click="handleBatchDelete">批次刪除</button>
          </div>
          <button class="batch-cancel" @click="selectedIds = []"><i class="material-symbols-outlined">close</i>取消</button>
        </div>
        <div v-else class="filter-row">
          <div class="category-tabs">
            <button
              v-for="cat in categoryOptions"
              :key="cat"
              :class="['category-tab-btn', { 'is-active': selectedCategory === cat }]"
              @click="selectedCategory = cat; currentPage = 1"
            >{{ cat }}</button>
          </div>
          <div class="filter-right">
            <compDropDown
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="狀態"
              style="width: 130px;"
            />
            <button class="custom-btn custom-main-btn ml-2" @click="isCreateModalOpen = true">
              <i class="material-symbols-outlined">add_box</i>新增知識
            </button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="custom-table-wrap">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width:36px;">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
                </th>
                <th>標題 / 分類</th>
                <th style="width:130px;">狀態</th>
                <th style="width:90px;">版本</th>
                <th style="width:130px;">最後更新</th>
                <th style="width:60px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayList.length">
                <td colspan="6" class="text-center fc-grey-1 py-4">無符合條件的條目</td>
              </tr>
              <tr
                v-for="item in displayList"
                :key="item.id"
                :class="{ 'table-row--needs-update': item.status === 'needs_update' }"
              >
                <td>
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(item.id)"
                    @change="toggleSelect(item.id)"
                  />
                </td>
                <td>
                  <div class="fw-500 cursor-pointer" @click="goToDetail(item.id)">
                    {{ item.title }}
                    <span v-if="item.status === 'needs_update'" class="source-stale-badge ml-1">來源已更新</span>
                  </div>
                  <div class="fs-12 fc-grey-1">{{ item.category }}</div>
                  <!-- Pipeline 進度條 -->
                  <div v-if="item.status === 'processing'" class="pipeline-progress-wrap">
                    <div class="pipeline-progress-bar">
                      <div class="pipeline-progress-fill" :style="{ width: item.pipelineProgress + '%' }"></div>
                    </div>
                    <span class="pipeline-stage-label">{{ item.pipelineStage }} {{ item.pipelineProgress }}%</span>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', `status-badge--${item.status}`]">
                    <i class="material-symbols-outlined">{{ statusIconMap[item.status] }}</i>
                    {{ statusLabelMap[item.status] }}
                  </span>
                </td>
                <td class="fc-grey-1 fs-13">{{ activeVersion(item)?.versionNumber ?? '—' }}</td>
                <td class="fc-grey-1 fs-13">{{ item.lastUpdateTime }}</td>
                <td>
                  <div class="ops-menu-wrap" @click.stop>
                    <button class="ops-btn" @click="toggleOpsMenu(item.id)">
                      <i class="material-symbols-outlined">more_vert</i>
                    </button>
                    <div v-if="openOpsId === item.id" class="next-option-box ops-dropdown">
                      <div class="option-item" @click="goToDetail(item.id); closeOps()">
                        <i class="material-symbols-outlined">visibility</i>查看
                      </div>
                      <template v-if="item.status === 'active'">
                        <div class="option-item" @click="openCreateVersion(item.id); closeOps()">
                          <i class="material-symbols-outlined">add_box</i>建立新版本
                        </div>
                        <div class="option-item" @click="archiveItem(item.id); closeOps()">
                          <i class="material-symbols-outlined">inventory_2</i>封存
                        </div>
                      </template>
                      <template v-if="isEditableStatus(item)">
                        <div class="option-item" @click="goToEditor(item); closeOps()">
                          <i class="material-symbols-outlined">edit</i>繼續編輯
                        </div>
                      </template>
                      <template v-if="item.status === 'reviewing'">
                        <div class="option-item" @click="handleWithdraw(item); closeOps()">
                          <i class="material-symbols-outlined">undo</i>撤回審核
                        </div>
                        <div class="option-item" @click="openReview(item); closeOps()">
                          <i class="material-symbols-outlined">rate_review</i>開始審核
                        </div>
                      </template>
                      <template v-if="item.status === 'needs_update' || item.status === 'failed'">
                        <div class="option-item" @click="knowledgeStore.retriggerPipeline(item.id); closeOps()">
                          <i class="material-symbols-outlined">refresh</i>重新觸發 Pipeline
                        </div>
                      </template>
                      <template v-if="item.status === 'needs_update'">
                        <div class="option-item" @click="knowledgeStore.ignoreUpdate(item.id); popDialog.toast('已忽略更新', 2000); closeOps()">
                          <i class="material-symbols-outlined">block</i>忽略更新
                        </div>
                      </template>
                      <template v-if="item.status === 'failed'">
                        <div class="option-item" @click="openErrorLog(item); closeOps()">
                          <i class="material-symbols-outlined">bug_report</i>查看錯誤紀錄
                        </div>
                      </template>
                      <div class="option-item" @click="downloadItem(item.title); closeOps()">
                        <i class="material-symbols-outlined">download</i>下載原始檔案
                      </div>
                      <template v-if="item.status !== 'processing' && item.status !== 'pending'">
                        <div class="option-item option-item--danger" @click="deleteItem(item.id); closeOps()">
                          <i class="material-symbols-outlined">delete</i>刪除
                        </div>
                      </template>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分頁 -->
        <compPagination
          v-model="currentPage"
          :total="filteredList.length"
          :pageSize="pageSize"
          class="mt-3"
        />
      </template>
    </div>

    <!-- 新增知識 Modal -->
    <CreateKnowledgeWizardModal
      v-model="isCreateModalOpen"
      @created="handleKnowledgeCreated"
    />

    <!-- 建立新版本 Modal -->
    <CreateVersionModal
      v-model="isCreateVersionOpen"
      @confirm="handleCreateVersion"
    />

    <!-- 審核 Drawer -->
    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="reviewTargetId"
      :versionId="reviewVersionId"
    />

    <!-- 版本差異比較 Modal -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="compareKnowledgeId"
      :v1Id="compareV1Id"
      :v2Id="compareV2Id"
    />

    <ErrorLogModal
      v-model="isErrorLogOpen"
      :error-message="errorLogMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DataSourceTab from '@/components/Knowledge/DataSourceTab.vue'
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue'
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue'
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue'
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'
import ErrorLogModal from '@/components/Knowledge/ErrorLogModal.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { KnowledgeItem } from '@/stores/knowledgeStore'
import popDialog from '@/services/popDialog'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const { knowledgeList } = storeToRefs(knowledgeStore)

// ── Tab ──
const activeTab = ref<'items' | 'sources'>('items')

// ── 篩選 ──
const selectedCategory = ref('全部')
const selectedStatus = ref('')

const categoryOptions = computed(() => {
  const cats = [...new Set(knowledgeList.value.map(k => k.category))]
  return ['全部', ...cats]
})

const statusOptions = [
  { label: '全部狀態', value: '' },
  { label: '已發布', value: 'active' },
  { label: '處理中', value: 'processing' },
  { label: '審核中', value: 'reviewing' },
  { label: '需更新', value: 'needs_update' },
  { label: '待處理', value: 'pending' },
  { label: '失敗', value: 'failed' },
  { label: '已封存', value: 'archived' },
]

const filteredList = computed(() => {
  return knowledgeList.value.filter(item => {
    if (selectedCategory.value !== '全部' && item.category !== selectedCategory.value) return false
    if (selectedStatus.value && item.status !== selectedStatus.value) return false
    return true
  })
})

// ── 分頁 ──
const currentPage = ref(1)
const pageSize = 10

const displayList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

// ── 統計 ──
const stats = computed(() => ({
  total: knowledgeList.value.length,
  active: knowledgeList.value.filter(k => k.status === 'active').length,
  needsUpdate: knowledgeList.value.filter(k => k.status === 'needs_update').length,
  reviewing: knowledgeList.value.filter(k => k.status === 'reviewing').length,
  processing: knowledgeList.value.filter(k => k.status === 'processing' || k.status === 'pending').length,
}))

const conversionRate = computed(() => {
  const all = knowledgeList.value.filter(k => k.status !== 'archived')
  if (!all.length) return 0
  const active = all.filter(k => k.status === 'active').length
  return Math.round((active / all.length) * 1000) / 10
})

// ── 狀態 label / icon ──
const statusLabelMap: Record<string, string> = {
  active: '已發布',
  processing: '處理中',
  reviewing: '審核中',
  needs_update: '需更新',
  pending: '待處理',
  failed: '失敗',
  archived: '已封存',
  draft: '草稿',
  history: '歷史版',
  rejected: '已退回',
}

const statusIconMap: Record<string, string> = {
  active: 'verified',
  processing: 'sync',
  reviewing: 'pending_actions',
  needs_update: 'update',
  pending: 'schedule',
  failed: 'error',
  archived: 'inventory_2',
  draft: 'edit_note',
  history: 'history',
  rejected: 'cancel',
}

// ── 勾選批次 ──
const selectedIds = ref<string[]>([])

const isAllSelected = computed(
  () => displayList.value.length > 0 && displayList.value.every(i => selectedIds.value.includes(i.id))
)

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...displayList.value.map(i => i.id)])]
  } else {
    const pageIds = displayList.value.map(i => i.id)
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function handleBatchArchive() {
  popDialog.confirm(`確定要封存 ${selectedIds.value.length} 個條目嗎？`, () => {
    knowledgeStore.batchArchive(selectedIds.value)
    selectedIds.value = []
    popDialog.toast('已批次封存', 2000)
  })
}

function handleBatchDelete() {
  popDialog.confirm(`確定要刪除 ${selectedIds.value.length} 個條目嗎？此操作無法復原。`, () => {
    knowledgeStore.batchDelete(selectedIds.value)
    selectedIds.value = []
    popDialog.toast('已批次刪除', 2000)
  })
}

// ── 操作選單 ──
const openOpsId = ref<string | null>(null)

function toggleOpsMenu(id: string) {
  openOpsId.value = openOpsId.value === id ? null : id
}

function closeOps() {
  openOpsId.value = null
}

// ── 工具函式 ──
function activeVersion(item: KnowledgeItem) {
  return item.versions.find(v => v.status === 'active') ?? item.versions[item.versions.length - 1]
}

function goToDetail(id: string) {
  router.push({ name: 'KnowledgeDetail', params: { id } })
}

function goToEditor(item: KnowledgeItem) {
  const draft = item.versions.find(v => v.status === 'draft' || v.status === 'rejected')
  if (draft) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: item.id, versionId: draft.id } })
  }
}

function archiveItem(id: string) {
  popDialog.confirm('確定要封存此條目嗎？', () => {
    knowledgeStore.archiveKnowledge(id)
    popDialog.toast('已封存', 2000)
  })
}

function deleteItem(id: string) {
  popDialog.confirm('確定要刪除此條目嗎？此操作無法復原。', () => {
    knowledgeStore.batchDelete([id])
    popDialog.toast('已刪除', 2000)
  })
}

// ── 審核 ──
const isReviewDrawerOpen = ref(false)
const reviewTargetId = ref('')
const reviewVersionId = ref('')

function openReview(item: KnowledgeItem) {
  const v = item.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  reviewTargetId.value = item.id
  reviewVersionId.value = v.id
  isReviewDrawerOpen.value = true
}

function handleWithdraw(item: KnowledgeItem) {
  const v = item.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  popDialog.confirm('確定要撤回此審核申請嗎？', () => {
    knowledgeStore.withdrawReview(item.id, v.id)
    popDialog.toast('已撤回審核', 2000)
  })
}

// ── 建立新版本 ──
const isCreateVersionOpen = ref(false)
const createVersionTargetId = ref('')

function openCreateVersion(id: string) {
  createVersionTargetId.value = id
  isCreateVersionOpen.value = true
}

function handleCreateVersion(data: { type: 'MINOR' | 'MAJOR', note: string }) {
  const newId = knowledgeStore.createDraftFromPublished(createVersionTargetId.value, data.type, data.note)
  if (newId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: createVersionTargetId.value, versionId: newId } })
  }
}

// ── 新增知識 ──
const isCreateModalOpen = ref(false)

function handleKnowledgeCreated(_id: string) {
  // no-op — pipeline progress auto-updates via store
}

// ── 狀態輔助 ──
function isEditableStatus(item: KnowledgeItem): boolean {
  return item.versions.some(v => v.status === 'draft' || v.status === 'rejected')
    && item.status !== 'active'
    && item.status !== 'reviewing'
}

// ── 版本比較 ──
const isCompareOpen = ref(false)
const compareKnowledgeId = ref('')
const compareV1Id = ref('')
const compareV2Id = ref('')

const isErrorLogOpen = ref(false)
const errorLogMessage = ref<string | null>(null)

function openErrorLog(item: KnowledgeItem) {
  errorLogMessage.value = item.pipelineError
  isErrorLogOpen.value = true
}

function downloadItem(title: string) {
  window.alert('下載：' + title + '.pdf')
}
</script>
