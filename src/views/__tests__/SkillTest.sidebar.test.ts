import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillTest from '../SkillTest.vue'

describe('SkillTest 側欄分類色條', () => {
  it('系統/企業/團隊三個子分類標籤各自有對應的 subgroup-label--<key> class', () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillTest, {
      global: { plugins: [router], stubs: { SkillTestChat: true, SkillTestAI: true } },
    })
    const labels = wrapper.findAll('.subgroup-label')
    expect(labels.length).toBeGreaterThan(0)
    labels.forEach(label => {
      const hasKeyClass = ['subgroup-label--system', 'subgroup-label--enterprise', 'subgroup-label--team'].some(c => label.classes().includes(c))
      expect(hasKeyClass).toBe(true)
    })
  })
})
