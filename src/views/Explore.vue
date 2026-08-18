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

      <!-- 使用熱度榜 -->
      <div class="section-header">
        <h3>使用熱度榜</h3>
        <span class="see-all" @click="showToast('查看全部熱度')">查看全部</span>
      </div>
      <div class="ranking-podium lively-stagger mb-3">
        <div
          v-for="(agent, i) in podiumAgents"
          :key="agent.name"
          :class="['podium-card', 'lively-card', `podium-card--rank-${i + 1}`]"
          @click="openModal(agent)"
        >
          <div class="rank-badge">{{ i + 1 }}</div>
          <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
            <i class="material-symbols-outlined">{{ agent.icon }}</i>
          </div>
          <h4>{{ agent.name }}</h4>
          <p>{{ agent.painPoint }}</p>
        </div>
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

      <!-- 大家都在用 -->
      <div class="section-header">
        <h3>大家都在用</h3>
        <span class="see-all" @click="showToast('查看全部熱門')">查看全部</span>
      </div>
      <div class="agent-grid agent-grid--4 lively-stagger mb-5">
        <div
          v-for="agent in popularAgents"
          :key="agent.name"
          class="agent-card lively-card"
          @click="openModal(agent)"
        >
          <span v-if="agent.badge" :class="['agent-badge', `agent-badge--${agent.badge.type}`]">
            {{ agent.badge.label }}
          </span>
          <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
            <i class="material-symbols-outlined">{{ agent.icon }}</i>
          </div>
          <h4>{{ agent.name }}</h4>
          <p>{{ agent.painPoint }}</p>
        </div>
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
            :key="agent.name"
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

    </div>
  </div>

  <!-- Agent 詳情 Modal -->
  <compModal
    v-model="isModalOpen"
    :title="selectedAgent?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="selectedAgent">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div :class="['explore-modal-icon', `agent-icon--${selectedAgent.colorKey}`]">
            <i class="material-symbols-outlined">{{ selectedAgent.icon }}</i>
          </div>
          <p class="explore-modal-painpoint">{{ selectedAgent.painPoint }}</p>
          <p class="explore-modal-desc">{{ selectedAgent.desc }}</p>
          <div class="explore-modal-tags">
            <span v-for="tag in selectedAgent.tags" :key="tag" class="explore-modal-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="useAgent">立即使用此 Agent</button>
        <button class="custom-btn" @click="isModalOpen = false">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRootStore } from '@/stores/rootStore'
import compModal from '@/components/compModal/compModal.vue'
import popDialog from '@/services/popDialog'

const rootStore = useRootStore()
const { isEnterAppSearchPage } = storeToRefs(rootStore)

const activeExploreTab = ref<'agent' | 'skill'>('agent')

