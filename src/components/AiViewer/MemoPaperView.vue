<template>
  <!-- 提醒使用 @wheel.stop="() => {}" 是避免在套件中,的wheel事件被取消的問題. -->
  <div :class="['MemoPaperView', { 'isMobile': isTouchDevice }]" :style="memoStyle" ref="memoPaperView"
    @wheel="stopWhellZoomEvent($event)">
    <div :class="['memo-header-box']">
      評論
      <i class="material-symbols-outlined close-memo-btn" @click="emit('closrShowCommentView')">close</i>
    </div>

    <!-- props.memoData: {{ props.memoData }} -->
    <div class="memo-content-box" v-if="props.memoData[0]"
      ref="memoContentBox"
      @wheel.stop="($event) => {
        handleContentWheel($event);
        stopWhellZoomEvent($event);
        if (!modifyCommentItem && focusMoreCommentItemIndex !== null) {
          focusMoreCommentItemIndex = null;
        }
      }">
      <!-- 單一筆 msg -->
      <div class="one-memo-msg" v-for="(item, index) in props.memoData[0].list" :key="`${item.commentId}-${index}`">
        <!-- 單一筆的 header -->
        <div class="d-flex flex-align-center flex-justify-between">
          <div class="comment-header">
            <div class="userNameIcon">{{ item.userName.slice(0,1) }}</div>
            <div class="userName">{{ item.userName }}</div>
            <span>3 天前</span>
          </div>
          <template v-if="!modifyCommentItem">
            <i class="material-symbols-outlined more-comment-btn" @click="focusMoreCommentItemIndex = index">more_horiz</i>
          </template>
        </div>
        <!-- 進入編輯留言狀態 -->
        <div class="modify-memo-box" v-if="modifyCommentItem && modifyCommentItem.commentId === item.commentId">
          <textarea class="custom-textarea modify-memo-textarea"
            v-model="modifyCommentItem.text"
            rows="4"
            @keydown="handleEnterKeySubmit($event, () => {
              item.text = modifyCommentItem.text.trim();
              modifyCommentItem = null;
            })"
          >
          </textarea>
          <div class="d-flex flex-justify-end p-1">
            <button class="custom-btn fs-11 mr-1" @click="modifyCommentItem = null">Cancel</button>
            <button class="custom-btn custom-main-btn fs-11" @click="() => {
              item.text = modifyCommentItem.text.trim();
              modifyCommentItem = null;
            }">Save</button>
          </div>
        </div>
        <!-- 一般瀏覽狀態 -->
        <p class="pt-1" v-html="nlTobr(item.text)" v-else></p>
      </div>

    </div>
    <!-- 新增新訊息輸入區 -->
    <div class="memo-new-comment-input-box d-flex flex-align-end flex-justify-between">
      <textarea class="custom-textarea create-memo-textarea"
        :placeholder="(props.memoData[0]) ? '回覆評論...' : '新增評論...'"
        rows="1"
        ref="memoPaperInput"
        v-model="memoInputModal"
        @keydown="handleEnterKeySubmit($event, createComment)">
      </textarea>
      <button class="custom-btn send-comment-btn"
        :disabled="modifyCommentItem"
        @click.stop.prevent="createComment()">
        <i class="material-symbols-outlined">arrow_upward_alt</i>
      </button>
    </div>

    <!-- 單一筆便條紙留言的更多選項 -->
    <div :class="['more-options-box next-option-box', { show: focusMoreCommentItemIndex !== null && props.memoData[0].list[focusMoreCommentItemIndex].commentId }]" ref="nextOptionBox"
      :style="nextOptionBoxStyle">
      <div class="option-item" v-if="focusMoreCommentItemIndex !== null" @click="modifyComment(focusMoreCommentItemIndex); focusMoreCommentItemIndex = null;">編輯</div>
      <div class="option-item" v-if="focusMoreCommentItemIndex !== null" @click="deletComment(focusMoreCommentItemIndex); modifyCommentItem = null; focusMoreCommentItemIndex = null;">刪除</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import type { MemoItem } from '@/types/AiViewer';
import popDialog from '@/services/popDialog';
import { initClickOutsideListener, handleContentWheel, handleEnterKeySubmit, stopWhellZoomEvent, nlTobr } from '@/utils/utils';

const props = defineProps<{
  source: Record<string, unknown>
  id: string
  memoData: MemoItem[]
}>()

const emit = defineEmits<{ (e: 'closrShowCommentView' ): void }>();

const aiviewerStore = useAiviewerStore();
const { mainStage, isTouchDevice } = storeToRefs(aiviewerStore);
const { memos } = storeToRefs(aiviewerStore);  // TODO... 之後不用這樣使用,現在用是為了跳過ajax的部分

