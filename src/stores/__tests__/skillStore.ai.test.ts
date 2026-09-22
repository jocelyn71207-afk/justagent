import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore — AI test state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('setSelectedSkill resets AI test state', () => {
    const store = useSkillStore()
    // Seed some state
    store.aiTestScenarios.push({
      id: 'x', tag: 'normal', input: 'test', expectedBehavior: 'ok', expectedTrigger: true,
      status: 'correct', userAnswer: true,
    })
    store.aiTestReport = {
      total: 1, correct: 1,
      byTag: { normal: { total: 1, correct: 1 }, boundary: { total: 0, correct: 0 }, trigger_edge: { total: 0, correct: 0 } },
      summary: 'all good',
    }

    store.setSelectedSkill('sys-cs-001')

    expect(store.aiTestScenarios).toHaveLength(0)
    expect(store.aiTestReport).toBeNull()
    expect(store.aiTestIsGenerating).toBe(false)
  })
})

describe('generateAITestScenarios', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets scenarios with correct structure for known skillId，含明確的正確答案 expectedTrigger', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')

    expect(store.aiTestScenarios.length).toBeGreaterThanOrEqual(6)
    expect(store.aiTestIsGenerating).toBe(false)
    expect(store.aiTestReport).toBeNull()

    const first = store.aiTestScenarios[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('tag')
    expect(first).toHaveProperty('input')
    expect(first).toHaveProperty('expectedBehavior')
    expect(typeof first.expectedTrigger).toBe('boolean')
    expect(first.status).toBe('pending')
    expect(first.userAnswer).toBeUndefined()
  })

  it('每組模擬情境都混有「應該觸發」與「不應該觸發」兩種正確答案，選擇題才有意義', async () => {
    const store = useSkillStore()
    for (const skillId of ['sys-cs-001', 'ext-cs-return-001', 'sys-doc-001', 'sys-meeting-001', 'ext-erp-001']) {
      await store.generateAITestScenarios(skillId)
      const triggers = store.aiTestScenarios.map(s => s.expectedTrigger)
      expect(triggers).toContain(true)
      expect(triggers).toContain(false)
    }
  })

  it('uses DEFAULT_AI_SCENARIOS for unknown skillId', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('unknown-skill-xyz')
    expect(store.aiTestScenarios.length).toBeGreaterThan(0)
    expect(store.aiTestScenarios[0].status).toBe('pending')
  })

  it('resets previous scenarios and report when called again', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    store.aiTestScenarios[0].status = 'correct'
    await store.generateAITestScenarios('sys-cs-001')
    expect(store.aiTestScenarios.every(s => s.status === 'pending')).toBe(true)
  })
})

describe('answerAITestScenario', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('答對：status 變 correct，記下 userAnswer', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    const sc = store.aiTestScenarios[0]
    store.answerAITestScenario('sys-cs-001', sc.id, sc.expectedTrigger)

    const updated = store.aiTestScenarios.find(s => s.id === sc.id)!
    expect(updated.status).toBe('correct')
    expect(updated.userAnswer).toBe(sc.expectedTrigger)
  })

  it('答錯：status 變 incorrect', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    const sc = store.aiTestScenarios[0]
    store.answerAITestScenario('sys-cs-001', sc.id, !sc.expectedTrigger)

    const updated = store.aiTestScenarios.find(s => s.id === sc.id)!
    expect(updated.status).toBe('incorrect')
    expect(updated.userAnswer).toBe(!sc.expectedTrigger)
  })

  it('已作答過的題目再次作答不生效（one-shot）', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    const sc = store.aiTestScenarios[0]
    store.answerAITestScenario('sys-cs-001', sc.id, sc.expectedTrigger)
    store.answerAITestScenario('sys-cs-001', sc.id, !sc.expectedTrigger)
    expect(store.aiTestScenarios.find(s => s.id === sc.id)!.status).toBe('correct')
  })

  it('不存在的 scenarioId 不拋錯、無副作用', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    expect(() => store.answerAITestScenario('sys-cs-001', 'nope', true)).not.toThrow()
    expect(store.aiTestReport).toBeNull()
  })

  it('全部答完才產生報告；答對題數與 byTag 統計正確', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('ext-erp-001')
    const scenarios = [...store.aiTestScenarios]
    for (let i = 0; i < scenarios.length - 1; i++) {
      store.answerAITestScenario('ext-erp-001', scenarios[i].id, scenarios[i].expectedTrigger) // 全部答對
      expect(store.aiTestReport).toBeNull() // 還沒答完，不該有報告
    }
    const last = scenarios[scenarios.length - 1]
    store.answerAITestScenario('ext-erp-001', last.id, !last.expectedTrigger) // 故意答錯最後一題

    expect(store.aiTestReport).not.toBeNull()
    expect(store.aiTestReport!.total).toBe(scenarios.length)
    expect(store.aiTestReport!.correct).toBe(scenarios.length - 1)
    const byTagTotal = Object.values(store.aiTestReport!.byTag).reduce((sum, t) => sum + t.total, 0)
    const byTagCorrect = Object.values(store.aiTestReport!.byTag).reduce((sum, t) => sum + t.correct, 0)
    expect(byTagTotal).toBe(scenarios.length)
    expect(byTagCorrect).toBe(scenarios.length - 1)
  })

  it('答完一輪後，答對比例會寫回這顆技能的 aiTestPassRate；aiTestOverridden 若曾為 true 且這次全對會被清掉', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測試技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    store.overrideAndEnableSkill(id) // 模擬先前 override 過
    await store.generateAITestScenarios(id)
    const scenarios = [...store.aiTestScenarios]
    for (const sc of scenarios) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger) // 全部答對
    }
    const skill = store.findSkill(id)!
    expect(skill.aiTestPassRate).toBe(1)
    expect(skill.aiTestOverridden).toBe(false)
  })

  it('重新生成測驗：該技能的 aiTestPassRate／aiTestOverridden 重設為未測試狀態，isEnabled 不受影響', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測試技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    store.overrideAndEnableSkill(id)
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    expect(store.findSkill(id)!.aiTestPassRate).toBe(1)

    await store.generateAITestScenarios(id) // 重新生成

    const skill = store.findSkill(id)!
    expect(skill.aiTestPassRate).toBeNull()
    expect(skill.aiTestOverridden).toBe(false)
    expect(skill.isEnabled).toBe(true) // 不會因為重新測驗就被打回停用
  })
})
