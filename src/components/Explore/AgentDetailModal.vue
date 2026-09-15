<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="agent?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="agent">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div :class="['explore-modal-icon', `agent-icon--${agent.colorKey}`]">
            <i class="material-symbols-outlined">{{ agent.icon }}</i>
          </div>
          <p class="explore-modal-painpoint">{{ agent.painPoint }}</p>
          <p class="explore-modal-desc">{{ agent.desc }}</p>
          <div class="explore-modal-tags">
            <span v-for="tag in agent.tags" :key="tag" class="explore-modal-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="onToggleFavorite">
          {{ isFavorite ? '已加入常用清單' : '加入常用清單' }}
        </button>
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import type { Agent } from '@/stores/exploreStore'
import { useExploreStore } from '@/stores/exploreStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  modelValue: boolean
  agent: Agent | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const exploreStore = useExploreStore()

const isFavorite = computed(() => (props.agent ? exploreStore.isFavorite(props.agent.id) : false))

function onToggleFavorite() {
  if (!props.agent) return
  const wasFavorite = isFavorite.value
  exploreStore.toggleFavorite(props.agent.id)
  popDialog.toast(wasFavorite ? '已從常用清單移除' : '已加入常用清單')
}
</script>
