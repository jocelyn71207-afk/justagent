<template>
  <compModal v-model="isOpen" :width="760">
    <template #title>
      <div class="d-flex align-items-center gap-2">
        <i class="material-symbols-outlined fs-18">description</i>
        <span>{{ fileName }}</span>
      </div>
    </template>

    <div class="file-preview-body">
      <!-- Image preview -->
      <template v-if="isImage">
        <img :src="fileUrl" :alt="fileName" class="file-preview-img" />
      </template>

      <!-- No preview available -->
      <template v-else>
        <div class="file-no-preview">
          <i class="material-symbols-outlined file-no-preview-icon">{{ fileIcon }}</i>
          <div class="fs-15 fw-600 mt-2">{{ fileName }}</div>
          <div class="fc-grey-1 fs-13 mt-1">此格式不支援線上預覽</div>
          <a
            v-if="fileUrl"
            :href="fileUrl"
            target="_blank"
            rel="noopener"
            class="custom-btn custom-main-btn mt-3"
          >
            <i class="material-symbols-outlined">download</i>
            下載查看
          </a>
        </div>
      </template>
    </div>
  </compModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'

const props = defineProps<{
  modelValue: boolean
  fileName: string
  fileUrl: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
const ext = computed(() => props.fileName.split('.').pop()?.toLowerCase() ?? '')
const isImage = computed(() => IMAGE_EXTS.has(ext.value))

const fileIcon = computed(() => {
  const map: Record<string, string> = {
    pdf: 'picture_as_pdf',
    docx: 'description', doc: 'description',
    pptx: 'slideshow', ppt: 'slideshow',
  }
  return map[ext.value] ?? 'insert_drive_file'
})
</script>
