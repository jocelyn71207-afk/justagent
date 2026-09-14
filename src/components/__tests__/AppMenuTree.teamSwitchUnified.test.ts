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

describe('AppMenuTree 統一切換團隊行為', () => {
  it('在用 teamId query 決定內容的頁面（知識庫管理），用團隊選單面板的切換器換團隊時，網址要立刻換成新團隊，不能只換選單文字、頁面內容留在舊團隊', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/KnowledgeBase', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.nav-team-toggle').trigger('click')
    await wrapper.find('.side-panel-switcher').trigger('click')
    const items = wrapper.findAll('.team-switch-list .team-switch-item')
    await items[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/KnowledgeBase')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam2')
  })

  it('在不吃 teamId query 的頁面（技能管理），切換團隊不用整頁導覽，網址應該維持不變', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/Skills')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.nav-team-toggle').trigger('click')
    await wrapper.find('.side-panel-switcher').trigger('click')
    const items = wrapper.findAll('.team-switch-list .team-switch-item')
    await items[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/Skills')
    expect(router.currentRoute.value.query.teamId).toBeUndefined()
  })

  it('在「最近使用」這類全域頁面，透過團隊選單面板選團隊，會被帶去團隊專案頁作為落地頁', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/ProjectDashboard')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.nav-team-toggle').trigger('click')
    await wrapper.find('.side-panel-switcher').trigger('click')
    const items = wrapper.findAll('.team-switch-list .team-switch-item')
    await items[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/TeamProject')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam2')
  })
})
