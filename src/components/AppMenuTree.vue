<template>
  <!-- 手機漢堡按鈕（僅手機尺寸顯示） -->
  <button class="hamburger-btn" @click="toggleMobileMenu">
    <i class="material-symbols-outlined">{{ isMobileMenuOpen ? 'close' : 'menu' }}</i>
  </button>

  <!-- 手機 overlay（選單開啟時顯示） -->
  <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="closeMobileMenu" />

  <!-- ============================================================
       桌機／平板：圖示條（rail）＋ 常駐顯示的團隊選單面板
       圖示條負責切換（通用單元／企業/團隊），右側選單面板常駐展開，
       顯示「目前選中的團隊」專屬的導覽項目，不是 hover 才彈出的浮層。
       ============================================================ -->
  <div :class="['AppMenuTree', { 'is-mobile-open': isMobileMenuOpen, 'no-team-panel': !showTeamPanel }]">

    <div class="rail">
      <div class="rail-top">
        <div :class="['rail-user-btn', { active: isOpenUserOptionsBox }]" @click="isOpenUserOptionsBox = true">
          <div class="user-avatar">L</div>

          <Transition name="rail-expand">
            <div class="rail-popover user-flyout next-option-box" ref="moreUserOptionsBox" v-show="isOpenUserOptionsBox">
              <div class="user-flyout-title">
                <p class="user-name">Lucas.chien</p>
              </div>
              <div class="option-item" @click="rootStore.isShowBuserModal = true">個人設定</div>
              <div class="option-item" @click="handleLogout">登出</div>
            </div>
          </Transition>
        </div>

        <div class="rail-divider"></div>

        <!-- 企業入口：常駐圖示，跟「團隊」入口同一種手法——不用先點頭像
             才找得到企業切換，點一下直接彈出企業清單 -->
        <button type="button" class="rail-btn" :class="{ active: isCompanyRailOpen }" v-tooltip.right="'企業'"
          @click="isCompanyRailOpen = true">
          <i class="material-symbols-outlined">domain</i>
        </button>

        <Transition name="rail-expand">
          <div class="rail-popover company-rail-list" v-show="isCompanyRailOpen" ref="companyRailPopoverEl">
            <div class="team-switch-item" v-for="item in companyList" :key="'railcompany' + item.id"
              :class="{ active: item.name === nowMenuTreeCompanyName }"
              @click="selectCompany(item)">
              <span class="team-switch-dot" style="background: var(--primary)">{{ item.name.charAt(0) }}</span>
              <span class="team-switch-name">{{ item.name }}</span>
              <i v-if="item.name === nowMenuTreeCompanyName" class="material-symbols-outlined team-switch-check">check</i>
            </div>
          </div>
        </Transition>

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

        <!-- 搜尋彈出框：點擊搜尋圖示才出現，不佔用常駐空間 -->
        <Transition name="rail-expand">
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
        </Transition>

        <!-- 團隊入口：在「最近使用」「探索」這類跨團隊頁面沒有常駐團隊面板可以點，
             用這顆圖示彈出團隊清單，選一個團隊直接進去該團隊的團隊專案頁 -->
        <button type="button" class="rail-btn" :class="{ active: isTeamRailOpen }" v-tooltip.right="'團隊'"
          @click="isTeamRailOpen = true">
          <i class="material-symbols-outlined">groups</i>
        </button>

        <Transition name="rail-expand">
          <div class="rail-popover team-rail-list" v-show="isTeamRailOpen" ref="teamRailPopoverEl">
            <div class="team-switch-item" v-for="(item, i) in testGroups" :key="'railteam' + item.id"
              :class="{ active: item.id === selectedTeamId }"
              @click="goToTeam(item.id)">
              <span class="team-switch-dot" :style="{ background: teamColor(i) }">{{ teamInitial(item.name) }}</span>
              <span class="team-switch-name">{{ item.name }}</span>
              <i v-if="item.id === selectedTeamId" class="material-symbols-outlined team-switch-check">check</i>
            </div>
          </div>
        </Transition>

        <div class="rail-divider"></div>
      </div>

      <div class="rail-spacer"></div>

      <div class="rail-bottom">
        <RouterLink to="/view/CompanyTeamSettings" class="rail-btn" :class="{ active: route.path === '/view/CompanyTeamSettings' }" v-tooltip.right="'企業/團隊設定'">
          <i class="material-symbols-outlined">settings</i>
        </RouterLink>

        <div class="rail-divider"></div>

        <img class="rail-logo" src="@/assets/logo.svg" alt="JustAgent" />
      </div>
    </div>

    <!-- 常駐選單面板：顯示「目前選中團隊」的導覽項目，不隨滑鼠移開而消失；
         切換團隊時內容淡入淡出，避免整塊文字瞬間跳掉 -->
    <div class="side-panel" v-if="showTeamPanel">
      <!-- 團隊切換：放在常駐面板最上方，點擊展開團隊清單；不再長在側邊
           圖示條上——圖示條留給真正「全域」的單元 -->
      <div class="side-panel-switcher" ref="teamSwitcherBtn"
        :class="{ 'is-open': isTeamSwitcherOpen }"
        role="button" tabindex="0" :aria-expanded="isTeamSwitcherOpen"
        @click="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.enter.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.space.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen">
        <span class="side-panel-switcher-icon" :style="{ background: teamColor(selectedTeamIndex) }">{{ teamInitial(selectedTeam.name) }}</span>
        <span class="side-panel-switcher-name">{{ selectedTeam.name }}</span>
        <i class="material-symbols-outlined side-panel-switcher-caret">unfold_more</i>

        <Transition name="rail-expand">
          <div class="rail-popover team-switch-list" v-show="isTeamSwitcherOpen">
            <div class="team-switch-item" v-for="(item, i) in testGroups" :key="'switch' + item.id"
              :class="{ active: item.id === selectedTeamId }"
              @click.stop="selectTeam(item.id)">
              <span class="team-switch-dot" :style="{ background: teamColor(i) }">{{ teamInitial(item.name) }}</span>
              <span class="team-switch-name">{{ item.name }}</span>
              <i v-if="item.id === selectedTeamId" class="material-symbols-outlined team-switch-check">check</i>
            </div>
          </div>
        </Transition>
      </div>

      <div class="side-panel-divider"></div>

    <Transition name="panel-fade" mode="out-in">
    <div :key="selectedTeamId ?? ''">
      <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/TeamProject' && route.query.teamId == selectedTeam.id }">
        <i class="material-symbols-outlined">folder</i>團隊專案
      </RouterLink>

      <!-- 技能管理：第二層，展開才看到子項目 -->
      <div class="side-panel-item side-panel-group"
        role="button" tabindex="0"
        :aria-expanded="selectedTeam.isSkillOpen"
        :class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillTest' }"
        @click="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen"
        @keydown.enter.prevent="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen"
        @keydown.space.prevent="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen">
        <i class="material-symbols-outlined">psychology</i>技能管理
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam.isSkillOpen">
        <RouterLink to="/view/Skills"
          class="side-panel-item" :class="{ active: route.path === '/view/Skills' }">
          <i class="material-symbols-outlined">auto_awesome</i>技能清單
        </RouterLink>
        <RouterLink to="/view/SkillTest"
          class="side-panel-item" :class="{ active: route.path === '/view/SkillTest' }">
          <i class="material-symbols-outlined">science</i>技能測試沙盒
        </RouterLink>
      </div>

      <!-- 共享資源庫：第二層，展開才看到子項目 -->
      <div class="side-panel-item side-panel-group"
        role="button" tabindex="0"
        :aria-expanded="selectedTeam.isResourceOpen"
        :class="{ active: route.path === '/view/ResourceLibrary' || route.path === '/view/KnowledgeBase' }"
        @click="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen"
        @keydown.enter.prevent="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen"
        @keydown.space.prevent="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen">
        <i class="material-symbols-outlined">cloud</i>共享資源庫
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam.isResourceOpen">
        <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/ResourceLibrary' && route.query.teamId == selectedTeam.id }">
          <i class="material-symbols-outlined">folder_open</i>共用檔案管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/KnowledgeBase' && route.query.teamId == selectedTeam.id }">
          <i class="material-symbols-outlined">menu_book</i>知識庫管理
        </RouterLink>
      </div>

      <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/TeamAccessManagement' && route.query.teamId == selectedTeam.id }">
        <i class="material-symbols-outlined">lock_person</i>權限管理
      </RouterLink>
      <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/ProjectTrashCans' && route.query.teamId == selectedTeam.id }">
        <i class="material-symbols-outlined">auto_delete</i>專案垃圾桶
      </RouterLink>
    </div>
    </Transition>
    </div>

  </div>

  <!-- ============================================================
       手機：漢堡選單維持清單式（常駐雙欄在小螢幕上放不下）
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
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { initClickOutsideListener } from '@/utils/utils';

