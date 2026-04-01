<template>
  <div class="AiViewerRightBox" :style="{ width: props.rightWidth + 'px' }"
    @click="nowChoiceAiViewerId = ''"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">

    <!-- 對話標題大區域 -->
    <div class="AiAgentHeaderArea">
      <div class="chat-header-box">
        <div class="project-name" v-tooltip.bottom="currentConversationTitle"
          ref="projectNameDropDown"
          @mouseleave="debugCount = 0;"
          @click="() => {
            isShowMoreChatOptionsBox = true;
            calcMoreChatOptionsBoxStyle();

            // 注意:偷偷藏了方便除錯用的點擊次數事件
            debugCount = debugCount + 1;
            if (debugCount >= 10) {
              lookDebug = true;
              debugCount = 0;
            }
          }">
          {{ currentConversationTitle }}
          <i class="material-symbols-outlined fs-17">keyboard_arrow_down</i>
        </div>
        <i class="material-symbols-outlined ctrl-btn" v-tooltip="'搜尋發話'"
          @click="isOpenSearchUserDialogueBox = true">search</i>
      </div>

      <!-- 更多對話功能小介面 -->
      <div :class="['more-chat-options-box next-option-box', {'show': isShowMoreChatOptionsBox}]"
        ref="moreChatOptionsBox"
        :style="moreChatOptionsBoxStyle">
        <div class="option-item"
          @click="isShowFileListView = true; isShowMoreChatOptionsBox = false;">專案檔案清單</div>
        <div class="option-item"
          @click="isOpenConversationListModal = true; isShowMoreChatOptionsBox = false;">對話列表</div>
      </div>

      <!-- 搜尋對話內容小介面 -->
      <div :class="['search-user-dialogue-box', { show: isOpenSearchUserDialogueBox }]">
        <i class="material-symbols-outlined left-icon fs-19">search</i>
        <input type="text" class="custom-input fs-14" placeholder="搜尋對話內容"/>
        <i class="material-symbols-outlined right-icon fs-22"
          @click="isOpenSearchUserDialogueBox = false">close</i>
      </div>

    </div>

    <!-- 對話訊息大區域 -->
    <!-- <div class="AiAgentChatArea" @wheel.stop="handleContentWheel($event); stopWhellZoomEvent($event);"> -->
    <VirtualList class="AiAgentChatArea"
      ref="AiAgentChatList"
      :data-key="'id'"
      :data-sources="testMsgs"
      :data-component="AiViewerRecord"
      :keeps="99999999"
      :footer-class="'AiAgentChatArea-footer-box'"
      @totop="scrollCall('DESC')"
      @tobottom="scrollCall('ASC')"
      @click="handleChatAreaClick($event)"
    >
      <template #footer>
        <!-- <i class="material-symbols-outlined AiAgentChatAreaToscrollBtn"
          @click="AiAgentChatListScrollTo('DESC')">arrow_upward</i> -->
        <i class="material-symbols-outlined AiAgentChatAreaToscrollBtn"
          @click="AiAgentChatListScrollTo('ASC')">arrow_downward</i>
        <!-- <div class="AiAgentChatAreaToscrollBtn">top</div>
        <div class="AiAgentChatAreaToscrollBtn">bottom</div> -->
      </template>
    </VirtualList>
    <!-- </div> -->


    <!-- user 輸入大區域  TODO... 思考是否要拔出去成為組件 -->
    <div :class="['AiViewrUserInputArea', { enterCannedTask: isShowCannedTaskListBox }]">
      <!-- 要上傳的附件 -->
      <div :class="['accessory-box', { hidden: isShowCannedTaskListBox }]"
        :style="{ maxWidth: props.rightWidth - 65 + 'px' }">
        <!-- 已選擇的檔案附件 -->
        <div :class="['accessory-item-box', {'no-accessory-item': userInputModal.userUploadFiles.length === 0 && userInputModal.aiFiles.length === 0}]">
          <!-- 使用者要上傳的檔案列表 -->
          <div :class="['oneFileItem accessory-item', { 'show-delete-btn': isTouchDevice }]" v-for="(item, i) in userInputModal.userUploadFiles" :key="'userUploadFiles-item' + i">

            <!-- 可以預覽用 -->
            <img class="file-icon" :src="item.preview" v-if="item.preview"/>
            <!-- 不可預覽用 icon 表示 -->
            <span class="noFile-icon" v-else>
              <i class="material-symbols-outlined">draft</i>
            </span>

            <div class="file-info-box">
              <div class="file-name">{{ item.file.name }}</div>
              <div class="file-size">{{ item.fileType }}．{{ formatFileSize(item.file.size) }}</div>
            </div>
            <i class="material-symbols-outlined delete-btn" @click="userInputModal.userUploadFiles.splice(i, 1)">close_small</i>
          </div>
          <!-- 由畫布再次帶入的檔案列表 -->
          <div :class="['oneFileItem accessory-item isAgainFile', { 'show-delete-btn': isTouchDevice }]" v-for="(item, i) in userInputModal.aiFiles" :key="'aiFiles-item' + i">
            <!-- 如果 block type 是圖片 -->
            <img class="file-icon" :src="item.data.fileUrl" v-if="item.blockType === 'IMAGE'"/>
            <!-- 在規範內的 block type 使用定義好的 icon  -->
            <img :src="useIconFileTypes[item.blockType]" v-else-if="item.blockType && useIconFileTypes[item.blockType]"/>
            <!-- 不在定義好的 block type -->
            <span class="noFile-icon" v-else>
              <i class="material-symbols-outlined">draft</i>
            </span>
            <i class="material-symbols-outlined delete-btn" @click="userInputModal.aiFiles.splice(i, 1)">close_small</i>
          </div>
        </div>
      </div>
      <!-- 使用者輸入區 -->
      <div :class="['input-group-box', { hidden: isShowCannedTaskListBox }]">
        <textarea :class="['custom-textarea']"
          id="userInput"
          placeholder="請輸入您的需求"
          ref="userInputRef"
          v-model.trim="userInputModal.msg"
          @focus="inputFocus()"
          @blur="inputBlur()"
          @keydown="inputKeyPress($event); handleEnterKeySubmit($event, sendUserInput)">
        </textarea>
        <div>
          <!-- 展開快速罐頭任務區塊按鈕 -->
          <button class="custom-btn" v-tooltip.top="'使用快速任務'"
            @click="isShowCannedTaskListBox = true">
            <i class="material-symbols-outlined">bolt</i>
          </button>
          <!-- 展開選擇附件功能選項清單按鈕 -->
          <button class="custom-btn" v-tooltip.top="'附加檔案'"
            @click="isOpenAccessoryFileFnBox = true">
            <i class="material-symbols-outlined">add</i>
          </button>
        </div>
        <!-- 附件功能選項清單 -->
        <div :class="['accessory-file-fn-box next-option-box', {'show': isOpenAccessoryFileFnBox}]"
          ref="accessoryFileFnBox">
          <div class="option-item">從本機檔案新增
            <!-- 本地端上傳的 input file -->
            <label class="accessory-file-input-label">
              <input type="file" ref="fireUploadRef"
                multiple
                :accept="acceptedFileExtensions"
                @change="handleAccessoryFileSelect($event)"/>
            </label>
          </div>
          <div class="option-item">從專案檔案清單新增</div>
          <div class="option-item">從共享資源庫新增</div>
        </div>
        <!-- 發送按鈕 -->
        <button class="custom-btn" v-tooltip="'發送訊息'"
          @click="send()"><i class="material-symbols-outlined material-fill">send</i></button>
      </div>

      <!-- 快速罐頭任務大區塊  TODO... 思考是否要拔出去成為組件 -->
      <div class="AiViewerCannedTaskArea" v-show="isShowCannedTaskListBox">

        <div :class="['canned-list-box', {hide: !isShowCannedTaskListBox}]">
          <div :class="['canned-task-item', { 'active': false }]"
            v-for="(item, i) in [
              { id: 'cannedTask1', text: '快速罐頭任務範例文字1' },
              { id: 'cannedTask2', text: '快速罐頭任務範例文字2' },
              { id: 'cannedTask3', text: '快速罐頭任務範例文字33333333333333333333333' },
              { id: 'cannedTask4', text: '快速罐頭任務範例文字4' },
              { id: 'cannedTask5', text: '快速罐頭任務範例文字5' },
              { id: 'cannedTask5', text: '快速罐頭任務範例文字6' },
            ]" :key="'cannedTaskItem' + i"
            @click="sendCannedTask(item)">
            {{ item.text }}
          </div>
        </div>

        <div class="d-flex flex-justify-start flex-align-center">
          <!-- 關閉快速罐頭任務區塊按鈕 -->
          <button class="custom-btn"
            @click="isShowCannedTaskListBox = false">
            <i class="material-symbols-outlined">close</i>
          </button>
          <span class="fs-13 ml-1">離開快速任務</span>
        </div>

      </div>

    </div>

    <!-- AI 內容免責聲明 -->
    <div class="ai-disclaimer">由 AI 產生的內容，有時可能不完全準確，請再人工查證</div>

    <!-- 評論列表 comment list -->
    <commentListArea :setMainStagePosition="props.setMainStagePosition" />

    <!-- 畫布 block 清單 list -->
    <blockListArea :setMainStagePosition="props.setMainStagePosition"/>

    <!-- 專案檔案清單 list -->
    <fileListArea/>

  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { handleContentWheel, stopWhellZoomEvent, stopTouchpadZoomEvent, handleEnterKeySubmit, initClickOutsideListener } from '@/utils/utils';
