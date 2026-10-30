import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSandboxBrain, explainDecision } from '@/composables/useSandboxBrain'
import type { RoutingCandidate } from '@/composables/useSandboxRouting'

const candidate = (over: Partial<RoutingCandidate> = {}): RoutingCandidate => ({
  skillId: 's1', name: '業績週報生成', versionName: '', agent: '業務分析助理',
  score: 4, matchedTerms: ['業績', '週報'], isDraft: false,
  description: '整理業績數據並產出週報。', capabilities: [], hasAssignedAgent: true,
  ...over,
})

describe('explainDecision：假大腦拿結果解釋原因', () => {
  it('觸發技能：講使用者要做什麼、屬於哪顆技能、交給誰，不提分數與候選', () => {
    const reason = explainDecision('幫我整理這週的業績週報', candidate(), '業務分析助理')
    expect(reason).toContain('使用者想「整理這週的業績週報」')
    expect(reason).toContain('「業績週報生成」負責的範圍（整理業績數據並產出週報）')
    expect(reason).toContain('交給負責這顆技能的「業務分析助理」')
    expect(reason).not.toMatch(/相似度|分數|候選/)
  })

  it('技能沒指派 Agent：說明暫由通用助理代為調用', () => {
    const reason = explainDecision('整理週報', candidate({ hasAssignedAgent: false }), '通用助理')
    expect(reason).toContain('還沒有指派 Agent，先交給「通用助理」代為調用')
  })

  it('草稿版本：提醒正式上線後分工可能不同', () => {
    expect(explainDecision('整理週報', candidate({ isDraft: true }), '業務分析助理')).toContain('草稿版本')
  })

  it('有技能符合但負責的 Agent 沒參與：指出是哪顆技能、哪個 Agent 沒選', () => {
    const reason = explainDecision('幫我整理這週的業績週報', null, '通用助理', candidate())
    expect(reason).toContain('原本是「業績週報生成」負責的範圍')
    expect(reason).toContain('「業務分析助理」這次沒有參與分工')
    expect(reason).toContain('由「通用助理」直接回覆')
  })

  it('沒有技能符合：不調用技能，由通用助理直接回覆', () => {
    const reason = explainDecision('今天天氣如何？', null, '通用助理')
    expect(reason).toBe('使用者想「今天天氣如何」，跟目前所有技能負責的工作都對不上，不需要調用技能，由「通用助理」直接回覆。')
  })
})

describe('useSandboxBrain：先出結果、再問原因', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('還沒選任何 Agent：不能送出', async () => {
    const brain = useSandboxBrain()
    expect(brain.selectedAgents.value).toEqual([])
    expect(brain.canSend.value).toBe(false)
    await brain.send('幫我整理這週的業績週報')
    expect(brain.messages.value).toHaveLength(0)
  })

  it('只會分給選到的 Agent：沒選業務分析助理，週報就不會分給它', async () => {
    const brain = useSandboxBrain()
    brain.toggleAgent('客服中心助理')
    const p = brain.send('幫我整理這週的業績週報')
    await vi.advanceTimersByTimeAsync(1300)
    await p
    const d = brain.messages.value[1].decision!
    expect(d.agent).toBe('客服中心助理')
    expect(d.skill).toBeNull()
    expect(d.reason).toContain('「業務分析助理」這次沒有參與分工')
    expect(d.reason).toContain('由「客服中心助理」直接回覆')
  })

  it('send：routing → 結果先出現（原因空白）→ explaining → 補上原因', async () => {
    const brain = useSandboxBrain()
    brain.toggleAgent('業務分析助理')
    const p = brain.send('幫我整理這週的業績週報')
    expect(brain.phase.value).toBe('routing')
    expect(brain.messages.value).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(700)
    expect(brain.phase.value).toBe('explaining')
    const reply = brain.messages.value[1]
    expect(reply.decision?.agent).toBe('業務分析助理')
    expect(reply.decision?.reason).toBe('')

    await vi.advanceTimersByTimeAsync(600)
    await p
    expect(brain.phase.value).toBe('idle')
    expect(brain.messages.value[1].decision?.reason).toContain('使用者想「整理這週的業績週報」')
  })

  it('對話開始後鎖定 Agent：不能增減，重置對話後才能再改', async () => {
    const brain = useSandboxBrain()
    brain.toggleAgent('業務分析助理')
    expect(brain.agentsLocked.value).toBe(false)

    const p = brain.send('幫我整理這週的業績週報')
    expect(brain.agentsLocked.value).toBe(true)
    brain.toggleAgent('客服中心助理')
    await vi.advanceTimersByTimeAsync(1300)
    await p

    brain.toggleAgent('客服中心助理')
    brain.toggleAgent('業務分析助理')
    expect(brain.selectedAgents.value).toEqual(['業務分析助理'])

    brain.reset()
    expect(brain.agentsLocked.value).toBe(false)
    brain.toggleAgent('客服中心助理')
    expect(brain.selectedAgents.value).toEqual(['業務分析助理', '客服中心助理'])
  })

  it('處理中不接受新訊息、也不能重置', async () => {
    const brain = useSandboxBrain()
    brain.toggleAgent('倉儲管理助理')
    const p = brain.send('查一下 A 倉的庫存')
    await brain.send('另一句')
    brain.reset()
    expect(brain.messages.value).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1300)
    await p
    brain.reset()
    expect(brain.messages.value).toHaveLength(0)
  })
})
