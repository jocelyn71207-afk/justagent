<template>
  <div class="oneFileItem">
    <img class="file-icon" :src="htmlIcon" alt="file icon">
    <div class="file-info-box">
      <div class="file-name">xxxxxxx檔案名稱稱稱稱稱稱稱稱稱稱稱稱稱稱稱稱稱稱稱</div>
      <div class="file-size">HTML．{{ formatFileSize(2000) }}
        <!-- 是否已加到畫布 -->
        <span>．已加到畫布</span>
      </div>
    </div>
    <i :class="['material-symbols-outlined file-more-btn', { active: showMoreOptions }]"
      v-tooltip="'more'"
      @click="showMoreOptions = true">more_horiz</i>

    <!-- 更多選項 -->
    <div :class="['more-options-box next-option-box', { show: showMoreOptions}]" ref="moreOptionsBox">
      <div class="option-item">加到共享資源庫</div>
      <div class="option-item">加到左側畫布</div>
      <div class="option-item" @click="deleteFile()">刪除</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { storeToRefs } from "pinia";
  import { useAiviewerStore } from "@/stores/AiViewerStore";
  import { formatFileSize } from '@/utils/file';
  import {initClickOutsideListener } from "@/utils/utils";
  import popDialog from '@/services/popDialog';

  import htmlIcon from '@/assets/fileTypeIcon/html.png';

  // const props = defineProps<{
  //   fileInfo: any,
  // }>();

  const aiviewerStore = useAiviewerStore();
  const { aiViewerBlocks } = storeToRefs(aiviewerStore);

  const showMoreOptions = ref(false);
  const moreOptionsBox = ref<HTMLElement | null>(null);

  const deleteFile = () => {
    // 刪除檔案的邏輯
    popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎?</div>
      <div class="fs-16">如果在此刪除檔案，畫布上的相同檔案也會消失。</div>
    </div>
    `,
      () => {
        // TODO... 執行刪除操作
        console.log('TODO... 檔案已刪除');
      }
    );
  };

  onMounted(() => {
    initClickOutsideListener(moreOptionsBox.value!, () => {
      showMoreOptions.value = false;
    });
  });

</script>
