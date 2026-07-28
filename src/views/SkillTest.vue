<template>
  <div class="SkillTest views-page">
    <div class="skill-test-layout">

      <!-- 左側：技能選擇 -->
      <div class="test-sidebar">
        <div class="sidebar-head">測試的技能</div>
        <div class="sidebar-list">

          <template v-if="personalSkills.length">
            <div class="section-badge-row">
              <span class="section-badge section-badge--mine">我的技能</span>
            </div>
            <div
              v-for="skill in personalSkills"
              :key="skill.id"
              :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
              @click="store.setSelectedSkill(skill.id)"
            >
              <span class="si-name">{{ skill.name }}</span>
              <SkillVersionPicker
                :versions="store.getVersionOptions(skill.id)"
                :model-value="displayVersionTag(skill)"
                @update:model-value="v => store.setSelectedSkill(skill.id, v)"
              />
            </div>
          </template>

          <template v-if="librarySubgroups.some(g => g.skills.length)">
            <div class="section-badge-row">
              <span class="section-badge section-badge--library">Library 技能</span>
            </div>

            <template v-for="group in librarySubgroups" :key="group.key">
              <template v-if="group.skills.length">
                <div class="subgroup-label">{{ group.label }}</div>
                <div
                  v-for="skill in group.skills"
                  :key="skill.id"
                  :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
                  @click="store.setSelectedSkill(skill.id)"
                >
                  <span :class="['skill-dot', skill.type === 'system' ? 'dot--sys' : 'dot--ext']"></span>
                  <span class="si-name">{{ skill.name }}</span>
                  <span v-if="skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>
                  <span v-else-if="skill.scope === 'team' && skill.teamName" class="skill-tag tag--team">{{ skill.teamName }}</span>
                  <SkillVersionPicker
                    :versions="store.getVersionOptions(skill.id)"
                    :model-value="displayVersionTag(skill)"
                    @update:model-value="v => store.setSelectedSkill(skill.id, v)"
                  />
                </div>
              </template>
            </template>
          </template>

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

          <div class="test-panel-tabs">
            <button
              :class="['tab-btn', { 'is-active': activeTab === 'chat' }]"
              @click="activeTab = 'chat'"
            >
              <i class="material-symbols-outlined">chat</i>
              對話測試
            </button>
            <button
              :class="['tab-btn', { 'is-active': activeTab === 'ai' }]"
              @click="activeTab = 'ai'"
            >
              <i class="material-symbols-outlined">auto_awesome</i>
              AI 快速測試
            </button>
          </div>

          <SkillTestChat v-if="activeTab === 'chat'" :skill-id="selectedSkill.id" />
          <SkillTestAI v-else :skill-id="selectedSkill.id" />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import SkillVersionPicker from '@/components/Skill/SkillVersionPicker.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const activeTab = ref<'chat' | 'ai'>('chat')

const selectedSkill = computed(() =>
  store.selectedSkillId ? store.findSkill(store.selectedSkillId) ?? null : null
)

const personalSkills = computed(() => store.myPersonalSkills)
const enabledLibrarySkills = computed(() => store.flatSkills.filter(s => s.isEnabled))

const librarySubgroups = computed(() => [
  { key: 'system', label: '系統技能', skills: enabledLibrarySkills.value.filter(s => s.scope === 'system') },
  { key: 'enterprise', label: '企業擴充', skills: enabledLibrarySkills.value.filter(s => s.scope === 'enterprise') },
  { key: 'team', label: '團隊擴充', skills: enabledLibrarySkills.value.filter(s => s.scope === 'team') },
])

function displayVersionTag(skill: Skill): string {
  if (store.selectedSkillId === skill.id && store.selectedVersionTag) {
    return store.selectedVersionTag
  }
  return store.getDefaultVersionTag(skill.id) ?? ''
}

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) {
    store.setSelectedSkill(skillId)
  } else if (personalSkills.value.length) {
    store.setSelectedSkill(personalSkills.value[0].id)
  } else if (enabledLibrarySkills.value.length) {
    store.setSelectedSkill(enabledLibrarySkills.value[0].id)
  }
})
</script>
