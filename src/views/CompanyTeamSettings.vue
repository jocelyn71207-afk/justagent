<template>
  <div class="CompanyTeamSettings views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="views-page-header">
        <div class="d-flex flex-align-start">
          <h3>
            企業/團隊設定
            <div class="secondary-box">公司名稱</div>
          </h3>
          <compSwitch v-model="isCompanyTab" :options="switchOptions" />
        </div>
        <button class="custom-btn custom-main-btn" v-if="!isCompanyTab" @click="openTeamModal('create')">
          <i class="material-symbols-outlined">add</i>
          新增團隊
        </button>
      </div>

      <!-- 企業 tab -->
      <div v-if="isCompanyTab">

        <!-- 企業類型 -->
        <section class="setting-section">
          <div class="setting-label">企業類型</div>
          <div class="setting-value">零售</div>
          <a href="#" class="setting-link">
            更改請聯絡客服
            <i class="material-symbols-outlined">chevron_right</i>
          </a>
        </section>

        <hr class="setting-divider" />

        <!-- 團隊類型 -->
        <section class="setting-section">
          <div class="setting-label">團隊類型</div>
          <div class="setting-value">實體門市</div>
          <div class="setting-value">電子商務</div>
        </section>

        <hr class="setting-divider" />

        <!-- 使用方案 -->
        <section class="setting-section">
          <div class="setting-label">使用方案</div>
          <div class="setting-value">標準版</div>
          <div class="setting-value">2026.08.09 到期</div>
        </section>

        <hr class="setting-divider" />

        <!-- 現有 Agent -->
        <section class="setting-section">
          <div class="setting-label">現有Agent</div>
          <div class="agent-list">
            <div class="agent-card" v-for="agent in agentList" :key="agent.id">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
              <span>{{ agent.name }}</span>
            </div>
          </div>
        </section>

        <hr class="setting-divider" />

        <!-- 平台管理者 -->
        <section class="setting-section">
          <div class="admin-header">
            <div class="setting-label">平台管理者</div>
            <button class="custom-btn no-border no-bg" @click="isAddPlatformAdminModalOpen = true">
              <i class="material-symbols-outlined">add</i>
              新增平台管理者
            </button>
          </div>
          <div class="setting-description">
            <i class="material-symbols-outlined fs-19">info</i>
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
                    <i v-if="admin.isOwner" class="material-symbols-outlined owner-icon">diamond</i>
                    {{ admin.name }}{{ admin.isOwner ? '（企業擁有者）' : '' }}
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
        </section>

      </div>

      <!-- 團隊 tab -->
      <div v-if="!isCompanyTab">
        <section class="setting-section">
          <div class="setting-label">實體門市</div>
          <div class="team-list">
            <div class="team-card" v-for="item in [1,2]" :key="'testA'+item">
              <span>團隊名稱{{ item }}</span>
              <i class="material-symbols-outlined edit-btn">delete</i>
              <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
            </div>
          </div>
        </section>
        <section class="setting-section">
          <div class="setting-label">電子商務</div>
          <div class="team-list">
            <div class="team-card" v-for="item in [1,2]" :key="'testB'+item">
              <span>團隊名稱{{ item }}</span>
              <i class="material-symbols-outlined edit-btn">delete</i>
              <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
            </div>
          </div>
        </section>
      </div>

    </div>
  </div>

  <TeamSettingModal v-model="isTeamSettingModalOpen" :mode="teamModalMode" :teamId="teamModalId" />
  <AddPlatformAdminModal v-model="isAddPlatformAdminModalOpen" />

</template>

<script setup lang="ts">
import { ref } from 'vue';
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
  { id: 'a1', name: '資料標準化Agent', icon: 'article' },
  { id: 'a2', name: '數據分析Agent', icon: 'bar_chart' },
]);

// 平台管理者列表  TODO... 後端吐資料
const adminList = ref([
  { id: 'u1', name: 'Rita', email: 'rita@gmail.com', lastActive: '2026-03-06 00:00:00', isOwner: true },
  { id: 'u2', name: 'Rita', email: 'rita@gmail.com', lastActive: '2026-03-06 00:00:00', isOwner: false },
  { id: 'u3', name: 'Rita', email: 'rita@gmail.com', lastActive: '2026-03-06 00:00:00', isOwner: false },
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
