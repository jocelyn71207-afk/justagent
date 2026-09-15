import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AssignSkillToAgentModal from '../AssignSkillToAgentModal.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useExploreStore } from '@/stores/exploreStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function mountModal() {
  setActivePinia(createPinia())
  const skillStore = useSkillStore()
  const exploreStore = useExploreStore()
  const skill = skillStore.findSkill('sys-doc-001')!
  const wrapper = mount(AssignSkillToAgentModal, {
    props: { modelValue: true, skill },
  })
  return { wrapper, skillStore, exploreStore, skill }
}

describe('AssignSkillToAgentModal', () => {
  it('點選一個尚未裝過的 Agent 會呼叫 skillStore.assignSkillToAgent，並關閉 Modal', async () => {
    const { wrapper, skillStore, exploreStore, skill } = mountModal()
    const firstAgent = exploreStore.agents[0]
    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.text()).toContain(firstAgent.name)

    await item.trigger('click')

    expect(skillStore.findSkill(skill.id)?.assignedAgents).toContain(firstAgent.id)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('已經裝過此技能的 Agent 顯示為已裝入，點擊不會重複加入也不會關閉 Modal', async () => {
    const { wrapper, skillStore, exploreStore, skill } = mountModal()
    const firstAgent = exploreStore.agents[0]

    skillStore.assignSkillToAgent(skill.id, firstAgent.id)
    await wrapper.vm.$nextTick()

    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.classes()).toContain('assign-agent-item--assigned')
    expect(item.text()).toContain('已裝入')

    await item.trigger('click')
    const assigned = skillStore.findSkill(skill.id)?.assignedAgents ?? []
    expect(assigned.filter(id => id === firstAgent.id)).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('輸入搜尋關鍵字可以篩選 Agent 清單', async () => {
    const { wrapper } = mountModal()
    const input = wrapper.find('.assign-agent-search input')
    await input.setValue('設計')

    const items = wrapper.findAll('.assign-agent-item')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('設計助理')
  })
})
