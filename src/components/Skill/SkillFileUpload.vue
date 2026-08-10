<template>
  <div class="SkillFileUpload">
    <div
      :class="['sfu-dropzone', { 'is-dragover': isDragging }]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <i class="material-symbols-outlined">cloud_upload</i>
      <p class="sfu-dropzone-text">拖曳檔案到這裡，或點擊選擇</p>
      <p class="sfu-dropzone-hint">支援 PDF、Excel、Word、TXT、Markdown，單檔上限 20MB，最多 5 個檔案</p>
      <input
        type="file"
        class="sfu-file-input"
        multiple
        :accept="SKILL_FILE_ACCEPT"
        @change="onChoose"
      />
    </div>

    <div v-if="modelValue.length" class="sfu-file-list">
      <div v-for="f in modelValue" :key="f.id" class="sfu-file-item">
        <i class="material-symbols-outlined sfu-file-icon">{{ skillFileIcon(f.fileType) }}</i>
        <span class="sfu-file-name">{{ f.fileName }}</span>
        <span class="sfu-file-size">{{ formatFileSize(f.fileSize) }}</span>
        <button type="button" class="sfu-remove-btn" @click="removeFile(f.id)">
          <i class="material-symbols-outlined">close</i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SkillFile } from '@/stores/skillStore'
import { formatFileSize } from '@/utils/file'
import { SKILL_FILE_ACCEPT, extToFileType, skillFileIcon, validateSkillFiles } from './skillFileUpload'
import popDialog from '@/services/popDialog'

const props = defineProps<{ modelValue: SkillFile[] }>()
const emit = defineEmits<{ 'update:modelValue': [files: SkillFile[]] }>()

const isDragging = ref(false)

function buildSkillFile(file: File): SkillFile {
  return {
    id: `sf-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: extToFileType(file.name),
    uploadedAt: new Date().toISOString(),
  }
}

function addFiles(files: File[]) {
  if (!files.length) return
  const result = validateSkillFiles(files, props.modelValue)
  if (!result.valid) {
    popDialog.alert(result.error as string)
    return
  }
  emit('update:modelValue', [...props.modelValue, ...files.map(buildSkillFile)])
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  addFiles(Array.from(event.dataTransfer?.files ?? []))
}

function onChoose(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function removeFile(id: string) {
  emit('update:modelValue', props.modelValue.filter(f => f.id !== id))
}
</script>
