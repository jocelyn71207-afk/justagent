import { defineStore } from 'pinia';
import { ref } from 'vue';

// 來源檔案參照：記錄關聯時的版本號，以便偵測更新
export interface SourceFileRef {
  fileId: string;
  fileName: string;
  linkedVersion: number; // 建立/上次同步時的檔案版本號
}

export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

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
  sourceFiles?: SourceFileRef[]; // 關聯來源檔案（含版本追蹤）
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
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
  sourceStale?: boolean;       // 有來源檔案已更新，尚未處理
  staleSourceFileIds?: string[]; // 哪些來源檔案觸發了 stale
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  // --- 假資料 ---
  const knowledgeList = ref<KnowledgeItem[]>([
    {
      id: 'k1',
      title: '2025產品總表-Q3',
      category: '商品文件',
      currentVersion: 'v1.2',
      status: 'PUBLISHED',
      lastUpdateTime: '2025-08-13 10:30',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'v1.0',
          knowledgeId: 'k1',
          versionNumber: 'v1.0',
          status: 'HISTORY',
          title: '2025產品總表-Q1',
          summary: '2025延續品',
          content: '這是 v1.0 的內容...',
          category: '商品文件',
          tags: ['產品'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2025-01-01 09:00',
          updateNote: '初始建立',
        },
        {
          id: 'v1.1',
          knowledgeId: 'k1',
          versionNumber: 'v1.1',
          status: 'HISTORY',
          title: '2025產品總表-Q2',
          summary: '新增Q2選品資料',
          content: '這是 v1.1 的內容...',
          category: '商品文件',
          tags: ['產品'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2025-03-01 14:00',
          updateNote: '新增Q2選品資料(含延續款調整）',
        },
        {
          id: 'v1.2',
          knowledgeId: 'k1',
          versionNumber: 'v1.2',
          status: 'PUBLISHED',
          title: '2025產品總表-Q3',
          summary: '新增Q3選品資料',
          content: '## Teva 鞋款庫存資料\n\n| Model | SC | 年份 | 系列 | 類別 | 子類 | 鞋型 | 價格 | 銷售日期 | 銷售量 | ... |\n|-------|----|------|------|------|------|------|------|----------|--------|-----|\n| TV4038BKBR | TV | 4038BKBR | 2011F | Forge Pro eVent Ms | Performance | Trail | Performance Shoe | 4980 | 20110722 | 234 |\n| TV4038BNGC | TV | 4038BNGC | 2011F | Forge Pro eVent Ms | Performance | Trail | Performance Shoe | 4980 | 20110824 | 252 |\n| TV4045LURK | TV | 4045LURK | 2011F | Forge Pro eVent Ws | Performance | Trail | Performance Shoe | 4980 | 20110816 | 144 |',
          category: '商品文件',
          tags: ['產品'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-08-13 10:30',
          updateNote: '更新為 Teva 鞋款庫存資料',
          sourceFiles: [{ fileId: 'res3', fileName: 'Teva2025商品總表.xlsx', linkedVersion: 1 }],
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
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && (v.status === 'DRAFT' || v.status === 'REJECTED')) {
      v.status = 'REVIEWING';
      v.reviewNote = note;
      v.reviewHistory = [
        ...(v.reviewHistory ?? []),
        {
          action: 'SUBMITTED',
          by: reviewerId,
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note,
        },
      ];
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

  const approveVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'REVIEWING') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Previous PUBLISHED version becomes HISTORY
    for (const ver of k.versions) {
      if (ver.status === 'PUBLISHED') ver.status = 'HISTORY';
    }

    v.status = 'PUBLISHED';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    k.status = 'PUBLISHED';
    k.currentVersion = v.versionNumber;
    k.lastUpdateTime = now;
  };

  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'REVIEWING') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'REJECTED';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'REJECTED';
  };

  const withdrawReview = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'REVIEWING') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'DRAFT';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'DRAFT';
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
        sourceFiles: [{ fileId: params.fileId, fileName: params.fileName, linkedVersion: 1 }],
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };

  // 來源檔案更新後，將關聯此檔案的所有知識條目標記為 stale
  function markFileStale(fileId: string, newVersion: number) {
    for (const k of knowledgeList.value) {
      const activeVersion = k.versions.find(v => v.status === 'PUBLISHED' || v.status === 'REVIEWING' || v.status === 'DRAFT');
      if (!activeVersion?.sourceFiles) continue;
      const isLinked = activeVersion.sourceFiles.some(
        ref => ref.fileId === fileId && ref.linkedVersion < newVersion
      );
      if (isLinked) {
        k.sourceStale = true;
        k.staleSourceFileIds = [...(k.staleSourceFileIds ?? []).filter(id => id !== fileId), fileId];
      }
    }
  }

  // 建立來源更新草稿（AI 根據新版檔案產生）
  function createDraftFromSourceUpdate(
    knowledgeId: string,
    getFile: (id: string) => { version: number; fileName: string } | null
  ): string | undefined {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;

    const base = k.versions.find(v => v.status === 'PUBLISHED') ?? k.versions[k.versions.length - 1];
    const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    // 更新 sourceFiles 的 linkedVersion 到最新
    const updatedSourceFiles = (base.sourceFiles ?? []).map(ref => {
      const file = getFile(ref.fileId);
      return file ? { ...ref, linkedVersion: file.version } : ref;
    });

    const staleFileNames = (k.staleSourceFileIds ?? [])
      .map(id => getFile(id)?.fileName ?? id)
      .join('、');

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(base)),
      id: `${newNum}-source-update-${Date.now()}`,
      versionNumber: newNum,
      status: 'DRAFT',
      updateNote: `根據來源檔案更新（${staleFileNames}）由 AI 自動建立草稿`,
      lastUpdateBy: 'AI 生成',
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceFiles: updatedSourceFiles,
    };

    k.versions.push(newVersion);
    k.status = 'DRAFT';
    k.sourceStale = false;
    k.staleSourceFileIds = [];
    return newVersion.id;
  }

  // 稍後處理：清除 stale 標記（不建立草稿）
  function dismissSourceStale(knowledgeId: string) {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    k.sourceStale = false;
    k.staleSourceFileIds = [];
  }

  return {
    knowledgeList,
    getKnowledgeById,
    getVersionById,
    createDraftFromPublished,
    createFromFile,
    saveDraft,
    submitForReview,
    restoreToDraft,
    approveVersion,
    rejectVersion,
    withdrawReview,
    markFileStale,
    createDraftFromSourceUpdate,
    dismissSourceStale,
  };
});
