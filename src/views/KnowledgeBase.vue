<template>
  <div class="KnowledgeBase views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <!-- 頁面標題與快速操作 -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">知識庫管理</div>
        </div>
        <div class="banner-right">
          <div class="search-box">
            <i class="material-symbols-outlined">search</i>
            <input class="custom-input" type="text" v-model="searchText" placeholder="搜尋條目標題、內容或標籤" />
          </div>
          <div class="add-knowledge-dropdown" ref="addDropdownRef">
            <button class="custom-btn custom-main-btn" @click="showAddDropdown = !showAddDropdown">
              <i class="material-symbols-outlined">add_circle</i>
              新增知識條目
              <i class="material-symbols-outlined fs-18 ml-1" :class="{ 'rotate-180': showAddDropdown }">expand_more</i>
            </button>
            <div v-show="showAddDropdown" class="next-option-box add-dropdown-menu">
              <div class="option-item" @click="createNewKnowledge">
                <i class="material-symbols-outlined">upload_file</i>
                上傳文件
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 切換 -->
      <div class="kb-tab-nav">
        <button
          :class="['kb-tab', { 'is-active': activeTab === 'items' }]"
          @click="activeTab = 'items'"
        >
          <i class="material-symbols-outlined">menu_book</i>
          知識條目
        </button>
        <button
          :class="['kb-tab', { 'is-active': activeTab === 'sources' }]"
          @click="activeTab = 'sources'"
        >
          <i class="material-symbols-outlined">api</i>
          資料來源
        </button>
      </div>

      <!-- 資料來源 Tab -->
      <DataSourceTab v-if="activeTab === 'sources'" />

      <div v-show="activeTab === 'items'">
      <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
      <AppErrorState
        v-else-if="hasError"
        :message="apiErrorMessage"
        @retry="retry"
      />
      <template v-else>

      <!-- 統計概覽 (實時反應 Store 狀態) -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-icon--main">
            <i class="material-symbols-outlined">description</i>
          </div>
          <div>
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">總條目數</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <i class="material-symbols-outlined">verified</i>
          </div>
          <div>
            <div class="stat-number">{{ stats.published }}</div>
            <div class="stat-label">已發布版本</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--yellow">
            <i class="material-symbols-outlined">drafts</i>
          </div>
          <div>
            <div class="stat-number">{{ stats.draft }}</div>
            <div class="stat-label">編輯中草稿</div>
          </div>
        </div>
        <div class="stat-card" style="cursor: pointer;" @click="filterStatus = 'REVIEWING'">
          <div class="stat-icon stat-icon--orange">
            <i class="material-symbols-outlined">pending_actions</i>
          </div>
          <div>
            <div class="stat-number">{{ stats.reviewing }}</div>
            <div class="stat-label">版本審核中</div>
          </div>
        </div>
      </div>

      <!-- 篩選列 -->
      <div class="filter-row">
        <div class="filter-left">
          <compTabs
            v-model="filterCategory"
            :tabs="[
              { label: '全部', value: '' },
              { label: '商品文件', value: '商品文件' },
              { label: '系統文件', value: '系統文件' },
              { label: '客服知識', value: '客服知識' },
              { label: '規則說明', value: '規則說明' },
            ]"
          />
        </div>
        <div class="filter-right">
          <compDropDown
            :options="[
              { name: '所有狀態', value: '' },
              { name: '已發布', value: 'PUBLISHED' },
              { name: '審核中', value: 'REVIEWING' },
              { name: '草稿', value: 'DRAFT' },
              { name: '已退回', value: 'REJECTED' },
            ]"
            :show-search="false"
            :showClearTriggerIcon="false"
            :default-value="''"
            :width="'140px'"
            class="w-100"
            placeholder="篩選狀態"
            @select="(item: any) => { filterStatus = String(item.value); }"
          />
        </div>
      </div>

      <!-- 知識列表表格 -->
      <div class="table-box mt-2" v-if="displayList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>知識條目</th>
              <th width="120">分類</th>
              <th width="100">目前版本</th>
              <th width="120">狀態</th>
              <th width="160">最後更動</th>
              <th width="60"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in displayList" :key="item.id" @mouseleave="activeMenuId = ''">
              <td>
                <div class="d-flex align-items-center">
                  <div :class="['knowledge-icon', 'mr-3', { 'knowledge-icon--api': item.sourceType === 'API' }]">
                    <i class="material-symbols-outlined">{{ item.sourceType === 'API' ? 'api' : 'menu_book' }}</i>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <div class="entry-title cursor-pointer" @click="goToDetail(item.id)">{{ item.title }}</div>
                      <span v-if="item.sourceType === 'API'" class="api-source-badge">API 同步</span>
                      <span
                        v-if="item.sourceStale"
                        class="source-stale-badge"
                        @click.stop="openSourceUpdateModal(item)"
                      >
                        <i class="material-symbols-outlined">update</i>
                        來源已更新
                      </span>
                    </div>
                    <div class="entry-id">
                      <template v-if="item.sourceType === 'API'">
                        來源：{{ item.apiSourceName }} ・ 上次同步：{{ item.apiSourceId ? (apiSourceMap[item.apiSourceId]?.lastSyncAt ?? '—') : '—' }}
                      </template>
                      <template v-else>{{ item.id }}</template>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-tag">{{ item.category }}</span>
              </td>
              <td>
                <span class="version-badge" :class="{ major: item.currentVersion.endsWith('.0') }">
                  {{ item.currentVersion }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', `status-badge--${item.status}`]">
                  <i class="material-symbols-outlined">{{ statusIconMap[item.status] }}</i>
                  {{ statusLabelMap[item.status] }}
                </span>
              </td>
              <td class="fc-grey-1">
                <div class="fs-13">{{ item.lastUpdateTime }}</div>
                <div class="fs-12">{{ item.lastUpdateBy }}</div>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <i class="material-symbols-outlined more-btn"
                    @click.stop="activeMenuId = item.id">more_horiz</i>
                </div>
                <!-- 操作選單 -->
                <div :class="['next-option-box', { show: activeMenuId === item.id }]" @click.stop>
                  <div class="option-item" @click="goToDetail(item.id)">
                    <i class="material-symbols-outlined">visibility</i>
                    查看詳情
                  </div>
                  <div class="option-item" @click="handleEditAction(item)">
                    <i class="material-symbols-outlined">edit</i>
                    {{ item.status === 'PUBLISHED' ? '建立新版本' : '繼續編輯' }}
                  </div>
                  <div
                    v-if="item.status === 'REVIEWING'"
                    class="option-item"
                    @click="openReviewDrawer(item)"
                  >
                    <i class="material-symbols-outlined">rate_review</i>
                    審核
                  </div>
                  <div class="option-item divider" @click="openHistory(item.id)">
                    <i class="material-symbols-outlined">history</i>
                    版本紀錄
                  </div>
                  <div class="option-item option-item--danger" @click="deleteItem(item.id)">
                    <i class="material-symbols-outlined">delete</i>
                    刪除
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 查無資料 -->
      <div class="p-5 mt-4 text-center fc-grey-1" v-else>目前沒有符合條件的知識條目</div>

      <!-- 分頁 -->
      <compPagination class="mt-4"
        :pageNo="pageNo"
        :numberOfRowsPerPage="numberOfRowsPerPage"
        :totalRows="filteredList.length"
        @change="(p: any) => { pageNo = p.pageNo; }"
      />

      </template>
      </div>

    </div>

    <VersionHistoryDrawer 
      ref="historyDrawer"
      v-model="isHistoryOpen"
      :knowledgeId="selectedId"
      @compare="handleOpenCompare"
      @restore="handleOpenRestore"
    />

    <!-- 比較視窗 -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="selectedId"
      :v1Id="v1Id"
      :v2Id="v2Id"
    />

    <!-- 還原確認 -->
    <RestoreVersionModal
      v-model="isRestoreOpen"
      :versionNumber="versionToRestore?.versionNumber || ''"
      @confirm="confirmRestore"
    />

    <!-- 來源更新通知 -->
    <SourceUpdateModal
      v-model="isSourceUpdateModalOpen"
      :file-id="sourceUpdateFileId"
    />

    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="reviewKnowledgeId"
      :versionId="reviewVersionId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import { useRouter } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import compTabs from '@/components/compTabs/compTabs.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import popDialog from '@/services/popDialog';

// 功能元件
import VersionHistoryDrawer from '@/components/Knowledge/VersionHistoryDrawer.vue';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import RestoreVersionModal from '@/components/Knowledge/RestoreVersionModal.vue';
import SourceUpdateModal from '@/components/Knowledge/SourceUpdateModal.vue';
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
import DataSourceTab from '@/components/Knowledge/DataSourceTab.vue';

const router = useRouter();

const activeTab = ref<'items' | 'sources'>('items');

// 新增知識條目下拉
const showAddDropdown = ref(false);
const addDropdownRef = ref<HTMLElement | null>(null);

// 點外部關閉下拉
function handleOutsideClick(e: MouseEvent) {
  if (addDropdownRef.value && !addDropdownRef.value.contains(e.target as Node)) {
    showAddDropdown.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick));
onUnmounted(() => document.removeEventListener('click', handleOutsideClick));

const rootStore = useRootStore();
const knowledgeStore = useKnowledgeStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);
const { apiSources } = storeToRefs(knowledgeStore);

