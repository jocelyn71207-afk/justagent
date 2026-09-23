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

describe('AppMenuTree 導覽欄收合', () => {
  it('預設是展開的，.AppMenuTree 沒有 is-collapsed class', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.AppMenuTree').classes()).not.toContain('is-collapsed')
  })

  it('點擊收合按鈕後，.AppMenuTree 加上 is-collapsed class；再點一次恢復展開', async () => {
    const wrapper = mountMenu()
    const toggleBtn = wrapper.find('.nav-collapse-toggle')
    expect(toggleBtn.exists()).toBe(true)

    await toggleBtn.trigger('click')
    expect(wrapper.find('.AppMenuTree').classes()).toContain('is-collapsed')

    await toggleBtn.trigger('click')
    expect(wrapper.find('.AppMenuTree').classes()).not.toContain('is-collapsed')
  })

  it('收合後，導覽項目不顯示文字，只留圖示', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.nav-collapse-toggle').trigger('click')

    const nav = wrapper.find('.AppMenuTree')
    expect(nav.text()).not.toContain('探索')
    expect(nav.text()).not.toContain('最近使用')
    expect(nav.text()).not.toContain('企業設定')
    expect(nav.text()).not.toContain('團隊功能')
  })

  it('展開狀態下完全不受影響：文字、圖示都跟收合功能加入前一樣', () => {
    const wrapper = mountMenu()
    const nav = wrapper.find('.AppMenuTree')
    expect(nav.text()).toContain('探索')
    expect(nav.text()).toContain('最近使用')
    expect(nav.text()).toContain('企業設定')
    expect(nav.text()).toContain('團隊功能')
  })
})

describe('AppMenuTree 團隊選單面板開關', () => {
  it('預設團隊選單面板是展開的', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')
  })

  it('團隊選單面板裡有團隊專案等導覽項目', async () => {
    const wrapper = mountMenu()

    const panel = wrapper.find('.team-panel')
    expect(panel.attributes('style') ?? '').not.toContain('display: none')
    expect(panel.text()).toContain('團隊選單')
    expect(panel.text()).toContain('團隊專案')
    expect(panel.text()).toContain('AI 技能')
    expect(panel.text()).toContain('共享資源庫')
  })

  it('點擊面板的 X 關閉鈕會關閉團隊選單面板', async () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')

    await wrapper.find('.team-panel-close').trigger('click')
    expect(wrapper.find('.team-panel').attributes('style') ?? '').toContain('display: none')
  })

  it('點擊面板裡的導覽項目（例如團隊專案）後，面板應該維持展開，不會被自動收起', async () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')

    const teamProjectLink = wrapper.findAll('.side-panel-item').find(el => el.text().includes('團隊專案'))!
    await teamProjectLink.trigger('click')

    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')
  })

  it('點擊「團隊功能」可以切換關閉，再點一次可以重新打開', async () => {
    const wrapper = mountMenu()
    const toggle = wrapper.find('.nav-team-toggle')
    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')

    await toggle.trigger('click')
    expect(wrapper.find('.team-panel').attributes('style') ?? '').toContain('display: none')

    await toggle.trigger('click')
    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')
  })

  it('直接用網址進入團隊頁面，團隊選單面板一樣是預設展開的（跟其他頁面一致，不因網址而有差異）', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/TeamProject', component: { template: '<div/>' } }],
    })
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    expect(wrapper.find('.team-panel').attributes('style') ?? '').not.toContain('display: none')
  })

  it('目前在團隊頁面時，「團隊功能」項目會亮起（active）', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/TeamProject', component: { template: '<div/>' } }],
    })
    await router.push('/view/TeamProject')
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    expect(wrapper.find('.nav-team-toggle').classes()).toContain('active')
  })
})

describe('AppMenuTree 團隊選單面板內的群組展開狀態會保留', () => {
  it('展開「AI 技能」子清單後，關閉再重新打開面板，子清單應該還是展開的', async () => {
    const wrapper = mountMenu()
    const toggle = wrapper.find('.nav-team-toggle')

    const skillTrigger = wrapper.findAll('.side-panel-group')[0]
    await skillTrigger.trigger('click')
    expect(wrapper.find('.side-panel-sub').attributes('style') ?? '').not.toContain('display: none')

    await toggle.trigger('click') // 關閉面板
    await toggle.trigger('click') // 重新打開

    expect(wrapper.find('.side-panel-sub').attributes('style') ?? '').not.toContain('display: none')
  })
})
