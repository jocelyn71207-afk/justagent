import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'

// 個人技能啟用前要先通過 AI 快速測試（或明確選擇略過），這裡測技能詳情抽屜
// 「啟用技能」按鈕接上的決策對話框：沒過關就攔下來，不直接切換。
describe('SkillManagement 啟用前的測試閘門', () => {
  let currentWrapper: VueWrapper | null = null

  afterEach(() => {
    currentWrapper?.unmount()
    currentWrapper = null
  })

  function mountPage() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
      ],
    })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillReviewDrawer: true, UpstreamUpdateDrawer: true, BatchUpdateModal: true } },
    })
    currentWrapper = wrapper
    return { wrapper, router }
  }

  it('技能從沒測過：點「啟用技能」不會直接切換，改彈出決策對話框', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()

    const toggleBtn = new DOMWrapper(document.body).find('.dm-toggle-btn')
    expect(toggleBtn.text()).toContain('啟用技能')
    await toggleBtn.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(false)
    const dialog = new DOMWrapper(document.body).find('.enable-gate-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('還沒有做過 AI 快速測試')
  })

  it('決策對話框選「視為通過，直接啟用」：呼叫 overrideAndEnableSkill，對話框關閉', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.aiTestOverridden).toBe(true)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })

  it('決策對話框選「去修改技能內容」：導向 AI 賦能並帶 skillId，不切換 isEnabled', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能3', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    const reviseBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('去修改'))!
    await reviseBtn.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio', query: { skillId: id } })
    expect(store.findSkill(id)!.isEnabled).toBe(false)
  })

  it('已經全對過的技能：點「啟用技能」直接切換，不彈對話框', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    expect(store.findSkill(id)!.aiTestPassRate).toBe(1)

    const { wrapper } = mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })

  it('停用方向（目前已啟用）：一律直接切換，不檢查、不彈窗', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '要停用的技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    store.overrideAndEnableSkill(id)
    const { wrapper } = mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(false)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })
})
