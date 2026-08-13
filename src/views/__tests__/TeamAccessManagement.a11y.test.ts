import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamAccessManagement from '../TeamAccessManagement.vue'

describe('TeamAccessManagement 可及性', () => {
  it('排序與操作按鈕使用真正的 <button>，且 icon-only 按鈕有 aria-label', () => {
    setActivePinia(createPinia())
    const wrapper = mount(TeamAccessManagement, {
      global: { stubs: { AppBreadcrumb: true, compPagination: true, TeamAccountSettingModal: true } },
    })

    const sortBtn = wrapper.find('.sort-btn')
    expect(sortBtn.element.tagName).toBe('BUTTON')
    expect(sortBtn.attributes('aria-label')).toBeTruthy()

    const actionBtns = wrapper.findAll('.action-btn')
    expect(actionBtns.length).toBeGreaterThan(0)
    actionBtns.forEach((btn) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-label')).toBeTruthy()
    })
  })
})
