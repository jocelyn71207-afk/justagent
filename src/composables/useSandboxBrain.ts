import { ref, computed } from 'vue'
import { useSandboxRouting, FALLBACK_AGENT } from '@/composables/useSandboxRouting'
import { AVAILABLE_AGENTS } from '@/stores/skillStore'
import type { RoutingCandidate } from '@/composables/useSandboxRouting'

// 技能測試沙盒 4 版：用一顆「假大腦」測試判斷分工——使用者發話後，AI大腦先決定交給哪個
// Agent、調用哪顆技能（結果），再拿這個結果回頭問大腦「為什麼這樣分」（原因）。
// 畫面只呈現結果跟原因，不給分數、也不列沒被選上的候選。
//
// 分工本身沿用 useSandboxRouting 的模擬路由（技能池、包含草稿開關都一樣），
// 只是原因改由大腦用自然語言講，不再是「相似度幾分、分數最高」。
// 參與分工的 Agent 由使用者選（至少一個），大腦只會把工作分給這些 Agent。
// 對話一開始就鎖定：同一段對話中途換 Agent，前後的分工結果就不是同一組條件下測的，
// 要換 Agent 得先重置對話。

export interface BrainDecision {
  agent: string
  skill: Pick<RoutingCandidate, 'skillId' | 'name' | 'versionName' | 'isDraft'> | null
  // 空字串＝結果出來了、還在問大腦原因
  reason: string
}

export interface BrainMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  decision?: BrainDecision
}

export type BrainPhase = 'idle' | 'routing' | 'explaining'

const ROUTING_DELAY_MS = 700
const EXPLAIN_DELAY_MS = 600

// 口語開頭／結尾的客套與語助詞拿掉，留下使用者真正要做的事，大腦講原因時引用
function extractIntent(message: string): string {
  return message
    .trim()
    .replace(/^(請|麻煩|可以|能不能|幫忙|幫我|請幫我|麻煩幫我)+/, '')
    .replace(/[？?。！!～~，,\s]+$/, '')
    .replace(/(嗎|呢|吧)$/, '')
}

function skillScope(c: RoutingCandidate): string {
  const desc = c.description.trim().replace(/[。.]$/, '')
  if (desc) return `（${desc}）`
  if (c.capabilities.length) return `（涵蓋${c.capabilities.slice(0, 3).join('、')}）`
  return ''
}

// 假大腦：拿分工結果回頭解釋原因。只講「使用者要做什麼 → 這是哪顆技能的範圍 → 交給誰」，
// 不提分數與其他候選
// missed：所有 Agent 都參與時會觸發、但這次因為能調用它的 Agent 沒被選而沒分到的技能——
// 測分工時這正是要看出來的情況，不能講成「沒有技能對得上」
export function explainDecision(
  message: string,
  triggered: RoutingCandidate | null,
  agent: string,
  missed: RoutingCandidate | null = null,
): string {
  const intent = extractIntent(message) || message.trim()
  if (!triggered && missed) {
    return `使用者想「${intent}」，這原本是「${missed.name}」負責的範圍，`
      + `但能調用它的「${missed.agent}」這次沒有參與分工，所以不調用技能，由「${agent}」直接回覆。`
  }
  if (!triggered) {
    return `使用者想「${intent}」，跟目前所有技能負責的工作都對不上，不需要調用技能，由「${agent}」直接回覆。`
  }
  const lines = [`使用者想「${intent}」，這是「${triggered.name}」負責的範圍${skillScope(triggered)}。`]
  lines.push(triggered.hasAssignedAgent
    ? `所以交給負責這顆技能的「${agent}」，由它調用「${triggered.name}」處理。`
    : `「${triggered.name}」目前還沒有指派 Agent，先交給「${FALLBACK_AGENT}」代為調用。`)
  if (triggered.isDraft) lines.push('目前調用的是草稿版本，正式上線後的分工可能不同。')
  return lines.join('')
}

export function useSandboxBrain() {
  const routing = useSandboxRouting()

  const messages = ref<BrainMessage[]>([])
  const phase = ref<BrainPhase>('idle')
  const selectedAgents = ref<string[]>([])
  const canSend = computed(() => selectedAgents.value.length > 0 && phase.value === 'idle')
  const agentsLocked = computed(() => messages.value.length > 0 || phase.value !== 'idle')

  function toggleAgent(agent: string) {
    if (agentsLocked.value) return
    const i = selectedAgents.value.indexOf(agent)
    if (i === -1) selectedAgents.value = [...selectedAgents.value, agent]
    else selectedAgents.value = selectedAgents.value.filter(a => a !== agent)
  }

  async function send(text: string): Promise<void> {
    const message = text.trim()
    if (!message || !canSend.value) return
    messages.value.push({ id: `br-${Date.now()}`, role: 'user', content: message })

    // ① 大腦判斷分工：決定 Agent 與技能
    phase.value = 'routing'
    await new Promise(r => setTimeout(r, ROUTING_DELAY_MS))
    const trace = routing.route(message, [...selectedAgents.value])
    // 不限 Agent 時會分到哪：用來在原因裡指出「其實有技能，只是負責的 Agent 沒選」
    const unrestricted = trace.triggered ? null : routing.route(message).triggered
    const t = trace.triggered
    const reply: BrainMessage = {
      id: `br-${Date.now() + 1}`,
      role: 'agent',
      content: t
        ? `（Mock）已調用「${t.name}」處理：「${message}」，正在產生結果...`
        : `（Mock）沒有符合的技能，直接以一般對話回覆：「${message}」`,
      decision: {
        agent: trace.agent,
        skill: t ? { skillId: t.skillId, name: t.name, versionName: t.versionName, isDraft: t.isDraft } : null,
        reason: '',
      },
    }
    messages.value.push(reply)

    // ② 拿結果回頭問大腦原因
    phase.value = 'explaining'
    await new Promise(r => setTimeout(r, EXPLAIN_DELAY_MS))
    const last = messages.value[messages.value.length - 1]
    if (last?.id === reply.id && last.decision) last.decision.reason = explainDecision(message, t, trace.agent, unrestricted)
    phase.value = 'idle'
  }

  function reset(): void {
    if (phase.value !== 'idle') return
    messages.value = []
  }

  return {
    messages,
    phase,
    availableAgents: AVAILABLE_AGENTS,
    selectedAgents,
    canSend,
    agentsLocked,
    toggleAgent,
    includeDrafts: routing.includeDrafts,
    agentCount: routing.agentCount,
    liveSkillCount: routing.liveSkillCount,
    draftCount: routing.draftCount,
    suggestedPrompts: routing.suggestedPrompts,
    send,
    reset,
  }
}
