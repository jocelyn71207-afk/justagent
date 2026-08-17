import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore 使用熱度榜頒獎台版型', () => {
  it('頒獎台顯示前 3 名，套用對應的 rank 樣式 class', () => {
    const wrapper = mountExplore()
    const podiumCards = wrapper.findAll('.podium-card')
    expect(podiumCards).toHaveLength(3)
    expect(podiumCards[0].classes()).toContain('podium-card--rank-1')
    expect(podiumCards[1].classes()).toContain('podium-card--rank-2')
    expect(podiumCards[2].classes()).toContain('podium-card--rank-3')
    expect(podiumCards[0].find('h4').text()).toBe('內容創作者')
    expect(podiumCards[1].find('h4').text()).toBe('社群管理')
    expect(podiumCards[2].find('h4').text()).toBe('專案管理')
  })

  it('第 4 名移至頒獎台下方的次要列', () => {
    const wrapper = mountExplore()
    const more = wrapper.find('.ranking-more')
    expect(more.exists()).toBe(true)
    expect(more.find('.ranking-more-name').text()).toBe('顧客服務管理')
    expect(wrapper.findAll('.podium-card')).toHaveLength(3)
  })

  it('「大家都在用」網格維持 4 張等大卡片，不受頒獎台版型影響', () => {
    const wrapper = mountExplore()
    const popularCards = wrapper.findAll('.agent-grid--4 .agent-card')
    expect(popularCards).toHaveLength(4)
    popularCards.forEach(card => {
      expect(card.classes()).not.toContain('podium-card')
    })
  })
})

describe('Explore 活潑感套用', () => {
  it('頒獎台、大家都在用、為你推薦都套用 lively-stagger/lively-card', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.ranking-podium').classes()).toContain('lively-stagger')
    wrapper.findAll('.podium-card').forEach(c => expect(c.classes()).toContain('lively-card'))
    expect(wrapper.find('.agent-grid--4').classes()).toContain('lively-stagger')
    wrapper.findAll('.agent-grid--4 .agent-card').forEach(c => expect(c.classes()).toContain('lively-card'))
    expect(wrapper.find('.recs-grid').classes()).toContain('lively-stagger')
    wrapper.findAll('.rec-card').forEach(c => expect(c.classes()).toContain('lively-card'))
  })
})
