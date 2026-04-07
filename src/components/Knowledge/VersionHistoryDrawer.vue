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
        <h5 class="fw-700 mb-0 d-flex align-items-center">
          <i class="material-symbols-outlined mr-2">history</i>
          版本紀錄
        </h5>
        <i class="material-symbols-outlined cursor-pointer" @click="$emit('update:modelValue', false)">close</i>
      </div>

      <div class="drawer-body p-0" v-if="knowledge">
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
          :class="{ 'is-published': v.status === 'PUBLISHED' }"
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
                  v-if="v.status === 'DRAFT'"
                  class="option-item option-item--danger divider"
                  @click="handleDeleteDraft(v.id)"
                >
                  <i class="material-symbols-outlined">delete</i>
                  刪除草稿
                </div>
                <!-- 僅歷史版本可還原 -->
                <div
                  v-if="v.status === 'HISTORY'"
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
const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));

const statusLabelMap: Record<string, string> = {
  PUBLISHED: '正式發布',
  REVIEWING: '審核中',
  DRAFT:     '草稿版本',
  HISTORY:   '歷史紀錄',
  REJECTED:  '已退回',
};

const openMenuId = ref('');

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? '' : id;
}

// 草稿/退回 → 進編輯器；其餘 → 返回詳情頁（已顯示當前版本）
function handleView(v: KnowledgeVersion) {
  openMenuId.value = '';
  if (v.status === 'DRAFT' || v.status === 'REJECTED') {
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
    const hasPublished = k.versions.some(v => v.status === 'PUBLISHED');
    if (hasPublished) k.status = 'PUBLISHED';
  });
}
</script>
