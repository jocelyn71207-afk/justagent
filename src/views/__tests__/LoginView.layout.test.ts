import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../LoginView.vue'

const GOOGLE_PATHS = [
  'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z',
  'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
  'M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z',
  'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z',
]
const FACEBOOK_PATH = 'M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 12V15.56H7.13V12.07h2.99V9.41c0-2.96 1.76-4.59 4.44-4.59 1.28 0 2.63.23 2.63.23v2.9h-1.48c-1.46 0-1.92.91-1.92 1.84v2.21h3.26l-.52 3.49h-2.74V24.07C19.59 23.09 24 18.1 24 12.07z'

function mountLoginView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(LoginView, { global: { plugins: [router] } })
}

describe('LoginView 左右分栅版面', () => {
  it('左側品牌面板與右側表單面板同時存在', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-split').exists()).toBe(true)
    expect(wrapper.find('.login-brand').exists()).toBe(true)
    expect(wrapper.find('.login-form-side').exists()).toBe(true)
  })

  it('Google/Facebook 登入按鈕的 SVG icon 逐字保留原始設計', () => {
    const wrapper = mountLoginView()
    const googlePaths = wrapper.findAll('.google-btn svg path').map(p => p.attributes('d'))
    expect(googlePaths).toEqual(GOOGLE_PATHS)
    const facebookPath = wrapper.find('.facebook-btn svg path').attributes('d')
    expect(facebookPath).toBe(FACEBOOK_PATH)
  })

  it('版權資訊只出現在左側品牌面板，不在右側表單重複顯示', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-brand').text()).toContain('莫比機器人股份有限公司')
    expect(wrapper.find('.login-form-side').text()).not.toContain('莫比機器人股份有限公司')
  })

  it('隱私政策/服務條款連結保留在左側品牌面板（版權行旁）', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-brand').text()).toContain('隱私政策')
    expect(wrapper.find('.login-brand').text()).toContain('服務條款')
    expect(wrapper.findAll('.login-brand-foot-link')).toHaveLength(2)
  })

  it('送出表單會導覽到 /entrance，不再直接跳 ProjectDashboard', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('form.login-form').trigger('submit')
    expect(pushSpy).toHaveBeenCalledWith('/entrance')
  })

  it('表單面板套用 lively-stagger 進場容器，社群/送出按鈕套用 lively-card', () => {
    const wrapper = mountLoginView()
    expect(wrapper.find('.login-form-inner').classes()).toContain('lively-stagger')
    expect(wrapper.find('.google-btn').classes()).toContain('lively-card')
    expect(wrapper.find('.facebook-btn').classes()).toContain('lively-card')
    expect(wrapper.find('.login-submit-btn').classes()).toContain('lively-card')
  })
})
