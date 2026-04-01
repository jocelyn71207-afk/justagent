<template>
  <div class="compPagination" v-if="totalPages > 0">
    <!-- 左側資訊 -->
    <div class="compPagination-info" v-if="showLeftInfo">
      顯示第 <span class="compPagination-info-highlight">{{ startRow }}</span> -
      <span class="compPagination-info-highlight">{{ endRow }}</span> 筆，共
      <span class="compPagination-info-highlight">{{ totalRows }}</span> 筆
    </div>

    <!-- 頁碼區塊 -->
    <div class="compPagination-pages">
      <!-- 上一頁 -->
      <button
        class="compPagination-btn compPagination-btn--arrow"
        :disabled="pageNo <= 1"
        @click="goToPage(pageNo - 1)"
        title="上一頁"
      >
        <i class="material-symbols-rounded">chevron_left</i>
      </button>

      <!-- 頁碼按鈕 -->
      <template v-for="item in pageItems" :key="item.key">
        <span v-if="item.type === 'ellipsis'" class="compPagination-ellipsis">…</span>
        <button
          v-else
          class="compPagination-btn compPagination-btn--page"
          :class="{ 'is-active': item.page === pageNo }"
          @click="goToPage(item.page!)"
        >
          {{ item.page }}
        </button>
      </template>

      <!-- 下一頁 -->
      <button
        class="compPagination-btn compPagination-btn--arrow"
        :disabled="pageNo >= totalPages"
        @click="goToPage(pageNo + 1)"
        title="下一頁"
      >
        <i class="material-symbols-rounded">chevron_right</i>
      </button>
    </div>

    <!-- 右側：每頁筆數 & 跳頁 -->
    <div class="compPagination-right" v-if="showRightControls">
      <label class="compPagination-per-page">
        每頁
        <select
          class="custom-select compPagination-select"
          :value="numberOfRowsPerPage"
          @change="onPerPageChange"
        >
          <option v-for="n in perPageOptionsList" :key="n" :value="n">{{ n }} 筆</option>
        </select>
      </label>
      <label class="compPagination-jump">
        前往
        <input
          class="custom-input compPagination-jump-input"
          type="number"
          :min="1"
          :max="totalPages"
          :value="jumpPage"
          @change="onJumpChange"
        />
        頁
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type PageItem =
  | { type: 'page'; page: number; key: string }
  | { type: 'ellipsis'; key: string; page?: undefined };

export type PaginationChangePayload = {
  pageNo: number;
  numberOfRowsPerPage: number;
};

const props = defineProps<{
  /** 當前頁碼 */
  pageNo: number;
  /** 每頁顯示筆數 */
  numberOfRowsPerPage: number;
  /** 資料總筆數（篩選結果） */
  totalRows: number;
  /** 每頁顯示筆數 的選項，預設 [10, 20, 50, 100] */
  perPageOptions?: number[];
  /// 是否隱藏左側資訊區塊，預設 false
  showLeftInfo?: boolean;
  // 是否隱藏右側控制區塊（每頁筆數選擇 & 跳頁），預設 false
  showRightControls?: boolean;
}>();

const emit = defineEmits<{
  (e: 'change', payload: PaginationChangePayload): void;
}>();

const perPageOptionsList = computed(() => props.perPageOptions ?? [10, 20, 50, 100]);
const showLeftInfo = computed(() => props.showLeftInfo ?? true);
const showRightControls = computed(() => props.showRightControls ?? true);

const totalPages = computed(() =>
  props.totalRows > 0 ? Math.ceil(props.totalRows / props.numberOfRowsPerPage) : 0,
);

const startRow = computed(() => {
  if (props.totalRows === 0) return 0;
  return (props.pageNo - 1) * props.numberOfRowsPerPage + 1;
});

const endRow = computed(() =>
  Math.min(props.pageNo * props.numberOfRowsPerPage, props.totalRows),
);

const pageItems = computed<PageItem[]>(() => {
  const total = totalPages.value;
  const current = props.pageNo;
  const items: PageItem[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      items.push({ type: 'page', page: i, key: `p${i}` });
    }
    return items;
  }

  const range = new Set<number>();
  range.add(1);
  range.add(total);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.add(i);
  }

  const sorted = Array.from(range).sort((a, b) => a - b);
  for (let idx = 0; idx < sorted.length; idx++) {
    const page = sorted[idx];
    if (idx > 0 && page - sorted[idx - 1] > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${idx}` });
    }
    items.push({ type: 'page', page, key: `p${page}` });
  }

  return items;
});

const jumpPage = ref(props.pageNo);

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.pageNo) return;
  jumpPage.value = page;
  emit('change', { pageNo: page, numberOfRowsPerPage: props.numberOfRowsPerPage });
};

const onPerPageChange = (event: Event) => {
  const value = Number((event.target as HTMLSelectElement).value);
  jumpPage.value = 1;
  emit('change', { pageNo: 1, numberOfRowsPerPage: value });
};

const onJumpChange = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  const clamped = Math.max(1, Math.min(totalPages.value, Math.floor(value)));
  (event.target as HTMLInputElement).value = String(clamped);
  goToPage(clamped);
};
</script>
