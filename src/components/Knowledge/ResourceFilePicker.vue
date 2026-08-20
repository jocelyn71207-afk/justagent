<template>
  <compModal
    class="ResourceFilePicker"
    v-model="isOpen"
    :width="820"
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
        <div class="picker-col-check"></div>
        <div>檔案名稱</div>
        <div>類型</div>
        <div>上傳者</div>
        <div>上傳時間</div>
        <div>狀態</div>
        <div>目前成員</div>
      </div>

      <template v-if="filteredList.length > 0">
        <div
          v-for="file in filteredList"
          :key="file.id"
          :class="[
            'picker-row',
            { 'is-selected': isSelected(file) },
            { 'is-disabled': !isKbSourceSelectable(file) },
          ]"
          @click="isKbSourceSelectable(file) && toggleFile(file)"
        >
          <div class="picker-col-check">
            <input
              type="checkbox"
              :checked="isSelected(file)"
              :disabled="!isKbSourceSelectable(file)"
              @click.stop="isKbSourceSelectable(file) && toggleFile(file)"
            />
          </div>
          <div class="picker-row-name">
            <i class="material-symbols-outlined fs-16">description</i>
            <span>{{ file.fileName }}</span>
          </div>
          <div>
            <span :class="['badge', file.processType === 'AI_PARSED' ? 'badge-ai' : 'badge-raw']">
              {{ file.processType === 'AI_PARSED' ? 'AI 解析' : '原始檔案' }}
            </span>
          </div>
          <div class="fc-grey-1 fs-11">{{ file.ownerName || '—' }}</div>
          <div class="fc-grey-1 fs-11">{{ file.lastModify.slice(0, 10) }}</div>
          <div>
            <span :class="['status-badge', `status-${kbStatusClass(file)}`]">
              {{ getKbSourceStatusLabel(file) }}
            </span>
          </div>
          <div>
            <span v-if="membershipTitles(file).length === 0" class="member-badge member-badge--none">非成員</span>
            <span v-else class="member-badge">
              {{ membershipTitles(file)[0] }}<template v-if="membershipTitles(file).length > 1"> +{{ membershipTitles(file).length - 1 }}</template>
            </span>
          </div>
        </div>
      </template>

      <div v-else class="picker-empty">
        <i class="material-symbols-outlined">folder_open</i>
        <span>{{ searchQuery || filterType ? '找不到符合的檔案' : '共用庫目前沒有檔案' }}</span>
      </div>
    </div>

    <div class="picker-selected-hint">
      <template v-if="selectedFiles.length > 0">
        <i class="material-symbols-outlined">check_circle</i>
        已選取 {{ selectedFiles.length }} 個檔案：{{ selectedFiles.map(f => f.fileName).join('、') }}
      </template>
    </div>

    <div class="picker-footer">
      <button class="custom-btn" @click="isOpen = false">取消</button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="selectedFiles.length === 0"
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
import { useResourceStore, getKbSourceStatusLabel, isKbSourceSelectable } from '@/stores/resourceStore'
import type { ResourceFile } from '@/stores/resourceStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', payload: { files: { fileId: string; fileName: string }[] }): void
}>()
const props = defineProps<{
  modelValue: boolean
  preselectedIds?: string[]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const resourceStore = useResourceStore()
const { resourceList } = storeToRefs(resourceStore)
const knowledgeStore = useKnowledgeStore()

const searchQuery = ref('')
const filterType = ref('')
const selectedFiles = ref<ResourceFile[]>([])

const filteredList = computed(() => {
  return resourceList.value.filter(f => {
    const matchesSearch = !searchQuery.value || f.fileName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !filterType.value || f.processType === filterType.value
    return matchesSearch && matchesType
  })
})

function isSelected(file: ResourceFile): boolean {
  return selectedFiles.value.some(f => f.id === file.id)
}

function toggleFile(file: ResourceFile) {
  const idx = selectedFiles.value.findIndex(f => f.id === file.id)
  if (idx === -1) selectedFiles.value.push(file)
  else selectedFiles.value.splice(idx, 1)
}

function confirmSelect() {
  if (selectedFiles.value.length === 0) return
  emit('select', { files: selectedFiles.value.map(f => ({ fileId: f.id, fileName: f.fileName })) })
  isOpen.value = false
}

function membershipTitles(file: ResourceFile): string[] {
  return file.knowledgeIds
    .map(id => knowledgeStore.getKnowledgeById(id)?.title)
    .filter((title): title is string => !!title)
}

function kbStatusClass(file: ResourceFile): 'ready' | 'confirm' | 'parsing' {
  const label = getKbSourceStatusLabel(file)
  if (label === '已有資料') return 'ready'
  if (label === '待確認') return 'confirm'
  return 'parsing'
}

// 每次開啟時重置搜尋條件，並依 preselectedIds 預先勾選
// immediate: true — 修正 controller 核准的 watch 時機 bug：若元件掛載時 modelValue 已為 true
// （例如測試直接以 modelValue: true 掛載），非 immediate 的 watch 不會在掛載當下觸發，
// 導致 preselectedIds 永遠不會被套用。掛載時 modelValue 為 false（正常使用情境）時，
// immediate 呼叫的 open 為 false，if (open) 區塊不會執行，行為與原本相同。
watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    filterType.value = ''
    selectedFiles.value = props.preselectedIds
      ? resourceList.value.filter(f => props.preselectedIds!.includes(f.id))
      : []
  }
}, { immediate: true })
</script>
