import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface SkillCapability {
  name: string
  description: string
}

export interface SkillTestCase {
  name: string
  input: string
}

export interface UsageScenario {
  title: string
  description: string
}

export type SkillVersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'

export interface SkillReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

export interface SkillVersion {
  id: string
  versionTag: string
  status: SkillVersionStatus
  name: string
  description: string
  instructions?: string
  triggerHint?: string
  capabilities?: SkillCapability[]
  createdAt: string
  createdBy?: string
  updateNote?: string
  reviewNote?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewFeedback?: string
  reviewHistory?: SkillReviewRecord[]
}

export interface OperationRecord {
  action: 'ENABLED' | 'DISABLED' | 'UPSTREAM_MERGED' | 'UPSTREAM_IGNORED' | 'UPSTREAM_DETACHED'
  by: string
  time: string
}

export interface ConflictItem {
  field: string
  label: string
  mine: string
  upstream: string
}

export interface ConflictResolution {
  field: string
  choice: 'mine' | 'upstream'
}

export interface TestRun {
  id: string
  skillId: string
  date: string
  total: number
  passed: number
  passRate: number
}

export interface Skill {
  id: string
  name: string
  description: string
  type: 'system' | 'extension'
  origin: 'platform_created' | 'custom_version' | 'manually_created'
  creationMethod?: 'ai_assisted' | 'manual'
  scope?: 'system' | 'enterprise' | 'team'
  teamName?: string
  version: string
  isEnabled: boolean
  usageCount: number
  testPassRate: number
  avgLatencyMs: number
  forkSourceId?: string
  forkSourceVersion?: string
  evolutionContext?: string
  instructions?: string
  triggerHint?: string
  capabilities?: SkillCapability[]
  usageScenarios?: UsageScenario[]
  assignedAgents?: string[]
  testCases?: SkillTestCase[]
  versions?: SkillVersion[]
  deletedAt?: string
  children?: Skill[]
  upstreamUpdateStatus?: 'up_to_date' | 'update_available' | 'ignored'
  auditLog?: OperationRecord[]
  upstreamConflicts?: ConflictItem[]
  zone?: 'personal' | 'library'
  personalStatus?: 'available' | 'reviewing' | 'has_library'
  derivedFrom?: string
  hasLibraryUpdate?: boolean
  submitNote?: string
  submitMode?: 'version_update' | 'new_skill'
  targetScope?: 'enterprise' | 'team'
  targetTeamName?: string
  submittedBy?: string
  skillName?: string
  derivedFromVersion?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewFeedback?: string
  aiAnalysis?: string[]
}

export interface CreateSkillPayload {
  name: string
  description?: string
  instructions: string
  triggerHint: string
  isEnabled: boolean
  assignedAgents: string[]
  scope?: 'enterprise' | 'team'
}

export interface UpdateSkillPayload {
  name: string
  description?: string
  instructions: string
  triggerHint: string
  isEnabled: boolean
  assignedAgents: string[]
}

export interface DraftSkill {
  id: string
  name: string
  description: string
  instructions: string
  type: 'system' | 'extension'
  forkSourceId?: string
  createdAt: string
  updatedAt: string
  triggerHint?: string
  assignedAgents?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  toolTrace?: { name: string; latencyMs: number }[]
}

export type AITestTag = 'normal' | 'boundary' | 'trigger_edge'

export interface AITestScenario {
  id: string
  tag: AITestTag
  input: string
  expectedBehavior: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  agentReply?: string
  aiJudgment?: string
}

export interface AITestReport {
  total: number
  passed: number
  byTag: Record<AITestTag, { total: number; passed: number }>
  summary: string
}

