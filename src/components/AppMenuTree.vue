<template>
  <!-- 手機漢堡按鈕（僅手機尺寸顯示） -->
  <button class="hamburger-btn" @click="toggleMobileMenu">
    <i class="material-symbols-outlined">{{ isMobileMenuOpen ? 'close' : 'menu' }}</i>
  </button>

  <!-- 手機 overlay（選單開啟時顯示） -->
  <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="closeMobileMenu" />

  <!-- ============================================================
       桌機／平板：圖示條（rail）＋ 團隊 hover 彈出選單
       通用單元（最近使用／探索）直接是 rail 上的按鈕，點擊即切換內容；
       團隊單元則各自一顆圖示，hover／點擊才彈出「該團隊」專屬選單。
       ============================================================ -->
  <div :class="['AppMenuTree', { 'is-mobile-open': isMobileMenuOpen }]">

    <div class="rail-top">
      <img class="rail-logo" src="@/assets/logo.svg" alt="JustAgent" />

      <RouterLink to="/view/ProjectDashboard" class="rail-btn" :class="{ active: route.path === '/view/ProjectDashboard' }" v-tooltip.right="'最近使用'">
        <i class="material-symbols-outlined">schedule</i>
      </RouterLink>
      <RouterLink to="/view/Explore" class="rail-btn" :class="{ active: route.path === '/view/Explore' }" v-tooltip.right="'探索'">
        <i class="material-symbols-outlined">lightbulb</i>
      </RouterLink>

      <button type="button" class="rail-btn" :class="{ active: isSearchOpen }" v-tooltip.right="'搜尋'"
        @click="isSearchOpen = true">
        <i class="material-symbols-outlined">search</i>
      </button>

      <!-- 搜尋彈出框：點擊搜尋圖示才出現，不佔用 rail 常駐空間 -->
      <div class="rail-popover search-popover" v-show="isSearchOpen" ref="searchPopoverEl">
        <div class="universal-search-box">
          <i class="material-symbols-outlined">search</i>
          <i class="material-symbols-outlined fc-grey-1 clear-btn" v-if="appSearchKeyword" @click="appSearchKeyword = ''; isEnterAppSearchPage = false;">close</i>
          <input type="text" class="custom-input w-100" placeholder="搜尋" v-model="appSearchKeyword" ref="searchInputEl" @keyup="() => {
            isEnterAppSearchPage = true;
            if (appSearchKeyword === '') {
              isEnterAppSearchPage = false;
            }
          }"/>
        </div>
      </div>

      <div class="rail-divider"></div>
    </div>

    <!-- 團隊：每個團隊一顆圖示，hover/點擊彈出該團隊專屬選單。
         獨立成可捲動區塊，團隊數量一多也不會把下方設定/使用者按鈕擠出畫面 -->
    <div class="rail-teams" ref="railTeamsEl" @wheel.stop="handleContentWheel($event);">
      <div class="rail-team-btn" v-for="(item, i) in testGroups" :key="'team' + item.id"
        :class="{ 'is-open': openTeamId === item.id }"
        :style="{ background: teamColor(i) }"
        v-tooltip.right="item.name"
        @mouseenter="openTeamFlyout(item.id, $event)"
        @mouseleave="scheduleCloseTeamFlyout()"
        @click="openTeamFlyout(item.id, $event)">
        {{ teamInitial(item.name) }}
      </div>
    </div>

    <!-- 團隊選單彈出框：Teleport 到 body，避免被 .rail-teams 的 overflow-y:auto 裁切；
         位置依當前 hover/點擊的圖示座標動態計算（見 openTeamFlyout） -->
    <Teleport to="body">
      <div class="rail-popover team-flyout" ref="teamFlyoutEl" v-show="openTeamId && activeTeam" :style="flyoutStyle"
        @mouseenter="cancelCloseTeamFlyout" @mouseleave="scheduleCloseTeamFlyout">
        <template v-if="activeTeam">
          <div class="team-flyout-title">{{ activeTeam.name }}</div>

          <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: activeTeam.id, teamName: activeTeam.name } }"
            class="flyout-item" :class="{ active: route.path === '/view/TeamProject' && route.query.teamId == activeTeam.id }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">folder</i>團隊專案
          </RouterLink>
          <RouterLink to="/view/Skills"
            class="flyout-item" :class="{ active: route.path === '/view/Skills' }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">auto_awesome</i>技能清單
          </RouterLink>
          <RouterLink to="/view/SkillTest"
            class="flyout-item" :class="{ active: route.path === '/view/SkillTest' }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">science</i>技能測試沙盒
          </RouterLink>
          <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: activeTeam.id, teamName: activeTeam.name } }"
            class="flyout-item" :class="{ active: route.path === '/view/ResourceLibrary' && route.query.teamId == activeTeam.id }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">folder_open</i>共用檔案管理
          </RouterLink>
          <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: activeTeam.id, teamName: activeTeam.name } }"
            class="flyout-item" :class="{ active: route.path === '/view/KnowledgeBase' && route.query.teamId == activeTeam.id }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">menu_book</i>知識庫管理
          </RouterLink>
          <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: activeTeam.id, teamName: activeTeam.name } }"
            class="flyout-item" :class="{ active: route.path === '/view/TeamAccessManagement' && route.query.teamId == activeTeam.id }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">lock_person</i>權限管理
          </RouterLink>
          <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: activeTeam.id, teamName: activeTeam.name } }"
            class="flyout-item" :class="{ active: route.path === '/view/ProjectTrashCans' && route.query.teamId == activeTeam.id }"
            @click="closeTeamFlyout">
            <i class="material-symbols-outlined">auto_delete</i>專案垃圾桶
          </RouterLink>
        </template>
      </div>
    </Teleport>

    <div class="rail-bottom">
      <RouterLink to="/view/CompanyTeamSettings" class="rail-btn" :class="{ active: route.path === '/view/CompanyTeamSettings' }" v-tooltip.right="'企業/團隊設定'">
        <i class="material-symbols-outlined">settings</i>
      </RouterLink>

      <div :class="['rail-user-btn', { active: isOpenUserOptionsBox }]" @click="isOpenUserOptionsBox = true">
        <div class="user-avatar">L</div>

        <div class="rail-popover user-flyout next-option-box" ref="moreUserOptionsBox" v-show="isOpenUserOptionsBox">
          <div class="user-flyout-title">
            <p class="user-name">Lucas.chien</p>
            <select class="custom-select w-100 mt-1" v-model="rootStore.nowMenuTreeCompanyName" @click.stop>
              <option value="UGG">UGG</option>
              <option value="UGG">UGG</option>
            </select>
          </div>
          <div class="option-item" @click="rootStore.isShowBuserModal = true">個人設定</div>
          <div class="option-item" @click="handleLogout">登出</div>
        </div>
      </div>
    </div>

  </div>

  <!-- ============================================================
       手機：漢堡選單維持清單式（hover 選單在觸控裝置上不適用）
       ============================================================ -->
  <div class="AppMenuTreeMobile" v-if="isMobileMenuOpen">
    <div class="mobile-header">
      <div class="user-avatar">L</div>
      <p class="user-name">Lucas.chien</p>
    </div>
    <div class="universal-search-box mobile-search">
      <i class="material-symbols-outlined">search</i>
      <input type="text" class="custom-input w-100" placeholder="搜尋" v-model="appSearchKeyword" @keyup="() => {
        isEnterAppSearchPage = true;
        if (appSearchKeyword === '') { isEnterAppSearchPage = false; }
      }"/>
    </div>
    <RouterLink to="/view/ProjectDashboard" class="mobile-item" @click="closeMobileMenu">
      <i class="material-symbols-outlined">schedule</i>最近使用
    </RouterLink>
    <RouterLink to="/view/Explore" class="mobile-item" @click="closeMobileMenu">
      <i class="material-symbols-outlined">lightbulb</i>探索
    </RouterLink>
    <RouterLink to="/view/CompanyTeamSettings" class="mobile-item" @click="closeMobileMenu">
      <i class="material-symbols-outlined">settings</i>企業/團隊設定
    </RouterLink>

    <div class="mobile-team-block" v-for="(item, i) in testGroups" :key="'mteam' + item.id">
      <div class="mobile-team-header" @click="item.isOpen = !item.isOpen">
        <span class="mobile-team-dot" :style="{ background: teamColor(i) }">{{ teamInitial(item.name) }}</span>
        {{ item.name }}
        <i class="material-symbols-outlined mobile-team-arrow">{{ item.isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <template v-if="item.isOpen">
        <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: item.id, teamName: item.name } }" class="mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">folder</i>團隊專案
        </RouterLink>
        <RouterLink to="/view/Skills" class="mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_awesome</i>技能清單
        </RouterLink>
        <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: item.id, teamName: item.name } }" class="mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">folder_open</i>共用檔案管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: item.id, teamName: item.name } }" class="mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">lock_person</i>權限管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: item.id, teamName: item.name } }" class="mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_delete</i>專案垃圾桶
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { handleContentWheel, initClickOutsideListener } from '@/utils/utils';

