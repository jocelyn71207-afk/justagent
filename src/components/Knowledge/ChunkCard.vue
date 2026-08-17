<template>
  <div :class="['chunk-card', { 'chunk-card--expanded': isExpanded }]">
    <!-- 收合列 -->
    <div class="chunk-card-header" @click="emit('toggle')">
      <span class="chunk-index">#{{ String(chunk.index).padStart(2, '0') }}</span>
      <span class="chunk-section">{{ chunk.sectionPath ?? '—' }}</span>
      <span class="chunk-token">{{ chunk.tokenCount }} tokens</span>
      <i class="material-symbols-outlined chunk-chevron">
        {{ isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
      </i>
    </div>

    <!-- 展開內容 -->
    <Transition name="chunk-expand">
      <div v-if="isExpanded" class="chunk-card-body">
        <div class="chunk-body-grid">
          <!-- 左：原文摘錄 -->
          <div class="chunk-body-col">
            <div class="chunk-col-label">原文摘錄</div>
            <p class="chunk-content-text">{{ chunk.content.slice(0, 200) }}{{ chunk.content.length > 200 ? '…' : '' }}</p>
          </div>

          <!-- 右：AI 摘要 + Q&A -->
          <div class="chunk-body-col">
            <template v-if="chunk.gist">
              <div class="chunk-col-label">AI 摘要</div>
              <p class="chunk-gist">{{ chunk.gist }}</p>
            </template>
            <template v-if="chunk.qaPairs?.length">
              <div class="chunk-col-label" style="margin-top: 10px;">建議問答（索引用）</div>
              <div class="chunk-qa-list">
                <div v-for="(qa, i) in chunk.qaPairs" :key="i" class="chunk-qa-item">
                  <span class="qa-label">Q{{ i + 1 }}</span>
                  <span>{{ qa }}</span>
                </div>
              </div>
            </template>
            <div v-if="!chunk.gist && !chunk.qaPairs?.length" class="fc-grey-1 fs-12">
              （此分段無 AI 摘要資料）
            </div>
          </div>
        </div>

        <!-- 底部：標籤 + 引用次數 -->
        <div class="chunk-card-footer">
          <div class="chunk-tags">
            <span
              v-for="tag in chunk.taxonomyTags"
              :key="tag"
              class="chunk-tag"
            >{{ tag }}</span>
          </div>
          <span v-if="chunk.citationCount !== undefined" class="chunk-citation">
            引用 {{ chunk.citationCount }} 次
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ChunkPreview } from '@/stores/knowledgeStore'

defineProps<{
  chunk: ChunkPreview
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>
