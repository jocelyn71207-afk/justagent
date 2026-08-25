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

        <!-- 企業／團隊入口合併成一個：點一下同時看到「有哪些企業」跟「每間企業底下
             有哪些團隊」，不用先點企業圖示切換範圍、再點另一顆團隊圖示才能跳團隊——
             那是兩個步驟做同一件事，這裡一步就能直接跳到任何企業的任何團隊 -->
        <button type="button" class="rail-btn" :class="{ active: isCompanyRailOpen }" v-tooltip.right="'企業／團隊'"
          @click="isCompanyRailOpen = true">
          <i class="material-symbols-outlined">domain</i>
        </button>

        <Transition name="rail-expand">
          <div class="rail-popover company-rail-list" v-show="isCompanyRailOpen" ref="companyRailPopoverEl">
            <div class="rail-popover-label">企業</div>
            <template v-for="item in companyList" :key="'railcompany' + item.id">
              <div class="team-switch-item team-switch-item--company"
                :class="{ active: item.id === nowMenuTreeCompanyId }"
                @click="selectCompany(item)">
                <span class="team-switch-dot team-switch-dot--company" style="background: var(--primary)">{{ item.name.charAt(0) }}</span>
                <span class="team-switch-name">{{ item.name }}</span>
                <i v-if="item.id === nowMenuTreeCompanyId" class="material-symbols-outlined team-switch-check">check</i>
              </div>
              <div class="rail-popover-sub">
                <div class="team-switch-item team-switch-item--sub" v-for="(team, i) in teamsOfCompany(item.id)" :key="'railteam' + team.id"
                  :class="{ active: team.id === selectedTeamId }"
                  @click="jumpToTeam(team.id)">
                  <span class="team-switch-dot" :style="{ background: teamColor(i) }">{{ teamInitial(team.name) }}</span>
                  <span class="team-switch-name">{{ team.name }}</span>
                  <i v-if="team.id === selectedTeamId" class="material-symbols-outlined team-switch-check">check</i>
                </div>
              </div>
            </template>
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
        <span class="side-panel-switcher-icon" :style="{ background: teamColor(selectedTeamIndex) }">{{ teamInitial(selectedTeam!.name) }}</span>
        <span class="side-panel-switcher-name">{{ selectedTeam!.name }}</span>
        <i class="material-symbols-outlined side-panel-switcher-caret">unfold_more</i>

        <Transition name="rail-expand">
          <div class="rail-popover team-switch-list" v-show="isTeamSwitcherOpen">
            <div class="team-switch-item" v-for="(item, i) in companyTeams" :key="'switch' + item.id"
              :class="{ active: item.id === selectedTeamId }"
              @click.stop="switchTeam(item.id)">
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
      <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/TeamProject' && route.query.teamId == selectedTeam!.id }">
        <i class="material-symbols-outlined">folder</i>團隊專案
      </RouterLink>

      <!-- 技能管理：第二層，展開才看到子項目 -->
      <div class="side-panel-item side-panel-group"
        role="button" tabindex="0"
        :aria-expanded="selectedTeam!.isSkillOpen"
        :class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillTest' }"
        @click="selectedTeam!.isSkillOpen = !selectedTeam!.isSkillOpen"
        @keydown.enter.prevent="selectedTeam!.isSkillOpen = !selectedTeam!.isSkillOpen"
        @keydown.space.prevent="selectedTeam!.isSkillOpen = !selectedTeam!.isSkillOpen">
        <i class="material-symbols-outlined">psychology</i>AI 技能
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam!.isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam!.isSkillOpen">
        <RouterLink to="/view/Skills"
          class="side-panel-item" :class="{ active: route.path === '/view/Skills' }">
          <i class="material-symbols-outlined">auto_awesome</i>技能管理
        </RouterLink>
        <RouterLink to="/view/SkillTest"
          class="side-panel-item" :class="{ active: route.path === '/view/SkillTest' }">
          <i class="material-symbols-outlined">science</i>技能測試沙盒
        </RouterLink>
      </div>

      <!-- 共享資源庫：第二層，展開才看到子項目 -->
      <div class="side-panel-item side-panel-group"
        role="button" tabindex="0"
        :aria-expanded="selectedTeam!.isResourceOpen"
        :class="{ active: route.path === '/view/ResourceLibrary' || route.path === '/view/KnowledgeBase' }"
        @click="selectedTeam!.isResourceOpen = !selectedTeam!.isResourceOpen"
        @keydown.enter.prevent="selectedTeam!.isResourceOpen = !selectedTeam!.isResourceOpen"
        @keydown.space.prevent="selectedTeam!.isResourceOpen = !selectedTeam!.isResourceOpen">
        <i class="material-symbols-outlined">cloud</i>共享資源庫
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam!.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam!.isResourceOpen">
        <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/ResourceLibrary' && route.query.teamId == selectedTeam!.id }">
          <i class="material-symbols-outlined">folder_open</i>共用檔案管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/KnowledgeBase' && route.query.teamId == selectedTeam!.id }">
          <i class="material-symbols-outlined">menu_book</i>知識庫管理
        </RouterLink>
      </div>

      <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/TeamAccessManagement' && route.query.teamId == selectedTeam!.id }">
        <i class="material-symbols-outlined">lock_person</i>權限管理
      </RouterLink>
      <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }"
        class="side-panel-item" :class="{ active: route.path === '/view/ProjectTrashCans' && route.query.teamId == selectedTeam!.id }">
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

    <!-- 團隊區塊：跟桌機版共用同一套「切換器＋常駐面板」模型，不再是手機獨有的
         手風琴（每個團隊各自表頭展開）。同一個 selectedTeam／isTeamSwitcherOpen
         狀態，切換團隊、展開技能管理/共享資源庫群組的行為桌機/手機完全一致。 -->
    <template v-if="showTeamPanel">
      <div class="side-panel-divider"></div>

      <div class="side-panel-switcher mobile-team-switcher"
        :class="{ 'is-open': isTeamSwitcherOpen }"
        role="button" tabindex="0" :aria-expanded="isTeamSwitcherOpen"
        @click="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.enter.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.space.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen">
        <span class="side-panel-switcher-icon" :style="{ background: teamColor(selectedTeamIndex) }">{{ teamInitial(selectedTeam!.name) }}</span>
        <span class="side-panel-switcher-name">{{ selectedTeam!.name }}</span>
        <i class="material-symbols-outlined side-panel-switcher-caret">unfold_more</i>
      </div>
      <div class="team-switch-list" v-show="isTeamSwitcherOpen">
        <div class="team-switch-item" v-for="(item, i) in companyTeams" :key="'mobileswitch' + item.id"
          :class="{ active: item.id === selectedTeamId }"
          @click="switchTeam(item.id)">
          <span class="team-switch-dot" :style="{ background: teamColor(i) }">{{ teamInitial(item.name) }}</span>
          <span class="team-switch-name">{{ item.name }}</span>
          <i v-if="item.id === selectedTeamId" class="material-symbols-outlined team-switch-check">check</i>
        </div>
      </div>

      <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
        <i class="material-symbols-outlined">folder</i>團隊專案
      </RouterLink>

      <div class="side-panel-item side-panel-group mobile-item"
        role="button" tabindex="0" :aria-expanded="selectedTeam!.isSkillOpen"
        @click="selectedTeam!.isSkillOpen = !selectedTeam!.isSkillOpen">
        <i class="material-symbols-outlined">psychology</i>AI 技能
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam!.isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam!.isSkillOpen">
        <RouterLink to="/view/Skills" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_awesome</i>技能管理
        </RouterLink>
        <RouterLink to="/view/SkillTest" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">science</i>技能測試沙盒
        </RouterLink>
      </div>

      <div class="side-panel-item side-panel-group mobile-item"
        role="button" tabindex="0" :aria-expanded="selectedTeam!.isResourceOpen"
        @click="selectedTeam!.isResourceOpen = !selectedTeam!.isResourceOpen">
        <i class="material-symbols-outlined">cloud</i>共享資源庫
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam!.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam!.isResourceOpen">
        <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">folder_open</i>共用檔案管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">menu_book</i>知識庫管理
        </RouterLink>
      </div>

      <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
        <i class="material-symbols-outlined">lock_person</i>權限管理
      </RouterLink>
      <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: selectedTeam!.id, teamName: selectedTeam!.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
        <i class="material-symbols-outlined">auto_delete</i>專案垃圾桶
      </RouterLink>
    </template>
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
const { isEnterAppSearchPage, appSearchKeyword, testGroups, companyList, nowMenuTreeCompanyId, nowMenuTreeCompanyName } = storeToRefs(rootStore);

