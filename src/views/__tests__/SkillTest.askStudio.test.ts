import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillTest from '../SkillTest.vue'
import { useSkillStore } from '@/stores/skillStore'

// 「詢問技能助理」：從測試沙盒直接開技能管理頁的抽屜，intent=ask 讓開場白
// 換一句不預設「要改」的問句（見 useSkillStudioConversation.ts 的 loadSkill）。
// 只有個人技能能編輯，所以按鈕只在選中個人技能時顯示。
describe('SkillTest「詢問技能助理」入口', () => {
  function mountPage() {
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillTest, {
      global: { plugins: [router], stubs: { SkillTestChat: true } },
    })
    return { wrapper, router }
  }

  it('個人技能：顯示「詢問技能助理」按鈕，點擊導向 /view/Skills 帶 skillId + intent=ask', async () => {
    setActivePinia(createPinia())
    const { wrapper, router } = mountPage()
    await wrapper.vm.$nextTick()
    const push = vi.spyOn(router, 'push')
    const btn = wrapper.find('.ask-studio-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(push).toHaveBeenCalledWith({ path: '/view/Skills', query: { skillId: 'personal-001', intent: 'ask' } })
  })

  it('Library 技能：不顯示這個按鈕', async () => {
    setActivePinia(createPinia())
    const { wrapper } = mountPage()
    const store = useSkillStore()
    store.setSelectedSkill('sys-cs-001')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ask-studio-btn').exists()).toBe(false)
  })
})
