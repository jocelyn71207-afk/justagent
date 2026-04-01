<template>
  <!-- 手機漢堡按鈕（僅手機尺寸顯示） -->
  <button class="hamburger-btn" @click="toggleMobileMenu">
    <i class="material-symbols-outlined">{{ isMobileMenuOpen ? 'close' : 'menu' }}</i>
  </button>

  <!-- 手機 overlay（選單開啟時顯示） -->
  <div class="mobile-overlay" v-if="isMobileMenuOpen" @click="closeMobileMenu" />

  <div :class="['AppMenuTree', { 'is-mobile-open': isMobileMenuOpen }]">

    <div class="header-box">
      <div class="d-flex flex-align-center flex-justify-between">
        <div :class="['user-box', { 'active': isOpenUserOptionsBox }]">
          <div class="user-avatar">L</div>
          <div class="user-name" @click="isOpenUserOptionsBox = true">
            <p>Lucas.chien</p>
            <i class="material-symbols-outlined">keyboard_arrow_down</i>
          </div>

          <!-- 更多用戶選項選單 -->
          <div class="more-userOption-box next-option-box" ref="moreUserOptionsBox" v-show="isOpenUserOptionsBox">
            <div class="option-item" @click="rootStore.isShowBuserModal = true">個人設定</div>
            <div class="option-item">登出</div>
          </div>
        </div>
        <!-- TODO... 第一階段先沒有小鈴噹 -->
        <!-- <i class="material-symbols-outlined">notifications</i> -->
      </div>

      <!-- 通用性查詢 -->
      <div class="universal-search-box">
        <i class="material-symbols-outlined">search</i>
        <i class="material-symbols-outlined fc-grey-1 clear-btn" v-if="appSearchKeyword" @click="appSearchKeyword = ''; isEnterAppSearchPage = false;">close</i>
        <input type="text" class="custom-input w-100" placeholder="搜尋" v-model="appSearchKeyword" @keyup="() => {
          isEnterAppSearchPage = true;
          if (appSearchKeyword === '') {
            isEnterAppSearchPage = false;
          }
        }"/>
      </div>

      <div class="one-btn-item">
        <RouterLink to="/view/ProjectDashboard">
          <i class="material-symbols-outlined">schedule</i>
          最近使用
        </RouterLink>
      </div>
      <div class="one-btn-item">
        <RouterLink to="/view/Explore">
          <i class="material-symbols-outlined">lightbulb</i>
          探索
        </RouterLink>
      </div>

    </div>

    <div class="menu-list-box" @wheel.stop="handleContentWheel($event);">
      <!-- 企業 -->
      <div class="company-box">
        <select class="custom-select w-100">
          <option value="企業A">企業A</option>
          <option value="企業B">企業B</option>
        </select>
        <div class="one-btn-item">
          <RouterLink :to="`/view/CompanyTeamSettings`">
            <i class="material-symbols-outlined">settings</i>
            企業/團隊設定
          </RouterLink>
        </div>
      </div>

      <!-- 單一團隊 -->
      <div class="one-group-box" v-for="(item, i) in testGroups" :key="'testGroups' + i">
        <div class="group-name-box" @click="item.isOpen = !item.isOpen">
          <div class="group-name">{{ item.name }}</div>
          <i class="material-symbols-outlined" v-if="item.isOpen">keyboard_arrow_up</i>
          <i class="material-symbols-outlined" v-if="!item.isOpen">keyboard_arrow_down</i>
        </div>
        <div class="group-btn-box" v-if="item.isOpen">
          <div class="one-btn-item">
            <RouterLink :to="{ path: '/view/TeamProject', query: { teamId: item.id, teamName: item.name } }" custom v-slot="{ href, navigate }">
              <a :href="href" @click="navigate" :class="{ active: route.path === '/view/TeamProject' && route.query.teamId == item.id }">
                <i class="material-symbols-outlined">folder</i>
                團隊專案
              </a>
            </RouterLink>
          </div>
          <!-- 共享資源庫（可展開） -->
          <div class="one-btn-item sub-group-header" @click="item.isResourceOpen = !item.isResourceOpen"
            :class="{ active: route.path === '/view/ResourceLibrary' || route.path === '/view/KnowledgeBase' }">
            <i class="material-symbols-outlined">cloud</i>
            共享資源庫
            <i class="material-symbols-outlined sub-arrow">{{ item.isResourceOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
          </div>
          <div class="sub-menu-box" v-if="item.isResourceOpen">
            <div class="one-btn-item">
              <RouterLink :to="{ path: '/view/ResourceLibrary', query: { teamId: item.id, teamName: item.name } }" custom v-slot="{ href, navigate }">
                <a :href="href" @click="navigate" :class="{ active: route.path === '/view/ResourceLibrary' && route.query.teamId == item.id }">
                  <i class="material-symbols-outlined">folder_open</i>
                  共用檔案管理
                </a>
              </RouterLink>
            </div>
            <div class="one-btn-item">
              <RouterLink :to="{ path: '/view/KnowledgeBase', query: { teamId: item.id, teamName: item.name } }" custom v-slot="{ href, navigate }">
                <a :href="href" @click="navigate" :class="{ active: route.path === '/view/KnowledgeBase' && route.query.teamId == item.id }">
                  <i class="material-symbols-outlined">menu_book</i>
                  知識庫管理
                </a>
              </RouterLink>
            </div>
          </div>
          <div class="one-btn-item">
            <RouterLink :to="{ path: '/view/TeamAccessManagement', query: { teamId: item.id, teamName: item.name } }" custom v-slot="{ href, navigate }">
              <a :href="href" @click="navigate" :class="{ active: route.path === '/view/TeamAccessManagement' && route.query.teamId == item.id }">
                <i class="material-symbols-outlined">lock_person</i>
                權限管理
              </a>
            </RouterLink>
          </div>
          <div class="one-btn-item">
            <RouterLink :to="{ path: '/view/ProjectTrashCans', query: { teamId: item.id, teamName: item.name } }" custom v-slot="{ href, navigate }">
              <a :href="href" @click="navigate" :class="{ active: route.path === '/view/ProjectTrashCans' && route.query.teamId == item.id }">
                <i class="material-symbols-outlined">auto_delete</i>
                專案垃圾桶
              </a>
            </RouterLink>
          </div>
        </div>
      </div>

    </div>

    <div class="menu-footer">
      <img src="@/assets/full_logo.svg" alt="logo" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router';
import { useRootStore } from '@/stores/rootStore';
import { handleContentWheel, initClickOutsideListener } from '@/utils/utils';

const route = useRoute();

const rootStore = useRootStore();
const { isEnterAppSearchPage, appSearchKeyword, testGroups } = storeToRefs(rootStore);

const moreUserOptionsBox = ref<HTMLElement | null>(null);
const isOpenUserOptionsBox = ref(false);

const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const closeMobileMenu = () => { isMobileMenuOpen.value = false; };

onMounted(() => {
  initClickOutsideListener(moreUserOptionsBox.value!, () => {
    isOpenUserOptionsBox.value = false;
  });
});

</script>
