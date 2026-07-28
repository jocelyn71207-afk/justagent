<template>
  <span v-if="versions.length <= 1" class="version-inline">v{{ versions[0]?.versionTag }}</span>
  <div v-else class="version-dd" ref="ddRef">
    <button type="button" class="version-dd-btn" ref="btnRef" @click.stop="toggle">
      v{{ modelValue }} <span class="dd-caret">▾</span>
    </button>
    <div v-show="isOpen" class="version-dd-menu" :style="menuStyle">
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

<script lang="ts">
const closers = new Set<() => void>()
function closeOthers(self: () => void) {
  closers.forEach(close => { if (close !== self) close() })
}
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  versions: { versionTag: string; isActive: boolean }[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [versionTag: string] }>()

const isOpen = ref(false)
const ddRef = ref<HTMLElement | null>(null)
const btnRef = ref<HTMLElement | null>(null)
const menuStyle = ref<{ top: string; right: string }>({ top: '0px', right: '0px' })

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) {
    close()
    return
  }
  closeOthers(close)
  if (btnRef.value) {
    const rect = btnRef.value.getBoundingClientRect()
    menuStyle.value = {
      top: `${rect.bottom + 4}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  }
  isOpen.value = true
}

function select(versionTag: string) {
  emit('update:modelValue', versionTag)
  close()
}

function handleClickOutside(event: MouseEvent) {
  if (ddRef.value && !ddRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  closers.add(close)
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  closers.delete(close)
  document.removeEventListener('click', handleClickOutside)
})
</script>