const apiSourceMap = computed(() =>
  Object.fromEntries(apiSources.value.map(s => [s.id, s]))
);

const {
  data: knowledgeListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.knowledgeList);

// --- 狀態與過濾 ---
const searchText = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const activeMenuId = ref('');

const statusLabelMap: Record<string, string> = {
  PUBLISHED: '已發布',
  REVIEWING: '審核中',
  DRAFT:     '草稿',
  REJECTED:  '已退回',
};

const statusIconMap: Record<string, string> = {
  PUBLISHED: 'verified',
  REVIEWING: 'pending_actions',
  DRAFT:     'edit_note',
  REJECTED:  'error',
};

const stats = computed(() => {
  const list = knowledgeListData.value ?? [];
  return {
    total:     list.length,
    published: list.filter(k => k.status === 'PUBLISHED').length,
    draft:     list.filter(k => k.status === 'DRAFT').length,
    reviewing: list.filter(k => k.status === 'REVIEWING').length,
  };
});

const filteredList = computed(() => {
  let list = [...(knowledgeListData.value ?? [])];
  if (searchText.value.trim()) {
    const kw = searchText.value.toLowerCase();
    list = list.filter(k => k.title.toLowerCase().includes(kw));
  }
  if (filterCategory.value) {
    list = list.filter(k => k.category === filterCategory.value);
  }
  if (filterStatus.value) {
    list = list.filter(k => k.status === filterStatus.value);
  }
  return list;
});

