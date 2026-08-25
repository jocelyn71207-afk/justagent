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
      { path: '/view/Skills', component: Stub },
      { path: '/view/SkillTest', component: Stub },
      { path: '/view/ResourceLibrary', component: Stub },
      { path: '/view/KnowledgeBase', component: Stub },
      { path: '/view/TeamAccessManagement', component: Stub },
      { path: '/view/ProjectTrashCans', component: Stub },
      { path: '/view/CompanyTeamSettings', component: Stub },
    ],
  })
}

function findCompanyRailBtn(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.rail-btn').find(b => b.find('i').text() === 'domain')!
}

describe('AppMenuTree 統一切換團隊行為', () => {
  it('在用 teamId query 決定內容的頁面（知識庫管理），用常駐面板切換器換團隊時，網址要立刻換成新團隊，不能只換選單文字、頁面內容留在舊團隊', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/KnowledgeBase', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.side-panel-switcher').trigger('click')
    const items = wrapper.findAll('.team-switch-list .team-switch-item')
    await items[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/KnowledgeBase')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam2')
  })

  it('在同一個 teamId query 頁面，改用 rail 企業／團隊入口換團隊，結果應該跟常駐面板切換器一致（留在同一頁、只換 teamId），不是被強制導去團隊專案頁', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/ResourceLibrary', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await findCompanyRailBtn(wrapper).trigger('click')
    const teamRows = wrapper.findAll('.company-rail-list .team-switch-item--sub')
    const secondUggTeamRow = teamRows.find(r => r.text().includes('UGG實體門市'))!
    await secondUggTeamRow.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/ResourceLibrary')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam2')
  })

  it('在「最近使用」這類全域頁面（沒有任何團隊頁面可以留著），用 rail 企業／團隊入口選團隊，才會被帶去團隊專案頁', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/ProjectDashboard')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await findCompanyRailBtn(wrapper).trigger('click')
    const teamRows = wrapper.findAll('.company-rail-list .team-switch-item--sub')
    const secondUggTeamRow = teamRows.find(r => r.text().includes('UGG實體門市'))!
    await secondUggTeamRow.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/TeamProject')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam2')
  })

  it('在不吃 teamId query 的頁面（技能清單），切換團隊不用整頁導覽，網址應該維持不變', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/Skills')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.side-panel-switcher').trigger('click')
    const items = wrapper.findAll('.team-switch-list .team-switch-item')
    await items[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/Skills')
    expect(router.currentRoute.value.query.teamId).toBeUndefined()
  })
})
