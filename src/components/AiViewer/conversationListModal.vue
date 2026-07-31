<template>
  <compModal class="conversationListModal"
    :modelValue="isOpenConversationListModal"
    :title="'對話列表'"
    :width="'476px'"
    @close="close"
  >
    <div class="mb-3">

      <ul class="conversation-list">
        <li :class="{ active: currentConversationId === 'conv1' }" @click="switchConversation('conv1')">
          <span>2026商品文件翻譯</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv2' }" @click="switchConversation('conv2')">
          <span>未命名對話</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv4' }" @click="switchConversation('conv4')">
          <span>產品銷售報告整理</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv5' }" @click="switchConversation('conv5')">
          <span>Teva 換季促銷方案規劃</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
      </ul>
    </div>
    <template #footer>
      <button class="custom-btn"
        @click="close()">關閉</button>
      <button class="custom-btn custom-main-btn">開啟新對話</button>
    </template>

  </compModal>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue";
import compModal from '@/components/compModal/compModal.vue';
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import popDialog from '@/services/popDialog';

const aiviewerStore = useAiviewerStore();
const { isOpenConversationListModal, currentConversationId } = storeToRefs(aiviewerStore);

function close() {
  isOpenConversationListModal.value = false;
}

function switchConversation(id: string) {
  currentConversationId.value = id;
  close();
}

function deleteFn(event: MouseEvent) {
  event.stopPropagation();
  popDialog.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定要刪除這個對話嗎?</div>
      <div class="fs-16">刪除後將無法恢復</div>
    </div>
  `, () => {
    // 確定刪除對話的邏輯
  });
}

</script>

<style lang="scss">
@import '@/scss/base/variables.scss';

.conversationListModal {
  .conversation-list {
    margin: 0;
    padding: 0;
    li {
      margin-bottom: 8px;
      padding: 9px 10px;
      list-style: none;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      &.active {
        border-color: $color_main_4;
        background-color: $color_main_4;
        color: $black;
        &:hover {
          background-color: $color_main_4;
        }
      }
      &:hover {
        background-color: var(--color-background-1);
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
