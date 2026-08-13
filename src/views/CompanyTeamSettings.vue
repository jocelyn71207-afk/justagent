<template>
  <div class="CompanyTeamSettings views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">企業/團隊設定</div>
        </div>
        <div class="banner-right">
          <compSwitch v-model="isCompanyTab" :options="switchOptions" />
        </div>
      </div>

      <!-- 企業 tab -->
      <div v-if="isCompanyTab" class="company-settings">

        <div class="info-card">
          <div class="info-row">
            <div class="info-row-left">
              <span class="material-symbols-outlined info-row-icon">domain</span>
              <span class="info-row-label">企業類型</span>
            </div>
            <div class="info-row-right">
              <span class="info-row-value">零售</span>
              <a href="#" class="setting-link">
                更改請聯絡客服
                <i class="material-symbols-outlined">chevron_right</i>
              </a>
            </div>
          </div>
          <div class="info-row">
            <div class="info-row-left">
              <span class="material-symbols-outlined info-row-icon">groups</span>
              <span class="info-row-label">團隊類型</span>
            </div>
            <div class="info-row-right">
              <span class="type-tag">實體門市</span>
              <span class="type-tag">電子商務</span>
            </div>
          </div>
          <div class="info-row no-border">
            <div class="info-row-left">
              <span class="material-symbols-outlined info-row-icon">workspace_premium</span>
              <span class="info-row-label">使用方案</span>
            </div>
            <div class="info-row-right">
              <span class="plan-badge">標準版</span>
              <span class="plan-expire">到期日 2026.08.09</span>
            </div>
          </div>
        </div>

        <div class="settings-grid">
          <div class="settings-block">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">smart_toy</span>
              <span class="settings-block-title">現有 Agent</span>
            </div>
            <div class="agent-list">
              <div class="agent-card" v-for="agent in agentList" :key="agent.id">
                <div class="agent-icon-bg">
                  <i class="material-symbols-outlined">{{ agent.icon }}</i>
                </div>
                <span>{{ agent.name }}</span>
              </div>
            </div>
          </div>

          <div class="settings-block settings-block--wide">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">admin_panel_settings</span>
              <span class="settings-block-title">平台管理者</span>
              <button class="custom-btn no-border no-bg" @click="isAddPlatformAdminModalOpen = true">
                <i class="material-symbols-outlined">add</i>
                新增平台管理者
              </button>
            </div>
            <div class="setting-description">
              <i class="material-symbols-outlined">info</i>
              企業擁有者擁有最高權限並綁定付費帳戶；管理員享有完全相同權限但無法轉移擁有權，可自由管理團隊成員。
            </div>
            <div class="admin-table-box">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>郵件</th>
                    <th>最後活動時間</th>
                    <th class="col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="admin in adminList" :key="admin.id">
                    <td>
                      <div class="admin-name-cell">
                        <div class="admin-avatar" :class="{ 'is-owner': admin.isOwner }">
                          {{ admin.name.charAt(0) }}
                        </div>
                        <span>{{ admin.name }}{{ admin.isOwner ? '（企業擁有者）' : '' }}</span>
                        <i v-if="admin.isOwner" class="material-symbols-outlined owner-icon">diamond</i>
                      </div>
                    </td>
                    <td>{{ admin.email }}</td>
                    <td class="fc-grey-1">{{ formatTimeToDisplay(admin.lastActive) }}</td>
                    <td>
                      <i v-if="!admin.isOwner" class="material-symbols-outlined delete-btn"
                        @click="deleteAdmin(admin)">delete</i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- 團隊 tab -->
      <div v-if="!isCompanyTab" class="team-settings">
        <div class="team-settings-toolbar">
          <button class="custom-btn custom-main-btn" @click="openTeamModal('create')">
            <i class="material-symbols-outlined">add</i>
            新增團隊
          </button>
        </div>
        <div class="settings-grid">
          <div class="settings-block">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">store</span>
              <span class="settings-block-title">實體門市</span>
            </div>
            <div class="team-list">
              <div class="team-card" v-for="item in [1,2]" :key="'testA'+item">
                <span class="material-symbols-outlined team-card-icon">meeting_room</span>
                <span class="team-card-name">團隊名稱{{ item }}</span>
                <div class="team-card-actions">
                  <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
                  <i class="material-symbols-outlined edit-btn">delete</i>
                </div>
              </div>
            </div>
          </div>
          <div class="settings-block">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">shopping_cart</span>
              <span class="settings-block-title">電子商務</span>
            </div>
            <div class="team-list">
              <div class="team-card" v-for="item in [1,2]" :key="'testB'+item">
                <span class="material-symbols-outlined team-card-icon">storefront</span>
                <span class="team-card-name">團隊名稱{{ item }}</span>
                <div class="team-card-actions">
                  <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
                  <i class="material-symbols-outlined edit-btn">delete</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <TeamSettingModal v-model="isTeamSettingModalOpen" :mode="teamModalMode" :teamId="teamModalId" />
  <AddPlatformAdminModal v-model="isAddPlatformAdminModalOpen" />

</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import compSwitch from '@/components/compSwitch/compSwitch.vue';
import { formatTimeToDisplay } from '@/utils/utils';
import popDialog from '@/services/popDialog';
import TeamSettingModal from '@/components/TeamSettingModal.vue';
import AddPlatformAdminModal from '@/components/AddPlatformAdminModal.vue';

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const isTeamSettingModalOpen = ref(false);
const isAddPlatformAdminModalOpen = ref(false);
const teamModalMode = ref<'create' | 'edit'>('create');
const teamModalId = ref('');

function openTeamModal(mode: 'create' | 'edit', teamId = '') {
  teamModalMode.value = mode;
  teamModalId.value = teamId;
  isTeamSettingModalOpen.value = true;
}

// 頁籤: true = 企業, false = 團隊
const isCompanyTab = ref(true);
const switchOptions = [
  { label: '企業', value: true },
  { label: '團隊', value: false },
];

// 現有 Agent 列表  TODO... 後端吐資料
const agentList = ref([
  { id: 'a1', name: '業務助理', icon: 'support_agent' },
  { id: 'a2', name: '數據分析', icon: 'analytics' },
  { id: 'a3', name: '行銷專員', icon: 'campaign' },
]);

// 平台管理者列表  TODO... 後端吐資料
const adminList = ref([
  { id: 'u1', name: 'Lucas', email: 'lucas.admin@gmail.com', lastActive: '2026-04-01 10:00:00', isOwner: true },
  { id: 'u2', name: 'Rita', email: 'rita@gmail.com', lastActive: '2026-03-11 10:00:00', isOwner: false },
  { id: 'u3', name: 'Amy', email: 'amy19342@gmail.com', lastActive: '2026-03-25 10:00:00', isOwner: false },
]);

function deleteAdmin(admin: any) {
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定移除嗎？</div>
      <div class="fs-16">移除後該成員將無法存取企業資源。</div>
    </div>
  `,
  () => {
    adminList.value = adminList.value.filter(a => a.id !== admin.id);
  });
}
</script>
