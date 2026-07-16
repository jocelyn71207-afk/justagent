<template>
  <div
    :class="[
      'SkillCard',
      { 'is-extension': isExtension },
      { 'is-standalone': isExtension && !skill.forkSourceId },
      { 'is-disabled': !skill.isEnabled },
    ]"
    @click="emit('click', skill)"
  >
    <div :class="['skill-card-icon', isExtension ? 'icon--ext' : 'icon--sys']">
      <i class="material-symbols-outlined">{{ isExtension ? 'extension' : 'psychology' }}</i>
    </div>

    <div class="skill-card-body">
      <div class="skill-card-name">
        {{ skill.name }}
        <span class="skill-tag tag--version">v{{ skill.version }}</span>
        <span v-if="isExtension && skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>
        <span v-if="isExtension && skill.scope === 'team'" class="skill-tag tag--team">團隊</span>
        <span v-if="hasReviewingVersion" class="skill-tag tag--reviewing">審核中</span>
        <span v-if="hasUpstreamUpdate" class="skill-tag tag--upstream">
          <i class="material-symbols-outlined">upgrade</i>待更新
        </span>
      </div>
      <div class="skill-card-desc">{{ skill.description }}</div>
      <div class="skill-card-stats">
        <span class="sk-stat">
          <i class="material-symbols-outlined">bolt</i>{{ formatCount(skill.usageCount) }}
        </span>
        <span :class="['sk-stat', rateClass]">
          <i class="material-symbols-outlined">verified</i>{{ Math.round(skill.testPassRate * 100) }}%
        </span>
        <span class="sk-stat">
          <i class="material-symbols-outlined">timer</i>{{ skill.avgLatencyMs }}ms
        </span>
      </div>
    </div>

    <div class="skill-card-right">
      <div class="skill-card-meta">
        <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
        <span class="status-text">{{ skill.isEnabled ? '啟用中' : '已停用' }}</span>
      </div>
      <div class="skill-card-actions" @click.stop>
        <button
          class="custom-btn skill-action-btn skill-action-btn--icon"
          title="複製至草稿"
          @click="emit('duplicate', skill)"
        >
          <i class="material-symbols-outlined">content_copy</i>
        </button>
        <button class="custom-btn skill-action-btn" @click="emit('test', skill)">測試</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = withDefaults(defineProps<{
  skill: Skill
  isExtension?: boolean
  hasUpstreamUpdate?: boolean
}>(), {
  isExtension: false,
  hasUpstreamUpdate: false,
})

const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  duplicate: [skill: Skill]
}>()

const rateClass = computed(() =>
  props.skill.testPassRate >= 0.9 ? 'sk-stat--good'
  : props.skill.testPassRate >= 0.75 ? 'sk-stat--warn'
  : 'sk-stat--bad'
)

const hasReviewingVersion = computed(() =>
  props.skill.versions?.some(v => v.status === 'reviewing') ?? false
)

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
</script>
