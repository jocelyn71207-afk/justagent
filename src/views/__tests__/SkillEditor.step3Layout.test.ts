import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 第 3 步版面', () => {
  it('確認步驟顯示技能名稱標題，並分成「內容摘要」與「設定」兩張卡', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    await wrapper.find('input.custom-input').setValue('庫存查詢助理')
    await wrapper.findAll('button').find(b => b.text().includes('下一步'))!.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.findAll('button').find(b => b.text().includes('下一步'))!.trigger('click')

    expect(wrapper.find('.se-confirm-title').text()).toBe('庫存查詢助理')
    const cards = wrapper.findAll('.se-confirm-group')
    expect(cards.length).toBe(2)
    expect(cards[0].text()).toContain('內容摘要')
    expect(cards[1].text()).toContain('設定')
  })
})
