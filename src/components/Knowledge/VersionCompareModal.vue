<template>
  <div v-if="modelValue" class="modal-root">
    <div
      class="swal2-container swal2-center swal2-backdrop-show"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        class="swal2-popup swal2-modal swal2-show"
        style="display: flex; width: 1200px; max-width: 96vw; height: 85vh; padding: 32px;"
      >
        <div class="swal2-content text-left h-100 d-flex flex-column w-100">

          <!-- 標題列 -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-700 m-0 d-flex align-items-center">
              <i class="material-symbols-outlined mr-2">difference</i>
              版本差異比較
            </h4>
            <div class="d-flex align-items-center gap-3">
              <span class="diff-legend diff-legend--added">新增</span>
              <span class="diff-legend diff-legend--removed">刪除</span>
              <i class="material-symbols-outlined cursor-pointer ml-2" @click="$emit('update:modelValue', false)">close</i>
            </div>
          </div>

          <!-- 版本選擇器 -->
          <div class="compare-selectors mb-4" v-if="knowledge">
            <div class="compare-selector-group">
              <span class="compare-selector-label">舊版本</span>
              <select class="custom-input compare-select" v-model="selectedV1Id">
                <option v-for="v in knowledge.versions" :key="v.id" :value="v.id">
                  {{ v.versionNumber }} — {{ statusLabelMap[v.status] }}
                </option>
              </select>
            </div>
            <i class="material-symbols-outlined fc-grey-1">arrow_forward</i>
            <div class="compare-selector-group">
              <span class="compare-selector-label">新版本</span>
              <select class="custom-input compare-select" v-model="selectedV2Id">
                <option v-for="v in knowledge.versions" :key="v.id" :value="v.id">
                  {{ v.versionNumber }} — {{ statusLabelMap[v.status] }}
                </option>
              </select>
            </div>
          </div>

          <!-- 差異內容 -->
          <div class="KnowledgeBase diff-container h-100 overflow-hidden" v-if="v1 && v2">

            <!-- 左側：舊版本 -->
            <div class="diff-column">
              <h6>
                <span class="d-flex align-items-center gap-2">
                  <span class="version-badge" :class="{ major: v1.versionNumber.endsWith('.0') }">{{ v1.versionNumber }}</span>
                  舊版本
                </span>
                <span :class="['status-badge', `status-badge--${v1.status}`]">{{ statusLabelMap[v1.status] }}</span>
              </h6>
              <div class="diff-box flex-1">
                <div class="diff-item">
                  <div class="diff-label">標題</div>
                  <div class="diff-content" :class="{ 'is-removed': v1.title !== v2.title }">{{ v1.title }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">摘要</div>
                  <div class="diff-content" :class="{ 'is-removed': v1.summary !== v2.summary }">{{ v1.summary || '（無摘要）' }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">分類</div>
                  <div class="diff-content" :class="{ 'is-removed': v1.category !== v2.category }">{{ v1.category }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">標籤</div>
                  <div class="diff-content" :class="{ 'is-removed': tagsChanged }">{{ v1.tags?.join('、') || '（無標籤）' }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">知識內容</div>
                  <div class="diff-content" :class="{ 'is-removed': v1.content !== v2.content }">{{ v1.content }}</div>
                </div>
              </div>
            </div>

            <!-- 右側：新版本 -->
            <div class="diff-column">
              <h6>
                <span class="d-flex align-items-center gap-2">
                  <span class="version-badge" :class="{ major: v2.versionNumber.endsWith('.0') }">{{ v2.versionNumber }}</span>
                  新版本
                </span>
                <span :class="['status-badge', `status-badge--${v2.status}`]">{{ statusLabelMap[v2.status] }}</span>
              </h6>
              <div class="diff-box flex-1">
                <div class="diff-item">
                  <div class="diff-label">標題</div>
                  <div class="diff-content" :class="{ 'is-added': v1.title !== v2.title }">{{ v2.title }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">摘要</div>
                  <div class="diff-content" :class="{ 'is-added': v1.summary !== v2.summary }">{{ v2.summary || '（無摘要）' }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">分類</div>
                  <div class="diff-content" :class="{ 'is-added': v1.category !== v2.category }">{{ v2.category }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">標籤</div>
                  <div class="diff-content" :class="{ 'is-added': tagsChanged }">{{ v2.tags?.join('、') || '（無標籤）' }}</div>
                </div>
                <div class="diff-item">
                  <div class="diff-label">知識內容</div>
                  <div class="diff-content" :class="{ 'is-added': v1.content !== v2.content }">{{ v2.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 未選擇版本提示 -->
          <div class="p-5 text-center" v-else>
            <i class="material-symbols-outlined fs-48 fc-grey-1 mb-2">hourglass_empty</i>
            <div class="fc-grey-1">請選擇兩個不同的版本進行比較</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';

const props = defineProps<{
  modelValue: boolean;
  knowledgeId: string;
  v1Id: string;
  v2Id: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const knowledgeStore = useKnowledgeStore();
const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));

// 允許在 modal 內自行切換版本選擇
const selectedV1Id = ref(props.v1Id);
const selectedV2Id = ref(props.v2Id);

// 當父層傳入的 props 改變時（每次打開 modal 重設）
watch(() => [props.v1Id, props.v2Id, props.modelValue], ([v1, v2, open]) => {
  if (open) {
    selectedV1Id.value = String(v1);
    selectedV2Id.value = String(v2);
  }
});

const v1 = computed(() => knowledgeStore.getVersionById(props.knowledgeId, selectedV1Id.value));
const v2 = computed(() => knowledgeStore.getVersionById(props.knowledgeId, selectedV2Id.value));

const tagsChanged = computed(() => {
  if (!v1.value || !v2.value) return false;
  return JSON.stringify(v1.value.tags?.sort()) !== JSON.stringify(v2.value.tags?.sort());
});

const statusLabelMap: Record<string, string> = {
  PUBLISHED: '正式發布',
  REVIEWING: '審核中',
  DRAFT:     '草稿版本',
  HISTORY:   '歷史紀錄',
  REJECTED:  '已退回',
};
</script>
