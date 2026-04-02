import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface KnowledgeVersion {
  id: string;
  knowledgeId: string;
  versionNumber: string; // e.g. "v1.2"
  status: 'DRAFT' | 'REVIEWING' | 'PUBLISHED' | 'HISTORY' | 'REJECTED';
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  visibility?: 'ALL' | 'TEAM' | 'MANAGERS'; // 可見範圍
  lastUpdateBy: string;
  lastUpdateTime: string;
  updateNote: string; // 本次更新說明
  sourceFiles?: string[]; // 關聯來源檔案 ID
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  currentVersion: string; // 當前發布的版本號
  status: 'PUBLISHED' | 'REVIEWING' | 'DRAFT' | 'REJECTED';
  lastUpdateTime: string;
  lastUpdateBy: string;
  versions: KnowledgeVersion[];
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  // --- 假資料 ---
  const knowledgeList = ref<KnowledgeItem[]>([
    {
      id: 'k1',
      title: '會員等級規則設定',
      category: '商務規則',
      currentVersion: 'v1.2',
      status: 'PUBLISHED',
      lastUpdateTime: '2026-03-15 10:30',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'v1.0',
          knowledgeId: 'k1',
          versionNumber: 'v1.0',
          status: 'HISTORY',
          title: '會員等級規則設定',
          summary: '初始版本會員規則',
          content: '這是 v1.0 的內容...',
          category: '商務規則',
          tags: ['會員', '等級'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2026-01-01 09:00',
          updateNote: '初始建立',
        },
        {
          id: 'v1.1',
          knowledgeId: 'k1',
          versionNumber: 'v1.1',
          status: 'HISTORY',
          title: '會員等級規則設定',
          summary: '調整積分權重',
          content: '這是 v1.1 的內容...',
          category: '商務規則',
          tags: ['會員', '等級'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2026-02-01 14:00',
          updateNote: '優化積分計算邏輯',
        },
        {
          id: 'v1.2',
          knowledgeId: 'k1',
          versionNumber: 'v1.2',
          status: 'PUBLISHED',
          title: '會員等級規則設定',
          summary: '目前正式版的會員等級定義',
          content: '### 會員等級說明\n1. 普通會員：註冊即享\n2. 黃金會員：消費滿 1000\n3. 鑽石會員：消費滿 5000',
          category: '商務規則',
          tags: ['會員', '等級', '正式版'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-03-15 10:30',
          updateNote: '發布 2026 第一季規則',
        }
      ]
    },
    {
      id: 'k2',
      title: '後台角色權限說明',
      category: '系統文件',
      currentVersion: 'v2.0',
      status: 'REVIEWING',
      lastUpdateTime: '2026-04-01 11:00',
      lastUpdateBy: 'Rita',
      versions: [
        {
          id: 'v2.0-review',
          knowledgeId: 'k2',
          versionNumber: 'v2.0',
          status: 'REVIEWING',
          title: '後台角色權限說明 (新版)',
          summary: '重構權限體系後的說明文件',
          content: '這是一份關於新版權限體系的詳細說明...',
          category: '系統文件',
          tags: ['權限', '安全'],
          lastUpdateBy: 'Rita',
          lastUpdateTime: '2026-04-01 11:00',
          updateNote: '大版本升級，移除舊有角色',
        }
      ]
    },
    {
      id: 'k3',
      title: '客服 FAQ：退貨流程',
      category: '客服知識',
      currentVersion: 'v1.0',
      status: 'DRAFT',
      lastUpdateTime: '2026-04-01 15:00',
      lastUpdateBy: 'Jocelyn',
      versions: [
        {
          id: 'v1.0-draft',
          knowledgeId: 'k3',
          versionNumber: 'v1.0',
          status: 'DRAFT',
          title: '客服 FAQ：退貨流程',
          summary: '草擬退貨 SOP',
          content: '1. 收到申請\n2. 審核照片\n3. 安排退貨...',
          category: '客服知識',
          tags: ['客服', '退貨'],
          lastUpdateBy: 'Jocelyn',
          lastUpdateTime: '2026-04-01 15:00',
          updateNote: '初始草稿',
        }
      ]
    }
  ]);

  // --- Actions ---

  // 取得單一項目及其所有版本
  const getKnowledgeById = (id: string) => knowledgeList.value.find(k => k.id === id);

  // 取得特定版本
  const getVersionById = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    return k?.versions.find(v => v.id === versionId);
  };

  // 建立新草稿 (基於已發布版本)
  const createDraftFromPublished = (knowledgeId: string, type: 'MINOR' | 'MAJOR', updateNote: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;

    const published = k.versions.find(v => v.status === 'PUBLISHED');
    if (!published) return;

    // 計算新版本號
    const currentNum = published.versionNumber; // e.g. "v1.2"
    const [major, minor] = currentNum.replace('v', '').split('.').map(Number);
    const newNum = type === 'MAJOR' ? `v${major + 1}.0` : `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(published)),
      id: `${newNum}-draft-${Date.now()}`,
      versionNumber: newNum,
      status: 'DRAFT',
      lastUpdateBy: 'Current User', // 正常應從 userStore 拿
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updateNote: updateNote,
    };

    k.versions.push(newVersion);
    k.status = 'DRAFT';
    return newVersion.id;
  };

  // 儲存草稿
  const saveDraft = (knowledgeId: string, versionId: string, data: Partial<KnowledgeVersion>) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && v.status === 'DRAFT') {
      Object.assign(v, data);
      v.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
      k.lastUpdateTime = v.lastUpdateTime;
    }
  };

  // 送審
  const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
    console.log('送審給:', reviewerId, '備註:', note);
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && (v.status === 'DRAFT' || v.status === 'REJECTED')) {
      v.status = 'REVIEWING';
      k.status = 'REVIEWING';
    }
  };

  // 還原舊版本 (建立為新草稿)
  const restoreToDraft = (knowledgeId: string, versionId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const oldVersion = k.versions.find(ver => ver.id === versionId);
    if (!oldVersion) return;

    // 基於當前發布版本號遞增
    const published = k.versions.find(v => v.status === 'PUBLISHED');
    const baseNum = published ? published.versionNumber : oldVersion.versionNumber;
    const [major, minor] = baseNum.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(oldVersion)),
      id: `${newNum}-restore-${Date.now()}`,
      versionNumber: newNum,
      status: 'DRAFT',
      updateNote: `還原自 ${oldVersion.versionNumber}：${note}`,
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    k.versions.push(newVersion);
    k.status = 'DRAFT';
    return newVersion.id;
  };

  // 從共用檔案建立新的知識條目草稿
  const createFromFile = (params: {
    fileId: string;
    fileName: string;
    template: string;
    content: string;
  }) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const baseName = params.fileName.replace(/\.[^.]+$/, '');

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: baseName,
      category: '',
      currentVersion: 'v1.0',
      status: 'DRAFT',
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        status: 'DRAFT',
        title: baseName,
        summary: `由「${params.fileName}」生成的知識條目草稿`,
        content: params.content,
        category: '',
        tags: [],
        visibility: 'ALL',
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從共用檔案「${params.fileName}」建立，使用模板：${params.template}`,
        sourceFiles: [params.fileId],
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };

  return {
    knowledgeList,
    getKnowledgeById,
    getVersionById,
    createDraftFromPublished,
    createFromFile,
    saveDraft,
    submitForReview,
    restoreToDraft
  };
});
