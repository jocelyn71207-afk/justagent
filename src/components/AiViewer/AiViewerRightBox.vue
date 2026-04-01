<template>
  <div class="AiViewerRightBox" :style="{ width: props.rightWidth + 'px' }"
    @click="nowChoiceAiViewerId = ''"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">

    <!-- 對話標題大區域 -->
    <div class="AiAgentHeaderArea">
      <div class="chat-header-box">
        <div class="project-name" v-tooltip.bottom="'2026 年度銷售數據挖掘計畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫'"
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
          2026 年度銷售數據挖掘計畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫畫
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

    <!-- 評論列表 comment list -->
    <commentListArea :setMainStagePosition="props.setMainStagePosition" />

    <!-- 畫布 block 清單 list -->
    <blockListArea :setMainStagePosition="props.setMainStagePosition"/>

    <!-- 專案檔案清單 list -->
    <fileListArea/>

  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
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
const { isOpenConversationListModal } = storeToRefs(aiviewerStore); // 是否開啟對話列表 Modal

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
const testMsgs = ref([]) as Ref<any[]>;
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
  testMsgs.value.push(temp);
}

// degub 相關
const { debugCount, lookDebug } = storeToRefs(aiviewerStore);

</script>