import VirtualList from 'vue3-virtual-scroll-list';
import AiViewerRecord from '@/components/AiViewer/AiViewerRecord.vue';
import commentListArea from '@/components/AiViewer/commentListArea.vue';
import fileListArea from '@/components/AiViewer/fileListArea.vue';
import blockListArea from '@/components/AiViewer/blockListArea.vue';
import popDialog from '@/services/popDialog';
import { formatFileSize, getFileMimeType, validateUploadFiles, acceptedFileExtensions } from '@/utils/file';

const props = defineProps<{
  rightWidth: number;
  setMainStagePosition: (x: number, y: number) => void;
}>();

const aiviewerStore = useAiviewerStore();
const { nowChoiceAiViewerId, copyAiViewerBlock, isStopCopyPasteAiViewerBlock, isMultiChoiceAiViewerMode, nowMultiChoiceAiViewerIds, isShowFileListView } = storeToRefs(aiviewerStore);
const { fullAiViewerBlockId, isAspectRatioMode } = storeToRefs(aiviewerStore);
const { aiViewerBlocks } = storeToRefs(aiviewerStore);
const { sendUserInput } = aiviewerStore;
const { isOpenConversationListModal, currentConversationId } = storeToRefs(aiviewerStore); // 是否開啟對話列表 Modal

