<template>
  <!-- 產品列表組件, "最近使用/團隊專案" 兩個大單元共用此組件 -->
  <div class="ProjectListContent views-page-content-box">

    <div class="views-page-header">
      <h3>
        {{ title }}
        <div v-if="subtitle" class="secondary-box">{{ subtitle }}</div>
      </h3>
      <div class="header-right-box">
        <!-- 建立新專案按鈕區 (由父層透過 scoped slot 自訂) -->
        <slot name="createBtnSlot" :openProjectSettingModal="openProjectSettingModal" />
        <compListCardSwitch v-model="projectListMode"/>
      </div>
    </div>

    <!-- Agent 過濾 Tabs (只有 recent 模式才有) -->
    <compTabs class="mb-2"
      v-if="mode === 'recent'"
      v-model="filterAgent"
      :tabs="agentTabs"
    />

    <!-- 排序條件 -->
    <div class="d-flex flex-justify-end" v-if="projectList.length">
      <compDropDown
        :options="[
          { name: '時間排序 新 → 舊', value: 'desc' },
          { name: '時間排序 舊 → 新', value: 'asc' },
        ]"
        :show-search="false"
        :showClearTriggerIcon="false"
        :default-value="'desc'"
        :width="'190px'"
        :indent="'10px'"
        placeholder="依時間排序"
        @select="(item) => {
          sortValue = item.value;
          sortFn();
        }"
      />
    </div>

    <!-- 卡片樣式列表 -->
    <div class="card-list-box mt-2" v-if="projectListMode === 'card' && projectList.length">
      <div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="'card' + i"
        @click="gotoAiViewer(item)"
        @mouseenter="item.isHovered = true"
        @mouseleave="item.isHovered = false; item.showMoreOption = false">

        <!-- 只有 recent 才要出現 -->
        <div class="team-name-box" v-if="mode === 'recent'">{{ item.team.name }}</div>
        <i :class="['material-symbols-outlined favorite-btn', {
          'material-fill': i === 0,
          'active': i === 0
        }]" @click.stop>star</i>

        <!-- 圖片（預設顯示） -->
        <div class="img-box" v-show="!item.isHovered">
          <img :src="item.imgSrc" alt="">
          <div class="img-collab">
            <div class="avatar-group">
              <div
                :class="['avatar-sm', { 'avatar-owner': ci === 0 }]"
                v-for="(c, ci) in item.collaborators.slice(0, 3)"
                :key="ci"
                :style="{ backgroundColor: avatarColor(ci) }"
              >
                {{ c.name.slice(0, 1) }}
                <span v-if="ci === 0" class="owner-crown">👑</span>
              </div>
            </div>
            <span class="collab-count">{{ item.collaborators.length }} 人</span>
          </div>
        </div>

        <!-- 長條圖（hover 時顯示） -->
        <div class="chart-box" v-show="item.isHovered">
          <span class="chart-title">近一週使用次數</span>
          <div class="chart-bars">
            <div class="bar-wrap" v-for="(count, di) in item.weeklyUsage" :key="di">
              <span class="bar-count">{{ count }}</span>
              <div class="bar" :style="{ height: barHeight(count, item.weeklyUsage) + 'px' }"></div>
              <span class="bar-label">{{ weekLabel(di) }}</span>
            </div>
          </div>
        </div>

        <div class="footer-box">
          <div class="info-box">
            <div class="project-name">{{ item.name }}</div>
            <div class="status-row">
              <span :class="['status-badge', `status-${item.status}`]">
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <div class="lastModify">
              <template v-if="!item.isHovered">
                編輯於 {{ formatTimeToDisplay(item.lastModify) }}
              </template>
              <template v-else>
                近一週共 {{ item.weeklyUsage.reduce((a: number, b: number) => a + b, 0) }} 次
              </template>
            </div>
          </div>
          <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
          <!-- 更多選項小介面 -->
          <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
            <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
            <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格樣式列表 -->
    <div class="table-list-box project-list mt-2" v-if="projectListMode === 'list' && projectList.length">
      <table class="custom-table">
        <thead>
          <tr>
            <th>專案名稱</th>
            <th v-if="mode === 'recent'">所屬團隊</th>
            <th width="130">最後編輯時間</th>
            <th width="100"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in displayProjectList" :key="'list' + i"
            @mouseleave="item.showMoreOption = false;"
            @click="gotoAiViewer(item)">
            <td>
              <i :class="['material-symbols-outlined favorite-btn', {
                'material-fill': i === 0,
                'active': i === 0
              }]">star</i>

              <div class="img-box">
                <img :src="item.imgSrc" alt="">
              </div>

              {{ item.name }}
            </td>
            <td v-if="mode === 'recent'">{{ item.team.name }}</td>
            <td class="fc-grey-1">{{ formatTimeToDisplay(item.lastModify) }}</td>
            <td>
              <div class="d-flex">
                <div class="owner-box" v-tooltip="item.owner.uaerName">
                  {{ item.owner.uaerName.slice(0,1) }}
                </div>
                <i class="material-symbols-outlined material-fill more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
              </div>
              <!-- 更多選項小介面 -->
              <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
                <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
                <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mode 為 recent 沒有任何專案時 -->
    <div class="p-5 mt-4 text-center fc-grey-1" v-if="mode === 'recent' && !projectList.length">
      <div class="fs-16 mt-1">最近沒有使用的專案</div>
    </div>

    <!-- mode 為 team 沒有任何專案時 -->
    <div class="empty-box" v-if="mode === 'team' && !projectList.length" @click="openProjectSettingModal(null, true, teamId as string)">
      <i class="material-symbols-outlined">add</i>
    </div>
    <div class="fs-14 fc-grey-1 mt-1" v-if="mode === 'team' && !projectList.length">建立新專案</div>

    <!-- 隱藏按鈕: 作為 click 進入專案頁用 (會這樣做是因為方便_blank) -->
    <RouterLink :to="{ name: 'AiViewer', query: { id: LinkToProjectId } }" style="visibility: hidden;"
      target="_blank" ref="LinkToAiViewer">AiViewer</RouterLink>

  </div>

  <!-- 專案設定 Modal -->
  <ProjectSettingModal
    v-model="isOpenProjectSettingModal"
    :projectId="currentModifyProjectId"
    :isCreate="isCreateProject"
    :createTeamId="createUseTeamId"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import type { Ref } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import compTabs from '@/components/compTabs/compTabs.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import ProjectSettingModal from "@/components/AiViewer/ProjectSettingModal.vue";
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import popDialog from '@/services/popDialog';
import { formatTimeToDisplay } from '@/utils/utils';
import { barHeight, weekLabel, statusLabel } from '@/utils/projectCard';

