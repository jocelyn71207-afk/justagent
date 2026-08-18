<template>
  <div class="ResourceLibrary views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">共用檔案管理</div>
          <div class="banner-sub">{{ displayList.length }} files</div>
        </div>
        <div class="banner-right">
          <compListCardSwitch v-model="viewMode"/>
          <button class="custom-btn custom-main-btn" @click="openBatchUploadFn()">
            <i class="material-symbols-outlined">add</i>
            上傳檔案
          </button>
        </div>
      </div>

      <!-- 過濾區域: tabs on left + type dropdown on right -->
      <div class="resource-filter-row">
        <compTabs
          v-model="filterValue"
          :tabs="filterTabs"
        />
        <div class="filter-right">
          <compDropDown
            :options="[
              { name: '所有檔案類型', value: '' },
              { name: 'PDF', value: 'PDF' },
              { name: 'PPT', value: 'PPT' },
              { name: 'Excel', value: 'EXCEL' },
              { name: 'Image', value: 'IMAGE' },
              { name: 'HTML', value: 'HTML' },
              { name: 'Word', value: 'WORD' },
              { name: 'Markdown', value: 'MD' },
              { name: '文字檔', value: 'TXT' },
              { name: 'Chart', value: 'CHART' },
              { name: '其他', value: 'OTHER' },
            ]"
            :show-search="false"
            :showClearTriggerIcon="false"
            :default-value="''"
            :width="'170px'"
            placeholder="所有檔案類型"
            @select="(item) => { filterTypeValue = item.value; }"
          />
        </div>
      </div>

      <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
      <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
      <template v-else>

        <!-- 查無資料 -->
        <div class="p-5 mt-4 text-center fc-grey-1" v-if="displayList.length === 0">目前沒有資源</div>

        <!-- 卡片樣式列表：頂部狀態色條（依 status，一眼看出哪些檔案還在
             處理中/失敗，不用點開才知道）＋放大的圖示/縮圖區塊＋footer
             改成「上傳者/時間」當主角、處理方式退成安靜的小圖示 -->
        <div class="card-list-box mt-2" v-if="viewMode === 'card' && displayList.length">
          <div class="one-card-box file-card" v-for="(item, i) in displayList" :key="'card' + i"
            @mouseleave="item.showMoreOption = false">

            <div :class="['file-status-strip', `strip--${item.status}`]"></div>

            <!-- 卡片 header: 檔案名稱 + more button -->
            <div class="card-header-box">
              <div class="file-name">
                <template v-if="!nowModifyItem || nowModifyItem.id !== item.id">
                  {{ item.fileName }}
                  <span v-if="item.knowledgeId" class="knowledge-badge">已轉為知識</span>
                </template>
                <input class="custom-input mofidyInput w-100" v-else-if="nowModifyItem.id === item.id"
                  :id="'mofidyInput'+item.id"
                  v-model="nowModifyItem.fileName"
                  @blur="saveModifyFileName()" />
              </div>
              <div class="more-menu-wrap" @click.stop>
                <button type="button" class="icon-btn more-btn" aria-label="更多選項" @click="item.showMoreOption = !item.showMoreOption"><i class="material-symbols-outlined">more_horiz</i></button>
                <div :class="['next-option-box', { show: item.showMoreOption }]">
                  <div class="option-item" @click="editFileName(item)">編輯檔案名稱</div>
                  <div class="option-item">下載檔案</div>
                  <div class="option-item divider" @click="createKnowledge(item)">建立為知識內容</div>
                  <div class="option-item option-item--danger" @click="deleteResource(item)">刪除</div>
                </div>
              </div>
            </div>

            <!-- 卡片 body: 圖片維持完整沉浸式預覽；非圖片檔案的圖示放大到
                 接近縮圖的視覺份量，不再是小小一顆浮在空白正中間 -->
            <div class="card-body-box">
              <img v-if="isImageType(item.fileType)" :src="item.fileUrl" alt="" class="preview-img">
              <div v-else class="file-icon-tile">
                <i v-if="item.fileType === 'OTHER'" v-tooltip="'未知的檔案類型'"
                  class="material-symbols-outlined other-file-icon">question_mark</i>
                <img v-else :src="getFileTypeIcon(item.fileType)" alt="" class="file-type-icon">
              </div>
            </div>

            <!-- 卡片 footer：上傳者/時間是主角（放大頭像），處理方式退成
                 安靜的小圖示（滑鼠停留才看到文字說明），狀態異常時才用
                 顯眼的徽章——不是三個東西一起搶視覺重量 -->
            <div class="card-footer-box">
              <span class="file-owner">
                <span class="file-owner-avatar" :style="{ background: avatarColor(item.ownerId) }">{{ item.ownerName.charAt(0) }}</span>
                {{ item.ownerName }}
              </span>
              <span class="file-footer-right">
                <i class="material-symbols-outlined file-process-icon"
                  v-tooltip="item.processType === 'AI_PARSED' ? '資料入庫型' : '原檔保存型'">
                  {{ item.processType === 'AI_PARSED' ? 'auto_awesome' : 'save' }}
                </i>
                <span v-if="item.status !== 'saved' && item.status !== 'stored'"
                  :class="['status-badge', `status-badge--${item.status}`]">
                  {{ fileStatusLabel(item.status) }}
                </span>
                <span class="file-date">{{ formatDate(item.lastModify) }}</span>
              </span>
            </div>

          </div>
        </div>

        <!-- 列表樣式：從原本的原生表格改成跟 Skill 頁面同一套「橫向長條」
             視覺語言（獨立成一顆顆有邊框/hover 反應的列，不是死板的表格
             格線），左側一樣有狀態色條，補上傳者頭像，資訊層級更清楚 -->
        <div class="file-row-list mt-2" v-if="viewMode === 'list' && displayList.length">
          <div class="file-row" v-for="(item, i) in displayList" :key="'list' + i"
            @mouseleave="item.showMoreOption = false;">

            <div :class="['file-status-strip', 'file-status-strip--row', `strip--${item.status}`]"></div>

            <div class="file-row-icon">
              <img v-if="isImageType(item.fileType)" :src="item.fileUrl" alt="">
              <i v-else-if="item.fileType === 'OTHER'" v-tooltip="'未知的檔案類型'"
                class="material-symbols-outlined other-file-icon">question_mark</i>
              <img v-else :src="getFileTypeIcon(item.fileType)" alt="">
            </div>

            <div class="file-row-name">
              <template v-if="!nowModifyItem || nowModifyItem.id !== item.id">
                {{ item.fileName }}
                <span v-if="item.knowledgeId" class="knowledge-badge">已轉為知識</span>
              </template>
              <input class="custom-input mofidyInput w-80" v-else-if="nowModifyItem.id === item.id"
                :id="'mofidyInput'+item.id"
                v-model="nowModifyItem.fileName"
                @blur="saveModifyFileName()" />
            </div>

            <i class="material-symbols-outlined file-process-icon"
              v-tooltip="item.processType === 'AI_PARSED' ? '資料入庫型' : '原檔保存型'">
              {{ item.processType === 'AI_PARSED' ? 'auto_awesome' : 'save' }}
            </i>

            <span v-if="item.status !== 'saved' && item.status !== 'stored'"
              :class="['status-badge', `status-badge--${item.status}`]">
              {{ fileStatusLabel(item.status) }}
            </span>

            <span class="file-owner file-row-owner">
              <span class="file-owner-avatar" :style="{ background: avatarColor(item.ownerId) }">{{ item.ownerName.charAt(0) }}</span>
              {{ item.ownerName }}
            </span>

            <span class="file-row-date">{{ formatDate(item.lastModify) }}</span>

            <div class="more-menu-wrap" @click.stop>
              <button type="button" class="icon-btn more-btn" aria-label="更多選項" @click="item.showMoreOption = !item.showMoreOption"><i class="material-symbols-outlined material-fill">more_horiz</i></button>
              <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                <div class="option-item" @click="editFileName(item)">編輯檔案名稱</div>
                <div class="option-item">下載檔案</div>
                <div class="option-item divider" @click="createKnowledge(item)">建立為知識內容</div>
                <div class="option-item option-item--danger" @click="deleteResource(item)">刪除</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分頁 -->
        <compPagination class="mt-3" v-if="filteredList.length"
          :pageNo="pageNo"
          :numberOfRowsPerPage="numberOfRowsPerPage"
          :totalRows="filteredList.length"
          @change="onPaginationChange"
        />

      </template>

    </div>
  </div>

  <CreateKnowledgeWizardModal
    v-model="isWizardOpen"
    :prefill-file="wizardFile"
    @done="({ fileId, knowledgeId }) => resourceStore.markAsKnowledge(fileId, knowledgeId)"
  />

  <SourceUpdateModal
    v-model="isSourceUpdateModalOpen"
    :file-id="sourceUpdateFileId"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import type { Ref } from 'vue';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import compTabs from '@/components/compTabs/compTabs.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import popDialog from '@/services/popDialog';
