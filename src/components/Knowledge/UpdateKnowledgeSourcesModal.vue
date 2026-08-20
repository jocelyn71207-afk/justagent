<template>
  <compModal
    class="UpdateKnowledgeSourcesModal"
    v-model="isOpen"
    :width="720"
  >
    <template #title>更新知識庫</template>

    <div class="update-sources-body">
      <div class="mb-3">
        <label class="form-label">指定知識庫 <span style="color:var(--danger);">*</span></label>
        <select v-model="selectedKnowledgeId" class="custom-input w-100">
          <option value="">選擇要更新的知識庫...</option>
          <option v-for="k in eligibleKnowledgeList" :key="k.id" :value="k.id">{{ k.title }}（{{ k.category }}）</option>
        </select>
      </div>

      <template v-if="selectedKnowledgeId">
        <div class="mb-2">
          <label class="form-label">檔案來源</label>
          <div v-if="pickedFiles.length" class="picked-files-list mb-2">
            <div v-for="f in pickedFiles" :key="f.fileId" class="picked-file-row">
              <i class="material-symbols-outlined fs-18" style="color:var(--success);">task_alt</i>
              <span class="fs-13 fw-600 picked-file-name">{{ f.fileName }}</span>
              <button class="picked-file-remove" @click.stop="removePickedFile(f.fileId)">
                <i class="material-symbols-outlined fs-16">close</i>
              </button>
            </div>
          </div>
          <button class="custom-btn" style="font-size:12px;" @click="showResourcePicker = true">
            <i class="material-symbols-outlined fs-14">folder_open</i>
            勾選檔案來源
          </button>
        </div>

        <div class="update-sources-hint">
          <i class="material-symbols-outlined">info</i>
          送出後將建立新版本草稿，仍可在編輯頁調整內容；需經審核通過後才會正式啟用。
        </div>
      </template>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="custom-btn" @click="isOpen = false">取消</button>
        <button
          class="custom-btn custom-main-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i class="material-symbols-outlined">sync_alt</i>
          送出更新
        </button>
      </div>
    </div>

    <ResourceFilePicker
      v-model="showResourcePicker"
      :preselected-ids="pickedFiles.map(f => f.fileId)"
      @select="onFilesSelected"
    />
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import compModal from '@/components/compModal/compModal.vue'
import ResourceFilePicker from '@/components/Knowledge/ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const resourceStore = useResourceStore()
const { knowledgeList } = storeToRefs(knowledgeStore)

const eligibleKnowledgeList = computed(() => knowledgeList.value.filter(k => k.sourceType === 'FILE'))

const selectedKnowledgeId = ref('')
const showResourcePicker = ref(false)

interface PickedFile { fileId: string; fileName: string }
const pickedFiles = ref<PickedFile[]>([])

// 切換知識庫時，將已選檔案重置為該知識庫目前生效版本（無生效版本則取最後一筆）的來源檔案
watch(selectedKnowledgeId, (id) => {
  if (!id) {
    pickedFiles.value = []
    return
  }
  const k = knowledgeStore.getKnowledgeById(id)
  if (!k) {
    pickedFiles.value = []
    return
  }
  const activeVersion = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1]
  pickedFiles.value = (activeVersion?.sourceFiles ?? []).map(f => ({ fileId: f.fileId, fileName: f.fileName }))
})

function onFilesSelected(payload: { files: { fileId: string; fileName: string }[] }) {
  pickedFiles.value = payload.files
  showResourcePicker.value = false
}

function removePickedFile(fileId: string) {
  pickedFiles.value = pickedFiles.value.filter(f => f.fileId !== fileId)
}

const canSubmit = computed(() => !!selectedKnowledgeId.value && pickedFiles.value.length > 0)

function handleSubmit() {
  if (!canSubmit.value) return
  const knowledgeId = selectedKnowledgeId.value
  const versionId = knowledgeStore.createDraftFromMemberUpdate(
    knowledgeId,
    pickedFiles.value.map(f => ({
      fileId: f.fileId,
      fileName: f.fileName,
      linkedVersion: resourceStore.getFileById(f.fileId)?.version ?? 1,
    })),
  )
  isOpen.value = false
  popDialog.toast('已建立新版本草稿，請於編輯頁確認內容後送審', 3000)
  if (versionId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
  }
}

// 關閉時清空狀態
watch(isOpen, (open) => {
  if (!open) {
    selectedKnowledgeId.value = ''
    pickedFiles.value = []
    showResourcePicker.value = false
  }
})
</script>
