<template>
  <div class="delegate-status-card">
    <div class="delegate-bookend" v-if="props.bookend">{{ props.bookend }}</div>
    <div class="conv2-search-card">
      <div
        v-for="(step, i) in props.steps"
        :key="i"
        class="conv2-ss"
        :class="`conv2-ss--${step.status}`"
      >{{ step.label }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Orchestrator 單層委派下，競品分析 Agent → DeepAgent 的委派狀態卡片。
// 純展示元件：每一步的 done/active/wait 狀態完全由外層（AiViewerRightBox.vue
// 的 runDelegateSteps）驅動，這裡只負責渲染，方便未來其他 conv 流程重用。
interface DelegateStep {
  label: string
  status: 'done' | 'active' | 'wait'
}

const props = defineProps<{
  steps: DelegateStep[]
  bookend?: string
}>()
</script>
