import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ItemStatus =
  | 'pending'
  | 'processing'
  | 'reviewing'
  | 'active'
  | 'needs_update'
  | 'failed'
  | 'archived'

export type VersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'
export type VersionType = 'MAJOR' | 'MINOR'
export type PipelineStage = 'chunking' | 'embedding' | 'indexing'
export type SourceType = 'FILE' | 'API' | 'MANUAL'

export interface ApiSourceHeader {
  key: string
  value: string
}

export interface WizardPayload {
  url: string
  authorization: string
  method: 'GET' | 'POST'
  headers: ApiSourceHeader[]
  body: string
  titleField: string
  contentField: string
  name: string
  category: string
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
}

export interface ApiSource {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST'
  headers: ApiSourceHeader[]
  body: string
  titleField: string
  contentField: string
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
  enabled: boolean
  lastSyncAt: string | null
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null
  lastSyncCount: number
  lastSyncError: string | null
}

export interface SourceFileRef {
  fileId: string
  fileName: string
  linkedVersion: number
}

export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

export interface ChunkPreview {
  index: number
  content: string
  tokenCount: number
}

export interface KnowledgeVersion {
  id: string
  knowledgeId: string
  versionNumber: string
  versionType: VersionType | null
  status: VersionStatus
  title: string
  summary: string
  content: string
  tags: string[]
  systemTags: string[]
  lastUpdateBy: string
  lastUpdateTime: string
  updateNote: string
  sourceFiles: SourceFileRef[]
  chunks: ChunkPreview[]
  embeddingModel: string | null
  embeddingDimension: number | null
  embeddingCount: number
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
}

