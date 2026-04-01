<template>
  <div class="ResourceLibrary views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="views-page-header">
        <h3>
          共享資源庫
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
                <div class="option-item" >下載檔案</div>
                <div class="option-item" @click="deleteResource(item)">刪除</div>
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

          <!-- 卡片 footer: 上傳者 + 時間 -->
          <div class="card-footer-box">
            {{ item.ownerName }}上傳 · {{ formatDate(item.lastModify) }}
          </div>

        </div>
      </div>

      <!-- 表格樣式列表 -->
      <div class="table-list-box file-list mt-2" v-if="viewMode === 'list' && displayList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>資源名稱</th>
              <th >上傳者</th>
              <th >上傳時間</th>
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
              <td>{{ item.ownerName }}</td>
              <td class="fc-grey-1">{{ formatDate(item.lastModify) }}</td>
              <td>
                <div class="d-flex">
                  <i class="material-symbols-outlined material-fill more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
                <!-- 更多選項小介面 -->
                <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                  <div class="option-item" @click="editFileName(item)">編輯檔案名稱</div>
                  <div class="option-item" >下載檔案</div>
                  <div class="option-item" @click="deleteResource(item)">刪除</div>
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
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import compTabs from '@/components/compTabs/compTabs.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import popDialog from '@/services/popDialog';

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
// route改變時更新teamId和teamName
watch(() => route.query, (newQuery) => {
  teamId.value = newQuery.teamId;
  teamName.value = newQuery.teamName;
});

// 過濾條件: 檔案建立者是 User 還是 AI Agent
const filterValue = ref('ALL');
const filterTabs = [
  { label: '全部', value: 'ALL' },
  { label: 'User', value: 'USER' },
  { label: 'AI Agent', value: 'AI' },
];

// 過濾條件
const filterTypeValue = ref('') as Ref<string | number>;

// 資源列表  TODO... 這裡的資料結構只是測試用，之後要改成後端吐的格式
const resourceList = ref([
  {
    showMoreOption: false,
    id: 'res1',
    fileName: '檔案名稱很長長長長長長長長長長長長.ppt',
    fileUrl: '',
    fileType: 'PPT',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res2',
    fileName: '檔案名稱.pdf',
    fileUrl: '',
    fileType: 'PDF',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res3',
    fileName: '檔案名稱.xlsx',
    fileUrl: '',
    fileType: 'EXCEL',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res4',
    fileName: '檔案名稱.pdf',
    fileUrl: '',
    fileType: 'PDF',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res5',
    fileName: '檔案名稱.html',
    fileUrl: '',
    fileType: 'HTML',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res6',
    fileName: '檔案名稱.png',
    fileUrl: 'https://picsum.photos/410/240.webp?random=10',
    fileType: 'IMAGE',
    creatorType: 'AI',
    ownerId: 'AiAgent1',
    ownerName: 'Ai Agent',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res7',
    fileName: '檔案名稱.png',
    fileUrl: 'https://picsum.photos/410/240.webp?random=11',
    fileType: 'IMAGE',
    creatorType: 'AI',
    ownerId: 'AiAgent1',
    ownerName: 'Ai Agent',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res8',
    fileName: '檔案名稱.md',
    fileUrl: '',
    fileType: 'MD',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res9',
    fileName: '檔案名稱.txt',
    fileUrl: '',
    fileType: 'TXT',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res10',
    fileName: '檔案名稱.docx',
    fileUrl: '',
    fileType: 'WORD',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res11',
    fileName: '檔案名稱.chart',
    fileUrl: '',
    fileType: 'CHART',
    creatorType: 'AI',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
  {
    showMoreOption: false,
    id: 'res12',
    fileName: '未被定義的檔案類型.xyz',
    fileUrl: '',
    fileType: 'OTHER',
    creatorType: 'AI',
    ownerId: 'user1',
    ownerName: 'Lucas',
    lastModify: '2026-02-06 14:15:00',
  },
]);

// 頁碼相關
const pageNo = ref(1);
const numberOfRowsPerPage = ref(10);

// 過濾後的完整列表（供 pagination 計算 totalRows）
const filteredList = computed(() => {
  let list = resourceList.value;
  if (filterValue.value !== 'ALL') {
    list = list.filter((item: any) => item.creatorType === filterValue.value);
  }
  if (filterTypeValue.value) {
    list = list.filter((item: any) => item.fileType === filterTypeValue.value);
  }
  return list;
});

// 篩選條件變動時重置頁碼
watch([filterValue, filterTypeValue], () => {
  pageNo.value = 1;
});

// 依分頁截取當頁資料
const displayList = computed(() => {
  const start = (pageNo.value - 1) * numberOfRowsPerPage.value;
  return filteredList.value.slice(start, start + numberOfRowsPerPage.value);
});

// 分頁變更時同步更新頁碼與每頁筆數
function onPaginationChange(payload: PaginationChangePayload) {
  pageNo.value = payload.pageNo;
  // numberOfRowsPerPage.value = payload.numberOfRowsPerPage;
}

// 判斷是否為圖片類型 (對應 FileType 的 'IMAGE')
function isImageType(fileType: string) {
  return fileType.toUpperCase() === 'IMAGE';
}

// 取得檔案類型圖示 (使用 FileType 定義: 'IMAGE'|'MD'|'HTML'|'TXT'|'PDF'|'EXCEL'|'CHART'|'PPT'|'WORD'|'OTHER')
function getFileTypeIcon(fileType: string) {
  const map: Record<string, string> = {
    PDF: pdfIcon,
    PPT: pptIcon,
    EXCEL: excelIcon,
    HTML: htmlIcon,
    MD: mdIcon,
    WORD: wordIcon,
    TXT: txtIcon,
    CHART: chartIcon,
  };
  return map[fileType.toUpperCase()] || txtIcon;
}

// 格式化日期字串為 "YYYY年MM月DD日 HH:mm" 格式
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 編輯檔案名稱
const nowModifyItem = ref(null as any);
function editFileName(item: any) {
  item.showMoreOption = false;
  console.log('TODO... 編輯檔案名稱', item);
  nowModifyItem.value = { ...item }; // 開一個新的物件來綁定輸入框，避免直接修改到列表資料
  nowModifyItem.value.catch = JSON.parse(JSON.stringify(item)); // 深拷貝，確保內部物件也被複製
  // 編輯狀態下自動聚焦並將游標移到文字最後
  nextTick(() => {
    const inputEl = document.getElementById('mofidyInput' + item.id) as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      // 將游標移到文字最後
      const length = inputEl.value.length;
      inputEl.setSelectionRange(length, length);
    }
  });
}
function saveModifyFileName() {
  // 檢查名稱是否有修改，且不為空
  if (!nowModifyItem.value.fileName.trim()) {
    popDialog.alert('檔案名稱不能為空');
    nowModifyItem.value = null;
    return;
  }
  if (nowModifyItem.value.fileName === nowModifyItem.value.catch.fileName) {
    nowModifyItem.value = null; // 沒有修改，直接退出編輯狀態
    return;
  }
  // TODO... ajax
  console.log('TODO...儲存檔案名稱', nowModifyItem.value.fileName);
  nowModifyItem.value = null;
  // 重新撈取列表資料...
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
    resourceList.value = resourceList.value.filter(r => r.id !== item.id);
  });
}
</script>
