<template>
  <div class="TeamAccessManagement views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <!-- 設計切換按鈕 -->
      <button class="design-toggle-btn" @click="isNewDesign = !isNewDesign">
        <i class="material-symbols-outlined">{{ isNewDesign ? 'undo' : 'auto_awesome' }}</i>
        {{ isNewDesign ? '舊版設計' : '新版設計' }}
      </button>

      <!-- ========== 新版設計 ========== -->
      <template v-if="isNewDesign">

        <div class="views-page-header">
          <div class="page-title-group">
            <h3>權限管理</h3>
            <span class="team-name-badge">{{ teamName }}</span>
          </div>
          <div class="header-right-box">
            <div class="search-box">
              <i class="material-symbols-outlined">search</i>
              <input class="custom-input" type="text" v-model="searchText" placeholder="搜尋成員名稱、郵件、職位" />
            </div>
            <button class="custom-btn custom-main-btn" @click="addMember">
              <i class="material-symbols-outlined">person_add</i>
              新增協作帳號
            </button>
          </div>
        </div>

        <!-- 角色統計概覽 -->
        <div class="stats-bar">
          <div class="stat-item" v-for="stat in roleStats" :key="stat.role">
            <span class="stat-dot" :class="getRoleClass(stat.role)"></span>
            <span class="stat-label">{{ stat.role }}</span>
            <span class="stat-count">{{ stat.count }}</span>
          </div>
        </div>

        <!-- 新版表格 -->
        <div class="table-box new-table-box">
          <table class="custom-table">
            <thead>
              <tr>
                <th width="200">名稱</th>
                <th>郵件</th>
                <th width="130">
                  <span class="sort-btn" @click="toggleSort">
                    職位
                    <i class="material-symbols-outlined">arrow_downward</i>
                  </span>
                </th>
                <th width="140">最後登入時間</th>
                <th width="100" class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredList" :key="member.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar" :class="getRoleClass(member.role)">
                      {{ member.name.charAt(0) }}
                    </div>
                    <span>{{ member.name }}</span>
                  </div>
                </td>
                <td class="fc-grey-1">{{ member.email }}</td>
                <td>
                  <span class="role-badge" :class="getRoleClass(member.role)">{{ member.role }}</span>
                </td>
                <td class="fc-grey-1">{{ formatTimeToDisplay(member.lastLogin) }}</td>
                <td class="col-action">
                  <template v-if="member.role !== '企業擁有者' && member.role !== '平台管理者'">
                    <i class="material-symbols-outlined action-btn" @click="deleteMember(member)">delete</i>
                    <i class="material-symbols-outlined action-btn" @click="editMember(member)">edit</i>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <compPagination class="mt-5"
          :pageNo="pagination.pageNo"
          :numberOfRowsPerPage="pagination.numberOfRowsPerPage"
          :totalRows="filteredList.length"
          @change="(payload: PaginationChangePayload) => { pagination.pageNo = payload.pageNo; }"
        />

      </template>

      <!-- ========== 舊版設計 ========== -->
      <template v-else>

        <div class="views-page-header">
          <h3>
            權限管理
            <div class="secondary-box">{{ teamName }}</div>
          </h3>
          <div class="header-right-box">
            <div class="search-box">
              <i class="material-symbols-outlined">search</i>
              <input class="custom-input" type="text" v-model="searchText" placeholder="提示文字" />
            </div>
            <button class="custom-btn custom-main-btn" @click="addMember">
              <i class="material-symbols-outlined">add</i>
              新增協作帳號
            </button>
          </div>
        </div>

        <div class="table-box">
          <table class="custom-table">
            <thead>
              <tr>
                <th width="180">名稱</th>
                <th>郵件</th>
                <th width="120">
                  <span class="sort-btn" @click="toggleSort">
                    職位
                    <i class="material-symbols-outlined">arrow_downward</i>
                  </span>
                </th>
                <th width="120">最後登入時間</th>
                <th width="100" class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredList" :key="member.id">
                <td>
                  <i v-if="member.role === '企業擁有者'" class="material-symbols-outlined owner-icon">diamond</i>
                  {{ member.name }}
                </td>
                <td>{{ member.email }}</td>
                <td>{{ member.role }}</td>
                <td>{{ formatTimeToDisplay(member.lastLogin) }}</td>
                <td class="col-action">
                  <template v-if="member.role !== '企業擁有者' && member.role !== '平台管理者'">
                    <i class="material-symbols-outlined action-btn" @click="deleteMember(member)">delete</i>
                    <i class="material-symbols-outlined action-btn ml-1" @click="editMember(member)">edit</i>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <compPagination class="mt-5"
          :pageNo="pagination.pageNo"
          :numberOfRowsPerPage="pagination.numberOfRowsPerPage"
          :totalRows="filteredList.length"
          @change="(payload: PaginationChangePayload) => { pagination.pageNo = payload.pageNo; }"
        />

      </template>

      <!-- 新增/編輯 協作帳號 modal -->
      <TeamAccountSettingModal
        v-model="isOpenTeamAccountSettinfModal"
        :mode="editTeamAccount.id ? 'edit' : 'create'"
        :editData="editTeamAccount"
        @closeCallback="(research) => {
          // TODO... 這邊之後要處理當前頁碼是否不是第一頁,且該頁面只剩下一筆資料被刪除的情況，這時候需要讓頁碼減1，避免刪除後頁面沒有資料的狀況.
          console.log('modal關閉回調，是否需要重新送出查詢資料:', research);
        }"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { storeToRefs } from 'pinia';
import popDialog from '@/services/popDialog';
import { formatTimeToDisplay } from '@/utils/utils';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import TeamAccountSettingModal from '@/components/TeamAccountSettingModal.vue';

