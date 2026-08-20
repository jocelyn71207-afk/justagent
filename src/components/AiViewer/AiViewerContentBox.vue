<template>
  <!-- VueDragResizeRotate  套件已知問題
    :disableUserSelect="true"  防止拖曳時文字被選取, 在:draggable="true"時會沒有作用

    TODO... 先用 :scaleRatio="1"
            先不用 :scaleRatio="props.parentScale",
            因為會影響父層拿到的寬高與座標值,
            前端不會有問題, 但是後端儲存後, 多人協作下, 通知別的用戶更新小區塊座標就會有問題,
            因為每一個用戶的主場景縮放比例與主場景座標都不一樣.

    // 先備份設定
    :resizable="!isConentScroll && !isStopDrag && (!isTouchDevice || (isTouchDevice && !isShowCommentView))"
  -->
  <VueDragResizeRotate v-if="init" @wheel="stopWhellZoomEvent($event)" @touchmove="stopTouchpadZoomEvent($event)"
    :class="['AiViewerContentResize', {
      'isTouch': isTouchDevice, // 是觸控裝置
      'isDragResize': nowIsDragResize, // 目前正在拖曳或改尺寸中
      'isMultiActive': nowMultiChoiceAiViewerIds.includes(props.id), // 多選模式中被選取的區塊
      'isActive': nowChoiceAiViewerId === props.id, // 單一選取的區塊
    }]"
    :id="props.id"
    :ref="'AiViewer' + props.id"
    :active="nowChoiceAiViewerId === props.id && !isConentScroll"
    :enable-native-drag="false"
    :z="props.z"
    :x="boxX"
    :y="boxY"
    :w="boxWidth"
    :h="boxHeight"
    :minWidth="props.minWidth"
    :minHeight="props.minHeight"
    :maxWidth="props.maxWidth"
    :maxHeight="props.maxHeight"
    :parent="false"
    :scaleRatio="1"
    :snap="true"
    :snapToGrid="false"
    :grid="[2, 2]"
    :aspectRatio="props.aspectRatio"
    axis="both"
    :rotatable="false"
    :draggable="!isConentScroll && !isStopDrag && !catchBlockName"
    :resizable="(
      !isShowCommentView &&
      !nowMultiChoiceAiViewerIds.includes(props.id) &&
      !catchBlockName &&
      (
        props.source.blockType === 'IMAGE' ||
        props.source.blockType === 'HTML' ||
        props.source.blockType === 'PDF' ||
        props.source.blockType === 'EXCEL' ||
        props.source.blockType === 'TXT' ||
        props.source.blockType === 'MD' ||
        props.source.blockType === 'CHART' ||
        props.source.blockType === 'REPORT'
      )
    )"
    :lock-aspect-ratio="isAspectRatioMode"
    @activated="activated"
    @resizing="handleResizeDrag"
    @dragging="handleResizeDrag"
    @resizestop="checXY"
    @dragstop="checXY">

    <!-- 可制化方向的控制點 -->
    <template v-slot:tl><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:tm><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:tr><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:mr><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:br><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:bm><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:bl><div class="handle-icon" :style="keepSize"></div></template>
    <template v-slot:ml><div class="handle-icon" :style="keepSize"></div></template>

    <!-- 內容區塊 -->
    <div :class="['AiViewerContentBox']" @wheel="stopWhellZoomEvent($event)">
      <!-- 小區塊控制介面 -->
      <div :class="['ctrl-box']" :style="keepSize" v-if="nowChoiceAiViewerId === props.id && !nowMultiChoiceAiViewerIds.includes(props.id) && !catchBlockName && !isShowCommentView"
        @mousedown.stop.prevent>
        <!-- 刪除按鈕 -->
        <i class="material-symbols-outlined ctrl-btn remove-btn" v-tooltip.right="'刪除'"
          @click.stop.prevent="handleDelete()">close</i>

        <hr v-if="!blockIsFailure">

        <!-- 複製按鈕 -->
        <i class="material-symbols-outlined ctrl-btn" v-tooltip.right="'複製'" v-if="!blockIsFailure"
          @click="copyBlock()">content_copy</i>

        <!-- 下載資料按鈕 -->
        <i class="material-symbols-outlined ctrl-btn" v-tooltip.right="'下載'"
          v-if=" !blockIsFailure &&
            (
              props.source.blockType === 'EXCEL' ||
              props.source.blockType === 'HTML' ||
              props.source.blockType === 'IMAGE' ||
              props.source.blockType === 'PDF' ||
              props.source.blockType === 'TXT' ||
              props.source.blockType === 'MD' ||
              props.source.blockType === 'PPT' ||
              props.source.blockType === 'WORD'
            )
          "
          @click="downloadBlockData()">download</i>

        <!-- 魔術棒按鈕 -->
        <i class="material-symbols-outlined ctrl-btn" v-if="props.source.blockType === 'IMAGE'"
          v-tooltip.right="'局部圈選'">ink_marker</i>

        <!-- 放大按鈕 -->
        <i class="material-symbols-outlined ctrl-btn" v-tooltip.right="'放大瀏覽'"
          v-if=" !blockIsFailure &&
            (
              props.source.blockType === 'IMAGE' ||
              props.source.blockType === 'HTML' ||
              props.source.blockType === 'PDF' ||
              props.source.blockType === 'EXCEL' ||
              props.source.blockType === 'TXT' ||
              props.source.blockType === 'MD'
            ) &&
            fullAiViewerBlockId !== props.id
          "
          @click="() => { fullAiViewerBlockId = props.id; }">fullscreen</i>

        <!-- 帶入對話按鈕 -->
        <i class="material-symbols-outlined ctrl-btn" v-tooltip.right="'帶入對話'"
          v-if="!blockIsFailure &&
            (
              props.source.blockType === 'IMAGE' ||
              props.source.blockType === 'HTML' ||
              props.source.blockType === 'PDF' ||
              props.source.blockType === 'EXCEL' ||
              props.source.blockType === 'TXT' ||
              props.source.blockType === 'MD'
            )
          "
          @click="() => {
            userInputModal.aiFiles.push(JSON.parse(JSON.stringify(props.source)));
          }">share_windows</i>
      </div>

      <!-- // 便條紙提示 icon -->
      <div :class="['comment-btn', {
          'isMobile': isTouchDevice,
          'has-comment': memoData.length && memoData[0].list.length > 0
        }]"
        :style="{
          transform: 'rotate(45deg)'
        }"
        @click="isShowCommentView = true; showCommentByBlockId = '';">
        <span v-if="memoData.length">{{ memoData[0].list.length }}</span>
        <span v-else>0</span>
      </div>

      <!-- 區塊 header -->
      <div class="content-header-box"
        @wheel.stop.prevent="() => {}"
        @touchstart="handleContentMouseenter(false)"
        @mouseenter="handleContentMouseenter(false)"
        @mouseleave="handleContentMouseleave(true)">
        <div>
          <i class="material-symbols-outlined fs-19" v-tooltip="'點擊編輯區塊名稱'"
            @click="() => {
              catchBlockName = blockName;
              nextTick(() => {
                modifyBlockNameInput?.focus();
              });
            }">stylus_note</i>
          <input :disabled="!catchBlockName"
            ref="modifyBlockNameInput"
            class="custom-input"
            type="text"
            v-model="blockName"
            @blur="() => {
              if (blockName === '') {
                blockName = catchBlockName;
              }
              catchBlockName = '';
              // 送出修改區塊名稱的請求
              renameBlock(props.id, blockName);
            }">
        </div>
      </div>

      <!-- 內容區塊 -->
      <div :ref="'contentBoxDOM'"
        :class="['content-box', {
          'for-OTHER': props.source.blockType === 'OTHER',
          'for-TXT': props.source.blockType === 'TXT',
          'for-IMAGE': props.source.blockType === 'IMAGE',
          'for-EXCEL': props.source.blockType === 'EXCEL',
          'for-HTML': props.source.blockType === 'HTML',
          'for-PDF': props.source.blockType === 'PDF',
          'for-PPT': props.source.blockType === 'PPT',
          'for-CHART': props.source.blockType === 'CHART',
          'for-MD': props.source.blockType === 'MD',
          'for-WORD': props.source.blockType === 'WORD',
          'for-REPORT': props.source.blockType === 'REPORT',
        }]"
        @wheel.stop="handleContentWheel($event); stopWhellZoomEvent($event);"
        @mouseenter="handleContentMouseenter(true)"
        @mouseleave="handleContentMouseleave(false)"
        @touchstart.stop="handleContentScroll($event); handleContentMouseenter(true)"
        @touchend.stop="handleContentScrollEnd($event); handleContentMouseenter(false)">

        <!-- 各種 view-block -->
        <!-- MD -->
        <markdownViewBox v-if="props.source.blockType === 'MD'"
          :id="props.id" :source="props.source"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- IMAGE -->
        <imageViewBox v-if="props.source.blockType === 'IMAGE'"
          :id="props.id" :source="props.source"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- HTML -->
        <htmlFileViewBox v-if="props.source.blockType === 'HTML'"
          :id="props.id" :source="props.source"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- EXCEL -->
        <excelViewBox v-if="props.source.blockType === 'EXCEL' && props.id !== 'excelA' && props.id !== 'excelB'"
          ref="excelRef"
          :id="props.id" :source="props.source" :contentBoxDOM="contentBoxDOM || null"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- PDF -->
        <pdfViewBox v-if="props.source.blockType === 'PDF'"
          :id="props.id" :source="props.source"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- PPT -->
        <pptViewBox v-if="props.source.blockType === 'PPT'"
          :id="props.id" :source="props.source"/>

        <!-- TXT -->
        <txtViewBox v-if="props.source.blockType === 'TXT'"
          :id="props.id" :source="props.source"
          @failure="(result: boolean) => blockIsFailure = result"/>

        <!-- CHART  TODO... 還要改成不用判斷 id -->
        <chartViewBox v-if="props.source.blockType === 'CHART' && (
          props.id !== 'chartA' &&
          props.id !== 'chartB' &&
          props.id !== 'chartC'
        )"
          ref="chartViewBoxRef"
          :id="props.id" :source="props.source"/>

        <!-- WORD -->
        <wordViewBox v-if="props.source.blockType === 'WORD'"
          :id="props.id" :source="props.source"/>

        <!-- REPORT -->
        <reportAssemblyViewBox v-if="props.source.blockType === 'REPORT'"
          :id="props.id"
          :source="(props.source as { blockType: 'REPORT'; data: ReportAssemblyBlockData })"/>

        <!-- TODO... 測試用 發話文字 -->
        <div class="textViewBox" v-if="props.source.blockType === 'OTHER'">
          {{ props.source.data.msg }}
          <hr>
          x: {{ props.x }}
          y: {{ props.y }}
          W: {{ props.width }}
          H: {{ props.height }}
        </div>

        <!-- TODO... 測試用 chart 套件 -->
        <canvas :id="'chartView' + props.id" v-if="props.id === 'chartA'"></canvas>
        <canvas :id="'chartView' + props.id" v-if="props.id === 'chartB'"></canvas>
        <div :id="'chartView' + props.id" v-if="props.id === 'chartC'" style="width: 100%; height: 100%;"></div>

        <!-- TODO... 測試用 excel 套件 之後刪除  -->
        <div class="excelViewBox" v-if="props.source.blockType === 'EXCEL' && props.id === 'excelA'">
          <div :id="'excelView' + props.id"></div>
        </div>
        <div class="excelViewBox" v-if="props.source.blockType === 'EXCEL' && props.id === 'excelB'">
          <div :id="'excelView' + props.id"></div>
        </div>

        <!-- TODO... 測試用 form 表單 ODM 之後刪除  -->
        <div style="background-color: var(--color-background-2);" v-if="props.id === 'testForm'">
          測試 form 表單是否會被套件影響<br>
          <input class="mr-1" type="text" /><br>
          <label class="mr-1"><input type="checkbox" /> checkbox</label><br>
          <label class="mr-1"><input type="radio" name="testRadio" /> radioA</label>
          <label class="mr-1"><input type="radio" name="testRadio" /> radioB</label>
          <select>
            <option value="">請選擇</option>
            <option value="1">選項1</option>
            <option value="2">選項2</option>
          </select>
          <br>
          <textarea>這是 textarea...</textarea>
          <br><br><br><br><br><br><br><br><br>
          test end
        </div>

      </div>

      <!-- 魔術棒功能小介面  TODO... 之後拔出去成為一個組件 -->
      <div class="magic-wand-view">
        魔術棒功能小介面
      </div>

      <!-- 便條紙小介面 -->
      <MemoPaperView v-if="isShowCommentView"
        :source="props.source"
        :id="props.id"
        :memoData="memoData"
        @closrShowCommentView="() => {
          isShowCommentView = false;
          showCommentByBlockId = '';
        }"
        @mouseenter="handleContentMouseenter(true); isStopCopyPasteAiViewerBlock = true;"
        @mouseleave="handleContentMouseleave(false); isStopCopyPasteAiViewerBlock = false;"
        @touchstart.stop="handleContentScroll($event); handleContentMouseenter(true); isStopCopyPasteAiViewerBlock = true;"
        @touchend.stop="handleContentScrollEnd($event); handleContentMouseenter(false); isStopCopyPasteAiViewerBlock = false;"
      />

    </div>
  </VueDragResizeRotate>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { handleContentWheel, stopWhellZoomEvent, stopTouchpadZoomEvent } from '@/utils/utils';
