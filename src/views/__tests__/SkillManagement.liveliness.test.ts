import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'

describe('SkillManagement 活潑感套用', () => {
  it('統計列容器有 lively-stagger，每張統計卡有 lively-card', () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true, SkillEditChatModal: true } },
    })
    const statsRow = wrapper.find('.skill-stats-row')
    expect(statsRow.classes()).toContain('lively-stagger')
    const statCards = wrapper.findAll('.skill-stat-card')
    expect(statCards.length).toBe(4)
    statCards.forEach(card => expect(card.classes()).toContain('lively-card'))
  })
})
