import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'

// 個人技能送審前這一版一定要測過（交卷就算，不要求全對）。沒測過時在啟用流程那個對話框裡
// 就地做 AI 快速測試，不導去測試沙盒；跟啟用不同，沒有「略過」選項，只能測完繼續或取消
describe('SkillManagement 送審前的測試閘門', () => {
  let currentWrapper: VueWrapper | null = null

  afterEach(() => {
    currentWrapper?.unmount()
    currentWrapper = null
  })

  async function mountPage() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
        { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillReviewDrawer: true, UpstreamUpdateDrawer: true, BatchUpdateModal: true } } },
    )
    currentWrapper = wrapper
    return { wrapper: wrapper.findComponent(SkillManagement), router }
  }

  const body = () => new DOMWrapper(document.body)
  const flush = () => new Promise(r => setTimeout(r, 0))

  async function clickSubmit(wrapper: VueWrapper<any>, id: string) {
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await body().find('.dh-btn--submit').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
  }

  function continueBtn() {
    return body().findAll('.enable-gate-dialog button').find(b => b.text().includes('繼續送審'))!
  }

  it('這一版沒測過：點「送審」直接在對話框裡測試，不導頁；交卷前「繼續送審」反灰，交卷後才打開送審 dialog', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '沒測過的技能', instructions: 'x', description: 'y', assignedAgents: [] })
    const { wrapper, router } = await mountPage()
    const push = vi.spyOn(router, 'push')

    await clickSubmit(wrapper, id)

    const dialog = body().find('.enable-gate-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('送審前')
    expect(dialog.text()).not.toContain('不測試')
    expect(continueBtn().attributes('disabled')).toBeDefined()
    expect((wrapper.vm as any).submitConfirmSkill).toBeNull()

    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) store.answerAITestScenario(id, sc.id, !sc.agentAnswer) // 全錯也算測過
    await wrapper.vm.$nextTick()
    expect(continueBtn().attributes('disabled')).toBeUndefined()

    await continueBtn().trigger('click')
    await flush()
    await wrapper.vm.$nextTick()

    expect(body().find('.enable-gate-dialog').exists()).toBe(false)
    expect((wrapper.vm as any).submitConfirmSkill?.id).toBe(id)
    expect(push).not.toHaveBeenCalledWith(expect.objectContaining({ path: '/view/SkillTest' }))
  })

  it('測試對話框按「取消」：關閉，不打開送審 dialog、不送審', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '沒測過的技能2', instructions: 'x', description: 'y', assignedAgents: [] })
    const { wrapper } = await mountPage()

    await clickSubmit(wrapper, id)
    await body().findAll('.enable-gate-dialog button').find(b => b.text().includes('取消'))!.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()

    expect(body().find('.enable-gate-dialog').exists()).toBe(false)
    expect((wrapper.vm as any).submitConfirmSkill).toBeNull()
    expect(store.findSkill(id)!.personalStatus).not.toBe('reviewing')
  })

  it('這一版已經測過：不彈測試對話框，直接打開送審 dialog', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測過的技能', instructions: 'x', description: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) store.answerAITestScenario(id, sc.id, sc.agentAnswer)
    const { wrapper } = await mountPage()

    await clickSubmit(wrapper, id)

    expect(body().find('.enable-gate-dialog').exists()).toBe(false)
    expect((wrapper.vm as any).submitConfirmSkill?.id).toBe(id)
  })

  it('建立新技能：範本名稱預設帶入技能名稱，清空時不能送出，改名後送出的範本名稱就是 Library 顯示名稱', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '週報小幫手', instructions: 'x', description: 'y', assignedAgents: [] })
    store.findSkill(id)!.aiTestPassRate = 1
    const { wrapper } = await mountPage()

    await clickSubmit(wrapper, id)
    const vm = wrapper.vm as any
    vm.submitMode = 'new_skill'
    vm.submitVersionName = '初版'
    await wrapper.vm.$nextTick()

    const nameField = body().findAll('.draft-submit-dialog .dsd-team').find(f => f.text().includes('範本名稱'))!
    const input = nameField.find('input')
    expect((input.element as HTMLInputElement).value).toBe('週報小幫手')

    await input.setValue('  ')
    const sendBtn = body().findAll('.draft-submit-dialog button').find(b => b.text().includes('送出審核'))!
    expect(sendBtn.attributes('disabled')).toBeDefined()

    await input.setValue('團隊週報範本')
    expect(sendBtn.attributes('disabled')).toBeUndefined()
    await sendBtn.trigger('click')

    expect(store.findSkill(id)!.personalStatus).toBe('reviewing')
    expect(store.findSkill(id)!.libraryName).toBe('團隊週報範本')
  })

  it('更新版本：不顯示範本名稱欄位', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '週報小幫手2', instructions: 'x', description: 'y', assignedAgents: [] })
    store.findSkill(id)!.aiTestPassRate = 1
    const { wrapper } = await mountPage()

    await clickSubmit(wrapper, id)
    ;(wrapper.vm as any).submitMode = 'version_update'
    await wrapper.vm.$nextTick()

    expect(body().findAll('.draft-submit-dialog .dsd-team').some(f => f.text().includes('範本名稱'))).toBe(false)
  })
})
