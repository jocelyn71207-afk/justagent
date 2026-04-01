<template>
  <div :class="['AiViewerRecord', {
    forUser: props.source.forUser,
    isThinking: props.source.isThinking,
    feedback: props.source.finishResponse
  }]">
    <div class="content-box">
      <!-- AiViewerRecord {{ props.index }}: -->
      <div v-html="displayMsg" v-if="!props.source.isThinking"></div>
      <!-- 檔案項目   TODO... 邏輯還未確定-->
      <oneFileItem v-if="props.source.id === 'id_97'" />
      <!-- 模擬建議追問   TODO... 邏輯還未確定 -->
      <div class="suggest-asking-box" v-if="props.source.finishResponse">
        <div class="fw-600">建議追問</div>
        <div class="suggest-item">
          <span>請問您需要我針對 Goldenstar 系列 生成一份對比圖表，或是查看 Minimel 在不同區域的銷售分佈？</span>
          <i class="material-symbols-outlined">arrow_forward</i>
        </div>
        <div class="suggest-item">
          <span>我已經準備好這份 4 月銷售摘要的 PPT 報告草稿，需要我直接將剛才的數據圖表導出為 PowerPoint 簡報嗎？</span>
          <i class="material-symbols-outlined">arrow_forward</i>
        </div>
      </div>
      <div class="no-user-select" v-if="props.source.isThinking">
        <div>
          <i class="material-symbols-outlined">filter_vintage</i>
          <span class="fs-12 ml-1 fc-grey-1">AI processing</span>
        </div>
        <button class="custom-btn fs-12 mt-1 pt-0 pb-0">取消</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watchEffect } from 'vue';
  import oneFileItem from '@/components/AiViewer/oneFileItem.vue';

  const props = defineProps<{
    source: any,
    index: number,
  }>();

  const displayMsg = ref('');

  // TODO... 之後可能不用這樣使用, 除非有需要一個字一個字的透過外部傳進來
  watchEffect(() => {
    displayMsg.value = props.source.msg;
  });

</script>
