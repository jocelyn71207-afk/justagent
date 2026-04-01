<template>
  <div v-if="isShowBatchUpload" @wheel.prevent @touchmove.prevent
    :class="['AppBatchUpload', {
      uploading: (isBatchUploading || (!isBatchUploading && isBatchUploadSuccess))
    }]" >
    <!-- 畫面正中間選擇樣案的介面 -->
    <div class="modal-panel" @wheel.stop @touchmove.stop>
      <div class="title-box">
        <div v-show="uploadStep === 1">上傳檔案</div>
        <div v-show="uploadStep === 2">已選擇{{ choicedFiles.length }}個檔案</div>
        <button class="close-btn" @click="closeBatchUpload()">
          <i class="material-symbols-outlined material-fill" style="">close</i>
        </button>
      </div>
      <div class="body-box">
        <!-- step1 -->
        <div :class="['step1', { dragover: isDragging }]" v-show="uploadStep === 1"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDropFile($event)">
          <i class="material-symbols-outlined ">cloud_upload</i>
          <h4>請選擇或拖曳你要上傳的檔案至此</h4>
          <div>
            支援上傳 Excel、CSV、Markdown、Word、PDF、PPT、圖片等格式。<br>
            系統會依檔案類型自動處理：可解析檔案將寫入資料庫，文件與媒體檔將保留於檔案庫。<br>
            限制：每個檔案上限 5GB，一次最多 5 個檔案。
          </div>

          <input type="file" class="file-input" ref="fileInputRef"
            multiple :accept="acceptedFileExtensions"
            @change="onChoiceFile($event)"/>

          <button class="custom-btn mt-4">從電腦選擇檔案</button>
        </div>

        <!-- step2 -->
        <div class="step2" v-show="uploadStep === 2">
          <div class="oneFileItem" v-for="(item, i) in choicedFiles" :key="'choicedFiles' + i">
            <img class="file-icon" :src="item.preview ?? ''" alt="">
            <div class="file-info-box">
              <div class="file-name">{{ item.file.name }}</div>
              <div :class="['process-type-badge', isParseable(item.fileType) ? 'badge--ai' : 'badge--raw']">
                <i class="material-symbols-outlined">{{ isParseable(item.fileType) ? 'auto_awesome' : 'save' }}</i>
                {{ isParseable(item.fileType) ? 'AI 解析入庫' : '原檔保存' }}
              </div>
            </div>
            <i class="material-symbols-outlined delete-btn" @click="onRemoveChoiceFile(i)">delete</i>
          </div>
        </div>
      </div>

      <div class="footer-box" v-if="uploadStep === 2">
        <button class="custom-btn" v-if="choicedFiles.length >= 5"
          @click="closeBatchUpload()">取消</button>
        <button class="custom-btn" v-if="choicedFiles.length < 5"
          @click="onChoiceMoreFile()">選擇更多檔案({{ choicedFiles.length }}/5)</button>
        <button class="custom-btn custom-main-btn"
          @click="onStartUpload()">確認上傳</button>
      </div>
    </div>

    <!-- 在畫面右下角正在傳輸中的介面 -->
    <div class="list-panel">
      <div class="title-box">
        檔案上傳中 ({{ totalSuccess }}/{{ choicedFiles.length }})
        <div>
          <button class="hide-btn" @click="showListPanelBody = !showListPanelBody">
            <i class="material-symbols-outlined" v-if="showListPanelBody">keyboard_arrow_down</i>
            <i class="material-symbols-outlined" v-if="!showListPanelBody">keyboard_arrow_up</i>
          </button>
          <button class="close-btn" @click="checkToCloseBatchUpload()">
            <i class="material-symbols-outlined material-fill">close</i>
          </button>
        </div>
      </div>
      <div class="body-box" v-show="showListPanelBody" @wheel.stop @touchmove.stop>
        <div class="oneFileItem" v-for="(item, i) in choicedFiles" :key="'uploading' + i">
          <img class="file-icon" :src="item.preview ?? ''" alt="">
          <div class="file-info-box">
            <div class="file-name">{{ item.file.name }}</div>
            <div class="file-size">{{ formatFileSize(item.file.size) }}</div>
          </div>
          <div class="uploadPercent-box">
            <div class="percent-info">{{ item.uploadPercent }}%</div>
            <div class="percent-circle" :style="{ '--progress': item.uploadPercent + '%' }" v-show="item.uploadPercent < 100"></div>
            <i class="material-symbols-outlined ok" v-show="item.uploadPercent >= 100">check</i>
            <i :class="['material-symbols-outlined delete-btn', {
              'disabled': item.uploadPercent >= 100,
            }]" v-tooltip="(item.uploadPercent >= 100) ? '上傳完成無法取消' : '取消上傳'">delete</i>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import popDialog from '@/services/popDialog';
import {
  formatFileSize,
  acceptedFileExtensions,
  validateUploadFiles,
  getFileMimeType,
  imgFileTypes, pdfFileTypes, excelFileTypes, pptFileTypes, txtFileTypes, markdownFileTypes,
  type FileType,
} from '@/utils/file';
import { useAiviewerStore } from '@/stores/AiViewerStore';

const route = useRoute();

// 已選擇的檔案項目介面
interface ChoicedFileItem {
  file: File;
  fileType: FileType;
  preview: string | null;
  uploadPercent: number;
}

const supportedFileTypes = [...imgFileTypes, ...pdfFileTypes, ...excelFileTypes, ...pptFileTypes, ...txtFileTypes, ...markdownFileTypes];

