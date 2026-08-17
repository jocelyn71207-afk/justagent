<template>
  <compModal
    class="ResourceFilePicker"
    v-model="isOpen"
    :width="700"
  >
    <template #title>選取共用檔案</template>

    <div class="picker-toolbar">
      <div class="picker-search">
        <i class="material-symbols-outlined">search</i>
        <input v-model="searchQuery" placeholder="搜尋檔案名稱..." />
      </div>
      <select v-model="filterType" class="picker-filter">
        <option value="">全部類型</option>
        <option value="AI_PARSED">AI 解析</option>
        <option value="RAW">原始檔案</option>
      </select>
    </div>

    <div class="picker-table">
      <div class="picker-table-header">
        <div>檔案名稱</div>
        <div>類型</div>
        <div>狀態</div>
        <div>最後更新</div>
      </div>

      <template v-if="filteredList.length > 0">
        <div
          v-for="file in filteredList"
          :key="file.id"
          :class="[
            'picker-row',
            { 'is-selected': selectedFile?.id === file.id },
            { 'is-disabled': isDisabled(file) },
          ]"
          @click="!isDisabled(file) && selectFile(file)"
        >
          <div class="picker-row-name">
            <i class="material-symbols-outlined fs-16">description</i>
            <span>{{ file.fileName }}</span>
          </div>
          <div>
            <span :class="['badge', file.processType === 'AI_PARSED' ? 'badge-ai' : 'badge-raw']">
              {{ file.processType === 'AI_PARSED' ? 'AI 解析' : '原始檔案' }}
            </span>
          </div>
          <div>
            <span :class="['status-badge', `status-${file.status}`]">
              {{ statusLabel(file.status) }}
            </span>
          </div>
          <div class="fc-grey-1 fs-11">{{ file.lastModify.slice(0, 10) }}</div>
        </div>
      </template>

      <div v-else class="picker-empty">
        <i class="material-symbols-outlined">folder_open</i>
        <span>{{ searchQuery || filterType ? '找不到符合的檔案' : '共用庫目前沒有檔案' }}</span>
      </div>
    </div>

    <div class="picker-selected-hint">
      <template v-if="selectedFile">
        <i class="material-symbols-outlined">check_circle</i>
        已選取：{{ selectedFile.fileName }}
      </template>
    </div>

    <div class="picker-footer">
      <button class="custom-btn" @click="isOpen = false">取消</button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="!selectedFile"
        @click="confirmSelect"
      >
        <i class="material-symbols-outlined">check</i>
        確認選取
      </button>
    </div>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import compModal from '@/components/compModal/compModal.vue'
import { useResourceStore } from '@/stores/resourceStore'
import type { ResourceFile } from '@/stores/resourceStore'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', file: { fileId: string; fileName: string }): void
}>()
const props = defineProps<{
  modelValue: boolean
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const resourceStore = useResourceStore()
const { resourceList } = storeToRefs(resourceStore)

const searchQuery = ref('')
const filterType = ref('')
const selectedFile = ref<ResourceFile | null>(null)

const filteredList = computed(() => {
  return resourceList.value.filter(f => {
    const matchesSearch = !searchQuery.value || f.fileName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !filterType.value || f.processType === filterType.value
    return matchesSearch && matchesType
  })
})

function isDisabled(file: ResourceFile): boolean {
  return file.status === 'uploading' || file.status === 'parsing' || file.status === 'failed'
}

function selectFile(file: ResourceFile) {
  selectedFile.value = selectedFile.value?.id === file.id ? null : file
}

function confirmSelect() {
  if (!selectedFile.value) return
  emit('select', { fileId: selectedFile.value.id, fileName: selectedFile.value.fileName })
  isOpen.value = false
}

// reset state each time the picker opens
watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    filterType.value = ''
    selectedFile.value = null
  }
})

function statusLabel(status: ResourceFile['status']): string {
  const map: Record<ResourceFile['status'], string> = {
    uploading: '上傳中',
    parsing: '解析中',
    stored: '已儲存',
    saved: '已儲存',
    failed: '失敗',
  }
  return map[status]
}
</script>
