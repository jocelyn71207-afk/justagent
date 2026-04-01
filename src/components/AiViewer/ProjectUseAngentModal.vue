<template>
  <compModal class="ProjectUseAngentModal"
    v-model="isOpenModal"
    :title="'已使用Agent'"
    width="476px"
    :showClose="true"
    :closeOnMask="false"
    @close="close"
  >
    <div class="mb-3">
      <template v-if="!isLoading">
        <div class="agent-items">
          <div>業務助理</div>
          <div>數據分析</div>
          <div>產品經理</div>
          <div>市場專員</div>
          <div>用戶體驗設計師</div>
        </div>
        <div class="remark">若想購買更多Agent請聯絡客服</div>
      </template>
      <div class="p-2 text-center fc-grey-2" v-else>
        <i class="material-symbols-outlined loading-spinner fs-26">progress_activity</i>
      </div>
    </div>
    <template #footer>
      <button class="custom-btn custom-main-btn" v-if="!isLoading"
        @click="close()">關閉</button>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { httpService } from '@/services/http';
import popDialog from '@/services/popDialog';
import compModal from '@/components/compModal/compModal.vue';

const props = defineProps<{
  modelValue: boolean;
  projectId: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const isOpenModal = ref(props.modelValue);
const isLoading = ref(false);

function close() {
  emit("update:modelValue", false);
  isOpenModal.value = false;
}

// 取得專案使用的 Agent 資訊
async function getUseAngent() {
  // ajax 模擬獲取使用者代理資料
  console.log("模擬獲取使用者代理資料...", props.projectId);
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬網路延遲
  isLoading.value = false;
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      // 在這裡處理 Modal 開啟的邏輯，例如載入資料等
      getUseAngent();
      emit("update:modelValue", true);
      isOpenModal.value = true;
    } else {
      emit("update:modelValue", false);
      isOpenModal.value = false;
    }
  },
  { immediate: true }
);

</script>

<style lang="scss">
.ProjectUseAngentModal {
  .agent-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    > div {
      border-radius: 8px;
      padding: 6px 8px;
      background-color: var(--color-background-1);
    }
  }
  .remark {
    color: var(--color-text-alpha50);
    font-size: 14px;
    margin-top: 14px;
  }
}
</style>
