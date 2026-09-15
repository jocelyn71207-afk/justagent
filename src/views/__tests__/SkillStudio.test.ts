import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudio from '@/views/SkillStudio.vue'

vi.mock('@/services/popDialog', () => ({
  default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() },
}))

async function mountAt(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/SkillStudio', name: 'SkillStudio', component: SkillStudio, meta: { title: 'AI 賦能', parentLabel: 'AI 技能' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  await router.push({ path: '/view/SkillStudio', query })
  await router.isReady()
  const wrapper = mount(SkillStudio, {
    global: { plugins: [router], stubs: { AppBreadcrumb: true, SkillTestAI: true } },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SkillStudio', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('渲染 banner 標題「AI 賦能」與左右兩欄版面', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.banner-title').text()).toBe('AI 賦能')
    expect(wrapper.find('.skill-studio-layout .studio-chat-col').exists()).toBe(true)
    expect(wrapper.find('.skill-studio-layout .studio-side-col').exists()).toBe(true)
  })
})
