<template>
  <div class="ProjectTrashCans views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <div class="views-page-header">
        <h3>
          專案垃圾桶
          <div v-if="teamName" class="secondary-box">{{ teamName }}</div>
        </h3>
        <div class="header-right-box">
          <compDropDown v-if="trashList.length"
            :options="deleterOptions"
            :show-search="false"
            :showClearTriggerIcon="false"
            :default-value="''"
            :width="'160px'"
            :indent="'10px'"
            placeholder="所有刪除者"
            @select="(item: any) => { filterDeleter = item.value; }"
          />
        </div>
      </div>

      <div class="d-flex flex-align-center fs-14 fc-grey-1" v-if="trashList.length">
        <i class="material-symbols-outlined fs-19 mr-1">info</i>
        專案會顯示剩餘天數。過了期限後，專案將被永久刪除且無法復原。
      </div>

      <!-- 卡片列表 -->
      <div class="card-list-box mt-2" v-if="displayProjectList.length">
        <div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="i"
          @mouseleave="item.showMoreOption = false;">
          <div class="img-box">
            <img :src="item.imgSrc" alt="">
            <i class="material-symbols-outlined trash-icon-overlay">delete</i>
            <div :class="['expiry-badge', `expiry-badge--${expiryUrgency(item.remainingDays)}`]">
              {{ calcRemainingDays(item.remainingDays) === 0 ? '已過期' : `剩 ${calcRemainingDays(item.remainingDays)} 天` }}
            </div>
          </div>
          <div class="footer-box">
            <div class="info-box">
              <div class="project-name">{{ item.name }}</div>
              <div class="lastModify">{{ item.deletedBy }}刪除・剩餘 {{ calcRemainingDays(item.remainingDays) }} 天</div>
            </div>
            <i class="material-symbols-outlined more-btn" @click="item.showMoreOption = true">more_horiz</i>
            <div :class="['next-option-box', { 'show': item.showMoreOption }]">
              <div class="option-item" @click="restoreProject(item)">還原</div>
              <div class="option-item" @click="permanentlyDelete(item)">永久刪除</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div class="p-5 mt-4 text-center fc-grey-1" v-if="!trashList.length">
        <div class="fs-16 mt-1">垃圾桶中沒有專案</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import popDialog from '@/services/popDialog';

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const route = useRoute();
const teamId = ref(route.query.teamId);
const teamName = ref(route.query.teamName);

// route 切換時同步更新 teamId/teamName 並重新拉取清單
watch(() => route.query, (newQuery) => {
  teamId.value = newQuery.teamId;
  teamName.value = newQuery.teamName;
  getTrashList();
});

// 目前選取的刪除者篩選值（空字串 = 顯示全部）
const filterDeleter = ref('');

// 從垃圾桶清單動態產生「所有刪除者」下拉選項
const deleterOptions = computed<{ name: string; value: string }[]>(() => {
  const names: { name: string; value: string }[] = [
    { name: '所有刪除者', value: '' },
    ...[...new Set<string>(trashList.value.map((item: any) => item.deletedBy as string))].map(name => ({ name, value: name })),
  ];
  return names;
});

// 垃圾桶專案清單（原始資料）
const trashList = ref([]) as any;

// 依篩選條件過濾後要顯示的清單
const displayProjectList = computed(() => {
  if (!filterDeleter.value) return trashList.value;
  return trashList.value.filter((item: any) => item.deletedBy === filterDeleter.value);
});

// 還原專案：彈出確認 dialog，確認後從清單移除（TODO 後端實作後改為 API 呼叫）
function restoreProject(item: any) {
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定還原嗎？</div>
      <div class="fs-16">將專案「${item.name}」還原至團隊專案。</div>
    </div>
  `,
  () => {
    trashList.value = trashList.value.filter((p: any) => p.id !== item.id);
  });
}


// 永久刪除專案：彈出確認 dialog，確認後從清單移除（TODO 後端實作後改為 API 呼叫）
function permanentlyDelete(item: any) {
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定永久刪除嗎？</div>
      <div class="fs-16">此操作無法復原，專案「${item.name}」將永久移除。</div>
    </div>
  `,
  () => {
    trashList.value = trashList.value.filter((p: any) => p.id !== item.id);
  });
}

// 計算從 datetime string 到現在的剩餘天數
function calcRemainingDays(dateStr: string): number {
  const expireTime = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)));
}

// 依剩餘天數回傳顏色等級
function expiryUrgency(dateStr: string): 'urgent' | 'warning' | 'normal' {
  const days = calcRemainingDays(dateStr);
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'normal';
}

// 取得垃圾桶專案清單
function getTrashList() {
  // TODO... 之後改成呼叫後端API，先造假資料測試UI
  trashList.value = [
    {
      showMoreOption: false,
      id: 'trash1',
      name: '專案名稱1',
      imgSrc: 'https://picsum.photos/410/240.webp?random=71',
      deletedBy: 'Syney',
      remainingDays: '2026-04-09 12:08:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
    {
      showMoreOption: false,
      id: 'trash2',
      name: '專案名稱2',
      imgSrc: 'https://picsum.photos/410/240.webp?random=72',
      deletedBy: 'Lucas',
      remainingDays: '2026-04-07 08:00:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
    {
      showMoreOption: false,
      id: 'trash3',
      name: '專案名稱3',
      imgSrc: 'https://picsum.photos/410/240.webp?random=73',
      deletedBy: 'Lucas',
      remainingDays: '2026-04-07 08:00:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
    {
      showMoreOption: false,
      id: 'trash4',
      name: '專案名稱4',
      imgSrc: 'https://picsum.photos/410/240.webp?random=74',
      deletedBy: '小烏龜',
      remainingDays: '2026-03-21 09:30:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
    {
      showMoreOption: false,
      id: 'trash5',
      name: '專案名稱5',
      imgSrc: 'https://picsum.photos/410/240.webp?random=75',
      deletedBy: 'Lucas',
      remainingDays: '2026-03-15 18:00:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
    {
      showMoreOption: false,
      id: 'trash6',
      name: '專案名稱6',
      imgSrc: 'https://picsum.photos/410/240.webp?random=76',
      deletedBy: 'Syney',
      remainingDays: '2026-03-11 12:08:00',
      team: { id: teamId.value || 'testTeam1', name: teamName.value || '團隊一' },
    },
  ];
}

onMounted(() => {
  getTrashList();
});
</script>
