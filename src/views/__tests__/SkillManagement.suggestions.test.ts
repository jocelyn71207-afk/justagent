import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'
import { consumeSkillHandoff } from '@/composables/useSkillHandoff'

// 「我的技能」分頁新增「建議建立的技能」區塊：agent 完成任務後放進佇列的建議，
// 使用者在這裡決定「建立」（帶著預填草稿導向 AI 賦能）或「不用了」（直接丟棄）。
describe('SkillManagement 建議建立的技能', () => {
  let currentWrapper: VueWrapper | null = null

  afterEach(() => {
    currentWrapper?.unmount()
    currentWrapper = null
  })

  function mountPage() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
      ],
    })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
    currentWrapper = wrapper
    return { wrapper, router }
  }

  it('沒有待處理建議時不顯示這個區塊', () => {
    setActivePinia(createPinia())
    const { wrapper } = mountPage()
    expect(wrapper.find('.skill-suggestion-queue').exists()).toBe(false)
  })

  it('顯示佇列裡的建議：名稱與來源流程', () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    store.addSuggestion({
      id: 'conv4-sales-report', name: '產品銷售報告整理', description: '查詢並產出報告',
      triggerHint: '偵測到銷售整理需求', steps: ['查詢數據', '套用規範產出'],
      reason: '查詢銷售資料＋套用部門報告規範', conversationId: 'conv4',
    })
    const { wrapper } = mountPage()
    const queue = wrapper.find('.skill-suggestion-queue')
    expect(queue.exists()).toBe(true)
    expect(queue.text()).toContain('產品銷售報告整理')
    expect(queue.text()).toContain('查詢銷售資料＋套用部門報告規範')
  })

  it('按「建立」：設定交接資料、從佇列移除、導向 AI 賦能並帶 ?from=', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    store.addSuggestion({
      id: 'conv4-sales-report', name: '產品銷售報告整理', description: '查詢並產出報告',
      triggerHint: '偵測到銷售整理需求', steps: ['查詢數據', '套用規範產出'],
      reason: '查詢銷售資料＋套用部門報告規範', conversationId: 'conv4',
    })
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    const buildBtn = wrapper.find('.skill-suggestion-queue [data-action="build"]')
    await buildBtn.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio', query: { from: 'conv4' } })
    expect(store.pendingSuggestions).toEqual([])
    const handoff = consumeSkillHandoff()
    expect(handoff?.origin).toEqual({ conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' })
    expect(handoff?.prefill.name).toBe('產品銷售報告整理')
  })

  it('按「不用了」：直接從佇列移除，不導向也不設定交接資料', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    store.addSuggestion({
      id: 'conv4-sales-report', name: '產品銷售報告整理', description: '查詢並產出報告',
      triggerHint: '偵測到銷售整理需求', steps: ['查詢數據', '套用規範產出'],
      reason: '查詢銷售資料＋套用部門報告規範', conversationId: 'conv4',
    })
    const { wrapper, router } = mountPage()
    const push = vi.spyOn(router, 'push')
    const dismissBtn = wrapper.find('.skill-suggestion-queue [data-action="dismiss"]')
    await dismissBtn.trigger('click')

    expect(push).not.toHaveBeenCalled()
    expect(store.pendingSuggestions).toEqual([])
    expect(consumeSkillHandoff()).toBeNull()
  })
})
