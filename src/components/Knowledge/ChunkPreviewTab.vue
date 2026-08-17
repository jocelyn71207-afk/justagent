<template>
  <div class="chunk-preview-tab">
    <!-- MANUAL 無分段 -->
    <div v-if="sourceType === 'MANUAL' && !chunks.length" class="chunk-empty-state">
      <i class="material-symbols-outlined">edit_note</i>
      <p>此條目為人工撰寫，無 AI 分段資料</p>
    </div>

    <!-- 無 chunks 的一般情況 -->
    <div v-else-if="!chunks.length" class="chunk-empty-state">
      <i class="material-symbols-outlined">pending</i>
      <p>尚無分段資料，請等待 Pipeline 處理完成</p>
    </div>

    <!-- Chunk 列表 -->
    <template v-else>
      <div class="chunk-list-header">
        <span class="fs-13 fc-grey-1">共 <strong>{{ chunks.length }}</strong> 個知識單元</span>
        <div class="d-flex gap-2">
          <button class="custom-btn fs-12" @click="expandAll">全部展開</button>
          <button class="custom-btn fs-12" @click="collapseAll">全部收合</button>
        </div>
      </div>
      <ChunkCard
        v-for="chunk in chunks"
        :key="chunk.index"
        :chunk="chunk"
        :is-expanded="expandedSet.has(chunk.index)"
        @toggle="toggleChunk(chunk.index)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChunkCard from './ChunkCard.vue'
import type { ChunkPreview, SourceType } from '@/stores/knowledgeStore'

const props = defineProps<{
  chunks: ChunkPreview[]
  sourceType: SourceType
}>()

// 預設展開第一個
const expandedSet = ref<Set<number>>(
  new Set(props.chunks.length ? [props.chunks[0].index] : [])
)

function toggleChunk(index: number) {
  const next = new Set(expandedSet.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedSet.value = next
}

function expandAll() {
  expandedSet.value = new Set(props.chunks.map(c => c.index))
}

function collapseAll() {
  expandedSet.value = new Set()
}
</script>
