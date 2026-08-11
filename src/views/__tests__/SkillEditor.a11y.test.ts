import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 步驟指示器可及性', () => {
  it('每個步驟項目都是可聚焦的 <button>', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    const steps = wrapper.findAll('.se-step')
    expect(steps.length).toBeGreaterThan(0)
    steps.forEach((step) => {
      expect(step.element.tagName).toBe('BUTTON')
    })
  })
})
