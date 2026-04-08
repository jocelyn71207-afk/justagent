<template>
  <div class="KnowledgeBase KnowledgeDetail views-page">
    <div class="views-page-content-box" v-if="knowledge">

      <!-- 頂部導航與標題 -->
      <div class="views-page-header">
        <div class="d-flex align-items-center">
          <button class="custom-btn mr-3" @click="router.back()">
            <i class="material-symbols-outlined">arrow_back</i>
          </button>
          <div class="page-title-group">
            <h3>{{ versionToShow.title }}</h3>
            <span class="category-tag ml-2">{{ knowledge.category }}</span>
          </div>
        </div>
        <div class="header-right-box">
          <button class="custom-btn" @click="isHistoryOpen = true">
            <i class="material-symbols-outlined">history</i>
            版本紀錄
          </button>
          <button
            v-if="knowledge.status === 'PUBLISHED'"
            class="custom-btn custom-main-btn ml-2"
            @click="isCreateModalOpen = true"
          >
            <i class="material-symbols-outlined">add_box</i>
            建立新版本
          </button>
          <!-- 審核中 -->
          <template v-else-if="knowledge.status === 'REVIEWING'">
            <button class="custom-btn ml-2" @click="handleWithdraw">
              <i class="material-symbols-outlined">undo</i>
              撤回審核
            </button>
            <button class="custom-btn custom-main-btn ml-2" @click="isReviewDrawerOpen = true">
              <i class="material-symbols-outlined">rate_review</i>
              開始審核
            </button>
          </template>
          <!-- 草稿 / 已退回：繼續編輯 -->
          <button
            v-else-if="knowledge.status === 'DRAFT' || knowledge.status === 'REJECTED'"
            class="custom-btn custom-main-btn ml-2"
            @click="goToEditor"
          >
            <i class="material-symbols-outlined">edit</i>
            繼續編輯草稿
          </button>
        </div>
      </div>

      <!-- 版本資訊橫幅 -->
      <div class="detail-header-card">
        <div class="w-100">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <span class="version-badge" :class="{ major: versionToShow.versionNumber?.endsWith('.0') }">
                版本 {{ versionToShow.versionNumber }}
              </span>
              <span :class="['status-badge', `status-badge--${versionToShow.status}`]">
                <i class="material-symbols-outlined">{{ statusIconMap[versionToShow.status] }}</i>
                {{ statusLabelMap[versionToShow.status] }}
              </span>
            </div>
            <div class="fc-grey-1 fs-13">
              最後更新：{{ versionToShow.lastUpdateTime }} &nbsp;by&nbsp; {{ versionToShow.lastUpdateBy }}
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-label">分類</div>
              <div class="info-value">{{ knowledge.category }}</div>
            </div>
            <div>
              <div class="info-label">標籤</div>
              <div class="info-value">
                <span class="tag-chip mr-1" v-for="tag in versionToShow.tags" :key="tag">{{ tag }}</span>
                <span class="fc-grey-1 fs-13" v-if="!versionToShow.tags?.length">無標籤</span>
              </div>
            </div>
            <div v-if="versionToShow.updateNote">
              <div class="info-label">版本異動說明</div>
              <div class="info-value">{{ versionToShow.updateNote }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 內容預覽區域 -->
      <div class="content-preview">
        <div class="article-title">{{ versionToShow.title }}</div>
        <div class="article-meta">
          <span class="fc-grey-1">摘要：{{ versionToShow.summary || '（無摘要）' }}</span>
        </div>
        <div class="article-body">
          <!-- 模擬 Markdown / Rich Text 渲染 -->
          <div style="white-space: pre-wrap;">{{ versionToShow.content || '（此版本無內容）' }}</div>
        </div>

        <!-- 關聯附件區 -->
        <div class="mt-5 pt-4 border-top">
          <h6 class="fs-16 mb-3 d-flex align-items-center fw-600">
            <i class="material-symbols-outlined mr-2" style="display: inline-flex; vertical-align: middle;">attachment</i>
            關聯附件與來源檔案
          </h6>
          <div class="d-flex flex-wrap gap-2" v-if="versionToShow.sourceFiles?.length">
            <div
              v-for="file in versionToShow.sourceFiles"
              :key="file.fileId"
              class="category-tag d-flex align-items-center px-3 py-2 cursor-pointer fs-14"
              style="border-radius: 8px;"
            >
              <i class="material-symbols-outlined fs-16 mr-2">description</i>
              {{ file.fileName }}
            </div>
          </div>
          <div class="fc-grey-1 fs-13" v-else>尚未關聯任何來源檔案</div>
        </div>
      </div>

    </div>

    <!-- 查無資料 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <h4>找不到該知識條目</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 建立新版本 Modal -->
    <CreateVersionModal
      v-model="isCreateModalOpen"
      @confirm="handleCreateVersion"
    />

    <!-- 版本紀錄 Drawer -->
    <VersionHistoryDrawer
      v-model="isHistoryOpen"
      :knowledgeId="props.id"
      @compare="handleOpenCompare"
      @restore="handleOpenRestore"
    />

    <!-- 版本差異比較 Modal -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="props.id"
      :v1Id="compareV1Id"
      :v2Id="compareV2Id"
    />

    <!-- 還原舊版 Modal -->
    <RestoreVersionModal
      v-model="isRestoreOpen"
      :versionNumber="versionToRestoreNum"
      @confirm="confirmRestore"
    />

    <!-- 審核 Drawer -->
    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="props.id"
      :versionId="reviewVersionId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import popDialog from '@/services/popDialog';
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue';
import VersionHistoryDrawer from '@/components/Knowledge/VersionHistoryDrawer.vue';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import RestoreVersionModal from '@/components/Knowledge/RestoreVersionModal.vue';
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue';

const props = defineProps<{ id: string }>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.id));

