<template>
  <!-- 產品列表組件, "最近使用/團隊專案" 兩個大單元共用此組件 -->
  <div class="ProjectListContent">

    <!-- Banner Header -->
    <div class="plc-banner">
      <div class="plc-banner-left">
        <AppBreadcrumb />
        <div class="plc-banner-title">{{ mode === 'team' ? subtitle : title }}</div>
        <div v-if="!isLoading && !hasError" class="plc-banner-subtitle">
          {{ displayProjectList.length }} projects
        </div>
      </div>
      <div class="plc-banner-right">
        <slot name="createBtnSlot" :openProjectSettingModal="openProjectSettingModal" />
      </div>
    </div>

    <!-- Tabs + 工具列合併為單行 -->
    <div class="plc-toolbar">
      <div class="plc-toolbar-left">
        <compTabs
          v-if="mode === 'recent'"
          v-model="filterAgent"
          :tabs="agentTabs"
        />
      </div>
      <div class="plc-toolbar-right">
        <compDropDown
          v-if="!isLoading && !hasError && projectList.length"
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
        <compListCardSwitch v-model="projectListMode"/>
      </div>
    </div>

    <!-- .plc-body 預設是 display:contents（見 scss），不影響 team 模式版面；
         只有 mode="recent" 時才變成「內容＋右側常駐 widget 欄」的 2 欄 grid -->
    <div class="plc-body" :class="{ 'plc-body--home': mode === 'recent' }">
    <div class="plc-content">
    <AppSkeleton v-if="isLoading" type="list" class="mt-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <template v-else>

      <!-- 精選區：只有「最近使用」的卡片檢視才顯示，依已加星號的專案數量切換呈現方式 -->
      <div class="featured-zone" v-if="mode === 'recent' && projectListMode === 'card' && favoriteProjects.length">
        <div class="plc-section-label">★ 已加星號<span v-if="favoriteProjects.length > 1">（{{ favoriteProjects.length }}）</span></div>

        <!-- 剛好 1 顆星：維持大張 Hero -->
        <div class="hero-card" v-if="favoriteProjects.length === 1" @click="gotoAiViewer(favoriteProjects[0])">
          <div class="hero-thumb"><img :src="favoriteProjects[0].imgSrc" alt=""></div>
          <div class="hero-body">
            <div class="hero-eyebrow-row">
              <span class="hero-eyebrow">已加星號 · {{ favoriteProjects[0].team.name }}</span>
              <i class="material-symbols-outlined card-star material-fill active"
                @click.stop="toggleFavorite(favoriteProjects[0])">star</i>
            </div>
            <div class="hero-name">{{ favoriteProjects[0].name }}</div>
            <div class="hero-meta-row">
              <div class="card-avatars">
                <div :class="['avatar-chip', { 'avatar-owner': ci === 0 }]"
                  v-for="(c, ci) in favoriteProjects[0].collaborators.slice(0, 3)" :key="ci"
                  :style="{ backgroundColor: avatarColor(ci) }">{{ c.name.slice(0, 1) }}</div>
              </div>
              <span class="hero-collab-count">{{ favoriteProjects[0].collaborators.length }} 人共編</span>
            </div>
            <div class="hero-chart">
              <div class="bar" v-for="(count, di) in favoriteProjects[0].weeklyUsage" :key="di"
                :class="{ today: di === favoriteProjects[0].weeklyUsage.length - 1 }"
                :style="{ height: barHeight(count, favoriteProjects[0].weeklyUsage) + 'px' }"></div>
            </div>
            <div class="hero-foot">
              <span :class="['card-status', `status-${favoriteProjects[0].status}`]">
                <i class="status-dot"></i>{{ statusLabel(favoriteProjects[0].status) }}
              </span>
              <span class="card-time">{{ formatTimeToDisplay(favoriteProjects[0].lastModify) }}</span>
            </div>
          </div>
        </div>

        <!-- 剛好 2 顆星：兩張等寬中型卡片並排撐滿整排，避免橫向捲動列留白 -->
        <div class="featured-duo" v-else-if="favoriteProjects.length === 2">
          <div class="duo-card" v-for="item in favoriteProjects" :key="'duo' + item.id" @click="gotoAiViewer(item)">
            <div class="duo-thumb"><img :src="item.imgSrc" alt=""></div>
            <div class="duo-body">
              <div class="hero-eyebrow-row">
                <span class="duo-eyebrow">{{ item.team.name }}</span>
                <i class="material-symbols-outlined card-star material-fill active"
                  @click.stop="toggleFavorite(item)">star</i>
              </div>
              <div class="duo-name">{{ item.name }}</div>
              <div class="duo-foot">
                <span :class="['card-status', `status-${item.status}`]">
                  <i class="status-dot"></i>{{ statusLabel(item.status) }}
                </span>
                <span class="card-time">{{ formatTimeToDisplay(item.lastModify) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3 顆星以上：固定寬度、可橫向捲動的精選列 -->
        <div class="featured-row" v-else>
          <div class="featured-card" v-for="item in favoriteProjects" :key="'feat' + item.id" @click="gotoAiViewer(item)">
            <div class="featured-thumb"><img :src="item.imgSrc" alt=""></div>
            <div class="featured-body">
              <div class="hero-eyebrow-row">
                <span class="featured-eyebrow">{{ item.team.name }}</span>
                <i class="material-symbols-outlined card-star material-fill active"
                  @click.stop="toggleFavorite(item)">star</i>
              </div>
              <div class="featured-name">{{ item.name }}</div>
              <div class="featured-foot">
                <span :class="['card-status', `status-${item.status}`]">
                  <i class="status-dot"></i>{{ statusLabel(item.status) }}
                </span>
                <span class="card-time">{{ formatTimeToDisplay(item.lastModify) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="plc-section-label">其他專案</div>
      </div>

      <!-- 卡片樣式列表：「最近使用」卡片檢視時排除已在上面精選區出現的專案，避免重複 -->
      <div class="card-list-box" v-if="projectListMode === 'card' && projectList.length">
        <div class="project-card" v-for="item in gridProjects" :key="'card' + item.id"
          @click="gotoAiViewer(item)"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false; item.showMoreOption = false">

          <!-- 狀態色條 -->
          <div :class="['card-status-strip', `strip-${item.status}`]"></div>

          <!-- 圖片區（預設顯示）：純視覺，不再疊加頭像/收藏等 UI 元件 -->
          <div class="card-img" v-show="!item.isHovered">
            <img :src="item.imgSrc" alt="">
          </div>

          <!-- 長條圖區（hover 時顯示） -->
          <div class="card-chart" v-show="item.isHovered">
            <div class="chart-project-name">{{ item.name }}</div>
            <div class="chart-bars">
              <div class="bar-wrap" v-for="(count, di) in item.weeklyUsage" :key="di">
                <span class="bar-count">{{ count }}</span>
                <div class="bar" :style="{ height: barHeight(count, item.weeklyUsage) + 'px' }"></div>
                <span class="bar-label">{{ weekLabel(di) }}</span>
              </div>
            </div>
            <div class="chart-total">
              近一週共 {{ item.weeklyUsage.reduce((a: number, b: number) => a + b, 0) }} 次
            </div>
          </div>

          <!-- 卡片內容：團隊/收藏 → 標題（主角）→ 狀態/時間 → 協作者/更多，四層各自一行 -->
          <div class="card-body">
            <div class="card-row-top">
              <span class="card-team" v-if="mode === 'recent'">{{ item.team.name }}</span>
              <i :class="['material-symbols-outlined card-star', {
                'material-fill': item.isFavorite,
                'active': item.isFavorite
              }]" @click.stop="toggleFavorite(item)">star</i>
            </div>

            <div class="card-name" v-show="!item.isHovered">{{ item.name }}</div>

            <div class="card-row-status">
              <span :class="['card-status', `status-${item.status}`]">
                <i class="status-dot"></i>{{ statusLabel(item.status) }}
              </span>
              <span class="card-time">{{ formatTimeToDisplay(item.lastModify) }}</span>
            </div>

            <div class="card-row-foot">
              <div class="card-avatars">
                <div
                  :class="['avatar-chip', { 'avatar-owner': ci === 0 }]"
                  v-for="(c, ci) in item.collaborators.slice(0, 3)"
                  :key="ci"
                  :style="{ backgroundColor: avatarColor(ci) }"
                >
                  {{ c.name.slice(0, 1) }}
                </div>
                <span class="collab-count">{{ item.collaborators.length }} 人</span>
              </div>
              <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
            </div>

            <!-- 更多選項小介面 -->
            <div :class="['next-option-box', {'show': item.showMoreOption}]" @click.stop>
              <div class="option-item" @click.stop="deleteProject(item)">刪除</div>
              <div class="option-item" @click.stop="openProjectSettingModal(item)">專案設定</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格樣式列表 -->
      <div class="table-list-box mt-2" v-if="projectListMode === 'list' && projectList.length">
        <table class="custom-table">
          <thead>
            <tr>
              <th>專案名稱</th>
              <th v-if="mode === 'recent'">所屬團隊</th>
              <th>狀態</th>
              <th width="130">最後編輯時間</th>
              <th width="100"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in displayProjectList" :key="'list' + i"
              @mouseleave="item.showMoreOption = false;"
              @click="gotoAiViewer(item)">
              <td>
                <div class="d-flex flex-align-center" style="gap: 10px">
                  <i :class="['material-symbols-outlined favorite-btn', {
                    'material-fill': item.isFavorite,
                    'active': item.isFavorite
                  }]" @click.stop="toggleFavorite(item)">star</i>
                  <img :src="item.imgSrc" alt="" class="td-thumb">
                  <span style="font-weight: 600">{{ item.name }}</span>
                </div>
              </td>
              <td v-if="mode === 'recent'">{{ item.team.name }}</td>
              <td>
                <span :class="['status-badge', `status-${item.status}`]">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td style="color: var(--color-wise-gray); font-size: 12px">
                {{ formatTimeToDisplay(item.lastModify) }}
              </td>
              <td>
                <div class="d-flex flex-align-center" style="gap: 8px">
                  <div class="owner-box" v-tooltip="item.owner.uaerName"
                    :style="{ backgroundColor: avatarColor(0) }">
                    {{ item.owner.uaerName.slice(0,1) }}
                  </div>
                  <i class="material-symbols-outlined more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
                </div>
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
      <div class="empty-box" v-if="mode === 'team' && !projectList.length"
        @click="openProjectSettingModal(null, true, teamId as string)">
        <div class="empty-icon">
          <i class="material-symbols-outlined">add</i>
        </div>
        <div class="empty-title">建立第一個專案</div>
        <div class="empty-sub">點擊此處為這個團隊建立新專案</div>
      </div>

    </template>
    </div><!-- /plc-content -->

    <!-- 右側常駐 widget 欄：只有「最近使用」才顯示，內容都取自產品已有的資料
         （journeyStore 的旅程紀錄、各團隊專案數、依時間排序的近期專案動態） -->
    <div class="plc-home-side" v-if="mode === 'recent'">

      <div class="plc-widget">
        <div class="plc-widget-head">
          <span class="plc-widget-title">旅程進度</span>
          <button type="button" class="plc-widget-link" @click="goToJourneys">查看全部 →</button>
        </div>
        <template v-if="journeys.length">
          <div class="journey-summary"><b>{{ journeyRunningCount }}</b>&nbsp;進行中&nbsp;&nbsp;·&nbsp;&nbsp;<b>{{ journeyDoneCount }}</b>&nbsp;已完成</div>
          <div class="journey-row" v-for="j in recentJourneys" :key="j.id">
            <div :class="['journey-icon', j.status]">
              <i class="material-symbols-outlined">{{ j.status === 'done' ? 'check_circle' : 'autorenew' }}</i>
            </div>
            <div class="journey-main">
              <div class="journey-name">{{ journeyTypeLabel(j.journeyType) }} · {{ j.userName }}</div>
              <div class="journey-sub">{{ j.nodes.filter((n: any) => n.status === 'done').length }}／{{ j.nodes.length }} 節點完成</div>
            </div>
            <div class="journey-progress-track"><div class="journey-progress-fill" :style="{ width: journeyProgressPct(j) + '%' }"></div></div>
          </div>
        </template>
        <div class="plc-widget-empty" v-else>
          尚無旅程紀錄。到 AiViewer 生成行銷自動化旅程後，會顯示在這裡。
        </div>
      </div>

      <div class="plc-widget" v-if="teamStats.length">
        <div class="plc-widget-head"><span class="plc-widget-title">團隊統計</span></div>
        <div class="team-stat-row" v-for="(t, ti) in teamStats" :key="t.id">
          <span class="team-stat-dot" :style="{ background: avatarColor(ti) }"></span>
          <span class="team-stat-name">{{ t.name }}</span>
          <span class="team-stat-count">{{ t.count }}</span>
        </div>
      </div>

      <div class="plc-widget" v-if="recentActivity.length">
        <div class="plc-widget-head"><span class="plc-widget-title">近期動態</span></div>
        <div class="activity-row" v-for="item in recentActivity" :key="'act' + item.id">
          <div class="activity-main">
            <div class="activity-text"><b>{{ item.name }}</b>　{{ statusLabel(item.status) }}</div>
            <div class="activity-time">{{ formatTimeToDisplay(item.lastModify) }}</div>
          </div>
        </div>
      </div>

    </div>

    </div><!-- /plc-body -->

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
import { ref, computed, onMounted, watch } from 'vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import { useJourneyStore, type JourneyRecord, type JourneyType } from '@/stores/journeyStore';
import compTabs from '@/components/compTabs/compTabs.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import ProjectSettingModal from "@/components/AiViewer/ProjectSettingModal.vue";
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import popDialog from '@/services/popDialog';
import { formatTimeToDisplay } from '@/utils/utils';
import { barHeight, weekLabel, statusLabel } from '@/utils/projectCard';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';