import { useResourceStore } from '@/stores/resourceStore';
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue';
import SourceUpdateModal from '@/components/Knowledge/SourceUpdateModal.vue';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';

const resourceStore = useResourceStore();

const {
  data: resourceListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => resourceStore.resourceList);

// 知識建立精靈
const isWizardOpen = ref(false);
const wizardFile = ref<{ fileId: string; fileName: string } | undefined>(undefined);
watch(isWizardOpen, (open) => { if (!open) wizardFile.value = undefined; });

// 來源更新 Modal
const isSourceUpdateModalOpen = ref(false);
const sourceUpdateFileId = ref('');

// 檔案類型圖示 mapping
import pdfIcon from '@/assets/fileTypeIcon/pdf.svg';
import pptIcon from '@/assets/fileTypeIcon/ppt.svg';
import excelIcon from '@/assets/fileTypeIcon/excel.svg';
import htmlIcon from '@/assets/fileTypeIcon/html.svg';
import mdIcon from '@/assets/fileTypeIcon/md.svg';
import wordIcon from '@/assets/fileTypeIcon/word.svg';
import txtIcon from '@/assets/fileTypeIcon/txt.svg';
import chartIcon from '@/assets/fileTypeIcon/chart.svg';

const rootStore = useRootStore();
const { isEnterAppSearchPage, projectListMode: viewMode } = storeToRefs(rootStore);
const openBatchUploadFn = rootStore.openBatchUploadFn;