const MOCK_SKILLS: Skill[] = [
  {
    id: 'sys-cs-001',
    name: '通用客服機器人',
    description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
    type: 'system',
    origin: 'platform_created',
    scope: 'system',
    version: '2.5.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.96,
    avgLatencyMs: 280,
    capabilities: [
      { name: '問題分類', description: '依使用者訊息語意自動分類問題類型，如退貨、查詢、投訴等。' },
      { name: 'FAQ 查詢', description: '比對知識庫快速回覆常見問題，支援模糊比對與同義詞展開。' },
      { name: '情緒分析', description: '識別使用者情緒狀態，必要時自動觸發轉接人工客服流程。' },
      { name: '多語言支援', description: '支援繁中、簡中、英文等多語言自動偵測與回覆。' },
    ],
    usageScenarios: [
      { title: '處理高峰期大量諮詢', description: '促銷活動期間湧入大量客戶詢問，AI 自動分流處理標準問題，讓人工客服聚焦在複雜投訴與退換貨審核。' },
      { title: '24 小時自動回覆', description: '夜間與假日無客服人員時，自動回覆訂單查詢、付款方式說明等常見問題，降低隔天早上的客服積壓量。' },
      { title: '識別高風險客訴', description: '分析對話情緒，當使用者情緒激烈或已升級為投訴語氣時，即時標記並轉介給資深客服代表接手。' },
    ],
    assignedAgents: ['客服中心助理', '電商小幫手'],
    auditLog: [
      { action: 'ENABLED' as const, by: '管理員', time: '2026-06-28T10:00:00Z' },
      { action: 'DISABLED' as const, by: '管理員', time: '2026-06-20T14:00:00Z' },
      { action: 'ENABLED' as const, by: '管理員', time: '2026-06-10T09:00:00Z' },
    ] satisfies OperationRecord[],
    versions: [
      {
        id: 'v-cs-001-v241',
        versionTag: '2.4.1',
        status: 'reviewing' as SkillVersionStatus,
        name: '通用客服機器人',
        description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
        instructions: '你是一個專業客服助理，使用親切且專業的語氣，處理各類客戶諮詢。',
        reviewNote: '新增情緒分析能力，優化回覆語氣',
        updateNote: '優化 Prompt 語氣',
        reviewHistory: [
          { action: 'SUBMITTED' as const, by: '管理員', time: '2026-06-28T10:00:00Z' },
        ],
        createdAt: '2026-06-28T10:00:00Z',
      },
      {
        id: 'v-cs-001-v240',
        versionTag: '2.4.0',
        status: 'active' as SkillVersionStatus,
        name: '通用客服機器人',
        description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
        instructions: '你是一個客服助理，處理各類客戶諮詢與 FAQ。',
        createdAt: '2026-06-01T10:00:00Z',
      },
    ] satisfies SkillVersion[],
    testCases: [
      { name: '詢問訂單到貨', input: '我的訂單什麼時候會到？訂單號是 #20241201-0023' },
      { name: '詢問退換貨', input: '我上週買的商品有瑕疵，想退貨，請問流程是什麼？' },
      { name: '詢問付款方式', input: '你們支援哪些付款方式？可以用信用卡分期嗎？' },
      { name: '情緒測試', input: '你們的客服真的很差！我等了三天還沒有任何回音！' },
    ],
    children: [
      {
        id: 'ext-cs-return-001',
        name: '客服機器人 (退貨版)',
        description: '針對退貨問題，依設定的服務原則回應退貨政策與審核',
        type: 'extension',
        origin: 'custom_version',
        creationMethod: 'ai_assisted',
        scope: 'enterprise',
        version: '1.0.0',
        isEnabled: true,
        usageCount: 89,
        testPassRate: 0.94,
        avgLatencyMs: 342,
        forkSourceId: 'sys-cs-001',
        forkSourceVersion: '2.4.0',
        upstreamUpdateStatus: 'update_available' as const,
        evolutionContext: '用戶說：「以後遇到退貨問題，先查詢訂單狀態再根據退貨政策給建議」',
        instructions: '你是專門處理退貨問題的客服助理。\n\n當客戶提出退貨請求時：\n1. 查詢訂單狀態確認購買日期\n2. 確認是否在 30 天退貨期限內\n3. 依據退貨政策給出具體建議\n4. 如有疑問轉接人工客服',
        triggerHint: '退貨、換貨、退款、品質問題',
        capabilities: [
          { name: '訂單狀態查詢', description: '根據訂單編號查詢目前處理狀態與物流資訊。' },
          { name: '退貨資格判斷', description: '依設定的退貨規則自動判斷是否符合退貨條件並給出建議。' },
        ],
        assignedAgents: ['客服中心助理'],
        upstreamConflicts: [
          {
            field: 'instructions',
            label: '技能指令',
            mine: '你是專門處理退貨問題的客服助理。',
            upstream: '你是一個專業客服助理，使用親切且專業的語氣，專門處理退貨相關問題。',
          },
        ],
        testCases: [
          { name: '退貨資格確認', input: '我在 2024/11/15 購買了一件外套，現在可以退貨嗎？' },
          { name: '逾期退貨申請', input: '我超過 30 天了，但商品真的有問題，有辦法退嗎？' },
          { name: '詢問退款時間', input: '退貨後多久可以收到退款？' },
        ],
        versions: [
          {
            id: 'v-cs-return-1.0',
            versionTag: '1.0.0',
            status: 'history',
            name: '客服機器人 (退貨版)',
            description: '針對退貨問題，依設定的服務原則回應退貨政策與審核',
            instructions: '你是專門處理退貨問題的客服助理。\n\n當客戶提出退貨請求時：\n1. 查詢訂單狀態確認購買日期\n2. 確認是否在 30 天退貨期限內\n3. 依據退貨政策給出具體建議\n4. 如有疑問轉接人工客服',
            triggerHint: '退貨、換貨、退款、品質問題',
            capabilities: [
              { name: '訂單狀態查詢', description: '根據訂單編號查詢目前處理狀態與物流資訊。' },
              { name: '退貨資格判斷', description: '依設定的退貨規則自動判斷是否符合退貨條件並給出建議。' },
            ],
            createdAt: '2026-05-10T10:00:00Z',
            createdBy: 'jocelyn.tseng',
            updateNote: '初始版本',
            reviewHistory: [
              { action: 'SUBMITTED', by: 'jocelyn.tseng', time: '2026-05-10T09:00:00Z' },
              { action: 'APPROVED', by: 'jocelyn.tseng', time: '2026-05-10T14:00:00Z' },
            ],
          },
          {
            id: 'v-cs-return-1.1',
            versionTag: '1.1.0',
            status: 'reviewing',
            name: '客服機器人 (退貨版)',
            description: '針對退貨問題，依設定的服務原則回應退貨政策與審核，新增超保固期彈性處理',
            instructions: '你是專門處理退貨問題的客服助理。\n\n當客戶提出退貨請求時：\n1. 查詢訂單狀態確認購買日期\n2. 確認是否在 30 天退貨期限內\n3. 依據退貨政策給出具體建議\n4. 若超過期限但有正當理由，提供「主管特批申請」流程\n5. 如有疑問轉接人工客服\n\n特殊規則：\n- 商品瑕疵不受期限限制，隨時可申請\n- VIP 客戶享有 45 天退貨優惠期',
            triggerHint: '退貨、換貨、退款、品質問題、保固、瑕疵、VIP',
            capabilities: [
              { name: '訂單狀態查詢', description: '根據訂單編號查詢目前處理狀態與物流資訊。' },
              { name: '退貨資格判斷', description: '依設定的退貨規則自動判斷是否符合退貨條件並給出建議。' },
              { name: 'VIP 優惠識別', description: '自動識別 VIP 客戶身份，套用對應的延長退貨期政策。' },
            ],
            createdAt: '2026-06-22T10:00:00Z',
            createdBy: 'jocelyn.tseng',
            updateNote: '新增超保固期彈性處理與 VIP 退貨優惠',
            reviewNote: '請確認新退貨邏輯是否符合公司最新政策，特別是 VIP 45 天退貨期的部分',
            reviewHistory: [
              {
                action: 'SUBMITTED',
                by: 'jocelyn.tseng',
                time: '2026-06-22T10:00:00Z',
                note: '請確認新退貨邏輯是否符合公司最新政策，特別是 VIP 45 天退貨期的部分',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sys-doc-001',
    name: '文件摘要生成',
    description: '自動摘要長文件，支援 PDF / Word / Markdown',
    type: 'system',
    origin: 'platform_created',
    scope: 'system',
    version: '1.5.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.91,
    avgLatencyMs: 450,
    capabilities: [
      { name: '長文摘要', description: '自動提取文件重點，生成條列式或段落式摘要。' },
      { name: '多格式支援', description: '解析 PDF、Word、Markdown 等常見格式，保留段落結構。' },
      { name: '關鍵字提取', description: '識別文件核心主題與高頻關鍵詞，輔助知識分類。' },
      { name: '結構化輸出', description: '以 JSON 或 Markdown 格式輸出摘要結果，便於下游系統使用。' },
    ],
    usageScenarios: [
      { title: '快速吸收長篇報告', description: '主管在會議前 15 分鐘收到 30 頁季報，透過此技能取得結構化重點摘要，準確掌握關鍵數據與決策項目。' },
      { title: '建立知識庫索引', description: '知識管理員上傳大量內部文件，AI 自動提取關鍵字與摘要，作為知識庫搜尋與分類的基礎資料。' },
      { title: '跨文件比對分析', description: '法務或研發人員需要比對多份合約或技術規格，透過摘要快速定位差異點，節省人工逐頁閱讀的時間。' },
    ],
    assignedAgents: ['知識管理助理', '通用助理'],
    testCases: [
      { name: '摘要長報告', input: '請幫我摘要以下季報重點：第三季營收較去年同期成長 12%，主要來自海外市場擴張...' },
      { name: '提取關鍵字', input: '請從這份產品規格文件中提取 5 個最重要的關鍵字。' },
      { name: '結構化輸出', input: '請將這篇文章摘要成 JSON 格式，包含標題、重點列表與結論。' },
    ],
  },
  {
    id: 'sys-meeting-001',
    name: '會議摘要',
    description: '會議錄音轉文字並生成摘要與 action items',
    type: 'system',
    origin: 'platform_created',
    scope: 'system',
    version: '2.2.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.88,
    avgLatencyMs: 520,
    capabilities: [
      { name: '語音轉文字', description: '將會議錄音檔轉換為帶時間戳記的完整文字逐字稿。' },
      { name: '摘要生成', description: '提取會議重點、關鍵決策與討論結論，生成結構化摘要。' },
      { name: 'Action Items', description: '自動識別待辦事項並整理負責人與預計完成日期。' },
    ],
    usageScenarios: [
      { title: '週會後快速產出記錄', description: 'PM 在週會結束後立即上傳錄音，AI 自動生成摘要與 action items，10 分鐘內發送給所有與會者確認，取代人工手記。' },
      { title: '跨時區異步同步', description: '跨國團隊成員無法參加即時會議，透過 AI 摘要快速掌握決策內容與自己負責的待辦事項，不需觀看完整錄影。' },
      { title: '專案進度追蹤', description: 'PM 將每週站立會議的 action items 彙整到專案管理工具，AI 自動識別責任人與截止日期，減少手動輸入錯誤。' },
    ],
    assignedAgents: ['會議記錄助理', '通用助理'],
    testCases: [
      { name: '提取決策事項', input: '這次週會決定將上線日期延後兩週，並由 PM 負責更新排程，請整理出本次的決策事項。' },
      { name: '整理 Action Items', input: '今天的會議提到 John 要在週五前完成 API 文件，Lisa 負責 QA 測試計畫，請列出 action items。' },
      { name: '生成摘要', input: '請根據以下討論內容生成一份簡短的會議摘要：本次會議討論了新功能的技術方案...' },
    ],
    children: [
      {
        id: 'ext-meeting-eng-001',
        name: '會議摘要 (工程版)',
        description: '工程會議格式，自動標記 action items 至 Jira',
        type: 'extension',
        origin: 'custom_version',
        creationMethod: 'manual',
        scope: 'team',
        teamName: '工程部',
        version: '1.2.0',
        isEnabled: true,
        usageCount: 34,
        testPassRate: 0.85,
        avgLatencyMs: 480,
        forkSourceId: 'sys-meeting-001',
        forkSourceVersion: '2.1.0',
        upstreamUpdateStatus: 'update_available' as const,
        capabilities: [
          { name: 'Jira 整合', description: '自動將識別出的 action items 建立為 Jira Issue 並指派負責人。' },
          { name: '工程格式輸出', description: '以工程團隊慣用格式輸出摘要，包含技術決策記錄與 PR 連結。' },
        ],
        assignedAgents: ['工程助理'],
        testCases: [
          { name: 'Jira 建票', input: '請將以下 action item 建立 Jira Issue：「後端 API 效能優化，負責人 Kevin，截止日 2024/12/20」' },
          { name: '工程決策記錄', input: '本次架構討論決定採用微服務方案，請整理成 ADR（架構決策記錄）格式。' },
        ],
      },
    ],
  },
  {
    id: 'ext-erp-001',
    name: 'ERP 庫存查詢',
    description: '根據產品 ID 查詢即時庫存量，支援多個倉庫',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    scope: 'enterprise',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 156,
    testPassRate: 0.99,
    avgLatencyMs: 120,
    instructions: '你是 ERP 庫存查詢助理。\n根據 SKU 查詢各倉庫即時庫存量。\n\n支援功能：\n- 指定倉庫查詢\n- 多倉庫匯總\n- 低於安全存量自動標示',
    triggerHint: '庫存、SKU、倉庫、庫存查詢',
    capabilities: [
      { name: '即時庫存查詢', description: '根據產品 ID 或 SKU 查詢各倉庫即時庫存量與安全存量狀態。' },
      { name: '多倉庫整合', description: '整合多個倉庫資料來源，提供統一查詢介面與匯總報表。' },
    ],
    assignedAgents: ['業務分析助理', '倉儲管理助理'],
    testCases: [
      { name: '單品庫存查詢', input: '查詢 SKU-00123 目前在所有倉庫的庫存數量' },
      { name: '指定倉庫查詢', input: '台北倉現在有多少 SKU-00456 的庫存？' },
      { name: '低庫存警示', input: '哪些產品目前庫存低於安全存量？請列出清單' },
      { name: '多品項查詢', input: '批次查詢以下產品庫存：SKU-00101、SKU-00102、SKU-00103' },
    ],
    versions: [
      {
        id: 'v-erp-1.0',
        versionTag: '1.0.0',
        status: 'history',
        name: 'ERP 庫存查詢',
        description: '根據產品 ID 查詢即時庫存量',
        instructions: '你是 ERP 庫存查詢助理。\n根據 SKU 查詢即時庫存量並回報。',
        triggerHint: '庫存、SKU、庫存查詢',
        capabilities: [
          { name: '即時庫存查詢', description: '根據產品 ID 或 SKU 查詢各倉庫即時庫存量與安全存量狀態。' },
        ],
        createdAt: '2026-04-01T08:00:00Z',
        createdBy: 'jocelyn.tseng',
        updateNote: '初始版本',
        reviewHistory: [
          { action: 'SUBMITTED', by: 'jocelyn.tseng', time: '2026-04-01T08:00:00Z' },
          { action: 'APPROVED', by: 'jocelyn.tseng', time: '2026-04-01T10:00:00Z' },
        ],
      },
      {
        id: 'v-erp-1.1',
        versionTag: '1.1.0',
        status: 'active',
        name: 'ERP 庫存查詢',
        description: '根據產品 ID 查詢即時庫存量，支援多個倉庫',
        instructions: '你是 ERP 庫存查詢助理。\n根據 SKU 查詢各倉庫即時庫存量。\n\n支援功能：\n- 指定倉庫查詢\n- 多倉庫匯總\n- 低於安全存量自動標示',
        triggerHint: '庫存、SKU、倉庫、庫存查詢',
        capabilities: [
          { name: '即時庫存查詢', description: '根據產品 ID 或 SKU 查詢各倉庫即時庫存量與安全存量狀態。' },
          { name: '多倉庫整合', description: '整合多個倉庫資料來源，提供統一查詢介面與匯總報表。' },
        ],
        createdAt: '2026-05-15T09:00:00Z',
        createdBy: 'jocelyn.tseng',
        updateNote: '新增多倉庫整合功能',
        reviewedBy: 'jocelyn.tseng',
        reviewHistory: [
          { action: 'SUBMITTED', by: 'jocelyn.tseng', time: '2026-05-15T09:00:00Z' },
          { action: 'APPROVED', by: 'jocelyn.tseng', time: '2026-05-15T11:00:00Z' },
        ],
      },
    ],
  },
  {
    id: 'team-weekly-001',
    name: '業績週報生成',
    description: '根據本週銷售數據自動整理業績摘要，含商品排行與目標達成率分析',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    scope: 'team',
    teamName: '業務部',
    version: '1.0.0',
    isEnabled: true,
    usageCount: 28,
    testPassRate: 0.87,
    avgLatencyMs: 410,
    instructions: '你是業務團隊的週報助理。\n\n每週根據提供的銷售數據，自動生成結構化業績週報：\n1. 本週總業績與目標達成率\n2. Top 5 商品銷售排行\n3. 各區域業績比較\n4. 下週改善建議\n\n輸出格式以 Markdown 條列式為主，數字加粗標示。',
    triggerHint: '週報、業績、銷售報告、商品排行、達標率',
    capabilities: [
      { name: '銷售數據分析', description: '自動整理銷售數據並計算各項 KPI，包含業績達成率與成長趨勢。' },
      { name: '商品排行生成', description: '根據銷售量或業績金額，自動生成 Top N 商品排行清單。' },
    ],
    usageScenarios: [
      { title: '週五業績彙整', description: '每週五業務主管發出週報前，AI 自動整理當週數據並產出草稿，主管只需確認並補充備註即可發送。' },
      { title: '即時達標查詢', description: '業務同仁隨時可詢問目前達標進度，AI 即時計算本月目標達成率與缺口分析。' },
    ],
    assignedAgents: ['業務分析助理'],
    testCases: [
      { name: '生成本週週報', input: '請根據本週數據生成業績週報' },
      { name: '查詢達標率', input: '本週業績達標了嗎？與上週比較如何？' },
      { name: '商品排行查詢', input: '請列出本週銷售前五名的商品' },
    ],
    versions: [
      {
        id: 'v-team-weekly-1.0',
        versionTag: '1.0.0',
        status: 'active',
        name: '業績週報生成',
        description: '根據本週銷售數據自動整理業績摘要，含商品排行與目標達成率分析',
        instructions: '你是業務團隊的週報助理。\n\n每週根據提供的銷售數據，自動生成結構化業績週報：\n1. 本週總業績與目標達成率\n2. Top 5 商品銷售排行\n3. 各區域業績比較\n4. 下週改善建議',
        triggerHint: '週報、業績、銷售報告',
        capabilities: [
          { name: '銷售數據分析', description: '自動整理銷售數據並計算各項 KPI，包含業績達成率與成長趨勢。' },
          { name: '商品排行生成', description: '根據銷售量或業績金額，自動生成 Top N 商品排行清單。' },
        ],
        createdAt: '2026-06-15T09:00:00Z',
        createdBy: 'jocelyn.tseng',
        updateNote: '初始版本',
        reviewedBy: 'jocelyn.tseng',
        reviewHistory: [
          { action: 'SUBMITTED', by: 'jocelyn.tseng', time: '2026-06-15T09:00:00Z' },
          { action: 'APPROVED', by: 'jocelyn.tseng', time: '2026-06-15T14:00:00Z' },
        ],
      },
    ],
  },
  {
    id: 'team-marketing-001',
    name: '行銷文案生成',
    description: '根據活動主題與目標受眾，自動生成社群貼文、EDM 標題與 CTA 文案',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    scope: 'team',
    teamName: '行銷部',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 52,
    testPassRate: 0.91,
    avgLatencyMs: 320,
    instructions: '你是行銷文案助理，根據活動主題、目標受眾與品牌調性生成行銷文案。\n\n輸出包含：\n1. 社群貼文（Facebook / Instagram / LinkedIn 各一）\n2. EDM 主旨行（3 個選項）\n3. CTA 按鈕文案（2 個選項）\n\n語調依品牌調性調整，預設為專業但親切。',
    triggerHint: '文案、行銷、貼文、EDM、社群、活動',
    capabilities: [
      { name: '多平台文案生成', description: '針對不同社群平台生成適合的文案格式與字數。' },
      { name: 'CTA 最佳化', description: '根據活動目標建議最佳行動呼籲文案。' },
    ],
    versions: [
      {
        id: 'v-mkt-1.0',
        versionTag: '1.0.0',
        status: 'history',
        name: '行銷文案生成',
        description: '根據活動主題自動生成社群文案',
        createdAt: '2026-05-01T09:00:00Z',
        createdBy: 'jocelyn.tseng',
        updateNote: '初始版本',
      },
      {
        id: 'v-mkt-1.1',
        versionTag: '1.1.0',
        status: 'active',
        name: '行銷文案生成',
        description: '根據活動主題與目標受眾，自動生成社群貼文、EDM 標題與 CTA 文案',
        createdAt: '2026-06-10T09:00:00Z',
        createdBy: 'jocelyn.tseng',
        updateNote: '新增 EDM 主旨行與 CTA 選項輸出',
        reviewedBy: 'jocelyn.tseng',
      },
    ],
  },
]

type ScenarioTemplate = Omit<AITestScenario, 'id' | 'status'>

const MOCK_AI_SCENARIO_TEMPLATES: Record<string, ScenarioTemplate[]> = {
  'sys-cs-001': [
    { tag: 'normal', input: '我的訂單什麼時候會到？訂單號是 #20241201-0023', expectedBehavior: '技能觸發，查詢訂單狀態並回覆預計到貨時間' },
    { tag: 'normal', input: '你們支援哪些付款方式？可以用信用卡分期嗎？', expectedBehavior: '技能觸發，列出支援付款方式並說明分期條件' },
    { tag: 'normal', input: '我想退貨，請問流程是什麼？', expectedBehavior: '技能觸發，說明退貨步驟與所需文件' },
    { tag: 'boundary', input: '你好！', expectedBehavior: '技能觸發一般問候回覆，不強制進入特定流程' },
    { tag: 'boundary', input: '你這破客服都沒在聽！我等了三天！', expectedBehavior: '情緒分析觸發，識別高情緒並轉介人工客服' },
    { tag: 'boundary', input: '幫我查 #99999999，是我朋友的訂單', expectedBehavior: '技能查詢但說明需驗證訂單歸屬' },
    { tag: 'trigger_edge', input: '退款 換貨 保固', expectedBehavior: '關鍵字觸發，引導使用者說明具體問題' },
    { tag: 'trigger_edge', input: 'I want to return my order please', expectedBehavior: '多語言觸發，以英文說明退貨流程' },
  ],
  'ext-cs-return-001': [
    { tag: 'normal', input: '我在 2024/11/15 購買了一件外套，現在可以退貨嗎？', expectedBehavior: '觸發退貨資格判斷，確認是否在 30 天內並給出建議' },
    { tag: 'normal', input: '退貨後多久可以收到退款？', expectedBehavior: '觸發，說明退款時程' },
    { tag: 'boundary', input: '我超過 30 天了，但商品真的有問題，有辦法嗎？', expectedBehavior: '觸發，提供超期但瑕疵品的彈性處理流程' },
    { tag: 'boundary', input: '我是 VIP 客戶，退貨期限是幾天？', expectedBehavior: '觸發 VIP 識別，說明 45 天優惠退貨期' },
    { tag: 'trigger_edge', input: '退貨 換貨 瑕疵 VIP', expectedBehavior: '關鍵字觸發，確認技能正確識別退貨相關意圖' },
  ],
  'sys-doc-001': [
    { tag: 'normal', input: '請幫我摘要以下季報重點：第三季營收較去年同期成長 12%...', expectedBehavior: '技能觸發，生成結構化摘要條列式重點' },
    { tag: 'normal', input: '請從這份文件中提取 5 個最重要的關鍵字', expectedBehavior: '技能觸發，提取並列出 5 個核心關鍵字' },
    { tag: 'normal', input: '請將這篇文章摘要成 JSON 格式，包含標題、重點列表與結論', expectedBehavior: '技能觸發，輸出 JSON 格式摘要' },
    { tag: 'boundary', input: '這份文件只有一句話，請摘要', expectedBehavior: '技能觸發，對超短文件給出合理的摘要或說明' },
    { tag: 'trigger_edge', input: '摘要 PDF Word Markdown 文件', expectedBehavior: '關鍵字觸發，確認多格式文件技能正確識別' },
  ],
  'sys-meeting-001': [
    { tag: 'normal', input: '本次週會決定將上線日期延後兩週，請整理決策事項', expectedBehavior: '技能觸發，識別並條列決策事項' },
    { tag: 'normal', input: 'John 要在週五前完成 API 文件，Lisa 負責 QA，請列出 action items', expectedBehavior: '技能觸發，生成含負責人的 action item 清單' },
    { tag: 'boundary', input: '今天的會議沒有結論，請摘要', expectedBehavior: '技能觸發，說明無明確決策並建議後續追蹤方式' },
    { tag: 'trigger_edge', input: '會議 摘要 action items 決策', expectedBehavior: '關鍵字觸發，確認會議相關意圖被正確識別' },
  ],
  'ext-erp-001': [
    { tag: 'normal', input: '查詢 SKU-00123 目前在所有倉庫的庫存數量', expectedBehavior: '技能觸發，呼叫庫存查詢 tool 並回傳各倉庫數量' },
    { tag: 'normal', input: '台北倉現在有多少 SKU-00456 的庫存？', expectedBehavior: '技能觸發，指定倉庫查詢並回傳結果' },
    { tag: 'normal', input: '哪些產品目前庫存低於安全存量？請列出清單', expectedBehavior: '技能觸發，掃描並回傳低庫存清單' },
    { tag: 'boundary', input: '我要查 SKU-99999，但我不確定這個 SKU 存不存在', expectedBehavior: '技能觸發，查詢後提示查無此 SKU' },
    { tag: 'trigger_edge', input: '庫存 SKU 倉庫 查詢', expectedBehavior: '關鍵字觸發，確認庫存相關意圖被正確識別' },
  ],
}

const DEFAULT_AI_SCENARIOS: ScenarioTemplate[] = [
  { tag: 'normal', input: '請執行這個技能的主要功能', expectedBehavior: '技能正確觸發並執行主要功能，回傳預期輸出' },
  { tag: 'normal', input: '我需要協助處理一個標準任務', expectedBehavior: '技能觸發，提供清晰的處理結果' },
  { tag: 'boundary', input: '這個任務有點不一樣，你能處理嗎？', expectedBehavior: '技能在邊界情境下仍給出合理回應或適當引導' },
  { tag: 'boundary', input: '（空白輸入）', expectedBehavior: '技能不崩潰，主動引導使用者提供必要資訊' },
  { tag: 'trigger_edge', input: '觸發關鍵詞測試', expectedBehavior: '關鍵字觸發測試，確認技能正確識別意圖' },
]

const MOCK_PERSONAL_SKILLS: Skill[] = [
  {
    id: 'personal-001',
    name: '週報自動生成',
    description: '根據本週的會議記錄、任務清單，自動整理生成週報摘要',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'available',
    skillName: '會議摘要',
    derivedFrom: 'sys-meeting-001',
    derivedFromVersion: '2.2.0',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是一個週報助理，協助使用者根據本週資料自動生成結構化週報。',
  },
  {
    id: 'personal-002',
    name: '客服對話品質評估',
    description: '自動分析客服對話品質，評估回答準確度與客戶滿意度',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '通用客服機器人',
    derivedFrom: 'sys-cs-001',
    derivedFromVersion: '2.4.0',
    submitMode: 'version_update',
    submitNote: '新增多輪對話品質評估邏輯，支援情緒分析',
    targetScope: 'enterprise',
    submittedBy: '陳雅婷',
    aiAnalysis: [
      '適合用於處理多輪對話的客服場景，尤其涉及退換貨等複雜流程時表現更穩定',
      '支援即時情緒辨識，可協助優先處理高風險或情緒激動的對話',
      '相較現有版本，預估準確率提升 12–15%，誤判率下降約 8%',
    ],
    version: '1.0.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是客服品質評估助理，分析客服對話品質。',
  },
  {
    id: 'personal-004',
    name: '合約審核摘要',
    description: '自動擷取合約關鍵條款，生成風險摘要與審核建議',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '合約審核摘要',
    submitMode: 'new_skill',
    submitNote: '支援中英文合約自動摘要，標註高風險條款',
    targetScope: 'team',
    targetTeamName: '法務部',
    submittedBy: '林志明',
    aiAnalysis: [
      '適合法務、採購等需頻繁審閱合約的場景，可大幅縮短人工閱讀時間',
      '對常見條款類型（保密、違約、終止）識別率達 91%',
      '建議後續版本補充對特殊行業合約（金融、醫療）的識別能力',
    ],
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是合約審核助理，負責擷取合約中的關鍵條款並評估潛在法律風險。請以條列方式輸出摘要，並標示高風險條款。',
  },
  {
    id: 'personal-005',
    name: '會議記錄自動生成',
    description: '根據會議逐字稿或音訊，自動輸出結構化會議記錄與行動項目',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'ai_assisted',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '會議摘要',
    derivedFrom: 'sys-meeting-001',
    derivedFromVersion: '2.2.0',
    submitMode: 'version_update',
    submitNote: '新增行動項目追蹤欄位，支援多位發言人識別',
    targetScope: 'enterprise',
    submittedBy: '黃思婷',
    aiAnalysis: [
      '多發言人識別功能在 5 人以下會議場景準確率達 95%，可有效減少後製時間',
      '行動項目自動配對負責人，相較舊版減少約 40% 的手動整理工作',
    ],
    version: '2.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是會議記錄助理，根據逐字稿整理結構化會議記錄，包含主題、決議、行動項目與負責人。',
  },
  {
    id: 'personal-006',
    name: '產品 FAQ 自動回覆',
    description: '根據產品文件與常見問題資料庫，自動回答用戶提問',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'reviewing',
    skillName: '產品 FAQ 自動回覆',
    submitMode: 'new_skill',
    submitNote: '',
    targetScope: 'team',
    targetTeamName: '客服部',
    submittedBy: '王建豪',
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是產品 FAQ 助理，根據內部文件與常見問題資料庫回答用戶問題，無法回答時請引導至人工客服。',
  },
  {
    id: 'personal-003',
    name: 'ERP 報表彙整',
    description: '整合 ERP 系統數據，自動生成週期性報表',
    type: 'extension',
    origin: 'manually_created',
    creationMethod: 'manual',
    zone: 'personal',
    personalStatus: 'has_library',
    skillName: 'ERP 報表彙整',
    targetScope: 'team',
    targetTeamName: '業務部',
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是 ERP 報表助理，整合多系統數據生成週期性報表。',
  },
]

const MOCK_DRAFTS: DraftSkill[] = [
  {
    id: 'draft-001',
    name: '週報自動生成',
    description: '根據本週的會議記錄、任務清單、郵件往來，自動整理生成週報摘要',
    instructions: '你是一個週報助理，協助使用者根據本週資料自動生成結構化週報...',
    type: 'extension',
    forkSourceId: 'sys-meeting-001',
    createdAt: '2026-06-20T09:00:00Z',
    updatedAt: '2026-06-27T14:30:00Z',
  },
  {
    id: 'draft-002',
    name: '客服對話品質評估',
    description: '自動分析客服對話品質，評估回答準確度與客戶滿意度',
    instructions: '',
    type: 'extension',
    forkSourceId: 'sys-cs-001',
    createdAt: '2026-06-25T11:00:00Z',
    updatedAt: '2026-06-28T09:15:00Z',
  },
  {
    id: 'draft-003',
    name: '',
    description: '',
    instructions: '',
    type: 'extension',
    createdAt: '2026-06-29T10:00:00Z',
    updatedAt: '2026-06-29T10:00:00Z',
  },
]

export const useSkillStore = defineStore('skillStore', () => {
  const skills = ref<Skill[]>(JSON.parse(JSON.stringify(MOCK_SKILLS)))
  const myDrafts = ref<DraftSkill[]>(JSON.parse(JSON.stringify(MOCK_DRAFTS)))
  const myPersonalSkillsRef = ref<Skill[]>(JSON.parse(JSON.stringify(MOCK_PERSONAL_SKILLS)))

  const myPersonalSkills = computed<Skill[]>(() =>
    myPersonalSkillsRef.value
      .filter(s => !s.deletedAt)
      .map(s => {
        const librarySource = flatSkills.value.find(p => p.id === s.derivedFrom)
        return {
          ...s,
          hasLibraryUpdate: !!(
            librarySource &&
            s.derivedFromVersion &&
            librarySource.version !== s.derivedFromVersion
          ),
        }
      })
  )

  const selectedSkillId = ref<string | null>(null)
  const selectedVersionTag = ref<string | null>(null)
  const testConversationHistory = ref<ChatMessage[]>([])
  const testIsRunning = ref(false)
  const aiTestScenarios = ref<AITestScenario[]>([])
  const aiTestReport = ref<AITestReport | null>(null)
  const aiTestIsGenerating = ref(false)
  const aiTestIsRunning = ref(false)

  const flatSkills = computed<Skill[]>(() => {
    const result: Skill[] = []
    for (const s of skills.value) {
      if (s.deletedAt) continue
      result.push(s)
      if (s.children) result.push(...s.children.filter(c => !c.deletedAt))
    }
    return result
  })

  const deletedSkills = computed<Skill[]>(() => {
    const result: Skill[] = []
    for (const s of skills.value) {
      if (s.deletedAt) result.push(s)
      if (s.children) result.push(...s.children.filter(c => !!c.deletedAt))
    }
    return result.sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''))
  })

  const enabledCount = computed(() => flatSkills.value.filter(s => s.isEnabled).length)
  const enterpriseExtensionCount = computed(() =>
    flatSkills.value.filter(s => s.type === 'extension' && s.scope === 'enterprise').length
  )
  const teamExtensionCount = computed(() =>
    flatSkills.value.filter(s => s.type === 'extension' && s.scope === 'team').length
  )
  const totalUsageCount = computed(() => flatSkills.value.reduce((sum, s) => sum + s.usageCount, 0))

  const avgTestPassRate = computed(() => {
    const enabled = flatSkills.value.filter(s => s.isEnabled && !s.deletedAt)
    if (!enabled.length) return 0
    const avg = enabled.reduce((sum, s) => sum + s.testPassRate, 0) / enabled.length
    return Math.round(avg * 100)
  })

  const reviewingSkillIds = computed<Set<string>>(() => {
    const ids = new Set<string>()
    for (const s of flatSkills.value) {
      if (s.versions?.some(v => v.status === 'reviewing')) ids.add(s.id)
    }
    return ids
  })

  const upstreamUpdateSkillIds = computed<Set<string>>(() => {
    const ids = new Set<string>()
    for (const s of flatSkills.value) {
      if (!s.forkSourceId || !s.forkSourceVersion) continue
      if (s.upstreamUpdateStatus === 'ignored') continue
      const source = skills.value.find(p => p.id === s.forkSourceId)
      if (source && source.version !== s.forkSourceVersion) ids.add(s.id)
    }
    return ids
  })

  const pendingUpdateCount = computed(() => upstreamUpdateSkillIds.value.size)
  const pendingUpdateSkills = computed<Skill[]>(() =>
    flatSkills.value.filter(s => upstreamUpdateSkillIds.value.has(s.id))
  )

  const testRunHistory = ref<TestRun[]>([])

  function findSkill(id: string): Skill | undefined {
    const library = flatSkills.value.find(s => s.id === id)
    if (library) return library
    const personal = myPersonalSkillsRef.value.find(s => s.id === id)
    if (personal) return personal
    // draft fallback（保留至草稿清理任務）
    const draft = myDrafts.value.find(d => d.id === id)
    if (!draft) return undefined
    return {
      id: draft.id,
      name: draft.name || '未命名草稿',
      description: draft.description,
      type: draft.type,
      origin: 'manually_created',
      version: '草稿',
      isEnabled: false,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
      instructions: draft.instructions,
      triggerHint: draft.triggerHint,
      assignedAgents: draft.assignedAgents,
      forkSourceId: draft.forkSourceId,
    }
  }

  function getSkillVersions(skillId: string): SkillVersion[] {
    const skill = _findAny(skillId)
    return skill?.versions ?? []
  }

  function getReviewingVersion(skillId: string): SkillVersion | undefined {
    return getSkillVersions(skillId).find(v => v.status === 'reviewing')
  }

  function getVersionOptions(skillId: string): { versionTag: string; isActive: boolean }[] {
    const skill = findSkill(skillId)
    if (!skill) return []
    if (skill.versions?.length) {
      return skill.versions.map(v => ({ versionTag: v.versionTag, isActive: v.status === 'active' }))
    }
    return [{ versionTag: skill.version, isActive: true }]
  }

  function getDefaultVersionTag(skillId: string): string | null {
    const options = getVersionOptions(skillId)
    if (!options.length) return null
    return options.find(v => v.isActive)?.versionTag ?? options[0].versionTag
  }

  function toggleSkill(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.isEnabled = !skill.isEnabled
      skill.auditLog ??= []
      skill.auditLog.unshift({
        action: skill.isEnabled ? 'ENABLED' : 'DISABLED',
        by: '管理員',
        time: new Date().toISOString(),
      })
      if (skill.auditLog.length > 20) skill.auditLog.length = 20
    }
  }

  function deleteSkill(id: string): void {
    const skill = findSkill(id)
    if (skill) skill.deletedAt = new Date().toISOString()
  }

  function restoreSkill(id: string): void {
    const skill = _findAny(id)
    if (skill) delete skill.deletedAt
  }

  function permanentlyDeleteSkill(id: string): void {
    const topIdx = skills.value.findIndex(s => s.id === id)
    if (topIdx !== -1) { skills.value.splice(topIdx, 1); return }
    for (const parent of skills.value) {
      if (!parent.children) continue
      const childIdx = parent.children.findIndex(c => c.id === id)
      if (childIdx !== -1) { parent.children.splice(childIdx, 1); return }
    }
  }

  function _findAny(id: string): Skill | undefined {
    for (const s of skills.value) {
      if (s.id === id) return s
      if (s.children) {
        const c = s.children.find(c => c.id === id)
        if (c) return c
      }
    }
  }

  function createSkill(data: CreateSkillPayload): void {
    skills.value.push({
      id: `ext-custom-${skills.value.length + 1}`,
      name: data.name,
      description: data.description ?? '',
      instructions: data.instructions,
      triggerHint: data.triggerHint,
      assignedAgents: data.assignedAgents,
      type: 'extension',
      origin: 'manually_created',
      scope: data.scope ?? 'enterprise',
      version: '1.0.0',
      isEnabled: data.isEnabled,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
    })
  }

  function updateSkill(id: string, data: UpdateSkillPayload): void {
    const skill = findSkill(id)
    if (!skill) return
    skill.name = data.name
    if (data.description !== undefined) skill.description = data.description
    skill.instructions = data.instructions
    skill.triggerHint = data.triggerHint
    skill.isEnabled = data.isEnabled
    skill.assignedAgents = data.assignedAgents
  }

  function submitSkillForReview(skillId: string, versionId: string, note: string): void {
    const skill = _findAny(skillId)
    const version = skill?.versions?.find(v => v.id === versionId)
    if (!version) return
    version.status = 'reviewing'
    version.reviewNote = note
    if (!version.reviewHistory) version.reviewHistory = []
    version.reviewHistory.push({ action: 'SUBMITTED', by: 'jocelyn.tseng', time: new Date().toISOString(), note })
  }

  function getUpstreamVersion(skillId: string): string | undefined {
    const skill = _findAny(skillId)
    if (!skill?.forkSourceId) return undefined
    const source = skills.value.find(s => s.id === skill.forkSourceId)
    if (!source || source.version === skill.forkSourceVersion) return undefined
    return source.version
  }

  function acceptUpstreamUpdate(skillId: string): void {
    const skill = _findAny(skillId)
    if (!skill?.forkSourceId) return
    const source = skills.value.find(s => s.id === skill.forkSourceId)
    if (source) skill.forkSourceVersion = source.version
  }

  function detachFromUpstream(skillId: string): void {
    const skill = _findAny(skillId)
    if (!skill) return
    delete skill.forkSourceId
    delete skill.forkSourceVersion
    skill.upstreamUpdateStatus = 'ignored'
    skill.auditLog ??= []
    skill.auditLog.unshift({ action: 'UPSTREAM_DETACHED', by: '管理員', time: new Date().toISOString() })
  }

  const detachUpstream = detachFromUpstream

  function mergeUpstreamUpdate(id: string, _resolutions?: ConflictResolution[]): void {
    // _resolutions: in production, field-level choices would be applied here;
    // the mock simply clears conflicts and bumps forkSourceVersion regardless of choice.
    const skill = findSkill(id)
    if (!skill) return
    if (skill.forkSourceId) {
      const source = skills.value.find(s => s.id === skill.forkSourceId)
      if (source) skill.forkSourceVersion = source.version
    }
    skill.upstreamUpdateStatus = 'up_to_date'
    skill.upstreamConflicts = undefined
    skill.auditLog ??= []
    skill.auditLog.unshift({ action: 'UPSTREAM_MERGED', by: '管理員', time: new Date().toISOString() })
  }

  function ignoreUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (!skill) return
    skill.upstreamUpdateStatus = 'ignored'
    skill.auditLog ??= []
    skill.auditLog.unshift({ action: 'UPSTREAM_IGNORED', by: '管理員', time: new Date().toISOString() })
  }

  function approveSkillVersion(skillId: string, versionId: string): void {
    const skill = _findAny(skillId)
    if (!skill?.versions) return
    const version = skill.versions.find(v => v.id === versionId)
    if (!version || version.status !== 'reviewing') return

    for (const v of skill.versions) {
      if (v.status === 'active') v.status = 'history'
    }
    version.status = 'active'
    version.reviewedBy = 'jocelyn.tseng'
    version.reviewedAt = new Date().toISOString()
    if (!version.reviewHistory) version.reviewHistory = []
    version.reviewHistory.push({ action: 'APPROVED', by: 'jocelyn.tseng', time: new Date().toISOString() })

    skill.version = version.versionTag
    skill.name = version.name
    skill.description = version.description
    if (version.instructions !== undefined) skill.instructions = version.instructions
    if (version.triggerHint !== undefined) skill.triggerHint = version.triggerHint
    if (version.capabilities !== undefined) skill.capabilities = version.capabilities
  }

  function rejectSkillVersion(skillId: string, versionId: string, feedback: string): void {
    const skill = _findAny(skillId)
    const version = skill?.versions?.find(v => v.id === versionId)
    if (!version || version.status !== 'reviewing') return
    version.status = 'rejected'
    version.reviewFeedback = feedback
    version.reviewedBy = 'jocelyn.tseng'
    version.reviewedAt = new Date().toISOString()
    if (!version.reviewHistory) version.reviewHistory = []
    version.reviewHistory.push({ action: 'REJECTED', by: 'jocelyn.tseng', time: new Date().toISOString(), note: feedback })
  }

  function createDraft(): DraftSkill {
    const draft: DraftSkill = {
      id: `draft-${Date.now()}`,
      name: '',
      description: '',
      instructions: '',
      type: 'extension',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    myDrafts.value.unshift(draft)
    return draft
  }

  function saveDraft(id: string, data: Partial<Pick<DraftSkill, 'name' | 'description' | 'instructions' | 'type' | 'forkSourceId'>>): void {
    const draft = myDrafts.value.find(d => d.id === id)
    if (!draft) return
    Object.assign(draft, data)
    draft.updatedAt = new Date().toISOString()
  }

  function updateDraft(id: string, patch: Partial<DraftSkill>): void {
    const draft = myDrafts.value.find(d => d.id === id)
    if (!draft) return
    Object.assign(draft, patch)
    draft.updatedAt = new Date().toISOString()
  }

  function deleteDraft(id: string): void {
    myDrafts.value = myDrafts.value.filter(d => d.id !== id)
  }

  function hasPendingReview(skill: Skill): boolean {
    return skill.personalStatus === 'reviewing'
  }

  function submitPersonalSkill(
    id: string,
    mode: 'new_skill' | 'version_update',
    note: string,
    targetScope: 'enterprise' | 'team' = 'enterprise',
    targetTeamName?: string
  ): void {
    const skill = myPersonalSkillsRef.value.find(s => s.id === id)
    if (!skill) return
    skill.personalStatus = 'reviewing'
    skill.submitNote = note
    skill.submitMode = mode
    skill.targetScope = targetScope
    skill.targetTeamName = targetScope === 'team' ? targetTeamName : undefined
    skill.submittedBy = 'jocelyn.tseng'
  }

  function setLibraryActiveVersion(skillId: string, versionId: string): void {
    let target: Skill | undefined
    for (const s of skills.value) {
      if (s.id === skillId) { target = s; break }
      if (s.children) {
        const child = s.children.find(c => c.id === skillId)
        if (child) { target = child; break }
      }
    }
    if (!target?.versions) return
    const ver = target.versions.find(v => v.id === versionId)
    if (!ver) return
    target.versions.forEach(v => {
      if (v.id === versionId) v.status = 'active'
      else if (v.status === 'active') v.status = 'history'
    })
    target.version = ver.versionTag
  }

  function deletePersonalSkill(id: string): void {
    const idx = myPersonalSkillsRef.value.findIndex(s => s.id === id)
    if (idx !== -1) myPersonalSkillsRef.value.splice(idx, 1)
  }

  function duplicateAsPersonalSkill(sourceId: string): Skill {
    const source = findSkill(sourceId)
    if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
    const copy: Skill = {
      id: `personal-${Date.now()}`,
      name: source.name,
      description: source.description,
      type: source.type,
      origin: 'manually_created',
      creationMethod: source.creationMethod,
      zone: 'personal',
      personalStatus: 'available',
      skillName: source.zone === 'personal' ? source.skillName : source.name,
      derivedFrom: sourceId,
      derivedFromVersion: source.version,
      version: source.version,
      isEnabled: false,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
      instructions: source.instructions,
      triggerHint: source.triggerHint,
      capabilities: source.capabilities ? [...source.capabilities] : undefined,
    }
    myPersonalSkillsRef.value.unshift(copy)
    return copy
  }

  function hasSkillNameConflict(skillId: string): boolean {
    const skill = myPersonalSkillsRef.value.find(s => s.id === skillId)
    if (!skill) return false
    return myPersonalSkillsRef.value.some(
      s => s.id !== skillId && !s.deletedAt && s.skillName === skill.skillName
    )
  }

  function approvePersonalSkill(id: string): void {
    const skill = myPersonalSkillsRef.value.find(s => s.id === id)
    if (!skill || skill.personalStatus !== 'reviewing') return
    skill.personalStatus = 'has_library'
    skill.reviewedBy = 'jocelyn.tseng'
    skill.reviewedAt = new Date().toISOString()
  }

  function rejectPersonalSkill(id: string, feedback: string): void {
    const skill = myPersonalSkillsRef.value.find(s => s.id === id)
    if (!skill || skill.personalStatus !== 'reviewing') return
    skill.personalStatus = 'available'
    skill.reviewedBy = 'jocelyn.tseng'
    skill.reviewedAt = new Date().toISOString()
    skill.reviewFeedback = feedback
  }

  const pendingReviewSkills = computed<Skill[]>(() =>
    myPersonalSkillsRef.value.filter(s => !s.deletedAt && hasPendingReview(s))
  )

  function submitDraft(id: string, mode: 'new_skill' | 'version_update' = 'new_skill'): void {
    const draft = myDrafts.value.find(d => d.id === id)
    if (!draft) return
    if (mode === 'new_skill') {
      createSkill({
        name: draft.name,
        description: draft.description,
        instructions: draft.instructions,
        triggerHint: draft.triggerHint ?? '',
        isEnabled: true,
        assignedAgents: draft.assignedAgents ?? [],
      })
    }
    // 'version_update' → patch forkSourceId skill with new SkillVersion + submitSkillForReview
    myDrafts.value = myDrafts.value.filter(d => d.id !== id)
  }

  function batchMergeUpstreamUpdates(skillIds: string[]): string[] {
    const merged: string[] = []
    for (const id of skillIds) {
      const skill = findSkill(id)
      if (!skill || (skill.upstreamConflicts && skill.upstreamConflicts.length > 0)) continue
      mergeUpstreamUpdate(id)
      merged.push(id)
    }
    return merged
  }

  function saveTestRun(skillId: string, result: { total: number; passed: number }): void {
    testRunHistory.value.push({
      id: `run-${Date.now()}`,
      skillId,
      date: new Date().toISOString(),
      total: result.total,
      passed: result.passed,
      passRate: result.total > 0 ? result.passed / result.total : 0,
    })
    const runs = testRunHistory.value.filter(r => r.skillId === skillId)
    if (runs.length > 10) {
      const oldestIdx = testRunHistory.value.indexOf(runs[0])
      testRunHistory.value.splice(oldestIdx, 1)
    }
  }

  function getTestRunHistory(skillId: string): TestRun[] {
    return testRunHistory.value
      .filter(r => r.skillId === skillId)
      .slice(-5)
      .reverse()
  }

  function setSelectedSkill(id: string, versionTag?: string): void {
    selectedSkillId.value = id
    selectedVersionTag.value = versionTag ?? getDefaultVersionTag(id)
    aiTestScenarios.value = []
    aiTestReport.value = null
    aiTestIsGenerating.value = false
    aiTestIsRunning.value = false
  }

  async function generateAITestScenarios(skillId: string): Promise<void> {
    aiTestIsGenerating.value = true
    aiTestScenarios.value = []
    aiTestReport.value = null
    await new Promise(r => setTimeout(r, 900))
    const templates = MOCK_AI_SCENARIO_TEMPLATES[skillId] ?? DEFAULT_AI_SCENARIOS
    aiTestScenarios.value = templates.map((t, i) => ({
      ...t,
      id: `ai-sc-${skillId}-${i}`,
      status: 'pending',
    }))
    aiTestIsGenerating.value = false
  }

  function _computeAITestReport(): void {
    const all = aiTestScenarios.value
    const allDone = all.every(s => s.status === 'pass' || s.status === 'fail')
    if (!allDone) return

    const byTag: AITestReport['byTag'] = {
      normal: { total: 0, passed: 0 },
      boundary: { total: 0, passed: 0 },
      trigger_edge: { total: 0, passed: 0 },
    }
    let total = 0
    let passed = 0
    for (const s of all) {
      byTag[s.tag].total++
      total++
      if (s.status === 'pass') { byTag[s.tag].passed++; passed++ }
    }

    const rate = total > 0 ? passed / total : 0
    const failedBoundary = byTag.boundary.total - byTag.boundary.passed
    let summary: string
    if (rate === 1) {
      summary = '所有測試情境均通過，技能行為符合預期，可考慮擴大使用範圍。'
    } else if (rate >= 0.7) {
      summary = failedBoundary > 0
        ? `技能在正常情境下穩定觸發，建議調整邊界情況的觸發描述（${failedBoundary} 個案例未達預期）以提高整體覆蓋率。`
        : `技能整體表現良好，${total - passed} 個案例有改善空間，建議檢視對應的觸發描述。`
    } else {
      summary = '技能觸發穩定性有待改善，建議重新審視 triggerHint 與 instructions 的設定。'
    }

    aiTestReport.value = { total, passed, byTag, summary }
  }

  async function runSingleAITest(_skillId: string, scenarioId: string): Promise<void> {
    const scenario = aiTestScenarios.value.find(s => s.id === scenarioId)
    if (!scenario || scenario.status === 'running') return

    scenario.status = 'running'
    await new Promise(r => setTimeout(r, 600 + Math.floor(Math.random() * 400)))

    const idx = aiTestScenarios.value.findIndex(s => s.id === scenarioId)
    // normal 和 trigger_edge 固定通過；boundary 每三個中第二個失敗（demo 效果）
    const passes = scenario.tag !== 'boundary' || idx % 3 !== 1

    const shortInput = scenario.input.length > 40
      ? scenario.input.slice(0, 40) + '...'
      : scenario.input

    scenario.agentReply = passes
      ? `（Mock）已處理您的請求：「${shortInput}」，並完成對應動作。`
      : `（Mock）您好，這個問題需要更多資訊，請提供相關細節以便進一步協助。`
    scenario.aiJudgment = passes
      ? '技能正確觸發，回覆內容符合預期行為。'
      : '技能未如預期觸發，回覆為一般性回應，未執行對應功能。'
    scenario.status = passes ? 'pass' : 'fail'

    _computeAITestReport()
  }

  async function runAllAITests(skillId: string): Promise<void> {
    if (aiTestIsRunning.value) return
    aiTestIsRunning.value = true
    const pending = aiTestScenarios.value.filter(s => s.status === 'pending')
    for (const scenario of pending) {
      await runSingleAITest(skillId, scenario.id)
    }
    aiTestIsRunning.value = false
  }

  function resetConversation(): void {
    testConversationHistory.value = []
  }

  async function sendChatMessage(_skillId: string, message: string): Promise<void> {
    testIsRunning.value = true
    testConversationHistory.value.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
    })
    await new Promise(r => setTimeout(r, 800))
    testConversationHistory.value.push({
      id: `msg-${Date.now() + 1}`,
      role: 'agent',
      content: `（Mock）已收到您的問題：「${message}」，正在處理中...`,
      toolTrace: [
        { name: 'query-knowledge-base', latencyMs: 156 },
        { name: 'generate-response', latencyMs: 234 },
      ],
    })
    testIsRunning.value = false
  }

  // 複製後跟 Agent 對話修改技能：mock 版，把使用者描述的異動附加到 instructions 上
  const editChatHistory = ref<ChatMessage[]>([])
  const editChatIsRunning = ref(false)

  function resetEditChat(): void {
    editChatHistory.value = []
  }

  async function sendEditChatMessage(skillId: string, message: string): Promise<void> {
    editChatIsRunning.value = true
    editChatHistory.value.push({
      id: `edit-msg-${Date.now()}`,
      role: 'user',
      content: message,
    })
    await new Promise(r => setTimeout(r, 900))

    const skill = findSkill(skillId)
    if (skill) {
      skill.instructions = `${skill.instructions ?? ''}\n\n（依對話更新）${message}`.trim()
    }

    editChatHistory.value.push({
      id: `edit-msg-${Date.now() + 1}`,
      role: 'agent',
      content: `（Mock）已根據你的描述更新技能指令。你可以繼續補充，或關閉視窗完成修改。`,
    })
    editChatIsRunning.value = false
  }

  return {
    skills,
    myDrafts,
    myPersonalSkills,
    drafts: myDrafts,
    selectedSkillId,
    selectedVersionTag,
    testConversationHistory,
    testIsRunning,
    aiTestScenarios,
    aiTestReport,
    aiTestIsGenerating,
    aiTestIsRunning,
    flatSkills,
    enabledCount,
    enterpriseExtensionCount,
    teamExtensionCount,
    totalUsageCount,
    avgTestPassRate,
    deletedSkills,
    reviewingSkillIds,
    upstreamUpdateSkillIds,
    pendingUpdateCount,
    pendingUpdateSkills,
    testRunHistory,
    getUpstreamVersion,
    acceptUpstreamUpdate,
    detachFromUpstream,
    detachUpstream,
    findSkill,
    getSkillVersions,
    getReviewingVersion,
    getVersionOptions,
    getDefaultVersionTag,
    deleteSkill,
    restoreSkill,
    permanentlyDeleteSkill,
    createSkill,
    updateSkill,
    toggleSkill,
    mergeUpstreamUpdate,
    ignoreUpstreamUpdate,
    submitSkillForReview,
    approveSkillVersion,
    rejectSkillVersion,
    createDraft,
    saveDraft,
    updateDraft,
    deleteDraft,
    submitDraft,
    submitPersonalSkill,
    deletePersonalSkill,
    duplicateAsPersonalSkill,
    hasSkillNameConflict,
    setLibraryActiveVersion,
    approvePersonalSkill,
    rejectPersonalSkill,
    hasPendingReview,
    pendingReviewSkills,
    batchMergeUpstreamUpdates,
    saveTestRun,
    getTestRunHistory,
    setSelectedSkill,
    generateAITestScenarios,
    runSingleAITest,
    runAllAITests,
    resetConversation,
    sendChatMessage,
    editChatHistory,
    editChatIsRunning,
    resetEditChat,
    sendEditChatMessage,
  }
})
