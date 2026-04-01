<template>
  <div :class="['fileListArea rightCommonArea', { show: isShowFileListView }]">
    <div class="list-header-box">
      專案檔案清單
      <i class="material-symbols-outlined close-btn" @click="isShowFileListView = false">close</i>
    </div>

    <div class="list-search-box">
      <i class="material-symbols-outlined left-icon fs-19">search</i>
      <input type="text" class="custom-input fs-14" placeholder="搜尋專案檔案" />
      <i class="material-symbols-outlined more-btn" @click="showSortOptionsBox = true">more_horiz</i>
      <!-- 排序選項 -->
      <div :class="['sortOptions-box next-option-box', { show: showSortOptionsBox }]" ref="sortOptionsBox">
        <div class="option-item">以建立時間排序</div>
        <div class="option-item">以檔案類別排序</div>
      </div>
    </div>

    <div class="list-scroll-box">
      <oneFileItem class="one-file-item"
        v-for="(item, index) in 100" :key="index" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { storeToRefs } from 'pinia';
import { httpService } from '@/services/http';
import popDialog from '@/services/popDialog';
import oneFileItem from '@/components/AiViewer/oneFileItem.vue';
import {initClickOutsideListener } from "@/utils/utils";

const aiviewerStore = useAiviewerStore();
const { aiViewerBlocks, isShowFileListView } = storeToRefs(aiviewerStore);

const showSortOptionsBox = ref(false);
const sortOptionsBox = ref<HTMLElement | null>(null);

onMounted(() => {
  initClickOutsideListener(sortOptionsBox.value!, () => {
    showSortOptionsBox.value = false;
  });
});

</script>
