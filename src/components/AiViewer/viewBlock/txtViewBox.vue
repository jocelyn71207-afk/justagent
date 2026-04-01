<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined">progress_activity</i>
    Txt 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    Txt 載入失敗
  </div>

  <div class="txtViewBox" v-if="txtContent">
    <!-- {{ txtContent }} -->
    <textarea class="custom-textarea" readonly spellcheck="false"
      v-model="txtContent">
    </textarea>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  const props = defineProps({
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

  const txtContent = ref('');

  // 支援的純文字 MIME types
  const supportedTextTypes = [
    'text/plain',
    'text/plain; charset=utf-8',
    'text/plain; charset=UTF-8',
    'application/octet-stream', // 有時 .txt 會被識別為這個
  ];

  // fetch file 網址
  async function fetchFileUrl() {
    isloading.value = true;

    try {
      const response = await fetch(props.source.data.fileUrl);
      if (!response.ok) {
        throw new Error('無法下載 TXT 檔案');
      }

      // 1. 檢查 Content-Type
      const contentType = response.headers.get('Content-Type') || '';

      // 2. 檢查是否為純文字格式
      const isTextFile = supportedTextTypes.some(type =>
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isTextFile) {
        // 如果不是純文字，但副檔名是 .txt，還是嘗試讀取
        const url = props.source.data.fileUrl.toLowerCase();
        if (!url.endsWith('.txt')) {
          throw new Error(`不支援的檔案類型: ${contentType}`);
        }
        console.warn('Content-Type 不是純文字，但副檔名是 .txt，嘗試讀取');
      }

      // 3. 讀取內容
      const textData = await response.text();

      // 4. 檢查內容是否包含過多的不可見字元（可能是二進位檔案）
      const binaryCharCount = (textData.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;
      const binaryRatio = binaryCharCount / textData.length;

      if (binaryRatio > 0.3) {
        throw new Error('檔案內容似乎不是純文字（包含過多二進位字元）');
      }

      // 5. 限制檔案大小顯示（避免太大的檔案卡住）
      // const maxDisplayLength = 100000; // 最多顯示 10 萬字元
      // if (textData.length > maxDisplayLength) {
      //   txtContent.value = textData.substring(0, maxDisplayLength) + '\n\n... (檔案過大，僅顯示前 10 萬字元)';
      // } else {
      //   txtContent.value = textData;
      // }

      txtContent.value = textData;
      isloading.value = false;

    } catch (error) {
      console.error('載入 TXT 失敗:', error);
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
    }
  }

  onMounted(() => {
    fetchFileUrl();
  });
</script>
