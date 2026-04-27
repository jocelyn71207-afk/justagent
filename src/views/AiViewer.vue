<template>
  <!-- 主場景 debug 資訊顯示區 -->
  <VueDragResizeRotate
    class="debug-views AiViewerContentResize"
    v-if="lookDebug"
    :enable-native-drag="true"
    :draggable="false"
    :resizable="false"
    :rotatable="false"
    :w="200"
    :h="450"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)"
  >
    <template v-slot:tl><div class="handle-icon"></div></template>
    <template v-slot:tm><div class="handle-icon"></div></template>
    <template v-slot:tr><div class="handle-icon"></div></template>
    <template v-slot:mr><div class="handle-icon"></div></template>
    <template v-slot:br><div class="handle-icon"></div></template>
    <template v-slot:bm><div class="handle-icon"></div></template>
    <template v-slot:bl><div class="handle-icon"></div></template>
    <template v-slot:ml><div class="handle-icon"></div></template>

    <div class="debug-views-content">
      <button class="custom-btn" @click="lookDebug = false">
        <i class="material-symbols-outlined">close</i>
      </button>
      <!-- 點擊複製 #debugInfo 內的字串 -->
      <button class="custom-btn copy-info-btn" @click="copyDebugInfo()">
        <i class="material-symbols-outlined">content_copy</i>
      </button>
      <div class="debug-info fs-13">
        <pre id="debugInfo">{{
          JSON.stringify(
            {
              scaleBoxStyle: scaleBoxStyle,
              isMultiChoiceAiViewerMode: isMultiChoiceAiViewerMode,
              mainStageStartPosition: mainStageStartPosition,
              startPinchDistance: startPinchDistance,
              debug_startPinchDistance: debug_startPinchDistance,
              分隔線: "--------------------",
              centerContentInfo: {
                中間區塊可視尺寸: "",
                x: centerContentX,
                y: centerContentY,
                W: centerViewWidth,
                H: centerViewHeight,
                scale: centerContentScale,
              },
              aiViewerBlocks: aiViewerBlocks,
              touchDebug: touchDebug,
            },
            null,
            2,
          )
        }}</pre>
      </div>
    </div>
  </VueDragResizeRotate>

  <!-- 左右區塊顯示控制按鈕 -->
  <div :class="['AiViewr-ctrl-box left-ctrl-box', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]" v-if="false"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)"
    @click="() => {
      isShowLeftFrame = !isShowLeftFrame;
      // nextTick(() => {
      //   checkRightSize(handleLREndResize);
      // });
    }">
    <i :class="['uil fs-24', {
        'uil-toggle-on': isShowLeftFrame,
        'uil-toggle-off': !isShowLeftFrame,
      }]">
    </i>
  </div>
  <div :class="['AiViewr-ctrl-box right-ctrl-box', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
    v-show="!conv1IsEmpty"
    :style="{
      right: (isShowRightFrame || isShowCommentListView || isShowBlockListView || isShowFileListView) ? ctrlRightGap + 'px' : '10px',
    }"
    v-tooltip="'收合對話介面'"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)"
    @click="() => {
      isShowRightFrame = !isShowRightFrame;
      nextTick(() => {
        checkRightSize(handleLREndResize);
      });
    }">
    <i class="material-symbols-outlined ctrl-btn" v-if="!isShowRightFrame">dock_to_right</i>
    <i class="material-symbols-outlined ctrl-btn" v-if="isShowRightFrame">dock_to_left</i>
  </div>

  <!-- 專案控制小介面 -->
  <div :class="['AiViewr-ctrl-box user-project-ctrl-box', { smailleScreen: centerViewWidth <= 500, 'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
    v-show="!conv1IsEmpty"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">

    <i class="material-symbols-outlined material-fill ctrl-btn" v-tooltip="'回首頁'"
      @click="goHome">home</i>

    <!-- 用戶 -->
    <div class="user-name" v-tooltip="'Lucas'">L</div>

    <i class="material-symbols-outlined ctrl-btn fs-17" v-tooltip="'more'"
      @click="isOpenProjMoreOptions = !isOpenProjMoreOptions">keyboard_arrow_down</i>

    <!-- 更多選項選單 -->
    <div class="more-options-box next-option-box" ref="projectMoreOptionsBox" v-show="isOpenProjMoreOptions">
      <!-- 多選模式切換: 手機或平板專用 -->
      <div class="option-item" v-if="isTouchDevice"
        @click="isMultiChoiceAiViewerMode = !isMultiChoiceAiViewerMode">
        <i class="material-symbols-outlined">ink_selection</i>
        <template v-if="!isMultiChoiceAiViewerMode">進入</template>
        <template v-else>離開</template>多選模式
      </div>

      <div class="option-item" @click="isOpenProjectSettingModal = true">
        <i class="material-symbols-outlined">folder_managed</i>
        專案設定
      </div>
      <div class="option-item" @click="isOpenProjectUseAngentModal = true">
        <i class="material-symbols-outlined">smart_toy</i>
        查看已使用Agent
      </div>

      <div class="option-item" @click="useMap = !useMap">
        <i class="material-symbols-outlined">map</i>
        <template v-if="!useMap">開啟</template>
        <template v-else>關閉</template>小地圖
      </div>
      <div class="option-item" v-if="!isTouchDevice">
        <i class="material-symbols-outlined">keyboard</i> 快速鍵說明
      </div>
      <div class="option-item">
        <i class="material-symbols-outlined">description</i> 操作教學
      </div>
      <div class="option-item" @click="router.push('/view/journeys')">
        <i class="material-symbols-outlined">route</i>
        旅程總覽
      </div>
    </div>
  </div>

  <!-- 主功能小介面 -->
  <div ref="projectFnBox"
    :class="['AiViewr-ctrl-box project-fn-box', { smailleScreen: centerViewWidth <= 500, 'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
    :style="projectFnBoxStyle"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">
    <!-- 常態功能按鈕 -->
    <div class="fn-btn-box">
      <i class="material-symbols-outlined ctrl-btn" v-tooltip.top="'上傳檔案'">upload_file</i>
      <i class="material-symbols-outlined ctrl-btn" v-tooltip.top="'共享資源庫'">cloud</i>
      <i :class="['material-symbols-outlined ctrl-btn', { active: isShowBlockListView }]" v-tooltip="{ content: `畫布內容查詢<div class='text-center fs-11'>(Shift+I)<div>`, html: true}"
        @click="() => {
          isShowBlockListView = !isShowBlockListView;
          isShowCommentListView = false;
          isShowFileListView = false;
          nextTick(() => {
            resizeStage();
          });
        }">feature_search</i>
      <i :class="['material-symbols-outlined ctrl-btn', { active: isShowCommentListView }]" v-tooltip.top="{ content: `評論查詢<div class='text-center fs-11'>(Shift+C)<div>`, html: true}"
        @click="() => {
          isShowCommentListView = !isShowCommentListView;
          isShowBlockListView = false;
          isShowFileListView = false;
          nextTick(() => {
            resizeStage();
          });
        }">mark_chat_unread</i>
    </div>
    <!-- 多選功能按鈕 -->
    <div class="multi-choice-btn-box" v-show="nowMultiChoiceAiViewerIds.length >= 1">
      <div style="position: relative;">
        <span class="count-box">{{ nowMultiChoiceAiViewerIds.length }}</span>
        <i class="material-symbols-outlined ctrl-btn" v-tooltip.top="'取消多選'"
          @click="() => {
            nowMultiChoiceAiViewerIds.splice(0, nowMultiChoiceAiViewerIds.length);
          }">remove_selection</i>
      </div>
      <i class="material-symbols-outlined ctrl-btn"
        v-tooltip.top="'批次複製'"
        @click="() => {
          nowMultiChoiceAiViewerIds.forEach((id) => {
            // 再次檢查避免是多選之後在單獨殺掉 block 的情況
            aiViewerBlocks.some((item) => {
              if (item.id === id) {
                const newBlock = JSON.parse(JSON.stringify(item));
                newBlock.id = 'AiViewerBlock_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                newBlock.x += 20;
                newBlock.y += 20;
                newBlock.z = calcNextZindex();
                pasteBlock(newBlock);
                return true;
              }
              return false;
            });
          });
        }">tab_inactive</i>
      <i class="material-symbols-outlined ctrl-btn"
        v-tooltip.top="'批次刪除'"
        @click="() => {
          // 重 aiViewerBlocks 過濾掉被選中的區塊
          nowMultiChoiceAiViewerIds.forEach((id, index) => {
            aiViewerBlocks.splice(aiViewerBlocks.findIndex((i: any) => i.id === id), 1);
          });
          nowMultiChoiceAiViewerIds.splice(0, nowMultiChoiceAiViewerIds.length);
        }">tab_close_inactive</i>
      <i class="material-symbols-outlined ctrl-btn"
        v-tooltip.top="'帶入對話'"
        @click="() => {
          nowMultiChoiceAiViewerIds.forEach((id) => {
            // 再次檢查避免是多選之後在單獨殺掉 block 的情況
            const block = aiViewerBlocks.find((item) => item.id === id);
            if (block) {
              userInputModal.aiFiles.push(JSON.parse(JSON.stringify(block.data)));
            }
          });
        }">share_windows</i>
    </div>
  </div>

  <!-- 主場景尺寸比例控制小介面 -->
  <div :class="['AiViewr-ctrl-box size-ctrl-box', { smailleScreen: centerViewWidth <= 500, 'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
    v-show="!conv1IsEmpty"
    :style="{
      right: (isShowRightFrame || isShowCommentListView || isShowBlockListView || isShowFileListView) ? (ctrlRightGap + 50) + 'px' : '60px',
    }"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">
    <i class="material-symbols-outlined ctrl-btn" @click="changeMainScalc(-0.2)">remove</i>
    <div class="percent" @click="isOpenMoreSizeBox = !isOpenMoreSizeBox">{{ Math.ceil(centerContentScale * 100) }}%</div>
    <i class="material-symbols-outlined ctrl-btn" @click="changeMainScalc(0.2)">add</i>
    <!-- <div class="ctrl-btn" @click="resetMainScalc()"><i class="material-symbols-outlined">view_real_size</i></div> -->
    <!-- <div class="ctrl-btn resetPosition" @click="resetMainPosition()">
      <i class="uil uil-map-pin fs-24"></i>
    </div> -->

    <!-- 更多尺寸選單 -->
    <div class="more-size-box next-option-box" ref="moreSizeBox" v-show="isOpenMoreSizeBox">
      <div class="option-item" @click="resetMainScalc()">縮放至 100%</div>
    </div>

  </div>

  <!-- ● 主要界面區 -->
  <div :class="['AiViewer', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]" :style="AiViewerStyle">
    <!-- 左區塊 -->
    <AiViewerLeftBox v-show="isShowLeftFrame" :leftWidth="leftWidth" />
    <div :class="['AiViewer-frame-resizer', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]" v-if="isShowLeftFrame"
      @mousedown="onLRMouseStart('left', $event)"
      @touchstart="onLRTouchStart('left', $event)">
    </div>

    <!-- 主要內容區 -->
    <div :class="['center-box']"
      :style="centerBoxStyle"
      :ref="'centerBox'">
      <!-- 原點座標圖  TODO... 視情況移除 -->
      <!-- <i class="uil uil-map-pin center-origin" v-if="false" @wheel="stopWhellZoomEvent($event)" @touchmove="stopTouchpadZoomEvent($event)"
        :ref="'centerOrigin'"
        :style="centerOriginStyle"></i> -->

      <!-- 指針 -->
      <!-- <i class="uil uil-location-arrow-alt center-compass"
        @wheel="stopWhellZoomEvent($event)"
        @touchmove="stopTouchpadZoomEvent($event)"
        :ref="'centerCompas'"
        :style="centerCompassStyle"
      ></i> -->

      <!-- 包著每一個小區塊的容器 (處理放大小倍率) -->
      <div class="scaleBox" ref="scaleBox" :style="scaleBoxStyle"
        @wheel.stop.prevent="() => {}">
        <template v-for="item in aiViewerBlocks" :key="item.id">
          <!-- // 偷偷藏了方便 debug 用的計數器歸零 -->
          <AiViewerContentBox
            @click="checkMultiChoiceMode(item.id); debugCount = 0;"
            :source="item.data ? item.data : {}"
            :id="item.id"
            :blockName="item.blockName"
            :z="item.z"
            :x="item.x"
            :y="item.y"
            :minX="null"
            :minY="null"
            :width="item.width"
            :height="item.height"
            :aspectRatio="false"
            :resizeCallback="resizeAiViewerContentBox"
            :deleteCallback="removeAiViewerContentBox"
            @choice="choiceAiViewerContentBox(item, item.id)"
          ></AiViewerContentBox>
        </template>
      </div>

      <!-- 墊在下方的 konva.js 主場景 -->
      <div id="mainStage"
        :style="{
          'z-index':
            (isMultiChoiceAiViewerMode && startMousePosition.startX && startMousePosition.startY) ||
            (startPinchDistance.position.startX && startPinchDistance.position.startY) ? 2 : 0,
        }"
      ></div>

      <!-- 收合狀態：懸浮 FAB（在 center-box 內，跟著畫布區域移動）-->
      <Transition name="jcd-fab-pop">
        <div class="journey-canvas-fab" v-if="showJourneyDrawer && isJcdCollapsed" @click="isJcdCollapsed = false" title="展開旅程狀態">
          <i class="material-symbols-outlined jcd-fab-icon">account_tree</i>
          <span class="jcd-fab-badge" v-if="jcdStats.running > 0">{{ jcdStats.running }}</span>
        </div>
      </Transition>
    </div>

    <!-- 右區塊 -->
    <div :class="['AiViewer-frame-resizer', {'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
      ref="AiViewerRightResizerDOM"
      @mousedown="onLRMouseStart('right', $event)"
      @touchstart="onLRTouchStart('right', $event)"
      v-show="(isShowRightFrame || isShowCommentListView || isShowBlockListView || isShowFileListView)"
    ></div>
    <AiViewerRightBox v-show="(isShowRightFrame || isShowCommentListView || isShowBlockListView || isShowFileListView)"
      :rightWidth="rightWidth"
      :setMainStagePosition="setMainStagePosition"/>
  </div>

  <!-- 主場景小地圖 -->
  <StageMap v-if="useMap"
    :class="[{'in-multi-choice-mode': isMultiChoiceAiViewerMode }]"
    :setMainStagePosition="setMainStagePosition" />

  <!-- 單一小區塊進入放大滿版 -->
  <FullAiViewerBlockBox v-if="fullAiViewerBlockId" />

  <!-- 專案已使用的 Agent Modal -->
  <ProjectUseAngentModal
    v-model="isOpenProjectUseAngentModal"
    :projectId="'test'"
  />

  <!-- 專案設定 Modal -->
  <ProjectSettingModal
    v-model="isOpenProjectSettingModal"
    :projectId="'test'"
  />

  <!-- 對話列表 Modal -->
  <conversationListModal />

  <!-- 旅程執行狀態 Drawer (canvas overlay) -->
  <Transition name="jcd-slide">
    <div class="journey-canvas-drawer" v-if="showJourneyDrawer && !isJcdCollapsed">
      <div class="jcd-hdr">
        <span class="jcd-hdr-title">旅程執行狀態</span>
        <button class="jcd-collapse-btn" @click="isJcdCollapsed = true" title="收合">
          <i class="material-symbols-outlined">chevron_left</i>
        </button>
      </div>
      <div class="jcd-body">

        <!-- 行銷自動化旅程 section -->
        <template v-if="jcdStats.marketing.total > 0">
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--marketing"></span>
            <span class="jcd-type-name">行銷自動化旅程</span>
          </div>
          <div class="jcd-stat-row">
            <div class="jcd-stat"><div class="jcd-stat-val blue">{{ jcdStats.marketing.total }}</div><div class="jcd-stat-lbl">觸發</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val green">{{ jcdStats.marketing.done }}</div><div class="jcd-stat-lbl">完成</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val">{{ jcdStats.marketing.completion }}%</div><div class="jcd-stat-lbl">完成率</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val amber">{{ jcdStats.marketing.total - jcdStats.marketing.done }}</div><div class="jcd-stat-lbl">執行中</div></div>
          </div>
          <div v-for="nc in jcdStats.marketing.nodeCounts" :key="nc.key" class="jcd-node-dist">
            <div class="jcd-node-dist-hdr">
              <span class="jcd-node-dist-key">{{ nc.key }}</span>
              <span class="jcd-node-dist-label">{{ nc.label }}</span>
              <span :class="['jcd-node-dist-count', { running: nc.running > 0 }]">
                {{ nc.running > 0 ? nc.running + '人' : nc.done + '人' }}
              </span>
            </div>
            <div class="jcd-dist-bar" v-if="jcdStats.marketing.total > 0">
              <div class="jcd-dist-done" :style="{ width: (nc.done / jcdStats.marketing.total * 100) + '%' }"></div>
              <div class="jcd-dist-running" :style="{ width: (nc.running / jcdStats.marketing.total * 100) + '%' }"></div>
            </div>
          </div>
          <div class="jcd-rows-title">個別旅程</div>
          <div v-for="journey in jcdStats.marketing.journeys.slice(0, 8)" :key="journey.id" class="jcd-row">
            <span class="jcd-row-name">{{ journey.userName }}</span>
            <div class="jcd-row-dots">
              <span v-for="node in journey.nodes" :key="node.key"
                :class="['jcd-rdot', node.status]"
                :title="node.key + ' ' + node.label"></span>
            </div>
            <span :class="['jcd-row-badge', journey.status]">
              {{ journey.status === 'done' ? '✓' : journey.nodes.filter(n => n.status === 'done').length + '/' + journey.nodes.length }}
            </span>
          </div>
          <div v-if="jcdStats.marketing.total > 8" class="jcd-rows-more">+{{ jcdStats.marketing.total - 8 }} 人</div>
        </template>

        <div class="jcd-divider" v-if="jcdStats.marketing.total > 0 && jcdStats.birthday.total > 0"></div>

        <!-- 5月壽星專屬旅程 section -->
        <template v-if="jcdStats.birthday.total > 0">
          <div class="jcd-type-hdr">
            <span class="jcd-type-dot jcd-type-dot--birthday"></span>
            <span class="jcd-type-name">5月壽星專屬旅程</span>
          </div>
          <div class="jcd-stat-row">
            <div class="jcd-stat"><div class="jcd-stat-val violet">{{ jcdStats.birthday.total }}</div><div class="jcd-stat-lbl">觸發</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val green">{{ jcdStats.birthday.done }}</div><div class="jcd-stat-lbl">完成</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val">{{ jcdStats.birthday.completion }}%</div><div class="jcd-stat-lbl">完成率</div></div>
            <div class="jcd-stat"><div class="jcd-stat-val amber">{{ jcdStats.birthday.total - jcdStats.birthday.done }}</div><div class="jcd-stat-lbl">執行中</div></div>
          </div>
          <div v-for="nc in jcdStats.birthday.nodeCounts" :key="nc.key" class="jcd-node-dist">
            <div class="jcd-node-dist-hdr">
              <span class="jcd-node-dist-key">{{ nc.key }}</span>
              <span class="jcd-node-dist-label">{{ nc.label }}</span>
              <span :class="['jcd-node-dist-count', { running: nc.running > 0 }]">
                {{ nc.running > 0 ? nc.running + '人' : nc.done + '人' }}
              </span>
            </div>
            <div class="jcd-dist-bar" v-if="jcdStats.birthday.total > 0">
              <div class="jcd-dist-done" :style="{ width: (nc.done / jcdStats.birthday.total * 100) + '%' }"></div>
              <div class="jcd-dist-running" :style="{ width: (nc.running / jcdStats.birthday.total * 100) + '%' }"></div>
            </div>
          </div>
          <div class="jcd-rows-title">個別旅程</div>
          <div v-for="journey in jcdStats.birthday.journeys.slice(0, 8)" :key="journey.id" class="jcd-row">
            <span class="jcd-row-name">{{ journey.userName }}</span>
            <div class="jcd-row-dots">
              <span v-for="node in journey.nodes" :key="node.key"
                :class="['jcd-rdot', node.status]"
                :title="node.key + ' ' + node.label"></span>
            </div>
            <span :class="['jcd-row-badge', journey.status]">
              {{ journey.status === 'done' ? '✓' : journey.nodes.filter(n => n.status === 'done').length + '/' + journey.nodes.length }}
            </span>
          </div>
          <div v-if="jcdStats.birthday.total > 8" class="jcd-rows-more">+{{ jcdStats.birthday.total - 8 }} 人</div>
        </template>

      </div>
    </div>
  </Transition>


