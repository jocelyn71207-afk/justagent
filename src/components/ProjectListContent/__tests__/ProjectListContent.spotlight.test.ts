import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore'
import ProjectListContent from '../ProjectListContent.vue'

describe('ProjectListContent spotlight 卡片', () => {
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
    await wrapper.vm.$nextTick()

    // Wait for useApiCall to finish (delay is 200ms)
    await new Promise(r => setTimeout(r, 250))
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.project-card')
    expect(cards.length).toBeGreaterThan(1)
    expect(cards[0].classes()).toContain('is-spotlight')
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].classes()).not.toContain('is-spotlight')
    }
  })
})