const props = defineProps<{
  title: string
  subtitle?: string
  mode: 'recent' | 'team'
  teamId?: string
}>();

const { projectListMode } = storeToRefs(useRootStore());

// Agent 過濾條件 (只有 recent 模式才有)
const filterAgent = ref('ALL');
const agentTabs = [
  { label: '全部Agent', value: 'ALL' },
  { label: '業務助理', value: 'testAgent1' },
  { label: '數據分析', value: 'testAgent2' },
  { label: '行銷專員', value: 'testAgent3' },
];

const sortValue = ref('desc') as Ref<string | number>;
// 清單排序 (目前先只有時間排序, 之後如果有其他排序條件再加在裡面)
function sortFn() {
  if (sortValue.value === '' || sortValue.value === 'desc') {
    projectList.value.sort((a, b) => new Date(b.lastModify).getTime() - new Date(a.lastModify).getTime());
  } else if (sortValue.value === 'asc') {
    projectList.value.sort((a, b) => new Date(a.lastModify).getTime() - new Date(b.lastModify).getTime());
  }
}

// 專案列表  TODO... 這裡的資料結構只是測試用，之後要改成後端吐的格式
const projectList = ref([]) as any;

// 過濾後要呈現的專案列表
const displayProjectList = computed(() => {
  let list = projectList.value;
  if (props.teamId) {
    list = list.filter(item => item.team.id === props.teamId);
  }
  if (props.mode === 'recent' && filterAgent.value !== 'ALL') {
    list = list.filter(item => item.agents.includes(filterAgent.value));
  }
  return list;
});

