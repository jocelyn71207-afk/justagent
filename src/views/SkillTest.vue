<template>
  <div class="SkillTest views-page">
    <div class="skill-test-layout">

      <!-- 左側：技能選擇 -->
      <div class="test-sidebar">
        <div class="sidebar-head">測試的技能</div>
        <div class="sidebar-list">
          <div
            v-for="skill in store.flatSkills"
            :key="skill.id"
            :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
            @click="store.setSelectedSkill(skill.id)"
          >
            <span :class="['skill-dot', skill.type === 'system' ? 'dot--sys' : 'dot--ext']"></span>
            {{ skill.name }}
          </div>
        </div>
      </div>

      <!-- 右側：測試面板 -->
      <div class="test-panel">
        <template v-if="selectedSkill">
          <div class="test-panel-head">
            <div class="panel-title">
              {{ selectedSkill.name }}
              <span class="skill-tag tag--version">v{{ selectedSkill.version }}</span>
              <span :class="['skill-tag', selectedSkill.type === 'system' ? 'tag--sys' : 'tag--ext']">
                {{ selectedSkill.type === 'system' ? '系統技能' : '企業擴充' }}
              </span>
            </div>
          </div>

          <SkillTestChat :skill-id="selectedSkill.id" />
        </template>

        <div v-else class="panel-empty">
          <i class="material-symbols-outlined">science</i>
          <p>請從左側選擇要測試的技能</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import { useSkillStore } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()

const selectedSkill = computed(() =>
  store.selectedSkillId ? store.findSkill(store.selectedSkillId) ?? null : null
)

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) {
    store.setSelectedSkill(skillId)
  } else if (store.flatSkills.length) {
    store.setSelectedSkill(store.flatSkills[0].id)
  }
})
</script>
