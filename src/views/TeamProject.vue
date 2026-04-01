<template>
  <div class="TeamProject views-page" v-show="!isEnterAppSearchPage">

    <!-- 專案列表組件 -->
    <ProjectListContent title="團隊專案" mode="team" :subtitle="teamName as string" :teamId="teamId as string">
      <!-- 建立專案按鈕的插槽 -->
      <template #createBtnSlot="{ openProjectSettingModal }">
        <button class="custom-btn custom-main-btn"
          @click="openProjectSettingModal(null, true, teamId as string)">
          <i class="material-symbols-outlined">add</i>
          建立新專案
        </button>
      </template>
    </ProjectListContent>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia'
import { useRootStore } from '@/stores/rootStore';
import ProjectListContent from '@/components/ProjectListContent/ProjectListContent.vue';

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const route = useRoute();
const teamId = ref(route.query.teamId);
const teamName = ref(route.query.teamName);

// route改變時更新teamId和teamName
watch(() => route.query, (newQuery) => {
  teamId.value = newQuery.teamId;
  teamName.value = newQuery.teamName;
});

</script>
