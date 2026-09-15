import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore.assignSkillToAgent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('把 Agent id 加入指定技能的 assignedAgents', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    expect(store.findSkill('sys-doc-001')?.assignedAgents).toContain('agent-content-creator')
  })

  it('重複呼叫同一組 skillId/agentId 不會造成 assignedAgents 出現重複 id', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    const assigned = store.findSkill('sys-doc-001')?.assignedAgents ?? []
    expect(assigned.filter(id => id === 'agent-content-creator')).toHaveLength(1)
  })

  it('對不存在的 skillId 呼叫時安全略過，不拋錯', () => {
    const store = useSkillStore()
    expect(() => store.assignSkillToAgent('not-exist', 'agent-content-creator')).not.toThrow()
  })
})
