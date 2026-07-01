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
      id: 'x', tag: 'normal', input: 'test', expectedBehavior: 'pass',
      status: 'pass', agentReply: 'ok', aiJudgment: 'ok',
    })
    store.aiTestReport = {
      total: 1, passed: 1,
      byTag: { normal: { total: 1, passed: 1 }, boundary: { total: 0, passed: 0 }, trigger_edge: { total: 0, passed: 0 } },
      summary: 'all good',
    }

    store.setSelectedSkill('sys-cs-001')

    expect(store.aiTestScenarios).toHaveLength(0)
    expect(store.aiTestReport).toBeNull()
    expect(store.aiTestIsGenerating).toBe(false)
    expect(store.aiTestIsRunning).toBe(false)
  })
})

describe('generateAITestScenarios', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets scenarios with correct structure for known skillId', async () => {
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
    expect(first.status).toBe('pending')
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
    store.aiTestScenarios[0].status = 'pass'
    await store.generateAITestScenarios('sys-cs-001')
    expect(store.aiTestScenarios.every(s => s.status === 'pending')).toBe(true)
  })
})

describe('runSingleAITest', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets status to pass or fail and populates agentReply + aiJudgment', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('sys-cs-001')
    const sc = store.aiTestScenarios[0]
    await store.runSingleAITest('sys-cs-001', sc.id)

    const updated = store.aiTestScenarios.find(s => s.id === sc.id)!
    expect(['pass', 'fail']).toContain(updated.status)
    expect(updated.agentReply).toBeTruthy()
    expect(updated.aiJudgment).toBeTruthy()
  })
})

describe('runAllAITests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('runs all pending scenarios and populates aiTestReport', async () => {
    const store = useSkillStore()
    await store.generateAITestScenarios('ext-erp-001')
    await store.runAllAITests('ext-erp-001')

    expect(store.aiTestIsRunning).toBe(false)
    expect(store.aiTestScenarios.every(s => s.status === 'pass' || s.status === 'fail')).toBe(true)
    expect(store.aiTestReport).not.toBeNull()
    expect(store.aiTestReport!.total).toBe(store.aiTestScenarios.length)
    expect(store.aiTestReport!.passed).toBeLessThanOrEqual(store.aiTestReport!.total)
  }, 15000)
})
