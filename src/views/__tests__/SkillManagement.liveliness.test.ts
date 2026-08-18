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
    const stats = wrapper.findAll('.skill-stat')
    expect(stats.length).toBe(4)
    stats.forEach(stat => {
      expect(stat.find('.stat-dot').exists()).toBe(true)
      expect(stat.find('b').exists()).toBe(true)
    })
    expect(wrapper.find('.skill-stat--enabled').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--ext').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--team').exists()).toBe(true)
    expect(wrapper.find('.skill-stat--usage').exists()).toBe(true)
  })
})
