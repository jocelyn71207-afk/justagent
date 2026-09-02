<!-- src/components/Knowledge/DataSourceTab.vue -->
<template>
  <div class="DataSourceTab">

    <div class="section-desc">連接外部資料來源，系統將自動同步資料並在知識庫管理建立對應的知識條目</div>

    <!-- SharePoint 已連接卡片 -->
    <div v-if="spState.connected" class="connected-section">
      <div class="section-label">SharePoint</div>
      <div class="source-cards">
        <div class="source-card sp-connected-card">
          <div class="source-card-header">
            <div class="source-icon" style="background:#e8f4fd;">
              <i class="material-symbols-outlined" style="color:#0078D4;">corporate_fare</i>
            </div>
            <div class="source-card-header-right">
              <div class="source-card-status status-success">已連接</div>
              <button class="custom-btn fs-12 py-0 px-2" @click="showSharePointWizard = true">
                <i class="material-symbols-outlined fs-14">sync</i>重新同步
              </button>
            </div>
          </div>
          <div class="source-name">SharePoint</div>
          <div class="source-type-label">企業內部文件庫・手動同步</div>
          <div class="source-sync-info">
            上次同步：{{ spState.lastSync }}（{{ spState.count }} 筆）
          </div>

          <!-- 可展開的條目清單 -->
          <div class="sp-items-toggle" @click="spItemsExpanded = !spItemsExpanded">
            <i class="material-symbols-outlined fs-14">{{ spItemsExpanded ? 'expand_less' : 'expand_more' }}</i>
            已匯入的條目（{{ spItems.length }}）
          </div>
          <div v-if="spItemsExpanded && spItems.length" class="sp-items-list">
            <div
              v-for="item in spItems"
              :key="item.id"
              class="sp-item-row"
              @click="router.push({ name: 'KnowledgeDetail', params: { id: item.id } })"
            >
              <i class="material-symbols-outlined fs-14">description</i>
              <span class="sp-item-title">{{ item.title }}</span>
              <span :class="['status-badge', `status-badge--${item.status}`]" style="font-size:11px;padding:1px 6px;">
                {{ item.status === 'reviewing' ? '待審核' : item.status === 'active' ? '已發布' : '待處理' }}
              </span>
            </div>
          </div>
          <div v-if="spItemsExpanded && !spItems.length" class="sp-items-empty">
            尚無匯入條目
          </div>
        </div>
      </div>
    </div>

    <!-- 整合平台 section -->
    <div class="datasource-integration">

      <!-- 已連接的整合 -->
      <div v-if="integrationStore.integrationSources.length > 0">
        <div class="datasource-integration__section-label">整合平台</div>
        <div
          v-for="src in integrationStore.integrationSources"
          :key="src.id"
          class="datasource-integration__card"
        >
          <div class="datasource-integration__card-icon">{{ src.type === 'NOTION' ? 'N' : '?' }}</div>
          <div class="datasource-integration__card-info">
            <div class="datasource-integration__card-name">{{ src.name }}</div>
            <div class="datasource-integration__card-meta">
              {{ src.schedule === 'MANUAL' ? '手動同步' : src.schedule === 'DAILY' ? '每日同步' : '每週同步' }}
              &nbsp;·&nbsp;
              <span :class="src.lastSyncStatus === 'SUCCESS' ? 'text-success' : 'text-danger'">
                {{ src.lastSyncStatus === 'SUCCESS' ? '上次同步成功' : src.lastSyncStatus === 'FAILED' ? '上次同步失敗' : '尚未同步' }}
              </span>
              <span v-if="src.lastSyncAt">&nbsp;·&nbsp;{{ src.lastSyncAt }}</span>
              <span v-if="src.lastSyncCount > 0">&nbsp;·&nbsp;{{ src.lastSyncCount }} 筆</span>
            </div>
          </div>
          <div class="datasource-integration__card-actions">
            <label class="datasource-integration__toggle">
              <input
                type="checkbox"
                :checked="src.enabled"
                @change="integrationStore.toggleIntegrationEnabled(src.id)"
              />
              <span class="datasource-integration__toggle-track"></span>
            </label>
            <button
              class="datasource-integration__btn"
              :disabled="integrationSyncingId === src.id"
              @click="handleIntegrationSync(src.id)"
            >
              {{ integrationSyncingId === src.id ? '同步中...' : '立即同步' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 可新增整合 -->
      <div class="datasource-integration__section-label">可新增整合平台</div>
      <div class="datasource-integration__available">
        <div
          class="datasource-integration__available-item"
          @click="showIntegrationWizard = true"
        >
          <div class="datasource-integration__available-icon">N</div>
          <div class="datasource-integration__available-name">Notion</div>
          <div class="datasource-integration__available-action">+ 新增連接</div>
        </div>
        <div class="datasource-integration__available-item datasource-integration__available-item--disabled">
          <div class="datasource-integration__available-icon">📁</div>
          <div class="datasource-integration__available-name">Google 雲端硬碟</div>
          <div class="datasource-integration__available-action">即將推出</div>
        </div>
        <div class="datasource-integration__available-item datasource-integration__available-item--disabled">
          <div class="datasource-integration__available-icon">💬</div>
          <div class="datasource-integration__available-name">Slack</div>
          <div class="datasource-integration__available-action">即將推出</div>
        </div>
      </div>

      <!-- Wizard -->
      <IntegrationConnectWizard v-model="showIntegrationWizard" />
    </div>

    <!-- 已連接 API 來源 -->
    <div v-if="apiSources.length > 0" class="connected-section">
      <div class="section-label">已連接（{{ apiSources.length }}）</div>
      <div class="source-cards">
        <div
          class="source-card"
          :class="{ 'source-card--disabled': !source.enabled }"
          v-for="source in apiSources"
          :key="source.id"
        >
          <!-- 卡片頂部：icon + 狀態 & toggle -->
          <div class="source-card-header">
            <div class="source-icon">
              <i class="material-symbols-outlined">api</i>
            </div>
            <div class="source-card-header-right">
              <div :class="['source-card-status', {
                'status-failed':  source.lastSyncStatus === 'FAILED',
                'status-success': source.lastSyncStatus === 'SUCCESS',
              }]">
                {{ source.lastSyncStatus === 'FAILED' ? '同步失敗' : '已連接' }}
              </div>
              <button
                :class="['source-enable-toggle', { 'is-enabled': source.enabled }]"
                @click="knowledgeStore.toggleApiSourceEnabled(source.id)"
                :title="source.enabled ? '點擊停用' : '點擊啟用'"
              >
                <i class="material-symbols-outlined">{{ source.enabled ? 'toggle_on' : 'toggle_off' }}</i>
              </button>
            </div>
          </div>
          <div class="source-name">{{ source.name }}</div>
          <div class="source-type-label">自訂 REST API・{{ scheduleLabel[source.schedule] }}</div>

          <div class="source-sync-info">
            <template v-if="source.lastSyncAt">
              上次同步：{{ source.lastSyncAt }}
              <template v-if="source.lastSyncStatus === 'SUCCESS'">
                （{{ source.lastSyncCount }} 筆）
              </template>
            </template>
            <template v-else>尚未同步</template>
          </div>

          <div v-if="source.lastSyncStatus === 'FAILED' && source.lastSyncError" class="source-sync-error">
            {{ source.lastSyncError }}
          </div>

          <div class="source-card-actions">
            <button
              @click="handleSync(source.id)"
              :disabled="syncingIds.has(source.id) || !source.enabled"
            >
              <i class="material-symbols-outlined" :class="{ 'spin': syncingIds.has(source.id) }">sync</i>
              {{ syncingIds.has(source.id) ? '同步中' : '立即同步' }}
            </button>
            <button @click="openEdit(source.id)">
              <i class="material-symbols-outlined">settings</i>
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

        <!-- 自訂 API -->
        <div class="app-card" @click="showWizard = true">
          <div class="app-icon app-icon--custom-api">
            <i class="material-symbols-outlined">api</i>
          </div>
          <div class="app-name">自訂 API</div>
          <div class="app-desc">連接任意 REST API 端點</div>
          <button class="app-connect-btn btn-primary">連接</button>
        </div>

        <!-- SharePoint -->
        <div class="app-card app-card--sharepoint" @click="showSharePointWizard = true">
          <div class="app-icon" style="background:#e8f4fd;">
            <i class="material-symbols-outlined" style="color:#0078D4;">corporate_fare</i>
          </div>
          <div class="app-name">SharePoint</div>
          <div class="app-desc">企業內部文件庫</div>
          <button class="app-connect-btn btn-primary" @click.stop="showSharePointWizard = true">連接</button>
        </div>

        <!-- 佔位卡片 -->
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

    <!-- 建立精靈 -->
    <ConnectApiWizard v-model="showWizard" @complete="handleWizardComplete" />
    <SharePointWizardModal
      v-model="showSharePointWizard"
      @complete="handleSharePointComplete"
    />

    <!-- 編輯 Modal -->
    <EditApiSourceModal
      v-if="editSourceId"
      v-model="showEdit"
      :source-id="editSourceId"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import ConnectApiWizard from '@/components/Knowledge/ConnectApiWizard.vue';
