<template>
  <div class="DraftCard" @click="emit('view', draft)">
    <div class="draft-card-icon">
      <i class="material-symbols-outlined">draft</i>
    </div>

    <div class="draft-card-body">
      <div class="draft-card-top">
        <span class="draft-card-name">{{ draft.name || '未命名草稿' }}</span>
        <span class="skill-tag tag--draft">草稿</span>
        <span v-if="!draft.name" class="draft-card-hint">點擊開始編輯</span>
      </div>
      <div :class="['draft-card-desc', !draft.description && 'draft-card-desc--auto']">
        {{ draft.description || '描述將由系統根據指令自動生成' }}
      </div>
      <div class="draft-card-footer">
        <div class="draft-completion">
          <span
            v-for="(step, i) in completionSteps"
            :key="i"
            :class="['dc-dot', step.done && 'dc-dot--done']"
            :title="step.label"
          ></span>
          <span class="dc-label">{{ completionText }}</span>
        </div>
        <span class="draft-date">{{ relativeTime(draft.updatedAt) }}</span>
      </div>
    </div>

    <div class="draft-card-actions" @click.stop>
      <button
        class="custom-btn dcard-btn dcard-btn--submit"
        :disabled="!canSubmit"
        @click="emit('submit', draft)"
      >
        <i class="material-symbols-outlined">send</i>提交審核
      </button>
      <button class="custom-btn dcard-btn" @click="emit('edit', draft)">
        <i class="material-symbols-outlined">edit</i>編輯
      </button>
      <button class="custom-btn dcard-btn dcard-btn--delete" @click="emit('delete', draft)">
        <i class="material-symbols-outlined">delete</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DraftSkill } from '@/stores/skillStore'

const props = defineProps<{ draft: DraftSkill }>()
const emit = defineEmits<{
  view: [draft: DraftSkill]
  edit: [draft: DraftSkill]
  submit: [draft: DraftSkill]
  delete: [draft: DraftSkill]
}>()

const completionSteps = computed(() => [
  { label: '名稱', done: !!props.draft.name.trim() },
  { label: '指令', done: !!props.draft.instructions.trim() },
])

const completionText = computed(() => {
  const done = completionSteps.value.filter(s => s.done).length
  if (done === 0) return '尚未開始'
  if (done === 2) return '已完成'
  return `${done}/2 步驟`
})

const canSubmit = computed(() =>
  completionSteps.value.every(s => s.done)
)

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '剛剛修改'
  if (mins < 60) return `${mins} 分鐘前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小時前`
  const days = Math.floor(hrs / 24)
  return `${days} 天前`
}
</script>
