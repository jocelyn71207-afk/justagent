import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore Skill 探索分頁', () => {
  it('點擊「Skill 探索」分頁後顯示技能清單，Agent 分頁的精選列不再存在', async () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.explore-row--featured').exists()).toBe(true)

    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    expect(wrapper.find('.explore-list').exists()).toBe(true)
    expect(wrapper.find('.explore-row--featured').exists()).toBe(false)
  })

  it('輸入搜尋關鍵字「會議」時，清單只剩 1 筆（會議摘要），不需要按 Enter', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('會議')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('會議摘要')
  })

  it('找不到符合條件的技能時顯示空狀態', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('絕對不存在的關鍵字xyz')

    expect(wrapper.find('.explore-empty-state').text()).toBe('找不到符合條件的技能')
  })

  it('技能列顯示 functionType 標籤', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('會議')

    const row = wrapper.find('.explore-list .explore-row')
    expect(row.find('.explore-row-tag').text()).toBe('文字生成')
  })
})
