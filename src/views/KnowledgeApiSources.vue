<template>
  <div class="KnowledgeApiSources views-page">
    <div class="views-page-content-box">

      <!-- 頁面標題 -->
      <div class="views-page-header">
        <div class="page-title-group">
          <button class="back-btn" @click="router.push({ name: 'KnowledgeBase' })">
            <i class="material-symbols-outlined">arrow_back</i>
          </button>
          <h3>API 來源管理</h3>
          <i class="material-symbols-outlined fc-grey-1 fs-18 ml-2" v-tooltip="'設定外部 REST API 作為知識條目來源，支援手動與排程自動同步'" style="cursor: default;">info</i>
        </div>
        <button class="custom-btn custom-main-btn" @click="openCreateModal">
          <i class="material-symbols-outlined">add_circle</i>
          新增 API 來源
        </button>
      </div>

      <!-- 空狀態 -->
      <div v-if="apiSources.length === 0" class="empty-state">
        <i class="material-symbols-outlined empty-icon">api</i>
        <div class="empty-title">尚未設定任何 API 來源</div>
        <div class="empty-desc">新增 API 來源後，系統可自動從外部 API 同步資料並建立知識條目草稿</div>
        <button class="custom-btn custom-main-btn mt-4" @click="openCreateModal">
          <i class="material-symbols-outlined">add_circle</i>
          新增 API 來源
        </button>
      </div>

      <!-- 列表 -->
      <div v-else class="api-source-list">
        <div class="api-source-card" v-for="source in apiSources" :key="source.id">
          <!-- 左側資訊 -->
          <div class="source-main">
            <div class="source-icon">
              <i class="material-symbols-outlined">api</i>
            </div>
            <div class="source-info">
              <div class="source-name">{{ source.name }}</div>
              <div class="source-url">{{ source.url }}</div>
              <div class="source-meta">
                <span class="meta-badge">{{ source.method }}</span>
                <span class="meta-badge">{{ scheduleLabelMap[source.schedule] }}</span>
                <!-- 上次同步狀態 -->
                <span v-if="source.lastSyncAt" :class="['sync-status', `sync-status--${source.lastSyncStatus?.toLowerCase()}`]">
                  <i class="material-symbols-outlined">{{ source.lastSyncStatus === 'SUCCESS' ? 'check_circle' : 'error' }}</i>
                  <span v-if="source.lastSyncStatus === 'SUCCESS'">
                    上次同步 {{ source.lastSyncCount }} 筆（{{ source.lastSyncAt }}）
                  </span>
                  <span
                    v-else
                    v-tooltip="source.lastSyncError ?? ''"
                    class="sync-error-text"
                  >
                    同步失敗（{{ source.lastSyncAt }}）
                  </span>
                </span>
                <span v-else class="sync-status sync-status--none">尚未同步</span>
              </div>
            </div>
          </div>

          <!-- 右側操作 -->
          <div class="source-actions">
            <!-- 啟用/停用 toggle -->
            <div
              :class="['enable-toggle', { 'is-enabled': source.enabled }]"
              @click="knowledgeStore.toggleApiSourceEnabled(source.id)"
              v-tooltip="source.enabled ? '停用此來源' : '啟用此來源'"
            >
              <div class="toggle-track">
                <div class="toggle-thumb"></div>
              </div>
              <span class="toggle-label">{{ source.enabled ? '啟用' : '停用' }}</span>
            </div>

            <!-- 手動同步按鈕 -->
            <button
              class="custom-btn sync-btn"
              :disabled="syncingId === source.id"
              @click="handleSync(source.id)"
            >
              <i class="material-symbols-outlined" :class="{ 'spin': syncingId === source.id }">sync</i>
              {{ syncingId === source.id ? '同步中...' : '立即同步' }}
            </button>

            <!-- 編輯 -->
            <button class="icon-btn" @click="openEditModal(source)" v-tooltip="'編輯'">
              <i class="material-symbols-outlined">edit</i>
            </button>

            <!-- 刪除 -->
            <button class="icon-btn icon-btn--danger" @click="handleDelete(source.id)" v-tooltip="'刪除'">
              <i class="material-symbols-outlined">delete</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <ApiSourceModal
      v-model="showModal"
      :source="editingSource"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { ApiSource } from '@/stores/knowledgeStore';
import ApiSourceModal from '@/components/Knowledge/ApiSourceModal.vue';
import popDialog from '@/services/popDialog';

const router = useRouter();
const knowledgeStore = useKnowledgeStore();
const { apiSources } = storeToRefs(knowledgeStore);

const showModal = ref(false);
const editingSource = ref<ApiSource | null>(null);
const syncingId = ref<string | null>(null);

const scheduleLabelMap: Record<string, string> = {
  MANUAL: '手動',
  DAILY: '每天',
  WEEKLY: '每週',
};

function openCreateModal() {
  editingSource.value = null;
  showModal.value = true;
}

function openEditModal(source: ApiSource) {
  editingSource.value = source;
  showModal.value = true;
}

function handleSave(payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>) {
  if (editingSource.value) {
    knowledgeStore.updateApiSource(editingSource.value.id, payload);
  } else {
    knowledgeStore.createApiSource(payload);
  }
}

async function handleSync(id: string) {
  syncingId.value = id;
  await knowledgeStore.triggerSync(id);
  syncingId.value = null;

  const source = apiSources.value.find(s => s.id === id);
  if (source?.lastSyncStatus === 'SUCCESS') {
    popDialog.alert(`同步成功，已建立 ${source.lastSyncCount} 筆草稿知識條目`);
  } else {
    popDialog.alert(`同步失敗：${source?.lastSyncError ?? '未知錯誤'}`);
  }
}

function handleDelete(id: string) {
  popDialog.confirm('確定要刪除此 API 來源嗎？已同步的知識條目不受影響。', () => {
    knowledgeStore.deleteApiSource(id);
  });
}
</script>
