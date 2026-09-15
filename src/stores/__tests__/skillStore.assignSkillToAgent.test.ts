import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore, AVAILABLE_AGENTS } from '@/stores/skillStore'

// ext-erp-001 的預設 assignedAgents 是 ['業務分析助理', '倉儲管理助理']，
// 這裡選用 AVAILABLE_AGENTS[0]（'通用助理'）確保「加入」情境不會跟預先塞好的
// assignedAgents 重複到。
const TEST_AGENT_NAME = AVAILABLE_AGENTS[0]

describe('skillStore.assignSkillToAgent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('把 Agent 名稱加入指定技能的 assignedAgents', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('ext-erp-001', TEST_AGENT_NAME)
    expect(store.findSkill('ext-erp-001')?.assignedAgents).toContain(TEST_AGENT_NAME)
  })

  it('重複呼叫同一組 skillId/agentName 不會造成 assignedAgents 出現重複名稱', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('ext-erp-001', TEST_AGENT_NAME)
    store.assignSkillToAgent('ext-erp-001', TEST_AGENT_NAME)
    const assigned = store.findSkill('ext-erp-001')?.assignedAgents ?? []
    expect(assigned.filter(name => name === TEST_AGENT_NAME)).toHaveLength(1)
  })

  it('對不存在的 skillId 呼叫時安全略過，不拋錯', () => {
    const store = useSkillStore()
    expect(() => store.assignSkillToAgent('not-exist', TEST_AGENT_NAME)).not.toThrow()
  })
})
