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
              'disabled': item.uploadStatus === 'done',
            }]" v-tooltip="item.uploadStatus === 'done' ? '上傳完成無法取消' : '取消上傳'"
            @click="item.uploadStatus !== 'done' && item.abortController?.abort()">delete</i>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRootStore } from '@/stores/rootStore';
import { useResourceStore } from '@/stores/resourceStore';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { ResourceFile } from '@/stores/resourceStore';
import httpService from '@/services/http';
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
  attachmentId: string | null;
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
  abortController: AbortController | null;
}

const supportedFileTypes = [...imgFileTypes, ...pdfFileTypes, ...excelFileTypes, ...pptFileTypes, ...txtFileTypes, ...markdownFileTypes];

// 判斷是否為可 AI 解析入庫的類型（Excel / MD）
function isParseable(fileType: FileType): boolean {
  return fileType === 'EXCEL' || fileType === 'MD';
}

const aiviewerStore = useAiviewerStore();
const { getBlockTypeByFileMime, useIconFileTypes } = aiviewerStore;

const rootStore = useRootStore();
const resourceStore = useResourceStore();
const knowledgeStore = useKnowledgeStore();
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
    return { file, fileType, preview, uploadPercent: 0, attachmentId: null, uploadStatus: 'idle', abortController: null };
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

// 上傳完成後：比對同名檔案，決定更新版本或新增
const FILE_TYPE_MAP: Record<string, ResourceFile['fileType']> = {
  IMAGE: 'IMAGE', PDF: 'PDF', EXCEL: 'EXCEL', PPT: 'PPT',
  TXT: 'TXT', MARKDOWN: 'MD', WORD: 'WORD', HTML: 'HTML',
};

function buildNewResourceEntry(item: ChoicedFileItem): Omit<ResourceFile, 'version' | 'showMoreOption'> {
  return {
    id: `res-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    fileName: item.file.name,
    fileUrl: '',
    fileType: FILE_TYPE_MAP[item.fileType] ?? 'OTHER',
    processType: isParseable(item.fileType) ? 'AI_PARSED' : 'RAW',
    status: 'saved',
    creatorType: 'USER',
    ownerId: 'user1',
    ownerName: 'Current User',
    lastModify: new Date().toISOString().replace('T', ' ').slice(0, 16),
    knowledgeIds: [],
  };
}

function handlePostUpload() {
  const duplicates: Array<{ item: ChoicedFileItem; existing: ResourceFile }> = [];
  const newFiles: ChoicedFileItem[] = [];

  for (const item of choicedFiles.value) {
    const existing = resourceStore.resourceList.find(f => f.fileName === item.file.name) ?? null;
    if (existing) {
      duplicates.push({ item, existing });
    } else {
      newFiles.push(item);
    }
  }

  // 非重複的直接新增
  for (const item of newFiles) {
    resourceStore.addFile(buildNewResourceEntry(item));
  }

  if (duplicates.length === 0) return;

  const nameList = duplicates.map(d => `<strong>「${d.item.file.name}」</strong>`).join('<br>');
  popDialog.confirm(
    `<div class="text-center">
      <div class="fs-18 fw-600 mb-2">偵測到相似的既有檔案</div>
      <div class="fs-14 mb-3">以下檔案與共用檔案管理中的既有檔案同名：<br>${nameList}</div>
      <div class="fs-14 fc-grey-1">是否視為新版本，更新舊的檔案？<br><span class="fs-12">選擇「保留兩者」則另存為獨立新檔案。</span></div>
    </div>`,
    '更新舊檔案',
    '保留兩者',
    () => {
      // 確認：更新版本 + 標記 stale
      for (const { item, existing } of duplicates) {
        const updated = resourceStore.uploadNewVersion(existing.id);
        if (updated) {
          knowledgeStore.markFileStale(existing.id, updated.version);
        }
      }
      popDialog.toast('已更新為新版本，請至知識庫確認受影響的條目', 2500);
    },
    () => {
      // 取消：另存為新檔案
      for (const { item } of duplicates) {
        resourceStore.addFile(buildNewResourceEntry(item));
      }
    }
  );
}

// 開始上傳檔案
const totalSuccess = ref(0);

function checkBatchCompletion() {
  if (choicedFiles.value.every(f => f.uploadStatus === 'done' || f.uploadStatus === 'error')) {
    isBatchUploading.value = false;
    isBatchUploadSuccess.value = true;
    handlePostUpload();
  }
}

async function uploadOneFile(item: ChoicedFileItem) {
  // Step 1: 建立 attachment，取得上傳 URL
  let attachmentId: string;
  let uploadUrl: string;
  try {
    const res = await httpService.post<{ id: string; uploadUrl: string }>('/b/attachment/create', {
      fileName: item.file.name,
      fileType: item.fileType,
    });
    attachmentId = res.data.id;
    uploadUrl = res.data.uploadUrl;
    item.attachmentId = attachmentId;
  } catch {
    item.uploadStatus = 'error';
    checkBatchCompletion();
    return;
  }

  // Step 2: 直接 PUT 上傳至 S3（不走 http.ts，避免帶 auth header）
  const controller = new AbortController();
  item.abortController = controller;
  item.uploadStatus = 'uploading';

  const doUpload = async (url: string) => {
    await axios.put(url, item.file, {
      signal: controller.signal,
      headers: { 'Content-Type': item.file.type || 'application/octet-stream' },
      onUploadProgress: (e) => {
        if (e.total) {
          item.uploadPercent = Math.round((e.loaded / e.total) * 100);
        }
      },
    });
  };

  try {
    await doUpload(uploadUrl);
  } catch (err: any) {
    if (err?.code === 'ERR_CANCELED') {
      item.uploadStatus = 'error';
      checkBatchCompletion();
      return;
    }
    // Step 3: 失敗時取得新的上傳 URL 重試一次
    try {
      const retryRes = await httpService.get<{ uploadUrl: string }>(
        `/b/attachment/getUploadUrl?attachmentId=${attachmentId}`
      );
      item.abortController = new AbortController();
      await doUpload(retryRes.data.uploadUrl);
    } catch {
      item.uploadStatus = 'error';
      checkBatchCompletion();
      return;
    }
  }

  item.uploadPercent = 100;
  item.uploadStatus = 'done';
  item.abortController = null;
  totalSuccess.value += 1;
  checkBatchCompletion();
}

function onStartUpload() {
  isBatchUploading.value = true;
  isBatchUploadSuccess.value = false;
  choicedFiles.value.forEach(item => uploadOneFile(item));
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
      choicedFiles.value.forEach(item => item.abortController?.abort());

      setTimeout(() => {
        closeBatchUpload();
      }, 300);
    });
  } else {
    closeBatchUpload();
  }
}

</script>
