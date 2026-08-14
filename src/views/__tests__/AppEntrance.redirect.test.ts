import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AppEntrance from '../AppEntrance.vue'

describe('AppEntrance 品牌 Loading 過渡畫面', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountEntrance() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(AppEntrance, { global: { plugins: [router] } })
    return { wrapper, pushSpy }
  }

  it('掛載後延遲 1000ms 導覽至 /view/ProjectDashboard', () => {
    const { wrapper, pushSpy } = mountEntrance()
    expect(pushSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(pushSpy).toHaveBeenCalledWith('/view/ProjectDashboard')
    wrapper.unmount()
  })

  it('品牌標記、spinner、文字都套用 lively-stagger 進場容器', () => {
    const { wrapper } = mountEntrance()
    expect(wrapper.find('.entrance-content').classes()).toContain('lively-stagger')
    expect(wrapper.find('.entrance-mark').exists()).toBe(true)
    expect(wrapper.find('.entrance-spinner').exists()).toBe(true)
    expect(wrapper.find('.entrance-text').text()).toBe('正在為您準備工作環境...')
    wrapper.unmount()
  })

  it('spinner 由 .entrance-spinner-wrap 包裹，不是 .entrance-content 的直接子元素', () => {
    // 迴歸鎖定：避免 .lively-stagger > * 的 fade-in animation 覆蓋 spinner 自己的 entrance-spin 旋轉動畫
    const { wrapper } = mountEntrance()
    const content = wrapper.find('.entrance-content')
    const directChildren = Array.from(content.element.children)
    const spinnerIsDirectChild = directChildren.some(el => el.classList.contains('entrance-spinner'))
    expect(spinnerIsDirectChild).toBe(false)

    const wrap = wrapper.find('.entrance-spinner-wrap')
    expect(wrap.exists()).toBe(true)
    expect(directChildren).toContain(wrap.element)
    expect(wrap.find('.entrance-spinner').exists()).toBe(true)
    wrapper.unmount()
  })
})
