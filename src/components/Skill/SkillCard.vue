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
        <span :class="['skill-tag', isExtension ? 'tag--ext' : 'tag--sys']">
          {{ isExtension ? originLabel : '系統技能' }}
        </span>
        <span class="skill-tag tag--version">v{{ skill.version }}</span>
        <span v-if="skill.upstreamUpdateStatus === 'update_available'" class="skill-tag tag--update">
          ↑ 更新
        </span>
      </div>
      <div class="skill-card-desc">{{ skill.description }}</div>
      <div v-if="isExtension && skill.forkSourceId" class="skill-card-lineage">
        <template v-if="skill.upstreamLink === 'linked'">
          演化自 v{{ skill.forkSourceVersion }}
        </template>
        <template v-else>
          已解除上游連結，由您主動維護
        </template>
      </div>
    </div>

    <div class="skill-card-meta">
      <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
      <span class="status-text">{{ skill.isEnabled ? '啟用中' : '已停用' }}</span>
    </div>

    <div class="skill-card-actions" @click.stop>
      <button
        v-if="isExtension && skill.upstreamUpdateStatus === 'update_available'"
        class="custom-btn skill-action-btn btn--warning"
        @click="emit('update', skill)"
      >
        更新
      </button>
      <button class="custom-btn skill-action-btn" @click="emit('test', skill)">測試</button>
      <button
        :class="['custom-btn', 'skill-action-btn', 'btn--danger-ghost']"
        @click="emit('toggle', skill)"
      >
        {{ skill.isEnabled ? '停用' : '啟用' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = withDefaults(defineProps<{
  skill: Skill
  isExtension?: boolean
}>(), {
  isExtension: false,
})

const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  toggle: [skill: Skill]
  update: [skill: Skill]
}>()

const originLabel = computed(() => {
  if (props.skill.origin === 'conversation_evolved') return '對話演化'
  if (props.skill.origin === 'custom_version') return '自訂版本'
  if (props.skill.origin === 'manually_created') return '手動建立'
  return '擴充技能'
})
</script>
