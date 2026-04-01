<template>
  <div :class="['blockListArea rightCommonArea', { show: isShowBlockListView }]"
    @click.stop="showMoreOptionsId = null"
    ref="blockListArea">

    <div class="list-header-box">
      畫布內容
      <i class="material-symbols-outlined close-btn" @click="isShowBlockListView = false">close</i>
    </div>

    <div class="list-search-box">
      <i class="material-symbols-outlined left-icon fs-19">search</i>
      <input type="text" class="custom-input fs-14" style="flex: 1;" placeholder="搜尋Block">
      <i class="material-symbols-outlined more-btn" @click="showSortOptionsBox = true">more_horiz</i>
      <!-- 排序選項 -->
      <div :class="['sortOptions-box next-option-box', { show: showSortOptionsBox }]" ref="sortOptionsBox">
        <div class="option-item">以建立近到遠時間排序</div>
        <div class="option-item">以建立遠到近時間排序</div>
      </div>
    </div>

    <div class="list-scroll-box">

      <div class="one-block-item" v-for="(item, index) in aiViewerBlocks" :key="item.id + index"
         @click="() => {
          if (showMoreOptionsId && showMoreOptionsId === item.id) {
            showMoreOptionsId = null;
          }
          moveBlockToCenter(item);
         }">
        <div class="block-info-box">
          <div class="block-name">{{ item.blockName }}</div>
          <div class="block-size">{{ item.data.blockType }}．2026年2月23日 14:35建立</div>
        </div>
        <i :class="['material-symbols-outlined block-more-btn', { active: showMoreOptionsId === item.id }]"
          v-tooltip="'more'"
          @click.stop="showMoreOptionsId = item.id">more_horiz</i>

        <!-- 更多選項 -->
        <div :class="['more-options-box next-option-box', { show: showMoreOptionsId === item.id }]">
          <div class="option-item" @click.stop="() => {}">加到共享資源庫</div>
          <div class="option-item" @click.stop="() => {}">從畫布中移除</div>
          <div class="option-item" @click.stop="() => {}">複製檔案</div>
          <div class="option-item" @click.stop="() => {}">帶入對話</div>
        </div>

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
import { formatFileSize } from '@/utils/file';
import {initClickOutsideListener } from "@/utils/utils";

const props = defineProps<{
  setMainStagePosition: (x: number, y: number) => void; // 設定畫布座標方法
}>();

const aiviewerStore = useAiviewerStore();
const { aiViewerBlocks, isShowBlockListView } = storeToRefs(aiviewerStore);
const { calcNextZindex } = aiviewerStore;

const showSortOptionsBox = ref(false);
const sortOptionsBox = ref<HTMLElement | null>(null);

// konva.js 主場景物件
const { mainStage } = storeToRefs(aiviewerStore);

const showMoreOptionsId = ref(null) as Ref<number | null>;
const blockListArea = ref<HTMLElement | null>(null);

// 主場景移動到 block 中心的函數
function moveBlockToCenter(block: any) {
  if (!mainStage.value) return;

  block.z = calcNextZindex();

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

  initClickOutsideListener(blockListArea.value!, () => {
    showMoreOptionsId.value = null;
  });
});
</script>