const conversationTitles: Record<string, string> = {
  conv1: '2026 年度銷售數據挖掘計畫',
  conv2: "競品分析 · UGG Women's Elea Pooch Slip-on 冬季室內拖鞋",
};
const currentConversationTitle = computed(() => conversationTitles[currentConversationId.value] ?? '對話');

const { isTouchDevice } = storeToRefs(aiviewerStore);

// konva.js 主場景物件
const { mainStage } = storeToRefs(aiviewerStore);

// 搜尋對話內容小介面
const isOpenSearchUserDialogueBox = ref(false);

// 更多對話選項的小介面
const isShowMoreChatOptionsBox = ref(false);
const projectNameDropDown = ref<HTMLDivElement|null>(null);
const moreChatOptionsBox = ref<HTMLDivElement|null>(null);
const moreChatOptionsBoxStyle = ref({ left: '0px' });
function calcMoreChatOptionsBoxStyle () {
  // 讓 moreChatOptionsBox 對齊 projectNameDropDown
  if (!projectNameDropDown.value || !moreChatOptionsBox.value) return;
  const temp = projectNameDropDown.value.getBoundingClientRect();
  console.log(temp, moreChatOptionsBox.value.clientWidth);
  moreChatOptionsBoxStyle.value = {
    left: (temp.width - (moreChatOptionsBox.value.clientWidth / 2)) + 'px',
  };
}

onMounted(() => {
  initClickOutsideListener(moreChatOptionsBox.value!, () => {
    isShowMoreChatOptionsBox.value = false;
  });
});

// 使用者輸入參考
const { userInputModal } = storeToRefs(aiviewerStore);
const fireUploadRef = ref<HTMLInputElement|null>(null);
const AiAgentChatList = ref<InstanceType<typeof VirtualList>|null>(null);

// 目前選擇的罐頭任務  TODO... 格式暫定, TODO... 是否要拔到 store 裡？
const isShowCannedTaskListBox = ref(false);
// 切換罐頭任務
function sendCannedTask(item: any) {
  send();
  // userInputModal.value.msg = item.text;
  // nextTick(() => {
  //   adjustTextareaHeight();
  // });
}

// 是否焦點在使用者輸入框
const { isFocusUserInput } = storeToRefs(aiviewerStore);

