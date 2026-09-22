import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { ChatMessage, Skill, SkillCapability, SkillFile } from '@/stores/skillStore'
export type { Skill }
import { REPORT_CATEGORIES, SECTION_MAP } from '@/constants/reportSections'

// AI 賦能（SkillStudio）的對話狀態與規則式 mock 回覆。
// 這裡是頁面唯一的狀態來源：左側對話、右側預覽都只讀這裡的 draft／messages。

export type StudioMode = 'create' | 'edit'
export type StudioMethod = 'chat' | 'blocks'

export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
  method: StudioMethod | null   // null = 尚未選擇建立方式
  sectionIds: string[]          // 積木方式的已選章節（依序）
}

export interface StudioAction { id: string; label: string }
export interface StudioMessage extends ChatMessage { actions?: StudioAction[] }
export interface StudioReply { content: string; patch?: Partial<SkillDraft>; actions?: StudioAction[] }
export interface StudioSuggestion { icon: string; label: string; prefill: string }

// block 存放／還原用的可序列化快照
export interface StudioSnapshot {
  mode: StudioMode
  savedSkillId: string | null
  draft: SkillDraft
  messages: StudioMessage[]
}

export const DEFAULT_OPENING_MESSAGE = '你好，我是技能建立助理。描述你想讓 Agent 幫你做什麼，我會先擬一版設定放在右側。'
const GATE_OPENING_MESSAGE = '你好，我是這裡的助理。想記一個新做法、調整既有的，還是有其他問題，都可以直接跟我說。'

export function emptyDraft(): SkillDraft {
  return { name: '', description: '', instructions: '', triggerHint: '', capabilities: [], files: [], method: null, sectionIds: [] }
}

// ── 意圖判斷與關卡分流（AI 賦能「用對話建立」路徑，接在既有解析規則之前）──

export type GateStage =
  | 'intent'        // 每則新訊息的預設起點：判斷意圖
  | 'gate0'         // 太模糊，先問「記技能還是單純問事情」
  | 'gate1'         // 問「照規定 / 改規定 / 記新的」
  | 'checkingRules' // 內部過渡態：查 myPersonalSkills 有沒有相近做法。
                     // 注意：實作上這一步在同一輪訊息處理裡就會算完轉下一關，
                     // gateStage.value 實際上不會被指定成這個值，純粹型別上列出來說明流程
  | 'gate2'         // 找到相近做法，問「沿用 / 改他 / 另開一份 / 講別的」
  | 'clarify'       // 多輪問答補齊草稿內容（沿用既有 interpretStudioMessage 的抽取規則）
  | 'gate3'         // 最終確認「內容如下…這樣可以嗎？」
  | 'active'        // 分流完畢，既有的 interpretStudioMessage 接手

// 「我要講別的」時的暫存快照：只存在單次連線的記憶體內（一個 ref），
// 不寫入 skillStore、離開頁面或重新整理就消失，跟 skillStore 既有的
// myDrafts／DraftSkill（Library／企業技能送審草稿）完全無關
export interface PausedDraft {
  gateStage: GateStage
  messages: StudioMessage[]
  draft: SkillDraft
  pendingSimilarSkillId: string | null
}

const BUILD_INTENT_VERBS = /教|建立|新增|修改|更新|記錄|記一個|記成|固定|流程|SOP/
const BUILD_INTENT_NOUNS = /技能|skill|規定|做法/i

// 規則式關鍵字比對，不是真語意理解，跟 interpretStudioMessage 的既有風格一致
export function classifyIntent(text: string): 'build' | 'general' | 'ambiguous' {
  const hasVerb = BUILD_INTENT_VERBS.test(text)
  const hasNoun = BUILD_INTENT_NOUNS.test(text)
  if (hasVerb && hasNoun) return 'build'
  if (text.trim().length <= 20 && (hasNoun || /[？?]/.test(text))) return 'general'
  return 'ambiguous'
}

