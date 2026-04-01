<template>
  <div :class="['StageMap', { 'open-map': openMap }]"
    ref="StageMapRef">
    <div id="map" v-show="openMap"></div>
    <i class="material-symbols-outlined triggerMap-btn" v-tooltip="((openMap)? '關閉' : '開啟')"
      @click="openMap = !openMap; resizeMap();">map</i>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import Konva from 'konva';
import { stopWhellZoomEvent, stopTouchpadZoomEvent } from '@/utils/utils';

const props = defineProps<{
  setMainStagePosition: (x: number, y: number) => void;
}>();

const aiviewerStore = useAiviewerStore();

const StageMapRef = ref<HTMLDivElement | null>(null);
const openMap = ref(false);

// konva.js 主場景物件
const { mainStage, isTouchDevice } = storeToRefs(aiviewerStore);

// konva.js 小地圖物件
const stageMap: Ref<any> = ref(null);

// 繪製小地圖中blocks區塊
const { aiViewerBlocks } = storeToRefs(aiviewerStore);       // 使用者使用的區塊

// 初始化小地圖
function init() {
  console.log('初始化小地圖');
  stageMap.value = new Konva.Stage({
    name: 'stageMap',
    container: 'map', // id
    width: 150,
    height: 100,
  });
  const mapLayer = new Konva.Layer({
    name: 'mapLayer',
  });
  stageMap.value.add(mapLayer);
  stageMap.value.on('mouseout', () => {
    document.body.style.cursor = 'default';
  });
}
watch(() => mainStage.value, (newVal) => {
  if (newVal && !stageMap.value) {
    init()
  }
  // 改變小地圖的形狀同主場景
  if (newVal && stageMap.value) {
    resizeMap();
  }
}, { deep: true });

// 小地圖尺寸
function resizeMap() {
  const mainWidth = mainStage.value.width();
  const mainHeight = mainStage.value.height();
  const aspectRatio = mainWidth / mainHeight;

  // 固定小地圖的最大尺寸
  const maxMapWidth = 150;
  const maxMapHeight = 100;

  let mapWidth, mapHeight;

  // 根據主場景的寬高比調整小地圖尺寸
  if (aspectRatio > maxMapWidth / maxMapHeight) {
    // 主場景較寬，以寬度為基準
    mapWidth = maxMapWidth;
    mapHeight = maxMapWidth / aspectRatio;
  } else {
    // 主場景較高，以高度為基準
    mapHeight = maxMapHeight;
    mapWidth = maxMapHeight * aspectRatio;
  }

  // 讓外層的 div 也跟著改變大小
  if (StageMapRef.value) {
    if (openMap.value) {
      StageMapRef.value.style.width = mapWidth + 'px';
      StageMapRef.value.style.height = mapHeight + 'px';
    } else {
      StageMapRef.value.style.width = 'auto';
      StageMapRef.value.style.height = 'auto';
    }
  }

  stageMap.value.width(mapWidth);
  stageMap.value.height(mapHeight);

  // 更新小地圖內容
  updateMiniMap();
}

// 繪製小地圖的函數
function updateMiniMap() {
  if (!stageMap.value || !mainStage.value) return;

  const newVal = aiViewerBlocks.value;
  const mapLayer = stageMap.value.findOne('.mapLayer');

  // 清除所有舊的 blocks
  mapLayer.destroyChildren();
  mapLayer.clear();

  // 計算主場景的可視範圍
  const mainStagePos = mainStage.value.position();
  const mainStageScale = mainStage.value.scaleX(); // 假設 x 和 y 的 scale 相同
  const visibleLeft = -mainStagePos.x / mainStageScale;
  const visibleTop = -mainStagePos.y / mainStageScale;
  const visibleRight = visibleLeft + mainStage.value.width() / mainStageScale;
  const visibleBottom = visibleTop + mainStage.value.height() / mainStageScale;

  let minX, minY, maxX, maxY;

  // 如果沒有 blocks，只顯示主場景的可視範圍
  if (!newVal.length) {
    minX = visibleLeft;
    minY = visibleTop;
    maxX = visibleRight;
    maxY = visibleBottom;
  } else {
    // 先取得所有 block 的邊界位置
    let blocksMinX = Infinity;
    let blocksMinY = Infinity;
    let blocksMaxX = -Infinity;
    let blocksMaxY = -Infinity;
    newVal.forEach((block: any) => {
      if (block.x < blocksMinX) blocksMinX = block.x;
      if (block.y < blocksMinY) blocksMinY = block.y;
      if (block.x + block.width > blocksMaxX) blocksMaxX = block.x + block.width;
      if (block.y + block.height > blocksMaxY) blocksMaxY = block.y + block.height;
    });

    // 小地圖的顯示範圍應該是主場景可視範圍和 blocks 範圍的聯集
    minX = Math.min(visibleLeft, blocksMinX);
    minY = Math.min(visibleTop, blocksMinY);
    maxX = Math.max(visibleRight, blocksMaxX);
    maxY = Math.max(visibleBottom, blocksMaxY);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // 計算小地圖的縮放比例
  const scaleX = stageMap.value.width() / contentWidth;
  const scaleY = stageMap.value.height() / contentHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 留一點邊距

  // 計算偏移量，讓內容在小地圖中居中
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const offsetX = (stageMap.value.width() - scaledWidth) / 2;
  const offsetY = (stageMap.value.height() - scaledHeight) / 2;

  // 繪製所有 blocks
  newVal.forEach((block: any) => {
    // 設定最小尺寸,確保點擊區域足夠大
    const minBlockSize = (isTouchDevice.value) ? 8 : 8; // 最小像素
    const scaledWidth = Math.max(block.width * scale, minBlockSize);
    const scaledHeight = Math.max(block.height * scale, minBlockSize);

    const mapBlock = new Konva.Rect({
      // 將 block 相對於 blocks 邊界的位置映射到小地圖，加上居中偏移
      x: (block.x - minX) * scale + offsetX,
      y: (block.y - minY) * scale + offsetY,
      width: scaledWidth,
      height: scaledHeight,
      fill: 'rgba(62, 181, 204, 0.3)',
      stroke: 'rgba(62, 181, 204, 0.8)',
      strokeWidth: 1,
      strokeHitEnabled: true,
    });

    // 主場景移動到 block 中心的函數 (思考拔到 store 裡面?)
    function moveBlockToCenter () {
      if (!mainStage.value) return;

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

    // 點擊 mapBlock，主場景移動到該 block 的中心
    mapBlock.on('click', moveBlockToCenter);
    mapBlock.on('touchend', moveBlockToCenter);
    mapBlock.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    mapBlock.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });

    mapLayer.add(mapBlock);
  });

  mapLayer.draw();
}

// 監聽 blocks 變化
watch(() => aiViewerBlocks.value, () => {
  updateMiniMap();
}, { deep: true });

onMounted(() => {
  init();
});
</script>
