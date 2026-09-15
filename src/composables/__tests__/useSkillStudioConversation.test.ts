import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import {
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
} from '@/composables/useSkillStudioConversation'

describe('extractSkillName', () => {
  it('取「建立／幫我做／需要」之後、「的技能／的 Skill」之前的片段，並去掉量詞與「能／可以」', () => {
    expect(extractSkillName('幫我建立一個能查 ERP 庫存的技能')).toBe('查 ERP 庫存')
    expect(extractSkillName('我需要一個可以整理會議紀錄的 Skill')).toBe('整理會議紀錄')
  })
  it('沒有關鍵字時取第一個子句前 12 字', () => {
    expect(extractSkillName('把每週會議逐字稿整理成週報，要有待辦')).toBe('把每週會議逐字稿整理成週')
  })
  it('空字串退回「新技能」', () => {
    expect(extractSkillName('   ')).toBe('新技能')
  })
})

describe('interpretStudioMessage', () => {
  it('建立模式第一句：產生名稱／說明／觸發／三步驟／兩項能力，並帶三個動作 chip', () => {
    const reply = interpretStudioMessage('幫我建立一個能查 ERP 庫存的技能', emptyDraft(), 'create')
    expect(reply.patch?.name).toBe('查 ERP 庫存')
    expect(reply.patch?.description).toBe('幫我建立一個能查 ERP 庫存的技能')
    expect(reply.patch?.triggerHint).toBe('當使用者提到「查 ERP 庫存」相關需求時')
    expect(reply.patch?.instructions?.split('\n')).toHaveLength(3)
    expect(reply.patch?.capabilities).toHaveLength(2)
    expect(reply.actions?.map(a => a.label)).toEqual(['看起來沒問題，儲存', '觸發條件要更精準', '再補一個步驟'])
  })

  it('改名：優先取引號內文字', () => {
    const draft = { ...emptyDraft(), name: '舊' }
    const reply = interpretStudioMessage('名稱改成「庫存速查」', draft, 'edit')
    expect(reply.patch?.name).toBe('庫存速查')
    expect(reply.content).toContain('庫存速查')
  })

  it('觸發：更新 triggerHint', () => {
    const draft = { ...emptyDraft(), name: 'x' }
    const reply = interpretStudioMessage('觸發條件改成當使用者問缺貨時', draft, 'edit')
    expect(reply.patch?.triggerHint).toBe('當使用者問缺貨時')
  })

  it('加步驟：依現有步驟數接續編號', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a\n2. b\n3. c' }
    const reply = interpretStudioMessage('再補一個步驟', draft, 'edit')
    expect(reply.patch?.instructions).toBe('1. a\n2. b\n3. c\n4. 檢查輸出結果，必要時補充說明')
    expect(reply.content).toBe('已追加第 4 步。')
  })

  it('加能力：push 一項 capability', () => {
    const draft = { ...emptyDraft(), name: 'x', capabilities: [{ name: 'a', description: '' }] }
    const reply = interpretStudioMessage('還能匯出成 Excel', draft, 'edit')
    expect(reply.patch?.capabilities).toHaveLength(2)
    expect(reply.patch?.capabilities?.[1].name).toBe('匯出成 Excel')
  })

  it('動作 chip「看起來沒問題，儲存」不改草稿，只回提示', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('看起來沒問題，儲存', draft, 'create')
    expect(reply.patch).toBeUndefined()
    expect(reply.content).toContain('儲存為個人技能')
  })

  it('其他訊息：附加到 instructions', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('語氣要親切一點', draft, 'edit')
    expect(reply.patch?.instructions).toBe('1. a\n\n（依對話更新）語氣要親切一點')
  })
})

describe('useSkillStudioConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('startCreate 是建立模式、草稿空白、只有一則 Agent 開場訊息、canSave 為 false', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.mode.value).toBe('create')
    expect(c.draft.value).toEqual(emptyDraft())
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].role).toBe('agent')
    expect(c.canSave.value).toBe(false)
    expect(c.isDirty.value).toBe(false)
  })

  it('send 推入使用者訊息、800ms 後套用 patch 並推入 Agent 回覆', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    const p = c.send('幫我建立一個能查 ERP 庫存的技能')
    expect(c.isRunning.value).toBe(true)
    expect(c.messages.value.at(-1)?.role).toBe('user')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.isRunning.value).toBe(false)
    expect(c.draft.value.name).toBe('查 ERP 庫存')
    expect(c.messages.value.at(-1)?.role).toBe('agent')
    expect(c.messages.value.at(-1)?.actions).toHaveLength(3)
    expect(c.canSave.value).toBe(true)
    expect(c.isDirty.value).toBe(true)
  })

  it('save 於建立模式呼叫 createPersonalSkill（ai_assisted）、轉成 edit 模式並清除 dirty', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    const p = c.send('幫我建立一個能查 ERP 庫存的技能')
    await vi.advanceTimersByTimeAsync(800)
    await p
    const id = c.save()
    expect(id).toBeTruthy()
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(id)
    expect(c.isDirty.value).toBe(false)
    const skill = store.findSkill(id!)!
    expect(skill.creationMethod).toBe('ai_assisted')
    expect(skill.name).toBe('查 ERP 庫存')
    expect(skill.isEnabled).toBe(true)
  })

  it('loadSkill 對個人技能回 true 並帶入草稿；對 Library 技能／不存在 id 回 false', () => {
    const c = useSkillStudioConversation()
    expect(c.loadSkill('personal-001')).toBe(true)
    expect(c.mode.value).toBe('edit')
    expect(c.draft.value.name).toBe('週報自動生成')
    expect(c.messages.value[0].content).toContain('週報自動生成')
    expect(c.loadSkill('sys-cs-001')).toBe(false)
    expect(c.loadSkill('nope')).toBe(false)
  })

  it('save 於修改模式呼叫 applyStudioPatch，內容寫回 store', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.loadSkill('personal-001')
    const p = c.send('名稱改成「週報小幫手」')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.isDirty.value).toBe(true)
    c.save()
    expect(store.findSkill('personal-001')!.name).toBe('週報小幫手')
    expect(c.isDirty.value).toBe(false)
  })

  it('canSave 為 false 時 save 回 null 且不建立技能', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.save()).toBeNull()
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('suggestionChips：建立模式三則固定；修改模式依內容有無切換動詞', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.suggestionChips.value).toHaveLength(3)
    expect(c.suggestionChips.value[0].label).toBe('幫我建立一個能查 ERP 庫存的技能')
    c.loadSkill('personal-001')
    const labels = c.suggestionChips.value.map(s => s.label)
    expect(labels).toContain('調整技能指令')
    expect(labels).toContain('調整觸發條件')
  })
})
