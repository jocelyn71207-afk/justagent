import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

function mountMenu() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(AppMenuTree, { global: { plugins: [router] } })
}

describe('AppMenuTree 側邊選單第二層收合', () => {
  it('預設是展開的，側邊面板沒有 is-collapsed class', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.side-panel').classes()).not.toContain('is-collapsed')
  })

  it('點擊收合按鈕後，側邊面板加上 is-collapsed class；再點一次恢復展開', async () => {
    const wrapper = mountMenu()
    const toggleBtn = wrapper.find('.side-panel-collapse-toggle')
    expect(toggleBtn.exists()).toBe(true)

    await toggleBtn.trigger('click')
    expect(wrapper.find('.side-panel').classes()).toContain('is-collapsed')

    await toggleBtn.trigger('click')
    expect(wrapper.find('.side-panel').classes()).not.toContain('is-collapsed')
  })

  it('收合後，團隊切換器不保留團隊圖示／名稱／展開箭頭，只留收合按鈕本身', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.side-panel-collapse-toggle').trigger('click')

    const switcher = wrapper.find('.side-panel-switcher')
    expect(switcher.find('.side-panel-switcher-icon').exists()).toBe(false)
    expect(switcher.find('.side-panel-switcher-name').exists()).toBe(false)
    expect(switcher.find('.side-panel-switcher-caret').exists()).toBe(false)
    expect(switcher.find('.side-panel-collapse-toggle').exists()).toBe(true)
  })

  it('收合後，單一項目（團隊專案／權限管理／專案垃圾桶）不顯示文字，只留圖示', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.side-panel-collapse-toggle').trigger('click')

    const panel = wrapper.find('.side-panel')
    expect(panel.text()).not.toContain('團隊專案')
    expect(panel.text()).not.toContain('權限管理')
    expect(panel.text()).not.toContain('專案垃圾桶')
  })

  it('展開狀態下完全不受影響：文字、圖示、群組展開都跟收合功能加入前一樣', () => {
    const wrapper = mountMenu()
    const panel = wrapper.find('.side-panel')
    expect(panel.text()).toContain('團隊專案')
    expect(panel.text()).toContain('權限管理')
    expect(panel.text()).toContain('專案垃圾桶')
    expect(panel.text()).toContain('AI 技能')
    expect(panel.text()).toContain('共享資源庫')
  })
})

describe('AppMenuTree 收合後子群組改用 hover flyout', () => {
  it('收合前，AI 技能群組 hover 不會有作用（展開狀態下沒有 flyout）', async () => {
    const wrapper = mountMenu()
    const group = wrapper.findAll('.side-panel-nav-group')[0]
    await group.trigger('mouseenter')

    expect(wrapper.find('.side-panel-flyout').isVisible()).toBe(false)
  })

  it('收合後滑鼠移入「AI 技能」群組，會彈出包含「技能管理」「技能測試沙盒」的浮層', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.side-panel-collapse-toggle').trigger('click')

    const skillGroup = wrapper.findAll('.side-panel-nav-group')[0]
    await skillGroup.trigger('mouseenter')

    const flyout = skillGroup.find('.side-panel-flyout')
    expect(flyout.attributes('style') ?? '').not.toContain('display: none')
    expect(flyout.text()).toContain('技能管理')
    expect(flyout.text()).toContain('技能測試沙盒')

    await skillGroup.trigger('mouseleave')
    expect(skillGroup.find('.side-panel-flyout').attributes('style')).toContain('display: none')
  })

  it('收合後滑鼠移入「共享資源庫」群組，會彈出包含「共用檔案管理」「知識庫管理」的浮層', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.side-panel-collapse-toggle').trigger('click')

    const resourceGroup = wrapper.findAll('.side-panel-nav-group')[1]
    await resourceGroup.trigger('mouseenter')

    const flyout = resourceGroup.find('.side-panel-flyout')
    expect(flyout.isVisible()).toBe(true)
    expect(flyout.text()).toContain('共用檔案管理')
    expect(flyout.text()).toContain('知識庫管理')
  })
})

describe('AppMenuTree 收合再展開不影響子群組原本的開合狀態', () => {
  it('收合前展開「AI 技能」子清單，收合再展開後，子清單應該還是展開的', async () => {
    const wrapper = mountMenu()

    // 展開狀態下先點開「AI 技能」群組的內縮子清單
    const skillTrigger = wrapper.findAll('.side-panel-group')[0]
    await skillTrigger.trigger('click')
    expect(wrapper.find('.side-panel-sub').isVisible()).toBe(true)

    // 收合再展開
    const toggleBtn = wrapper.find('.side-panel-collapse-toggle')
    await toggleBtn.trigger('click')
    await toggleBtn.trigger('click')

    // 子清單應該恢復展開，不是被重置成收合
    expect(wrapper.find('.side-panel-sub').isVisible()).toBe(true)
  })
})
