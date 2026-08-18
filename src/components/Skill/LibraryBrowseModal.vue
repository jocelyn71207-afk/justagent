<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue" class="LibraryBrowseModal" @click.self="emit('update:modelValue', false)">
        <div class="lbm-panel">
          <div class="lbm-head">
            <div class="lbm-title">
              <i class="material-symbols-outlined">library_books</i>
              Library 技能庫
            </div>
            <button class="drawer-close-btn" @click="emit('update:modelValue', false)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <!-- Search -->
          <div class="lbm-search">
            <i class="material-symbols-outlined">search</i>
            <input v-model="query" class="lbm-input" placeholder="搜尋技能名稱或描述" />
          </div>

          <div class="lbm-body">
            <!-- 系統技能 -->
            <div v-if="filteredSystem.length" class="lbm-section">
              <div class="lbm-section-label lbm-section-label--system">
                <i class="material-symbols-outlined">auto_awesome</i>系統技能
                <span class="lbm-count">{{ filteredSystem.length }}</span>
              </div>
              <div class="lbm-list">
                <SkillCard
                  v-for="skill in filteredSystem"
                  :key="skill.id"
                  :skill="skill"
                  @click="emit('open-detail', $event)"
                  @test="emit('test', $event)"
                  @duplicate="emit('duplicate', $event)"
                />
              </div>
            </div>

            <!-- 企業技能 -->
            <div v-if="filteredEnterprise.length" class="lbm-section">
              <div class="lbm-section-label lbm-section-label--enterprise">
                <i class="material-symbols-outlined">corporate_fare</i>企業技能
                <span class="lbm-count">{{ filteredEnterprise.length }}</span>
              </div>
              <div class="lbm-list">
                <SkillCard
                  v-for="skill in filteredEnterprise"
                  :key="skill.id"
                  :skill="skill"
                  @click="emit('open-detail', $event)"
                  @test="emit('test', $event)"
                  @duplicate="emit('duplicate', $event)"
                />
              </div>
            </div>

            <!-- 團隊技能 -->
            <div v-if="filteredTeam.length" class="lbm-section">
              <div class="lbm-section-label lbm-section-label--team">
                <i class="material-symbols-outlined">groups</i>團隊技能
                <span class="lbm-count">{{ filteredTeam.length }}</span>
              </div>
              <div class="lbm-list">
                <SkillCard
                  v-for="skill in filteredTeam"
                  :key="skill.id"
                  :skill="skill"
                  @click="emit('open-detail', $event)"
                  @test="emit('test', $event)"
                  @duplicate="emit('duplicate', $event)"
                />
              </div>
            </div>

            <div v-if="!filteredSystem.length && !filteredEnterprise.length && !filteredTeam.length" class="lbm-empty">
              <i class="material-symbols-outlined">search_off</i>
              <span>找不到符合「{{ query }}」的技能</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  'open-detail': [Skill]
  'test': [Skill]
  'duplicate': [Skill]
}>()

const store = useSkillStore()
const query = ref('')

const filteredSystem = computed(() => {
  const q = query.value.toLowerCase().trim()
  return store.skills.filter(s =>
    s.type === 'system' && !s.deletedAt &&
    (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  )
})

const filteredEnterprise = computed(() => {
  const q = query.value.toLowerCase().trim()
  return store.flatSkills.filter(s =>
    s.scope === 'enterprise' && !s.deletedAt &&
    (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  )
})

const filteredTeam = computed(() => {
  const q = query.value.toLowerCase().trim()
  return store.flatSkills.filter(s =>
    s.scope === 'team' && !s.deletedAt &&
    (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
  )
})
</script>
