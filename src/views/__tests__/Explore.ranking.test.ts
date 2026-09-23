import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore Agent 探索：情境清單', () => {
  it('由我推薦精選列顯示內容創作者，套用 explore-row--featured', () => {
    const wrapper = mountExplore()
    const featured = wrapper.find('.explore-row--featured')
    expect(featured.exists()).toBe(true)
    expect(featured.find('.explore-row-name').text()).toBe('內容創作者')
  })

  it('精選 Agent 不會在下方清單重複出現，其餘 9 筆都渲染成清單列', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const names = rows.map(r => r.find('.explore-row-name').text())
    expect(names).not.toContain('內容創作者')
    expect(rows).toHaveLength(9)
  })

  it('沒有自己 badge、但在熱門排行名單內的 Agent 顯示「熱門」角標', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const socialRow = rows.find(r => r.find('.explore-row-name').text() === '社群管理')!
    expect(socialRow.find('.explore-row-badge').text()).toBe('熱門')
  })

  it('自己有 badge 的 Agent 優先顯示自己的角標，即使也在熱門排行名單內', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const csRow = rows.find(r => r.find('.explore-row-name').text() === '顧客服務管理')!
    expect(csRow.find('.explore-row-badge').text()).toBe('高滿意度')
  })

  it('不在熱門排行名單、也沒有自己 badge 的 Agent 不顯示角標', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const designRow = rows.find(r => r.find('.explore-row-name').text() === '設計助理')!
    expect(designRow.find('.explore-row-badge').exists()).toBe(false)
  })

  it('清單容器套用 lively-stagger 進場動畫（單列不再套用 lively-card，避免 hover 效果衝突）', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.explore-list').classes()).toContain('lively-stagger')
    wrapper.findAll('.explore-list .explore-row').forEach(r => expect(r.classes()).not.toContain('lively-card'))
  })
})

describe('Explore Agent 搜尋（即時篩選，不需要按 Enter）', () => {
  it('輸入關鍵字時清單即時縮小', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('設計')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('設計助理')
  })

  it('關鍵字比對 tags 也算符合（搜尋「行銷」會找到社群管理）', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('行銷')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('社群管理')
  })

  it('找不到符合條件的 Agent 時顯示空狀態', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('絕對不存在的關鍵字xyz')

    expect(wrapper.find('.explore-empty-state').text()).toBe('找不到符合條件的 Agent')
  })

  it('搜尋時精選列會隱藏，避免跟下方清單／空狀態同時出現', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('設計')

    expect(wrapper.find('.explore-row--featured').exists()).toBe(false)
  })
})