const props = defineProps<{
  title: string
  subtitle?: string
  mode: 'recent' | 'team'
  teamId?: string
}>();

const { projectListMode } = storeToRefs(useRootStore());
const { journeys } = storeToRefs(useJourneyStore());

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
    projectList.value.sort((a: any, b: any) => new Date(b.lastModify).getTime() - new Date(a.lastModify).getTime());
  } else if (sortValue.value === 'asc') {
    projectList.value.sort((a: any, b: any) => new Date(a.lastModify).getTime() - new Date(b.lastModify).getTime());
  }
}

// 專案列表  TODO... 這裡的資料結構只是測試用，之後要改成後端吐的格式
const projectList = ref([]) as any;

const {
  data: projectListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => projectList.value);

// 過濾後要呈現的專案列表
const displayProjectList = computed(() => {
  let list = (projectListData.value ?? []) as any[];
  if (props.teamId) {
    list = list.filter(item => item.team.id === props.teamId);
  }
  if (props.mode === 'recent' && filterAgent.value !== 'ALL') {
    list = list.filter(item => item.agents.includes(filterAgent.value));
  }
  return list;
});

// 已加星號 / 其他專案：只有「最近使用」的卡片檢視會把已加星號的專案
// 拉到上面的精選區，其他情境（團隊專案、表格檢視）維持完整清單，不拆分
function toggleFavorite(item: any) {
  item.isFavorite = !item.isFavorite;
}
const favoriteProjects = computed(() => displayProjectList.value.filter((item: any) => item.isFavorite));
const otherProjects = computed(() => displayProjectList.value.filter((item: any) => !item.isFavorite));
const gridProjects = computed(() => {
  if (props.mode === 'recent' && projectListMode.value === 'card') {
    return otherProjects.value;
  }
  return displayProjectList.value;
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

// 協作者頭像色：與品牌色同一組調性（去飽和），不用跟主題無關的彩虹色
const AVATAR_COLORS = ['#00A078', '#5B7B8C', '#8A6D3B', '#6B5B95', '#B5654A'];
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

const router = useRouter();
function gotoAiViewer(item: any) {
  const { href } = router.resolve({ name: 'AiViewer', query: { id: item.id } });
  window.open(href, '_blank', 'noopener');
}

// ── 右側常駐 widget 欄（只有 mode="recent" 會用到）─────────────────
// 團隊統計：依團隊分組算出每個團隊目前的專案數量，資料直接來自現有專案清單
const teamStats = computed(() => {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const item of (projectListData.value ?? []) as any[]) {
    const key = item.team.id;
    if (!map.has(key)) map.set(key, { id: key, name: item.team.name, count: 0 });
    map.get(key)!.count += 1;
  }
  return Array.from(map.values());
});

// 近期動態：依最後編輯時間排序取前幾筆，跟卡片/表格用的是同一份真實資料，
// 只是換一個「動態」的呈現角度，不是憑空生出來的假事件
const recentActivity = computed(() => {
  return [...((projectListData.value ?? []) as any[])]
    .sort((a, b) => new Date(b.lastModify).getTime() - new Date(a.lastModify).getTime())
    .slice(0, 4);
});

// 旅程進度：抓 journeyStore 的真實紀錄（AiViewer 生成行銷自動化旅程時寫入）。
// 目前這頁完全沒有入口在主選單上，藉這個 widget 順便讓使用者找得到。
const journeyRunningCount = computed(() => journeys.value.filter((j: JourneyRecord) => j.status === 'running').length);
const journeyDoneCount = computed(() => journeys.value.filter((j: JourneyRecord) => j.status === 'done').length);
const recentJourneys = computed(() => journeys.value.slice(0, 2));
function journeyProgressPct(journey: JourneyRecord): number {
  if (!journey.nodes.length) return 0;
  const done = journey.nodes.filter(n => n.status === 'done').length;
  return Math.round((done / journey.nodes.length) * 100);
}
const JOURNEY_TYPE_LABELS: Record<JourneyType, string> = {
  marketing: '行銷自動化旅程',
  birthday: '生日自動化旅程',
};
function journeyTypeLabel(type: JourneyType): string {
  return JOURNEY_TYPE_LABELS[type] ?? '自動化旅程';
}
function goToJourneys() {
  router.push('/view/journeys');
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
    projectList.value = projectList.value.filter((project: any) => project.id !== item.id);
  });
}

