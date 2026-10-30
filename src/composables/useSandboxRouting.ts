import { ref, computed } from 'vue'
import { useSkillStore, AVAILABLE_AGENTS } from '@/stores/skillStore'
import type { Skill, SkillVersion } from '@/stores/skillStore'

// 全系統對話測試沙盒的模擬路由（假大腦 useSandboxBrain 用它決定分工）：使用者面對的是
// 「所有 Agent＋所有已啟用技能」，不是預先鎖定一顆技能。每則訊息在技能池裡比對內容相似度，
// 決定由哪個 Agent 接手、觸發哪顆技能。相似度只用來排序，不顯示在畫面上。
//
// 「包含草稿」開關：關＝只有已啟用技能的生效版本（等同正式環境）；
// 開＝草稿也一起進池子，看它們上線後會不會被觸發、會不會搶走別人：
//   - 有草稿／審核中版本的技能，改用最新那個版本取代生效版本
//   - 還沒啟用的個人技能、建立中的草稿也加入
// 開關只影響這個 composable 的狀態，不會寫回 store。

export interface RoutingCandidate {
  skillId: string
  name: string
  versionName: string
  agent: string
  score: number
  matchedTerms: string[]
  isDraft: boolean
  // 技能描述與覆蓋能力：假大腦拿結果回頭解釋「為什麼」時引用
  description: string
  capabilities: string[]
  hasAssignedAgent: boolean
}

export interface RoutingTrace {
  agent: string
  triggered: RoutingCandidate | null
}

// 分數低於這個值視為「沒有任何技能符合」，由通用助理直接回覆
const TRIGGER_MIN_SCORE = 1

// 口語常見、對判斷技能沒有鑑別度的雙字詞，不算進相似度（不然「怎麼」「一下」到處都會中）
const STOP_BIGRAMS = new Set(['幫我', '一下', '怎麼', '如何', '什麼', '可以', '這個', '這週', '今天', '我們', '你們', '一個'])
// 含這些虛字的雙字詞（例如「週的」「好了」）也不算，同樣沒有鑑別度
const FILLER_CHARS = /[的了嗎呢吧啊喔和與及或]/
export const FALLBACK_AGENT = '通用助理'

const DEFAULT_PROMPTS = [
  '幫我整理這週的業績週報',
  '客戶想退貨，該怎麼回覆？',
  '查一下 A 倉的庫存',
  '把昨天的會議重點摘要一下',
  '今天天氣如何？',
]

interface PoolEntry {
  skill: Pick<Skill, 'id' | 'name' | 'description' | 'capabilities' | 'keywords' | 'assignedAgents'>
  versionName: string
  text: string
  isDraft: boolean
}

function matchedBigrams(message: string, text: string): string[] {
  const grams = new Set<string>()
  for (let i = 0; i < text.length - 1; i++) grams.add(text.slice(i, i + 2))
  const hits: string[] = []
  for (let i = 0; i < message.length - 1; i++) {
    const g = message.slice(i, i + 2)
    if (grams.has(g) && /^[\p{L}\p{N}]{2}$/u.test(g) && !STOP_BIGRAMS.has(g) && !FILLER_CHARS.test(g) && !hits.includes(g)) hits.push(g)
  }
  return hits
}

function skillText(s: Pick<Skill, 'name' | 'description' | 'capabilities' | 'keywords'>): string {
  return [s.name, s.description ?? '', ...(s.capabilities ?? []), ...(s.keywords ?? [])].join(' ')
}

// 技能最新的草稿／審核中版本（versions 依建立順序排，取最後一個）
function latestDraftVersion(skill: Skill): SkillVersion | undefined {
  return [...(skill.versions ?? [])].reverse().find(v => v.status === 'draft' || v.status === 'reviewing')
}

