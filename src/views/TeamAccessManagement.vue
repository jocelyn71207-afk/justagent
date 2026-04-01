<template>
  <div class="TeamAccessManagement views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

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

const teamId = ref(route.query.teamId);
const teamName = ref(route.query.teamName);
// route改變時更新teamId和teamName
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
  { id: 'u1',  name: 'Rita',   email: 'rita@gmail.com',               role: '企業擁有者', lastLogin: '2026-03-06 09:12:34' },
  { id: 'u2',  name: 'IlaLau', email: 'julia.lau@example.com',        role: '平台管理者', lastLogin: '2026-03-05 17:43:21' },
  { id: 'u3',  name: 'Ila',    email: 'julia.smith@example.com',      role: '平台管理者', lastLogin: '2026-03-04 11:08:55' },
  { id: 'u4',  name: 'Jia',    email: 'sara.brown@mailservice.com',   role: '團隊主管',   lastLogin: '2026-03-06 14:22:07' },
  { id: 'u5',  name: 'Lana',   email: 'lisa.green@domain.com',        role: '團隊主管',   lastLogin: '2026-03-06 08:55:49' },
  { id: 'u6',  name: 'Mira',   email: 'david.lee@provider.com',       role: '團隊主管',   lastLogin: '2026-03-05 16:30:12' },
  { id: 'u7',  name: 'Sophie', email: 'emily.wang@outlook.com',       role: '專案人員',   lastLogin: '2026-03-06 13:47:03' },
  { id: 'u8',  name: 'Elena',  email: 'chris.johnson@custommail.com', role: '專案人員',   lastLogin: '2026-03-06 10:19:58' },
  { id: 'u9',  name: 'Tessa',  email: 'nina.kim@service.com',         role: '專案人員',   lastLogin: '2026-03-05 23:04:31' },
  { id: 'u10', name: 'Zara',   email: 'alex.taylor@webmail.com',      role: '專案人員',   lastLogin: '2026-03-04 15:38:16' },
  { id: 'u11', name: 'Nina',   email: 'james.miller@domain.com',      role: '檢視者',     lastLogin: '2026-03-06 07:52:44' },
  { id: 'u12', name: 'Clara',  email: 'karen.davis@mail.com',         role: '檢視者',     lastLogin: '2026-03-03 20:11:27' },
  { id: 'u13', name: 'Lila',   email: 'robert.martinez@provider.com', role: '檢視者',     lastLogin: '2026-02-28 14:06:09' },
  { id: 'u14', name: 'Jade',   email: 'susan.thomas@samplemail.com',  role: '檢視者',     lastLogin: '2026-02-21 09:33:52' },
  // 36 more fake members
  ...Array.from({ length: 136 }, (_, i) => {
    const idx = i + 15;
    const roles = ['團隊主管', '專案人員', '檢視者'];
    const role = roles[idx % roles.length];
    return {
      id: `u${idx}`,
      name: `FakeUser${idx}`,
      email: `fakeuser${idx}@example.com`,
      role,
      lastLogin: `2026-03-${String((idx % 28) + 1).padStart(2, '0')} ${String((idx % 24)).padStart(2, '0')}:${String((idx * 3 % 60)).padStart(2, '0')}:${String((idx * 7 % 60)).padStart(2, '0')}`
    };
  })
]);

const filteredList = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return memberList.value;
  return memberList.value.filter(m =>
    m.name.toLowerCase().includes(keyword) ||
    m.email.toLowerCase().includes(keyword) ||
    m.role.includes(keyword)
  );
});

function toggleSort() {
  // TODO... 排序邏輯
}

const isOpenTeamAccountSettinfModal = ref(false); // 控制新增/編輯 modal 開關
// 編輯的協作帳號資料  TODO... 資料結構依實際情況調整
const editTeamAccount = ref({
  id: '',
  email: '',
  role: '',
});

// 開啟新增協作帳號 modal
function addMember() {
  editTeamAccount.value = { id: '', email: '', role: '' }; // 確保是空的資料
  isOpenTeamAccountSettinfModal.value = true;
}

// 開啟編輯 modal
function editMember(row: Member) {
  console.log('編輯', row);
  editTeamAccount.value = { ...row };
  isOpenTeamAccountSettinfModal.value = true;
}

// 刪除成員
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