import EditApiSourceModal from '@/components/Knowledge/EditApiSourceModal.vue';
import SharePointWizardModal from '@/components/Knowledge/SharePointWizardModal.vue';
import type { WizardPayload } from '@/stores/knowledgeStore';
import type { SpCompletePayload } from '@/components/Knowledge/SharePointWizardModal.vue';
import popDialog from '@/services/popDialog';
import { useRouter } from 'vue-router';
import { useIntegrationStore } from '@/stores/integrationStore'
import IntegrationConnectWizard from '@/components/Knowledge/IntegrationConnectWizard.vue'

const knowledgeStore = useKnowledgeStore();
const { apiSources, knowledgeList } = storeToRefs(knowledgeStore);
const router = useRouter();

const integrationStore = useIntegrationStore()
const showIntegrationWizard = ref(false)
const integrationSyncingId = ref<string | null>(null)

async function handleIntegrationSync(id: string) {
  integrationSyncingId.value = id
  await integrationStore.triggerIntegrationSync(id)
  integrationSyncingId.value = null
}

const showWizard = ref(false);
const showEdit = ref(false);
const editSourceId = ref('');
const syncingIds = ref(new Set<string>());
const showSharePointWizard = ref(false);

// SharePoint 連接狀態
const spState = ref<{ connected: boolean; lastSync: string; count: number }>({
  connected: false,
  lastSync: '',
  count: 0,
})
const spItemsExpanded = ref(false)

