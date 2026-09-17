import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'

// 點「我的技能」頁的「建立技能」先問要用哪種方式：AI 賦能（對話或積木，
// 由 AI 賦能自己的方式選擇畫面再問一次）或手動走 SkillEditor 三步驟表單。
describe('SkillManagement 建立技能：先選建立方式', () => {
  let currentWrapper: VueWrapper | null = null

  // <Teleport to="body"> 的內容不會隨 wrapper 一起被回收，不手動 unmount
  // 下一個 it() 會在 document.body 裡看到上一輪殘留的按鈕
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
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
    currentWrapper = wrapper
    return { wrapper, router }
  }

  it('點「建立技能」先彈出選擇框，不直接跳轉', async () => {
    setActivePinia(createPinia())
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('建立技能'))
    expect(createBtn).toBeDefined()
    await createBtn!.trigger('click')

    expect(push).not.toHaveBeenCalled()
    const dialogButtons = new DOMWrapper(document.body).findAll('.drawer-confirm-dialog button')
    expect(dialogButtons).toHaveLength(2)
    expect(dialogButtons[0].text()).toContain('用 AI 賦能建立')
    expect(dialogButtons[1].text()).toContain('手動建立')
  })

  it('選「用 AI 賦能建立」導向 SkillStudio（空白建立，不帶 skillId）', async () => {
    setActivePinia(createPinia())
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('建立技能'))
    await createBtn!.trigger('click')

    const studioBtn = new DOMWrapper(document.body).findAll('.drawer-confirm-dialog button').find(b => b.text().includes('AI 賦能'))!
    await studioBtn.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio' })
    expect(new DOMWrapper(document.body).find('.drawer-confirm-dialog').exists()).toBe(false)
  })

  it('選「手動建立」導向 SkillEditor', async () => {
    setActivePinia(createPinia())
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('建立技能'))
    await createBtn!.trigger('click')

    const manualBtn = new DOMWrapper(document.body).findAll('.drawer-confirm-dialog button').find(b => b.text().includes('手動建立'))!
    await manualBtn.trigger('click')

    expect(push).toHaveBeenCalledWith('/view/SkillEditor')
    expect(new DOMWrapper(document.body).find('.drawer-confirm-dialog').exists()).toBe(false)
  })
})
