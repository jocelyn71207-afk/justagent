<template>
  <div v-if="modelValue" class="drawer-root">
    <!-- 遮罩 -->
    <div
      class="swal2-container swal2-backdrop-show"
      style="z-index: 1061;"
      @click.self="close"
    ></div>

    <!-- Drawer 面板 -->
    <div class="KnowledgeBase drawer-panel review-drawer-panel" :class="{ open: modelValue }">

      <!-- Header -->
      <div class="drawer-header p-4 d-flex justify-content-between align-items-center">
        <h5 class="drawer-title fw-700 mb-0 d-flex align-items-center">
          <i class="material-symbols-outlined mr-2">rate_review</i>
          審核申請
        </h5>
        <i class="material-symbols-outlined cursor-pointer fc-grey-1" @click="close">close</i>
      </div>

      <AppSkeleton v-if="drawerLoading" type="card" />
      <AppErrorState
        v-else-if="drawerError"
        :message="drawerErrorMsg"
        :inline="true"
        @retry="drawerRetry"
      />

      <!-- Body -->
      <div class="drawer-body" v-else-if="knowledge && version">

        <!-- 條目 + 版本資訊 -->
        <div class="review-info-section">
          <div class="review-meta-row">
            <div class="knowledge-icon mr-3">
              <i class="material-symbols-outlined">menu_book</i>
            </div>
            <div>
              <div class="fs-16 fw-700">{{ knowledge.title }}</div>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="version-badge" :class="{ major: version.versionNumber.endsWith('.0') }">
                  {{ version.versionNumber }}
                </span>
                <span class="status-badge status-badge--reviewing">
                  <i class="material-symbols-outlined">pending_actions</i>
                  審核中
                </span>
              </div>
            </div>
          </div>

          <div class="review-submit-info mt-3" v-if="version.reviewNote">
            <div class="review-submit-label">送審說明</div>
            <div class="review-submit-note">{{ version.reviewNote }}</div>
          </div>
        </div>

        <!-- 版本摘要 -->
        <div class="review-summary-section">
          <div class="review-section-title">版本摘要</div>
          <div class="review-summary-grid">
            <div class="review-summary-item">
              <span class="review-summary-label">標題</span>
              <span class="review-summary-value">{{ version.title }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">分類</span>
              <span class="review-summary-value">{{ knowledge?.category || '（未設定）' }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">標籤</span>
              <span class="review-summary-value">{{ version.tags?.join('、') || '（無標籤）' }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">摘要</span>
              <span class="review-summary-value">{{ version.summary || '（無摘要）' }}</span>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="review-actions-section">
          <button class="custom-btn w-100 mb-2" @click="openCompare">
            <i class="material-symbols-outlined">difference</i>
            與前一版比較
          </button>
        </div>

        <!-- 退回說明 -->
        <div class="review-feedback-section">
          <div class="review-section-title">退回說明（選填）</div>
          <textarea
            class="custom-input w-100"
            rows="3"
            v-model="feedback"
            placeholder="填寫退回原因，協助作者修改方向"
          ></textarea>
        </div>

      </div>

      <div class="p-5 text-center fc-grey-1" v-else>找不到審核資料</div>

      <!-- Footer -->
      <div class="review-footer" v-if="knowledge && version && !drawerLoading && !drawerError">
        <button class="custom-btn review-footer__reject" @click="handleReject">
          <i class="material-symbols-outlined">undo</i>
          退回
        </button>
        <button class="custom-btn custom-main-btn review-footer__approve" @click="handleApprove">
          <i class="material-symbols-outlined">verified</i>
          通過並發布
        </button>
      </div>

    </div>
  </div>

  <!-- 與前版比較 Modal（複用現有元件） -->
  <VersionCompareModal
    v-model="isCompareOpen"
    :knowledgeId="knowledgeId"
    :v1Id="compareV1Id"
    :v2Id="versionId"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useResourceStore } from '@/stores/resourceStore';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import popDialog from '@/services/popDialog';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';

const props = defineProps<{
  modelValue: boolean;
  knowledgeId: string;
  versionId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'approved': [];
  'rejected': [];
}>();

const knowledgeStore = useKnowledgeStore();
const resourceStore = useResourceStore();
const {
  isLoading: drawerLoading,
  hasError: drawerError,
  errorMessage: drawerErrorMsg,
  retry: drawerRetry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.knowledgeId));

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const version = computed(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));

const feedback = ref('');

function close() {
  feedback.value = '';
  emit('update:modelValue', false);
}

function handleApprove() {
  knowledgeStore.approveVersion(props.knowledgeId, props.versionId, ({ added, removed, knowledgeId }) => {
    added.forEach(fileId => resourceStore.addKnowledgeMembership(fileId, knowledgeId));
    removed.forEach(fileId => resourceStore.removeKnowledgeMembership(fileId, knowledgeId));
  });
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approved');
  popDialog.toast(`已發布 ${vNum}`, 2000);
}

function handleReject() {
  knowledgeStore.rejectVersion(props.knowledgeId, props.versionId, feedback.value.trim() || undefined);
  close();
  emit('rejected');
  popDialog.toast('已退回，作者可重新編輯後送審', 2000);
}

// 與前版比較
const isCompareOpen = ref(false);
const compareV1Id = ref('');

function openCompare() {
  const k = knowledgeStore.getKnowledgeById(props.knowledgeId);
  if (!k) return;
  const idx = k.versions.findIndex(v => v.id === props.versionId);
  if (idx > 0) {
    compareV1Id.value = k.versions[idx - 1].id;
    isCompareOpen.value = true;
  } else {
    popDialog.alert('這是第一個版本，無前版可比較。');
  }
}
</script>
