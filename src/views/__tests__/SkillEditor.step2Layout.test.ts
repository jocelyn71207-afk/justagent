import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 第 2 步版面', () => {
  it('技能指令在 se-primary-section，觸發時機與所需檔案在 se-secondary-row 的雙欄內', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    // 填寫技能名稱以解鎖下一步，切到第 2 步
    await wrapper.find('input.custom-input').setValue('測試技能')
    const nextBtn = wrapper.findAll('button').find(b => b.text().includes('下一步'))
    await nextBtn!.trigger('click')

    const primary = wrapper.find('.se-primary-section')
    expect(primary.exists()).toBe(true)
    expect(primary.text()).toContain('技能指令')

    const secondaryRow = wrapper.find('.se-secondary-row')
    expect(secondaryRow.exists()).toBe(true)
    expect(secondaryRow.findAll('.se-secondary-section').length).toBe(2)
  })
})
