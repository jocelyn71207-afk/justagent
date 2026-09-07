import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import realRouter from '@/router'
import { useBreadcrumb } from '../useBreadcrumb'

const Stub = { template: '<div/>' }

const Host = {
  setup() {
    const { items } = useBreadcrumb()
    return { items }
  },
  template: '<div></div>',
}

describe('useBreadcrumb 專案垃圾桶', () => {
  it('麵包屑最後一項應顯示完整頁面名稱「專案垃圾桶」，跟側邊選單連結文字、頁面大標題一致', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'ProjectTrashCans')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/ProjectTrashCans', name: 'ProjectTrashCans', component: Stub, meta: realMeta }],
    })
    await router.push({ path: '/view/ProjectTrashCans', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items[items.length - 1].label).toBe('專案垃圾桶')
  })
})

describe('useBreadcrumb 共用檔案管理', () => {
  it('麵包屑最後一項應顯示「共用檔案管理」（跟側邊選單子項目、頁面大標題一致），上一層用非連結的「共享資源庫」群組標籤', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'ResourceLibrary')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/ResourceLibrary', name: 'ResourceLibrary', component: Stub, meta: realMeta }],
    })
    await router.push({ path: '/view/ResourceLibrary', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items[items.length - 1].label).toBe('共用檔案管理')
    expect(items.some((i: any) => i.label === '共享資源庫' && !i.to)).toBe(true)
  })

  it('順序應為「團隊 / 母單元 / 現在單元」，團隊要排在母單元（group 標籤）前面，不是後面', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'ResourceLibrary')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/ResourceLibrary', name: 'ResourceLibrary', component: Stub, meta: realMeta }],
    })
    await router.push({ path: '/view/ResourceLibrary', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items.map((i: any) => i.label)).toEqual(['UGG電子商務', '共享資源庫', '共用檔案管理'])
  })
})

describe('useBreadcrumb 二層／一層順序規則', () => {
  it('有 parentName 的二層頁面（技能測試沙盒），順序是「團隊 / 母單元 / 現在單元」', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'SkillTest')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/view/Skills', name: 'SkillManagement', component: Stub, meta: realRouter.getRoutes().find(r => r.name === 'SkillManagement')?.meta },
        { path: '/view/SkillTest', name: 'SkillTest', component: Stub, meta: realMeta },
      ],
    })
    await router.push({ path: '/view/SkillTest', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items.map((i: any) => i.label)).toEqual(['UGG電子商務', '技能管理', '技能測試沙盒'])
  })

  it('沒有母單元的一層頁面（權限管理），順序是「團隊 / 現在單元」', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'TeamAccessManagement')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/TeamAccessManagement', name: 'TeamAccessManagement', component: Stub, meta: realMeta }],
    })
    await router.push({ path: '/view/TeamAccessManagement', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items.map((i: any) => i.label)).toEqual(['UGG電子商務', '權限管理'])
  })

  it('企業設定頁的麵包屑最後一項應為「企業設定」，不是舊的「企業/團隊設定」', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'CompanyTeamSettings')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/CompanyTeamSettings', name: 'CompanyTeamSettings', component: Stub, meta: realMeta }],
    })
    await router.push('/view/CompanyTeamSettings')

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items[items.length - 1].label).toBe('企業設定')
  })

  it('團隊專案頁本身也跟其他一層頁面同一套規則：「團隊 / 團隊專案」兩段', async () => {
    setActivePinia(createPinia())
    const realMeta = realRouter.getRoutes().find(r => r.name === 'TeamProject')?.meta
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/view/TeamProject', name: 'TeamProject', component: Stub, meta: realMeta }],
    })
    await router.push({ path: '/view/TeamProject', query: { teamId: 'testTeam1', teamName: 'UGG電子商務' } })

    const wrapper = mount(Host, { global: { plugins: [router] } })
    const items = (wrapper.vm as any).items

    expect(items.map((i: any) => i.label)).toEqual(['UGG電子商務', '團隊專案'])
  })
})