// 團隊切換器（rail 團隊入口／常駐面板／手機版）只列出「目前選定企業」底下的
// 團隊，不是列出所有企業的團隊——企業是團隊的上層範疇，選錯範疇卻看到別間
// 企業的團隊，才是真正會讓人迷路的地方
const companyTeams = computed(() => testGroups.value.filter((g: any) => g.companyId === nowMenuTreeCompanyId.value));

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

// 常駐選單面板：顯示「目前選中團隊」的導覽項目，預設選目前企業的第一個團隊，
// 這樣面板一開始就有內容，不會是空的
const selectedTeamId = ref<string | null>(companyTeams.value[0]?.id ?? null);
const selectedTeam = computed(() => testGroups.value.find((g: any) => g.id === selectedTeamId.value) ?? null);
const selectedTeamIndex = computed(() => companyTeams.value.findIndex((g: any) => g.id === selectedTeamId.value));

// 「最近使用」「探索」是跨團隊、也跨企業的全域單元，不屬於任何特定團隊，
// 停在這兩個頁面時不顯示團隊層的常駐選單面板
const GLOBAL_ROUTES = ['/view/ProjectDashboard', '/view/Explore'];
const showTeamPanel = computed(() => !!selectedTeam.value && !GLOBAL_ROUTES.includes(route.path));
// 團隊清單有異動、或企業被切換導致目前選中的團隊不再列在 companyTeams 裡時，
// 自動改選目前企業的第一個團隊，同一個 watcher 涵蓋兩種情境
watch(companyTeams, (groups: any[]) => {
  if (!groups.some(g => g.id === selectedTeamId.value)) {
    selectedTeamId.value = groups[0]?.id ?? null;
  }
});