// 規則式比對使用者描述跟既有個人技能的 name／triggerHint／instructions 有沒有重疊，
// 回傳重疊分數最高的那一顆；沒有重疊回傳 null。
//
// 用「連續中文字元」切詞（/[一-龥]{2,}/）在這裡行不通：使用者一句話通常是一整串
// 中文、中間沒有空格或標點斷開（例如「我要處理銷售報告的事情」），regex 會把整句話
// 貪婪比對成單一一個「詞」，永遠不可能完整出現在技能名稱／說明這種短很多的字串裡，
// 等於這個函式永遠回傳 null。改用「二字滑動窗」（character bigram）算重疊比例，
// 不需要真的中文斷詞也能抓出「兩段文字有沒有提到同樣的詞彙」，是這類輕量比對常見的做法。
export function findSimilarSkill(text: string, skills: Skill[]): Skill | null {
  const t = text.trim()
  if (t.length < 2) return null
  const textGrams = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) textGrams.add(t.slice(i, i + 2))
  let best: { skill: Skill; score: number } | null = null
  for (const skill of skills) {
    const haystack = `${skill.name}${skill.triggerHint ?? ''}${skill.instructions ?? ''}`
    let score = 0
    for (let i = 0; i < haystack.length - 1; i++) {
      if (textGrams.has(haystack.slice(i, i + 2))) score++
    }
    if (score > 0 && (!best || score > best.score)) best = { skill, score }
  }
  return best?.skill ?? null
}

const RESUME_HINTS = /繼續|剛才|接著|接續|回到|上次那個/

// 是否要接回被「我要講別的」中斷的草稿：訊息裡有接續關鍵字，或直接提到暫存草稿的名稱
export function wantsToResume(text: string, paused: PausedDraft): boolean {
  return RESUME_HINTS.test(text) || (!!paused.draft.name && text.includes(paused.draft.name))
}

// 關卡三要顯示的草稿內容摘要
export function formatDraftSummary(draft: SkillDraft): string {
  const lines = [
    `名稱：${draft.name || '（未命名）'}`,
    `觸發時機：${draft.triggerHint || '（未設定）'}`,
    `指令：${draft.instructions || '（未撰寫）'}`,
  ]
  if (draft.capabilities.length) {
    lines.push(`覆蓋能力：${draft.capabilities.map(c => c.name).join('、')}`)
  }
  return lines.join('\n')
}

const GATE0_BUILD: StudioAction = { id: 'gate0-build', label: '記技能' }
const GATE0_GENERAL: StudioAction = { id: 'gate0-general', label: '單純問事情' }

const GATE1_NEW: StudioAction = { id: 'gate1-new', label: '記一份新的' }
const GATE1_CUSTOM: StudioAction = { id: 'gate1-custom', label: '改現有規定（走客製路線）' }
const GATE1_FOLLOW: StudioAction = { id: 'gate1-follow', label: '照現有規定' }

const GATE2_FOLLOW: StudioAction = { id: 'gate2-follow', label: '照現有規定做' }
const GATE2_EDIT: StudioAction = { id: 'gate2-edit', label: '改他' }
const GATE2_NEW: StudioAction = { id: 'gate2-new', label: '另外新增一份' }
const GATE2_ELSE: StudioAction = { id: 'gate2-else', label: '我要講別的' }

const GATE3_CONFIRM: StudioAction = { id: 'gate3-confirm', label: '這樣可以，存到個人技能' }
const GATE3_RETRY: StudioAction = { id: 'gate3-retry', label: '不對，我要改' }

const CLARIFY_DONE_HINT = /沒有漏了|寫成做法|可以寫了|這樣就好/

const NOT_IMPLEMENTED_REPLY = '這部分我還在學怎麼幫你直接處理，目前只能先帶你到技能建立/修改的流程。之後會補上「直接套用技能」的功能。'

// 由已儲存的技能還原出一份草稿（loadSkill／hydrate 基準共用，避免兩處各寫一次欄位對應）
export function draftFromSkill(s: Skill): SkillDraft {
  return {
    name: s.name,
    description: s.description ?? '',
    instructions: s.instructions ?? '',
    triggerHint: s.triggerHint ?? '',
    capabilities: (s.capabilities ?? []).map(c => ({ ...c })),
    files: [...(s.files ?? [])],
    method: s.composition ? 'blocks' : 'chat',
    sectionIds: [...(s.composition?.sectionIds ?? [])],
  }
}

// 積木 → 草稿：步驟＝章節依序編號，能力＝章節，觸發條件＝涵蓋到的分類
export function deriveFromSections(sectionIds: string[]): Pick<SkillDraft, 'instructions' | 'triggerHint' | 'capabilities'> {
  const sections = sectionIds.map(id => SECTION_MAP[id]).filter((s): s is NonNullable<typeof s> => !!s)
  if (sections.length === 0) return { instructions: '', triggerHint: '', capabilities: [] }
  const lines = sections.map((s, i) => `${i + 1}. ${s.name}：${s.description}`)
  const catIds = new Set(sections.map(s => s.categoryId))
  const labels = REPORT_CATEGORIES.filter(c => catIds.has(c.id)).map(c => c.label).join('、')
  return {
    instructions: `依序產出以下章節：\n${lines.join('\n')}`,
    triggerHint: `當使用者要求產出行銷報告，或提到「${labels}」相關分析時`,
    capabilities: sections.map(s => ({ name: s.name, description: s.description })),
  }
}

