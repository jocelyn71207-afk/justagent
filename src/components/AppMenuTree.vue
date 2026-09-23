<template>
  <!-- 手機漢堡按鈕（僅手機尺寸顯示） -->
  <button class="hamburger-btn" @click="toggleMobileMenu">
    <i class="material-symbols-outlined">{{ isMobileMenuOpen ? 'close' : 'menu' }}</i>
  </button>

  <!-- 手機 overlay（選單開啟時顯示） -->
  <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="closeMobileMenu" />

  <!-- ============================================================
       桌機／平板：單一導覽欄（取代原本 rail 圖示條＋常駐 side-panel 兩欄）。
       團隊相關的導覽項目收進獨立的「團隊選單」彈出面板，只有點「團隊功能」
       才會出現，不是常駐在旁邊——導覽欄本身可以在「文字+圖示」跟「純圖示」
       之間收合，兩個收合機制彼此獨立。
       ============================================================ -->
  <div :class="['AppMenuTree', { 'is-mobile-open': isMobileMenuOpen, 'is-collapsed': isNavCollapsed }]">
    <div class="nav-top">
      <div :class="['nav-user-row', { active: isOpenUserOptionsBox }]" @click="isOpenUserOptionsBox = true">
        <div class="user-avatar">L</div>
        <span class="nav-user-name" v-if="!isNavCollapsed">Lucas.chien</span>
        <i class="material-symbols-outlined nav-bell" v-if="!isNavCollapsed">notifications</i>
        <button type="button" class="nav-collapse-toggle" v-tooltip.right="isNavCollapsed ? '展開導覽欄' : '收合導覽欄'"
          :aria-label="isNavCollapsed ? '展開導覽欄' : '收合導覽欄'"
          @click.stop="isNavCollapsed = !isNavCollapsed">
          <i class="material-symbols-outlined">{{ isNavCollapsed ? 'dock_to_right' : 'dock_to_left' }}</i>
        </button>

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

      <div class="nav-divider"></div>

      <!-- 企業選擇器：點了向下展開清單，不是彈出浮層 -->
      <button type="button" class="nav-item nav-company-selector" :class="{ active: isCompanyRailOpen }"
        v-tooltip.right="isNavCollapsed ? '企業' : null"
        @click="isCompanyRailOpen = !isCompanyRailOpen">
        <span class="team-switch-dot team-switch-dot--company" style="background: var(--primary)">{{ nowMenuTreeCompanyName.charAt(0) }}</span>
        <span class="nav-item-label" v-if="!isNavCollapsed">{{ nowMenuTreeCompanyName }}</span>
        <i class="material-symbols-outlined nav-item-caret" v-if="!isNavCollapsed">{{ isCompanyRailOpen ? 'expand_less' : 'expand_more' }}</i>
      </button>
      <div class="nav-inline-list" v-show="isCompanyRailOpen" ref="companyRailPopoverEl">
        <div class="team-switch-item team-switch-item--company" v-for="item in companyList" :key="'railcompany' + item.id"
          :class="{ active: item.id === nowMenuTreeCompanyId }"
          @click="selectCompany(item)">
          <span class="team-switch-dot team-switch-dot--company" style="background: var(--primary)">{{ item.name.charAt(0) }}</span>
          <span class="team-switch-name">{{ item.name }}</span>
          <i v-if="item.id === nowMenuTreeCompanyId" class="material-symbols-outlined team-switch-check">check</i>
        </div>
      </div>

      <RouterLink to="/view/Explore" class="nav-item" :class="{ active: route.path === '/view/Explore' }" v-tooltip.right="isNavCollapsed ? '探索' : null">
        <i class="material-symbols-outlined">lightbulb</i><span class="nav-item-label" v-if="!isNavCollapsed">探索</span>
      </RouterLink>

      <!-- 搜尋：展開時是隨時可輸入的搜尋框，收合時只剩圖示、點擊才彈出輸入框 -->
      <div class="nav-item nav-search universal-search-box" v-if="!isNavCollapsed">
        <i class="material-symbols-outlined">search</i>
        <i class="material-symbols-outlined fc-grey-1 clear-btn" v-if="appSearchKeyword" @click="appSearchKeyword = ''; isEnterAppSearchPage = false;">close</i>
        <input type="text" class="custom-input w-100" placeholder="搜尋" v-model="appSearchKeyword" @keyup="() => {
          isEnterAppSearchPage = true;
          if (appSearchKeyword === '') { isEnterAppSearchPage = false; }
        }"/>
      </div>
      <template v-else>
        <button type="button" class="nav-item nav-icon-btn" :class="{ active: isSearchOpen }" v-tooltip.right="'搜尋'"
          @click="isSearchOpen = true">
          <i class="material-symbols-outlined">search</i>
        </button>
        <Transition name="rail-expand">
          <div class="rail-popover search-popover" v-show="isSearchOpen" ref="searchPopoverEl">
            <div class="universal-search-box">
              <i class="material-symbols-outlined">search</i>
              <i class="material-symbols-outlined fc-grey-1 clear-btn" v-if="appSearchKeyword" @click="appSearchKeyword = ''; isEnterAppSearchPage = false;">close</i>
              <input type="text" class="custom-input w-100" placeholder="搜尋" v-model="appSearchKeyword" ref="searchInputEl" @keyup="() => {
                isEnterAppSearchPage = true;
                if (appSearchKeyword === '') { isEnterAppSearchPage = false; }
              }"/>
            </div>
          </div>
        </Transition>
      </template>

      <RouterLink to="/view/ProjectDashboard" class="nav-item" :class="{ active: route.path === '/view/ProjectDashboard' }" v-tooltip.right="isNavCollapsed ? '最近使用' : null">
        <i class="material-symbols-outlined">schedule</i><span class="nav-item-label" v-if="!isNavCollapsed">最近使用</span>
      </RouterLink>
      <RouterLink to="/view/CompanyTeamSettings" class="nav-item" :class="{ active: route.path === '/view/CompanyTeamSettings' }" v-tooltip.right="isNavCollapsed ? '企業設定' : null">
        <i class="material-symbols-outlined">settings</i><span class="nav-item-label" v-if="!isNavCollapsed">企業設定</span>
      </RouterLink>

      <div class="nav-divider"></div>

      <!-- 團隊功能：目前在任何團隊頁面時亮起，點擊開關「團隊選單」面板；
           不會因為網址帶 teamId 就自動彈出，只有主動點擊才會打開 -->
      <button type="button" class="nav-item nav-team-toggle" :class="{ active: isTeamPanelOpen || isOnTeamRoute }"
        v-tooltip.right="isNavCollapsed ? '團隊功能' : null"
        @click="toggleTeamPanel">
        <i class="material-symbols-outlined">groups</i><span class="nav-item-label" v-if="!isNavCollapsed">團隊功能</span>
      </button>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-bottom">
      <RouterLink to="/entrance" class="nav-item nav-entrance-link" v-if="!isNavCollapsed">
        <i class="material-symbols-outlined">home</i><span class="nav-item-label">返回入口頁</span>
      </RouterLink>
      <RouterLink to="/entrance" class="nav-item nav-icon-btn" v-tooltip.right="'返回入口頁'" v-else>
        <i class="material-symbols-outlined">home</i>
      </RouterLink>

      <div class="nav-footer">
        <img class="nav-footer-logo" src="@/assets/logo.svg" alt="JustAgent" />
        <div class="nav-footer-text" v-if="!isNavCollapsed">
          <span class="nav-footer-name">JustAgent</span>
          <span class="nav-footer-version">JustAgent-v.1.0.0</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ============================================================
       團隊選單面板：只有點「團隊功能」才會出現，點 X 或點導覽欄以外的地方
       關閉；面板是版面裡的正常一欄，出現時會把右邊的頁面內容推過去，不是
       浮在內容上面的浮層。
       ============================================================ -->
  <Transition name="team-panel-slide">
    <div class="team-panel" v-show="isTeamPanelOpen" ref="teamPanelEl">
      <template v-if="selectedTeam">
      <div class="team-panel-header">
        <span class="team-panel-title">團隊選單</span>
        <button type="button" class="team-panel-close" aria-label="關閉團隊選單" @click="closeTeamPanel">
          <i class="material-symbols-outlined">close</i>
        </button>
      </div>

      <div class="side-panel-switcher" ref="teamSwitcherBtn"
        :class="{ 'is-open': isTeamSwitcherOpen }"
        role="button" tabindex="0" :aria-expanded="isTeamSwitcherOpen"
        @click="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.enter.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.space.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen">
        <span class="side-panel-switcher-icon" :style="{ background: teamColor(selectedTeamIndex) }">{{ teamInitial(selectedTeam.name) }}</span>
        <span class="side-panel-switcher-name">{{ selectedTeam.name }}</span>
        <i class="material-symbols-outlined side-panel-switcher-caret">unfold_more</i>

        <div class="rail-popover team-switch-list" v-show="isTeamSwitcherOpen">
          <div class="team-switch-item" v-for="(item, i) in companyTeams" :key="'switch' + item.id"
            :class="{ active: item.id === selectedTeamId }"
            @click.stop="switchTeam(item.id)">
            <span class="team-switch-dot" :style="{ background: teamColor(i) }">{{ teamInitial(item.name) }}</span>
            <span class="team-switch-name">{{ item.name }}</span>
            <i v-if="item.id === selectedTeamId" class="material-symbols-outlined team-switch-check">check</i>
          </div>
        </div>
      </div>

      <div class="side-panel-divider"></div>

      <Transition name="panel-fade" mode="out-in">
      <div :key="selectedTeamId ?? ''">
        <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/TeamProject' && route.query.teamId == selectedTeam.id }">
          <i class="material-symbols-outlined">folder</i><span class="side-panel-item-label">團隊專案</span>
        </RouterLink>

        <div class="side-panel-item side-panel-group"
          role="button" tabindex="0"
          :aria-expanded="selectedTeam.isSkillOpen"
          :class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillStudio' || route.path === '/view/SkillTest' }"
          @click="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen"
          @keydown.enter.prevent="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen"
          @keydown.space.prevent="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen">
          <i class="material-symbols-outlined">psychology</i><span class="side-panel-item-label">AI 技能</span>
          <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
        </div>
        <div class="side-panel-sub" v-show="selectedTeam.isSkillOpen">
          <RouterLink to="/view/Skills" class="side-panel-item" :class="{ active: route.path === '/view/Skills' }">
            <i class="material-symbols-outlined">auto_awesome</i><span class="side-panel-item-label">技能管理</span>
          </RouterLink>
          <RouterLink to="/view/SkillStudio" class="side-panel-item" :class="{ active: route.path === '/view/SkillStudio' }">
            <i class="material-symbols-outlined">auto_fix_high</i><span class="side-panel-item-label">AI 賦能</span>
          </RouterLink>
          <RouterLink to="/view/SkillTest" class="side-panel-item" :class="{ active: route.path === '/view/SkillTest' }">
            <i class="material-symbols-outlined">science</i><span class="side-panel-item-label">技能測試沙盒</span>
          </RouterLink>
        </div>

        <div class="side-panel-item side-panel-group"
          role="button" tabindex="0"
          :aria-expanded="selectedTeam.isResourceOpen"
          :class="{ active: route.path === '/view/ResourceLibrary' || route.path === '/view/KnowledgeBase' }"
          @click="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen"
          @keydown.enter.prevent="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen"
          @keydown.space.prevent="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen">
          <i class="material-symbols-outlined">cloud</i><span class="side-panel-item-label">共享資源庫</span>
          <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
        </div>
        <div class="side-panel-sub" v-show="selectedTeam.isResourceOpen">
          <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
            class="side-panel-item" :class="{ active: route.path === '/view/ResourceLibrary' && route.query.teamId == selectedTeam.id }">
            <i class="material-symbols-outlined">folder_open</i><span class="side-panel-item-label">共用檔案管理</span>
          </RouterLink>
          <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
            class="side-panel-item" :class="{ active: route.path === '/view/KnowledgeBase' && route.query.teamId == selectedTeam.id }">
            <i class="material-symbols-outlined">menu_book</i><span class="side-panel-item-label">知識庫管理</span>
          </RouterLink>
        </div>

        <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/TeamAccessManagement' && route.query.teamId == selectedTeam.id }">
          <i class="material-symbols-outlined">lock_person</i><span class="side-panel-item-label">權限管理</span>
        </RouterLink>
        <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }"
          class="side-panel-item" :class="{ active: route.path === '/view/ProjectTrashCans' && route.query.teamId == selectedTeam.id }">
          <i class="material-symbols-outlined">auto_delete</i><span class="side-panel-item-label">專案垃圾桶</span>
        </RouterLink>
      </div>
      </Transition>
      </template>
    </div>
  </Transition>

  <!-- ============================================================
       手機：漢堡選單維持清單式（單欄+彈出面板在小螢幕上一樣放不下，
       這次重構先不動手機版，維持現有的抽屜清單）
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
      <i class="material-symbols-outlined">settings</i>企業設定
    </RouterLink>

    <template v-if="isOnTeamRoute && selectedTeam">
      <div class="side-panel-divider"></div>

      <div class="side-panel-switcher mobile-team-switcher"
        :class="{ 'is-open': isTeamSwitcherOpen }"
        role="button" tabindex="0" :aria-expanded="isTeamSwitcherOpen"
        @click="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.enter.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen"
        @keydown.space.prevent="isTeamSwitcherOpen = !isTeamSwitcherOpen">
        <span class="side-panel-switcher-icon" :style="{ background: teamColor(selectedTeamIndex) }">{{ teamInitial(selectedTeam.name) }}</span>
        <span class="side-panel-switcher-name">{{ selectedTeam.name }}</span>
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

      <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
        <i class="material-symbols-outlined">folder</i>團隊專案
      </RouterLink>

      <div class="side-panel-item side-panel-group mobile-item"
        role="button" tabindex="0" :aria-expanded="selectedTeam.isSkillOpen"
        @click="selectedTeam.isSkillOpen = !selectedTeam.isSkillOpen">
        <i class="material-symbols-outlined">psychology</i>AI 技能
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam.isSkillOpen">
        <RouterLink to="/view/Skills" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_awesome</i>技能管理
        </RouterLink>
        <RouterLink to="/view/SkillStudio" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_fix_high</i>AI 賦能
        </RouterLink>
        <RouterLink to="/view/SkillTest" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">science</i>技能測試沙盒
        </RouterLink>
      </div>

      <div class="side-panel-item side-panel-group mobile-item"
        role="button" tabindex="0" :aria-expanded="selectedTeam.isResourceOpen"
        @click="selectedTeam.isResourceOpen = !selectedTeam.isResourceOpen">
        <i class="material-symbols-outlined">cloud</i>共享資源庫
        <i class="material-symbols-outlined side-panel-caret">{{ selectedTeam.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
      </div>
      <div class="side-panel-sub" v-show="selectedTeam.isResourceOpen">
        <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">folder_open</i>共用檔案管理
        </RouterLink>
        <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">menu_book</i>知識庫管理
        </RouterLink>
      </div>

      <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
        <i class="material-symbols-outlined">lock_person</i>權限管理
      </RouterLink>
      <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: selectedTeam.id, teamName: selectedTeam.name } }" class="side-panel-item mobile-item" @click="closeMobileMenu">
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

