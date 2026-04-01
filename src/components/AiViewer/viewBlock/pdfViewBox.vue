<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined loading-spinner">progress_activity</i>
    PDF 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    PDF 載入失敗
  </div>

  <div class="pdfViewBox" v-if="totalPages > 0">
    <div class="pdf-pageNumber-box">
      <i :class="['material-symbols-outlined', { disabled: currentPage === 1 || isRendering}]"
        @click="renderPDFPage(currentPage-1)">keyboard_arrow_left</i>
      <i :class="['material-symbols-outlined', { disabled: currentPage === totalPages || isRendering}]"
        @click="renderPDFPage(currentPage+1)">keyboard_arrow_right</i>
      <span>{{ currentPage }} / {{ totalPages }}</span>
    </div>
    <canvas :id="canvasId"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  const props = defineProps({
    isFullView: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    source: {
      type: Object,
      required: true
    }
  });

  // 定義 emit
  const emit = defineEmits<{
    (e: 'failure', value: boolean): void
  }>();

  const canvasId = (props.isFullView) ? `Full_pdfView${props.id}` : `pdfView${props.id}`;

  let currentPdf: any = null; // 儲存當前的 PDF 物件
  const currentPage = ref(1);
  const totalPages = ref(0);
  const isloading = ref(false);
  const isFailure = ref(false);
  const isRendering = ref(false); // 是否正在渲染頁面

  // 載入 PDF 的 data (Uint8Array格式)
  async function loadPDF(data: any) {
    try {
      const loadingTask = window.pdfjsLib.getDocument(data); // data 是 Uint8Array, 透過 pdf.js 解析
      currentPdf = await loadingTask.promise;
      totalPages.value = currentPdf.numPages;
      currentPage.value = 1;
      await renderPDFPage(1);
    } catch (error) {
      console.error('load PDF data 失敗:', error);
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
    }
  }
  // 渲染 PDF 頁面到 canvas
  async function renderPDFPage(pageNum: number) {
    if (pageNum < 1 || pageNum > totalPages.value) {
      // console.warn('頁碼超出範圍');
      return;
    }
    if (!currentPdf) return;
    if (isRendering.value) return; // 避免快數點擊

    isRendering.value = true;
    try {
      currentPage.value = pageNum;
      const page = await currentPdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      console.log('getViewport >>> ', viewport);

      // 建立暫存 Canvas
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement || document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 使用 pdf.js 渲染到暫存 Canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      isloading.value = false;
      await page.render(renderContext).promise;
      isRendering.value = false;
    } catch (error) {
      console.error('render PDF page 失敗:', error);
      isloading.value = false;
      isFailure.value = true;
      isRendering.value = false;
      emit('failure', true);
    }
  }
  // fetch PDF 檔案
  async function fetchPdfFile() {
    isloading.value = true;
    currentPdf = null;
    currentPage.value = 1;
    totalPages.value = 0;
    try {
      const response = await fetch(props.source.data.fileUrl);
      if (!response.ok) {
        throw new Error('無法載入 PDF 檔案');
      }

      const arrayBuffer = await response.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      await loadPDF(typedArray);
    } catch (error) {
      console.error('載入 PDF 檔案失敗:', error);
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
    }
  }

  onMounted(() => {
    fetchPdfFile();
  });
</script>