// 輸入框焦點時
async function inputFocus() {
  // copyAiViewerBlock.value = null; // 清空複製區塊變數
  // await navigator.clipboard.writeText(''); // 清空系統剪貼簿內容
  isFocusUserInput.value = true;
}
// 輸入框鍵盤按下事件
async function inputKeyPress(event: KeyboardEvent) {
  const key = event.key;
  const isCtrlOrCmd = event.ctrlKey || event.metaKey; // 是否按下 ctrl 鍵或 command 鍵
  // 貼上判斷
  if (isCtrlOrCmd && key.toLowerCase() === 'v') {
    // TODO... 判斷複製的是否為區塊資料
    const clipboardText = await navigator.clipboard.readText();
    console.log('剪貼簿資料....', clipboardText);
  }
}
// 輸入框失去焦點時
function inputBlur() {
  userInputModal.value.msg = userInputModal.value.msg.trim();
  isFocusUserInput.value = false;
}

const { getBlockTypeByFileMime } = aiviewerStore;
// 附件功能選項清單
const accessoryFileFnBox = ref<HTMLElement|null>(null);
const isOpenAccessoryFileFnBox = ref(false);
onMounted(() => {
  initClickOutsideListener(accessoryFileFnBox.value!, () => {
    isOpenAccessoryFileFnBox.value = false;
  });
});

// 能支援本地端上傳的檔案類型
const supportedFileTypes = aiviewerStore.supportedFileTypes;
// 圖檔類型參考
const supportedImgFileTypes = aiviewerStore.supportedImgFileTypes;
// 檔案類型對應的圖示
const useIconFileTypes = aiviewerStore.useIconFileTypes;

// 使用者選擇檔案 (注意這邊不會是ai產生的檔案,檔案來源: 使用者本地端上傳, 已上傳到專案資料夾路徑, 共享資料夾內的檔案路夾)
function handleAccessoryFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  isOpenAccessoryFileFnBox.value = false;
  const files = Array.from(input.files);

  // 驗證類型、數量、大小
  const validation = validateUploadFiles(files, userInputModal.value.userUploadFiles, supportedFileTypes);
  if (!validation.valid) {
    input.value = '';
    const errorMsg = validation.error as string;
    popDialog.alert(errorMsg);
    return;
  }

  // 處理 "本地端選擇" 的檔案
  files.forEach(file => {
    const fileType = getFileMimeType(file);
    const blockType = getBlockTypeByFileMime(fileType); // 提醒: 目前規劃 fileType 也就是 blockType
    console.log('fileType >>> ', fileType);
    console.log('blockType >>> ', blockType);

    // 本地端非圖片類型不建立預覽 URL, 使用 icon 表示
    if (supportedImgFileTypes.indexOf(fileType) === -1) {
      userInputModal.value.userUploadFiles.push({
        file: file,
        fileType: blockType,
        preview: useIconFileTypes[fileType] || null
      });
      return;
    }
    // 本地端的圖片類的要建立預覽 URL
    const previewUrl = (fileType.startsWith('image/')) ? URL.createObjectURL(file) : null;
    userInputModal.value.userUploadFiles.push({
      file: file,
      fileType: blockType,
      preview: previewUrl
    });
  });

  input.value = ''; // 重置 file input
}

// 調整 textarea 高度
const userInputRef = ref<HTMLTextAreaElement|null>(null);
async function adjustTextareaHeight() {
  if (!userInputRef.value) {
    userInputRef.value!.style.height = 'auto';
    return;
  }

  // 取得舊高度
  const oldHeight = userInputRef.value!.style.height;

  // 先重置高度，以便正確計算 scrollHeight
  userInputRef.value!.style.height = 'auto';

  // 取得新高度
  const newHeight = userInputRef.value!.scrollHeight + 2; // 加一些額外空間

  // 回復舊高度以觸發動畫效果
  userInputRef.value!.style.height = oldHeight;
  await new Promise(resolve => setTimeout(resolve, 60));

  // 設定新高度
  userInputRef.value!.style.height = `${newHeight}px`;

  // 如果高度超過最大高度，則添加滾動條
  const maxHeight = 110; // 最大高度
  if (newHeight > maxHeight) {
    userInputRef.value!.classList.add('useScrollBar');
  } else {
    userInputRef.value!.classList.remove('useScrollBar');
  }
}
watch(() => userInputModal.value.msg, () => {
  adjustTextareaHeight();
});

// 發送使用者輸入訊息
function send() {
  sendUserInput();
}

