<template>
  <Teleport to="body">
    <template v-if="drawerOpen">
      <div class="knowledge-drawer-overlay" @click="close" />
      <div class="knowledge-drawer open">
        <div class="drawer-header">
          <span>知識來源</span>
          <button class="drawer-close-btn" @click="close">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="drawer-body">
          <div
            v-for="src in drawerSources"
            :key="src.knowledgeId"
            class="drawer-source-group"
          >
            <div class="drawer-source-title">
              <i class="material-symbols-outlined">book</i>
              {{ src.title }}
            </div>
            <hr class="drawer-source-divider" />
            <div
              v-for="chunk in getSrcChunks(src)"
              :key="chunk.index"
              class="drawer-chunk-item"
            >
              <div class="chunk-section-path">
                {{ chunk.sectionPath ?? `段落 ${chunk.index + 1}` }}
              </div>
              <div class="chunk-gist">
                {{ chunk.gist ?? chunk.content.slice(0, 100) }}
              </div>
              <span v-if="chunk.citationCount" class="chunk-citation">
                引用 {{ chunk.citationCount }} 次
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import type { Ref } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { ChunkPreview } from '@/stores/knowledgeStore'

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const drawerOpen = inject<Ref<boolean>>('drawerOpen')!
const drawerSources = inject<Ref<KnowledgeSource[]>>('drawerSources')!

const knowledgeStore = useKnowledgeStore()

function close() {
  drawerOpen.value = false
}

function getSrcChunks(src: KnowledgeSource): ChunkPreview[] {
  const item = knowledgeStore.knowledgeList.find(k => k.id === src.knowledgeId)
  if (!item) return []
  const version = item.versions[0]
  if (!version) return []
  return src.chunkIndexes.map(idx => version.chunks[idx]).filter(Boolean)
}
</script>
