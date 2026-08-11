import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ResourceLibrary from '../ResourceLibrary.vue'
import { useRootStore } from '@/stores/rootStore'

describe('ResourceLibrary 可及性', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('卡片檢視與列表檢視的「更多選項」都是可聚焦的 <button> 且有 aria-label', async () => {
    setActivePinia(createPinia())
    const rootStore = useRootStore()
    const wrapper = mount(ResourceLibrary, {
      global: { stubs: { AppBreadcrumb: true, compListCardSwitch: true, compTabs: true, compDropDown: true, AppSkeleton: true, AppErrorState: true, compPagination: true } },
    })
    // 假資料透過 useApiCall 的 setTimeout 非同步寫入，需推進計時器並等待畫面更新
    await vi.runAllTimersAsync()
    await nextTick()

    // 卡片檢視（預設 viewMode）
    rootStore.projectListMode = 'card'
    await nextTick()
    const cardMoreBtns = wrapper.findAll('.more-btn')
    expect(cardMoreBtns.length).toBeGreaterThan(0)
    cardMoreBtns.forEach((btn) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-label')).toBeTruthy()
    })

    // 列表檢視
    rootStore.projectListMode = 'list'
    await nextTick()
    const listMoreBtns = wrapper.findAll('.more-btn')
    expect(listMoreBtns.length).toBeGreaterThan(0)
    listMoreBtns.forEach((btn) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-label')).toBeTruthy()
    })
  })
})
