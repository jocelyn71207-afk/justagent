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

  // 主選單目前選擇的企業，預設選第一間，跟 testGroups 預設選第一個團隊的邏輯一致
  const nowMenuTreeCompanyId = ref('ugg');
  const nowMenuTreeCompanyName = ref<string>('UGG')

  // 使用者可切換的企業清單, 之後會改成從後端拿資料——先放兩間才能讓「企業→
  // 只看得到該企業的團隊」這條篩選邏輯有真實情境可以驗證，不是接了一個永遠只有
  // 一個選項、實際上測不出效果的假開關
  const companyList = ref([
    { id: 'ugg', name: 'UGG' },
    { id: 'orangeheart', name: '橙心' },
  ]);

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
  interface MenuTreeTeam {
    id: string;
    name: string;
    companyId: string; // 所屬企業，側邊選單的團隊切換器只會列出目前選定企業底下的團隊
    isSkillOpen: boolean; // 桌機/手機共用：「技能管理」群組的展開/收合
    isResourceOpen: boolean; // 桌機/手機共用：「共享資源庫」群組的展開/收合
  }
  const testGroups = ref<MenuTreeTeam[]>([
    {
      id: 'testTeam1',
      name: 'UGG電子商務',
      companyId: 'ugg',
      isSkillOpen: false,
      isResourceOpen: false,
    },
    {
      id: 'testTeam2',
      name: 'UGG實體門市',
      companyId: 'ugg',
      isSkillOpen: false,
      isResourceOpen: false,
    },
    {
      id: 'testTeam3',
      name: '橙心門市',
      companyId: 'orangeheart',
      isSkillOpen: false,
      isResourceOpen: false,
    }
  ]);

  return {
    isShowBatchUpload,
    isBatchUploading,
    isBatchUploadSuccess,

    isEnterAppSearchPage,
    projectListMode,
    appSearchKeyword,

    nowMenuTreeCompanyId,
    nowMenuTreeCompanyName,
    companyList,
    isShowBuserModal,

    testGroups,

    openBatchUploadFn,
  }
})
