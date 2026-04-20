import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    parentName?: string
    useCompanyName?: boolean
    hideMenuTree?: boolean
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/entrance', // 移到這邊
    name: 'AppEntrance',
    component: () => import('../views/AppEntrance.vue'),
  },
  {
    path: '/view',
    redirect: '/view/ProjectDashboard',
    name: 'Home',
    component: () => import('../container/Full.vue'),
    children: [
      {
        path: '/view/ProjectDashboard',
        name: 'ProjectDashboard',
        component: () => import('@/views/ProjectDashboard.vue'),
        meta: { title: '最近使用' },
      },
      {
        path: '/view/TeamProject',
        name: 'TeamProject',
        component: () => import('@/views/TeamProject.vue'),
        meta: { title: '團隊專案' },
      },
      {
        path: '/view/ResourceLibrary',
        name: 'ResourceLibrary',
        component: () => import('@/views/ResourceLibrary.vue'),
        meta: { title: '共享資源庫' },
      },
      {
        path: '/view/TeamAccessManagement',
        name: 'TeamAccessManagement',
        component: () => import('@/views/TeamAccessManagement.vue'),
        meta: { title: '權限管理' },
      },
      {
        path: '/view/AiViewer',
        name: 'AiViewer',
        component: () => import('@/views/AiViewer.vue'),
        meta: { hideMenuTree: true },
      },
      {
        path: '/view/CompanyTeamSettings',
        name: 'CompanyTeamSettings',
        component: () => import('@/views/CompanyTeamSettings.vue'),
        meta: { title: '企業/團隊設定', useCompanyName: true },
      },
      {
        path: '/view/GUI',
        name: 'GUI',
        component: () => import('@/views/GUI.vue'),
      },
      {
        path: '/view/ProjectTrashCans',
        name: 'ProjectTrashCans',
        component: () => import('@/views/ProjectTrashCans.vue'),
        meta: { title: '垃圾桶' },
      },
      {
        path: '/view/KnowledgeBase',
        name: 'KnowledgeBase',
        component: () => import('@/views/KnowledgeBase.vue'),
        meta: { title: '知識庫管理' },
      },
      {
        path: '/view/KnowledgeDetail/:id',
        name: 'KnowledgeDetail',
        component: () => import('@/views/KnowledgeDetail.vue'),
        props: true,
        meta: { title: '知識庫', parentName: 'KnowledgeBase' },
      },
      {
        path: '/view/KnowledgeEditor/:knowledgeId/:versionId',
        name: 'KnowledgeEditor',
        component: () => import('@/views/KnowledgeEditor.vue'),
        props: true,
        meta: { title: '編輯器', parentName: 'KnowledgeBase' },
      },
      {
        path: '/view/Explore',
        name: 'Explore',
        component: () => import('@/views/Explore.vue'),
        meta: { title: '探索' },
      },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  // TODO... 之後還要處理登入驗證的邏輯 (可參考中台, 因為也是走Ｂ端身份識別中心)

  const rootStore = useRootStore()
  rootStore.isEnterAppSearchPage = false
  rootStore.appSearchKeyword = ''

  next();
})

export default router