// --- 分頁 ---
const pageNo = ref(1);
const numberOfRowsPerPage = ref(10);
const displayList = computed(() => {
  const start = (pageNo.value - 1) * numberOfRowsPerPage.value;
  return filteredList.value.slice(start, start + numberOfRowsPerPage.value);
});

// --- 操作邏輯 ---
function goToDetail(id: string) {
  router.push({ name: 'KnowledgeDetail', params: { id } });
}

function handleEditAction(item: any) {
  if (item.status === 'PUBLISHED') {
    // 觸發建立新版本 Modal (待實作)
    console.log('跳轉至詳情頁以建立新版本');
    goToDetail(item.id);
  } else {
    // 尋找該項目的草稿版 ID 並跳轉編輯器
    const draft = item.versions.find((v: any) => v.status === 'DRAFT' || v.status === 'REJECTED');
    if (draft) {
      router.push({ name: 'KnowledgeEditor', params: { knowledgeId: item.id, versionId: draft.id } });
    }
  }
}

// 審核 Drawer
const isReviewDrawerOpen = ref(false);
const reviewKnowledgeId = ref('');
const reviewVersionId = ref('');

function openReviewDrawer(item: any) {
  const reviewingVersion = item.versions.find((v: any) => v.status === 'REVIEWING');
  if (!reviewingVersion) return;
  reviewKnowledgeId.value = item.id;
  reviewVersionId.value = reviewingVersion.id;
  activeMenuId.value = '';
  isReviewDrawerOpen.value = true;
}

// 來源更新 Modal
const isSourceUpdateModalOpen = ref(false);
const sourceUpdateFileId = ref('');

function openSourceUpdateModal(item: any) {
  const staleFileId = item.staleSourceFileIds?.[0];
  if (!staleFileId) return;
  sourceUpdateFileId.value = staleFileId;
  isSourceUpdateModalOpen.value = true;
}

const historyDrawer = ref();
const isHistoryOpen = ref(false);
const selectedId = ref('');

function openHistory(id: string) {
  selectedId.value = id;
  isHistoryOpen.value = true;
}

// --- 比較邏輯 ---
const isCompareOpen = ref(false);
const v1Id = ref('');
const v2Id = ref('');
function handleOpenCompare(knowledgeId: string, versionId: string) {
  const k = knowledgeStore.getKnowledgeById(knowledgeId);
  if (!k) return;
  const idx = k.versions.findIndex(v => v.id === versionId);
  if (idx > 0) {
    v1Id.value = k.versions[idx - 1].id; // 與前一版比
    v2Id.value = versionId;
    isCompareOpen.value = true;
  } else {
    popDialog.alert('這是第一個版本，無前版可比較。');
  }
}

// --- 還原邏輯 ---
const isRestoreOpen = ref(false);
const versionToRestore = ref<any>(null);
function handleOpenRestore(knowledgeId: string, versionId: string) {
  const k = knowledgeStore.getKnowledgeById(knowledgeId);
  versionToRestore.value = k?.versions.find(v => v.id === versionId);
  isRestoreOpen.value = true;
}

function confirmRestore(note: string) {
  const newDraftId = knowledgeStore.restoreToDraft(selectedId.value, versionToRestore.value.id, note);
  if (newDraftId) {
    isRestoreOpen.value = false;
    isHistoryOpen.value = false;
    router.push({ 
      name: 'KnowledgeEditor', 
      params: { knowledgeId: selectedId.value, versionId: newDraftId } 
    }).then(() => {
      popDialog.alert('已建立還原草稿！');
    });
  }
}

function createNewKnowledge() {
  popDialog.alert('功能開發中：將導向至空白條目編輯器');
}

function deleteItem(id: string) {
  popDialog.confirm('確定要刪除此知識條目嗎？這將會刪除所有版本紀錄且無法復原。', () => {
    knowledgeStore.knowledgeList = knowledgeStore.knowledgeList.filter(k => k.id !== id);
  });
}
</script>