// 搜尋
const searchKeyword = ref('')
function onSearchEnter() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  const result = allAgents.filter(a =>
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

// Agent 型別
interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

// colorKey 對應 src/scss/base/_theme.scss 裡的 --tag-*-bg/text token（light/dark 都有定義），
// 不再用每個 agent 各自寫死的 hex 顏色（那組顏色在深色模式下不會跟著換色）
type ColorKey = 'violet' | 'blue' | 'amber' | 'teal' | 'green' | 'rust' | 'rose'

interface Agent {
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

const allAgents: Agent[] = [
  {
    name: '內容創作者',
    desc: '撰寫高品質的文章與多媒體內容，精準策略角度，吸引目標受眾，增強社交媒體互動。',
    painPoint: '還在對著空白文件發呆，不知道從何下筆？',
    icon: 'edit_note',
    colorKey: 'violet',
    tags: ['內容', '創作', '社群', '行銷'],
    categories: ['全部', '文件撰寫'],
  },
  {
    name: '社群管理',
    desc: '管理各平台社群，增進用戶互動，制定策略以提升用戶忠誠度和品牌影響力。',
    painPoint: '每天要顧好幾個社群帳號，回覆訊息回到分身乏術？',
    icon: 'group',
    colorKey: 'teal',
    tags: ['社群', '行銷', '策略', '互動'],
    categories: ['全部'],
  },
  {
    name: '專案管理',
    desc: '從規劃到執行，確保資源最佳配置和時程有效利用。',
    painPoint: '專案時程一多，資源分配跟進度追蹤就開始亂？',
    icon: 'task_alt',
    colorKey: 'amber',
    tags: ['專案', '管理', '規劃', '執行'],
    categories: ['全部', '會議準備'],
  },
  {
    name: '財務分析師',
    desc: '分析公司財務數據，制定預算與報告，提供可行建議以支持企業經營目標。',
    painPoint: '一堆報表數字擺在眼前，卻看不出關鍵趨勢？',
    icon: 'bar_chart',
    colorKey: 'blue',
    tags: ['財務', '分析', '預算', '報告'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部', '報表分析', '財務管理'],
  },
  {
    name: 'SEO 專家',
    desc: '優化網站內容與結構，提升搜尋引擎排名，幫助品牌獲得更多自然流量。',
    painPoint: '網站流量怎麼做都上不去，搜尋排名一直卡關？',
    icon: 'travel_explore',
    colorKey: 'green',
    tags: ['SEO', '優化', '搜尋', '流量'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部'],
  },
  {
    name: '顧客服務管理',
    desc: '提升客戶整體滿意度，解決客戶問題並收集回饋，提升服務品質與客戶忠誠度。',
    painPoint: '客訴訊息一多，回覆速度跟服務品質很難兼顧？',
    icon: 'support_agent',
    colorKey: 'rust',
    tags: ['客服', '滿意度', '回饋', '忠誠'],
    badge: { type: 'sat', label: '高滿意度' },
    categories: ['全部', '客服分析'],
  },
  {
    name: '記帳助理',
    desc: '帳務整理、報帳核對與簡單財務報表製作，確保每筆費用都有跡可循。',
    painPoint: '帳務單據一多就對不上，報帳核銷永遠卡在對帳？',
    icon: 'receipt_long',
    colorKey: 'teal',
    tags: ['帳務', '報表', '財務', '核對'],
    badge: { type: 'sat', label: '高滿意度' },
    categories: ['全部', '報表分析', '財務管理'],
  },
  {
    name: '人資行政助理',
    desc: '快速產出職位說明、履歷篩選建議與面試準備，將複雜 HR 行政工作自動化。',
    painPoint: '職缺說明跟履歷篩選佔掉大半天，招募進度卻停滯不前？',
    icon: 'badge',
    colorKey: 'green',
    tags: ['HR', '招募', '行政', '人才'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部', '人資行政'],
  },
  {
    name: '設計助理',
    desc: '協助創建視覺素材，提供設計建議與排版指引，提升品牌視覺一致性。',
    painPoint: '想要的視覺效果說不清楚，設計來回改版改到懷疑人生？',
    icon: 'palette',
    colorKey: 'rose',
    tags: ['設計', '素材', '視覺', '排版'],
    categories: ['全部', '設計輔助'],
  },
  {
    name: '會議記錄員',
    desc: '自動整理會議記錄，摘要關鍵決議與行動項目，確保團隊決策能落實執行。',
    painPoint: '開完會才發現重點都忘了，行動項目沒人跟進？',
    icon: 'mic',
    colorKey: 'violet',
    tags: ['會議', '記錄', '摘要', '行動'],
    categories: ['全部', '會議準備'],
  },
]

// 使用熱度榜（前 4）
const rankingAgents = computed(() =>
  allAgents.filter(a => ['內容創作者', '社群管理', '專案管理', '顧客服務管理'].includes(a.name))
)

// 熱度榜頒獎台：前 3 名進頒獎台，第 4 名移到下方次要列
const podiumAgents = computed(() => rankingAgents.value.slice(0, 3))
const fourthRankedAgent = computed(() => rankingAgents.value[3])

// 大家都在用（有 badge 的 + 熱門）
const popularAgents = computed(() =>
  allAgents.filter(a => ['財務分析師', '內容創作者', 'SEO 專家', '顧客服務管理'].includes(a.name))
)

// 個人化推薦
const chipCategories = ['全部', '報表分析', '會議準備', '文件撰寫', '財務管理', '人資行政', '設計輔助', '客服分析']
const activeChip = ref('全部')

const filteredRecsAgents = computed(() =>
  allAgents.filter(a => a.categories.includes(activeChip.value)).slice(0, 6)
)

// Featured hero agent
const featuredAgent = allAgents.find(a => a.name === '內容創作者')!

// Modal
const isModalOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

function openModal(agent: Agent) {
  selectedAgent.value = agent
  isModalOpen.value = true
}

function useAgent() {
  popDialog.toast(`已啟動 Agent，正在前往工作區`)
  isModalOpen.value = false
}
</script>