// 詳情頁預設顯示「已發布」版本；若無則顯示最後一個版本
const versionToShow = computed(() => {
  if (!knowledge.value) return {} as any;
  const published = knowledge.value.versions.find(v => v.status === 'PUBLISHED');
  return published ?? knowledge.value.versions[knowledge.value.versions.length - 1];
});

const statusLabelMap: Record<string, string> = {
  PUBLISHED: '目前發布版',
  REVIEWING: '審核中',
  DRAFT:     '草稿版本',
  HISTORY:   '歷史封存版本',
  REJECTED:  '已退回',
};

const statusIconMap: Record<string, string> = {
  PUBLISHED: 'verified',
  REVIEWING: 'pending_actions',
  DRAFT:     'edit_note',
  HISTORY:   'history',
  REJECTED:  'error',
};

// ── 審核 Drawer ──
const isReviewDrawerOpen = ref(false);

const reviewVersionId = computed(() => {
  return knowledge.value?.versions.find(v => v.status === 'REVIEWING')?.id ?? '';
});

// ── 建立新版本 ──
const isCreateModalOpen = ref(false);

function handleCreateVersion(data: { type: 'MINOR' | 'MAJOR', note: string }) {
  const newVersionId = knowledgeStore.createDraftFromPublished(props.id, data.type, data.note);
  if (newVersionId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: newVersionId } });
  }
}

// ── 撤回審核 ──
function handleWithdraw() {
  const v = knowledge.value?.versions.find(ver => ver.status === 'REVIEWING');
  if (!v) return;
  popDialog.confirm('確定要撤回此審核申請嗎？版本將退回為草稿狀態。', () => {
    knowledgeStore.withdrawReview(props.id, v.id);
    popDialog.toast('已撤回審核，可繼續編輯草稿', 2000);
  });
}

// ── 繼續編輯草稿 ──
function goToEditor() {
  const draft = knowledge.value?.versions.find(v => v.status === 'DRAFT' || v.status === 'REJECTED');
  if (draft) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: draft.id } });
  }
}

// ── 版本紀錄 Drawer ──
const isHistoryOpen = ref(false);

// ── 版本差異比較 ──
const isCompareOpen = ref(false);
const compareV1Id = ref('');
const compareV2Id = ref('');

function handleOpenCompare(knowledgeId: string, versionId: string) {
  const k = knowledgeStore.getKnowledgeById(knowledgeId);
  if (!k) return;
  const idx = k.versions.findIndex(v => v.id === versionId);
  if (idx > 0) {
    compareV1Id.value = k.versions[idx - 1].id;
    compareV2Id.value = versionId;
    isCompareOpen.value = true;
  } else {
    popDialog.alert('這是第一個版本，無前版可比較。');
  }
}

// ── 還原舊版 ──
const isRestoreOpen = ref(false);
const versionToRestoreNum = ref('');
const versionToRestoreId = ref('');

function handleOpenRestore(knowledgeId: string, versionId: string) {
  const k = knowledgeStore.getKnowledgeById(knowledgeId);
  const v = k?.versions.find(ver => ver.id === versionId);
  if (v) {
    versionToRestoreNum.value = v.versionNumber;
    versionToRestoreId.value = versionId;
    isRestoreOpen.value = true;
  }
}

function confirmRestore(note: string) {
  const newDraftId = knowledgeStore.restoreToDraft(props.id, versionToRestoreId.value, note);
  if (newDraftId) {
    isRestoreOpen.value = false;
    isHistoryOpen.value = false;
    router.push({
      name: 'KnowledgeEditor',
      params: { knowledgeId: props.id, versionId: newDraftId },
    }).then(() => {
      popDialog.alert('已建立還原草稿，請繼續編輯。');
    });
  }
}
</script>
