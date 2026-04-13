import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'



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
      },
      {
        path: '/view/TeamProject',
        name: 'TeamProject',
        component: () => import('@/views/TeamProject.vue'),
      },
      {
        path: '/view/ResourceLibrary',
        name: 'ResourceLibrary',
        component: () => import('@/views/ResourceLibrary.vue'),
      },
      {
        path: '/view/TeamAccessManagement',
        name: 'TeamAccessManagement',
        component: () => import('@/views/TeamAccessManagement.vue'),
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
      },
      {
        path: '/view/KnowledgeBase',
        name: 'KnowledgeBase',
        component: () => import('@/views/KnowledgeBase.vue'),
      },
      {
        path: '/view/KnowledgeDetail/:id',
        name: 'KnowledgeDetail',
        component: () => import('@/views/KnowledgeDetail.vue'),
        props: true,
      },
      {
        path: '/view/KnowledgeEditor/:knowledgeId/:versionId',
        name: 'KnowledgeEditor',
        component: () => import('@/views/KnowledgeEditor.vue'),
        props: true,
      },
      {
        path: '/view/KnowledgeApiSources',
        name: 'KnowledgeApiSources',
        component: () => import('@/views/KnowledgeApiSources.vue'),
      },
      {
        path: '/view/Explore',
        name: 'Explore',
        component: () => import('@/views/Explore.vue'),
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
