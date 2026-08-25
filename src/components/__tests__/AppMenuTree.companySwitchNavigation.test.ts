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

async function switchToSecondCompany(wrapper: ReturnType<typeof mount>) {
  await findRailBtn(wrapper, 'domain').trigger('click')
  const companyRows = wrapper.findAll('.company-rail-list .team-switch-item--company')
  await companyRows[1].trigger('click')
  await flushPromises()
}

describe('AppMenuTree 切換企業後的導覽行為', () => {
  it('停在某個團隊頁面時切換企業，會被帶去新企業第一個團隊的團隊專案頁', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/KnowledgeBase', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await switchToSecondCompany(wrapper)

    expect(router.currentRoute.value.path).toBe('/view/TeamProject')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam3')
  })

  it('停在「最近使用」這類全域頁面時切換企業，不會被強制導覽（全域頁面不分企業）', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/ProjectDashboard')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await switchToSecondCompany(wrapper)

    expect(router.currentRoute.value.path).toBe('/view/ProjectDashboard')
  })

  it('選同一間企業（沒有真的切換）不應該觸發任何導覽', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/KnowledgeBase', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await findRailBtn(wrapper, 'domain').trigger('click')
    const companyRows = wrapper.findAll('.company-rail-list .team-switch-item--company')
    await companyRows[0].trigger('click') // 目前就是第一間企業
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/KnowledgeBase')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam1')
  })
})