const memoPaperView = ref<HTMLElement|null>(null);
const memoContentBox = ref<HTMLElement|null>(null);

// 便條紙小介面 自動調整 textarea 高度
const memoInputModal = ref('');
const memoPaperInput = ref<HTMLTextAreaElement|null>(null);
async function adjustTextareaHeight() {
  if (!memoInputModal.value) {
    memoPaperInput.value!.style.height = '25px';
    return;
  }
  // 取得舊高度
  const oldHeight = memoPaperInput.value!.style.height;

  // 先重置高度，以便正確計算 scrollHeight
  memoPaperInput.value!.style.height = 'auto';

  // 取得新高度
  let newHeight = memoPaperInput.value!.scrollHeight + 4; // 加一些額外空間

  // 回復舊高度以觸發動畫效果
  memoPaperInput.value!.style.height = oldHeight;
  await new Promise(resolve => setTimeout(resolve, 60));

  // 限制高度
  newHeight = (newHeight >= 110) ? 110 : newHeight;

  // 設定新高度
  memoPaperInput.value!.style.height = `${newHeight}px`;
}

// 傳送便條紙內容
function createComment() {
  if (!memoInputModal.value.trim()) return;
  if (modifyCommentItem.value) return; // 如果正在編輯留言,就不允許送出新留言

  // TODO... 之後改成ajax傳送, 這邊邏輯都是暫時的
  const temp = {
    commentId: `cm-${Date.now()}`,
    userName: 'Lucas',
    userId: 'a',
    text: memoInputModal.value.trim(),
  };
  const findMemo = memos.value.find((memoItem) => memoItem.blockId === props.id);
  if (findMemo) {
    findMemo.list.push(temp);
  } else {
    memos.value.push({
      id: `memo-${Date.now()}`,
      blockId: props.id,
      list: [temp],
    });
  }
  memoInputModal.value = '';
  nextTick(() => {
    memoContentBox.value!.scrollTop = memoContentBox.value!.scrollHeight;
  });
}

// 刪除便條紙留言
const isDeletComment = ref(false);
function deletComment(index: number) {
  isDeletComment.value = true;
  popDialog.confirm('確定刪除？', () => {
    // TODO... 之後改成ajax傳送, 這邊邏輯都是暫時的
    const findMemo = memos.value.find((memoItem) => memoItem.blockId === props.id);
    if (findMemo) {
      findMemo.list.splice(index, 1);
    }
    // 如果刪除完沒有留言了,就把整個 memo block 刪掉
    if (findMemo && findMemo.list.length === 0) {
      const memoIndex = memos.value.findIndex((memoItem) => memoItem.blockId === props.id);
      if (memoIndex !== -1) {
        memos.value.splice(memoIndex, 1);
      }
    }
    isDeletComment.value = false;
  }, () => {
    isDeletComment.value = false;
  });
}

// 更多選項的顯示控制
const nextOptionBox = ref<HTMLElement|null>(null);
const focusMoreCommentItemIndex = ref(null) as any; // 目前點擊的留言項目,用來控制顯示編輯刪除選項
const nextOptionBoxStyle = computed(() => {
  if (focusMoreCommentItemIndex.value === null) return {};

  const contentBoxRect = memoContentBox.value!.getBoundingClientRect();
  const itemOffsetTop = memoContentBox.value!.children[focusMoreCommentItemIndex.value].getBoundingClientRect().top - contentBoxRect.top + 86; // 76 是調整後的偏移量,讓選項框對齊留言項目
  return { top: `${itemOffsetTop}px` };
});

// 修改便條紙留言
const modifyCommentItem = ref(null) as any;
function modifyComment(index: number) {
  const findMemo = memos.value.find((memoItem) => memoItem.blockId === props.id);
  if (findMemo) {
    modifyCommentItem.value = JSON.parse(JSON.stringify(findMemo.list[index]));
  }
}

const memoStyle = computed(() => {
  // 依照主場景的縮放比例來調整便條紙的大小, 讓便條紙始終抱持在原始比例
  const mainScale = mainStage.value.scaleX();
  const scaleFactor = 1 / mainScale;
  const re = {
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'top left',
  };
  return re;
});

watch(() => memoInputModal.value, () => {
  adjustTextareaHeight();
});


onMounted(() => {
  // 點擊外部關閉便條紙
  initClickOutsideListener(memoPaperView.value!, () => {
    if (isDeletComment.value) return; // 如果正在刪除留言,就不關閉便條紙
    emit('closrShowCommentView');
  });

  // 點擊外部關閉更多選項框
  initClickOutsideListener(nextOptionBox.value!, () => {
    focusMoreCommentItemIndex.value = null;
  });
});

</script>