const ACTION_CONFIRM: StudioAction = { id: 'confirm', label: '看起來沒問題，儲存' }
const ACTION_TRIGGER: StudioAction = { id: 'trigger', label: '觸發條件要更精準' }
const ACTION_STEP: StudioAction = { id: 'step', label: '再補一個步驟' }

const CREATE_SUGGESTIONS: StudioSuggestion[] = [
  { icon: 'inventory_2', label: '幫我建立一個能查 ERP 庫存的技能', prefill: '幫我建立一個能查 ERP 庫存的技能' },
  { icon: 'summarize', label: '把每週會議逐字稿整理成週報', prefill: '把每週會議逐字稿整理成週報' },
  { icon: 'description', label: '依部門報告規範自動產出月報', prefill: '依部門報告規範自動產出月報' },
]

// 依技能實際有沒有內容決定動詞（已經有 vs. 還沒有）
function editSuggestions(draft: SkillDraft): StudioSuggestion[] {
  return [
    draft.instructions
      ? { icon: 'terminal', label: '調整技能指令', prefill: '我想調整技能指令，' }
      : { icon: 'terminal', label: '撰寫技能指令', prefill: '幫我撰寫技能指令，' },
    draft.capabilities.length
      ? { icon: 'checklist', label: '調整覆蓋能力', prefill: '我想調整覆蓋能力，' }
      : { icon: 'checklist', label: '新增覆蓋能力', prefill: '幫我新增覆蓋能力，' },
    draft.triggerHint
      ? { icon: 'bolt', label: '調整觸發條件', prefill: '觸發條件改成' }
      : { icon: 'bolt', label: '設定觸發條件', prefill: '觸發條件是' },
  ]
}

const NAME_MAX = 12

export function extractSkillName(text: string): string {
  const t = text.trim()
  if (!t) return '新技能'
  const m = t.match(/(?:建立|幫我做|需要)(.*?)(?:的技能|的 ?Skill|$)/i)
  let picked = m ? m[1] : t.split(/[，。！？、；：,.!?;:]/)[0]
  picked = picked
    .replace(/^(一個|一顆|一份|一套|一支)/, '')
    .replace(/^(能夠|能|可以|會)/, '')
    .trim()
  if (!picked) return '新技能'
  return picked.length > NAME_MAX ? picked.slice(0, NAME_MAX) : picked
}

function countSteps(instructions: string): number {
  return instructions.split('\n').filter(line => /^\d+\.\s/.test(line.trim())).length
}

function stripLead(text: string, lead: RegExp): string {
  return text.replace(lead, '').trim()
}

