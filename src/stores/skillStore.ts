import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Skill {
  id: string
  name: string
  description: string
  type: 'system' | 'extension'
  origin: 'platform_created' | 'conversation_evolved' | 'custom_version'
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
  children?: Skill[]         // 僅 system skill 有此欄位
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
      },
    ],
  },
  {
    id: 'ext-erp-001',
    name: 'ERP 庫存查詢',
    description: '根據產品 ID 查詢即時庫存量，支援多個倉庫',
    type: 'extension',
    origin: 'custom_version',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 156,
    testPassRate: 0.99,
    avgLatencyMs: 120,
    upstreamLink: 'unlinked',
    upstreamUpdateStatus: 'ignored',
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
      result.push(s)
      if (s.children) result.push(...s.children)
    }
    return result
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
    findSkill,
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