const route = useRoute();
const router = useRouter();

const rootStore = useRootStore();
const { isEnterAppSearchPage, appSearchKeyword, testGroups } = storeToRefs(rootStore);

// 團隊圖示色票：跟品牌色同一組調性（去飽和），不用跟主題無關的彩虹色
const TEAM_COLORS = ['#00A078', '#5B7B8C', '#8A6D3B', '#6B5B95', '#B5654A'];
function teamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
// 團隊圖示上顯示的字：取團隊名稱去掉公司前綴後的第一個字（例如「UGG電子商務」→「電」）
function teamInitial(name: string): string {
  const stripped = name.replace(/^UGG/, '');
  return (stripped || name).charAt(0);
}

// 團隊 hover 彈出選單：Teleport 到 body（見 template），所以位置要依觸發圖示的
// 座標動態計算；滑鼠移開時延遲關閉，避免滑到選單本體途中閃爍消失
const openTeamId = ref<string | null>(null);
const flyoutStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' });
const activeTeam = computed(() => testGroups.value.find((g: any) => g.id === openTeamId.value) ?? null);

let closeTeamTimer: ReturnType<typeof setTimeout> | null = null;
const railTeamsEl = ref<HTMLElement | null>(null);
const teamFlyoutEl = ref<HTMLElement | null>(null);