// virtual-list 滾動到頂部或底部的回呼
function scrollCall(direction: 'ASC' | 'DESC') {
  console.log('scrollCall 觸發: ', direction);
}
// virtual-list 執行滾動到頂部或底部
function AiAgentChatListScrollTo(direction: 'ASC' | 'DESC') {
  if (direction === 'DESC') {
    AiAgentChatList.value?.scrollToIndex(0);
  } else {
    AiAgentChatList.value?.scrollToBottom();
  }
}

// TODO... 開發測試用之後刪除
const { touchDebug } = storeToRefs(aiviewerStore);
const tempDebugMsg = computed(() => {
  return `
    <p class="fs-12">
      POC階段這一則訊息的文字,請用滑鼠複製不要用ctrl+c或cmd+c.<br><br>
      nowChoiceAiViewerId: ${ nowChoiceAiViewerId.value }<br><br>
      aiViewerBlocks.length: ${ aiViewerBlocks.value.length }<br><br>

      isMultiChoiceAiViewerMode: ${ isMultiChoiceAiViewerMode.value }<br><br>
      nowMultiChoiceAiViewerIds.length: ${ nowMultiChoiceAiViewerIds.value.length }<br><br>
      nowMultiChoiceAiViewerIds: ${ nowMultiChoiceAiViewerIds.value }<br><br>

      aiViewerBlocks: ${ JSON.stringify(aiViewerBlocks.value) }<br><br>

      userInputModal: ${ JSON.stringify(userInputModal.value) }<br><br>
    </p>

    <p class="fs-12">
      isStopCopyPasteAiViewerBlock: ${ isStopCopyPasteAiViewerBlock.value }<br><br>
      copyAiViewerBlock: ${ copyAiViewerBlock.value }<br><br>
    </p>

    <p class="fs-12">
      fullAiViewerBlockId: ${ fullAiViewerBlockId.value }<br><br>
      isAspectRatioMode: ${ isAspectRatioMode.value }<br><br>
      isTouchDevice: ${ isTouchDevice.value }<br><br>
      touchDebug: ${ touchDebug.value }<br><br>
    </p>

    <hr class="mt-2 mb-2" />

    <p class="fs-12">●●●●● 目前輸入 (拷貝要用滑鼠右鍵) ●●●●●<br>
      testHtmlFileA, testHtmlFileB, testHtmlFileC,
      test_report_251210, 會看到有 iframe 區塊<br>
      chartA, chartB, chartC, chartD 會產生不同的圖表, <br>
      excelA, excelB, 是 X-Spreadshee 套件的呈現 <br>
      excelC, excelD, excelE 是使用 sheetjs 做真實的excel檔案讀取與呈現<br>
      pdfA, pdfB 做真實的 .pdf 檔案讀取與呈現<br>
      txtA, txtB 做真實的 .txt 檔案讀取與呈現<br>
      mdA, mdB 做真實的 .md 檔案讀取與呈現<br>
      imgA, imgB 做真實的圖檔讀取與呈現<br>

      testForm 會看到有表單元素的區塊<br>
    </p>
    <hr class="mt-2 mb-2" />
    <p class="fs-12">
      nowChoiceAiViewerId: ${ nowChoiceAiViewerId.value }
    </p>
    <p class="fs-12">
      userInputModal.userUploadFiles: ${ userInputModal.value.userUploadFiles.length }
    </p>
  `;
});
const conv1Msgs = ref([]) as Ref<any[]>;
for (let i = 1; i <= 100; i++) {
  const temp: any = { id: 'id_' + i, msg: 'aaaaaa' + i };
  // 造假這是用戶發話
  if (i === 1) {
    temp.forUser = true;
    temp.msg = '我說啊嘿嘿誒,怎麼這麼有趣啊哈哈哈哈哈哈哈哈哈哈哈哈哈.';
  }
  if (i === 10) {
    temp.forUser = true;
    temp.msg = '真的假的';
  }
  if (i === 2) {
    temp.msg = tempDebugMsg;
  }
  // 造假單一個回應最後的讚或踩
  if (i === 98) {
    temp.finishResponse = true;
    temp.msg = temp.msg + ', 啊你覺得我說的好不好？';
  }
  // 造假 用戶發話 -> ai 正在思考中
  if ( i === 99 ) {
    temp.forUser = true;
    temp.msg = '我想要知道今天的天氣如何？';
  }
  if ( i === 100 ) {
    temp.isThinking = true;
    temp.msg = 'AI 正在思考中...';
  }
  conv1Msgs.value.push(temp);
}

