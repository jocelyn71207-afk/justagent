import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 企業/團隊設定改名為企業設定', () => {
  it('手機版選單連結文字應為「企業設定」', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })
    await wrapper.find('.hamburger-btn').trigger('click')

    const mobileMenu = wrapper.find('.AppMenuTreeMobile')
    expect(mobileMenu.text()).toContain('企業設定')
    expect(mobileMenu.text()).not.toContain('企業/團隊設定')
  })

  it('rail 上的企業設定圖示 tooltip 文字應為「企業設定」，不是舊的「企業/團隊設定」', () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, {
      global: {
        plugins: [router],
        directives: {
          tooltip: {
            mounted(el, binding) { el.setAttribute('data-tooltip', binding.value) },
          },
        },
      },
    })

    const settingsLink = wrapper.findAll('.rail-btn').find(b => b.find('i').text() === 'settings')!
    expect(settingsLink.attributes('data-tooltip')).toBe('企業設定')
  })
})
