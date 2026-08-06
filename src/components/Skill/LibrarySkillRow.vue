<template>
  <div class="LibrarySkillRow" @click="emit('click', skill)">
    <div :class="['lsr-icon', skill.type === 'extension' ? 'icon--ext' : 'icon--sys']">
      <i class="material-symbols-outlined">{{ skill.type === 'extension' ? 'extension' : 'psychology' }}</i>
    </div>
    <span class="lsr-name">{{ skill.name }}</span>
    <span v-if="skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>
    <span v-else-if="skill.scope === 'team' && skill.teamName" class="lsr-team-badge">{{ skill.teamName }}</span>
    <span v-if="activeVersionTag" class="lsr-active-tag">v{{ activeVersionTag }} 使用中</span>
    <span v-if="reviewedBy" class="lsr-reviewed-by">
      <i class="material-symbols-outlined">verified_user</i>審核人：{{ reviewedBy }}
    </span>
    <i class="material-symbols-outlined lsr-arrow">chevron_right</i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill }>()
const emit = defineEmits<{ click: [skill: Skill] }>()

const activeVersion = computed(() =>
  props.skill.versions?.find(v => v.status === 'active')
)

const activeVersionTag = computed(() =>
  activeVersion.value?.versionTag ?? props.skill.version
)

const reviewedBy = computed(() =>
  activeVersion.value?.reviewedBy ??
  activeVersion.value?.reviewHistory?.find(r => r.action === 'APPROVED')?.by
)
</script>
