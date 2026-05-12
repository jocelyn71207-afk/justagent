<template>
  <div v-if="modelValue" class="drawer-root">
    <!-- 遮罩 -->
    <div
      class="swal2-container swal2-backdrop-show"
      style="z-index: 1061;"
      @click.self="$emit('update:modelValue', false)"
    ></div>

    <!-- Drawer 面板 -->
    <div class="KnowledgeBase drawer-panel" :class="{ open: modelValue }">
      <div class="drawer-header p-4 d-flex justify-content-between align-items-center">
        <h5 class="drawer-title fw-700 mb-0 d-flex align-items-center">
          <i class="material-symbols-outlined mr-2">history</i>
          <span>版本紀錄</span>
        </h5>
        <i class="material-symbols-outlined cursor-pointer fc-grey-1 hover-main transition-all" @click="$emit('update:modelValue', false)">close</i>
      </div>

      <AppSkeleton v-if="drawerLoading" type="card" />
      <AppErrorState
        v-else-if="drawerError"
        :message="drawerErrorMsg"
        :inline="true"
        @retry="drawerRetry"
      />

      <div class="drawer-body p-0" v-else-if="knowledge">
        <!-- 知識項目標題卡片 -->
        <div class="KnowledgeBase p-4 bgc-main-6 border-bottom mb-2">
          <div class="d-flex align-items-center mb-1">
            <i class="material-symbols-outlined fs-20 fc-main-1 mr-2">library_books</i>
            <span class="fs-12 fw-700 fc-grey-1 uppercase letter-spacing-1">所屬知識條目</span>
          </div>
          <div class="pl-7">
            <div class="fs-18 fw-700 fc-main-1 line-height-14">{{ knowledge.title }}</div>
            <div class="fs-12 fc-grey-1 mt-1 font-monospace">ID: {{ knowledge.id }}</div>
          </div>
        </div>

        <div class="p-4 pt-2">
          <div
            v-for="v in [...knowledge.versions].reverse()"
          :key="v.id"
          class="history-item"
          :class="{ 'is-published': v.status === 'active' }"
        >
          <div class="history-header">
            <div class="d-flex align-items-center gap-2">
              <span class="version-badge" :class="{ major: v.versionNumber.endsWith('.0') }">
                {{ v.versionNumber }}
              </span>
              <span :class="['status-badge', `status-badge--${v.status}`]">
                {{ statusLabelMap[v.status] }}
              </span>
            </div>

            <!-- 操作選單 -->
            <div class="more-menu-wrap" @click.stop>
              <i
                class="material-symbols-outlined more-btn p-1 fs-20"
                @click="toggleMenu(v.id)"
              >more_vert</i>
              <div :class="['next-option-box', { show: openMenuId === v.id }]" style="right: 0; min-width: 160px;">
                <div class="option-item" @click="handleView(v)">
                  <i class="material-symbols-outlined">visibility</i>
                  查看內容
                </div>
                <div class="option-item" @click="handleCompare(v.id)">
                  <i class="material-symbols-outlined">difference</i>
                  與前一版比較
                </div>
                <!-- 僅草稿可刪除 -->
                <div
                  v-if="v.status === 'draft'"
                  class="option-item option-item--danger divider"
                  @click="handleDeleteDraft(v.id)"
                >
                  <i class="material-symbols-outlined">delete</i>
                  刪除草稿
                </div>
                <!-- 僅歷史版本可還原 -->
                <div
                  v-if="v.status === 'history'"
                  class="option-item divider"
                  @click="handleRestore(v.id)"
                >
                  <i class="material-symbols-outlined">restore</i>
                  還原為新版本
                </div>
              </div>
            </div>
          </div>

          <div class="history-meta">
            <span>{{ v.lastUpdateTime }}</span>
            <span>更新人：{{ v.lastUpdateBy }}</span>
          </div>

          <div class="history-note" v-if="v.updateNote">{{ v.updateNote }}</div>

          <!-- 稽核紀錄時間軸 -->
          <div class="review-timeline" v-if="v.reviewHistory?.length">
            <div
              class="review-timeline-item"
              v-for="(record, ri) in v.reviewHistory"
              :key="ri"
            >
              <div :class="['review-timeline-dot', `review-timeline-dot--${record.action.toLowerCase()}`]"></div>
              <div class="review-timeline-content">
                <span class="review-timeline-action">{{ reviewActionLabel[record.action] }}</span>
                <span class="review-timeline-by">{{ record.by }}</span>
                <span class="review-timeline-time">{{ record.time }}</span>
                <div class="review-timeline-note" v-if="record.note">{{ record.note }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      <div class="p-5 text-center fc-grey-1" v-else>查無版本資料</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { KnowledgeVersion } from '@/stores/knowledgeStore';
import popDialog from '@/services/popDialog';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';

const props = defineProps<{
  modelValue: boolean;
  knowledgeId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'compare', knowledgeId: string, versionId: string): void;
  (e: 'restore', knowledgeId: string, versionId: string): void;
}>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();
const {
  data: knowledgeData,
  isLoading: drawerLoading,
  hasError: drawerError,
  errorMessage: drawerErrorMsg,
  retry: drawerRetry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const knowledge = computed(() => knowledgeData.value ?? null);

const statusLabelMap: Record<string, string> = {
  active:    '正式發布',
  reviewing: '審核中',
  draft:     '草稿版本',
  history:   '歷史紀錄',
  rejected:  '已退回',
};

const reviewActionLabel: Record<string, string> = {
  SUBMITTED: '送出審核',
  APPROVED:  '審核通過',
  REJECTED:  '審核退回',
  WITHDRAWN: '撤回審核',
};

const openMenuId = ref('');

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? '' : id;
}

// 草稿/退回 → 進編輯器；其餘 → 返回詳情頁（已顯示當前版本）
function handleView(v: KnowledgeVersion) {
  openMenuId.value = '';
  if (v.status === 'draft' || v.status === 'rejected') {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.knowledgeId, versionId: v.id } });
    emit('update:modelValue', false);
  } else {
    router.push({ name: 'KnowledgeDetail', params: { id: props.knowledgeId } });
    emit('update:modelValue', false);
  }
}

function handleCompare(id: string) {
  emit('compare', props.knowledgeId, id);
  openMenuId.value = '';
  emit('update:modelValue', false);
}

function handleRestore(id: string) {
  emit('restore', props.knowledgeId, id);
  openMenuId.value = '';
}

function handleDeleteDraft(id: string) {
  openMenuId.value = '';
  popDialog.confirm('確定要刪除此草稿版本嗎？此操作無法復原。', () => {
    const k = knowledgeStore.getKnowledgeById(props.knowledgeId);
    if (!k) return;
    k.versions = k.versions.filter(v => v.id !== id);
    // 若沒有草稿了，狀態恢復為已發布（若有發布版）
    const hasPublished = k.versions.some(v => v.status === 'active');
    if (hasPublished) k.status = 'active';
  });
}
</script>
