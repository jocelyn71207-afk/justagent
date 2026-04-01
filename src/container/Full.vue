<template>
  <div :class="['Full']" ref="fullEl">
    <div :class="['main', { show: isShowMain }]">
      <AppMenuTree v-if="!route.meta.hideMenuTree" />

      <!-- 當前單元 -->
      <router-view />

      <!-- 通用性查詢結果介面 -->
      <AppSearchPage v-if="isEnterAppSearchPage" />

      <!-- TODO... 這邊預計要放上傳檔案的組件, 讓上傳中的檔案不會因為 router 切換而被影響 -->
      <AppBatchUpload />

      <!-- Buser Modal -->
      <AppBuserModal />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import AppMenuTree from '@/components/AppMenuTree.vue';
import AppSearchPage from '@/components/AppSearchPage.vue';
import AppBatchUpload from '@/components/AppBatchUpload.vue';
import AppBuserModal from '@/components/AppBuserModal.vue';

const route = useRoute();
const rootStore = useRootStore();
const isShowMain = ref(true);
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const fullEl = ref<HTMLElement | null>(null);
watch(() => route.path, () => {
  fullEl.value?.scrollTo({ top: 0 });
});


</script>