// 團隊切換器只列出「目前選定企業」底下的團隊，不是列出所有企業的團隊——
// 企業是團隊的上層範疇，選錯範疇卻看到別間企業的團隊，才是真正會讓人迷路的地方
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

// 團隊選單面板顯示「目前選中團隊」的導覽項目，預設選目前企業的第一個團隊，
// 這樣面板一開啟就有內容，不會是空的
const selectedTeamId = ref<string | null>(companyTeams.value[0]?.id ?? null);
const selectedTeam = computed(() => testGroups.value.find((g: any) => g.id === selectedTeamId.value) ?? null);
const selectedTeamIndex = computed(() => companyTeams.value.findIndex((g: any) => g.id === selectedTeamId.value));

// 「最近使用」「探索」是跨團隊、也跨企業的全域單元，不屬於任何特定團隊；
// 這個純粹用來讓「團隊功能」項目在目前停在團隊頁面時亮起，不控制面板要不要
// 自動彈出——面板只有使用者主動點擊「團隊功能」或關閉鈕才會開關
const GLOBAL_ROUTES = ['/view/ProjectDashboard', '/view/Explore'];
const isOnTeamRoute = computed(() => !!selectedTeam.value && !GLOBAL_ROUTES.includes(route.path));

// 團隊清單有異動、或企業被切換導致目前選中的團隊不再列在 companyTeams 裡時，
// 自動改選目前企業的第一個團隊，同一個 watcher 涵蓋兩種情境
watch(companyTeams, (groups: any[]) => {
  if (!groups.some(g => g.id === selectedTeamId.value)) {
    selectedTeamId.value = groups[0]?.id ?? null;
  }
});

