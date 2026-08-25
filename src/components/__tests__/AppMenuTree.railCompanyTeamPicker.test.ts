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

async function openPicker(wrapper: ReturnType<typeof mount>) {
  await findRailBtn(wrapper, 'domain').trigger('click')
}

describe('AppMenuTree rail 企業／團隊合併為單一切換入口', () => {
  it('rail 上不再有獨立的「團隊」圖示，只剩「企業」一個切換入口', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    expect(wrapper.findAll('.rail-btn').find(b => b.find('i').text() === 'groups')).toBeUndefined()
  })

  it('打開企業 popover，每間企業底下都巢狀列出屬於它的團隊，不受目前選定企業限制', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await openPicker(wrapper)
    const popover = wrapper.find('.company-rail-list')
    expect(popover.find('.rail-popover-label').text()).toContain('企業')

    const companyNames = popover.findAll('.team-switch-item--company .team-switch-name').map(n => n.text())
    const teamNames = popover.findAll('.team-switch-item--sub .team-switch-name').map(n => n.text())

    expect(companyNames).toEqual(expect.arrayContaining(['UGG', '橙心']))
    // 目前選定企業是 UGG，但另一間企業「橙心」底下的團隊也要看得到，才能一次跳過去
    expect(teamNames).toEqual(expect.arrayContaining(['UGG電子商務', 'UGG實體門市', '橙心門市']))
  })

  it('企業列跟團隊列的色塊形狀維持區隔（企業圓形、團隊方塊）', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await openPicker(wrapper)
    const companyDot = wrapper.find('.team-switch-item--company .team-switch-dot')
    const teamDot = wrapper.find('.team-switch-item--sub .team-switch-dot')

    expect(companyDot.classes()).not.toEqual(teamDot.classes())
  })

  it('直接點另一間企業底下的團隊，會同時切換使用中企業與團隊，並依當下頁面情境導覽', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push({ path: '/view/KnowledgeBase', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await openPicker(wrapper)
    const orangeheartTeamRow = wrapper.findAll('.team-switch-item--sub').find(r => r.text().includes('橙心門市'))!
    await orangeheartTeamRow.trigger('click')
    await flushPromises()

    // 點的是「知識庫管理」情境下的一個團隊，應該留在知識庫管理頁面、只換 teamId
    expect(router.currentRoute.value.path).toBe('/view/KnowledgeBase')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam3')

    // 常駐面板切換器現在應該顯示橙心的團隊，證明使用中企業也真的換了
    await wrapper.find('.side-panel-switcher').trigger('click')
    const names = wrapper.findAll('.team-switch-list .team-switch-name').map(n => n.text())
    expect(names).toEqual(['橙心門市'])
  })

  it('在全域頁面（最近使用）點另一間企業底下的團隊，會被帶去團隊專案頁', async () => {
    setActivePinia(createPinia())
    const router = makeRouter()
    await router.push('/view/ProjectDashboard')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await openPicker(wrapper)
    const orangeheartTeamRow = wrapper.findAll('.team-switch-item--sub').find(r => r.text().includes('橙心門市'))!
    await orangeheartTeamRow.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/view/TeamProject')
    expect(router.currentRoute.value.query.teamId).toBe('testTeam3')
  })
})
