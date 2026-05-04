import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ResourceFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'PPT' | 'PDF' | 'EXCEL' | 'IMAGE' | 'HTML' | 'WORD' | 'MD' | 'TXT' | 'CHART' | 'OTHER';
  processType: 'RAW' | 'AI_PARSED';
  status: 'uploading' | 'parsing' | 'stored' | 'saved' | 'failed';
  creatorType: 'USER' | 'AI';
  ownerId: string;
  ownerName: string;
  lastModify: string;
  version: number;
  showMoreOption?: boolean;
}

export const useResourceStore = defineStore('resource', () => {
  const resourceList = ref<ResourceFile[]>([
    { showMoreOption: false, id: 'res1',  version: 1, fileName: '26W產品特色簡報.pptx',         fileUrl: '',                                         fileType: 'PPT',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res2',  version: 1, fileName: '25W產品銷售DM.pdf',             fileUrl: '',                                         fileType: 'PDF',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res3',  version: 1, fileName: 'UGG2025商品總表.xlsx',       fileUrl: '',                                         fileType: 'EXCEL', processType: 'AI_PARSED', status: 'stored',  creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res4',  version: 1, fileName: '25W產品特色搭配建議.pdf',       fileUrl: '',                                         fileType: 'PDF',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res5',  version: 1, fileName: '競品戶外涼鞋分析報告.html',     fileUrl: '',                                         fileType: 'HTML',  processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res6',  version: 1, fileName: 'DM設計用背景圖1.png',           fileUrl: 'https://picsum.photos/410/240.webp?random=10', fileType: 'IMAGE', processType: 'RAW',  status: 'saved',   creatorType: 'AI',   ownerId: 'AiAgent1', ownerName: 'Ai Agent', lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res7',  version: 1, fileName: 'DM設計用背景圖2.png',           fileUrl: 'https://picsum.photos/410/240.webp?random=11', fileType: 'IMAGE', processType: 'RAW',  status: 'saved',   creatorType: 'AI',   ownerId: 'AiAgent1', ownerName: 'Ai Agent', lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res8',  version: 1, fileName: '特殊材質名稱轉換清單.md',       fileUrl: '',                                         fileType: 'MD',    processType: 'AI_PARSED', status: 'parsing', creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res9',  version: 1, fileName: '特殊材質名稱轉換清單(新）.txt', fileUrl: '',                                         fileType: 'TXT',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res10', version: 1, fileName: '26W電商上架資訊包含SEO.docx',   fileUrl: '',                                         fileType: 'WORD',  processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res11', version: 1, fileName: '官網新用戶消費傾向分析.chart',  fileUrl: '',                                         fileType: 'CHART', processType: 'RAW',       status: 'saved',   creatorType: 'AI',   ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
    { showMoreOption: false, id: 'res12', version: 1, fileName: 'unknown.xyz',                  fileUrl: '',                                         fileType: 'OTHER', processType: 'RAW',       status: 'saved',   creatorType: 'AI',   ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00' },
  ]);

  function getFileById(id: string) {
    return resourceList.value.find(f => f.id === id) ?? null;
  }

  // 上傳新版本：版本號遞增，更新修改時間
  function uploadNewVersion(fileId: string): ResourceFile | null {
    const file = getFileById(fileId);
    if (!file) return null;
    file.version += 1;
    file.lastModify = new Date().toISOString().replace('T', ' ').slice(0, 16);
    return file;
  }

  function addFile(file: Omit<ResourceFile, 'version' | 'showMoreOption'>) {
    resourceList.value.unshift({ ...file, version: 1, showMoreOption: false });
  }

  function deleteFile(fileId: string) {
    const idx = resourceList.value.findIndex(f => f.id === fileId);
    if (idx !== -1) resourceList.value.splice(idx, 1);
  }

  return { resourceList, getFileById, uploadNewVersion, addFile, deleteFile };
});
