import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'
import { useExploreStore } from '@/stores/exploreStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function mountExplore() {
  localStorage.clear()
  setActivePinia(createPinia())
  return mount(Explore)
}

describe('Explore Agent 常用清單', () => {
  it('點擊 Agent 卡片開啟詳情 Modal 後，按「加入常用清單」會把該 Agent 加入常用清單，按鈕文字同步更新', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!

    await wrapper.findAll('.podium-card')[0].trigger('click')

    const favoriteBtn = wrapper.find('.explore-modal-footer .custom-main-btn')
    expect(favoriteBtn.text()).toBe('加入常用清單')

    await favoriteBtn.trigger('click')

    expect(exploreStore.isFavorite(firstAgent.id)).toBe(true)
    expect(favoriteBtn.text()).toBe('已加入常用清單')
  })

  it('已加入常用清單的 Agent，頒獎台卡片上顯示收藏星號', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!
    exploreStore.toggleFavorite(firstAgent.id)
    await wrapper.vm.$nextTick()

    const firstPodiumCard = wrapper.findAll('.podium-card')[0]
    expect(firstPodiumCard.find('.agent-favorite-mark').exists()).toBe(true)
  })
})
