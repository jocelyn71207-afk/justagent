import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 桌機版「AI 技能」群組子項目', () => {
  it('展開後依序為 技能管理 / 技能測試沙盒，且不再出現舊名「技能清單」或已移除的「AI 賦能」', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    const group = wrapper.find('.side-panel-group')
    expect(group.text()).toContain('AI 技能')

    await group.trigger('click')
    const sub = wrapper.findAll('.side-panel-sub')[0]
    const text = sub.text()

    expect(text).not.toContain('技能清單')
    expect(text).not.toContain('AI 賦能')
    expect(text).toContain('技能管理')
    expect(text).toContain('技能測試沙盒')
    expect(text.indexOf('技能管理')).toBeLessThan(text.indexOf('技能測試沙盒'))

    expect(sub.findAll('a')).toHaveLength(2)
  })
})