function getProjectList() {
  // TODO... 之後要改成呼叫後端API拿資料,先造假資料測試UI
  const temp = [{
    showMoreOption: false, // TODO... 前端UI用, 之後後端吐的資料中, 前端要自己加上這個欄位來控制UI
    id: 'aaa',
    isFavorite: true,
    name: '26W官網選品建議',
    agents: ['testAgent1'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=62',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'UGG電子商務' },
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
    isFavorite: false,
    name: '26W特色鞋款行銷方案',
    agents: ['testAgent2', 'testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=63',
    owner: {
      userId: 'user2',
      uaerName: '滷卡酥'
    },
    team: { id: 'testTeam2', name: 'UGG實體門市' },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-04-27 12:05:00',
    isHovered: false,
    status: 'pending',
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
    isFavorite: false,
    name: '門市－長青鞋款銷售數據分析',
    agents: ['testAgent1', 'testAgent2', 'testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=64',
    owner: {
      userId: 'user3',
      uaerName: '小烏龜'
    },
    team: { id: 'testTeam2', name: 'UGG實體門市' },
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
    isFavorite: false,
    name: '電商－長青鞋款銷售數據分析',
    agents: ['testAgent1'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=65',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'UGG電子商務' },
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
    isFavorite: false,
    name: '經常消費用戶圖譜',
    agents: ['testAgent2'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=66',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'UGG電子商務' },
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
    isFavorite: false,
    name: '新用戶消費傾向分析＋潛在消費傾向',
    agents: ['testAgent3'],
    imgSrc: 'https://picsum.photos/410/240.webp?random=67',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: { id: 'testTeam1', name: 'UGG電子商務' },
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
