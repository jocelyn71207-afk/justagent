import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import JourneyDashboard from '../JourneyDashboard.vue'
import { useJourneyStore } from '@/stores/journeyStore'

function mountDashboard() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('JourneyDashboard 空狀態', () => {
  it('沒有旅程時顯示空狀態', () => {
    const { wrapper } = mountDashboard()
    expect(wrapper.find('.jd-empty').exists()).toBe(true)
    expect(wrapper.find('.jd-list').exists()).toBe(false)
  })
})

describe('JourneyDashboard 節點狀態呈現', () => {
  it('done/running/pending 節點分別套用對應的 modifier class', () => {
    setActivePinia(createPinia())
    const journeyStore = useJourneyStore()
    const id = journeyStore.createJourney('王小美', 'marketing')
    journeyStore.setNodeDone(id, 'D0')
    journeyStore.setNodeDone(id, 'D1')
    journeyStore.setNodeRunning(id, 'D3')

    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })

    const steps = wrapper.findAll('.jd-step')
    expect(steps).toHaveLength(6)
    expect(steps[0].classes()).toContain('jd-step--done')
    expect(steps[1].classes()).toContain('jd-step--done')
    expect(steps[2].classes()).toContain('jd-step--running')
    expect(steps[3].classes()).toContain('jd-step--pending')

    expect(wrapper.find('.jd-badge').classes()).toContain('jd-badge--running')
    expect(wrapper.find('.jd-progress-fill').classes()).toContain('jd-progress-fill--running')
  })

  it('全部節點完成時，旅程狀態徽章與進度條套用 done 樣式', () => {
    setActivePinia(createPinia())
    const journeyStore = useJourneyStore()
    const id = journeyStore.createJourney('陳大文', 'birthday')
    const journey = journeyStore.journeys.find(j => j.id === id)!
    journey.nodes.forEach(n => journeyStore.setNodeDone(id, n.key))

    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })

    expect(wrapper.find('.jd-badge').classes()).toContain('jd-badge--done')
    expect(wrapper.find('.jd-progress-fill').classes()).toContain('jd-progress-fill--done')
  })
})

describe('JourneyDashboard 返回按鈕', () => {
  it('點擊返回按鈕導覽至 /view/AiViewer', async () => {
    const { wrapper, router } = mountDashboard()
    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('.jd-back-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/view/AiViewer')
  })
})