// 團隊選單面板：預設是展開的，點「團隊功能」或關閉鈕可以收合／再打開，
// 不會因為網址帶 teamId 而額外自動彈出或關閉（開關狀態只看使用者操作）
const isTeamPanelOpen = ref(true);
const teamPanelEl = ref<HTMLElement | null>(null);
function toggleTeamPanel() {
  isTeamPanelOpen.value = !isTeamPanelOpen.value;
}
function closeTeamPanel() {
  isTeamPanelOpen.value = false;
}

// 團隊切換：面板內的下拉、企業清單裡直接點團隊（目前簡化成只留企業清單，
// 團隊切換收在面板自己的切換器裡）都呼叫同一個 switchTeam()，同一個團隊、
// 同一個當下頁面情境要有同一種結果，不能一個會跳頁一個不會
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
  // 其餘頁面（技能管理／技能測試沙盒）直接讀 store 的 selectedTeamId，不吃
  // URL query，畫面會自動反映新選的團隊，不用額外導覽
}

// 導覽欄本身是否收合成迷你圖示條：純畫面狀態、不記憶，每次重新整理／換頁
// 都預設展開（手機版不需要，手機本來就是關閉即收起的抽屜）
const isNavCollapsed = ref(false);

// 企業選擇器：常駐圖示，不用先點頭像才找得到企業切換
const isCompanyRailOpen = ref(false);
const companyRailPopoverEl = ref<HTMLElement | null>(null);
function selectCompany(item: { id: string; name: string }) {
  isCompanyRailOpen.value = false;
  if (item.id === nowMenuTreeCompanyId.value) return; // 選的還是目前這間企業，不用重新導覽

  nowMenuTreeCompanyId.value = item.id;
  nowMenuTreeCompanyName.value = item.name;

  const firstTeamOfNewCompany = testGroups.value.find((g: any) => g.companyId === item.id);
  selectedTeamId.value = firstTeamOfNewCompany?.id ?? null;

  // 「最近使用」「探索」不分企業，留在原地就好；其餘頁面顯示的都是某個團隊
  // 的資料，而那個團隊已經不屬於新企業了，帶去新企業第一個團隊的團隊專案頁，
  // 跟切換團隊時的落地頁邏輯一致
  if (!GLOBAL_ROUTES.includes(route.path) && firstTeamOfNewCompany) {
    router.push({ path: '/view/TeamProject', query: { teamId: firstTeamOfNewCompany.id, teamName: firstTeamOfNewCompany.name } });
    closeMobileMenu();
  }
}

// 直接用網址進入某個團隊的頁面（例如帶了 ?teamId=xxx，或重新整理停在
// /view/Skills）時，同步選中對應的團隊，並自動展開包含目前路徑的群組，
// 否則使用中的項目可能被收合藏起來，使用者會以為選單「跳走了」
const SKILL_PATHS = ['/view/Skills', '/view/SkillStudio', '/view/SkillTest'];
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

// 搜尋彈出框（只有導覽欄收合時才用得到；展開時搜尋框直接顯示在導覽欄裡）
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
  initClickOutsideListener(teamPanelEl.value!, () => {
    isTeamPanelOpen.value = false;
  });
});
</script>