function positionFlyout(triggerEl: HTMLElement) {
  const rect = triggerEl.getBoundingClientRect();
  flyoutStyle.value = {
    top: Math.round(rect.top - 4) + 'px',
    left: Math.round(rect.right + 10) + 'px',
  };
}
function openTeamFlyout(id: string, event: MouseEvent) {
  if (closeTeamTimer) { clearTimeout(closeTeamTimer); closeTeamTimer = null; }
  positionFlyout(event.currentTarget as HTMLElement);
  openTeamId.value = id;
}
function scheduleCloseTeamFlyout() {
  closeTeamTimer = setTimeout(() => { openTeamId.value = null; }, 150);
}
function cancelCloseTeamFlyout() {
  if (closeTeamTimer) { clearTimeout(closeTeamTimer); closeTeamTimer = null; }
}
function closeTeamFlyout() {
  openTeamId.value = null;
}

// 搜尋彈出框
const isSearchOpen = ref(false);
const searchPopoverEl = ref<HTMLElement | null>(null);
const searchInputEl = ref<HTMLInputElement | null>(null);
watch(isSearchOpen, (open) => {
  if (open) nextTick(() => searchInputEl.value?.focus());
});

const moreUserOptionsBox = ref<HTMLElement | null>(null);
const isOpenUserOptionsBox = ref(false);

const handleLogout = () => {
  isOpenUserOptionsBox.value = false;
  router.push('/');
};

const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const closeMobileMenu = () => { isMobileMenuOpen.value = false; };

// 團隊選單點擊外部關閉：因為選單跟觸發圖示（.rail-teams 底下多顆按鈕）分屬
// Teleport 後的兩個不同節點，initClickOutsideListener 只能綁單一元素，
// 這裡另外處理，同時支援滑鼠與觸控裝置
function handleTeamFlyoutOutsideClick(event: MouseEvent | TouchEvent) {
  if (!openTeamId.value) return;
  const target = event.target as Node;
  if (railTeamsEl.value?.contains(target)) return;
  if (teamFlyoutEl.value?.contains(target)) return;
  openTeamId.value = null;
}

onMounted(() => {
  initClickOutsideListener(moreUserOptionsBox.value!, () => {
    isOpenUserOptionsBox.value = false;
  });
  initClickOutsideListener(searchPopoverEl.value!, () => {
    isSearchOpen.value = false;
  });
  setTimeout(() => {
    document.addEventListener('mouseup', handleTeamFlyoutOutsideClick);
    document.addEventListener('touchend', handleTeamFlyoutOutsideClick);
  }, 100);
});

onUnmounted(() => {
  if (closeTeamTimer) clearTimeout(closeTeamTimer);
  document.removeEventListener('mouseup', handleTeamFlyoutOutsideClick);
  document.removeEventListener('touchend', handleTeamFlyoutOutsideClick);
});
</script>