// 過濾條件: 全部 / 用戶上傳 / Agent 上傳
const filterValue = ref('ALL');
const filterTabs = [
  { label: '全部', value: 'ALL' },
  { label: '用戶上傳', value: 'USER' },
  { label: 'Agent 上傳', value: 'AI' },
];


// 過濾條件
const filterTypeValue = ref('') as Ref<string | number>;

// 資源列表來自 resourceStore (透過 useApiCall 管理 loading/error 狀態)
const resourceList = computed(() => resourceListData.value ?? []);

// 頁碼相關
const pageNo = ref(1);
const numberOfRowsPerPage = ref(10);

// 過濾後的完整列表
const filteredList = computed(() => {
  let list = resourceList.value as any[];
  if (filterValue.value !== 'ALL') {
    list = list.filter(item => item.creatorType === filterValue.value);
  }
  if (filterTypeValue.value) {
    list = list.filter(item => item.fileType === filterTypeValue.value);
  }
  return list;
});

watch([filterValue, filterTypeValue], () => {
  pageNo.value = 1;
});

const displayList = computed(() => {
  const start = (pageNo.value - 1) * numberOfRowsPerPage.value;
  return filteredList.value.slice(start, start + numberOfRowsPerPage.value);
});

function onPaginationChange(payload: PaginationChangePayload) {
  pageNo.value = payload.pageNo;
}

function isImageType(fileType: string) {
  return fileType.toUpperCase() === 'IMAGE';
}

function getFileTypeIcon(fileType: string) {
  const map: Record<string, string> = {
    PDF: pdfIcon, PPT: pptIcon, EXCEL: excelIcon, HTML: htmlIcon,
    MD: mdIcon, WORD: wordIcon, TXT: txtIcon, CHART: chartIcon,
  };
  return map[fileType.toUpperCase()] || txtIcon;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 檔案處理狀態文字：只有「上傳中/解析中/失敗」這幾個需要立刻被看到的
// 過渡/異常狀態才會顯示徽章（saved/stored 是穩定的完成狀態，不需要提醒）
const FILE_STATUS_LABELS: Record<string, string> = {
  uploading: '上傳中',
  parsing: '解析中',
  stored: '已入庫',
  saved: '已儲存',
  failed: '處理失敗',
};
function fileStatusLabel(status: string): string {
  return FILE_STATUS_LABELS[status] ?? status;
}

// 上傳者頭像色：跟全站其他地方（協作者頭像/團隊圖示）同一組去飽和調性，
// 用 ownerId 雜湊挑色，同一個人在同一次載入裡顏色一致
const AVATAR_COLORS = ['#00A078', '#5B7B8C', '#8A6D3B', '#6B5B95', '#B5654A'];
function avatarColor(ownerId: string): string {
  const hash = ownerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// 編輯檔案名稱
const nowModifyItem = ref(null as any);
function editFileName(item: any) {
  item.showMoreOption = false;
  nowModifyItem.value = { ...item };
  nowModifyItem.value.catch = JSON.parse(JSON.stringify(item));
  nextTick(() => {
    const inputEl = document.getElementById('mofidyInput' + item.id) as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      const length = inputEl.value.length;
      inputEl.setSelectionRange(length, length);
    }
  });
}
function saveModifyFileName() {
  if (!nowModifyItem.value.fileName.trim()) {
    popDialog.alert('檔案名稱不能為空');
    nowModifyItem.value = null;
    return;
  }
  if (nowModifyItem.value.fileName === nowModifyItem.value.catch.fileName) {
    nowModifyItem.value = null;
    return;
  }
  console.log('TODO...儲存檔案名稱', nowModifyItem.value.fileName);
  nowModifyItem.value = null;
}

// 建立為知識內容：預填檔案並開啟精靈
function createKnowledge(item: any) {
  item.showMoreOption = false;
  wizardFile.value = { fileId: item.id, fileName: item.fileName };
  isWizardOpen.value = true;
}

// 刪除資源
function deleteResource(item: any) {
  item.showMoreOption = false;
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">刪除後將無法復原。</div>
    </div>
  `,
  () => {
    resourceStore.deleteFile(item.id);
  });
}
</script>
