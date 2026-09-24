<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ workspaceRef?.mode === 'edit' ? '修改技能' : '新增技能' }}</div>
        </div>
      </div>

      <SkillStudioWorkspace ref="workspaceRef" :initial-query="route.query" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import popDialog from '@/services/popDialog'

const route = useRoute()
const workspaceRef = ref<InstanceType<typeof SkillStudioWorkspace> | null>(null)

onBeforeRouteUpdate((to, _from, next) => {
  if (!workspaceRef.value?.isDirty) {
    workspaceRef.value?.applyQuery(to.query)
    return next()
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', () => {
    workspaceRef.value?.applyQuery(to.query)
    next()
  }, () => next(false))
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!workspaceRef.value?.isDirty) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
</script>