export function useSandboxRouting() {
  const store = useSkillStore()

  const includeDrafts = ref(false)

  // 個人＋Library，同 id 只留一筆
  const allSkills = computed<Skill[]>(() => {
    const seen = new Set<string>()
    const result: Skill[] = []
    for (const s of [...store.myPersonalSkills, ...store.flatSkills]) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      result.push(s)
    }
    return result
  })

  // 個人技能沒有版本概念，版本名稱一律留空（畫面上就不會顯示版號）
  const personalIds = computed(() => new Set(store.myPersonalSkills.map(s => s.id)))
  function versionLabel(s: Skill): string {
    return personalIds.value.has(s.id) ? '' : store.getDefaultVersionName(s.id) ?? s.version
  }

  const liveEntries = computed<PoolEntry[]>(() =>
    allSkills.value
      .filter(s => s.isEnabled)
      .map(s => ({
        skill: s,
        versionName: versionLabel(s),
        text: skillText(s),
        isDraft: false,
      }))
  )

  const draftEntries = computed<PoolEntry[]>(() => {
    const entries: PoolEntry[] = []
    for (const s of allSkills.value) {
      const v = latestDraftVersion(s)
      if (v) {
        const merged = { ...s, name: v.name, description: v.description, capabilities: v.capabilities ?? s.capabilities }
        entries.push({ skill: merged, versionName: personalIds.value.has(s.id) ? '' : v.versionName, text: skillText(merged), isDraft: true })
      } else if (!s.isEnabled && personalIds.value.has(s.id)) {
        entries.push({ skill: s, versionName: '', text: skillText(s), isDraft: true })
      }
    }
    for (const d of store.myDrafts) {
      entries.push({ skill: { ...d }, versionName: '', text: skillText(d), isDraft: true })
    }
    return entries
  })

  const pool = computed<PoolEntry[]>(() => {
    if (!includeDrafts.value) return liveEntries.value
    // 同一顆技能有草稿版本時，草稿取代生效版本
    const draftIds = new Set(draftEntries.value.map(e => e.skill.id))
    return [...liveEntries.value.filter(e => !draftIds.has(e.skill.id)), ...draftEntries.value]
  })

  const agentCount = AVAILABLE_AGENTS.length
  const liveSkillCount = computed(() => liveEntries.value.length)
  const draftCount = computed(() => draftEntries.value.length)
  const suggestedPrompts = DEFAULT_PROMPTS

  // agents：限定參與分工的 Agent（使用者在沙盒選）。只有這些 Agent 調用得到的技能才進得了
  // 候選；還沒指派 Agent 的技能算在通用助理身上。沒傳＝所有 Agent 都參與
  function route(message: string, agents?: readonly string[]): RoutingTrace {
    const callersOf = (e: PoolEntry) => e.skill.assignedAgents?.length ? e.skill.assignedAgents : [FALLBACK_AGENT]
    const scored: RoutingCandidate[] = pool.value
      .filter(e => !agents || callersOf(e).some(a => agents.includes(a)))
      .map(e => {
        const terms = matchedBigrams(message, e.text)
        return {
          skillId: e.skill.id,
          name: e.skill.name,
          versionName: e.versionName,
          agent: callersOf(e).find(a => !agents || agents.includes(a)) ?? FALLBACK_AGENT,
          score: terms.length,
          matchedTerms: terms.slice(0, 4),
          isDraft: e.isDraft,
          description: e.skill.description ?? '',
          capabilities: e.skill.capabilities ?? [],
          hasAssignedAgent: !!e.skill.assignedAgents?.length,
        }
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)

    const top = scored[0] && scored[0].score >= TRIGGER_MIN_SCORE ? scored[0] : null
    // 沒有技能符合：通用助理有參與就由它回，沒有就交給第一個參與的 Agent
    const idleAgent = !agents || agents.includes(FALLBACK_AGENT) ? FALLBACK_AGENT : agents[0] ?? FALLBACK_AGENT
    return { agent: top?.agent ?? idleAgent, triggered: top }
  }

  return {
    includeDrafts,
    agentCount,
    liveSkillCount,
    draftCount,
    suggestedPrompts,
    route,
  }
}
