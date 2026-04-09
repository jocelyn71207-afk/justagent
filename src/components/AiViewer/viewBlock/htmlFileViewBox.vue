<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined loading-spinner">progress_activity</i>
    HTML 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    HTML 載入失敗
  </div>

  <div class="htmlFileViewBox" v-show="!isloading && !isFailure" :id="'viewBox'+props.id">
    <iframe ref="iframeRef" title="" sandbox="allow-popups allow-scripts allow-same-origin"
      :src="props.source.data.fileUrl"></iframe>
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

  const isloading = ref(false);
  const isFailure = ref(false);

  const iframeRef = ref<HTMLIFrameElement | null>(null);

  onMounted(() => {
    isloading.value = true;

    // 檢查是否為 html 檔案
    if (!props.source.data.fileUrl.endsWith('.html') &&
        !props.source.data.fileUrl.endsWith('.htm')) {
      console.warn('HTML 檔案類型不支援:', props.source.data.fileUrl);
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
      return;
    }

    // iframe 載入完成 (iframe無法知道成功失敗)
    iframeRef.value?.addEventListener('load', () => {
      isloading.value = false;
    });
  })


  // TODO... 測試 html 轉 pdf 下載
  async function testDownloadHtmlToPDF() {
    try {
      const response = await fetch(props.source.data.fileUrl);
      const htmlContent = await response.text();
      // console.log('htmlContent >>> ', htmlContent);
      window.html2pdf().set({
        // pagebreak: { mode: 'avoid-all', before: '#page2el' },
        // html2canvas: { scale: 2, dpi: 192, letterRendering: true, allowTaint: true },
        jsPDF: {
          unit: 'in',
          format: 'a3',
          orientation: 'landscape',
          putOnlyUsedFonts: true
        }
      }).from(htmlContent).save();

      // TODO... 原本想直接讀 iframe 內容轉 pdf, 但好像不行
      // window.html2pdf().set({
      //   html2canvas: {
      //     scale: 2,
      //     useCORS: true,
      //   },
      // }).from(iframeRef.value).save();

    } catch (error) {
      console.error('html 轉 pdf 失敗:', error);
      return;
    }

  //   // 使用 jsPDF 和 html2canvas 進行轉換
  //   import('jspdf').then(({ jsPDF }) => {
  //     import('html2canvas').then(({ default: html2canvas }) => {
  //       const pdf = new jsPDF('p', 'pt', 'a4');
  //       html2canvas(iframeDoc.body).then((canvas) => {
  //         const imgData = canvas.toDataURL('image/png');
  //         const imgProps = pdf.getImageProperties(imgData);
  //         const pdfWidth = pdf.internal.pageSize.getWidth();
  //         const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  //         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  //         pdf.save(`converted_${props.id}.pdf`);
  //       });
  //     });
  //   });


  }

</script>