// -------- Conversation 2 流程 --------
const DEMO_IMG = 'https://d12ro2iv4p7r0b.cloudfront.net/media/catalog/product/u/g/ug1183390sndc-1.jpg';
const DEMO_DESC = '淺粉色系絨室內拖鞋，動物臉設計，具有柔潤立體造型和寬闊防滑底，前頭設計，毛茸茸的感覺適合屋家穿著。';

let conv2IdCounter = 2;
const conv2Mode = ref('');

const CONV2_MODE_CARD_MSG = `你好！請選擇想要的分析模式：
<div class="ai-mode-card">
  <div class="ai-mode-item" data-action="select-mode" data-value="init">
    <div class="ai-mode-icon">🔍</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">初步分析</div>
      <div class="ai-mode-desc">快速掌握市場上的直接與功能競品</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
  <div class="ai-mode-item" data-action="select-mode" data-value="deep">
    <div class="ai-mode-icon">🧠</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">深度分析</div>
      <div class="ai-mode-desc">DeepAgent 深度搜尋並產出完整報告</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
  <div class="ai-mode-item" data-action="select-mode" data-value="direct">
    <div class="ai-mode-icon">⚡</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">直接生成報告</div>
      <div class="ai-mode-desc">提供競品網址，直接輸出分析報告</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
</div>`;

const conv2Msgs = ref<any[]>([{ id: 'c2_1', msg: CONV2_MODE_CARD_MSG }]);

function c2Push(msg: any) {
  conv2Msgs.value.push({ id: `c2_${conv2IdCounter++}`, ...msg });
}
function c2Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

function handleChatAreaClick(e: MouseEvent) {
  if (currentConversationId.value !== 'conv2') return;
  const target = e.target as HTMLElement;
  const el = target.closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  e.stopPropagation();
  const action = el.dataset.action!;
  const value = el.dataset.value ?? '';
  conv2Dispatch(action, value);
}

function conv2Dispatch(action: string, value: string) {
  switch (action) {
    case 'select-mode':    conv2SelectMode(value); break;
    case 'start-analysis': conv2StartAnalysis(); break;
    case 'confirm-product': conv2ConfirmProduct(); break;
    case 'submit-urls':    conv2SubmitUrls(); break;
    case 'confirm-comps':  conv2ConfirmComps(); break;
  }
}

function conv2SelectMode(mode: string) {
  if (conv2Msgs.value.length > 1) return;
  conv2Mode.value = mode;
  // lock mode card visually
  conv2Msgs.value[0] = {
    ...conv2Msgs.value[0],
    msg: CONV2_MODE_CARD_MSG.replace('class="ai-mode-card"', 'class="ai-mode-card ai-mode-card--locked"'),
  };
  const labels: Record<string, string> = { init: '初步分析', deep: '深度分析', direct: '直接生成報告' };
  c2Push({ forUser: true, msg: labels[mode] });

  if (mode === 'direct') {
    setTimeout(() => {
      c2Push({ msg: '請提供競品的商品頁面網址（最多 5 個），我將直接爬取資料並生成完整分析報告。' });
      c2Push({ msg: `<div class="conv2-url-card">
  <div class="conv2-url-header">示範網址（可直接送出）</div>
  <div class="conv2-url-item"><span class="conv2-url-num">1</span><span class="conv2-url-text">shopee.tw — 日陞威 系泰迪絨拖</span></div>
  <div class="conv2-url-item"><span class="conv2-url-num">2</span><span class="conv2-url-text">paidal.com.tw — 萌系嬰兒棉拖鞋</span></div>
  <div class="conv2-url-item"><span class="conv2-url-num">3</span><span class="conv2-url-text">zara.com/tw — CAPYFUN 室內拖鞋</span></div>
  <div class="conv2-url-actions"><button class="conv2-action-btn" data-action="submit-urls">開始分析 →</button></div>
</div>` });
      c2Scroll();
    }, 400);
    return;
  }

  setTimeout(() => {
    c2Push({ msg: `需要你提供一些商品的圖片或詳細文字描述，才能進行${labels[mode]}，請分享一下你想分析的商品資訊。` });
    c2Push({ msg: `<div class="conv2-upload-card">
  <img class="conv2-upload-img" src="${DEMO_IMG}" />
  <div class="conv2-upload-info">
    <div class="conv2-upload-sku">示範商品</div>
    <div class="conv2-upload-name">Women's Elea Pooch Slip-on</div>
    <div class="conv2-upload-desc">${DEMO_DESC}</div>
    <button class="conv2-action-btn" data-action="start-analysis" style="margin-top:8px">點擊使用此商品開始分析 →</button>
  </div>
</div>` });
    c2Scroll();
  }, 400);
}