export interface KnowledgeItem {
  id: string
  title: string
  category: string
  status: ItemStatus
  sourceType: SourceType
  pipelineProgress: number
  pipelineStage: PipelineStage | null
  pipelineError: string | null
  sourceStale: boolean
  staleSourceFileIds: string[]
  lastSyncAt: string | null
  apiSourceId: string | null
  apiSourceName: string | null
  versions: KnowledgeVersion[]
  lastUpdateTime: string
  lastUpdateBy: string
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  // --- 假資料 ---
  const knowledgeList = ref<KnowledgeItem[]>([
    {
      id: 'k1',
      title: '2025產品總表-Q3',
      category: '商品文件',
      status: 'active',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2025-08-13 10:30',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'k1-v1.0',
          knowledgeId: 'k1',
          versionNumber: 'v1.0',
          versionType: null,
          status: 'history',
          title: '2025產品總表-Q1',
          summary: '2025延續品',
          content: '這是 v1.0 的內容...',
          tags: ['產品'],
          systemTags: [],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2025-01-01 09:00',
          updateNote: '初始建立',
          sourceFiles: [],
          chunks: [],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 5,
        },
        {
          id: 'k1-v1.2',
          knowledgeId: 'k1',
          versionNumber: 'v1.2',
          versionType: 'MINOR',
          status: 'active',
          title: '2025產品總表-Q3',
          summary: '新增Q3選品資料',
          content: '## UGG 鞋款庫存資料\n\n| Model | SC | 年份 |\n|---|---|---|\n| TV4038BKBR | TV | 2011F |',
          tags: ['產品'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-08-13 10:30',
          updateNote: '更新為 UGG 鞋款庫存資料',
          sourceFiles: [{ fileId: 'res3', fileName: 'UGG2025商品總表.xlsx', linkedVersion: 1 }],
          chunks: [
            { index: 1, content: 'UGG 鞋款庫存資料...', tokenCount: 312 },
            { index: 2, content: 'TV4038BKBR 冬季款...', tokenCount: 287 },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k2',
      title: '後台角色權限說明',
      category: '系統文件',
      status: 'reviewing',
      sourceType: 'MANUAL',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-04-01 11:00',
      lastUpdateBy: 'Rita',
      versions: [
        {
          id: 'k2-v2.0',
          knowledgeId: 'k2',
          versionNumber: 'v2.0',
          versionType: 'MAJOR',
          status: 'reviewing',
          title: '後台角色權限說明 (新版)',
          summary: '重構權限體系後的說明文件',
          content: '這是一份關於新版權限體系的詳細說明...',
          tags: ['權限', '安全'],
          systemTags: ['系統文件'],
          lastUpdateBy: 'Rita',
          lastUpdateTime: '2026-04-01 11:00',
          updateNote: '大版本升級，移除舊有角色',
          sourceFiles: [],
          chunks: [],
          embeddingModel: null,
          embeddingDimension: null,
          embeddingCount: 0,
        },
      ],
    },
    {
      id: 'k3',
      title: '客服 FAQ：退貨流程',
      category: '客服知識',
      status: 'processing',
      sourceType: 'FILE',
      pipelineProgress: 60,
      pipelineStage: 'embedding',
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-04-01 15:00',
      lastUpdateBy: 'Jocelyn',
      versions: [
        {
          id: 'k3-v1.0',
          knowledgeId: 'k3',
          versionNumber: 'v1.0',
          versionType: null,
          status: 'draft',
          title: '客服 FAQ：退貨流程',
          summary: '草擬退貨 SOP',
          content: '1. 收到申請\n2. 審核照片\n3. 安排退貨...',
          tags: ['客服', '退貨'],
          systemTags: [],
          lastUpdateBy: 'Jocelyn',
          lastUpdateTime: '2026-04-01 15:00',
          updateNote: '初始草稿',
          sourceFiles: [],
          chunks: [],
          embeddingModel: null,
          embeddingDimension: null,
          embeddingCount: 0,
        },
      ],
    },
    {
      id: 'k4',
      title: '信用卡申辦資格說明',
      category: '產品資訊',
      status: 'needs_update',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: true,
      staleSourceFileIds: ['res-cc-1'],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-04-12 09:00',
      lastUpdateBy: 'Alice',
      versions: [
        {
          id: 'k4-v1.3',
          knowledgeId: 'k4',
          versionNumber: 'v1.3',
          versionType: 'MINOR',
          status: 'active',
          title: '信用卡申辦資格說明',
          summary: '說明各卡種申辦條件',
          content: '## 申辦資格\n\n年滿 20 歲，年收入 30 萬以上...',
          tags: ['信用卡', '申辦'],
          systemTags: ['產品資訊'],
          lastUpdateBy: 'Alice',
          lastUpdateTime: '2026-04-12 09:00',
          updateNote: '更新年收入門檻',
          sourceFiles: [{ fileId: 'res-cc-1', fileName: '信用卡申辦規則_2026Q1.pdf', linkedVersion: 1 }],
          chunks: [
            { index: 1, content: '申辦資格：年滿 20 歲...', tokenCount: 198 },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 1,
        },
      ],
    },
    {
      id: 'k5',
      title: '商品目錄即時資料',
      category: '商品文件',
      status: 'active',
      sourceType: 'API',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: '2026-04-12 09:00',
      apiSourceId: 'api-1',
      apiSourceName: '商品目錄 API',
      lastUpdateTime: '2026-04-12 09:00',
      lastUpdateBy: 'API 同步',
      versions: [
        {
          id: 'k5-v3.0',
          knowledgeId: 'k5',
          versionNumber: 'v3.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '商品目錄即時資料',
          summary: '補充夏季選品 4 筆',
          content: '# 商品目錄（2026-04-12 最新）\n\n...',
          tags: ['商品', 'API'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-04-12 09:00',
          updateNote: 'API 自動同步',
          sourceFiles: [],
          chunks: [],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 8,
        },
      ],
    },
  ]);

  const apiSources = ref<ApiSource[]>([
    {
      id: 'api-1',
      name: '商品目錄 API',
      url: 'https://api.example.com/products',
      method: 'GET',
      headers: [{ key: 'Authorization', value: 'Bearer demo-token' }],
      body: '',
      titleField: 'productName',
      contentField: 'description',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-04-12 09:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 5,
      lastSyncError: null,
    },
    {
      id: 'api-2',
      name: '庫存狀態 API',
      url: 'https://erp.internal/inventory',
      method: 'POST',
      headers: [{ key: 'X-API-Key', value: 'erp-key-456' }],
      body: '{"storeId": "TW001"}',
      titleField: 'itemName',
      contentField: 'stockInfo',
      schedule: 'MANUAL',
      enabled: false,
      lastSyncAt: '2026-04-10 14:30',
      lastSyncStatus: 'FAILED',
      lastSyncCount: 0,
      lastSyncError: '連線逾時：無法連接至 erp.internal',
    },
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

    const published = k.versions.find(v => v.status === 'active');
    if (!published) return;

    // 計算新版本號
    const currentNum = published.versionNumber; // e.g. "v1.2"
    const [major, minor] = currentNum.replace('v', '').split('.').map(Number);
    const newNum = type === 'MAJOR' ? `v${major + 1}.0` : `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(published)),
      id: `${newNum}-draft-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      lastUpdateBy: 'Current User', // 正常應從 userStore 拿
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updateNote: updateNote,
    };

    k.versions.push(newVersion);
    // item status stays unchanged — only changes when draft is submitted for review
    return newVersion.id;
  };

  // 儲存草稿
  const saveDraft = (knowledgeId: string, versionId: string, data: Partial<KnowledgeVersion>) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && v.status === 'draft') {
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
    if (v && (v.status === 'draft' || v.status === 'rejected')) {
      v.status = 'reviewing';
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
      k.status = 'reviewing';
    }
  };

  // 還原舊版本 (建立為新草稿)
  const restoreToDraft = (knowledgeId: string, versionId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const oldVersion = k.versions.find(ver => ver.id === versionId);
    if (!oldVersion) return;

    // 基於當前發布版本號遞增
    const published = k.versions.find(v => v.status === 'active');
    const baseNum = published ? published.versionNumber : oldVersion.versionNumber;
    const [major, minor] = baseNum.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(oldVersion)),
      id: `${newNum}-restore-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      updateNote: `還原自 ${oldVersion.versionNumber}：${note}`,
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    k.versions.push(newVersion);
    k.status = 'pending';
    return newVersion.id;
  };

  const approveVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Previous active version becomes history
    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }

    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    k.status = 'active';
    k.lastUpdateTime = now;
  };

  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'rejected';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'needs_update';
  };

  const withdrawReview = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'draft';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'pending';
  };

  // 從共用檔案建立新的知識條目草稿
  const createFromFile = (params: {
    fileId: string;
    fileName: string;
    template: string;
    content: string;
    category: string;
  }) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const baseName = params.fileName.replace(/\.[^.]+$/, '');

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: baseName,
      category: params.category,
      status: 'pending',
      sourceType: 'FILE',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: baseName,
        summary: `由「${params.fileName}」生成的知識條目草稿`,
        content: params.content,
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從共用檔案「${params.fileName}」建立，使用模板：${params.template}`,
        sourceFiles: [{ fileId: params.fileId, fileName: params.fileName, linkedVersion: 1 }],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };

  // 來源檔案更新後，將關聯此檔案的所有知識條目標記為 stale
  function markFileStale(fileId: string, newVersion: number) {
    for (const k of knowledgeList.value) {
      const activeVersion = k.versions.find(v => v.status === 'active' || v.status === 'reviewing' || v.status === 'draft');
      if (!activeVersion?.sourceFiles) continue;
      const isLinked = activeVersion.sourceFiles.some(
        ref => ref.fileId === fileId && ref.linkedVersion < newVersion
      );
      if (isLinked) {
        k.sourceStale = true;
        k.staleSourceFileIds = [...k.staleSourceFileIds.filter(id => id !== fileId), fileId];
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

    const base = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1];
    const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    // 更新 sourceFiles 的 linkedVersion 到最新
    const updatedSourceFiles = base.sourceFiles.map(ref => {
      const file = getFile(ref.fileId);
      return file ? { ...ref, linkedVersion: file.version } : ref;
    });

    const staleFileNames = k.staleSourceFileIds
      .map(id => getFile(id)?.fileName ?? id)
      .join('、');

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(base)),
      id: `${newNum}-source-update-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      updateNote: `根據來源檔案更新（${staleFileNames}）由 AI 自動建立草稿`,
      lastUpdateBy: 'AI 生成',
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceFiles: updatedSourceFiles,
    };

    k.versions.push(newVersion);
    k.status = 'pending';
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

  // ── API 來源 CRUD ──
  function createApiSource(payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>) {
    const newSource: ApiSource = {
      ...payload,
      id: `api-${Date.now()}`,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncCount: 0,
      lastSyncError: null,
    };
    apiSources.value.unshift(newSource);
    return newSource.id;
  }

  function createKnowledgeFromApiSource(params: {
    apiSourceId: string
    apiSourceName: string
    name: string
    category: string
  }): string {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
    const newId = `k-api-${Date.now()}`
    const draftId = `v1.0-draft-${Date.now()}`

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: params.name,
      category: params.category,
      status: 'pending',
      sourceType: 'API',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: params.apiSourceId,
      apiSourceName: params.apiSourceName,
      lastUpdateTime: now,
      lastUpdateBy: 'API 同步',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: params.name,
        summary: `由 API 來源「${params.apiSourceName}」同步建立`,
        content: '',
        tags: [],
        systemTags: [],
        lastUpdateBy: 'API 同步',
        lastUpdateTime: now,
        updateNote: `由 API 來源「${params.apiSourceName}」自動建立`,
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    }

    knowledgeList.value.unshift(newKnowledge)
    return newId
  }

  function updateApiSource(id: string, payload: Partial<Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>>) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) Object.assign(source, payload);
  }

  function deleteApiSource(id: string) {
    apiSources.value = apiSources.value.filter(s => s.id !== id);
  }

  function toggleApiSourceEnabled(id: string) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) source.enabled = !source.enabled;
  }

  // 模擬同步
  function triggerSync(id: string): Promise<void> {
    const source = apiSources.value.find(s => s.id === id)
    if (!source) return Promise.resolve()

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

        if (success) {
          const count = Math.floor(Math.random() * 8) + 1
          source.lastSyncStatus = 'SUCCESS'
          source.lastSyncAt = now
          source.lastSyncCount = count
          source.lastSyncError = null

          // 找到關聯的 KnowledgeItem（1 來源 = 1 條目）
          const linked = knowledgeList.value.find(k => k.apiSourceId === id)
          if (linked) {
            const base =
              linked.versions.find(v => v.status === 'active') ??
              linked.versions[linked.versions.length - 1]
            const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number)
            const newNum = `v${major}.${minor + 1}`

            // 組合 Markdown 內容（mock：每筆資料為一個 ## 區塊）
            const content = Array.from({ length: count }, (_, i) =>
              `## ${source.titleField} 條目 ${i + 1}\n\n${source.contentField} 的示範內容（由 API 來源「${source.name}」同步）。`
            ).join('\n\n')

            const newVersion: KnowledgeVersion = {
              id: `${newNum}-api-${Date.now()}`,
              knowledgeId: linked.id,
              versionNumber: newNum,
              versionType: 'MINOR',
              status: 'draft',
              title: linked.title,
              summary: `由 API 來源「${source.name}」同步更新（${count} 筆資料）`,
              content,
              tags: [],
              systemTags: [],
              lastUpdateBy: 'API 同步',
              lastUpdateTime: now,
              updateNote: `API 同步（${source.name}），共 ${count} 筆`,
              sourceFiles: [],
              chunks: [],
              embeddingModel: null,
              embeddingDimension: null,
              embeddingCount: 0,
            }

            linked.versions.push(newVersion)
            linked.status = 'pending'
            linked.lastUpdateTime = now
            linked.lastUpdateBy = 'API 同步'
          }
        } else {
          source.lastSyncStatus = 'FAILED'
          source.lastSyncAt = now
          source.lastSyncCount = 0
          source.lastSyncError = '連線失敗：API 回應狀態 503'
        }

