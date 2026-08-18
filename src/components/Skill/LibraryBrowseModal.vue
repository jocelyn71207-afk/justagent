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

          <!-- 範圍篩選：改成分頁切換，不再是系統/企業/團隊三個區塊一路往下堆疊 -->
          <div class="lbm-segctrl">
            <button :class="{ 'is-on': scopeFilter === 'all' }" @click="scopeFilter = 'all'">
              全部<span class="lbm-seg-count">{{ filteredSystem.length + filteredEnterprise.length + filteredTeam.length }}</span>
            </button>
            <button :class="{ 'is-on': scopeFilter === 'system' }" @click="scopeFilter = 'system'">
              系統<span class="lbm-seg-count">{{ filteredSystem.length }}</span>
            </button>
            <button :class="{ 'is-on': scopeFilter === 'enterprise' }" @click="scopeFilter = 'enterprise'">
              企業<span class="lbm-seg-count">{{ filteredEnterprise.length }}</span>
            </button>
            <button :class="{ 'is-on': scopeFilter === 'team' }" @click="scopeFilter = 'team'">
              團隊<span class="lbm-seg-count">{{ filteredTeam.length }}</span>
            </button>
          </div>

          <div class="lbm-body">
            <div v-if="visibleSkills.length" class="lbm-grid">
              <SkillTile
                v-for="skill in visibleSkills"
                :key="skill.id"
                :skill="skill"
                @click="emit('open-detail', $event)"
                @test="emit('test', $event)"
                @duplicate="emit('duplicate', $event)"
              />
            </div>

            <div v-else class="lbm-empty">
              <i class="material-symbols-outlined">search_off</i>
              <span v-if="query">找不到符合「{{ query }}」的技能</span>
              <span v-else>這個範圍目前沒有技能</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SkillTile from '@/components/Skill/SkillTile.vue'
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
const scopeFilter = ref<'all' | 'system' | 'enterprise' | 'team'>('all')

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

// 依分頁篩選要顯示的技能；「全部」把三個範圍接起來，順序維持系統→企業→團隊
const visibleSkills = computed(() => {
  if (scopeFilter.value === 'system') return filteredSystem.value
  if (scopeFilter.value === 'enterprise') return filteredEnterprise.value
  if (scopeFilter.value === 'team') return filteredTeam.value
  return [...filteredSystem.value, ...filteredEnterprise.value, ...filteredTeam.value]
})
</script>