const spItems = computed(() =>
  knowledgeList.value.filter(k => k.sourceType === 'SHAREPOINT')
)

const scheduleLabel: Record<string, string> = {
  MANUAL: '手動同步',
  DAILY:  '每日同步',
  WEEKLY: '每週同步',
};

const placeholderApps = [
  { name: 'Google 雲端硬碟', desc: '同步雲端文件至知識庫', icon: 'folder', iconBg: '#e8f0fe', iconColor: '#4285F4' },
  { name: 'Slack', desc: '頻道訊息轉化為知識條目', icon: 'forum', iconBg: '#fce8ff', iconColor: '#4A154B' },
];

async function handleWizardComplete(payload: WizardPayload) {
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

  knowledgeStore.createKnowledgeFromApiSource({
    apiSourceId,
    apiSourceName: payload.name,
    name: payload.name,
    category: payload.category,
  });

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
    const next = new Set(syncingIds.value);
    next.delete(apiSourceId);
    syncingIds.value = next;
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

function openEdit(id: string) {
  editSourceId.value = id;
  showEdit.value = true;
}

function handleSharePointComplete(payload: SpCompletePayload) {
  if (payload.toCreate.length) {
    knowledgeStore.createFromSharePoint(payload.toCreate)
  }
  for (const title of payload.toArchiveTitles) {
    const found = knowledgeStore.knowledgeList.find(k => k.title.includes(title))
    if (found) knowledgeStore.archiveKnowledge(found.id)
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  spState.value = { connected: true, lastSync: now, count: payload.syncedCount }

  const msg = payload.syncedCount > 0
    ? `SharePoint 同步完成，已匯入 ${payload.syncedCount} 筆文件`
    : 'SharePoint 同步完成，未匯入任何檔案'
  popDialog.toast(msg, 3000)
}
</script>
