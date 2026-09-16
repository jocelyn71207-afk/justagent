import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { ChatMessage, Skill, SkillCapability, SkillFile } from '@/stores/skillStore'

// AI 賦能（SkillStudio）的對話狀態與規則式 mock 回覆。
// 這裡是頁面唯一的狀態來源：左側對話、右側預覽都只讀這裡的 draft／messages。

export type StudioMode = 'create' | 'edit'

export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
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

export function emptyDraft(): SkillDraft {
  return { name: '', description: '', instructions: '', triggerHint: '', capabilities: [], files: [] }
}

// 由已儲存的技能還原出一份草稿（loadSkill／hydrate 基準共用，避免兩處各寫一次欄位對應）
export function draftFromSkill(s: Skill): SkillDraft {
  return {
    name: s.name,
    description: s.description ?? '',
    instructions: s.instructions ?? '',
    triggerHint: s.triggerHint ?? '',
    capabilities: (s.capabilities ?? []).map(c => ({ ...c })),
    files: [...(s.files ?? [])],
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

function serialize(d: SkillDraft): string {
  return JSON.stringify({ ...d, files: d.files.map(f => f.id) })
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

  const isDirty = computed(() => serialize(draft.value) !== snapshot.value)
  const canSave = computed(() => !!draft.value.name.trim() && !!draft.value.instructions.trim())
  const suggestionChips = computed<StudioSuggestion[]>(() =>
    mode.value === 'create' ? CREATE_SUGGESTIONS : editSuggestions(draft.value)
  )

  function push(m: Omit<StudioMessage, 'id'>) {
    messages.value.push({ id: `studio-${++seq}`, ...m })
  }

  // prefill：由 Agent 建議放上 block 時帶入的預填內容。snapshot 基準刻意維持空草稿，
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
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }

  function loadSkill(skillId: string): boolean {
    const s = store.findSkill(skillId)
    if (!s || s.zone !== 'personal') return false
    mode.value = 'edit'
    savedSkillId.value = skillId
    draft.value = draftFromSkill(s)
    snapshot.value = serialize(draft.value)
    messages.value = []
    push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
    return true
  }

  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))
    const reply = interpretStudioMessage(t, draft.value, mode.value)
    if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
    push({ role: 'agent', content: reply.content, actions: reply.actions })
    isRunning.value = false
  }

  function save(): string | null {
    if (!canSave.value) return null
    const d = draft.value
    if (mode.value === 'create') {
      const id = store.createPersonalSkill({
        name: d.name.trim(),
        description: d.description,
        instructions: d.instructions,
        triggerHint: d.triggerHint,
        isEnabled: true,
        assignedAgents: [],
        capabilities: d.capabilities.map(c => ({ ...c })),
        files: [...d.files],
        creationMethod: 'ai_assisted',
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
    mode, savedSkillId, draft, messages, isRunning, isDirty, canSave, suggestionChips,
    startCreate, loadSkill, send, save, updateFiles, toSnapshot, hydrate, detachSavedSkill,
  }
}
