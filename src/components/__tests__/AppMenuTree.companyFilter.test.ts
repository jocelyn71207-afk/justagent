import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

const Stub = { template: '<div/>' }

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/view/ProjectDashboard', component: Stub },
      { path: '/view/Explore', component: Stub },
      { path: '/view/TeamProject', component: Stub },
      { path: '/view/KnowledgeBase', component: Stub },
    ],
  })
}

function findRailBtn(wrapper: ReturnType<typeof mount>, icon: string) {
  return wrapper.findAll('.rail-btn').find(b => b.find('i').text() === icon)!
}

describe('AppMenuTree 團隊切換器依企業篩選', () => {
  it('預設（第一間企業）的常駐面板切換器，只列出第一間企業的團隊，不會混入第二間企業的團隊', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.side-panel-switcher').trigger('click')
    const names = wrapper.findAll('.team-switch-list .team-switch-name').map(n => n.text())

    expect(names).toContain('UGG電子商務')
    expect(names).toContain('UGG實體門市')
    expect(names).not.toContain('橙心門市')
  })

  it('切到第二間企業後，常駐面板切換器只列出第二間企業的團隊', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await findRailBtn(wrapper, 'domain').trigger('click')
    const companyRows = wrapper.findAll('.company-rail-list .team-switch-item--company')
    await companyRows[1].trigger('click') // 第二間企業
    await flushPromises()

    await wrapper.find('.side-panel-switcher').trigger('click')
    const names = wrapper.findAll('.team-switch-list .team-switch-name').map(n => n.text())

    expect(names).toEqual(['橙心門市'])
  })
})
