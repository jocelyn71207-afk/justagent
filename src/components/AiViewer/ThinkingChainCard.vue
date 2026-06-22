<template>
  <div>
    <!-- Collapsed toggle (shown after thinking ends, while not expanded) -->
    <button
      v-if="!props.isThinking && !isExpanded"
      class="thinking-chain-toggle"
      @click="isExpanded = true"
    >
      <i class="material-symbols-outlined toggle-icon">mode_comment</i>
      查看推理過程
      <i class="material-symbols-outlined toggle-icon">expand_more</i>
    </button>

    <!-- Full card (shown while thinking OR manually expanded) -->
    <div v-if="props.isThinking || isExpanded" class="thinking-chain-card">
      <div class="thinking-card-header">
        <i class="material-symbols-outlined spinning-icon" v-if="props.isThinking">
          filter_vintage
        </i>
        <span>{{ props.isThinking ? 'AI 正在思考...' : '推理過程' }}</span>
        <button v-if="!props.isThinking" class="collapse-btn" @click="isExpanded = false">
          <i class="material-symbols-outlined">expand_less</i>
        </button>
      </div>

      <div class="thinking-steps">
        <div
          v-for="(step, i) in props.steps"
          :key="i"
          :class="[
            'thinking-step',
            { visible: i < visibleCount },
            { 'last-active': props.isThinking && i === visibleCount - 1 },
          ]"
        >
          <i class="material-symbols-outlined thinking-step-icon">{{ iconMap[step.type] }}</i>
          <div class="thinking-step-body">
            <span>{{ step.label }}</span>
            <template v-if="step.type === 'search'">
              <span
                v-for="src in props.sources"
                :key="src.knowledgeId"
                class="thinking-step-tag"
              >{{ src.title }}</span>
            </template>
            <span v-if="step.detail" class="thinking-step-detail">{{ step.detail }}</span>
            <span
              v-if="props.isThinking && i === visibleCount - 1"
              class="thinking-step-spinner"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue'

interface ThinkingStep {
  label: string
  detail?: string
  type: 'think' | 'search' | 'synthesize'
}

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const props = defineProps<{
  steps: ThinkingStep[]
  sources: KnowledgeSource[]
  isThinking: boolean
}>()

const iconMap: Record<ThinkingStep['type'], string> = {
  think: 'psychology',
  search: 'travel_explore',
  synthesize: 'auto_awesome',
}

const visibleCount = ref(0)
const isExpanded = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function startAnimation() {
  visibleCount.value = 0
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (visibleCount.value < props.steps.length) {
      visibleCount.value++
    } else {
      clearInterval(timer!)
      timer = null
    }
  }, 800)
}

watch(
  () => props.isThinking,
  (val, oldVal) => {
    if (val) {
      // Entering thinking state: animate steps
      isExpanded.value = true
      startAnimation()
    } else if (oldVal === true) {
      // Finished thinking: show all steps, then auto-collapse after 300ms
      visibleCount.value = props.steps.length
      if (timer) { clearInterval(timer); timer = null }
      setTimeout(() => { isExpanded.value = false }, 300)
    } else {
      // Mounted already in non-thinking state (finished response re-render)
      visibleCount.value = props.steps.length
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