export function interpretStudioMessage(text: string, draft: SkillDraft, mode: StudioMode): StudioReply {
  const t = text.trim()

  if (t === ACTION_CONFIRM.label) {
    return { content: '請按右側「儲存為個人技能」，儲存後就能在「測試」tab 驗證。' }
  }
  if (t === ACTION_TRIGGER.label) {
    return { content: '好，直接告訴我在什麼情況下要觸發這個技能，例如「觸發條件改成當使用者提到缺貨或補貨時」。' }
  }
  if (t === ACTION_STEP.label) {
    const n = countSteps(draft.instructions) + 1
    return {
      patch: { instructions: `${draft.instructions}\n${n}. 檢查輸出結果，必要時補充說明`.trim() },
      content: `已追加第 ${n} 步。`,
    }
  }

  if (mode === 'create' && !draft.name) {
    const name = extractSkillName(t)
    return {
      patch: {
        name,
        description: t,
        triggerHint: `當使用者提到「${name}」相關需求時`,
        instructions: `1. 釐清使用者的輸入與需求範圍\n2. 執行「${name}」\n3. 依指定格式回覆結果`,
        capabilities: [
          { name, description: t },
          { name: '結果格式化輸出', description: '依指定格式整理並回覆結果' },
        ],
      },
      content: '我先幫你擬了一版設定，右側可以看到。名稱、觸發條件和步驟都可以再跟我說要怎麼調。',
      actions: [ACTION_CONFIRM, ACTION_TRIGGER, ACTION_STEP],
    }
  }

  if (/名稱|改名|叫做|取名|命名/.test(t)) {
    const quoted = t.match(/[「"'『]([^」"'』]+)[」"'』]/)
    const name = quoted?.[1] ?? stripLead(t, /^.*?(叫做|名稱(是|改成|改為)?|改名(成|為)?|取名(為|成)?|命名(為|成)?)/)
    if (name) return { patch: { name }, content: `已把名稱改成「${name}」。` }
  }

  if (t.includes('觸發')) {
    const hint = stripLead(t, /^.*?觸發(條件)?(是|改成|改為|為|要|：|:)?/) || t
    return { patch: { triggerHint: hint }, content: `觸發條件已更新為：${hint}` }
  }

  if (/步驟|加一步|補一步|補充步驟/.test(t)) {
    const n = countSteps(draft.instructions) + 1
    const body = stripLead(t, /^.*?(步驟|加一步|補一步|補充步驟)(：|:|，)?/) || t
    return { patch: { instructions: `${draft.instructions}\n${n}. ${body}`.trim() }, content: `已追加第 ${n} 步。` }
  }

  if (/能力|還能/.test(t)) {
    const body = stripLead(t, /^.*?(能力|還能)(：|:|，)?/) || t
    return {
      patch: { capabilities: [...draft.capabilities, { name: body, description: '' }] },
      content: '已新增一項覆蓋能力。',
    }
  }

  return {
    patch: { instructions: `${draft.instructions}\n\n（依對話更新）${t}`.trim() },
    content: '已根據你的描述更新技能指令，右側可以看到變更。',
  }
}

// method 不算「內容」，故不列入 dirty 比對：它只是建立方式的選擇，只有 startCreate()（整份
// 草稿重置）才會再變，選了方式本身不該讓草稿變成「有未儲存變更」
function serialize(d: SkillDraft): string {
  return JSON.stringify({ ...d, method: undefined, files: d.files.map(f => f.id) })
}