const route = useRoute();
const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const isNewDesign = ref(false);

const teamId = ref(route.query.teamId);
const teamName = ref(route.query.teamName);
watch(() => route.query, (newQuery) => {
  teamId.value = newQuery.teamId;
  teamName.value = newQuery.teamName;
});

const searchText = ref('');

const pagination = ref({
  pageNo: 1,
  numberOfRowsPerPage: 10,
});

// TODO... 實際資料結構依後端回傳為主
interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
}
// TODO... 後端吐資料
const memberList = ref([
  { id: 'u1',  name: 'Lucas',   email: 'lucas.admin@gmail.com',      role: '企業擁有者', lastLogin: '2026-04-01 10:00:00' },
  { id: 'u2',  name: 'Rita',    email: 'rita@gmail.com',             role: '平台管理者', lastLogin: '2026-03-11 09:30:00' },
  { id: 'u3',  name: 'Amy',     email: 'amy19342@gmail.com',         role: '平台管理者', lastLogin: '2026-03-25 14:15:00' },
  { id: 'u4',  name: 'Kevin',   email: 'kevin.chen@teva.com',        role: '團隊主管',   lastLogin: '2026-04-01 08:42:11' },
  { id: 'u5',  name: 'Jocelyn', email: 'jocelyn.wu@teva.com',        role: '團隊主管',   lastLogin: '2026-03-31 17:08:55' },
  { id: 'u6',  name: 'Daniel',  email: 'daniel.lin@teva.com',        role: '團隊主管',   lastLogin: '2026-03-29 11:23:44' },
  { id: 'u7',  name: 'Sophia',  email: 'sophia.chang@teva.com',      role: '團隊主管',   lastLogin: '2026-03-27 16:50:30' },
  { id: 'u8',  name: 'Ethan',   email: 'ethan.ho@teva.com',          role: '團隊主管',   lastLogin: '2026-03-25 09:15:07' },
  { id: 'u9',  name: 'Chloe',   email: 'chloe.hsu@teva.com',         role: '專案人員',   lastLogin: '2026-04-01 09:55:22' },
  { id: 'u10', name: 'Brian',   email: 'brian.kao@teva.com',         role: '專案人員',   lastLogin: '2026-03-31 15:37:48' },
  { id: 'u11', name: 'Iris',    email: 'iris.tsai@teva.com',         role: '專案人員',   lastLogin: '2026-03-30 13:20:05' },
  { id: 'u12', name: 'Jason',   email: 'jason.huang@teva.com',       role: '專案人員',   lastLogin: '2026-03-28 10:44:33' },
  { id: 'u13', name: 'Wendy',   email: 'wendy.liao@teva.com',        role: '專案人員',   lastLogin: '2026-03-26 08:11:59' },
  { id: 'u14', name: 'Oscar',   email: 'oscar.yang@teva.com',        role: '專案人員',   lastLogin: '2026-03-24 18:03:17' },
  { id: 'u15', name: 'Fiona',   email: 'fiona.pan@teva.com',         role: '專案人員',   lastLogin: '2026-03-22 14:28:40' },
  { id: 'u16', name: 'Marcus',  email: 'marcus.chou@teva.com',       role: '檢視者',     lastLogin: '2026-03-20 11:52:06' },
  { id: 'u17', name: 'Tina',    email: 'tina.cheng@teva.com',        role: '檢視者',     lastLogin: '2026-03-15 16:07:34' },
  { id: 'u18', name: 'Victor',  email: 'victor.su@teva.com',         role: '檢視者',     lastLogin: '2026-03-10 09:41:22' },
  { id: 'u19', name: 'Angela',  email: 'angela.wu@teva.com',         role: '檢視者',     lastLogin: '2026-03-05 13:19:50' },
  { id: 'u20', name: 'Peter',   email: 'peter.tang@teva.com',        role: '檢視者',     lastLogin: '2026-02-28 07:35:14' },
]);

const filteredList = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  const list = keyword
    ? memberList.value.filter(m =>
        m.name.toLowerCase().includes(keyword) ||
        m.email.toLowerCase().includes(keyword) ||
        m.role.includes(keyword)
      )
    : memberList.value;
  return [...list].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
});

// 角色統計（新版用）
const roleOrder = ['企業擁有者', '平台管理者', '團隊主管', '專案人員', '檢視者'];
const roleStats = computed(() => {
  const counts: Record<string, number> = {};
  for (const m of memberList.value) {
    counts[m.role] = (counts[m.role] ?? 0) + 1;
  }
  return roleOrder.filter(r => counts[r]).map(r => ({ role: r, count: counts[r] }));
});

function getRoleClass(role: string): string {
  const map: Record<string, string> = {
    '企業擁有者': 'role-owner',
    '平台管理者': 'role-admin',
    '團隊主管':   'role-manager',
    '專案人員':   'role-staff',
    '檢視者':     'role-viewer',
  };
  return map[role] ?? 'role-viewer';
}

function toggleSort() {
  // TODO... 排序邏輯
}

const isOpenTeamAccountSettinfModal = ref(false);
const editTeamAccount = ref({
  id: '',
  email: '',
  role: '',
});

function addMember() {
  editTeamAccount.value = { id: '', email: '', role: '' };
  isOpenTeamAccountSettinfModal.value = true;
}

function editMember(row: Member) {
  console.log('編輯', row);
  editTeamAccount.value = { ...row };
  isOpenTeamAccountSettinfModal.value = true;
}

function deleteMember(member: Member) {
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定移除嗎？</div>
      <div class="fs-16">移除後該成員將無法存取此團隊資源。</div>
    </div>
  `,
  () => {
    memberList.value = memberList.value.filter(m => m.id !== member.id);
  });
}
</script>
