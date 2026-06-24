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

export interface Skill {
  id: string
  name: string
  description: string
  type: 'system' | 'extension'
  origin: 'platform_created' | 'conversation_evolved' | 'custom_version' | 'manually_created'
  version: string
  isEnabled: boolean
  usageCount: number
  testPassRate: number       // 0–1
  avgLatencyMs: number
  forkSourceId?: string
  forkSourceVersion?: string
  upstreamLink: 'linked' | 'unlinked'
  upstreamUpdateStatus: 'up_to_date' | 'update_available' | 'conflict' | 'ignored'
  evolutionContext?: string
  instructions?: string
  triggerHint?: string
  capabilities?: SkillCapability[]
  assignedAgents?: string[]
  testCases?: SkillTestCase[]
  deletedAt?: string
  children?: Skill[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  toolTrace?: { name: string; latencyMs: number }[]
}

const MOCK_SKILLS: Skill[] = [
  {
    id: 'sys-cs-001',
    name: '通用客服機器人',
    description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
    type: 'system',
    origin: 'platform_created',
    version: '2.4.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.96,
    avgLatencyMs: 280,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
    capabilities: [
      { name: '問題分類', description: '依使用者訊息語意自動分類問題類型，如退貨、查詢、投訴等。' },
      { name: 'FAQ 查詢', description: '比對知識庫快速回覆常見問題，支援模糊比對與同義詞展開。' },
      { name: '情緒分析', description: '識別使用者情緒狀態，必要時自動觸發轉接人工客服流程。' },
      { name: '多語言支援', description: '支援繁中、簡中、英文等多語言自動偵測與回覆。' },
    ],
    assignedAgents: ['客服中心助理', '電商小幫手'],
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
        origin: 'conversation_evolved',
        version: '1.0.0',
        isEnabled: true,
        usageCount: 89,
        testPassRate: 0.94,
        avgLatencyMs: 342,
        forkSourceId: 'sys-cs-001',
        forkSourceVersion: '2.3.1',
        upstreamLink: 'linked',
        upstreamUpdateStatus: 'update_available',
        evolutionContext: '用戶說：「以後遇到退貨問題，先查詢訂單狀態再根據退貨政策給建議」',
        capabilities: [
          { name: '訂單狀態查詢', description: '根據訂單編號查詢目前處理狀態與物流資訊。' },
          { name: '退貨資格判斷', description: '依設定的退貨規則自動判斷是否符合退貨條件並給出建議。' },
        ],
        assignedAgents: ['客服中心助理'],
        testCases: [
          { name: '退貨資格確認', input: '我在 2024/11/15 購買了一件外套，現在可以退貨嗎？' },
          { name: '逾期退貨申請', input: '我超過 30 天了，但商品真的有問題，有辦法退嗎？' },
          { name: '詢問退款時間', input: '退貨後多久可以收到退款？' },
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
    version: '1.5.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.91,
    avgLatencyMs: 450,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
    capabilities: [
      { name: '長文摘要', description: '自動提取文件重點，生成條列式或段落式摘要。' },
      { name: '多格式支援', description: '解析 PDF、Word、Markdown 等常見格式，保留段落結構。' },
      { name: '關鍵字提取', description: '識別文件核心主題與高頻關鍵詞，輔助知識分類。' },
      { name: '結構化輸出', description: '以 JSON 或 Markdown 格式輸出摘要結果，便於下游系統使用。' },
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
    version: '2.1.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.88,
    avgLatencyMs: 520,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
    capabilities: [
      { name: '語音轉文字', description: '將會議錄音檔轉換為帶時間戳記的完整文字逐字稿。' },
      { name: '摘要生成', description: '提取會議重點、關鍵決策與討論結論，生成結構化摘要。' },
      { name: 'Action Items', description: '自動識別待辦事項並整理負責人與預計完成日期。' },
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
        version: '1.2.0',
        isEnabled: true,
        usageCount: 34,
        testPassRate: 0.85,
        avgLatencyMs: 480,
        forkSourceId: 'sys-meeting-001',
        forkSourceVersion: '2.0.0',
        upstreamLink: 'unlinked',
        upstreamUpdateStatus: 'ignored',
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
    version: '1.1.0',
    isEnabled: true,
    usageCount: 156,
    testPassRate: 0.99,
    avgLatencyMs: 120,
    upstreamLink: 'unlinked',
    upstreamUpdateStatus: 'ignored',
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
  },
]

export const useSkillStore = defineStore('skillStore', () => {
  const skills = ref<Skill[]>(JSON.parse(JSON.stringify(MOCK_SKILLS)))
  const selectedSkillId = ref<string | null>(null)
  const testConversationHistory = ref<ChatMessage[]>([])
  const testJsonInput = ref<string>('{\n  "user_message": "",\n  "context": {}\n}')
  const testJsonOutput = ref<string | null>(null)
  const testIsRunning = ref(false)

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
  const extensionCount = computed(() => flatSkills.value.filter(s => s.type === 'extension').length)
  const totalUsageCount = computed(() => flatSkills.value.reduce((sum, s) => sum + s.usageCount, 0))
  const avgTestPassRate = computed(() => {
    const all = flatSkills.value
    if (!all.length) return 0
    return Math.round(all.reduce((sum, s) => sum + s.testPassRate, 0) / all.length * 100)
  })
  const firstPendingUpdate = computed(() =>
    flatSkills.value.find(s => s.upstreamUpdateStatus === 'update_available') ?? null
  )

  function findSkill(id: string): Skill | undefined {
    return flatSkills.value.find(s => s.id === id)
  }

  function toggleSkill(id: string): void {
    const skill = findSkill(id)
    if (skill) skill.isEnabled = !skill.isEnabled
  }

  function ignoreUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (skill) skill.upstreamUpdateStatus = 'ignored'
  }

  function mergeUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamUpdateStatus = 'up_to_date'
      if (skill.forkSourceVersion) skill.forkSourceVersion = skill.version
    }
  }

  function detachUpstream(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamLink = 'unlinked'
      skill.upstreamUpdateStatus = 'ignored'
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

  // 搜尋含已刪除的所有技能（供 restore / permanentDelete 使用）
  function _findAny(id: string): Skill | undefined {
    for (const s of skills.value) {
      if (s.id === id) return s
      if (s.children) {
        const c = s.children.find(c => c.id === id)
        if (c) return c
      }
    }
  }

  function createSkill(data: {
    name: string
    description: string
    instructions: string
    triggerHint: string
    isEnabled: boolean
    assignedAgents: string[]
  }): void {
    skills.value.push({
      id: `ext-custom-${skills.value.length + 1}`,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      triggerHint: data.triggerHint,
      assignedAgents: data.assignedAgents,
      type: 'extension',
      origin: 'manually_created',
      version: '1.0.0',
      isEnabled: data.isEnabled,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
      upstreamLink: 'unlinked',
      upstreamUpdateStatus: 'ignored',
    })
  }

  function updateSkill(id: string, data: {
    name: string
    description: string
    instructions: string
    triggerHint: string
    isEnabled: boolean
    assignedAgents: string[]
  }): void {
    const skill = findSkill(id)
    if (!skill) return
    skill.name = data.name
    skill.description = data.description
    skill.instructions = data.instructions
    skill.triggerHint = data.triggerHint
    skill.isEnabled = data.isEnabled
    skill.assignedAgents = data.assignedAgents
  }

  function setSelectedSkill(id: string): void {
    selectedSkillId.value = id
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

  async function runJsonTest(_skillId: string, _input: string): Promise<void> {
    testIsRunning.value = true
    testJsonOutput.value = null
    await new Promise(r => setTimeout(r, 600))
    testJsonOutput.value = JSON.stringify({
      reply: '（Mock）已收到輸入並完成處理',
      action: 'processed',
      confidence: 0.92,
      tools_called: ['query-knowledge-base'],
    }, null, 2)
    testIsRunning.value = false
  }

  return {
    skills,
    selectedSkillId,
    testConversationHistory,
    testJsonInput,
    testJsonOutput,
    testIsRunning,
    flatSkills,
    enabledCount,
    extensionCount,
    totalUsageCount,
    avgTestPassRate,
    firstPendingUpdate,
    deletedSkills,
    findSkill,
    deleteSkill,
    restoreSkill,
    permanentlyDeleteSkill,
    createSkill,
    updateSkill,
    toggleSkill,
    ignoreUpstreamUpdate,
    mergeUpstreamUpdate,
    detachUpstream,
    setSelectedSkill,
    resetConversation,
    sendChatMessage,
    runJsonTest,
  }
})
