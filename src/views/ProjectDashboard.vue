<template>
  <div class="ProjectDashboard views-page" v-show="!isEnterAppSearchPage">

    <!-- 專案列表組件 -->
    <ProjectListContent title="最近使用" mode="recent">
      <!-- 建立專案按鈕的插槽 -->
      <template #createBtnSlot="{ openProjectSettingModal }">
        <button class="wise-create-btn"
          @click="isOpenCreateProjectOptionBox = !isOpenCreateProjectOptionBox">
          <i class="material-symbols-outlined">add</i>
          建立新專案
        </button>

        <!-- 建立新專案選單小介面 -->
        <div class="createProjectOptionBox next-option-box" ref="createProjectOptionBox" v-show="isOpenCreateProjectOptionBox">
          <div class="fs-14 p-1 description">請選擇要在哪個團隊建立</div>
          <div class="option-item" @click="openProjectSettingModal(null, true, 'testTeam1')">Teva電子商務</div>
          <div class="option-item" @click="openProjectSettingModal(null, true, 'testTeam2')">Teva實體門市</div>
        </div>
      </template>
    </ProjectListContent>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia'
import { useRootStore } from '@/stores/rootStore';
import ProjectListContent from '@/components/ProjectListContent/ProjectListContent.vue';
import { initClickOutsideListener } from '@/utils/utils';

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const createProjectOptionBox = ref<HTMLElement | null>(null);
const isOpenCreateProjectOptionBox = ref(false);
onMounted(() => {
  initClickOutsideListener(createProjectOptionBox.value!, () => {
    isOpenCreateProjectOptionBox.value = false;
  });
});
</script>
