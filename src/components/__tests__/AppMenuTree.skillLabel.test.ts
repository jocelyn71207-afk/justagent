import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 桌機版技能子項目命名', () => {
  it('展開「AI 技能」群組後，子項目應為明確的頁面名稱「技能管理」，不是與群組標題同義的「技能清單」', async () => {
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

    expect(sub.text()).not.toContain('技能清單')
    expect(sub.text()).toContain('技能管理')
  })
})