function conv2StartAnalysis() {
  c2Push({ forUser: true, msg: `<div style="display:flex;align-items:center;gap:8px"><img style="width:44px;height:44px;border-radius:6px;object-fit:contain;border:1px solid var(--color-border)" src="${DEMO_IMG}"/><span>${DEMO_DESC}</span></div>` });
  c2Push({ isThinking: true, msg: 'AI 正在思考中...' });
  c2Scroll();
  setTimeout(() => {
    const idx = conv2Msgs.value.findIndex((m) => m.isThinking);
    if (idx !== -1) conv2Msgs.value.splice(idx, 1);
    c2Push({ msg: `已識別為<strong>系絨動物臉室內拖鞋</strong>，捕捉到以下特徵：` });
    const btnLabel = conv2Mode.value === 'deep' ? '確認並開始深度分析 →' : '確認並產出初步分析報告 →';
    c2Push({ msg: `<div class="conv2-product-card">
  <div class="conv2-pc-head">
    <img class="conv2-pc-thumb" src="${DEMO_IMG}"/>
    <div>
      <div class="conv2-pc-sku">圖片分析結果</div>
      <div class="conv2-pc-name">系絨動物臉室內拖鞋</div>
      <div class="conv2-pc-brand">淺粉色 · 柔潤立體 · 前頭設計</div>
    </div>
  </div>
  <div class="conv2-pc-tags">
    <span class="conv2-tag">系絨材質</span><span class="conv2-tag">動物臉</span><span class="conv2-tag">柔潤立體</span><span class="conv2-tag">前頭設計</span><span class="conv2-tag">防滑底</span><span class="conv2-tag">保暖</span>
  </div>
  <button class="conv2-action-btn" data-action="confirm-product" style="margin-top:10px">${btnLabel}</button>
</div>` });
    c2Scroll();
  }, 1200);
}

function conv2ConfirmProduct() {
  if (conv2Mode.value === 'init') {
    c2Push({ msg: '正在產出初步分析報告⋯' });
    c2Scroll();
    setTimeout(() => {
      c2Push({ msg: `初步分析完成，共找到 <strong>5 個直接競品</strong>、<strong>1 個功能競品</strong>：<div class="conv2-init-list">
  <div class="conv2-comp-item conv2-comp-item--rank"><span class="conv2-comp-rank">1</span><span class="conv2-comp-name">ZARA CAPYFUN 室內拖鞋</span><span class="conv2-comp-price">NT$890</span></div>
  <div class="conv2-comp-item conv2-comp-item--rank"><span class="conv2-comp-rank">2</span><span class="conv2-comp-name">Paidal 萌系嬰兒棉拖鞋</span><span class="conv2-comp-price">NT$599</span></div>
  <div class="conv2-comp-item conv2-comp-item--rank"><span class="conv2-comp-rank">3</span><span class="conv2-comp-name">Zivmode 保暖厚底系絨拖鞋</span><span class="conv2-comp-price">NT$520</span></div>
  <div class="conv2-comp-item conv2-comp-item--rank"><span class="conv2-comp-rank">4</span><span class="conv2-comp-name">貝柔 系絨毛保暖拖鞋</span><span class="conv2-comp-price">NT$299</span></div>
  <div class="conv2-comp-item conv2-comp-item--rank"><span class="conv2-comp-rank">5</span><span class="conv2-comp-name">ZARA 動物臉家居鞋</span><span class="conv2-comp-price">NT$890</span></div>
  <div class="conv2-comp-item conv2-comp-item--rank conv2-comp-item--fn"><span class="conv2-comp-rank conv2-comp-rank--fn">f</span><span class="conv2-comp-name">iSlippers 輕活系列前頭系絨家居鞋</span><span class="conv2-comp-price">NT$420</span></div>
</div>` });
      conv2ShowReport('初步分析', 5);
      c2Scroll();
    }, 1000);
    return;
  }
  c2Push({ msg: '商品特徵已確認，DeepAgent 開始深度搜索⋯' });
  c2Push({ msg: `<div class="conv2-search-card">
  <div class="conv2-ss conv2-ss--done">SearchStrategist 產生深度搜索任務</div>
  <div class="conv2-ss conv2-ss--done">GoogleSearchEngine 搜索並過濾關鍵字</div>
  <div class="conv2-ss conv2-ss--active">ImageSimilarityFilter 圖片相似度篩選中</div>
  <div class="conv2-ss conv2-ss--wait">篩選完成，產出備選競品清單</div>
</div>` });
  c2Scroll();
  setTimeout(() => {
    c2Push({ msg: `✅ 搜索完成，找到 <strong>12 個備選競品</strong>，以下已預選 4 個，請確認後產出報告：` });
    c2Push({ msg: `<div class="conv2-comp-list">
  <div class="conv2-comp-item conv2-comp-item--sel"><span class="conv2-comp-rank">1</span><span class="conv2-comp-name">日陞威 系泰迪絨拖</span><span class="conv2-comp-price">NT$590</span></div>
  <div class="conv2-comp-item conv2-comp-item--sel"><span class="conv2-comp-rank">2</span><span class="conv2-comp-name">Paidal 萌系嬰兒棉拖鞋</span><span class="conv2-comp-price">NT$599</span></div>
  <div class="conv2-comp-item conv2-comp-item--sel"><span class="conv2-comp-rank">3</span><span class="conv2-comp-name">ZARA CAPYFUN 室內拖鞋</span><span class="conv2-comp-price">NT$890</span></div>
  <div class="conv2-comp-item conv2-comp-item--sel"><span class="conv2-comp-rank">4</span><span class="conv2-comp-name">貝柔 系絨毛保暖拖鞋</span><span class="conv2-comp-price">NT$299</span></div>
  <div class="conv2-comp-actions"><button class="conv2-action-btn" data-action="confirm-comps">確認競品，產出報告 →</button></div>
</div>` });
    c2Scroll();
  }, 1800);
}

