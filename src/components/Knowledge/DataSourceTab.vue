<!-- src/components/Knowledge/DataSourceTab.vue -->
<template>
  <div class="DataSourceTab">

    <div class="section-desc">連接外部資料來源，系統將自動同步資料並在知識庫建立對應的知識條目</div>

    <!-- 已連接 -->
    <div v-if="connectedSources.length > 0" class="connected-section">
      <div class="section-label">已連接（{{ connectedSources.length }}）</div>
      <div class="source-cards">
        <div class="source-card" v-for="source in connectedSources" :key="source.id">
          <div :class="['source-card-status', {
            'status-failed': source.lastSyncStatus === 'FAILED',
            'status-success': source.lastSyncStatus === 'SUCCESS'
          }]">
            {{ source.lastSyncStatus === 'FAILED' ? '同步失敗' : source.lastSyncStatus === 'SUCCESS' ? '已連接' : '已連接' }}
          </div>
          <div class="source-icon">
            <i class="material-symbols-outlined">api</i>
          </div>
          <div class="source-name">{{ source.name }}</div>
          <div class="source-type-label">自訂 REST API</div>
          <div class="source-sync-info">
            <template v-if="source.lastSyncAt">
              上次同步：{{ source.lastSyncAt }}
            </template>
            <template v-else>尚未同步</template>
          </div>
          <div class="source-card-actions">
            <button @click="handleSync(source.id)" :disabled="syncingIds.has(source.id)">
              <i class="material-symbols-outlined" style="font-size:14px;" :class="{ 'spin': syncingIds.has(source.id) }">sync</i>
              {{ syncingIds.has(source.id) ? '同步中' : '立即同步' }}
            </button>
            <button @click="openEdit(source.id)">
              <i class="material-symbols-outlined" style="font-size:14px;">settings</i>
              設定
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 可連接的 App Grid -->
    <div class="app-section">
      <div class="section-label">可連接的應用程式</div>
      <div class="app-grid">

        <!-- 自訂 API（唯一真實功能） -->
        <div class="app-card" @click="showWizard = true">
          <div class="app-icon" style="background:#f0f0ff;">
            <i class="material-symbols-outlined" style="color:#5c35d9;">api</i>
          </div>
          <div class="app-name">自訂 API</div>
          <div class="app-desc">連接任意 REST API 端點</div>
          <button class="app-connect-btn btn-primary">連接</button>
        </div>

        <!-- 佔位 App 卡片 -->
        <div
          class="app-card app-card--disabled"
          v-for="app in placeholderApps"
          :key="app.name"
        >
          <div class="app-icon" :style="{ background: app.iconBg }">
            <i class="material-symbols-outlined" :style="{ color: app.iconColor }">{{ app.icon }}</i>
          </div>
          <div class="app-name">{{ app.name }}</div>
          <div class="app-desc">{{ app.desc }}</div>
          <button class="app-connect-btn btn-disabled" disabled>即將推出</button>
        </div>

        <!-- 更多整合 -->
        <div class="app-card app-card--more">
          <div class="more-icon">＋</div>
          <div class="more-text">更多整合即將推出</div>
        </div>

      </div>
    </div>

    <!-- Wizard -->
    <ConnectApiWizard v-model="showWizard" @complete="handleWizardComplete" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import ConnectApiWizard from '@/components/Knowledge/ConnectApiWizard.vue';
import type { WizardPayload } from '@/stores/knowledgeStore';
import popDialog from '@/services/popDialog';

const knowledgeStore = useKnowledgeStore();
const { apiSources, knowledgeList } = storeToRefs(knowledgeStore);

const showWizard = ref(false);
const syncingIds = ref(new Set<string>());

// 已連接：apiSources 中有對應 KnowledgeItem 的
const connectedSources = computed(() =>
  apiSources.value.filter(s =>
    knowledgeList.value.some(k => k.apiSourceId === s.id)
  )
);

const placeholderApps = [
  { name: 'Google 雲端硬碟', desc: '同步雲端文件至知識庫', icon: 'folder', iconBg: '#e8f0fe', iconColor: '#4285F4' },
  { name: 'Notion', desc: '從 Notion 頁面匯入知識', icon: 'article', iconBg: '#f5f5f5', iconColor: '#333' },
  { name: 'SharePoint', desc: '企業內部文件庫', icon: 'corporate_fare', iconBg: '#e8f4fd', iconColor: '#0078D4' },
  { name: 'Slack', desc: '頻道訊息轉化為知識條目', icon: 'forum', iconBg: '#fce8ff', iconColor: '#4A154B' },
];

async function handleWizardComplete(payload: WizardPayload) {
  // 1. 建立 ApiSource（authorization 僅 wizard 使用，不儲存至 ApiSource）
  const apiSourceId = knowledgeStore.createApiSource({
    name: payload.name,
    url: payload.url,
    method: payload.method,
    headers: payload.headers,
    body: payload.body,
    titleField: payload.titleField,
    contentField: payload.contentField,
    schedule: payload.schedule,
    enabled: true,
  });

  // 2. 建立關聯的 KnowledgeItem
  knowledgeStore.createKnowledgeFromApiSource({
    apiSourceId,
    apiSourceName: payload.name,
    name: payload.name,
    category: payload.category,
  });

  // 3. 觸發首次同步
  syncingIds.value = new Set([...syncingIds.value, apiSourceId]);
  try {
    await knowledgeStore.triggerSync(apiSourceId);
    const source = apiSources.value.find(s => s.id === apiSourceId);
    if (!source) return;
    if (source.lastSyncStatus === 'SUCCESS') {
      popDialog.alert(`「${payload.name}」已連接，成功同步 ${source.lastSyncCount} 筆資料`);
    } else {
      popDialog.alert(`「${payload.name}」已連接，但首次同步失敗，請稍後手動重試`);
    }
  } finally {
    const next1 = new Set(syncingIds.value);
    next1.delete(apiSourceId);
    syncingIds.value = next1;
  }
}

async function handleSync(id: string) {
  syncingIds.value = new Set([...syncingIds.value, id]);
  try {
    await knowledgeStore.triggerSync(id);
    const source = apiSources.value.find(s => s.id === id);
    if (!source) return;
    if (source.lastSyncStatus === 'SUCCESS') {
      popDialog.alert(`同步成功，已更新知識條目（${source.lastSyncCount} 筆）`);
    } else {
      popDialog.alert(`同步失敗：${source.lastSyncError ?? '未知錯誤'}`);
    }
  } finally {
    const next = new Set(syncingIds.value);
    next.delete(id);
    syncingIds.value = next;
  }
}

function openEdit(_id: string) {
  popDialog.alert('功能開發中：編輯 API 來源設定');
}
</script>
