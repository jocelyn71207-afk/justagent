import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useRootStore } from '@/stores/rootStore'
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore'
import ProjectListContent from '../ProjectListContent.vue'

describe('ProjectListContent spotlight 卡片', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('卡片檢視下，清單第一張卡片有 is-spotlight class，其餘沒有', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Configure API simulator to succeed immediately
    const apiSimulator = useApiSimulatorStore()
    apiSimulator.setMode('normal')
    apiSimulator.setDelay(200)

    const rootStore = useRootStore()
    rootStore.projectListMode = 'card'

    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(ProjectListContent, {
      props: { title: '最近使用', mode: 'recent' },
      global: {
        plugins: [router, pinia],
        stubs: { AppBreadcrumb: true, ProjectSettingModal: true },
        directives: { tooltip: () => {} }
      },
    })
    await nextTick()

    // 假資料透過 useApiCall 的 setTimeout（200ms）非同步寫入，推進計時器取代真實等待，避免 flaky
    await vi.runAllTimersAsync()
    await nextTick()

    const cards = wrapper.findAll('.project-card')
    expect(cards.length).toBeGreaterThan(1)
    expect(cards[0].classes()).toContain('is-spotlight')
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].classes()).not.toContain('is-spotlight')
    }
  })
})
