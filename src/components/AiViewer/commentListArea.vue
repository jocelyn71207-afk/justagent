<template>
  <div :class="['commentListArea rightCommonArea', { show: isShowCommentListView }]">

    <div class="list-header-box">
      所有評論
      <i class="material-symbols-outlined close-btn" @click="isShowCommentListView = false">close</i>
    </div>

    <div class="list-search-box">
      <i class="material-symbols-outlined left-icon fs-19">search</i>
      <input type="text" class="custom-input fs-14" style="flex: 1;" placeholder="搜尋評論">
      <i class="material-symbols-outlined more-btn" @click="showSortOptionsBox = true">more_horiz</i>
      <!-- 排序選項 -->
      <div :class="['sortOptions-box next-option-box', { show: showSortOptionsBox }]" ref="sortOptionsBox">
        <div class="option-item">以時間排序</div>
        <div class="option-item">以為未讀排序</div>
      </div>
    </div>

    <div class="list-scroll-box">
      <!-- 單一個 block 的 momo TODO... 先用我造假的資料結構,之後還要依照後端調整 -->
      <div v-for="item in memos" :key="item.id"
        :class="['one-comment-item', {active: showCommentByBlockId === item.blockId}]"
        @click="moveBlockToCenter(item)">
        <div class="item-header">
          <img class="userAvatar" src="https://cdn.justka.ai/sit/userAvatar/4bfa062f-36b4-470b-8064-9eacb9abe55c.png">
          <div class="userName">{{ item.list[0].userName }}</div>
          <div class="msgTime">5天前</div>
        </div>
        <template v-if="item.list.length">
          <div class="fs-12 mb-1">{{ item.list[0].text }}</div>
          <div class="fs-12 fc-main-1" v-if="item.list.length > 1">{{ item.list.length - 1 }} comment</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { storeToRefs } from 'pinia'
import { httpService } from '@/services/http';
import popDialog from '@/services/popDialog';
import {initClickOutsideListener } from "@/utils/utils";


const props = defineProps<{
  setMainStagePosition: (x: number, y: number) => void; // 設定畫布座標方法
}>();

const aiviewerStore = useAiviewerStore();
const { aiViewerBlocks, memos, isShowCommentListView, showCommentByBlockId } = storeToRefs(aiviewerStore);
const { calcNextZindex } = aiviewerStore;

const showSortOptionsBox = ref(false);
const sortOptionsBox = ref<HTMLElement | null>(null);

// konva.js 主場景物件
const { mainStage } = storeToRefs(aiviewerStore);

// 主場景移動到 block 中心的函數
function moveBlockToCenter(memo: any) {
  showCommentByBlockId.value = '';
  if (!mainStage.value) return;
  const block = aiViewerBlocks.value.find((item: any) => item.id === memo.blockId);
  if (!block) {
    popDialog.confirm(`
      <div class="d-flex flex-justify-center flex-column text-center">
        <div class="fs-22 mb-1 fw-600">查無對應的內容區塊</div>
        <div class="fs-16">是否移除該評論?</div>
      </div>
    `, () => {
      // 確定移除該 comment
      memos.value = memos.value.filter((item: any) => item.id !== memo.id);
    }, () => {
      // 取消不做任何事
    });
    return;
  }

  block.z = calcNextZindex();
  showCommentByBlockId.value = memo.blockId;

  // const mainStageScale = mainStage.value.scaleX();

  // 計算 block 中心的世界座標
  const blockCenterX = block.x + block.width / 2;
  const blockCenterY = block.y + block.height / 2;

  // 計算要讓 block 中心顯示在畫面中心,stage 需要的位置
  // 新的 stage 位置 = -(block中心座標) + (視窗中心座標)
  const newX = -blockCenterX + mainStage.value.width() / 2;
  const newY = -blockCenterY + mainStage.value.height() / 2;

  props.setMainStagePosition(newX, newY);
}

onMounted(() => {
  initClickOutsideListener(sortOptionsBox.value!, () => {
    showSortOptionsBox.value = false;
  });
});
</script>
