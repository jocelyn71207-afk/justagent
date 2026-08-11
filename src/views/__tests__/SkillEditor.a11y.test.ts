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

  it('尚未走到的步驟原生 disabled，已完成的步驟可點擊', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })

    // 初始 currentStep === 0：所有步驟（含當前步驟自己）都應該是 disabled
    const initialSteps = wrapper.findAll('.se-step')
    initialSteps.forEach((step) => {
      expect(step.attributes('disabled')).toBeDefined()
    })

    // 填入必填欄位並前進到 step 1，讓 step 0 變成「已完成」
    await wrapper.find('input.custom-input').setValue('測試技能')
    const nextButton = wrapper
      .findAll('button.custom-main-btn')
      .find((btn) => btn.text().includes('下一步'))
    expect(nextButton).toBeTruthy()
    await nextButton!.trigger('click')

    const stepsAfterAdvance = wrapper.findAll('.se-step')
    // index 0（已完成，currentStep > 0）：不應該 disabled
    expect(stepsAfterAdvance[0].attributes('disabled')).toBeUndefined()
    // index 1（當前步驟，currentStep === 1）與之後的步驟：仍應該 disabled
    for (let i = 1; i < stepsAfterAdvance.length; i++) {
      expect(stepsAfterAdvance[i].attributes('disabled')).toBeDefined()
    }
  })
})