const route = useRoute();
const router = useRouter();

const rootStore = useRootStore();
const { isEnterAppSearchPage, appSearchKeyword, testGroups, companyList, nowMenuTreeCompanyName } = storeToRefs(rootStore);

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

// 常駐選單面板：顯示「目前選中團隊」的導覽項目，預設選第一個團隊，
// 這樣面板一開始就有內容，不會是空的
const selectedTeamId = ref<string | null>(testGroups.value[0]?.id ?? null);
const selectedTeam = computed(() => testGroups.value.find((g: any) => g.id === selectedTeamId.value) ?? null);
const selectedTeamIndex = computed(() => testGroups.value.findIndex((g: any) => g.id === selectedTeamId.value));

// 「最近使用」「探索」是跨團隊的全域單元，不屬於任何特定團隊，
// 停在這兩個頁面時不顯示團隊層的常駐選單面板
const GLOBAL_ROUTES = ['/view/ProjectDashboard', '/view/Explore'];
const showTeamPanel = computed(() => !!selectedTeam.value && !GLOBAL_ROUTES.includes(route.path));
watch(testGroups, (groups: any[]) => {
  if (!groups.some(g => g.id === selectedTeamId.value)) {
    selectedTeamId.value = groups[0]?.id ?? null;
  }
});