// 開啟專案設定 Modal 相關
const isOpenProjectSettingModal = ref(false);
const currentModifyProjectId = ref('');
const isCreateProject = ref(false);
const createUseTeamId = ref('');
function openProjectSettingModal(modifyProject: any, isCreate = false, createTeamId = '') {
  createUseTeamId.value = createTeamId;
  isCreateProject.value = isCreate;

  if (isCreate) {
    isOpenProjectSettingModal.value = true;
    currentModifyProjectId.value = '';
    return;
  }

  console.log('open project setting modal, item = ', modifyProject);
  currentModifyProjectId.value = modifyProject.id;
  isOpenProjectSettingModal.value = true;
}

const AVATAR_COLORS = ['#7c6aff', '#f472b6', '#34d399', '#fb923c', '#60a5fa'];
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

const LinkToAiViewer = ref<{ $el: HTMLElement } | null>(null);
const LinkToProjectId = ref('');
function gotoAiViewer(item: any) {
  console.log('go to AiViewer, item = ', item);
  LinkToProjectId.value = item.id;
  nextTick(() => {
    LinkToAiViewer.value?.$el.click();
  });
}

function deleteProject(item: any) {
  console.log('delete project, item = ', item);
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">專案中仍有共編成員，確定要刪除嗎？</div>
    </div>
  `,
  () => {
    console.log('yes....');
    projectList.value = projectList.value.filter(project => project.id !== item.id);
  });
}

function getProjectList() {
  // TODO... 之後要改成呼叫後端API拿資料,先造假資料測試UI
  const temp = [{
    showMoreOption: false, // TODO... 前端UI用, 之後後端吐的資料中, 前端要自己加上這個欄位來控制UI
    id: 'aaa',
    name: '26W官網選品建議',
    agents: ['testAgent1'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=62',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'Teva電子商務' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-03-05 12:00:00',
    isHovered: false,
    status: 'active',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
      { userId: 'user2', name: '滷卡酥' },
      { userId: 'user3', name: '小烏龜' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  },
  {
    showMoreOption: false,
    id: 'bbb',
    name: '26W特色鞋款行銷方案',
    agents: ['testAgent2', 'testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=63',
    owner: {
      userId: 'user2',
      uaerName: '滷卡酥'
    },
    team: { id: 'testTeam2', name: 'Teva實體門市' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-03-05 12:05:00',
    isHovered: false,
    status: 'review',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
      { userId: 'user2', name: '滷卡酥' },
      { userId: 'user3', name: '小烏龜' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  },
  {
    showMoreOption: false,
    id: 'ccc',
    name: '門市－長青鞋款銷售數據分析',
    agents: ['testAgent1', 'testAgent2', 'testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=64',
    owner: {
      userId: 'user3',
      uaerName: '小烏龜'
    },
    team: { id: 'testTeam2', name: 'Teva實體門市' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-03-04 12:00:00',
    isHovered: false,
    status: 'done',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
      { userId: 'user2', name: '滷卡酥' },
      { userId: 'user3', name: '小烏龜' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  },
  {
    showMoreOption: false,
    id: 'ddd',
    name: '電商－長青鞋款銷售數據分析',
    agents: ['testAgent1'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=65',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'Teva電子商務' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-03-04 23:59:00',
    isHovered: false,
    status: 'active',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
      { userId: 'user2', name: '滷卡酥' },
      { userId: 'user3', name: '小烏龜' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  },
  {
    showMoreOption: false,
    id: 'eee',
    name: '經常消費用戶圖譜',
    agents: ['testAgent2'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=66',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'Teva電子商務' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2024-06-04 12:30:00',
    isHovered: false,
    status: 'pending',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  },
  {
    showMoreOption: false,
    id: 'fff',
    name: '新用戶消費傾向分析＋潛在消費傾向',
    agents: ['testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=67',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'Teva電子商務' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2024-06-04 13:30:00',
    isHovered: false,
    status: 'pending',
    collaborators: [
      { userId: 'user1', name: 'Lucas' },
    ],
    weeklyUsage: [5, 12, 8, 20, 15, 3, 18],
  }];

  if (props.mode === 'recent') {
    projectList.value = temp;
  } else if (props.mode === 'team' && props.teamId) {
    projectList.value = temp.filter(item => item.team.id === props.teamId);
  }
}

// 如果是 temp 模式,且 teamId 有異動就重新拿一次專案列表
if (props.mode === 'team') {
  watch(() => props.teamId, () => {
    getProjectList();
  });
}

onMounted(() => {
  getProjectList();
});
</script>