// 判斷是否為可 AI 解析入庫的類型（Excel / MD）
function isParseable(fileType: FileType): boolean {
  return fileType === 'EXCEL' || fileType === 'MD';
}

const aiviewerStore = useAiviewerStore();
const { getBlockTypeByFileMime, useIconFileTypes } = aiviewerStore;

const rootStore = useRootStore();
const { isShowBatchUpload, isBatchUploading, isBatchUploadSuccess } = storeToRefs(rootStore);

const fileInputRef = ref<HTMLInputElement | null>(null);

const uploadStep = ref(1);  // 上傳步驟: 1: 選擇檔案(拖曳), 2: UI異動檔案數


// 關閉批次上傳，並重置相關狀態
function closeBatchUpload() {
  isShowBatchUpload.value = false;
  isBatchUploading.value = false;
  isBatchUploadSuccess.value = false;
  uploadStep.value = 1;
  isDragging.value = false;
  choicedFiles.value = [];
  showListPanelBody.value = true;
  fileInputRef.value!.value = '';
  totalSuccess.value = 0;
}

// 是否正在拖曳檔案
const isDragging = ref(false);
// 記住已選擇的檔案
const choicedFiles = ref<ChoicedFileItem[]>([]);
// 拖曳的檔案
function onDropFile(event: DragEvent) {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer?.files ?? []);
  handleAccessoryFileSelect(files);
}
// 選擇的檔案
function onChoiceFile(event: Event) {
  isDragging.value = false;
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  const files = Array.from(input.files);
  handleAccessoryFileSelect(files);
}
// 從電腦選擇更多檔案
function onChoiceMoreFile() {
  // 動態建立一個檔案選擇的 input 元素，模擬點擊它來觸發檔案選擇對話框，並在選擇檔案後處理選擇的檔案
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = acceptedFileExtensions;
  fileInput.onchange = (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    handleAccessoryFileSelect(files, true);
  };
  fileInput.click();
}
// 統一處理選擇的檔案 (不論是拖曳或是點擊選擇的檔案)
function handleAccessoryFileSelect(files: File[], isMoreChoice = false) {
  const existing = isMoreChoice ? choicedFiles.value : [];
  const result = validateUploadFiles(files, existing, supportedFileTypes);
  if (!result.valid) {
    popDialog.alert(result.error as string);
    return;
  }

  const newItems: ChoicedFileItem[] = files.map(file => {
    const fileMime = getFileMimeType(file);
    const fileType = getBlockTypeByFileMime(fileMime) as FileType;
    const preview = imgFileTypes.includes(fileMime)
      ? URL.createObjectURL(file)
      : (useIconFileTypes[fileMime] || null);
    return { file, fileType, preview, uploadPercent: 0 };
  });

  if (isMoreChoice) {
    // 如果是從電腦選擇更多檔案，則把新選擇的檔案加入已選擇的檔案中
    choicedFiles.value = [...choicedFiles.value, ...newItems];
  } else {
    // 如果是第一次選擇檔案，則直接把選擇的檔案設為已選擇的檔案
    choicedFiles.value = newItems;
  }
  if (files.length > 0) {
    uploadStep.value = 2;
  }
}

// 移除已選擇的檔案
function onRemoveChoiceFile(index: number) {
  choicedFiles.value.splice(index, 1);
  if (choicedFiles.value.length === 0) {
    fileInputRef.value!.value = '';
    uploadStep.value = 1;
  }
}

// 開始上傳檔案
const totalSuccess = ref(0); // 模擬上傳進度的狀態，實際上應該是透過 ajax 上傳的回調來更新這個狀態
let mockTimers = [] as number[]; // 模擬上傳進度的計時器 ID 陣列
function onStartUpload() {
  isBatchUploading.value = true;
  isBatchUploadSuccess.value = false;

  // 模擬 ajax 上傳：每個檔案依序用 setInterval 推進進度
  choicedFiles.value.forEach((item, index) => {
    const delay = index * 300; // 每個檔案錯開 300ms 開始
    mockTimers.push(
      setTimeout(() => {
        const timer = setInterval(() => {
          if (item.uploadPercent >= 100) {
            clearInterval(timer);
            totalSuccess.value += 1;
            // 全部完成
            if (choicedFiles.value.every(f => f.uploadPercent >= 100)) {
              isBatchUploading.value = false;
              isBatchUploadSuccess.value = true;
            }
            return;
          }
          item.uploadPercent = Math.min(item.uploadPercent + 5, 100);
        }, 100);
        mockTimers.push(timer);
      }, delay)
    );
  });
}

// 控制右下角上傳中面板的顯示
const showListPanelBody = ref(true);

// 關閉批次上傳前的確認
function checkToCloseBatchUpload() {
  if (isBatchUploading.value && !isBatchUploadSuccess.value) {
    popDialog.confirm(`
      <div class="d-flex flex-justify-center flex-column text-center">
        <div class="fs-22 mb-1 fw-600">確定關閉嗎？</div>
        <div class="fs-14">檔案仍在上傳中，關閉後將會終止上傳，確定要關閉嗎？</div>
      </div>
    `, () => {
      // TODO... 移除正在上傳的檔案的上傳任務
      mockTimers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      mockTimers = [];

      setTimeout(() => {
        closeBatchUpload();
      }, 300);
    });
  } else {
    closeBatchUpload();
  }
}

</script>
