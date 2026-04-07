<template>
  <div :class="['AiViewerRecord', {
    forUser: props.source.forUser,
    isThinking: props.source.isThinking,
    feedback: props.source.finishResponse
  }]">
    <!-- AI 頭像 (非使用者、非 thinking 狀態) -->
    <div class="ai-avatar" v-if="!props.source.forUser && !props.source.isThinking">AI</div>

    <div class="content-box">
      <!-- thinking 狀態 -->
      <div class="no-user-select" v-if="props.source.isThinking">
        <div>
          <i class="material-symbols-outlined">filter_vintage</i>
          <span class="fs-12 ml-1 fc-grey-1">AI processing</span>
        </div>
        <button class="custom-btn fs-12 mt-1 pt-0 pb-0">取消</button>
      </div>

      <!-- 翻譯確認卡片（使用者訊息） -->
      <div class="translation-confirm-card" v-else-if="props.source.cardType === 'translationConfirm'">
        <div class="tc-file-row">
          <img class="tc-file-icon" :src="excelIcon" alt="xlsx">
          <div class="tc-file-info">
            <div class="tc-file-name">{{ props.source.file }}</div>
            <div class="tc-file-meta">XLSX · {{ formatFileSize(props.source.fileSize) }}</div>
          </div>
          <button class="tc-dl-more-btn">
            <i class="material-symbols-outlined">more_horiz</i>
          </button>
        </div>
        <div class="tc-divider"></div>
        <div class="tc-info-row">
          <span class="tc-info-label">翻譯範圍</span>
          <span class="tc-info-value">{{ props.source.range }}</span>
        </div>
        <div class="tc-info-row">
          <span class="tc-info-label">翻譯語言</span>
          <span class="tc-info-value">{{ props.source.lang }}</span>
        </div>
        <div class="tc-btn-row">
          <button class="tc-btn tc-btn--secondary" :disabled="props.source.confirmed">重新選擇</button>
          <button :class="['tc-btn', 'tc-btn--primary', { 'is-confirmed': props.source.confirmed }]">
            <i class="material-symbols-outlined" v-if="props.source.confirmed">check</i>
            開始翻譯
          </button>
        </div>
      </div>

      <!-- 翻譯完成（AI 訊息含下載檔案） -->
      <template v-else-if="props.source.cardType === 'translationComplete'">
        <div v-html="displayMsg"></div>
        <div class="tc-download-list">
          <div class="tc-download-item" v-for="file in props.source.files" :key="file.name">
            <img class="tc-dl-icon" :src="getFileIcon(file.type)" :alt="file.type">
            <div class="tc-dl-info">
              <div class="tc-dl-name">{{ file.name }}</div>
              <div class="tc-dl-meta">{{ file.type }} · {{ formatFileSize(file.size) }}</div>
            </div>
            <button class="tc-dl-more-btn">
              <i class="material-symbols-outlined">more_horiz</i>
            </button>
          </div>
        </div>
      </template>

      <!-- 一般訊息 -->
      <div v-html="displayMsg" v-else-if="!props.source.isThinking"></div>

      <!-- 模擬建議追問   TODO... 邏輯還未確定 -->
      <div class="suggest-asking-box" v-if="false && props.source.finishResponse">
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
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watchEffect } from 'vue';
  import { formatFileSize } from '@/utils/file';
  import excelIcon from '@/assets/fileTypeIcon/excel.png';
  import txtIcon from '@/assets/fileTypeIcon/txt.png';
  import htmlIcon from '@/assets/fileTypeIcon/html.png';
  import pdfIcon from '@/assets/fileTypeIcon/pdf.png';

  const props = defineProps<{
    source: any,
    index: number,
  }>();

  const displayMsg = ref('');

  watchEffect(() => {
    displayMsg.value = props.source.msg;
  });

  function getFileIcon(type: string): string {
    const map: Record<string, string> = {
      XLSX: excelIcon,
      EXCEL: excelIcon,
      TXT: txtIcon,
      HTML: htmlIcon,
      PDF: pdfIcon,
    };
    return map[type] ?? excelIcon;
  }
</script>
