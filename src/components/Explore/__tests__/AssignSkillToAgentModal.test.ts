import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AssignSkillToAgentModal from '../AssignSkillToAgentModal.vue'
import { useSkillStore, AVAILABLE_AGENTS } from '@/stores/skillStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function mountModal() {
  setActivePinia(createPinia())
  const skillStore = useSkillStore()
  const skill = skillStore.findSkill('ext-erp-001')!
  const wrapper = mount(AssignSkillToAgentModal, {
    props: { modelValue: true, skill },
  })
  return { wrapper, skillStore, skill }
}

describe('AssignSkillToAgentModal', () => {
  it('點選一個尚未裝過的 Agent 會呼叫 skillStore.assignSkillToAgent，並關閉 Modal', async () => {
    const { wrapper, skillStore, skill } = mountModal()
    const firstAgent = AVAILABLE_AGENTS[0]
    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.text()).toContain(firstAgent)

    await item.trigger('click')

    expect(skillStore.findSkill(skill.id)?.assignedAgents).toContain(firstAgent)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('已經裝過此技能的 Agent 顯示為已裝入，點擊不會重複加入也不會關閉 Modal', async () => {
    const { wrapper, skillStore, skill } = mountModal()
    const firstAgent = AVAILABLE_AGENTS[0]

    skillStore.assignSkillToAgent(skill.id, firstAgent)
    await wrapper.vm.$nextTick()

    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.classes()).toContain('assign-agent-item--assigned')
    expect(item.text()).toContain('已裝入')

    await item.trigger('click')
    const assigned = skillStore.findSkill(skill.id)?.assignedAgents ?? []
    expect(assigned.filter(id => id === firstAgent)).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('輸入搜尋關鍵字可以篩選 Agent 清單', async () => {
    const { wrapper } = mountModal()
    const targetAgent = AVAILABLE_AGENTS.find(a => a.includes('客服'))!
    const input = wrapper.find('.assign-agent-search input')
    await input.setValue('客服')

    const items = wrapper.findAll('.assign-agent-item')
    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(items.some(i => i.text().includes(targetAgent))).toBe(true)
  })
})
