<template>
  <div class="oneFileItem">
    <div class="file-icon-tile" :class="`file-icon-tile--${meta.color}`">
      <i class="material-symbols-outlined file-type-icon">{{ meta.icon }}</i>
    </div>
    <div class="file-info-box">
      <div class="file-name" v-tooltip="props.fileInfo.name">{{ props.fileInfo.name }}</div>
      <div class="file-size">{{ props.fileInfo.fileType }}．{{ formatFileSize(props.fileInfo.size) }}
        <!-- 是否已加到畫布 -->
        <span v-if="isAddedToCanvas">．已加到畫布</span>
      </div>
    </div>
    <i :class="['material-symbols-outlined file-more-btn', { active: showMoreOptions }]"
      v-tooltip="'more'"
      @click="showMoreOptions = true">more_horiz</i>

    <!-- 更多選項 -->
    <div :class="['more-options-box next-option-box', { show: showMoreOptions}]" ref="moreOptionsBox">
      <div class="option-item">加到共享資源庫</div>
      <div class="option-item" @click="addToCanvas()">加到左側畫布</div>
      <div class="option-item" @click="deleteFile()">刪除</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { storeToRefs } from "pinia";
  import { useAiviewerStore } from "@/stores/AiViewerStore";
  import { formatFileSize, fileTypeMeta } from '@/utils/file';
  import {initClickOutsideListener } from "@/utils/utils";
  import popDialog from '@/services/popDialog';

  const props = defineProps<{
    fileInfo: {
      name: string,
      fileType: string,
      size: number
    },
  }>();

  const aiviewerStore = useAiviewerStore();
  const { aiViewerBlocks } = storeToRefs(aiviewerStore);

  const showMoreOptions = ref(false);
  const moreOptionsBox = ref<HTMLElement | null>(null);

  // 取得檔案圖示：跟共用資源庫同一份 file-icon-tile 語言
  const meta = computed(() => fileTypeMeta(props.fileInfo.fileType));

  // 是否已加到畫布 (依據檔名判斷)
  const isAddedToCanvas = computed(() => {
    return aiViewerBlocks.value.some((block: any) => block.id === props.fileInfo.name || block.blockName === props.fileInfo.name);
  });

  // 加到畫布
  const addToCanvas = () => {
    showMoreOptions.value = false;
    // 直接調用 store 的 sendUserInput 或類似方法來加入區塊
    // 這裡我們暫時模擬透過輸入檔名的方式來加入
    aiviewerStore.userInputModal.msg = props.fileInfo.name;
    aiviewerStore.sendUserInput();
    aiviewerStore.userInputModal.msg = '';
  };

  const deleteFile = () => {
    showMoreOptions.value = false;
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
