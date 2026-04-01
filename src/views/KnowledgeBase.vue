<template>
  <div class="KnowledgeBase views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="views-page-header">
        <h3>
          知識庫管理
          <div class="secondary-box">{{ teamName }}</div>
        </h3>
        <div class="header-right-box">
          <div class="search-box">
            <i class="material-symbols-outlined">search</i>
            <input class="custom-input" type="text" v-model="searchText" placeholder="搜尋知識條目" />
          </div>
          <button class="custom-btn custom-main-btn" @click="addEntry">
            <i class="material-symbols-outlined">add</i>
            新增條目
          </button>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--color-main-4)">
            <i class="material-symbols-outlined" style="color: var(--color-main-1)">menu_book</i>
          </div>
          <div>
            <div class="stat-number">{{ knowledgeList.length }}</div>
            <div class="stat-label">總條目數</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <i class="material-symbols-outlined">check_circle</i>
          </div>
          <div>
            <div class="stat-number">{{ publishedCount }}</div>
            <div class="stat-label">已發布</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--yellow">
            <i class="material-symbols-outlined">edit_note</i>
          </div>
          <div>
            <div class="stat-number">{{ draftCount }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <i class="material-symbols-outlined">pending</i>
          </div>
          <div>
            <div class="stat-number">{{ pendingCount }}</div>
            <div class="stat-label">待審核</div>
          </div>
        </div>
      </div>

      <!-- 過濾列 -->
      <div class="filter-row">
        <compDropDown
          :options="categoryOptions"
          :show-search="false"
          :showClearTriggerIcon="false"
          :default-value="''"
          :width="'160px'"
          placeholder="所有分類"
          @select="(item) => { filterCategory = item.value; }"
        />
        <compDropDown
          class="ml-2"
          :options="statusOptions"
          :show-search="false"
          :showClearTriggerIcon="false"
          :default-value="''"
          :width="'140px'"
          placeholder="所有狀態"
          @select="(item) => { filterStatus = item.value; }"
        />
      </div>

      <!-- 查無資料 -->
      <div class="p-5 mt-4 text-center fc-grey-1" v-if="displayList.length === 0">
        目前沒有知識條目
      </div>

      <!-- 表格 -->
      <div class="table-box mt-2" v-if="displayList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>標題</th>
              <th width="120">分類</th>
              <th>標籤</th>
              <th width="90">狀態</th>
              <th width="160">最後更新</th>
              <th width="60"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in displayList" :key="item.id"
              @mouseleave="item.showMoreOption = false">
              <td>
                <div class="entry-title">{{ item.title }}</div>
                <div class="entry-id">ID: {{ item.id }}</div>
              </td>
              <td>
                <span class="category-tag">{{ item.category }}</span>
              </td>
              <td>
                <div class="tags-box">
                  <span class="tag-chip" v-for="tag in item.tags" :key="tag">{{ tag }}</span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', `status-badge--${item.status}`]">
                  <i class="material-symbols-outlined">{{ statusIconMap[item.status] }}</i>
                  {{ statusLabelMap[item.status] }}
                </span>
              </td>
              <td class="fc-grey-1">
                <div>{{ formatDate(item.lastModify) }}</div>
                <div class="entry-author">{{ item.editorName }}</div>
              </td>
              <td>
                <div class="d-flex">
                  <i class="material-symbols-outlined material-fill more-btn"
                    @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
                <div :class="['next-option-box', { show: item.showMoreOption }]" @click.stop>
                  <div class="option-item" @click="editEntry(item)">編輯</div>
                  <div class="option-item" @click="togglePublish(item)">
                    {{ item.status === 'published' ? '取消發布' : '發布' }}
                  </div>
                  <div class="option-item option-item--danger" @click="deleteEntry(item)">刪除</div>
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
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import popDialog from '@/services/popDialog';

const route = useRoute();
const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const teamName = ref(route.query.teamName);
watch(() => route.query, (newQuery) => {
  teamName.value = newQuery.teamName;
});

const searchText = ref('');
const filterCategory = ref('');
const filterStatus = ref('');

const categoryOptions = [
  { name: '所有分類', value: '' },
  { name: '產品知識', value: '產品知識' },
  { name: '售後服務', value: '售後服務' },
  { name: '退換貨政策', value: '退換貨政策' },
  { name: '門市作業', value: '門市作業' },
  { name: '促銷活動', value: '促銷活動' },
];

const statusOptions = [
  { name: '所有狀態', value: '' },
  { name: '已發布', value: 'published' },
  { name: '草稿', value: 'draft' },
  { name: '待審核', value: 'pending' },
];

const statusLabelMap: Record<string, string> = {
  published: '已發布',
  draft: '草稿',
  pending: '待審核',
};

const statusIconMap: Record<string, string> = {
  published: 'check_circle',
  draft: 'edit_note',
  pending: 'pending',
};

type KnowledgeStatus = 'published' | 'draft' | 'pending';

interface KnowledgeEntry {
  showMoreOption: boolean;
  id: string;
  title: string;
  category: string;
  tags: string[];
  status: KnowledgeStatus;
  editorName: string;
  lastModify: string;
}

const knowledgeList = ref<KnowledgeEntry[]>([
  {
    showMoreOption: false,
    id: 'KNW-2024-0001',
    title: '產品保固政策說明',
    category: '售後服務',
    tags: ['保固', '維修', '政策'],
    status: 'published',
    editorName: 'Lucas',
    lastModify: '2026-03-20 14:30:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0002',
    title: '退換貨流程與注意事項',
    category: '退換貨政策',
    tags: ['退貨', '換貨', '流程'],
    status: 'published',
    editorName: 'Emily',
    lastModify: '2026-03-18 09:15:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0003',
    title: '2026春季新品規格說明',
    category: '產品知識',
    tags: ['新品', '規格', 'Spring 2026'],
    status: 'published',
    editorName: 'Lucas',
    lastModify: '2026-03-15 11:00:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0004',
    title: '門市 POS 系統操作手冊',
    category: '門市作業',
    tags: ['POS', '作業流程', '門市'],
    status: 'published',
    editorName: 'Kevin',
    lastModify: '2026-03-10 16:45:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0005',
    title: '會員點數兌換辦法',
    category: '促銷活動',
    tags: ['會員', '點數', '兌換'],
    status: 'published',
    editorName: 'Emily',
    lastModify: '2026-03-08 10:30:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0006',
    title: '電商平台訂單異常處理 SOP',
    category: '門市作業',
    tags: ['訂單', '異常', 'SOP', '電商'],
    status: 'pending',
    editorName: 'Kevin',
    lastModify: '2026-03-25 13:20:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0007',
    title: '跑鞋選購指南（2026版）',
    category: '產品知識',
    tags: ['跑鞋', '選購', '指南'],
    status: 'pending',
    editorName: 'Lucas',
    lastModify: '2026-03-28 17:00:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0008',
    title: '夏季促銷活動說明草案',
    category: '促銷活動',
    tags: ['促銷', '夏季', '草案'],
    status: 'draft',
    editorName: 'Emily',
    lastModify: '2026-03-30 09:00:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0009',
    title: '客戶常見問題 FAQ',
    category: '售後服務',
    tags: ['FAQ', '客服', '常見問題'],
    status: 'draft',
    editorName: 'Kevin',
    lastModify: '2026-03-29 15:10:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0010',
    title: '商品尺寸對照表',
    category: '產品知識',
    tags: ['尺寸', '對照表'],
    status: 'published',
    editorName: 'Lucas',
    lastModify: '2026-03-05 14:00:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0011',
    title: '門市庫存盤點作業規範',
    category: '門市作業',
    tags: ['庫存', '盤點', '規範'],
    status: 'published',
    editorName: 'Kevin',
    lastModify: '2026-02-28 10:00:00',
  },
  {
    showMoreOption: false,
    id: 'KNW-2024-0012',
    title: '線上下單退款時效說明',
    category: '退換貨政策',
    tags: ['退款', '時效', '線上'],
    status: 'draft',
    editorName: 'Emily',
    lastModify: '2026-03-31 08:30:00',
  },
]);

const publishedCount = computed(() => knowledgeList.value.filter(i => i.status === 'published').length);
const draftCount = computed(() => knowledgeList.value.filter(i => i.status === 'draft').length);
const pendingCount = computed(() => knowledgeList.value.filter(i => i.status === 'pending').length);

const pageNo = ref(1);
const numberOfRowsPerPage = ref(10);

const filteredList = computed(() => {
  let list = knowledgeList.value;
  if (searchText.value.trim()) {
    const kw = searchText.value.toLowerCase();
    list = list.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      item.tags.some(t => t.toLowerCase().includes(kw))
    );
  }
  if (filterCategory.value) {
    list = list.filter(item => item.category === filterCategory.value);
  }
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value);
  }
  return list;
});

watch([searchText, filterCategory, filterStatus], () => {
  pageNo.value = 1;
});

const displayList = computed(() => {
  const start = (pageNo.value - 1) * numberOfRowsPerPage.value;
  return filteredList.value.slice(start, start + numberOfRowsPerPage.value);
});

function onPaginationChange(payload: PaginationChangePayload) {
  pageNo.value = payload.pageNo;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addEntry() {
  console.log('TODO... 新增知識條目');
}

function editEntry(item: KnowledgeEntry) {
  item.showMoreOption = false;
  console.log('TODO... 編輯知識條目', item.id);
}

function togglePublish(item: KnowledgeEntry) {
  item.showMoreOption = false;
  item.status = item.status === 'published' ? 'draft' : 'published';
}

function deleteEntry(item: KnowledgeEntry) {
  item.showMoreOption = false;
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">刪除後將無法復原。</div>
    </div>
  `,
  () => {
    knowledgeList.value = knowledgeList.value.filter(r => r.id !== item.id);
  });
}
</script>