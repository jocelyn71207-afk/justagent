<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ bannerTitle }}</div>
        </div>
      </div>

      <SkillStudioWorkspace ref="workspaceRef" :initial-query="route.query" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import popDialog from '@/services/popDialog'

const route = useRoute()
const workspaceRef = ref<InstanceType<typeof SkillStudioWorkspace> | null>(null)
const bannerTitle = ref('新增技能')

// Watch for mode changes and update banner title - watch both ref and its mode property
watch(
  [workspaceRef, () => workspaceRef.value?.mode?.value],
  () => {
    const mode = workspaceRef.value?.mode?.value
    bannerTitle.value = mode === 'edit' ? '修改技能' : '新增技能'
  },
  { immediate: true }
)

onBeforeRouteUpdate((to, _from, next) => {
  if (!workspaceRef.value?.isDirty.value) {
    workspaceRef.value?.applyQuery(to.query)
    return next()
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', () => {
    workspaceRef.value?.applyQuery(to.query)
    next()
  }, () => next(false))
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!workspaceRef.value?.isDirty.value) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
</script>