function conv2ConfirmComps() {
  c2Push({ forUser: true, msg: '確認以上 4 個競品，請生成分析報告。' });
  c2Push({ msg: `已確認 4 個競品，開始生成報告⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">ProductExtractor 爬取競品頁面資料</div>
  <div class="conv2-ss conv2-ss--active">FeatureAnalyzer 特徵比對與評分中</div>
  <div class="conv2-ss conv2-ss--wait">ReportGenerator 產出 HTML 報告</div>
</div>` });
  c2Scroll();
  setTimeout(() => { conv2ShowReport('深度分析', 4); c2Scroll(); }, 2200);
}

function conv2SubmitUrls() {
  c2Push({ forUser: true, msg: '提供 3 個競品網址：<br>1. shopee.tw — 日陞威 系泰迪絨拖<br>2. paidal.com.tw — 萌系嬰兒棉拖鞋<br>3. zara.com/tw — CAPYFUN 室內拖鞋' });
  c2Push({ msg: `收到，開始爬取並分析⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">ProductExtractor 爬取商品資料中</div>
  <div class="conv2-ss conv2-ss--active">FeatureAnalyzer 特徵比對分析中</div>
  <div class="conv2-ss conv2-ss--wait">ReportGenerator 生成競品報告</div>
</div>` });
  c2Scroll();
  setTimeout(() => { conv2ShowReport('直接生成報告', 3); c2Scroll(); }, 2400);
}

function conv2ShowReport(mode: string, count: number) {
  c2Push({ msg: '✅ 報告已生成完畢，可下載 HTML 檔案。' });
  c2Push({ finishResponse: true, msg: `<div class="conv2-report-card">
  <div class="conv2-report-header">
    <div class="conv2-report-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
    <div><div class="conv2-report-title">競品分析報告</div><div class="conv2-report-sub">competitor_analysis_report.html</div></div>
  </div>
  <div class="conv2-report-meta">
    <div class="conv2-report-meta-item"><div class="conv2-report-meta-k">分析模式</div><div class="conv2-report-meta-v">${mode}</div></div>
    <div class="conv2-report-meta-item"><div class="conv2-report-meta-k">競品數量</div><div class="conv2-report-meta-v">${count} 個</div></div>
    <div class="conv2-report-meta-item"><div class="conv2-report-meta-k">生成日期</div><div class="conv2-report-meta-v">2026/4/1</div></div>
  </div>
  <div class="conv2-report-actions"><button class="conv2-action-btn">下載分析報告</button></div>
</div>` });
}
// -------- end Conversation 2 流程 --------

const testMsgs = computed(() =>
  currentConversationId.value === 'conv2' ? conv2Msgs.value : conv1Msgs.value
);

// degub 相關
const { debugCount, lookDebug } = storeToRefs(aiviewerStore);

</script>
