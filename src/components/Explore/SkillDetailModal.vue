<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="skill?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="skill">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div :class="['explore-modal-icon', `agent-icon--${visual.colorKey}`]">
            <i class="material-symbols-outlined">{{ visual.icon }}</i>
          </div>
          <span v-if="skill.functionType" class="skill-function-badge">{{ skill.functionType }}</span>
          <p class="explore-modal-desc">{{ capabilityText }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="onAssignClick">加入我的技能</button>
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import type { Skill } from '@/stores/skillStore'
import { getSkillVisual } from '@/stores/exploreStore'

const props = defineProps<{
  modelValue: boolean
  skill: Skill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'assign'): void
}>()

const visual = computed(() => getSkillVisual(props.skill?.functionType))
const capabilityText = computed(() => props.skill?.capabilities?.[0]?.description ?? props.skill?.description ?? '')

function onAssignClick() {
  emit('update:modelValue', false)
  emit('assign')
}
</script>
