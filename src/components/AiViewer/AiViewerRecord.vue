<template>
  <div :class="['AiViewerRecord', {
    forUser: props.source.forUser,
    isThinking: props.source.isThinking,
    feedback: props.source.finishResponse
  }]">
    <!-- AI 頭像 (非使用者、非 thinking 狀態) -->
    <div class="ai-avatar" v-if="!props.source.forUser && !props.source.isThinking">AI</div>

    <div class="message-wrap">
      <!-- 思維鏈卡片：AI 訊息且有 thinkingSteps 或正在 thinking 時顯示 -->
      <ThinkingChainCard
        v-if="!props.source.forUser && (props.source.isThinking || props.source.thinkingSteps?.length)"
        :steps="props.source.thinkingSteps ?? []"
        :sources="props.source.sources ?? []"
        :isThinking="props.source.isThinking ?? false"
      />

      <!-- 訊息內容（thinking 時隱藏） -->
      <div class="content-box" v-if="!props.source.isThinking">

        <!-- 翻譯確認卡片（使用者訊息） -->
        <div class="translation-confirm-card" v-if="props.source.cardType === 'translationConfirm' && props.source.confirmed">
          <div class="tc-file-row">
            <div class="tc-file-icon file-icon-tile" :class="`file-icon-tile--${fileTypeMeta('EXCEL').color}`">
              <i class="material-symbols-outlined file-type-icon">{{ fileTypeMeta('EXCEL').icon }}</i>
            </div>
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
          <div class="tc-info-row" v-if="props.source.columns">
            <span class="tc-info-label">翻譯欄位</span>
            <span class="tc-info-value">{{ props.source.columns }}</span>
          </div>
          <div class="tc-info-row" v-else-if="props.source.range && props.source.range !== '全部工作表'">
            <span class="tc-info-label">翻譯欄位</span>
            <span class="tc-info-value tc-info-value--muted">全部欄位</span>
          </div>
          <div class="tc-info-row">
            <span class="tc-info-label">翻譯語言</span>
            <span class="tc-info-value">{{ props.source.lang }}</span>
          </div>
        </div>

        <!-- 翻譯設定尚未確認：河道上不顯示任何內容 -->
        <template v-else-if="props.source.cardType === 'translationConfirm' && !props.source.confirmed"></template>

        <!-- 翻譯完成（AI 訊息含下載檔案） -->
        <template v-else-if="props.source.cardType === 'translationComplete'">
          <div v-html="displayMsg"></div>
          <div class="tc-download-list">
            <div class="tc-download-item" v-for="file in props.source.files" :key="file.name">
              <div class="tc-dl-icon file-icon-tile" :class="`file-icon-tile--${fileTypeMeta(file.type).color}`">
                <i class="material-symbols-outlined file-type-icon">{{ fileTypeMeta(file.type).icon }}</i>
              </div>
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

        <!-- 下一步選擇（快速按鈕） -->
        <template v-else-if="props.source.cardType === 'nextStepPrompt'">
          <div v-html="displayMsg"></div>
          <div class="conv1-quick-btns">
            <span
              v-for="step in props.source.nextSteps"
              :key="step.msg"
              class="conv1-quick-btn"
              :data-action="'conv1-next-step'"
              :data-value="step.msg"
            >{{ step.label }}</span>
          </div>
        </template>

        <!-- 處理中訊息（含 loading 動畫） -->
        <template v-else-if="props.source.isProcessing">
          <div v-html="displayMsg"></div>
          <div class="ai-processing-dots">
            <span></span><span></span><span></span>
          </div>
        </template>

        <!-- 一般訊息 -->
        <div v-html="displayMsg" v-else></div>

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

      <!-- 知識來源 Chips（回答完成且有 sources 時顯示） -->
      <div
        v-if="props.source.finishResponse && props.source.sources?.length"
        class="source-chips"
      >
        <span class="source-chips-label">參考來源：</span>
        <button
          v-for="src in props.source.sources"
          :key="src.knowledgeId"
          class="source-chip"
          @click="openDrawer(props.source.sources)"
        >
          <i class="material-symbols-outlined">book</i>
          {{ src.title }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, inject } from 'vue'
import { formatFileSize, fileTypeMeta } from '@/utils/file'
import ThinkingChainCard from '@/components/AiViewer/ThinkingChainCard.vue'

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const props = defineProps<{
  source: any
  index: number
}>()

const openDrawer = inject<(sources: KnowledgeSource[]) => void>('openDrawer')!

const displayMsg = ref('')

// 將訊息內文中 @知識庫標題 的引用文字加上特別標注樣式（沿用既有 .conv2-kb-ref chip 樣式）
function highlightKnowledgeMentions(msg: string): string {
  if (!msg) return msg
  return msg.replace(/@([^\s<，。！？、；：]+)/g, '<span class="conv2-kb-ref">@$1</span>')
}

watchEffect(() => {
  displayMsg.value = highlightKnowledgeMentions(props.source.msg)
})

</script>
