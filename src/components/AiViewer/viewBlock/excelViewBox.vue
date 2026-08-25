<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined loading-spinner">progress_activity</i>
    Excel 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    Excel 載入失敗
  </div>

  <div class="excelViewBox">
    <div :id="excelId"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { storeToRefs } from 'pinia'
  import { useAiviewerStore } from '@/stores/AiViewerStore';

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
    },
    contentBoxDOM: {
      type: [Object, null],
      required: true
    }
  });

  // 定義 emit
  const emit = defineEmits<{
    (e: 'failure', value: boolean): void
  }>();

  const aiviewerStore = useAiviewerStore();
  const { isTouchDevice } = storeToRefs(aiviewerStore);

  const isloading = ref(false);
  const isFailure = ref(false);
  const excelId = (props.isFullView) ? `Full_excelView${props.id}` : `excelView${props.id}`;

  let excelObj: any = null; // excel 物件 (注意不能用 ref 用了套件切換 sheet 會報錯)
  // 讓外部可以存取 excelObj
  // 暴露 getter 函數
  defineExpose<{
    getExcelObj: () => any
  }>({
    getExcelObj: () => excelObj
  });

  // fetch excel 網址
  async function fetchExcelUrl() {
    isloading.value = true;
    isFailure.value = false;
    document.getElementById(excelId)!.innerHTML = ''; // 清空內容
    try {
      const response = await fetch(props.source.data.fileUrl);
      if (!response.ok) {
        isloading.value = false;
        isFailure.value = true;
        emit('failure', true);
        throw new Error('無法下載 Excel 檔案');
      }

      const arrayBuffer = await response.arrayBuffer();
      // 將 ArrayBuffer 轉成 binary string
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      excelDataToSheet(binary);
    } catch (error) {
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
      console.error('載入 Excel 網址失敗:', error);
    }
  }

  // 將 excel 資料轉成 x-data-spreadsheet 的 sheet
  function excelDataToSheet(data: any) {
    if (data) {
      const workbook = window.XLSX.read(data, { type: 'binary' });

      // 銷毀舊的 excel 物件
      if (excelObj) {
        excelObj = null;
      }

      // 調整 excel 表格顯示區域大小
      const options = props.source.options || {};
      options.view = {
        height: () => {
          const H = props.contentBoxDOM!.clientHeight - 35; // TODO... 預留 scrollbar 空間,之後再調整先寫死
          return H;
        },
        width: () => {
          const W = props.contentBoxDOM!.clientWidth - 20; // TODO... 預留 scrollbar 空間,之後再調整先寫死
          return W;
        }
      };

      // 先建立 excelObj
      excelObj = window.x_spreadsheet(`#${excelId}`, options);

      // 轉換所有 sheet
      const sheetsData: any[] = [];
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // 依照資料面決定要設定多少的列跟欄
        let maxRow = 0;
        let maxCol = 0;
        jsonData.forEach((item: any, index: number) => {
          maxRow = Math.max(maxRow, index);
          maxCol = Math.max(maxCol, item.length);
        });
        // 組成 x_spreadsheet 格式
        const sheetData: any = {
          name: sheetName,
          rows: {},
          cols: {},
        };
        jsonData.forEach((row: any[], rIndex: number) => {
          sheetData.rows[rIndex] = { cells: {} };
          row.forEach((cellValue: any, cIndex: number) => {
            sheetData.rows[rIndex].cells[cIndex] = { text: cellValue };
          });
        });
        // 設定行列數
        sheetData.rows.len = Math.max(maxRow + 1, 100);
        sheetData.cols.len = Math.max(maxCol + 1, 26);
        sheetsData.push(sheetData);
      });

      // 載入所有 sheet
      excelObj.loadData(sheetsData);
      excelObj.validate();
      isloading.value = false;
      isFailure.value = false;

      // 測試套件的事件回呼
      // 事件:每一次異動資料時都會觸發
      // excelObj.change((data: any) => {
      //   console.log('change data 套件當前資料: ', data);
      // });
      // 選則格子開始時呼叫 (mousedown 時就會觸發)
      // excelObj.on('cell-selected', (cell: any, ri: any, ci: any) => {
      //   console.log('cell-selected', cell, ri, ci);
      // });
      // // 選則格子(支援多個格子)結束時呼叫 (mousemove 時觸發)
      // excelObj.on('cells-selected', (cell: any, t: any) => {
      //   console.log('cells-selected', cell, t);
      // });
      // // edited on cell
      // excelObj.on('cell-edited', (text: any, ri: any, ci: any) => {
      //   console.log('cell-edited', text, ri, ci);
      // });
    }
  }


  onMounted(() => {
    fetchExcelUrl();
  })
</script>