        resolve()
      }, 2000)
    })
  }

  // ── Upload-first 建立 ──
  function createFromUpload(params: {
    fileName: string
    category: string
    tags: string[]
  }): string {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
    const newId = `k-${Date.now()}`
    const baseName = params.fileName.replace(/\.[^.]+$/, '')

    const newItem: KnowledgeItem = {
      id: newId,
      title: baseName,
      category: params.category,
      status: 'pending',
      sourceType: 'FILE',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'Current User',
      versions: [{
        id: `${newId}-v1.0`,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: baseName,
        summary: '',
        content: '',
        tags: params.tags,
        systemTags: [],
        lastUpdateBy: 'Current User',
        lastUpdateTime: now,
        updateNote: `從檔案「${params.fileName}」建立`,
        sourceFiles: [{ fileId: `file-${Date.now()}`, fileName: params.fileName, linkedVersion: 1 }],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    }

    knowledgeList.value.unshift(newItem)
    return newId
  }

  // ── MANUAL 直接建立草稿（跳過 pipeline）──
  function createManualDraft(params: { title: string; category: string; tags: string[] }): { knowledgeId: string; versionId: string } {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
    const newId = `k-${Date.now()}`
    const draftId = `${newId}-v1.0`

    const newItem: KnowledgeItem = {
      id: newId,
      title: params.title,
      category: params.category,
      status: 'active',
      sourceType: 'MANUAL',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'Current User',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: params.title,
        summary: '',
        content: '',
        tags: params.tags,
        systemTags: [],
        lastUpdateBy: 'Current User',
        lastUpdateTime: now,
        updateNote: '手動建立',
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    }

    knowledgeList.value.unshift(newItem)
    return { knowledgeId: newId, versionId: draftId }
  }

  function updatePipelineProgress(id: string, stage: PipelineStage, progress: number) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'processing'
    item.pipelineStage = stage
    item.pipelineProgress = progress
  }

  function markPipelineDone(id: string, chunks: ChunkPreview[]) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'active'
    item.pipelineProgress = 100
    item.pipelineStage = null
    item.pipelineError = null
    const draft = item.versions[0]
    if (draft) {
      draft.status = 'draft'
      draft.chunks = chunks
      draft.embeddingModel = 'text-embedding-3-large'
      draft.embeddingDimension = 3072
      draft.embeddingCount = chunks.length
    }
  }

  function markPipelineFailed(id: string, error: string) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'failed'
    item.pipelineError = error
    item.pipelineStage = null
  }

  function retriggerPipeline(id: string) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'processing'
    item.pipelineProgress = 0
    item.pipelineStage = 'chunking'
    item.pipelineError = null
    item.sourceStale = false
    item.staleSourceFileIds = []
  }

  function archiveKnowledge(id: string) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (item) item.status = 'archived'
  }

  function batchArchive(ids: string[]) {
    for (const id of ids) archiveKnowledge(id)
  }

  function batchDelete(ids: string[]) {
    knowledgeList.value = knowledgeList.value.filter(k => !ids.includes(k.id))
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
    apiSources,
    createApiSource,
    createKnowledgeFromApiSource,
    updateApiSource,
    deleteApiSource,
    toggleApiSourceEnabled,
    triggerSync,
    createFromUpload,
    createManualDraft,
    updatePipelineProgress,
    markPipelineDone,
    markPipelineFailed,
    retriggerPipeline,
    archiveKnowledge,
    batchArchive,
    batchDelete,
  };
});
