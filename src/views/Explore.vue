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
          @keydown.enter="onSearchEnter"
        />
      </div>

      <!-- 搜尋快捷 chips -->
      <div class="search-chips">
        <span class="chip">內容創作</span>
        <span class="chip">財務分析</span>
        <span class="chip">會議記錄</span>
        <span class="chip">HR 行政</span>
        <span class="chip">設計輔助</span>
      </div>

      <!-- Hero Banner -->
      <div class="explore-hero">
        <div class="hero-left">
          <div class="hero-eyebrow-pill">AI Agent 平台</div>
          <h2>今天想讓 Agent 助理幫你做什麼？</h2>
          <p>發掘最強大工作效率，選擇最適合的 AI 助理</p>
        </div>
        <div class="hero-cta" @click="openModal(featuredAgent)">
          <div class="hero-cta-label">由我推薦</div>
          <div class="hero-cta-name">{{ featuredAgent.name }}</div>
          <div class="hero-cta-desc">{{ featuredAgent.painPoint }}</div>
          <div class="hero-cta-link">立即使用 →</div>
        </div>
      </div>

      <!-- 熱門 Agent -->
      <div class="section-header">
        <h3>熱門 Agent</h3>
        <span class="see-all" @click="showToast('查看全部熱門')">查看全部</span>
      </div>
      <div class="ranking-podium lively-stagger mb-3">
        <AgentCard
          v-for="(agent, i) in podiumAgents"
          :key="agent.id"
          :agent="agent"
          :rank="i + 1"
          :is-favorite="exploreStore.isFavorite(agent.id)"
          @click="openModal(agent)"
        />
      </div>
      <div
        v-if="fourthRankedAgent"
        class="ranking-more lively-card mb-4"
        @click="openModal(fourthRankedAgent)"
      >
        <span class="rank-badge">4</span>
        <div :class="['agent-icon', `agent-icon--${fourthRankedAgent.colorKey}`]">
          <i class="material-symbols-outlined">{{ fourthRankedAgent.icon }}</i>
        </div>
        <span class="ranking-more-name">{{ fourthRankedAgent.name }}</span>
        <span class="ranking-more-desc">{{ fourthRankedAgent.painPoint }}</span>
      </div>

      <!-- 個人化推薦 -->
      <div class="recs-box">
        <div class="recs-header">
          <div class="recs-avatar">L</div>
          <span class="recs-title">Lucas，根據你最近使用的 Agent 精選給你</span>
        </div>
        <div class="recs-chips">
          <span
            v-for="chip in chipCategories"
            :key="chip"
            :class="['recs-chip', { active: activeChip === chip }]"
            @click="activeChip = chip"
          >{{ chip }}</span>
        </div>
        <div class="recs-grid lively-stagger">
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.id"
            class="rec-card lively-card"
            @click="openModal(agent)"
          >
            <div class="rec-icon">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
            </div>
            <div class="rec-card-top">
              <span class="rec-card-name">{{ agent.name }}</span>
              <span v-if="agent.badge" class="rec-card-tag">
                {{ agent.badge.label }}
              </span>
            </div>
            <p class="rec-card-desc">{{ agent.painPoint }}</p>
          </div>
        </div>
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
          @keydown.enter="onSkillSearchEnter"
        />
      </div>

      <!-- 功能類型 chip -->
      <div class="recs-chips mb-4">
        <span
          v-for="chip in skillFunctionTypeChips"
          :key="chip"
          :class="['recs-chip', { active: activeSkillChip === chip }]"
          @click="activeSkillChip = chip"
        >{{ chip }}</span>
      </div>

      <div class="section-header">
        <h3>熱門技能</h3>
      </div>
      <div v-if="!filteredExploreSkills.length" class="explore-empty-state">找不到符合條件的技能</div>
      <div v-else class="skill-grid lively-stagger">
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
import type { Skill, SkillFunctionType } from '@/stores/skillStore'
import AgentCard from '@/components/Explore/AgentCard.vue'
import ExploreSkillCard from '@/components/Explore/ExploreSkillCard.vue'
import AgentDetailModal from '@/components/Explore/AgentDetailModal.vue'
import SkillDetailModal from '@/components/Explore/SkillDetailModal.vue'
import AssignSkillToAgentModal from '@/components/Explore/AssignSkillToAgentModal.vue'
import popDialog from '@/services/popDialog'

const rootStore = useRootStore()
const { isEnterAppSearchPage } = storeToRefs(rootStore)

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const activeExploreTab = ref<'agent' | 'skill'>('agent')

// 搜尋
const searchKeyword = ref('')
function onSearchEnter() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  const result = exploreStore.agents.filter(a =>
    a.name.includes(kw) || a.tags.some(t => t.includes(kw))
  )
  if (result.length) {
    openModal(result[0])
  } else {
    popDialog.toast('找不到相關 Agent')
  }
}

function showToast(msg: string) {
  popDialog.toast(msg)
}

// 熱門 Agent（頒獎台前 3 名 + 第 4 名次要列，同一份排名資料，不再重複另外呈現一次）
const rankingAgents = computed(() =>
  exploreStore.agents.filter(a => ['內容創作者', '社群管理', '專案管理', '顧客服務管理'].includes(a.name))
)
const podiumAgents = computed(() => rankingAgents.value.slice(0, 3))
const fourthRankedAgent = computed(() => rankingAgents.value[3])

// 個人化推薦
const chipCategories = ['全部', '報表分析', '會議準備', '文件撰寫', '財務管理', '人資行政', '設計輔助', '客服分析']
const activeChip = ref('全部')

const filteredRecsAgents = computed(() =>
  exploreStore.agents.filter(a => a.categories.includes(activeChip.value)).slice(0, 6)
)

// Featured hero agent
const featuredAgent = computed(() => exploreStore.agents.find(a => a.name === '內容創作者')!)

// Agent 詳情 Modal
const isModalOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

function openModal(agent: Agent) {
  selectedAgent.value = agent
  isModalOpen.value = true
}

// Skill 探索：資料源改接真正的 skillStore，只列出非個人草稿、目前啟用中的技能
const skillFunctionTypeChips: ('全部' | SkillFunctionType)[] = ['全部', '文字生成', '資料查詢', '流程自動化', '分析報表', '溝通協作']
const activeSkillChip = ref<'全部' | SkillFunctionType>('全部')
const skillSearchKeyword = ref('')

const publicSkills = computed(() =>
  skillStore.skills.filter(s => s.zone !== 'personal' && s.isEnabled)
)

const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    (activeSkillChip.value === '全部' || s.functionType === activeSkillChip.value) &&
    (!skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim()))
  )
)

function onSkillSearchEnter() {
  const kw = skillSearchKeyword.value.trim()
  if (!kw) return
  if (!filteredExploreSkills.value.length) popDialog.toast('找不到相關技能')
}

const isSkillModalOpen = ref(false)
const selectedSkill = ref<Skill | null>(null)

function openSkillModal(skill: Skill) {
  selectedSkill.value = skill
  isSkillModalOpen.value = true
}

const isAssignModalOpen = ref(false)
</script>
