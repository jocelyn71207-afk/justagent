<template>
  <div class="ResourceLibrary views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="views-page-header">
        <h3>
          共用檔案管理
          <div class="secondary-box">{{ teamName }}</div>
        </h3>
        <div class="header-right-box">
          <compListCardSwitch v-model="viewMode"/>
        </div>
      </div>

      <!-- 過濾區域: tabs on left + dropdowns + upload button on right -->
      <div class="resource-filter-row">
        <compTabs
          v-model="filterValue"
          :tabs="filterTabs"
        />
        <div class="filter-right">
          <compDropDown class="mr-2"
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
          <button class="custom-btn custom-main-btn" @click="openBatchUploadFn()">
            <i class="material-symbols-outlined">add</i>
            上傳檔案
          </button>
        </div>
      </div>

      <!-- 查無資料 -->
      <div class="p-5 mt-4 text-center fc-grey-1" v-if="displayList.length === 0">目前沒有資源</div>

      <!-- 卡片樣式列表 -->
      <div class="card-list-box mt-2" v-if="viewMode === 'card' && displayList.length">
        <div class="one-card-box file-card" v-for="(item, i) in displayList" :key="'card' + i"
          @mouseleave="item.showMoreOption = false">

          <!-- 卡片 header: 檔案名稱 + more button -->
          <div class="card-header-box">
            <div class="file-name">
              <template v-if="!nowModifyItem || nowModifyItem.id !== item.id">{{ item.fileName }}</template>
              <input class="custom-input mofidyInput w-100" v-else-if="nowModifyItem.id === item.id"
                :id="'mofidyInput'+item.id"
                v-model="nowModifyItem.fileName"
                @blur="saveModifyFileName()" />
            </div>
            <div class="more-menu-wrap" @click.stop>
              <i class="material-symbols-outlined more-btn" @click="item.showMoreOption = !item.showMoreOption">more_horiz</i>
              <div :class="['next-option-box', { show: item.showMoreOption }]">
                <div class="option-item" @click="editFileName(item)">編輯檔案名稱</div>
                <div class="option-item">下載檔案</div>
                <div class="option-item divider" @click="createKnowledge(item)">建立為知識內容</div>
                <div class="option-item option-item--danger" @click="deleteResource(item)">刪除</div>
              </div>
            </div>
          </div>

          <!-- 卡片 body: 圖片預覽 or OTHER icon or 檔案圖示 -->
          <div class="card-body-box">
            <img v-if="isImageType(item.fileType)" :src="item.fileUrl" alt="" class="preview-img">
            <i v-else-if="item.fileType === 'OTHER'" v-tooltip="'未知的檔案類型'"
              class="material-symbols-outlined other-file-icon">question_mark</i>
            <img v-else :src="getFileTypeIcon(item.fileType)" alt="" class="file-type-icon">
          </div>

          <!-- 卡片 footer: 狀態 + 時間 -->
          <div class="card-footer-box">
            <span :class="['status-badge', `status-badge--${item.status}`]">{{ statusLabel[item.status] }}</span>
            <span class="fc-grey-1">{{ formatDate(item.lastModify) }}</span>
          </div>

        </div>
      </div>

      <!-- 表格樣式列表 -->
      <div class="table-list-box file-list mt-2" v-if="viewMode === 'list' && displayList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>檔案名稱</th>
              <th width="90">檔案格式</th>
              <th width="130">處理方式</th>
              <th width="110">狀態</th>
              <th>最後更新時間</th>
              <th width="60"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in displayList" :key="'list' + i"
              @mouseleave="item.showMoreOption = false;">
              <td>
                <div class="file-icon-box">
                  <img v-if="isImageType(item.fileType)" :src="item.fileUrl" alt="">
                  <i v-else-if="item.fileType === 'OTHER'" v-tooltip="'未知的檔案類型'"
                    class="material-symbols-outlined other-file-icon">question_mark</i>
                  <img v-else :src="getFileTypeIcon(item.fileType)" alt="">
                </div>
                <template v-if="!nowModifyItem || nowModifyItem.id !== item.id">{{ item.fileName }}</template>
                <input class="custom-input mofidyInput w-80" v-else-if="nowModifyItem.id === item.id"
                  :id="'mofidyInput'+item.id"
                  v-model="nowModifyItem.fileName"
                  @blur="saveModifyFileName()" />
              </td>
              <td class="fc-grey-1">{{ item.fileType }}</td>
              <td>
                <span :class="['process-type-badge', item.processType === 'AI_PARSED' ? 'badge--ai' : 'badge--raw']">
                  <i class="material-symbols-outlined">{{ item.processType === 'AI_PARSED' ? 'auto_awesome' : 'save' }}</i>
                  {{ item.processType === 'AI_PARSED' ? '資料入庫型' : '原檔保存型' }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', `status-badge--${item.status}`]">
                  {{ statusLabel[item.status] }}
                </span>
              </td>
              <td class="fc-grey-1">{{ formatDate(item.lastModify) }}</td>
              <td>
                <div class="d-flex">
                  <i class="material-symbols-outlined material-fill more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
                <!-- 更多選項小介面 -->
                <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                  <div class="option-item" @click="editFileName(item)">編輯檔案名稱</div>
                  <div class="option-item">下載檔案</div>
                  <div class="option-item divider" @click="createKnowledge(item)">建立為知識內容</div>
                  <div class="option-item option-item--danger" @click="deleteResource(item)">刪除</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分頁 -->
      <compPagination class="mt-3" v-if="filteredList.length"
        :pageNo="pageNo"
        :numberOfRowsPerPage="numberOfRowsPerPage"
        :totalRows="filteredList.length"
        @change="onPaginationChange"
      />

    </div>
  </div>

  <CreateKnowledgeWizardModal
    v-model="isWizardOpen"
    :file="wizardFile"
    @confirm="handleWizardConfirm"
  />

  <SourceUpdateModal
    v-model="isSourceUpdateModalOpen"
    :file-id="sourceUpdateFileId"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import compTabs from '@/components/compTabs/compTabs.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import popDialog from '@/services/popDialog';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useResourceStore } from '@/stores/resourceStore';
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue';
import SourceUpdateModal from '@/components/Knowledge/SourceUpdateModal.vue';

const router = useRouter();
const knowledgeStore = useKnowledgeStore();
const resourceStore = useResourceStore();

// 知識建立精靈
const isWizardOpen = ref(false);
const wizardFile = ref<{ id: string; fileName: string; fileType: string } | null>(null);

// 來源更新 Modal
const isSourceUpdateModalOpen = ref(false);
const sourceUpdateFileId = ref('');

// 檔案類型圖示 mapping
import pdfIcon from '@/assets/fileTypeIcon/pdf.png';
import pptIcon from '@/assets/fileTypeIcon/ppt.png';
import excelIcon from '@/assets/fileTypeIcon/excel.png';
import htmlIcon from '@/assets/fileTypeIcon/html.png';
import mdIcon from '@/assets/fileTypeIcon/md.png';
import wordIcon from '@/assets/fileTypeIcon/word.png';
import txtIcon from '@/assets/fileTypeIcon/txt.png';
import chartIcon from '@/assets/fileTypeIcon/chart.png';

const route = useRoute();
const rootStore = useRootStore();
const { isEnterAppSearchPage, projectListMode: viewMode } = storeToRefs(rootStore);
const openBatchUploadFn = rootStore.openBatchUploadFn;

const teamId = ref(route.query.teamId);
const teamName = ref(route.query.teamName);
watch(() => route.query, (newQuery) => {
  teamId.value = newQuery.teamId;
  teamName.value = newQuery.teamName;
});

// 過濾條件: 全部 / 資料入庫型 / 原檔保存型
const filterValue = ref('ALL');
const filterTabs = [
  { label: '全部檔案', value: 'ALL' },
  { label: '資料入庫型', value: 'AI_PARSED' },
  { label: '原檔保存型', value: 'RAW' },
];

// 狀態標籤對照
const statusLabel: Record<string, string> = {
  uploading: '上傳中',
  parsing:   '解析中',
  stored:    '已入庫',
  saved:     '已儲存',
  failed:    '失敗',
};

// 過濾條件
const filterTypeValue = ref('') as Ref<string | number>;

// 資源列表來自 resourceStore
const resourceList = computed(() => resourceStore.resourceList);

// 頁碼相關
const pageNo = ref(1);
const numberOfRowsPerPage = ref(10);

// 過濾後的完整列表
const filteredList = computed(() => {
  let list = resourceList.value as any[];
  if (filterValue.value !== 'ALL') {
    list = list.filter(item => item.processType === filterValue.value);
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

// 建立為知識內容：開啟精靈
function createKnowledge(item: any) {
  item.showMoreOption = false;
  wizardFile.value = { id: item.id, fileName: item.fileName, fileType: item.fileType };
  isWizardOpen.value = true;
}

function handleWizardConfirm(data: { template: string; content: string }) {
  if (!wizardFile.value) return;
  const { knowledgeId, versionId } = knowledgeStore.createFromFile({
    fileId: wizardFile.value.id,
    fileName: wizardFile.value.fileName,
    template: data.template,
    content: data.content,
  });
  router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } });
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
