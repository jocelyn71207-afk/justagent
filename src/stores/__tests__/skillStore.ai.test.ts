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