// 團隊切換：常駐面板上方的下拉、rail 企業／團隊合併入口、手機版切換器，全部
// 呼叫同一個 switchTeam()，同一個團隊、同一個當下頁面情境要有同一種結果，
// 不能一個會跳頁一個不會，換了團隊卻讓使用者以為自己還停在舊資料上
const isTeamSwitcherOpen = ref(false);
const teamSwitcherBtn = ref<HTMLElement | null>(null);

// 會用 URL query 的 teamId 決定內容的頁面（ARCHITECTURE.md 的既有設計決策），
// 換團隊時要跟著把 query 換成新團隊、留在同一種頁面，不然選單看起來換了、
// 頁面顯示的其實還是舊團隊的資料
const QUERY_TEAM_PATHS = ['/view/TeamProject', '/view/ResourceLibrary', '/view/KnowledgeBase', '/view/TeamAccessManagement', '/view/ProjectTrashCans'];

function switchTeam(id: string) {
  const team = testGroups.value.find((g: any) => g.id === id);
  if (!team) return;
  selectedTeamId.value = id;
  isTeamSwitcherOpen.value = false;

  if (QUERY_TEAM_PATHS.includes(route.path)) {
    router.push({ path: route.path, query: { ...route.query, teamId: team.id, teamName: team.name } });
    closeMobileMenu();
  } else if (GLOBAL_ROUTES.includes(route.path)) {
    // 目前在「最近使用」／「探索」這類全域頁面，沒有團隊頁面可以留著換資料，
    // 帶去團隊專案頁作為預設落地頁
    router.push({ path: '/view/TeamProject', query: { teamId: team.id, teamName: team.name } });
    closeMobileMenu();
  }
  // 其餘頁面（技能清單／技能測試沙盒）直接讀 store 的 selectedTeamId，不吃
  // URL query，畫面會自動反映新選的團隊，不用額外導覽
}

// Rail 上企業／團隊合併的入口：常駐圖示，不用先點頭像才找得到企業切換
const isCompanyRailOpen = ref(false);
const companyRailPopoverEl = ref<HTMLElement | null>(null);
function teamsOfCompany(companyId: string) {
  return testGroups.value.filter((g: any) => g.companyId === companyId);
}
// popover 裡直接點某間企業底下的團隊（可能不是目前使用中的企業）：先把使用中
// 企業同步成那個團隊所屬的企業，再交給 switchTeam() 處理導覽，這樣不管團隊屬於
// 哪間企業，切換的落地頁邏輯都是同一套，不用另外重複一份判斷
function jumpToTeam(id: string) {
  const team = testGroups.value.find((g: any) => g.id === id);
  if (!team) return;
  const company = companyList.value.find((c) => c.id === team.companyId);
  if (company) {
    nowMenuTreeCompanyId.value = company.id;
    nowMenuTreeCompanyName.value = company.name;
  }
  isCompanyRailOpen.value = false;
  switchTeam(id);
}
function selectCompany(item: { id: string; name: string }) {
  isCompanyRailOpen.value = false;
  if (item.id === nowMenuTreeCompanyId.value) return; // 選的還是目前這間企業，不用重新導覽

  nowMenuTreeCompanyId.value = item.id;
  nowMenuTreeCompanyName.value = item.name;

  const firstTeamOfNewCompany = testGroups.value.find((g: any) => g.companyId === item.id);
  selectedTeamId.value = firstTeamOfNewCompany?.id ?? null;

  // 「最近使用」「探索」不分企業（見上面 GLOBAL_ROUTES 的說明），留在原地就好；
  // 其餘頁面顯示的都是某個團隊的資料，而那個團隊已經不屬於新企業了，
  // 帶去新企業第一個團隊的團隊專案頁，跟切換團隊時的落地頁邏輯一致
  if (!GLOBAL_ROUTES.includes(route.path) && firstTeamOfNewCompany) {
    router.push({ path: '/view/TeamProject', query: { teamId: firstTeamOfNewCompany.id, teamName: firstTeamOfNewCompany.name } });
    closeMobileMenu();
  }
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
  initClickOutsideListener(companyRailPopoverEl.value!, () => {
    isCompanyRailOpen.value = false;
  });
});
</script>
