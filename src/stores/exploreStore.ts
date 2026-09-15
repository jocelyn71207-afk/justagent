import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SkillFunctionType } from '@/stores/skillStore'

export type ColorKey = 'violet' | 'blue' | 'amber' | 'teal' | 'green' | 'rust' | 'rose'

export interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

export interface Agent {
  id: string
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

const AGENTS: Agent[] = [
  {
    id: 'agent-content-creator',
    name: '內容創作者',
    desc: '撰寫高品質的文章與多媒體內容，精準策略角度，吸引目標受眾，增強社交媒體互動。',
    painPoint: '還在對著空白文件發呆，不知道從何下筆？',
    icon: 'edit_note',
    colorKey: 'violet',
    tags: ['內容', '創作', '社群', '行銷'],
    categories: ['全部', '文件撰寫'],
  },
  {
    id: 'agent-social-media',
    name: '社群管理',
    desc: '管理各平台社群，增進用戶互動，制定策略以提升用戶忠誠度和品牌影響力。',
    painPoint: '每天要顧好幾個社群帳號，回覆訊息回到分身乏術？',
    icon: 'group',
    colorKey: 'teal',
    tags: ['社群', '行銷', '策略', '互動'],
    categories: ['全部'],
  },
  {
    id: 'agent-project-mgmt',
    name: '專案管理',
    desc: '從規劃到執行，確保資源最佳配置和時程有效利用。',
    painPoint: '專案時程一多，資源分配跟進度追蹤就開始亂？',
    icon: 'task_alt',
    colorKey: 'amber',
    tags: ['專案', '管理', '規劃', '執行'],
    categories: ['全部', '會議準備'],
  },
  {
    id: 'agent-finance-analyst',
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
    id: 'agent-seo-expert',
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
    id: 'agent-customer-service',
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
    id: 'agent-bookkeeping',
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
    id: 'agent-hr-admin',
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
    id: 'agent-design',
    name: '設計助理',
    desc: '協助創建視覺素材，提供設計建議與排版指引，提升品牌視覺一致性。',
    painPoint: '想要的視覺效果說不清楚，設計來回改版改到懷疑人生？',
    icon: 'palette',
    colorKey: 'rose',
    tags: ['設計', '素材', '視覺', '排版'],
    categories: ['全部', '設計輔助'],
  },
  {
    id: 'agent-meeting-recorder',
    name: '會議記錄員',
    desc: '自動整理會議記錄，摘要關鍵決議與行動項目，確保團隊決策能落實執行。',
    painPoint: '開完會才發現重點都忘了，行動項目沒人跟進？',
    icon: 'mic',
    colorKey: 'violet',
    tags: ['會議', '記錄', '摘要', '行動'],
    categories: ['全部', '會議準備'],
  },
]

// Skill 探索卡片視覺（icon/colorKey）：真正的 skillStore.Skill 型別沒有這兩個展示用欄位，
// 依 functionType 對應固定的 icon/colorKey；沒有 functionType 的技能 fallback 成中性樣式
const FUNCTION_TYPE_VISUAL: Record<SkillFunctionType, { icon: string; colorKey: ColorKey }> = {
  '文字生成': { icon: 'summarize', colorKey: 'violet' },
  '資料查詢': { icon: 'travel_explore', colorKey: 'teal' },
  '流程自動化': { icon: 'sync_alt', colorKey: 'blue' },
  '分析報表': { icon: 'bar_chart', colorKey: 'amber' },
  '溝通協作': { icon: 'forum', colorKey: 'green' },
}

const DEFAULT_SKILL_VISUAL: { icon: string; colorKey: ColorKey } = { icon: 'psychology', colorKey: 'rose' }

export function getSkillVisual(functionType?: SkillFunctionType): { icon: string; colorKey: ColorKey } {
  if (!functionType) return DEFAULT_SKILL_VISUAL
  return FUNCTION_TYPE_VISUAL[functionType] ?? DEFAULT_SKILL_VISUAL
}

const FAVORITES_STORAGE_KEY = 'explore.favoriteAgentIds'

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage 不可用（無痕模式等）時，僅維持記憶體內狀態，不拋錯
  }
}

export const useExploreStore = defineStore('exploreStore', () => {
  const agents = ref<Agent[]>(AGENTS)
  const favoriteAgentIds = ref<string[]>(loadFavoriteIds())

  function isFavorite(agentId: string): boolean {
    return favoriteAgentIds.value.includes(agentId)
  }

  function toggleFavorite(agentId: string): void {
    const idx = favoriteAgentIds.value.indexOf(agentId)
    if (idx >= 0) {
      favoriteAgentIds.value.splice(idx, 1)
    } else {
      favoriteAgentIds.value.push(agentId)
    }
    saveFavoriteIds(favoriteAgentIds.value)
  }

  return { agents, favoriteAgentIds, isFavorite, toggleFavorite }
})