</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import type { Ref } from "vue";
import { storeToRefs } from "pinia";
import { useAiviewerStore } from "@/stores/AiViewerStore";
import { useJourneyStore } from "@/stores/journeyStore";
import { useRouter } from "vue-router";
import AiViewerLeftBox from "@/components/AiViewer/AiViewerLeftBox.vue";
import AiViewerRightBox from "@/components/AiViewer/AiViewerRightBox.vue";
import AiViewerContentBox from "@/components/AiViewer/AiViewerContentBox.vue";
import FullAiViewerBlockBox from "@/components/AiViewer/FullAiViewerBlockBox.vue";
import VueDragResizeRotate from "@gausszhou/vue3-drag-resize-rotate";
import StageMap from "@/components/AiViewer/StageMap.vue";
import ProjectUseAngentModal from "@/components/AiViewer/ProjectUseAngentModal.vue";
import ProjectSettingModal from "@/components/AiViewer/ProjectSettingModal.vue";
import conversationListModal from "@/components/AiViewer/conversationListModal.vue";
import Konva from "konva";
import { detectInputDevice, stopWhellZoomEvent, stopTouchpadZoomEvent, initClickOutsideListener } from "@/utils/utils";
import popDialog from "@/services/popDialog";

// pdf.js worker 路徑設定
window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}/libs/pdf.worker.min.js`;

const aiviewerStore = useAiviewerStore();
const { isTouchDevice, isShowCommentListView, isShowBlockListView, isShowFileListView, conv1IsEmpty } = storeToRefs(aiviewerStore);
const { resetAiViewerState } = aiviewerStore;
const router = useRouter();

// ── 旅程執行狀態 Drawer ──────────────────────────────────────────
const journeyStore = useJourneyStore();
const showJourneyDrawer = ref(false);
const isJcdCollapsed = ref(false);
watch(() => journeyStore.journeys.length, (n) => { if (n > 0) showJourneyDrawer.value = true; });

const jcdHoverType = ref<'marketing' | 'birthday' | null>(null);
let jcdHoverTimer: ReturnType<typeof setTimeout> | null = null;
const JOURNEY_TYPE_NODES = {
  marketing: [
    { key: 'D0',  label: '觸發加入旅程' },
    { key: 'D1',  label: '歡迎序列啟動' },
    { key: 'D3',  label: '行為條件分流' },
    { key: 'D7',  label: '產品深度培育' },
    { key: 'D14', label: '購買轉換衝刺' },
    { key: 'D30', label: '購後回購培育' },
  ],
  birthday: [
    { key: 'PRE7', label: '壽星名單篩選' },
    { key: 'D0',   label: '生日驚喜觸發' },
    { key: 'D1',   label: '生日禮追蹤' },
    { key: 'D7',   label: '壽星回購培育' },
    { key: 'D30',  label: '旅程成效報告' },
  ],
} as const;
function getTypeStats(type: 'marketing' | 'birthday') {
  const list = journeyStore.journeys.filter(j => j.journeyType === type);
  const total = list.length;
  const done = list.filter(j => j.status === 'done').length;
  const completion = total > 0 ? Math.round(done / total * 100) : 0;
  const nodeCounts = JOURNEY_TYPE_NODES[type].map(({ key, label }) => {
    let doneCount = 0, runningCount = 0;
    for (const j of list) {
      const node = j.nodes.find(n => n.key === key);
      if (!node) continue;
      if (node.status === 'done') doneCount++;
      else if (node.status === 'running') runningCount++;
    }
    return { key, label, done: doneCount, running: runningCount };
  });
  return { total, done, completion, journeys: list, nodeCounts };
}
const jcdStats = computed(() => {
  const total = journeyStore.journeys.length;
  const done = journeyStore.journeys.filter(j => j.status === 'done').length;
  return {
    total,
    done,
    running: total - done,
    marketing: getTypeStats('marketing'),
    birthday: getTypeStats('birthday'),
  };
});

function findJourneyBlock(type: 'marketing' | 'birthday') {
  const keyword = type === 'marketing' ? 'journey_dashboard' : 'birthday_journey';
  return (aiViewerBlocks.value as any[]).find(
    (b: any) => b.data?.data?.fileUrl?.includes(keyword)
  ) ?? null;
}

function panToJourneyBlock(type: 'marketing' | 'birthday') {
  const block = findJourneyBlock(type);
  if (!block || !mainStage.value) return;
  const s = mainStage.value.scaleX();
  const newX = centerViewWidth.value / 2 / s - (block.x + block.width / 2);
  const newY = centerViewHeight.value / 2 / s - (block.y + block.height / 2);
  setMainStagePosition(newX, newY);
}

function applyJourneyBlockHighlight(type: 'marketing' | 'birthday') {
  const focusBlock = findJourneyBlock(type);
  const otherType: 'marketing' | 'birthday' = type === 'marketing' ? 'birthday' : 'marketing';
  const otherBlock = findJourneyBlock(otherType);
  if (focusBlock) {
    document.getElementById(focusBlock.id)?.classList.add(`jcd-highlight-${type}`);
  }
  if (otherBlock) {
    document.getElementById(otherBlock.id)?.classList.add('jcd-dimmed');
  }
}

function clearJourneyBlockHighlight() {
  document.querySelectorAll('.jcd-highlight-marketing, .jcd-highlight-birthday, .jcd-dimmed')
    .forEach(el => {
      el.classList.remove('jcd-highlight-marketing', 'jcd-highlight-birthday', 'jcd-dimmed');
    });
}

function onJcdSectionEnter(type: 'marketing' | 'birthday') {
  if (jcdHoverTimer) clearTimeout(jcdHoverTimer);
  jcdHoverTimer = setTimeout(() => {
    jcdHoverType.value = type;
    panToJourneyBlock(type);
    applyJourneyBlockHighlight(type);
  }, 400);
}

function onJcdSectionLeave() {
  if (jcdHoverTimer) { clearTimeout(jcdHoverTimer); jcdHoverTimer = null; }
  jcdHoverType.value = null;
  clearJourneyBlockHighlight();
}

// konva.js 主場景物件
const { mainStage } = storeToRefs(aiviewerStore);

// ● 框架 - 中間區塊
const centerBox = ref<HTMLElement | null>(null);
const scaleBox = ref<HTMLElement | null>(null);
const ctrlRightGap = ref(420); // 主場景控制小介面與瀏覽器右邊的距離
const centerContentScale = ref(1.0); // 中間區塊內容縮放比例 (mainStage 的 scale)
const centerContentX = ref(0); // 中間區塊內容 X 座標 (mainStage 的 x)
const centerContentY = ref(0); // 中間區塊內容 Y 座標 (mainStage 的 x)
const centerViewWidth = ref(0); // 中間區塊可視寬度
const centerViewHeight = ref(0); // 中間區塊可視高度
const centerMaxScale = 2.0; // 最大縮放比例
const centerMinScale = 0.2; // 最小縮放比例
const projectMoreOptionsBox = ref<HTMLElement | null>(null); // 專案更多選項選單 DOM 元素
const isOpenProjMoreOptions = ref(false); // 用戶專案小介面: 是否開啟專案更多選項選單
const moreSizeBox = ref<HTMLElement | null>(null); // 更多尺寸選單 DOM 元素
const isOpenMoreSizeBox = ref(false); // 尺寸控制小介面: 是否開啟更多尺寸選單
const useMap = ref(false); // 是否使用小地圖功能
const isOpenProjectUseAngentModal = ref(false); // 是否開啟專案已使用Agent的 Modal
const isOpenProjectSettingModal = ref(false); // 是否開啟專案設定 Modal

// 回首頁
function goHome(): void {
  router.push({ name: 'ProjectDashboard' });
};
// 整個 AiViewer 框架的左中右樣式
const AiViewerStyle = computed(() => {
  const columns = [];
  const LR_size = isTouchDevice.value ? "10px" : "4px"; // 觸控裝置使用較大拖曳感應區

  // 左邊區塊
  if (isShowLeftFrame.value) {
    columns.push("auto", LR_size); // 左邊內容 + 分隔線
  }

  // 中間區塊 (永遠存在)
  columns.push("1fr");

  // 右邊區塊
  if (isShowRightFrame.value || isShowCommentListView.value || isShowBlockListView.value || isShowFileListView.value) {
    columns.push(LR_size, "auto"); // 分隔線 + 右邊內容
  }

  return {
    gridTemplateColumns: columns.join(" "),
  };
});
// 中間區塊樣式
const centerBoxStyle = computed(() => {
  // 細十字格線雙層縮放（大格 96px / 小格 24px，隨畫布 scale 同步）
  const small = 24 * centerContentScale.value;
  const large = 96 * centerContentScale.value;
  return {
    backgroundSize: `${large}px ${large}px, ${large}px ${large}px, ${small}px ${small}px, ${small}px ${small}px`,
  };
});
// 包著每一個小區塊的容器 樣式
const scaleBoxStyle = computed(() => {
  // const leftResizeWidth = (isTouchDevice.value) ? 10 : 4; // 是左欄的控制分隔線寬度
  return {
    // transform: `scale(${centerContentScale.value}) translate(${centerContentX.value}px, ${centerContentY.value}px)`,
    transform: `scale(${centerContentScale.value}) translateZ(0) translate(${centerContentX.value}px, ${centerContentY.value}px)`,
    transformOrigin: "0 0", // 設定變換原點為左上角，確保縮放與平移的座標計算正確
    // left: (isShowLeftFrame.value) ? (leftWidth.value + leftResizeWidth +'px') : '0px', // 這是如果有左欄大區塊才要使用
  };
});
// 指針 DOM 元素
// const centerCompas = ref<HTMLElement | null>(null);
// 指針 DOM 元素樣式
// const centerCompassStyle = computed(() => {
//   // 以 centerCompas DOM 為中心，找出最接近該中心的內容區塊（需考慮縮放和平移）
//   let closestItem: any = null;
//   let closestDistance = Infinity;
//   let compasX = 0;
//   let compasY = 0;
//   // 取得指針的中心座標（視窗座標）
//   if (centerCompas.value) {
//     const rect = centerCompas.value.getBoundingClientRect();
//     compasX = rect.left + rect.width / 2;
//     compasY = rect.top + rect.height / 2;
//   }

//   aiViewerBlocks.value.forEach((item: any) => {
//     // item 的中心座標(在 scaleBox 內部,已經是相對於主場景 (0,0) 的座標)
//     const itemLocalX = item.x + (item.width ? item.width / 2 : 0);
//     const itemLocalY = item.y + (item.height ? item.height / 2 : 0);
//     // 轉成畫面座標：(block座標 + translate偏移) * scale
//     const itemScreenX = (itemLocalX + centerContentX.value) * centerContentScale.value;
//     const itemScreenY = (itemLocalY + centerContentY.value) * centerContentScale.value;

//     const dx = itemScreenX - compasX;
//     const dy = itemScreenY - compasY;
//     const distance = Math.hypot(dx, dy);
//     if (distance < closestDistance) {
//       closestDistance = distance;
//       closestItem = item;
//     }
//   });

//   // 計算該內容區塊相對於 centerCompas 的角度
//   let angle = 0;
//   if (closestItem) {
//     const itemLocalX = closestItem.x + (closestItem.width ? closestItem.width / 2 : 0);
//     const itemLocalY = closestItem.y + (closestItem.height ? closestItem.height / 2 : 0);

//     // 同樣使用 centerBox 的位置作為基準
//     const itemScreenX = (itemLocalX + centerContentX.value) * centerContentScale.value;
//     const itemScreenY = (itemLocalY + centerContentY.value) * centerContentScale.value;
//     angle = Math.atan2(itemScreenY - compasY, itemScreenX - compasX) * (180 / Math.PI) + 90;
//   }

//   const re: any = {
//     transform: `rotate(${angle}deg)`,
//     right: isShowRightFrame.value ? ctrlRightGap.value + 180 + "px" : "240px",
//   };

//   // 如果畫布範圍太小要改變位置
//   if (centerViewWidth.value <= 500) {
//     re.top = "63px";
//     re.right = `calc(100% - 220px)`;
//   }

//   return re;
// });

// 原點座標圖 DOM 元素  // TODO... 視情況移除
// const centerOrigin = ref<HTMLElement | null>(null);
// 原點座標圖 DOM 樣式
// const centerOriginStyle = computed(() => {
//   return {
//     left: (centerContentX.value - 0) + 'px',
//     top: (centerContentY.value - 0) + 'px',
//   }
// });

// 改變主要內容區縮放比例
function changeMainScalc(delta: number): void {
  // 取小數點後一位
  let newScale = parseFloat((centerContentScale.value + delta).toFixed(1));
  // 限制縮放比例範圍在 最大最小 之間
  if (newScale < centerMinScale) newScale = centerMinScale;
  if (newScale > centerMaxScale) newScale = centerMaxScale;
  centerContentScale.value = newScale;

  mainStage.value.scale({ x: newScale, y: newScale });
  centerContentScale.value = newScale;
  // gridRectResize();
}
// 重設主要內容區縮放比例為 1:1
function resetMainScalc(): void {
  mainStage.value.scale({ x: 1, y: 1 });
  centerContentScale.value = 1.0;
  // gridRectResize();
}
// 重設主要內容區位置為 (0,0)
function resetMainPosition(): void {
  mainStage.value.x(0);
  mainStage.value.y(0);
  centerContentX.value = 0;
  centerContentY.value = 0;
  // gridRectResize();
}
// 設定主場景的座標位置
function setMainStagePosition(x: number, y: number): void {
  mainStage.value.x(x);
  mainStage.value.y(y);
  centerContentX.value = x;
  centerContentY.value = y;
  mainStage.value.batchDraw();
  // gridRectResize();
}
onMounted(() => {
  // 專案更多選項介面 DOM 元素註冊是否在指定元素外部點擊的事件監聽器
  initClickOutsideListener(projectMoreOptionsBox.value!, () => {
    isOpenProjMoreOptions.value = false;
  });
  // 更多尺寸選單 DOM 元素註冊是否在指定元素外部點擊的事件監聽器
  initClickOutsideListener(moreSizeBox.value!, () => {
    isOpenMoreSizeBox.value = false;
  });
})

// ● 框架 - 左右區塊
const AiViewerRightResizerDOM = ref<HTMLElement | null>(null);
const isShowLeftFrame = ref(false); // 是否顯示左區塊
const isShowRightFrame = ref(true); // 是否顯示右區塊
const leftWidth = ref(!isTouchDevice.value ? 200 : 100); // 左區塊預設寬度
const rightWidth = ref((window.innerWidth <= 400 )? 200 : 440); // 右區塊預設寬度 (手機版預設200px, 桌面版預設440px)
const minRightWidth = ref(300); // 右區塊最小寬度 for desktop
const mobileMinRightWidth = ref(170); // 右區塊最小寬度 for mobile
const resizeType: Ref<"left" | "right" | null> = ref(null); // 拖曳調整大小的區塊, 左或右
const startX = ref(0); // 開始拖曳的滑鼠X座標
const startWidth = ref(0); // 開始拖曳時的區塊寬度
const isResizing = ref(false); // 是否正在拖曳狀態

// 左右區塊:開始拖曳
//   開始拖曳:滑鼠
function onLRMouseStart(type: "left" | "right", event: MouseEvent): void {
  event.preventDefault();
  handlLRStartResize(type, event.clientX);

  // 添加滑鼠事件監聽
  document.addEventListener("mousemove", onLRMouseMove);
  document.addEventListener("mouseup", onLRMouseUp);
}
//   開始拖曳:觸控
function onLRTouchStart(type: "left" | "right", event: TouchEvent): void {
  event.preventDefault();
  handlLRStartResize(type, event.touches[0].clientX);

  // 添加觸控事件監聽
  document.addEventListener("touchmove", onLRTouchMove, { passive: false });
  document.addEventListener("touchend", onLRTouchEnd);
};
// 左右區塊:統一的開始拖曳邏輯 (滑鼠與觸控共用)
function handlLRStartResize(type: "left" | "right", clientX: number): void {
  isResizing.value = true;
  resizeType.value = type;
  startX.value = clientX;
  startWidth.value = type === "left" ? leftWidth.value : rightWidth.value;
  // 防止文字選取和頁面滾動
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
  document.body.style.touchAction = "none"; // 防止觸控滾動
}
// 左右區塊:拖曳過程
//   拖曳過程:滑鼠
function onLRMouseMove(event: MouseEvent): void {
  if (!isResizing.value || !resizeType.value) return;
  event.preventDefault();
  handleLRMoveResize(event.clientX);
}
//   拖曳過程:觸控
function onLRTouchMove(event: TouchEvent): void {
  if (!isResizing.value || !resizeType.value) return;
  event.preventDefault(); // 防止頁面滾動
  handleLRMoveResize(event.touches[0].clientX);
}
// 左右區塊:統一的調整大小邏輯 (滑鼠與觸控共用)
function handleLRMoveResize (clientX: number): void {
  const distanceX = clientX - startX.value; // 計算移動的距離
  // const minWidth = window.innerWidth / 4; // 最小寬度
  const minWidth = (window.innerWidth > 450) ? minRightWidth.value : mobileMinRightWidth.value; // 最小寬度
  const maxWidth = window.innerWidth / 2; // 最大寬度

  if (resizeType.value === "left") {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.value + distanceX));
    leftWidth.value = newWidth;
  } else {
    // right 區塊
    // 網頁第一次載入時可能會抓不到 DOM 元素,所以要加判斷
    if (startWidth.value) {
      // 第n次抓到 DOM 時才進行寬度計算
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.value - distanceX));
      rightWidth.value = newWidth;
    } else {
      // 第一次抓不到 DOM 時就直接用目前的寬度
      startWidth.value = rightWidth.value;
    }
  }

  // 調整主場景控制小介面位置
  ctrlRightGap.value = rightWidth.value + 10;
}

// 左右區塊:結束拖曳
//   拖曳結束:滑鼠
function onLRMouseUp(): void {
  handleLREndResize();
  // 移除滑鼠事件監聽
  document.removeEventListener("mousemove", onLRMouseMove);
  document.removeEventListener("mouseup", onLRMouseUp);
};
//   拖曳結束:觸控
function onLRTouchEnd(): void {
  handleLREndResize();
  // 移除觸控事件監聽
  document.removeEventListener("touchmove", onLRTouchMove);
  document.removeEventListener("touchend", onLRTouchEnd);
};
// 左右區塊:統一的結束拖曳調整大小邏輯 (滑鼠與觸控共用)
function handleLREndResize(): void {
  isResizing.value = false;
  resizeType.value = null;

  // 恢復樣式
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  document.body.style.touchAction = "";

  resizeStage();
};
// 右邊區塊檢查尺寸
function checkRightSize (callback: (() => void) | null = null): void {
  // const minWidth = window.innerWidth / 4; // 最小寬度
  const minWidth = (window.innerWidth > 450) ? minRightWidth.value : mobileMinRightWidth.value; // 最小寬度
  const maxWidth = window.innerWidth / 2; // 最大寬度
  rightWidth.value  = Math.max(minWidth, Math.min(maxWidth, rightWidth.value));

  // 中間區塊可視尺寸
  nextTick(() => {
    centerViewWidth.value = centerBox.value!.clientWidth;
    centerViewHeight.value = centerBox.value!.clientHeight;
  });

  // 調整主場景控制小介面位置
  ctrlRightGap.value = rightWidth.value + 10;

  if (callback) {
    callback();
  }
}

// ● 畫布內容 block 區塊相關
const { aiViewerBlocks, panToTarget } = storeToRefs(aiviewerStore); // 使用者使用的區塊
const {
  nowChoiceAiViewerId,
  isMultiChoiceAiViewerMode,
  nowMultiChoiceAiViewerIds,
  userInputModal,
} = storeToRefs(aiviewerStore);
const { copyAiViewerBlock, isStopCopyPasteAiViewerBlock } = storeToRefs(aiviewerStore);
const { fullAiViewerBlockId } = storeToRefs(aiviewerStore); // 單一小區塊進入放大滿版
const { calcNextZindex, deleteBlock } = aiviewerStore;

// 新增 report block 後自動 pan 到該位置
watch(panToTarget, (target) => {
  if (!target || !mainStage.value) return;
  const scale = mainStage.value.scaleX();
  const newX = 20 - target.x * scale;
  const newY = 20 - target.y * scale;
  setMainStagePosition(newX, newY);
  panToTarget.value = null;
});

// 處理多選模式 (不跟單選的 choiceAiViewerContentBox 一起處理是因為套件回呼會觸發多次)
function checkMultiChoiceMode(itemId: string): void {
  if (isMultiChoiceAiViewerMode.value) {
    // 如果不在多選清單中就加入
    if (!nowMultiChoiceAiViewerIds.value.includes(itemId)) {
      nowMultiChoiceAiViewerIds.value.push(itemId);
    } else {
      // 如果已經在多選清單中就要移除
      const index = nowMultiChoiceAiViewerIds.value.indexOf(itemId);
      if (index > -1) {
        nowMultiChoiceAiViewerIds.value.splice(index, 1);
      }
    }
  }
}

// 選中一個 AiViewerContentBox 的回呼
function choiceAiViewerContentBox(item: any, itemId: string): void {
  // 已經是選中狀態就不處理 (因為套件回多次觸發回呼)
  if (nowChoiceAiViewerId.value === itemId) {
    return;
  }
  nowChoiceAiViewerId.value = itemId;
  item.z = calcNextZindex();
}
let aiViewerContentBoxTimer = null as any; // AiViewerContentBox 回呼的防抖動計時器
// 改變一個 AiViewerContentBox 的尺寸或座標時的回呼
function resizeAiViewerContentBox(
  blockUiInfo: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    syncBackend?: boolean;
  } | null,
): void {
  console.log("resizeAiViewerContentBox 被呼叫了～～", blockUiInfo);
  if (blockUiInfo) {
    // TODO... callAjax or websocket 傳給後端記錄
    if (blockUiInfo.syncBackend) {
      const newValue = {
        id: blockUiInfo.id,
        x: blockUiInfo.x,
        y: blockUiInfo.y,
        width: blockUiInfo.width,
        height: blockUiInfo.height,
      };
      console.log("要同步後端資料囉～～");
      console.log("blockUiInfo.syncBackend", blockUiInfo.syncBackend);
      console.log("計算後的資料:: ", newValue);
      console.log("--------------");
    }

    // 以下為前端UI呈現,應該不用改變邏輯
    // 更新 aiViewerBlocks 中的資料
    aiViewerBlocks.value.some((item: any) => {
      if (item.id === blockUiInfo.id) {
        item.x = blockUiInfo.x;
        item.y = blockUiInfo.y;
        item.width = blockUiInfo.width;
        item.height = blockUiInfo.height;
        return true; // 找到並處理完後就停止迭代
      }
      return false;
    });
  }
}
// 移除一個 AiViewerContentBox 的回呼
function removeAiViewerContentBox(itemId: string): void {
  if (itemId) {
    // 提醒: 使用防抖機制是因為拖曳套件也會觸發呼叫 resizeAiViewerContentBox 的關係
    if (aiViewerContentBoxTimer) {
      clearTimeout(aiViewerContentBoxTimer);
      aiViewerContentBoxTimer = null;
    }
    aiViewerContentBoxTimer = setTimeout(() => {
      deleteBlock(itemId);
      clearTimeout(aiViewerContentBoxTimer);
      aiViewerContentBoxTimer = null;
    }, 200);
  }
}

// ● 主場景(畫布)相關
// konva.js 元素初始化
function initMainStage(callback: (() => void) | null = null): void {
  // 主場景物件
  mainStage.value = new Konva.Stage({
    name: "mainStage",
    container: "mainStage", // id
    width: centerViewWidth.value,
    height: centerViewHeight.value,
    //draggable: (isTouchDevice.value)? true : false, // 主場景不要用拖曳的,因為以後不知道會不會有其他內部東西要拖曳
    // draggable: true,
    draggable:
      !isTouchDevice.value || (isTouchDevice.value && !isMultiChoiceAiViewerMode.value)
        ? true
        : false,
  });
  // 背景方形物件 (方便debug用,方便看stage是否有觸發縮放與移動)  // TODO... 視情況移除, 但是如果要移除的話也要把 gridRectResize() 這個函式也移除
  // const GridRect = new Konva.Rect({
  //   name: 'GridRect',
  //   x: 0,
  //   y: 0,
  //   width: centerViewWidth.value,
  //   height: centerViewHeight.value,
  //   // fill: 'transparent',
  //   // fill: 'rgba(255, 0, 0, 0.2)', // 開發測試用
  //   // stroke: 'red',  // 邊框色  // 開發測試用
  //   // strokeWidth: 1,   // 邊框寬度  // 開發測試用
  //   fillAfterStrokeEnabled: true, // 內邊框
  // });
  // 選取框呈現用的方形物件
  const selectionRect = new Konva.Rect({
    name: "selectionRect",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: "rgba(0, 161, 255, 0.15)",
    stroke: "rgba(0, 161, 255, 0.5)",
    strokeWidth: 1,
    dash: [5, 5],
    visible: false,
  });
  // 背景主圖層
  const GridLayer = new Konva.Layer({
    name: "GridLayer",
  });
  // GridLayer.add(GridRect)
  GridLayer.add(selectionRect);
  mainStage.value.add(GridLayer);

  window.debug.mainStage = mainStage.value;

  if (callback) {
    callback();
  }
}

// 主場景:事件綁定
const debug_startPinchDistance: any = ref(null); // 紀錄兩指 touch 距離 debug 用
const mainStageStartPosition: any = ref(null); // 紀錄主場景開始縮放 or 繪製選取框 時的座標用
// 紀錄 touch start 開始時的指頭數量與兩指 touch 距離用
const startPinchDistance: any = ref({
  finger: 0, // 手指頭數量
  distance: 0, // 兩指 touch 距離
  position: {
    x: 0, // 紀錄開始 touch 時的 Y 座標 (有轉換為主場景內部座標)
    y: 0, // 紀錄開始 touch 時的 Y 座標 (有轉換為主場景內部座標)
    startX: 0, // 紀錄開始 touch 時的 X 座標 (瀏覽器座標)
    startY: 0, // 紀錄開始 touch 時的 Y 座標 (瀏覽器座標)
    endX: 0, // 紀錄結束 touch 時的 X 座標 (瀏覽器座標)
    endY: 0, // 紀錄結束 touch 時的 Y 座標 (瀏覽器座標)
  },
});
// 紀錄 滑鼠 start 開始時的座標用 (繪製選取框)
const startMousePosition: any = ref({
  x: 0, // 紀錄開始 touch 時的 X 座標 (有轉換為主場景內部座標)
  y: 0, // 紀錄開始 touch 時的 Y 座標 (有轉換為主場景內部座標)
  startX: 0, // 紀錄開始 touch 時的 X 座標 (瀏覽器座標)
  startY: 0, // 紀錄開始 touch 時的 Y 座標 (瀏覽器座標)
  endX: 0, // 紀錄結束 touch 時的 X 座標 (瀏覽器座標)
  endY: 0, // 紀錄結束 touch 時的 Y 座標 (瀏覽器座標)
});
function addMainStageEvents(): void {
  // 縮放函數 (桌機與手機平板共用)
  const stageHandleZoom = (e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    // console.log('stageHandleZoom e.evt.deltaY', e.evt.deltaY);

    // 限制只能在舞台上觸發縮放
    // if (e.target.name() !== mainStage.value.name()) {
    //   return;
    // }
    // console.log('e.target.name() >>>> ', e.target.name());

    const scaleBy = isTouchDevice.value ? 1.015 : 1.04; // 每次縮放的比例
    // console.log('scaleBy...', scaleBy);
    const oldScale = mainStage.value.scaleX();
    const pointer = mainStage.value.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - mainStage.value.x()) / oldScale,
      y: (pointer.y - mainStage.value.y()) / oldScale,
    };

    // 新的縮放比例
    let newScale = 0;
    if (e.evt.deltaY && startPinchDistance.value.finger === 0) {
      // 滑鼠滾輪事件
      // 滾輪向上滾動時放大，向下滾動時縮小
      newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    }
    if (!e.evt.deltaY && startPinchDistance.value.finger === 2) {
      // 雙指觸控縮放
      const [touch1, touch2] = e.evt.touches;
      const newDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
      // 新的
      newScale =
        newDistance > startPinchDistance.value.distance ? oldScale * scaleBy : oldScale / scaleBy;
    }

    // 設置縮放限制
    const minScale = centerMinScale;
    const maxScale = centerMaxScale;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

    mainStage.value.scale({ x: clampedScale, y: clampedScale });

    centerContentScale.value = clampedScale;

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    mainStage.value.position(newPos);
    mainStage.value.batchDraw();

    centerContentX.value = newPos.x;
    centerContentY.value = newPos.y;

    // gridRectResize();
  };

  // 移動函數 (桌機滑鼠滾輪 or macbook觸控板移動)
  const stageHandleMovie = (e: any) => {
    // 移動主場景位置
    mainStage.value.x(mainStage.value.x() - e.evt.deltaX);
    mainStage.value.y(mainStage.value.y() - e.evt.deltaY);
    centerContentX.value = mainStage.value.x();
    centerContentY.value = mainStage.value.y();

    // gridRectResize();
  };

  // 開始繪製圈選框函式 mousedown, touchstart (桌機與手機平板共用)
  const startHandleMultiChoiceRect = (target: any, useStartModel: any) => {
    mainStage.value.draggable(false); // 停止主場景拖曳
    const selectionRect = mainStage.value.findOne(".selectionRect") as Konva.Rect;

    // 紀錄起始點 (相對於瀏覽器的座標)
    useStartModel.startX = target.clientX;
    useStartModel.startY = target.clientY;

    // 轉換當前滑鼠座標到 stage 內容座標系統
    // 獲取 stage 容器在瀏覽器中的位置, 避免以後主場景起始位置不在瀏覽器的左上角
    const stageRect = mainStage.value.container().getBoundingClientRect();
    const containerX = target.clientX - stageRect.left;
    const containerY = target.clientY - stageRect.top;
    const contentX = (containerX - mainStage.value.x()) / mainStage.value.scaleX();
    const contentY = (containerY - mainStage.value.y()) / mainStage.value.scaleY();

    // 設定 konvajs 選取框
    selectionRect.x(contentX);
    selectionRect.y(contentY);
    selectionRect.width(0);
    selectionRect.height(0);
    useStartModel.x = contentX; // 注意這是紀錄轉換後的座標值
    useStartModel.y = contentY; // 注意這是紀錄轉換後的座標值

    selectionRect.visible(true);
  };

  // 移動繪製圈選框函式 mousemove. touchmove (桌機與手機平板共用)
  const moveHandleMultiChoiceRect = (target: any, useStartModel: any) => {
    // 紀錄滑鼠結束的位置 (相對於瀏覽器的座標)
    useStartModel.endX = target.clientX;
    useStartModel.endY = target.clientY;

    // 繪圖選取框
    const layer = mainStage.value.findOne(".GridLayer") as Konva.Layer;
    const selectionRect = mainStage.value.findOne(".selectionRect") as Konva.Rect;

    // 獲取起始點 (在 mousedown 時設定的固定起點)
    const startX = useStartModel.x; // 注意這是轉換為 stage 內容座標後的座標值
    const startY = useStartModel.y; // 注意這是轉換為 stage 內容座標後的座標值

    // 轉換當前指頭觸控座標到 stage 內容座標系統
    // 獲取 stage 容器在瀏覽器中的位置, 避免以後主場景起始位置不在瀏覽器的左上角
    const stageRect = mainStage.value.container().getBoundingClientRect();
    const containerX = target.clientX - stageRect.left;
    const containerY = target.clientY - stageRect.top;
    const currentContentX = (containerX - mainStage.value.x()) / mainStage.value.scaleX();
    const currentContentY = (containerY - mainStage.value.y()) / mainStage.value.scaleY();

    // 計算相對於起始點的寬高(可能為負)
    const width = currentContentX - startX;
    const height = currentContentY - startY;

    // 根據寬高正負決定矩形的實際位置和尺寸
    const rectX = width >= 0 ? startX : currentContentX;
    const rectY = height >= 0 ? startY : currentContentY;
    const rectWidth = Math.abs(width);
    const rectHeight = Math.abs(height);

    // 更新 konvajs 選取框
    selectionRect.x(rectX);
    selectionRect.y(rectY);
    selectionRect.width(rectWidth);
    selectionRect.height(rectHeight);

    layer.batchDraw();
  };

  // 結束繪製圈選框函式 mouseup, touchend (桌機與手機平板共用)
  const endHandleMultiChoiceRect = (useStartModel: any) => {
    // 計算從 mousedown, mousemove or touchstart, touchmove 事件擷取到的 原始座標資訊, 在主場景內容中的實際位置與尺寸
    let rectX =
      useStartModel.startX < useStartModel.endX ? useStartModel.startX : useStartModel.endX;
    rectX = rectX / centerContentScale.value - centerContentX.value;

    let rectY =
      useStartModel.startY < useStartModel.endY ? useStartModel.startY : useStartModel.endY;
    rectY = rectY / centerContentScale.value - centerContentY.value;

    let rectWidth = useStartModel.endX - useStartModel.startX;
    rectWidth = Math.abs(rectWidth / centerContentScale.value);

    let rectHeight = useStartModel.endY - useStartModel.startY;
    rectHeight = Math.abs(rectHeight / centerContentScale.value);

    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;

    // 檢查哪些區塊被選中
    aiViewerBlocks.value.forEach((item: any) => {
      // 獲取區塊的邊界
      const itemX = item.x;
      const itemY = item.y;
      const itemRight = itemX + item.width;
      const itemBottom = itemY + item.height;

      // AABB 碰撞檢測
      const isOverlapping = !(
        rectRight < itemX || // 選取框在區塊左邊
        rectX > itemRight || // 選取框在區塊右邊
        rectBottom < itemY || // 選取框在區塊上面
        rectY > itemBottom // 選取框在區塊下面
      );

      // 是否已經被選中
      const isSelected = nowMultiChoiceAiViewerIds.value.includes(item.id);

      // 有重疊且未被選中才加入多選清單
      if (isOverlapping && !isSelected) {
        // 選中該區塊
        checkMultiChoiceMode(item.id);
      }
    });
  };

  // 桌機點擊主場景空白處取消選中內容區塊
  mainStage.value.on("mousedown", (e: any) => {
    debugCount.value = 0; // 偷偷藏了方便 debug 用的計數器歸零

    nowChoiceAiViewerId.value = "";
    startMousePosition.value = { x: 0, y: 0, startX: 0, startY: 0, endX: 0, endY: 0 };
    // 進入繪圖圈選狀態
    if (isMultiChoiceAiViewerMode.value) {
      const target = e.evt;
      startHandleMultiChoiceRect(target, startMousePosition.value);
    }
  });

  // 桌機滑鼠滾輪 or macbook觸控板縮放或滾動
  mainStage.value.on("wheel", (e: any) => {
    // 判斷是 滾輪 還是 macbook 觸控板縮放
    const detection = detectInputDevice(e.evt);
    // console.log('detection...', detection);
    if (detection.action === "scroll") {
      // 滑鼠的滾動
      stageHandleMovie(e);
    } else {
      // 滑鼠, macbook觸控板的 whell 縮放
      // 提醒這段停止事件反升的部分是為了避免瀏覽器預設的縮放行為干擾
      e.evt.preventDefault();
      e.cancelBubble = true;
      stageHandleZoom(e);
    }
  });

  // 拖曳移動主場景 (桌機與手機平板共用)
  mainStage.value.on("dragmove", (e: any) => {
    e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
    e.cancelBubble = true; // 阻止事件傳播到父容器 (跟js一樣)

    // 手機或平板 處理縮放
    if (e.evt.type === "touchmove" && startPinchDistance.value.finger === 2) {
      if (e.evt.touches.length === 2) {
        // debug_startPinchDistance.value.step2 = '雙指觸控縮放';
        stageHandleZoom(e);
        return;
      }
    }

    // 手機或平板 處理拖曳移動主場景
    if (e.evt.type === "touchmove" && startPinchDistance.value.finger === 1) {
      if (!isMultiChoiceAiViewerMode.value) {
        centerContentX.value = mainStage.value.x();
        centerContentY.value = mainStage.value.y();
        return;
      }
    }

    // 桌機 處理拖曳移動主場景
    if (e.evt.type === "mousemove") {
      centerContentX.value = mainStage.value.x();
      centerContentY.value = mainStage.value.y();
      return;
    }

    // gridRectResize();
  });

  // 滑鼠移動
  mainStage.value.on("mousemove", (e: any) => {
    // 注意: 這邊不處理拖曳跟縮放,拖曳跟縮放在 dragmove 事件處理, 這邊只處理 mousemove 的繪圖圈選功能
    e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
    e.cancelBubble = true; // 阻止事件傳播到父容器 (跟js一樣)

    // 在繪圖圈選狀態才要處理
    if (isMultiChoiceAiViewerMode.value) {
      const target = e.evt;
      moveHandleMultiChoiceRect(target, startMousePosition.value);
    }
  });

  // 滑鼠放開
  mainStage.value.on("mouseup", (e: any) => {
    e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
    e.cancelBubble = true; // 阻止事件傳播

    // 如果正在繪製選取框
    if (isMultiChoiceAiViewerMode.value) {
      // 有移動過才處理
      if (startMousePosition.value.endX !== 0 && startMousePosition.value.endY !== 0) {
        // 處理碰撞
        endHandleMultiChoiceRect(startMousePosition.value);
      }
      // 隱藏繪圖選取框
      const selectionRect = mainStage.value.findOne(".selectionRect") as Konva.Rect;
      selectionRect.visible(false);
      // 恢復成預設值
      startMousePosition.value = { x: 0, y: 0, startX: 0, startY: 0, endX: 0, endY: 0 };
    }
  });

  // 手機或平板的事件註冊
  if (isTouchDevice.value) {
    // 觸控開始
    mainStage.value.on("touchstart", (e: any) => {
      debugCount.value = 0; // 偷偷藏了方便 debug 用的計數器歸零

      e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
      e.cancelBubble = true; // 阻止事件傳播到父容器 (跟js一樣)
      nowChoiceAiViewerId.value = "";

      // 記錄主場景當下的座標
      mainStageStartPosition.value = {
        x: mainStage.value.x(),
        y: mainStage.value.y(),
      };

      if (e.evt.touches.length === 1) {
        // 單指觸控
        startPinchDistance.value.finger = 1;
        startPinchDistance.value.distance = 0;
        startPinchDistance.value.position = { x: 0, y: 0, startX: 0, startY: 0, endX: 0, endY: 0 };
        // 進入繪圖圈選狀態
        if (isMultiChoiceAiViewerMode.value) {
          mainStage.value.draggable(false); // 停止主場景拖曳
          const target = e.evt.touches[0];
          startHandleMultiChoiceRect(target, startPinchDistance.value.position);
        } else {
          mainStage.value.draggable(true);
        }
      } else if (e.evt.touches.length === 2) {
        // 雙指觸控
        const [touch1, touch2] = e.evt.touches;
        // 記錄計算兩指距離 (初始的距離)
        startPinchDistance.value.finger = 2;
        startPinchDistance.value.distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
      }
    });

    // 觸控移動
    mainStage.value.on("touchmove", (e: any) => {
      // 注意: 這邊不處理拖曳跟縮放,拖曳跟縮放在 dragmove 事件處理, 這邊只處理 touch 的繪圖圈選功能
      e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
      e.cancelBubble = true; // 阻止事件傳播到父容器 (跟js一樣)

      // 在繪圖圈選狀態才要處理
      if (isMultiChoiceAiViewerMode.value) {
        const target = e.evt.touches[0];
        moveHandleMultiChoiceRect(target, startPinchDistance.value.position);
      }
    });

    // 觸控結束
    mainStage.value.on("touchend", (e: any) => {
      e.evt.preventDefault(); // 阻止瀏覽器默認行為 (跟js一樣)
      e.cancelBubble = true; // 阻止事件傳播到父容器 (跟js一樣)

      if (startPinchDistance.value.finger === 1) {
        // 如果正在繪製選取框
        if (isMultiChoiceAiViewerMode.value) {
          // 有移動過才處理
          if (
            startPinchDistance.value.position.endX !== 0 &&
            startPinchDistance.value.position.endY !== 0
          ) {
            // 處理碰撞
            endHandleMultiChoiceRect(startPinchDistance.value.position);
          }
          // 隱藏繪圖選取框
          const selectionRect = mainStage.value.findOne(".selectionRect") as Konva.Rect;
          selectionRect.visible(false);
          // 恢復成預設值
          mainStageStartPosition.value = null;
          startPinchDistance.value.finger = 0;
          startPinchDistance.value.distance = 0;
          startPinchDistance.value.position = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
          };
          debug_startPinchDistance.value = null;
        }
      }
    });
  }

  // 禁止主場景的右鍵選單 (桌機與手機平板共用)
  mainStage.value.on('contextmenu', (e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
  });
}

// 主場景:背景方形形狀的調整尺寸  TODO... 視情況移除
// function gridRectResize() {
//   return
//   const GridRect = mainStage.value.find('.GridRect')[0];

//   // 強制讓 GridRect 比例在 1
//   const scale = mainStage.value.scaleX();
//   GridRect.scale({ x: 1 / scale, y: 1 / scale });

//   // 強制讓 GridRect 座標在 0,0
//   const gapX = mainStage.value.x();
//   const gapY = mainStage.value.y();
//   GridRect.position({ x: -gapX / scale, y: -gapY / scale });
// }

const { isFocusUserInput, isAspectRatioMode } = storeToRefs(aiviewerStore); // 是否焦點在使用者輸入框
const { pasteBlock } = aiviewerStore; // 貼上複製內容區塊方法
// 全域層級的鍵盤事件
async function onKeybordDownEvent(event: KeyboardEvent): Promise<void> {
  const key = event.key;
  const isCtrlOrCmd = event.ctrlKey || event.metaKey; // 是否按下 ctrl 鍵與 command 鍵
  const isCtrl = event.ctrlKey; // 是否按下 ctrl 鍵
  const isCmd = event.metaKey; // 是否按下 command 鍵
  const isShift = event.shiftKey; // 是否按下 Shift 鍵
  isAspectRatioMode.value = isTouchDevice.value ? false : isShift; // 是否等比例縮放模式 (觸控類的裝置強制為false)

 console.log("onKeybordDownEvent >>> ", key);

  // ● 鍵盤快速鍵處理
  // 按下 Backspace 鍵
  // TODO... 先不提供快速刪除,因為還不知道會衍生出哪些問題,例如便調整中的輸入介面,按下刪除鍵會有問題等等的衝突,
  //         不是不能做只是現在做會太花時間.
  // if (key === 'Backspace' || key === 'Delete') {
  //   // 如果焦點在使用者輸入框就不處理刪除動作
  //   if (isFocusUserInput.value) {
  //     return;
  //   }
  //   if (nowChoiceAiViewerId.value) {
  //     removeAiViewerContentBox(nowChoiceAiViewerId.value);
  //     nowChoiceAiViewerId.value = ''; // 取消選中內容區塊
  //   }
  // }

  // 按下 Esc 鍵
  if (event.key === "Escape") {
    nowChoiceAiViewerId.value = ""; // 取消選中內容區塊
    nowMultiChoiceAiViewerIds.value = []; // 取消多選清單
  }

  // 按下 Command + Shift 鍵 進入多選模式
  if (isCmd && isShift) {
    isMultiChoiceAiViewerMode.value = true;
    (document.activeElement as HTMLElement | null)?.blur(); // 強制滑鼠 blur
  } else {
    isMultiChoiceAiViewerMode.value = false;
  }

  // 按下 Ctrl + '+' 鍵 或 Command + '+' 鍵 縮放放大
  if (isCtrlOrCmd && (key === "+" || key === "=")) {
    event.preventDefault();
    event.stopPropagation();
    changeMainScalc(0.2);
  }
  // 按下 Ctrl + '-' 鍵 或 Command + '-' 鍵 縮放縮小
  if (isCtrlOrCmd && key === "-") {
    event.preventDefault();
    event.stopPropagation();
    changeMainScalc(-0.2);
  }
  // 按下 Ctrl + '0' 鍵 或 Command + '0'
  if (isCtrlOrCmd && key === "0") {
    // event.preventDefault();
    // event.stopPropagation();
    resetMainScalc();
    // resetMainPosition();
  }

  // 按下 Ctrl + '\' 鍵 或 Command + '\' 鍵 右邊區塊開合切換
  if (isCtrlOrCmd && key === "\\") {
    isShowRightFrame.value = !isShowRightFrame.value;
    nextTick(() => {
      checkRightSize(handleLREndResize);
    });
  }

  // 按下 shift + C 評論list區塊開合切換
  if (isShift && key.toLowerCase() === "c") {
    isShowCommentListView.value = !isShowCommentListView.value;
    isShowBlockListView.value = false;
    isShowFileListView.value = false;
  }
  // 按下 shift + I 畫布內容list區塊開合切換
  if (isShift && key.toLowerCase() === "i") {
    isShowCommentListView.value = false;
    isShowBlockListView.value = !isShowBlockListView.value;
    isShowFileListView.value = false;
  }
  // 按下 shift + F 專案檔案清單list區塊開合切換
  if (isShift && key.toLowerCase() === "f") {
    isShowBlockListView.value = false;
    isShowCommentListView.value = false;
    isShowFileListView.value = !isShowFileListView.value;
  }
  // 按下 shift + C or I or F 之後強制滑鼠 blur 避免鍵盤事件衝突,並且檢查右邊區塊尺寸變化
  if (isShift && key.toLowerCase() === "c" || key.toLowerCase() === "i" || key.toLowerCase() === "f") {
    (document.activeElement as HTMLElement | null)?.blur(); // 強制滑鼠 blur
    nextTick(() => {
      checkRightSize(handleLREndResize);
    });
  }


  // 檢查當前複製的內容區塊與系統剪貼簿內容是否相符 true: 相符, false: 不符
  async function checkCopyBlockValidity() {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      return false;
    }
    // 是否可以被解析成 json
    let isJson = true;
    try {
      JSON.parse(clipboardText);
    } catch {
      isJson = false;
    }
    if (!isJson) {
      return false;
    }
    if (copyAiViewerBlock.value && copyAiViewerBlock.value.id !== JSON.parse(clipboardText).id) {
      return false;
    }
    return true;
  }
  // 按下 Ctrl + 'c' 鍵 或 Command + 'c' 鍵 複製內容區塊
  if (isCtrlOrCmd && key.toLowerCase() === "c" && !isStopCopyPasteAiViewerBlock.value) {
    let findBlock = aiViewerBlocks.value.find((item: any) => item.id === nowChoiceAiViewerId.value);
    if (findBlock) {
      findBlock = JSON.parse(JSON.stringify(findBlock)); // 深拷貝
      // 暫存到複製區塊變數中
      copyAiViewerBlock.value = findBlock;
      // 這邊另外將複製的json資料放到系統剪貼簿中 (讓 Ctrl + 'v' 用來跟 copyAiViewerBlock 比對用)
      const temp = JSON.stringify(findBlock);
      await navigator.clipboard.writeText(temp);
      nowChoiceAiViewerId.value = ""; // 取消選中內容區塊
    }
    console.log("剪貼簿資料....", await navigator.clipboard.readText());

    // 當前複製的內容區塊與系統剪貼簿內容不符時，清空複製區塊變數
    if ((await checkCopyBlockValidity()) === false) {
      copyAiViewerBlock.value = null;
    }
  }
  // 按下 Ctrl + 'v' 鍵 或 Command + 'v' 鍵 貼上內容區塊
  if (isCtrlOrCmd && key.toLowerCase() === "v" && !isStopCopyPasteAiViewerBlock.value) {
    // 檢查當前複製的內容區塊與系統剪貼簿內容是否相符
    if ((await checkCopyBlockValidity()) === false) {
      copyAiViewerBlock.value = null; // 不符時清空複製區塊變數
    } else {
      // 如果焦點在使用者輸入框就不處理貼上動作
      if (isFocusUserInput.value) {
        return;
      }

      // 貼上複製的內容區塊
      const temp = JSON.parse(JSON.stringify(copyAiViewerBlock.value));
      temp.x += 20;
      temp.y += 20;
      const newBlock = pasteBlock(temp);
      nowChoiceAiViewerId.value = ""; // TODO... 貼上後是否要自動選中貼上的區塊? 目前先不選中因為還會有後端服務的問題要處理.

      // 更新系統剪貼簿內容 (避免重複貼上同一個區塊時會有問題)
      navigator.clipboard.writeText(JSON.stringify(newBlock));
      // 更新複製區塊變數
      copyAiViewerBlock.value = JSON.parse(JSON.stringify(newBlock));
    }
  }
}
// 全域層級的鍵盤事件
function onKeybordUpEvent(event: KeyboardEvent): void {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey; // 是否按下 ctrl 鍵或 command 鍵
  const isCtrl = event.ctrlKey; // 是否按下 ctrl 鍵
  const isCmd = event.metaKey; // 是否按下 command 鍵
  const isShift = event.shiftKey; // 是否按下 Shift 鍵
  isAspectRatioMode.value = isTouchDevice.value ? false : isShift; // 是否等比例縮放模式 (觸控類的裝置強制為false)

  // 放開 Command or Shift 鍵 離開多選模式
  if (!isCmd || !isShift) {
    // 停止多選模式
    isMultiChoiceAiViewerMode.value = false;
    mainStage.value.draggable(true);
    const selectionRect = mainStage.value.findOne(".selectionRect") as Konva.Rect;
    selectionRect.visible(false);
  }
}

// window 層級的 resize 事件
function resizeStage(): void {
  // window.kk = centerBox.value;
  // 中間區塊可視尺寸
  centerViewWidth.value = centerBox.value!.clientWidth;
  centerViewHeight.value = centerBox.value!.clientHeight;
  // if (centerViewWidth.value === 0) {
  //   centerViewWidth.value = centerBox.value!.clientWidth;
  // }

  // 主場景
  if (mainStage.value) {
    // 更新主場景尺寸
    mainStage.value.width(centerViewWidth.value);
    mainStage.value.height(centerViewHeight.value);

    // 更新主場景的方形
    // const GridRect = mainStage.value.find('.GridRect')[0];
    // GridRect.width(containerWidth);
    // GridRect.height(containerHeight);
  }

  // 處理右邊區塊的寬度
  if (isShowRightFrame.value) {
    checkRightSize();
  }

  // 處理專案功能小介面
  calcProjectFnBoxStyle();
}

onMounted(async() => {
  // body 加上 style 以防止滾動條出現
  document.body.style.overflow = "hidden";

  // 中間區塊可視尺寸
  centerViewWidth.value = centerBox.value!.clientWidth;
  centerViewHeight.value = centerBox.value!.clientHeight;

  initMainStage(() => {
    addMainStageEvents();
    resizeStage();
    calcProjectFnBoxStyle();
  });

  window.addEventListener("resize", resizeStage);
  window.addEventListener("keydown", onKeybordDownEvent);
  window.addEventListener("keyup", onKeybordUpEvent);
});

onUnmounted(() => {
  // 移除 body 的 style
  document.body.style.overflow = "";
  if (jcdHoverTimer) { clearTimeout(jcdHoverTimer); jcdHoverTimer = null; }
  clearJourneyBlockHighlight();
  // 清理滑鼠事件監聽器
  document.removeEventListener("mousemove", onLRMouseMove);
  document.removeEventListener("mouseup", onLRMouseUp);

  // 清理觸控事件監聽器
  document.removeEventListener("touchmove", onLRTouchMove);
  document.removeEventListener("touchend", onLRTouchEnd);

  window.removeEventListener("resize", resizeStage);
  window.removeEventListener("keydown", onKeybordDownEvent);
  window.removeEventListener("keydown", onKeybordUpEvent);

  resetAiViewerState();
});


// 專案主功能小介面 DOM 元素
const projectFnBox = ref<HTMLElement | null>(null);
const projectFnBoxStyle = ref<any>({});
const calcProjectFnBoxTimer: any = ref(null);
// 使用 watch 監聽兩個變數, 讓專案功能按鈕區塊置中顯示
watch([centerViewWidth, () => nowMultiChoiceAiViewerIds.value.length],(newVal, oldVal) => {
  // 針對 nowMultiChoiceAiViewerIds 先清空樣式避免在瀏覽器很小的情況下,取 projectFnBoxWidth 還是開到大的值導致計算錯誤
  if (newVal[1] !== oldVal[1] && projectFnBoxStyle.value.width) {
    projectFnBoxStyle.value.width = null;
  }
  calcProjectFnBoxStyle();
}, { deep: true });
function calcProjectFnBoxStyle(): void {
  if (calcProjectFnBoxTimer.value) {
    clearTimeout(calcProjectFnBoxTimer.value);
  }
  // 延遲確保畫面按鈕已穩定下來,也避免頻繁計算的效能問題
  calcProjectFnBoxTimer.value = setTimeout(() => {
    const projectFnBoxWidth = projectFnBox.value ? projectFnBox.value.offsetWidth : 100;
    let re: any = {
      left: `${centerViewWidth.value / 2 - projectFnBoxWidth / 2}px`,
      "z-index": 4,
    };

    // 如果寬度大於 centerViewWidth, 就使用 centerViewWidth, 30 是彈性空間
    if (projectFnBoxWidth + 30 > centerViewWidth.value) {
      re.width = `${centerViewWidth.value - 20}px`; // 預留左右各10px的間距
      re.left = `10px`;
    }

    projectFnBoxStyle.value = re;
  }, 600);
}


// degub 相關
const console = window.console; // 方便在 template 使用 console.log
const { lookDebug, touchDebug, debugCount } = storeToRefs(aiviewerStore);
function copyDebugInfo(): void {
  const debugInfoText = document.getElementById("debugInfo")?.innerText || "";
  // navigator.clipboard.writeText(debugInfoText); // 這個方法在 http 環境下會有權限問題
  const textarea = document.createElement("textarea");
  textarea.value = debugInfoText;
  textarea.style.position = "fixed"; // 避免跳動
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    alert("已複製");
  } catch {
    alert("複製失敗，請手動複製");
  }
}
onMounted(() => {
  const urlParams = router.currentRoute.value.query;
  if (urlParams.debug === "true") {
    lookDebug.value = true;
    debugCount.value = 0;
  }
});
</script>
