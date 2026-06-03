<template>
  <div :class="['chunk-card', { 'chunk-card--expanded': isExpanded }]">
    <!-- 收合列 -->
    <div class="chunk-card-header" @click="emit('toggle')">
      <span class="chunk-index">#{{ String(chunk.index).padStart(2, '0') }}</span>
      <span class="chunk-token">{{ chunk.tokenCount }} tokens</span>
      <i class="material-symbols-outlined chunk-chevron">
        {{ isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
      </i>
    </div>

    <!-- 展開內容 -->
    <Transition name="chunk-expand">
      <div v-if="isExpanded" class="chunk-card-body">
        <div class="chunk-body-grid">
          <!-- 原文摘錄 -->
          <div class="chunk-body-col">
            <div class="chunk-col-label">原文摘錄</div>
            <p class="chunk-content-text">{{ chunk.content.slice(0, 200) }}{{ chunk.content.length > 200 ? '…' : '' }}</p>
          </div>
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
