import { ref } from 'vue'
import { defineStore } from 'pinia'
import popDialog from '@/services/popDialog';

export const useRootStore = defineStore('rootStore', () => {

  const isShowBatchUpload = ref(false); // 是否顯示批次上傳的組件
  const isBatchUploading = ref(false); // 是否正在批次上傳中
  const isBatchUploadSuccess = ref(false); // 批次上傳是否成功

  const isEnterAppSearchPage = ref(false); // 是否進入通用性查詢結果介面
  const appSearchKeyword = ref(''); // 通用性查詢關鍵字

  const projectListMode = ref<'list' | 'card'>('card'); // 專案列表的顯示模式

  const nowMenuTreeCompanyId = ref(''); // 主選單目前選擇的公司 ID
  const nowMenuTreeCompanyName = ref<string>('Teva')

  const isShowBuserModal = ref(false); // 是否顯示 Buser Modal

  // 打開批次上傳組件
  function openBatchUploadFn() {
    // 是否正在批次上傳中，且尚未成功
    if (isBatchUploading.value && !isBatchUploadSuccess.value) {
      popDialog.alert('目前有一批資料正在上傳中，請稍後再試，或取消當前上傳的任務後再進行新的上傳。');
      return
    }
    // 如果已經顯示批次上傳組件了
    if (isShowBatchUpload.value && isBatchUploadSuccess.value) {
      popDialog.alert('請先關閉上一次批次上傳的介面。');
      return
    }
    isShowBatchUpload.value = true;
  }

  // 測試 menutree 用的團隊列表, 之後會改成從後端拿資料
  const testGroups = ref([
    {
    id: 'testTeam1',
      name: 'Teva電子商務',
      isOpen: false,
    },
    {
      id: 'testTeam2',
      name: 'Teva實體門市',
      isOpen: false,
    }
  ]) as any;

  return {
    isShowBatchUpload,
    isBatchUploading,
    isBatchUploadSuccess,

    isEnterAppSearchPage,
    projectListMode,
    appSearchKeyword,

    nowMenuTreeCompanyId,
    nowMenuTreeCompanyName,
    isShowBuserModal,

    testGroups,

    openBatchUploadFn,
  }
})
