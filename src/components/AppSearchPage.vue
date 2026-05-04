<template>
  <div class="AppSearchPage views-page">

    <div class="views-page-header">
      <h3>「{{ appSearchKeyword }}」的搜尋結果</h3>
      <div class="header-right-box">
        <compListCardSwitch v-model="viewMode"/>
      </div>
    </div>

    <!-- 過濾/排序條件 -->
    <div class="d-flex flex-justify-end">
      <compDropDown class="mr-1"
        :options="[
          { name: '全部公司', value: '' },
          { name: '企業A', value: 'companyA' },
          { name: '企業B', value: 'companyB' },
        ]"
        :show-search="false"
        :showClearTriggerIcon="false"
        :default-value="''"
        :max-height="'200px'"
        :width="'150px'"
        :openByDefault="false"
        placeholder="全部公司"
        @select="(item) => {
          filterCompanyValue = item.value;
        }"
      />
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
          sortTimeValue = item.value;
          sortFn();
        }"
      />
    </div>

    <!-- 查無資料 -->
    <div class="p-5 mt-4 text-center fc-grey-1">搜尋不到「{{ appSearchKeyword }}」相關專案</div>

    <!-- 卡片樣式列表 -->
    <div class="card-list-box mt-2" v-if="viewMode === 'card'">
      <div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="'card' + i">
        <div class="team-name-box">{{ item.company.name }} / {{ item.team.name }}</div>
        <div class="img-box">
          <img :src="item.imgSrc" alt="" @click="gotoAiViewer(item)">
        </div>
        <div class="footer-box">
          <div class="info-box">
            <div class="project-name">{{ item.name }}</div>
            <div class="lastModify">編輯於 {{ formatTimeToDisplay(item.lastModify) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格樣式列表 -->
    <div class="table-list-box project-list mt-2" v-if="viewMode === 'list'">
      <table class="custom-table">
        <thead>
          <tr>
            <th>專案名稱</th>
            <th width="160">所屬團隊</th>
            <th width="130">最後編輯時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in displayProjectList" :key="'list' + i"
            @mouseleave="item.showMoreOption = false;"
            @click="gotoAiViewer(item)">
            <td>

              <div class="img-box">
                <img :src="item.imgSrc" alt="">
              </div>

              {{ item.name }}
            </td>
            <td>{{ item.team.name }}</td>
            <td class="fc-grey-1">{{ formatTimeToDisplay(item.lastModify) }}</td>
          </tr>
        </tbody>
      </table>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import { useRouter } from 'vue-router';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import popDialog from '@/services/popDialog';
import { formatTimeToDisplay } from '@/utils/utils';

const rootStore = useRootStore();
const { appSearchKeyword, projectListMode: viewMode } = storeToRefs(rootStore);

// 條件
const filterCompanyValue = ref('') as Ref<string | number>;
const sortTimeValue = ref('desc') as Ref<string | number>;

// 模擬搜尋 API 的延遲避免輸入過快造成的頻繁請求
const seatchTimer = ref<number | null>(null);
// 送出關鍵字查詢
function sendSearch() {
  console.log('Sending search for keyword:', appSearchKeyword.value);
  // TOTO... ajax
}

// 專案列表  TODO... 這裡的資料結構只是測試用，之後要改成後端吐的格式
const projectList = ref([
  {
    showMoreOption: false, // TODO... 前端UI用, 之後後端吐的資料中, 前端要自己加上這個欄位來控制UI
    id: 'aaa',
    name: '26W官網選品建議',
    agents: [ 'testAgent1' ],
    imgSrc: 'https://picsum.photos/410/240.webp?random=62',
    owner: {
      userId: 'user1',
      uaerName: 'Lucas'
    },
    team: {
      id: 'team1',
      name: '團隊一'
    },
    company: {
      id: 'companyA',
      name: '企業A'
    },
    lastModify: '2026-03-05 12:08:00',
  },
  {
    showMoreOption: false, // TODO... 前端UI用, 之後後端吐的資料中, 前端要自己加上這個欄位來控制UI
    id: 'bbb',
    name: '26W特色鞋款行銷方案',
    agents: [ 'testAgent2', 'testAgent3' ],
    imgSrc: 'https://picsum.photos/410/240.webp?random=63',
    owner: {
      userId: 'user2',
      uaerName: '滷卡酥'
    },
    team: {
      id: 'team2',
      name: '團隊二'
    },
    company: {
      id: 'companyB',
      name: '企業B'
    },
    lastModify: '2026-04-27 12:05:00',
    status: 'pending',
  },
  {
    showMoreOption: false, // TODO... 前端UI用, 之後後端吐的資料中, 前端要自己加上這個欄位來控制UI
    id: 'ccc',
    name: '門市－長青鞋款銷售數據分析',
    agents: [ 'testAgent1', 'testAgent2', 'testAgent3' ],
    imgSrc: 'https://picsum.photos/410/240.webp?random=64',
    owner: {
      userId: 'user3',
      uaerName: '小烏龜'
    },
    team: {
      id: 'team2',
      name: '團隊二'
    },
    company: {
      id: 'companyB',
      name: '企業B'
    },
    lastModify: '2026-01-05 09:45:00',
  },
]);

// 過濾後要呈現的專案列表
const displayProjectList = computed(() => {
  if (filterCompanyValue.value) {
    return projectList.value.filter(item => item.company.id === filterCompanyValue.value);
  }
  return projectList.value;
});

// 清單排序 (目前先只有時間排序, 之後如果有其他排序條件再加在裡面)
function sortFn() {
  if (sortTimeValue.value === '' || sortTimeValue.value === 'desc') {
    projectList.value.sort((a, b) => new Date(b.lastModify).getTime() - new Date(a.lastModify).getTime());
  } else if (sortTimeValue.value === 'asc') {
    projectList.value.sort((a, b) => new Date(a.lastModify).getTime() - new Date(b.lastModify).getTime());
  }
}

watch(() => appSearchKeyword.value, (newVal) => {
  if (seatchTimer.value) {
    clearTimeout(seatchTimer.value);
  }
  if (!newVal) {
    return;
  }
  seatchTimer.value = window.setTimeout(() => {
    sendSearch();
  }, 500); // 搜尋延遲
});

onMounted(() => {
  sendSearch();
});

const router = useRouter();
function gotoAiViewer(item: any) {
  const { href } = router.resolve({ name: 'AiViewer', query: { id: item.id } });
  window.open(href, '_blank', 'noopener');
}

</script>