export function useSkillStudioConversation() {
  const store = useSkillStore()

  const mode = ref<StudioMode>('create')
  const savedSkillId = ref<string | null>(null)
  const draft = ref<SkillDraft>(emptyDraft())
  const snapshot = ref(serialize(draft.value))
  const messages = ref<StudioMessage[]>([])
  const isRunning = ref(false)
  let seq = 0

  const gateStage = ref<GateStage>('active')
  const pendingSimilarSkillId = ref<string | null>(null)
  const pausedDraft = ref<PausedDraft | null>(null)
  const lastBuildText = ref('')

  const isDirty = computed(() => serialize(draft.value) !== snapshot.value)
  const canSave = computed(() => !!draft.value.name.trim() && !!draft.value.instructions.trim())
  const suggestionChips = computed<StudioSuggestion[]>(() => {
    if (draft.value.method !== 'chat') return []
    return mode.value === 'create' ? CREATE_SUGGESTIONS : editSuggestions(draft.value)
  })

  function push(m: Omit<StudioMessage, 'id'>) {
    messages.value.push({ id: `studio-${++seq}`, ...m })
  }

  // 建立意圖確立後的路由：清單為空就直接進既有建立邏輯（用這句話當第一句描述），
  // 清單非空就進關卡一問清楚要沿用、改、還是開新的
  function routeBuildIntent(text: string): void {
    if (store.myPersonalSkills.length === 0) {
      gateStage.value = 'active'
      const reply = interpretStudioMessage(text, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }
    lastBuildText.value = text
    gateStage.value = 'gate1'
    push({
      role: 'agent',
      content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
      actions: [GATE1_NEW, GATE1_CUSTOM, GATE1_FOLLOW],
    })
  }

  // gateStage !== 'active' 時，每則訊息都先經過這裡；後續 Task 會繼續往這個函式加 if 分支
  function handleGateMessage(text: string): void {
    const t = text.trim()
    const stage = gateStage.value

    if (stage === 'intent') {
      const kind = classifyIntent(t)
      if (kind === 'build') {
        routeBuildIntent(t)
        return
      }
      if (kind === 'general') {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      lastBuildText.value = t
      gateStage.value = 'gate0'
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？', actions: [GATE0_BUILD, GATE0_GENERAL] })
      return
    }

    if (stage === 'gate0') {
      if (t === GATE0_BUILD.label) {
        routeBuildIntent(lastBuildText.value)
        return
      }
      if (t === GATE0_GENERAL.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'intent'
        return
      }
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？', actions: [GATE0_BUILD, GATE0_GENERAL] })
      return
    }

    if (stage === 'gate1') {
      if (t === GATE1_NEW.label || t === GATE1_CUSTOM.label) {
        const similar = findSimilarSkill(lastBuildText.value, store.myPersonalSkills)
        if (similar) {
          pendingSimilarSkillId.value = similar.id
          gateStage.value = 'gate2'
          push({
            role: 'agent',
            content: `您已經有一份「${similar.name}」，這次要沿用他、改他還是記一份新的？`,
            actions: [GATE2_FOLLOW, GATE2_EDIT, GATE2_NEW, GATE2_ELSE],
          })
        } else {
          gateStage.value = 'clarify'
          push({ role: 'agent', content: '好，那請直接描述這份做法的內容，我會幫你整理。' })
        }
        return
      }
      if (t === GATE1_FOLLOW.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'active'
        return
      }
      push({
        role: 'agent',
        content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
        actions: [GATE1_NEW, GATE1_CUSTOM, GATE1_FOLLOW],
      })
      return
    }

    if (stage === 'gate2') {
      if (t === GATE2_FOLLOW.label) {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (t === GATE2_EDIT.label) {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (t === GATE2_NEW.label) {
        pendingSimilarSkillId.value = null
        draft.value = emptyDraft()
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (t === GATE2_ELSE.label) {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        draft.value = emptyDraft()
        messages.value = []
        // 刻意不重設 seq：pausedDraft.messages 裡還留著用舊 seq 產生的訊息 id，
        // 之後 Task 6 接回來時會把這些訊息原封不動塞回 messages.value；如果這裡把
        // seq 歸零，接下來這段新話題（甚至同一輪還沒接回去前）推的新訊息就會產生
        // 跟 paused.messages 撞號的 id（例如都從 studio-1 開始），SkillStudioChat.vue
        // 用 :key="msg.id" 渲染會出問題。seq 只增不減才能保證任何時候都不撞號
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      const similar = pendingSimilarSkillId.value ? store.findSkill(pendingSimilarSkillId.value) : null
      push({
        role: 'agent',
        content: `您已經有一份「${similar?.name ?? ''}」，這次要沿用他、改他還是記一份新的？`,
        actions: [GATE2_FOLLOW, GATE2_EDIT, GATE2_NEW, GATE2_ELSE],
      })
      return
    }

    if (stage === 'clarify') {
      if (CLARIFY_DONE_HINT.test(t)) {
        gateStage.value = 'gate3'
        push({
          role: 'agent',
          content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
          actions: [GATE3_CONFIRM, GATE3_RETRY],
        })
        return
      }
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }

    if (stage === 'gate3') {
      if (t === GATE3_CONFIRM.label) {
        save()
        gateStage.value = 'active'
        return
      }
      if (t === GATE3_RETRY.label) {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
        actions: [GATE3_CONFIRM, GATE3_RETRY],
      })
      return
    }
  }

  // 無 prefill：等使用者選建立方式（method null、沒有訊息）。
  // 有 prefill（Agent 建議）：一律對話方式，直接推開場。snapshot 基準刻意維持空草稿，
  // 讓預填一開始就是「有未儲存變更」，使用者得按儲存才會寫進技能
  function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void {
    mode.value = 'create'
    savedSkillId.value = null
    const base = emptyDraft()
    draft.value = {
      ...base,
      ...prefill,
      capabilities: (prefill?.capabilities ?? base.capabilities).map(c => ({ ...c })),
      files: [...(prefill?.files ?? base.files)],
      sectionIds: [...(prefill?.sectionIds ?? base.sectionIds)],
      method: prefill ? 'chat' : null,
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    // 有 prefill：來源（例如方案三 conv4 交接）已經知道使用者要幹嘛，略過整套關卡
    gateStage.value = prefill ? 'active' : 'intent'
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }

  function chooseMethod(method: StudioMethod): void {
    if (draft.value.method) return
    draft.value = { ...draft.value, method }
    if (method === 'chat' && messages.value.length === 0) {
      gateStage.value = 'intent'
      push({ role: 'agent', content: GATE_OPENING_MESSAGE })
    }
  }

  // 積木方式的輸入：名稱／說明直接寫；章節變動就重推導步驟／能力／觸發條件
  function updateBlocks(patch: { name?: string; description?: string; sectionIds?: string[] }): void {
    if (draft.value.method !== 'blocks') return
    const next: SkillDraft = { ...draft.value }
    if (patch.name !== undefined) next.name = patch.name
    if (patch.description !== undefined) next.description = patch.description
    if (patch.sectionIds !== undefined) {
      next.sectionIds = [...patch.sectionIds]
      Object.assign(next, deriveFromSections(next.sectionIds))
    }
    draft.value = next
  }

  function loadSkill(skillId: string): boolean {
    const s = store.findSkill(skillId)
    if (!s || s.zone !== 'personal') return false
    mode.value = 'edit'
    savedSkillId.value = skillId
    draft.value = draftFromSkill(s)
    snapshot.value = serialize(draft.value)
    messages.value = []
    gateStage.value = 'active'  // 修改既有技能：已經知道要幹嘛，不用再問一輪
    if (draft.value.method === 'chat') push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
    return true
  }

  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))

    if (pausedDraft.value && wantsToResume(t, pausedDraft.value)) {
      const paused = pausedDraft.value
      gateStage.value = paused.gateStage
      messages.value = [...paused.messages]
      draft.value = paused.draft
      pendingSimilarSkillId.value = paused.pendingSimilarSkillId
      pausedDraft.value = null
      push({ role: 'agent', content: `好，回到剛才「${paused.draft.name || '那個'}」繼續。` })
      isRunning.value = false
      return
    }

    if (gateStage.value === 'active') {
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
    } else {
      handleGateMessage(t)
    }
    isRunning.value = false
  }

  function save(): string | null {
    if (!canSave.value) return null
    const d = draft.value
    if (mode.value === 'create') {
      // 個人技能一律以未啟用落地，見 skillStore.ts 的 createPersonalSkill() 註解——
      // 要先通過 AI 快速測試（或使用者明確選擇略過）才能開，這裡不用也不該再傳 isEnabled
      const id = store.createPersonalSkill({
        name: d.name.trim(),
        description: d.description,
        instructions: d.instructions,
        triggerHint: d.triggerHint,
        assignedAgents: [],
        capabilities: d.capabilities.map(c => ({ ...c })),
        files: [...d.files],
        composition: d.method === 'blocks' ? { sectionIds: [...d.sectionIds] } : undefined,
        creationMethod: d.method === 'blocks' ? 'manual' : 'ai_assisted',
      })
      mode.value = 'edit'
      savedSkillId.value = id
    } else if (savedSkillId.value) {
      store.applyStudioPatch(savedSkillId.value, {
        name: d.name.trim(),
        description: d.description,
        instructions: d.instructions,
        triggerHint: d.triggerHint,
        capabilities: d.capabilities,
        composition: d.method === 'blocks' ? { sectionIds: [...d.sectionIds] } : undefined,
      })
      store.updateSkillFiles(savedSkillId.value, d.files)
    }
    snapshot.value = serialize(draft.value)
    return savedSkillId.value
  }

  function updateFiles(files: SkillFile[]): void {
    draft.value = { ...draft.value, files }
  }

  function toSnapshot(): StudioSnapshot {
    return JSON.parse(JSON.stringify({
      mode: mode.value,
      savedSkillId: savedSkillId.value,
      draft: draft.value,
      messages: messages.value,
    }))
  }

  function hydrate(snap: StudioSnapshot): void {
    const copy: StudioSnapshot = JSON.parse(JSON.stringify(snap))
    mode.value = copy.mode
    savedSkillId.value = copy.savedSkillId
    draft.value = copy.draft
    messages.value = copy.messages
    // dirty 基準取自「目前已儲存的內容」而非「這份快照本身」：isDirty 才會是
    // 「跟已存的技能（或空白，若還沒存過）不一樣」，而不是「跟上次 hydrate 不一樣」
    const saved = copy.savedSkillId ? store.findSkill(copy.savedSkillId) : undefined
    snapshot.value = saved ? serialize(draftFromSkill(saved)) : serialize(emptyDraft())
    // 接續既有訊息 id，避免之後 push 撞號
    seq = copy.messages.reduce((max, m) => Math.max(max, Number(m.id.replace('studio-', '')) || 0), 0)
  }

  // block 指到的技能已被刪除時：草稿保留，但退回建立模式，下次儲存會建立新技能
  function detachSavedSkill(): void {
    savedSkillId.value = null
    mode.value = 'create'
    snapshot.value = serialize(emptyDraft())
  }

  return {
    mode, savedSkillId, draft, messages, isRunning, isDirty, canSave, suggestionChips, gateStage,
    startCreate, chooseMethod, updateBlocks, loadSkill, send, save, updateFiles, toSnapshot, hydrate, detachSavedSkill,
  }
}
