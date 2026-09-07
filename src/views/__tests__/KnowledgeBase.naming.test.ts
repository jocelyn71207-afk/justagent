import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeBase from '../KnowledgeBase.vue'

describe('KnowledgeBase 頁面標題命名一致性', () => {
  it('頁面大標題應為「知識庫管理」，跟側邊選單子項目、路由 meta.title 一致，不是另一個名字「知識內容管理」', () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(KnowledgeBase, {
      global: {
        plugins: [router],
        stubs: { AppBreadcrumb: true, CreateKnowledgeWizardModal: true, CreateVersionModal: true, ReviewDrawer: true, VersionCompareModal: true, ErrorLogModal: true, DataSourceTab: true },
      },
    })

    expect(wrapper.find('.banner-title').text()).toBe('知識庫管理')
  })
})
