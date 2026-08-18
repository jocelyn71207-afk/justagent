<template>
  <div class="CompanyTeamSettings views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">企業/團隊設定</div>
        </div>
      </div>

      <!-- 企業身分卡：企業識別、類型、方案、現有 Agent 都收進同一張卡；
           團隊類型（實體門市/電子商務）不重複放在這裡，下面「團隊」
           看板本身就是依類型分 lane，這裡再列一次是重複資訊 -->
      <div class="company-hero">
        <div class="company-hero-icon">
          <i class="material-symbols-outlined">domain</i>
        </div>
        <div class="company-hero-main">
          <div class="company-hero-name">UGG電子商務</div>
          <div class="company-hero-meta">
            <span class="type-tag">零售</span>
            <span class="plan-badge">標準版<span class="plan-badge-expire">・到期 2026.08.09</span></span>
          </div>
          <div class="company-hero-agents">
            <span class="agent-tag" v-for="agent in agentList" :key="agent.id">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>{{ agent.name }}
            </span>
          </div>
        </div>
        <a href="#" class="setting-link company-hero-link">
          更改請聯絡客服
          <i class="material-symbols-outlined">chevron_right</i>
        </a>
      </div>

      <!-- 平台管理者：真正的帳號名冊，用人卡呈現才看得出誰是誰、能不能刪 -->
      <div class="board-section">
        <div class="board-title-row">
          <span class="board-title">平台管理者</span>
          <button class="custom-btn no-border no-bg" @click="isAddPlatformAdminModalOpen = true">
            <i class="material-symbols-outlined">add</i>
            新增平台管理者
          </button>
        </div>
        <div class="setting-description">
          <i class="material-symbols-outlined">info</i>
          企業擁有者擁有最高權限並綁定付費帳戶；管理員享有完全相同權限但無法轉移擁有權，可自由管理團隊成員。
        </div>
        <div class="person-grid">
          <div class="person-card" v-for="admin in adminList" :key="admin.id" :title="admin.email">
            <div class="person-avatar" :class="{ 'is-owner': admin.isOwner }">
              {{ admin.name.charAt(0) }}
            </div>
            <div class="person-info">
              <div class="person-name">
                {{ admin.name }}
                <i v-if="admin.isOwner" class="material-symbols-outlined owner-icon">diamond</i>
              </div>
              <div class="person-role">{{ admin.isOwner ? '企業擁有者' : formatTimeToDisplay(admin.lastActive) }}</div>
            </div>
            <i v-if="!admin.isOwner" class="material-symbols-outlined delete-btn"
              @click="deleteAdmin(admin)">delete</i>
          </div>
        </div>
      </div>

      <!-- 團隊看板：依類型分成兩條 lane 並排 -->
      <div class="board-section">
        <div class="board-title-row">
          <span class="board-title">團隊</span>
          <button class="custom-btn no-border no-bg" @click="openTeamModal('create')">
            <i class="material-symbols-outlined">add</i>
            新增團隊
          </button>
        </div>
        <div class="team-lanes">
          <div class="team-lane">
            <div class="team-lane-head">
              <i class="material-symbols-outlined">store</i>
              實體門市
            </div>
            <div class="team-chip" v-for="item in [1,2]" :key="'testA'+item">
              <i class="material-symbols-outlined team-chip-icon">meeting_room</i>
              <span class="team-chip-name">團隊名稱{{ item }}</span>
              <div class="team-chip-actions">
                <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
                <i class="material-symbols-outlined edit-btn">delete</i>
              </div>
            </div>
          </div>
          <div class="team-lane">
            <div class="team-lane-head">
              <i class="material-symbols-outlined">shopping_cart</i>
              電子商務
            </div>
            <div class="team-chip" v-for="item in [1,2]" :key="'testB'+item">
              <i class="material-symbols-outlined team-chip-icon">storefront</i>
              <span class="team-chip-name">團隊名稱{{ item }}</span>
              <div class="team-chip-actions">
                <i class="material-symbols-outlined edit-btn" @click="openTeamModal('edit', String(item))">edit</i>
                <i class="material-symbols-outlined edit-btn">delete</i>
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
