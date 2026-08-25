import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'

// 統計列改成跟 TeamAccessManagement 的 .role-stats-row 同一套「色點 + 文字」語彙，
// 不再是四張各自上色的邊框卡片（lively-card），這裡驗證新的結構
describe('SkillManagement 統計列', () => {
  it('統計列是一行安靜的「色點 + 數字 + 文字」，不是邊框卡片堆砌', () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true, SkillEditChatModal: true } },
    })
    // 目前 mock 角色為管理者且有待審核個人技能，所以會多一個「待審核」chip
    // 排在最前面；它是需要行動的實心 pill 徽章（icon，不是安靜的色點），
    // 其餘三個維持純資訊的色點語彙
    const stats = wrapper.findAll('.skill-stat')
    expect(stats.length).toBe(5)
    const infoStats = stats.filter(s => !s.classes().includes('skill-stat--pending'))
    expect(infoStats.length).toBe(4)
    infoStats.forEach(stat => {
      expect(stat.find('.stat-dot').exists()).toBe(true)
      expect(stat.find('b').exists()).toBe(true)
    })
    const pendingStat = wrapper.find('.skill-stat--pending')
    expect(pendingStat.exists()).toBe(true)
    expect(pendingStat.find('.material-symbols-outlined').exists()).toBe(true)
    expect(pendingStat.find('b').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--enabled').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--ext').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--team').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--usage').exists()).toBe(true)
  })
})
