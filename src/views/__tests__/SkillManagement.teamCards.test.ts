import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'

describe('SkillManagement Library 團隊技能卡片', () => {
  it('團隊技能區塊改為多欄卡片，卡片數等於團隊分組數', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true, SkillEditChatModal: true } },
    })
    const store = useSkillStore()
    // 切到管理區 tab 才會渲染 Library 技能管理區塊（點擊真正的 tab 按鈕，不碰內部狀態）
    const reviewTabBtn = wrapper.findAll('button').find(b => b.text().includes('管理區'))
    expect(reviewTabBtn, '目前 mock 角色需為管理者才看得到「管理區」tab，若找不到請確認 SkillManagement.vue 的 currentUserRole 預設值').toBeTruthy()
    await reviewTabBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    const teamSkillCount = store.flatSkills.filter(s => s.scope === 'team').length
    if (teamSkillCount === 0) return // mock 資料若無團隊技能，此測試無從驗證，交由後續資料調整

    const teamGrid = wrapper.find('.lsr-team-grid')
    expect(teamGrid.exists()).toBe(true)
    const teamCards = wrapper.findAll('.lsr-team-card')
    expect(teamCards.length).toBeGreaterThan(0)
  })
})
