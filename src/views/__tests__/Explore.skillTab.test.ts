import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore Skill 探索分頁', () => {
  it('點擊「Skill 探索」分頁後顯示 skill-grid，Agent 分頁的 explore-hero 不再存在', async () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.explore-hero').exists()).toBe(true)

    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    expect(wrapper.find('.skill-grid').exists()).toBe(true)
    expect(wrapper.find('.explore-hero').exists()).toBe(false)
  })

  it('切換功能類型 chip 為「資料查詢」時，網格只剩 1 張卡片（ERP 庫存查詢）', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const chips = wrapper.findAll('.recs-chip')
    const targetChip = chips.find(c => c.text() === '資料查詢')
    expect(targetChip).toBeTruthy()
    await targetChip!.trigger('click')

    const cards = wrapper.findAll('.skill-grid .explore-skill-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].find('h4').text()).toBe('ERP 庫存查詢')
  })

  it('輸入搜尋關鍵字「會議」時，網格只剩 1 張卡片（會議摘要）', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('會議')

    const cards = wrapper.findAll('.skill-grid .explore-skill-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].find('h4').text()).toBe('會議摘要')
  })
})
