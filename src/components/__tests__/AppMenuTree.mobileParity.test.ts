import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 手機版與桌機版選單項目一致', () => {
  it('展開手機選單後，團隊區塊應包含技能測試沙盒與知識庫管理連結', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    await wrapper.find('.hamburger-btn').trigger('click')
    const mobileMenu = wrapper.find('.AppMenuTreeMobile')
    expect(mobileMenu.exists()).toBe(true)

    // 技能管理／共享資源庫兩個群組預設收合，展開後才看得到子項目
    const groups = mobileMenu.findAll('.side-panel-group')
    await groups[0].trigger('click')
    await groups[1].trigger('click')
    expect(mobileMenu.text()).toContain('技能測試沙盒')
    expect(mobileMenu.text()).toContain('知識庫管理')
  })
})
