<template>
  <div class="SkillReviewQueue">

    <!-- 左側：待審佇列，快速掃描哪些在等——名稱、送審流向、送審人一次看完，
         點一筆才在右側看完整脈絡，不用每筆都攤開一整張卡片 -->
    <div class="rq-list">
      <div
        v-for="skill in skills"
        :key="skill.id"
        :class="['rq-row', { 'is-active': selectedId === skill.id }]"
        @click="selectedId = skill.id"
      >
        <div :class="['rq-row-icon', targetScope(skill) === 'team' ? 'icon--team' : 'icon--enterprise']">
          <i class="material-symbols-outlined">psychology</i>
        </div>
        <div class="rq-row-main">
          <div class="rq-row-name">{{ skill.name }}</div>
          <div class="rq-row-sub">
            {{ flowLabel(skill) }}<template v-if="skill.submittedBy"> · {{ skill.submittedBy }}</template>
          </div>
        </div>
        <span class="skill-tag tag--reviewing">審核中</span>
      </div>
    </div>

    <!-- 右側：選中那筆的完整詳情——技能指令、AI 分析都是做通過/退回決定
         必看的內容，維持原本 SkillReviewCard 的呈現，只是不再包一層卡片外框 -->
    <div class="rq-detail">
      <SkillReviewCard
        v-if="selectedSkill"
        :skill="selectedSkill"
        @view="skill => emit('view', skill)"
        @approve="skill => emit('approve', skill)"
        @reject="handleReject"
      />
      <div v-else class="rq-empty">
        <i class="material-symbols-outlined">rate_review</i>
        <p>請從左側選擇要審核的技能</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Skill } from '@/stores/skillStore'
import SkillReviewCard from '@/components/Skill/SkillReviewCard.vue'

const props = defineProps<{ skills: Skill[] }>()
const emit = defineEmits<{
  view: [skill: Skill]
  approve: [skill: Skill]
  reject: [skill: Skill, feedback: string]
}>()

const selectedId = ref<string | null>(props.skills[0]?.id ?? null)

const selectedSkill = computed(() => props.skills.find(s => s.id === selectedId.value) ?? null)

// 通過/退回後那一筆會從 skills 清單消失，選中項目要跟著換下一筆，
// 不然詳情面板會停在一個已經不在佇列裡的技能上
watch(() => props.skills, (list) => {
  if (!list.some(s => s.id === selectedId.value)) {
    selectedId.value = list[0]?.id ?? null
  }
})

function targetScope(skill: Skill): 'enterprise' | 'team' {
  return skill.targetScope ?? 'enterprise'
}

function flowLabel(skill: Skill): string {
  const mode = skill.submitMode === 'version_update' ? '更新版本' : '建立新技能'
  const scope = targetScope(skill) === 'team'
    ? `團隊技能（${skill.targetTeamName ?? '未指定團隊'}）`
    : '企業技能'
  return `${mode} → ${scope}`
}

function handleReject(skill: Skill, feedback: string) {
  emit('reject', skill, feedback)
}
</script>
