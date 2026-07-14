<template>
  <div class="PersonalSkillCard" @click="emit('view', skill)">
    <div class="psc-icon">
      <i class="material-symbols-outlined">person</i>
    </div>

    <div class="psc-body">
      <div class="psc-name-row">
        <span class="psc-name">{{ skill.name }}</span>
        <span :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
      </div>
      <div class="psc-desc">{{ skill.description }}</div>
      <div v-if="derivedFromName || skill.hasLibraryUpdate" class="psc-meta">
        <span v-if="derivedFromName" class="psc-source">
          <i class="material-symbols-outlined">link</i>來源：{{ derivedFromName }}
        </span>
        <span v-if="skill.hasLibraryUpdate" class="psc-update-hint">
          <i class="material-symbols-outlined">warning</i>有更新
        </span>
      </div>
    </div>

    <div class="psc-actions" @click.stop>
      <button class="custom-btn psc-btn" @click="emit('view', skill)">
        <i class="material-symbols-outlined">open_in_new</i>查看詳情
      </button>
      <button
        :class="['custom-btn', 'psc-btn', canSubmit ? 'custom-main-btn' : null]"
        :disabled="!canSubmit"
        @click="emit('submit', skill)"
      >
        <i class="material-symbols-outlined">send</i>{{ submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill }>()
const emit = defineEmits<{
  view: [skill: Skill]
  submit: [skill: Skill]
}>()

const store = useSkillStore()

const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  if (props.skill.personalStatus === 'has_library') return '已有Library版'
  return '可使用'
})

const statusTagClass = computed(() => {
  if (props.skill.personalStatus === 'reviewing') return 'tag--reviewing'
  if (props.skill.personalStatus === 'has_library') return 'tag--has-library'
  return 'tag--available'
})

const canSubmit = computed(() => props.skill.personalStatus !== 'reviewing')

const submitLabel = computed(() =>
  props.skill.personalStatus === 'has_library' ? '再次送審' : '送審'
)

const derivedFromName = computed(() => {
  if (!props.skill.derivedFrom) return null
  return store.flatSkills.find(s => s.id === props.skill.derivedFrom)?.name ?? null
})
</script>