import VueDragResizeRotate from "@gausszhou/vue3-drag-resize-rotate";
import MemoPaperView from '@/components/AiViewer/MemoPaperView.vue';
import pdfViewBox from '@/components/AiViewer/viewBlock/pdfViewBox.vue';
import excelViewBox from '@/components/AiViewer/viewBlock/excelViewBox.vue';
import pptViewBox from '@/components/AiViewer/viewBlock/pptViewBox.vue';
import txtViewBox from '@/components/AiViewer/viewBlock/txtViewBox.vue';
import htmlFileViewBox from '@/components/AiViewer/viewBlock/htmlFileViewBox.vue';
import imageViewBox from '@/components/AiViewer/viewBlock/imageViewBox.vue';
import markdownViewBox from '@/components/AiViewer/viewBlock/markdownViewBox.vue';
import chartViewBox from '@/components/AiViewer/viewBlock/chartViewBox.vue';
import wordViewBox from '@/components/AiViewer/viewBlock/wordViewBox.vue';
import reportAssemblyViewBox from '@/components/AiViewer/viewBlock/reportAssemblyViewBox.vue';
import type { ReportAssemblyBlockData } from '@/types/AiViewer';

const props = defineProps({
  source: {
    type: Object,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  blockName: {
    type: String,
    required: true
  },
  z: {
    type: Number,
    default: 1
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  minX: {
    type: [Number, null],
    default: 0
  },
  minY: {
    type: [Number, null],
    default: 0
  },
  width: {
    type: Number,
    default: 100
  },
  height: {
    type: Number,
    default: 100
  },
  minWidth: {
    type: Number,
    default: 150
  },
  minHeight: {
    type: Number,
    default: 150
  },
  maxWidth: {
    type: [Number, null],
    default: null
  },
  maxHeight: {
    type: [Number, null],
    default: null
  },
  // 是否等比例縮放
  aspectRatio: {
    type: Boolean,
    default: false
  },
  resizeCallback: {
    type: Function,
    default: () => {}
  },
  deleteCallback: {
    type: Function,
    default: () => {}
  },
})

const emit = defineEmits<{ (e: 'choice', id: string): void }>();

const aiviewerStore = useAiviewerStore();
const { nowChoiceAiViewerId, mainStage } = storeToRefs(aiviewerStore);  // 目前選中的內容區塊ID
const { aiViewerBlocks, isStopCopyPasteAiViewerBlock, isTouchDevice, nowMultiChoiceAiViewerIds, memos, showCommentByBlockId } = storeToRefs(aiviewerStore);
const { fullAiViewerBlockId, isAspectRatioMode, userInputModal } = storeToRefs(aiviewerStore);
const { pasteBlock, renameBlock } = aiviewerStore;

const init = ref<boolean>(false)
const nowIsDragResize = ref<boolean>(false); // 目前是否在拖曳中
const boxX = ref<number>(0)
const boxY = ref<number>(0)
const boxWidth = ref<number>(200)
const boxHeight = ref<number>(200)
const isConentScroll = ref<boolean>(false); // 內容區塊是否在滾動中 (為了在手機上滾動內容區塊時,避免拖曳事件被觸發)
const isStopDrag = ref<boolean>(true); // 停止拖曳事件
const contentBoxDOM = ref<HTMLElement | null>(null);
const isShowCommentView = ref<boolean>(false); // 是否顯示便條紙小介面
const isChange = ref<boolean>(false); // 紀錄是否有改變座標與尺寸 (作為後端同步更新的依據)
const blockIsFailure = ref<boolean>(false); // 區塊是否載入失敗 (各個 viewBox 組件回傳值)
const blockName = ref<string>(props.blockName);
const catchBlockName = ref<string>(''); // 是否修改區塊名稱
const modifyBlockNameInput = ref<HTMLInputElement | null>(null);

const excelRef = ref(null) as any;
// 儲存 excel 物件 (注意不能用 ref 用了套件切換 sheet 會報錯)  TODO... 之後應該要刪除
let excelObj: any = null;

// 屬於這block的便條紙資料
const memoData = computed(() => {
  return memos.value.filter(memo => memo.blockId === props.id);
});

// 比例縮放隨著主場景縮放調整
const keepSize = computed(() => {
  // 控制點要隨者主場景縮放比例做調整, 例如主場景放大 2 倍, 控制點就要縮小 0.5 倍
  const scale = mainStage.value.scale().x;
  return {
    transform: `scale(${1 / scale})`
  };

});

// 刪除區塊
function handleDelete() {
  props.deleteCallback(props.id);
  // 是否在多選模式中, 如果有的話要清除選取
  const multiIndex = nowMultiChoiceAiViewerIds.value.indexOf(props.id);
  if (multiIndex !== -1) {
    nowMultiChoiceAiViewerIds.value.splice(multiIndex, 1);
  }
}

// 拷貝貼上 block
function copyBlock() {
  if (!isStopCopyPasteAiViewerBlock.value) {
    let findBlock = aiViewerBlocks.value.find((item: any) => item.id === props.id);
    findBlock = JSON.parse(JSON.stringify(findBlock));
    findBlock.x += 20;
    findBlock.y += 20;
    pasteBlock(findBlock, true);
    nowChoiceAiViewerId.value = '';
  }
}

// 處理調整大小與拖曳
function handleResizeDrag(x: number, y: number, width: number, height: number): void {
  nowIsDragResize.value = true;
  isShowCommentView.value = false;

  // 紀錄是否有改變座標與尺寸, 讓 checXY() 可以回傳給父層組件用
  if (!isChange.value) {
    isChange.value = (
      boxX.value !== x ||
      boxY.value !== y ||
      boxWidth.value !== width ||
      boxHeight.value !== height
    );
  }

  boxWidth.value = (width !== null && width !== undefined) ? width : boxWidth.value
  boxHeight.value = (height !== null && height !== undefined) ? height : boxHeight.value
  boxX.value = (x !== null && x !== undefined) ? x : boxX.value
  boxY.value = (y !== null && y !== undefined) ? y : boxY.value

  // 如果為 excel 套件, 要讓套件重整
  if (excelRef.value) {
    // console.log('excelRef.value.getExcelObj() >>> ', excelRef.value.getExcelObj());
    excelRef.value.getExcelObj().sheet.reload();
  }

  // 更新 toolbar 的寬度   TODO.. excelObj 之後要刪除
  // if (excelObj!) {
  //   excelObj.sheet.reload();
  // }
}
// 停止大小與拖曳後檢查
function checXY(x: number, y: number): void {
  nowIsDragResize.value = false;
  nextTick(() => {
    // 座標不能小於 minX, minX
    if (props.minX !== null) {
      boxX.value = (x < props.minX) ? props.minX : x;
    }
    if (props.minY !== null) {
      boxY.value = (y < props.minY) ? props.minY : y;
    }

    checkPlotlyResize();

    const re = {
      id: props.id,
      x: boxX.value,
      y: boxY.value,
      width: boxWidth.value,
      height: boxHeight.value,
      syncBackend: isChange.value, // 套件已經透過 handleResizeDrag 改變了值
    };

    props.resizeCallback(re);
    isChange.value = false; // 回傳之後重置為沒有異動的概念

    // 如果是在多選模式中, 要同步更新其他被選取的區塊的座標,但是不更新寬高
    if (nowMultiChoiceAiViewerIds.value.includes(props.id)) {
      nowMultiChoiceAiViewerIds.value.forEach((blockId: string) => {
        if (blockId !== props.id) {
          const block = aiViewerBlocks.value.find((item: any) => item.id === blockId);
          if (block) {
            block.x += (boxX.value - props.x);
            block.y += (boxY.value - props.y);
            const reBblock = {
              id: block.id,
              x: block.x,
              y: block.y,
              width: block.width,
              height: block.height,
              syncBackend: true, // 套件已經透過 handleResizeDrag 改變了值
            };
            props.resizeCallback(reBblock);
          }
        }
      });
    }

    // 如果為 excel 表格, 則更新 toolbar 的寬度 TODO... 這段有問題先註解掉,另外之後也不提供 toolbar
    // if (excelObj!) {
    //   excelObj.reRender();
    // }
    // if (excelObj!) {
    //   const container = document.getElementById(props.id);
    //   // 在找css name : x-spreadsheet-toolbar
    //   const toolbar = container?.getElementsByClassName('x-spreadsheet-toolbar')[0] as HTMLElement;
    //   if (toolbar) {
    //     // 不可小於 700px
    //     if (boxWidth.value < 700) {
    //       toolbar.style.width = '700px';
    //       return;
    //     }
    //     toolbar.style.width = boxWidth.value + 'px';
    //   }
    // }
  })
}

// 處理內容區塊滾動事件
function handleContentScroll(event: Event) {
  event.stopPropagation();
  isConentScroll.value = true;
}
function handleContentScrollEnd(event: Event) {
  event.stopPropagation();
  isConentScroll.value = false
}
function handleContentMouseenter(stopDrag: boolean) {
  isStopDrag.value = stopDrag;
}
function handleContentMouseleave(stopDrag: boolean) {
  isStopDrag.value = stopDrag;
}

// VueDragResizeRotate 套件 activated 事件
function activated() {
  console.log('activated >>> ', props.id);
  emit('choice', props.id);
}

// 處理 Plotly.js 重新調整大小
function checkPlotlyResize() {
  // TODO... 針對 Plotly.js 這套件的 bug 做修正... 之後應該拔出去
  if (props.id === 'chartC') {
    const plotlyDom = document.getElementById('chartView' + props.id)
    if (plotlyDom) {
      nextTick(() => {
        const Plotly = (window as any).Plotly as any;
        Plotly.relayout(plotlyDom, {
          width: boxWidth.value - 30,  // 扣除一些邊距?
          height: boxHeight.value - 100, // 扣除一些邊距?
        });
      });
    }
  }
}

// 外部更新屬性 (先不提供會有 watch 過多的效能問題)
watch(() => [props.x, props.y], ([newX, newY]) => {
  if (boxX.value !== newX) boxX.value = newX;
  if (boxY.value !== newY) boxY.value = newY;
  // console.log('外部更新座標 >>> ', newX, newY);
});
// watch(() => props.x, (newX) => {
//   boxX.value = newX;
// });
// watch(() => props.y, (newY) => {
//   boxY.value = newY;
// });
// watch(() => props.width, (newWidth) => {
//   boxWidth.value = newWidth;
// });
// watch(() => props.height, (newHeight) => {
//   boxHeight.value = newHeight;
// });

// 主場景更新 X座標 / Y座標 / 縮放比例
// watch(
//   [() => props.parentX, () => props.parentY, () => props.parentScale],
//   ([newX, newY, newScale], [oldX, oldY, oldScale]) => {
//     // 處理 X 座標變化
//     if (oldX !== newX) {
//       if (oldX > newX) {
//         boxX.value = boxX.value - (oldX - newX);
//       } else {
//         boxX.value = boxX.value + (newX - oldX);
//       }
//     }

//     // 處理 Y 座標變化
//     if (oldY !== newY) {
//       if (oldY > newY) {
//         boxY.value = boxY.value - (oldY - newY);
//       } else {
//         boxY.value = boxY.value + (newY - oldY);
//       }
//     }

//     // Scale 變化時也需要檢查
//     if (oldScale !== newScale || oldX !== newX || oldY !== newY) {
//       checXY(boxX.value, boxY.value);
//     }
//   }
// );

onMounted(() => {
  boxX.value = props.x
  boxY.value = props.y
  boxWidth.value = props.width
  boxHeight.value = props.height

  init.value = true
})

// 是否有外部要打開便條紙小介面
watch(() => showCommentByBlockId.value, (newVal) => {
  if (newVal === props.id) {
    isShowCommentView.value = true;
  } else {
    isShowCommentView.value = false;
  }
});


watch(nowChoiceAiViewerId, (newVal) => {
  // 被選取
  if (newVal === props.id && props.source.blockType === 'HTML') {
  // 要自動 focus 到 iframe 裡面
    nextTick(() => {
      const viewBox = document.getElementById('viewBox' + props.id) as HTMLElement;
      viewBox?.classList.add('mustFocus');

    });
  } else {
    if (props.source.blockType === 'HTML') {
      const viewBox = document.getElementById('viewBox' + props.id) as HTMLElement;
      viewBox?.classList.remove('mustFocus');
    }
  }
});



// 下載區塊資料
async function downloadBlockData() {
  // TODO... 之後應該要改成只要有 s3 的路徑就可以下載, 不要再判斷 blockType, 也不用在透過 downloadFile()

  // 圖片類的直接下載檔案連結就好
  if (props.source.blockType === 'IMAGE') {
    const link = document.createElement('a');
    link.href = props.source.data.fileUrl;
    link.download = 'fileIMAGE';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  // 非圖片類的統一用此方法
  downloadFile(props.source.blockType);
}

async function downloadFile(fileType: string) {
  if (!fileType) return;

  // 根據檔案類型設定檔名和副檔名
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  let fileName = '';
  let fileBlobType: any = {};
  switch (fileType) {
    case 'PDF':
      fileName = `file_${dateStr}.pdf`;
      break;
    case 'EXCEL':
      fileName = `file_${dateStr}.xlsx`;
      break;
    case 'HTML':
      fileName = `file_${dateStr}.html`;
      fileBlobType = { type: 'text/html;charset=utf-8' };
      break;
    case 'TXT':
      fileName = `file_${dateStr}.txt`;
      fileBlobType = { type: 'text/plain;charset=utf-8' };
      break;
    case 'MD':
      fileName = `file_${dateStr}.md`;
      fileBlobType = { type: 'text/x-markdown' };
      break;
    default:
      fileName = `file_${dateStr}${fileType}`;
  }

  try {
    // 使用 fetch 取得 PDF 檔案
    const response = await fetch(props.source.data.fileUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 根據檔案類型建立 Blob
    let blob = null;
    if (fileType === 'PDF' || fileType === 'EXCEL') {
      blob = await response.blob();
    } else {
      const temp = await response.text();
      blob = new Blob([temp], fileBlobType);
    }

    // 建立下載 URL
    const url = URL.createObjectURL(blob);

    // 建立下載連結
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // 設定下載檔名

    // 觸發下載
    document.body.appendChild(link);
    link.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error(`${fileType} 下載失敗: `, error);
    alert(`${fileType} 下載失敗,請稍後再試`);
  }
}

// downloadExcel  下載 excel 檔案   TODO... 這是透過套件的方式下載,但是實際上應該只要用file的url去下載就好....之後刪除
// 測試 x-data-spreadsheet.js 的資料轉 excel 檔案後下載 (提醒： SheetJS 免費版不支援樣式, 只有付費 Pro 版才有樣式支援)
function downloadExcel() {
  // TODO... 之後應該只要判斷 props.source.blockType === 'EXCEL' 就好
  if (!(props.id === 'excelA' || props.id === 'excelB')) return;
  // 只針對 excelA/excelB 這兩個 id
  if (props.id === 'excelA' || props.id === 'excelB') {
    if (!excelObj) {
      alert('Excel 物件尚未初始化');
      return;
    }
  }

  // 取得 x_spreadsheet 的資料
  const data = excelObj.getData();
  console.log('取得 x_spreadsheet 的資料 data >>> ', data);
  // 支援 array 格式（如 [{name:...}]）
  let sheetsArr = [];
  if (Array.isArray(data)) {
    sheetsArr = data;
  } else if (data && typeof data === 'object' && data.sheets) {
    // 舊格式 { sheets: { key: sheetObj } }
    sheetsArr = Object.values(data.sheets);
  }
  if (!sheetsArr.length) {
    alert('目前沒有任何 sheet');
    return;
  }
  const wb = window.XLSX.utils.book_new();
  for (const sheet of sheetsArr) {
    if (!sheet || !sheet.rows || !sheet.cols) continue;
    const aoa = [];
    // 處理每一列
    for (let r = 0; r < sheet.rows.len; r++) {
      const row = [];
      const rowData = sheet.rows[r] && sheet.rows[r].cells ? sheet.rows[r].cells : {};
      // 處理每一欄
      for (let c = 0; c < sheet.cols.len; c++) {
        const cellValue = rowData[c]?.text;
        if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
          // 除錯 log
          // console.log('typeof:', typeof cellValue, 'cellValue:', cellValue);
          // 以 = 開頭且第二字為英數或 ( 才視為公式 )
          if (
            typeof cellValue === 'string' &&
            cellValue.startsWith('=') &&
            /^=[A-Za-z0-9(]/.test(cellValue)
          ) {
            // 公式
            row.push({ f: cellValue.slice(1) });
          } else if (
            typeof cellValue === 'number' ||
            (
              typeof cellValue === 'string' &&
              /^-?\d+(\.\d+)?$/.test(cellValue) && // 純數字
              !/^0\d+/.test(cellValue) // 非前導零
            )
          ) {
            // 純數字（字串或數字型態），且無前導零
            row.push(Number(cellValue));
          } else {
            // 其他皆視為文字
            row.push(cellValue);
          }
        } else {
          row.push("");
        }
      }
      aoa.push(row);
    }
    const ws = window.XLSX.utils.aoa_to_sheet(aoa);

    window.XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet');
  }
  // 下載 excel
  window.XLSX.writeFile(wb, props.id+'.xlsx');
}


const alert = window.alert; // 方便在 template 使用 alert
onMounted(() => {
  nextTick(() => {
    // TODO... 測試 Chart.js 圖表渲染
    if (props.source && (props.id === 'chartA' || props.id === 'chartB')) {
      const chartDom = document.getElementById('chartView'+props.id) as HTMLElement
      const Chart = (window as any).Chart as any;
      new Chart(chartDom, {
        type: props.source.type,
        data: props.source.data,
        options: props.source.options
      });
    }
    // TODO... 測試 Plotly.js 圖表渲染
    if (props.source && props.id === 'chartC') {
      const plotlyDom = document.getElementById('chartView'+props.id) as HTMLElement
      const Plotly = (window as any).Plotly as any;
      const data = props.source.data;
      const layout = {
        ...props.source.layout,
        autosize: false
      };
       Plotly.newPlot(plotlyDom, data, layout, {
        responsive: true,
        displayModeBar: false,
      }).then(() => {
        // 初始完成後再調整大小
        checkPlotlyResize();
      });
    }
    // TODO... 測試 x-data-spreadsheet.js excel表格渲染  TODO... 之後刪除
    if (props.source && (props.id === 'excelA' || props.id === 'excelB')) {
      const options = props.source.options || {};
      // 調整 excel 表格顯示區域大小
      options.view = {
        height: () => {
          // const H = document.documentElement.clientHeight; // 遠本套件預設,是用瀏覽器視窗高度
          const H = contentBoxDOM.value!.clientHeight - 35; // 我改用 content-box 的高度  TODO... 35是預留scrollbar的空間
          // console.log('...H', H);
          return H
        },
        width: () => {
          // const W = document.documentElement.clientWidth; // 遠本套件預設,是用瀏覽器視窗寬度
          const W = contentBoxDOM.value!.clientWidth - 35; // 我改用 content-box 的寬度  TODO... 35是預留scrollbar的空間
          // console.log('...W', W);
          return W
        }
      };
      // 依照資料面決定要設定多少的列跟欄
      let maxRow = 0;
      let maxCol = 0;
      props.source.data.forEach((item: any) => {
        for (const rolKey in item.rows) {
          maxRow = Math.max(maxRow, Number(rolKey)); // 取得最大的 row index
          const rowData = item.rows[rolKey];
          for (const colKey in rowData.cells) {
            maxCol = Math.max(maxCol, Number(colKey)); // 取得最大的 col index
          }
        }
      });
      // 再將索引數值 +1 才是實際的行列數
      options.row.len = Math.max(maxRow + 1, Number(100)); // 預設最少 100 列
      options.col.len = Math.max(maxCol + 1, Number(26)) ; // 預設最少 26 欄 A~Z
      // options.row.len = maxRow + 1;
      // options.col.len = maxCol + 1;

      // 套件限定用 id 當作 selector
      excelObj = window.x_spreadsheet(`#excelView${props.id}`, options);
      // 載入資料
      excelObj.loadData(props.source.data);
      // 事件:每一次異動資料時都會觸發
      excelObj.change((data: any) => {
        console.log('change data 套件當前資料: ', data);
      });
      // data validation
      excelObj.validate();


      // 添加事件回呼
      // 選則格子開始時呼叫 (mousedown 時就會觸發)
      excelObj.on('cell-selected', (cell: any, ri: any, ci: any) => {
        //console.log('cell-selected', cell, ri, ci);
      });
      // 選則格子(支援多個格子)結束時呼叫 (mousemove 時觸發)
      excelObj.on('cells-selected', (cell: any, t: any) => {
        //console.log('cells-selected', cell, t);
      });
      // edited on cell
      excelObj.on('cell-edited', (text: any, ri: any, ci: any) => {
        //console.log('cell-edited', text, ri, ci);
      });

      // @@... 查不到套件怎麼在 sheet 上面綁定鼠標滾動事件
      // s.sheet.overlayerMousescroll = (e: any) => {
      //   console.log('表格覆盖层鼠标滚动事件', e);
      // };

      // 實驗套件的 api
      excelObj.cellText(5, 5, 'xxxx').cellText(6, 5, 'yyy').reRender(); // 給予第五列第五行與第六列第五行文字內容, 並重新渲染 (發現:重新渲染不會觸發toolbar的尺寸重新計算)
      console.log(excelObj.cell(0, 1)); // 取得第一列第二行的資料


      // 除錯開發用
      window.debug.contentBoxDOM = contentBoxDOM.value;
      window.debug.excel = excelObj;
    }
  })
})
</script>
