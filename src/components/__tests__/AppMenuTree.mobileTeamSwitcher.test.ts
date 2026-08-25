import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 手機版團隊切換模型與桌機統一', () => {
  function openMobileMenu() {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })
    return wrapper
  }

  it('不應該用手風琴：每個團隊各自一個可展開表頭的結構已移除', async () => {
    const wrapper = openMobileMenu()
    await wrapper.find('.hamburger-btn').trigger('click')

    expect(wrapper.find('.mobile-team-header').exists()).toBe(false)
  })

  it('開啟選單時已經直接顯示目前選定團隊的切換器與其項目，不用先展開', async () => {
    const wrapper = openMobileMenu()
    await wrapper.find('.hamburger-btn').trigger('click')
    const mobileMenu = wrapper.find('.AppMenuTreeMobile')

    expect(mobileMenu.find('.mobile-team-switcher').exists()).toBe(true)
    expect(mobileMenu.text()).toContain('UGG電子商務') // 預設選中第一個團隊
    expect(mobileMenu.text()).toContain('團隊專案')
  })

  it('點擊切換器選擇第二個團隊後，團隊專案連結的 teamId 應該跟著變更', async () => {
    const wrapper = openMobileMenu()
    await wrapper.find('.hamburger-btn').trigger('click')
    const mobileMenu = wrapper.find('.AppMenuTreeMobile')

    await mobileMenu.find('.mobile-team-switcher').trigger('click')
    const secondTeamOption = mobileMenu.findAll('.team-switch-item')[1]
    await secondTeamOption.trigger('click')

    const teamProjectLink = mobileMenu.findAllComponents({ name: 'RouterLink' })
      .find((c: ReturnType<typeof mobileMenu.findComponent>) => c.text().includes('團隊專案'))
    expect(teamProjectLink?.props('to')).toMatchObject({ query: { teamId: 'testTeam2' } })
  })
})
