<template>
  <div class="FullAiViewerBlockBox" @touchmove="stopTouchpadZoomEvent($event)">
    <div class="fullAiViewer-header-box">
      <span>{{ blockName }}</span>

      <i class="material-symbols-outlined close-btn" v-tooltip.left="'縮小'"
        @click="fullAiViewerBlockId = null">fullscreen_exit</i>
    </div>
    <div ref="fullAiViewerContentBox" v-if="blockData"
    :class="['fullAiViewer-content-box']" >

      <!-- 圖片 檢視器 -->
      <imageViewBox v-if="blockData.blockType === 'IMAGE'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

      <!-- TXT 檢視器 -->
      <txtViewBox v-if="blockData.blockType === 'TXT'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

      <!-- HTML 檢視器 -->
      <htmlFileViewBox v-if="blockData.blockType === 'HTML'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

      <!-- Excel 檢視器 -->
      <excelViewBox v-if="blockData.blockType === 'EXCEL'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData"
        :contentBoxDOM="fullAiViewerContentBox || null"/>

      <!-- PDF 檢視器 -->
      <pdfViewBox v-if="blockData.blockType === 'PDF'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

      <!-- MD 檢視器 -->
      <markdownViewBox v-if="blockData.blockType === 'MD'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { stopTouchpadZoomEvent } from '@/utils/utils';
import pdfViewBox from '@/components/AiViewer/viewBlock/pdfViewBox.vue';
import excelViewBox from '@/components/AiViewer/viewBlock/excelViewBox.vue';
import txtViewBox from '@/components/AiViewer/viewBlock/txtViewBox.vue';
import htmlFileViewBox from '@/components/AiViewer/viewBlock/htmlFileViewBox.vue';
import imageViewBox from '@/components/AiViewer/viewBlock/imageViewBox.vue';
import markdownViewBox from '@/components/AiViewer/viewBlock/markdownViewBox.vue';

const aiviewerStore = useAiviewerStore();
const { fullAiViewerBlockId } = storeToRefs(aiviewerStore);  // 單一小區塊進入放大滿版
const { aiViewerBlocks } = storeToRefs(aiviewerStore);       // 使用者使用的區塊

const fullAiViewerContentBox = ref<HTMLElement|null>(null);
const blockData = ref(null) as Ref<any>;
const blockName = ref('');

aiViewerBlocks.value.forEach(item => {
  if (item.id === fullAiViewerBlockId.value) {
    blockData.value = item.data;
    blockName.value = item.blockName;
  }
});
</script>
