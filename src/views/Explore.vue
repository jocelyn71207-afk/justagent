<template>
  <div class="Explore views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <!-- 分頁籤 -->
      <div class="explore-tabs">
        <button
          :class="['explore-tab', { active: activeExploreTab === 'agent' }]"
          @click="activeExploreTab = 'agent'"
        >
          <i class="material-symbols-outlined">support_agent</i>Agent 探索
        </button>
        <button
          :class="['explore-tab', { active: activeExploreTab === 'skill' }]"
          @click="activeExploreTab = 'skill'"
        >
          <i class="material-symbols-outlined">psychology</i>Skill 探索
        </button>
      </div>

      <template v-if="activeExploreTab === 'agent'">

      <!-- 搜尋列 -->
      <div class="explore-search-bar">
        <i class="material-symbols-outlined">search</i>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜尋 Agent 助理..."
        />
      </div>

      <AgentCard
        :agent="featuredAgent"
        featured
        :is-favorite="exploreStore.isFavorite(featuredAgent.id)"
        @click="openModal(featuredAgent)"
      />

      <div v-if="!filteredAgents.length" class="explore-empty-state">找不到符合條件的 Agent</div>
      <div v-else class="explore-list lively-stagger">
        <AgentCard
          v-for="agent in filteredAgents"
          :key="agent.id"
          :agent="agent"
          :is-favorite="exploreStore.isFavorite(agent.id)"
          :badge-label="badgeLabelFor(agent)"
          @click="openModal(agent)"
        />
      </div>

      </template>

      <template v-if="activeExploreTab === 'skill'">

      <!-- Skill 搜尋列 -->
      <div class="explore-search-bar">
        <i class="material-symbols-outlined">search</i>
        <input
          type="text"
          v-model="skillSearchKeyword"
          placeholder="搜尋技能..."
        />
      </div>

      <div v-if="!filteredExploreSkills.length" class="explore-empty-state">找不到符合條件的技能</div>
      <div v-else class="explore-list lively-stagger">
        <ExploreSkillCard
          v-for="skill in filteredExploreSkills"
          :key="skill.id"
          :skill="skill"
          @click="openSkillModal(skill)"
        />
      </div>

      </template>

    </div>
  </div>

  <AgentDetailModal v-model="isModalOpen" :agent="selectedAgent" />
  <SkillDetailModal v-model="isSkillModalOpen" :skill="selectedSkill" @assign="isAssignModalOpen = true" />
  <AssignSkillToAgentModal v-model="isAssignModalOpen" :skill="selectedSkill" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRootStore } from '@/stores/rootStore'
import { useExploreStore } from '@/stores/exploreStore'
import type { Agent } from '@/stores/exploreStore'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
import AgentCard from '@/components/Explore/AgentCard.vue'
import ExploreSkillCard from '@/components/Explore/ExploreSkillCard.vue'
import AgentDetailModal from '@/components/Explore/AgentDetailModal.vue'
import SkillDetailModal from '@/components/Explore/SkillDetailModal.vue'
import AssignSkillToAgentModal from '@/components/Explore/AssignSkillToAgentModal.vue'

const rootStore = useRootStore()
const { isEnterAppSearchPage } = storeToRefs(rootStore)

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const activeExploreTab = ref<'agent' | 'skill'>('agent')

// Featured hero agent（維持寫死指定「內容創作者」，跟改版前邏輯相同）
const featuredAgent = computed(() => exploreStore.agents.find(a => a.name === '內容創作者')!)

// 熱門角標名單：跟以前「使用熱度榜」同一份資料，只是不再切出頒獎台/次要列，
// 改成清單裡的一個小角標。優先序：Agent 自己的 badge（new/sat）> 熱門角標。
const RANKING_NAMES = ['內容創作者', '社群管理', '專案管理', '顧客服務管理']

function badgeLabelFor(agent: Agent): string | undefined {
  if (agent.badge) return agent.badge.label
  if (agent.name !== featuredAgent.value.name && RANKING_NAMES.includes(agent.name)) return '熱門'
  return undefined
}

// 搜尋（即時篩選，不需要按 Enter；拿掉分類 chip 之後搜尋框是唯一的縮小範圍工具）
const searchKeyword = ref('')

const otherAgents = computed(() =>
  exploreStore.agents.filter(a => a.name !== featuredAgent.value.name)
)

const filteredAgents = computed(() =>
  otherAgents.value.filter(a =>
    !searchKeyword.value.trim() ||
    a.name.includes(searchKeyword.value.trim()) ||
    a.tags.some(t => t.includes(searchKeyword.value.trim()))
  )
)

// Agent 詳情 Modal
const isModalOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

function openModal(agent: Agent) {
  selectedAgent.value = agent
  isModalOpen.value = true
}

// Skill 探索：資料源接真正的 skillStore，只列出非個人草稿、目前啟用中、未刪除的技能
const skillSearchKeyword = ref('')

const publicSkills = computed(() =>
  skillStore.skills.filter(s => s.zone !== 'personal' && s.isEnabled && !s.deletedAt)
)

const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    !skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim())
  )
)

const isSkillModalOpen = ref(false)
const selectedSkill = ref<Skill | null>(null)

function openSkillModal(skill: Skill) {
  selectedSkill.value = skill
  isSkillModalOpen.value = true
}

const isAssignModalOpen = ref(false)
</script>
