<template>
  <span v-if="versions.length <= 1" class="version-inline">v{{ versions[0]?.versionTag }}</span>
  <div v-else class="version-dd" ref="ddRef">
    <button type="button" class="version-dd-btn" @click.stop="toggle">
      v{{ modelValue }} <span class="dd-caret">▾</span>
    </button>
    <div v-show="isOpen" class="version-dd-menu">
      <div
        v-for="v in versions"
        :key="v.versionTag"
        :class="['version-dd-item', { 'is-current': v.versionTag === modelValue }]"
        @click.stop="select(v.versionTag)"
      >
        v{{ v.versionTag }}
        <span v-if="v.isActive" class="version-current-tag">使用中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  versions: { versionTag: string; isActive: boolean }[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [versionTag: string] }>()

const isOpen = ref(false)
const ddRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function select(versionTag: string) {
  emit('update:modelValue', versionTag)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (ddRef.value && !ddRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
