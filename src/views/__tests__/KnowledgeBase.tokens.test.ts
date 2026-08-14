import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeBase from '../KnowledgeBase.vue'

function mountKnowledgeBase() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(KnowledgeBase, {
    global: {
      plugins: [router],
      stubs: { AppBreadcrumb: true, CreateKnowledgeWizardModal: true, CreateVersionModal: true, ReviewDrawer: true, VersionCompareModal: true, ErrorLogModal: true, DataSourceTab: true },
    },
  })
}

describe('KnowledgeBase 統計卡片 token 化', () => {
  it('「需更新」統計卡不再使用 inline style 寫死顏色', () => {
    const wrapper = mountKnowledgeBase()
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards.length).toBeGreaterThan(0)
    // 找到「需更新」卡片（假設它是唯一帶有 needs-update 相關 class 的卡片）
    const needsUpdateCard = wrapper.find('.stat-card--needs-update')
    expect(needsUpdateCard.exists()).toBe(true)
    expect(needsUpdateCard.attributes('style')).toBeFalsy()
    const icon = needsUpdateCard.find('.stat-icon')
    expect(icon.attributes('style')).toBeFalsy()
    const number = needsUpdateCard.find('.stat-number')
    expect(number.attributes('style')).toBeFalsy()
  })
})

describe('KnowledgeBase 活潑感套用', () => {
  it('統計卡片列套用 lively-stagger，每張卡片套用 lively-card', () => {
    const wrapper = mountKnowledgeBase()
    const statsRow = wrapper.find('.stats-row')
    expect(statsRow.classes()).toContain('lively-stagger')
    wrapper.findAll('.stat-card').forEach(card => {
      expect(card.classes()).toContain('lively-card')
    })
  })
})