// 團隊切換：放在常駐面板最上方的下拉，不是側邊圖示條
const isTeamSwitcherOpen = ref(false);
const teamSwitcherBtn = ref<HTMLElement | null>(null);
function selectTeam(id: string) {
  selectedTeamId.value = id;
  isTeamSwitcherOpen.value = false;
}

// Rail 上的團隊入口：跨團隊頁面（最近使用／探索）沒有常駐面板可以點團隊，
// 用這個彈出清單選團隊，選了直接導到該團隊的團隊專案頁
const isTeamRailOpen = ref(false);
const teamRailPopoverEl = ref<HTMLElement | null>(null);
function goToTeam(id: string) {
  const team = testGroups.value.find((g: any) => g.id === id);
  if (!team) return;
  selectedTeamId.value = id;
  isTeamRailOpen.value = false;
  router.push({ path: '/view/TeamProject', query: { teamId: team.id, teamName: team.name } });
}

// Rail 上的企業入口：常駐圖示，不用先點頭像才找得到企業切換
const isCompanyRailOpen = ref(false);
const companyRailPopoverEl = ref<HTMLElement | null>(null);
function selectCompany(item: { id: string; name: string }) {
  rootStore.nowMenuTreeCompanyId = item.id;
  nowMenuTreeCompanyName.value = item.name;
  isCompanyRailOpen.value = false;
}

// 直接用網址進入某個團隊的頁面（例如帶了 ?teamId=xxx，或重新整理停在
// /view/Skills）時，同步選中對應的團隊，並自動展開包含目前路徑的群組，
// 否則使用中的項目可能被收合藏起來，使用者會以為選單「跳走了」
const SKILL_PATHS = ['/view/Skills', '/view/SkillTest'];
const RESOURCE_PATHS = ['/view/ResourceLibrary', '/view/KnowledgeBase'];
watch(() => route.fullPath, () => {
  const queryTeamId = route.query.teamId as string | undefined;
  if (queryTeamId && testGroups.value.some((g: any) => g.id === queryTeamId)) {
    selectedTeamId.value = queryTeamId;
  }
  const team = selectedTeam.value;
  if (!team) return;
  if (SKILL_PATHS.includes(route.path)) team.isSkillOpen = true;
  if (RESOURCE_PATHS.includes(route.path)) team.isResourceOpen = true;
}, { immediate: true });

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

onMounted(() => {
  initClickOutsideListener(moreUserOptionsBox.value!, () => {
    isOpenUserOptionsBox.value = false;
  });
  initClickOutsideListener(searchPopoverEl.value!, () => {
    isSearchOpen.value = false;
  });
  initClickOutsideListener(teamSwitcherBtn.value!, () => {
    isTeamSwitcherOpen.value = false;
  });
  initClickOutsideListener(teamRailPopoverEl.value!, () => {
    isTeamRailOpen.value = false;
  });
  initClickOutsideListener(companyRailPopoverEl.value!, () => {
    isCompanyRailOpen.value = false;
  });
});
</script>
