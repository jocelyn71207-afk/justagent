import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProjectTrashCans from '../ProjectTrashCans.vue'

describe('ProjectTrashCans bento 卡片', () => {
  it('每張卡片依急迫度套用對應的 bento class', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(ProjectTrashCans, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, compDropDown: true } },
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.project-card')
    expect(cards.length).toBeGreaterThan(0)
    // 每張卡片必須恰好命中三個急迫度 class 之一
    cards.forEach((card) => {
      const hasBentoClass = ['bento-urgent', 'bento-warning', 'bento-normal'].some(c => card.classes().includes(c))
      expect(hasBentoClass).toBe(true)
    })
    // 假資料需涵蓋至少 2 種不同急迫度分級，證明分類確實有分出高低（而非全部落在同一級距）
    const distinctClasses = new Set(cards.map(c => ['bento-urgent', 'bento-warning', 'bento-normal'].find(cls => c.classes().includes(cls))))
    expect(distinctClasses.size).toBeGreaterThanOrEqual(2)
    // 統計摘要列存在
    expect(wrapper.find('.trash-bento-summary').exists()).toBe(true)
  })
})
