import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import {
  DEFAULT_OPENING_MESSAGE,
  deriveFromSections,
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
  classifyBuildOrModify,
  findSimilarSkill,
  wantsToResume,
  formatDraftSummary,
} from '@/composables/useSkillStudioConversation'
import type { Skill, PausedDraft } from '@/composables/useSkillStudioConversation'

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

  it('一般領域句子含「叫」不誤判成改名：附加到 instructions，name 不變', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('庫存不足時要自動叫貨', draft, 'edit')
    expect(reply.patch?.name).toBeUndefined()
    expect(reply.patch?.instructions).toBe('1. a\n\n（依對話更新）庫存不足時要自動叫貨')
  })

  it('一般領域句子含「補」不誤判成加步驟：附加到 instructions，不新增編號步驟', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('補貨流程要通知採購', draft, 'edit')
    expect(reply.patch?.instructions).toBe('1. a\n\n（依對話更新）補貨流程要通知採購')
  })
})

describe('useSkillStudioConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('startCreate() 無 prefill：建立模式、method 為 null、沒有訊息、canSave 為 false', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.mode.value).toBe('create')
    expect(c.draft.value).toEqual(emptyDraft())
    expect(c.draft.value.method).toBe(null)
    expect(c.messages.value).toHaveLength(0)
    expect(c.canSave.value).toBe(false)
    expect(c.isDirty.value).toBe(false)
  })

  it('send 推入使用者訊息、800ms 後套用 patch 並推入 Agent 回覆', async () => {
    // 清單非空時，建立意圖的訊息會先卡在 gate1（見「意圖判斷」測試）；
    // 這裡要測的是既有 interpretStudioMessage 擬草稿邏輯本身，所以先清空清單讓 gateStage 直接進 active
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
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
    // 清單非空時，建立意圖的訊息會先卡在 gate1；這裡要測的是 save 本身，先清空清單讓 gateStage 直接進 active
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
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
    // 個人技能建立時一律未啟用，要先通過 AI 快速測試（或明確選擇略過）才能開
    expect(skill.isEnabled).toBe(false)
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
    c.chooseMethod('chat')
    expect(c.save()).toBeNull()
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('suggestionChips：建立模式三則固定；修改模式依內容有無切換動詞', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    expect(c.suggestionChips.value).toHaveLength(3)
    expect(c.suggestionChips.value[0].label).toBe('幫我建立一個能查 ERP 庫存的技能')
    c.loadSkill('personal-001')
    const labels = c.suggestionChips.value.map(s => s.label)
    expect(labels).toContain('調整技能指令')
    expect(labels).toContain('調整觸發條件')
  })

  it('startCreate(prefill, openingMessage)：草稿預填、isDirty 為 true、canSave 依內容、開場訊息採用指定文字', () => {
    const c = useSkillStudioConversation()
    c.startCreate(
      { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用規範', triggerHint: '偵測到整理需求' },
      '這顆技能來自本對話的「查詢銷售資料」流程。'
    )
    expect(c.mode.value).toBe('create')
    expect(c.draft.value.name).toBe('產品銷售報告整理')
    expect(c.draft.value.description).toBe('')
    expect(c.draft.value.method).toBe('chat')
    expect(c.isDirty.value).toBe(true)
    expect(c.canSave.value).toBe(true)
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].content).toBe('這顆技能來自本對話的「查詢銷售資料」流程。')
  })

  it('預填後的第一句走改名規則，不會被「第一句擬草稿」規則覆寫', async () => {
    const c = useSkillStudioConversation()
    c.startCreate({ name: '舊名', instructions: '1. a' })
    const p = c.send('名稱改成「新名」')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.draft.value.name).toBe('新名')
    expect(c.draft.value.instructions).toBe('1. a')
  })

  it('toSnapshot / hydrate 往返：內容一致、create 模式下 hydrate 後 isDirty=true（內容與空白不同）、之後新訊息 id 不重複', async () => {
    // 清單非空時，建立意圖的訊息會先卡在 gate1；這裡要測的是 toSnapshot/hydrate 本身，先清空清單讓 gateStage 直接進 active
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const a = useSkillStudioConversation()
    a.startCreate()
    a.chooseMethod('chat')
    const p = a.send('幫我建立一個能查 ERP 庫存的技能')
    await vi.advanceTimersByTimeAsync(800)
    await p
    const snap = a.toSnapshot()
    expect(snap.mode).toBe('create')
    expect(snap.draft.name).toBe('查 ERP 庫存')
    expect(snap.messages).toHaveLength(3)

    const b = useSkillStudioConversation()
    b.hydrate(snap)
    expect(b.draft.value).toEqual(snap.draft)
    expect(b.messages.value.map(m => m.id)).toEqual(snap.messages.map(m => m.id))
    // 未儲存過（create 模式），基準是空草稿，所以 hydrate 後仍算「未儲存變更」
    expect(b.isDirty.value).toBe(true)
    // 深拷貝：改 b 不影響 snap
    b.updateFiles([])
    b.draft.value.capabilities.push({ name: 'x', description: '' })
    expect(snap.draft.capabilities).toHaveLength(2)

    const q = b.send('再補一個步驟')
    await vi.advanceTimersByTimeAsync(800)
    await q
    const ids = b.messages.value.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hydrate 基準取自已儲存技能：loadSkill 後 toSnapshot／新實例 hydrate，isDirty 應為 false；再改草稿才變 true', () => {
    const a = useSkillStudioConversation()
    a.loadSkill('personal-001')
    const snap = a.toSnapshot()

    const b = useSkillStudioConversation()
    b.hydrate(snap)
    expect(b.isDirty.value).toBe(false)

    b.draft.value.name = '改個名字'
    expect(b.isDirty.value).toBe(true)
  })

  it('detachSavedSkill：清掉 savedSkillId、退回 create、isDirty 為 true', () => {
    const c = useSkillStudioConversation()
    c.loadSkill('personal-001')
    expect(c.isDirty.value).toBe(false)
    c.detachSavedSkill()
    expect(c.savedSkillId.value).toBeNull()
    expect(c.mode.value).toBe('create')
    expect(c.isDirty.value).toBe(true)
    expect(c.draft.value.name).toBe('週報自動生成') // 草稿內容保留
  })

  it('chooseMethod(chat) 推開場訊息；chooseMethod(blocks) 不推訊息且 suggestionChips 為空', () => {
    const a = useSkillStudioConversation()
    a.startCreate()
    a.chooseMethod('chat')
    expect(a.draft.value.method).toBe('chat')
    expect(a.messages.value).toHaveLength(1)
    // 無 prefill 走意圖判斷關卡（見「gateStage：進入點」），開場白不是既有 DEFAULT_OPENING_MESSAGE
    expect(a.messages.value[0].content).not.toBe(DEFAULT_OPENING_MESSAGE)
    expect(a.gateStage.value).toBe('intent')
    const b = useSkillStudioConversation()
    b.startCreate()
    b.chooseMethod('blocks')
    expect(b.draft.value.method).toBe('blocks')
    expect(b.messages.value).toHaveLength(0)
    expect(b.suggestionChips.value).toEqual([])
  })

  it('method 不列入 dirty 比對：光選方式不算未儲存變更，選完再改內容才算', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('blocks')
    expect(c.isDirty.value).toBe(false)
    c.updateBlocks({ sectionIds: ['promo_kpi'] })
    expect(c.isDirty.value).toBe(true)
  })

  it('只選了方式的快照被另一個實例 hydrate：isDirty 仍為 false（method 差異不該跨實例變成未儲存變更）', () => {
    const a = useSkillStudioConversation()
    a.startCreate()
    a.chooseMethod('blocks')
    const snap = a.toSnapshot()

    const b = useSkillStudioConversation()
    b.hydrate(snap)
    expect(b.draft.value.method).toBe('blocks')
    expect(b.isDirty.value).toBe(false)
  })

  it('loadSkill 後 isDirty 仍為 false（method 由有無 composition 推得，不影響 dirty 基準）', () => {
    const c = useSkillStudioConversation()
    expect(c.loadSkill('personal-001')).toBe(true)
    expect(c.draft.value.method).toBe('chat') // personal-001 無 composition
    expect(c.isDirty.value).toBe(false)
  })

  it('deriveFromSections：編號步驟、分類觸發條件、每章一項能力；空清單全空', () => {
    const d = deriveFromSections(['promo_kpi', 'ta_gender'])
    expect(d.instructions).toBe('依序產出以下章節：\n1. 促銷核心 KPI：完成訂單數、GMV、折扣總額、折扣佔比、規則數。\n2. 性別分布：會員性別分布資料，圖表自動生成。')
    expect(d.triggerHint).toBe('當使用者要求產出行銷報告，或提到「TA 用戶畫像、行銷活動成效」相關分析時')
    expect(d.capabilities.map(c => c.name)).toEqual(['促銷核心 KPI', '性別分布'])
    expect(deriveFromSections([])).toEqual({ instructions: '', triggerHint: '', capabilities: [] })
    expect(deriveFromSections(['nope']).instructions).toBe('')
  })

  it('updateBlocks：只在 blocks 方式生效；sectionIds 變動才重推導；isDirty/canSave 隨之變化', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('blocks')
    expect(c.canSave.value).toBe(false)
    c.updateBlocks({ name: '行銷週報' })
    expect(c.canSave.value).toBe(false) // 還沒有章節
    c.updateBlocks({ sectionIds: ['promo_kpi'] })
    expect(c.draft.value.instructions).toContain('1. 促銷核心 KPI')
    expect(c.draft.value.capabilities).toHaveLength(1)
    expect(c.canSave.value).toBe(true)
    expect(c.isDirty.value).toBe(true)
    c.updateBlocks({ description: '每週一產出' })
    expect(c.draft.value.description).toBe('每週一產出')
    expect(c.draft.value.instructions).toContain('1. 促銷核心 KPI') // 未重推導、未清空

    const chat = useSkillStudioConversation()
    chat.startCreate()
    chat.chooseMethod('chat')
    chat.updateBlocks({ sectionIds: ['promo_kpi'] })
    expect(chat.draft.value.sectionIds).toEqual([])
  })

  it('save（blocks）：寫入 composition 與 creationMethod manual；loadSkill 還原 method 與 sectionIds 且不推訊息', () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('blocks')
    c.updateBlocks({ name: '行銷週報', sectionIds: ['promo_kpi', 'ch_kpi'] })
    const id = c.save()!
    const s = store.findSkill(id)!
    expect(s.composition).toEqual({ sectionIds: ['promo_kpi', 'ch_kpi'] })
    expect(s.creationMethod).toBe('manual')

    const d = useSkillStudioConversation()
    expect(d.loadSkill(id)).toBe(true)
    expect(d.draft.value.method).toBe('blocks')
    expect(d.draft.value.sectionIds).toEqual(['promo_kpi', 'ch_kpi'])
    expect(d.messages.value).toHaveLength(0)
    expect(d.isDirty.value).toBe(false)

    const e = useSkillStudioConversation()
    e.loadSkill('personal-001')
    expect(e.draft.value.method).toBe('chat')
    expect(e.messages.value).toHaveLength(1)
  })
})

describe('classifyBuildOrModify', () => {
  it('含「修改」訊號（不論長短）→ modify', () => {
    expect(classifyBuildOrModify('修改')).toBe('modify')
    expect(classifyBuildOrModify('我想調整一下技能的觸發條件')).toBe('modify')
    expect(classifyBuildOrModify('更新技能內容')).toBe('modify')
  })

  it('含建立訊號，或長度夠長的一般描述 → build（預設值）', () => {
    expect(classifyBuildOrModify('幫我建立一個能查 ERP 庫存的技能')).toBe('build')
    expect(classifyBuildOrModify('把每週會議逐字稿整理成週報')).toBe('build')
  })

  it('極短且無任何訊號 → ambiguous', () => {
    expect(classifyBuildOrModify('嗯')).toBe('ambiguous')
  })

  it('修改訊號優先於長度規則：一有「修改」二字就是 modify，不管多長', () => {
    expect(classifyBuildOrModify('我想要修改一下這個做法的內容跟觸發條件')).toBe('modify')
  })
})

describe('findSimilarSkill', () => {
  const skills: Skill[] = [
    {
      id: 's1', name: '產品銷售報告整理', description: '', type: 'extension', origin: 'manually_created',
      version: '初始版本', isEnabled: true, usageCount: 0, testPassRate: 0, avgLatencyMs: 0,
      triggerHint: '查詢銷售資料', instructions: '整理銷售報告',
    },
  ]

  it('有關鍵字重疊時回傳分數最高的技能', () => {
    expect(findSimilarSkill('我要處理銷售報告的事情', skills)?.id).toBe('s1')
  })

  it('沒有重疊回傳 null', () => {
    expect(findSimilarSkill('今天天氣真好', skills)).toBeNull()
  })

  it('空字串回傳 null', () => {
    expect(findSimilarSkill('', skills)).toBeNull()
  })
})

describe('wantsToResume', () => {
  const paused: PausedDraft = {
    gateStage: 'gate2',
    messages: [],
    draft: { ...emptyDraft(), name: '產品銷售報告整理' },
    pendingSimilarSkillId: null,
  }

  it('含接續關鍵字 → true', () => {
    expect(wantsToResume('我們繼續剛才的', paused)).toBe(true)
    expect(wantsToResume('回到上次那個', paused)).toBe(true)
  })

  it('直接提到暫存草稿名稱 → true', () => {
    expect(wantsToResume('產品銷售報告整理那份要怎麼弄', paused)).toBe(true)
  })

  it('都沒有 → false', () => {
    expect(wantsToResume('今天天氣真好', paused)).toBe(false)
  })

  it('暫存草稿沒有名稱時，不會誤判空字串包含在任何話裡', () => {
    const noName: PausedDraft = { ...paused, draft: { ...emptyDraft() } }
    expect(wantsToResume('今天天氣真好', noName)).toBe(false)
  })
})

describe('formatDraftSummary', () => {
  it('整理草稿目前欄位成摘要文字', () => {
    const draft = {
      ...emptyDraft(),
      name: '產品銷售報告整理',
      triggerHint: '查詢銷售資料時',
      instructions: '1. 查詢資料\n2. 產出報告',
      capabilities: [{ name: '查詢資料', description: '' }],
    }
    const summary = formatDraftSummary(draft)
    expect(summary).toContain('產品銷售報告整理')
    expect(summary).toContain('查詢銷售資料時')
    expect(summary).toContain('查詢資料')
  })

  it('欄位是空的時候顯示未設定提示，不是空字串', () => {
    const summary = formatDraftSummary(emptyDraft())
    expect(summary).not.toContain('名稱：\n')
    expect(summary).toContain('未命名')
  })
})

describe('gateStage：進入點', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('全新對話（無 prefill）選「用對話建立」：gateStage 是 intent，且推一句開場白（不是既有 DEFAULT_OPENING_MESSAGE）', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].role).toBe('agent')
  })

  it('有 prefill（例如方案三 conv4 交接）：gateStage 直接是 active，略過整套關卡', () => {
    const c = useSkillStudioConversation()
    c.startCreate({ name: '產品銷售報告整理' }, '開場白')
    expect(c.gateStage.value).toBe('active')
  })

  it('loadSkill（修改既有技能）：gateStage 直接是 active', () => {
    const c = useSkillStudioConversation()
    expect(c.loadSkill('personal-001')).toBe(true)
    expect(c.gateStage.value).toBe('active')
  })
})

describe('意圖判斷（gateStage intent）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('清單為空＋建立意圖：不再有快速路徑，統一轉 gathering 開始追問', async () => {
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    expect(c.gateStage.value).toBe('gathering')
    expect(c.messages.value.at(-1)!.content).toBe('還有沒有需要特別注意的情況或例外？')
  })

  it('清單非空＋建立意圖，找到相近做法：不再問關卡一，一句話直接轉 gate2', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${target.name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.content).toContain(target.name)
  })

  it('清單非空＋建立意圖，找不到相近做法：不再問關卡一，一句話直接轉 gathering', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定')
    expect(c.gateStage.value).toBe('gathering')
    expect(c.messages.value.at(-1)!.content).toBe('還有沒有需要特別注意的情況或例外？')
  })

  it('修改意圖，找到相近技能：直接 loadSkill 進修改模式', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我修改${target.name}這個技能`)
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

  it('修改意圖，找不到相近技能：轉 findModifyTarget', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
  })

  it('修改意圖，但清單是空的：回覆沒有技能可改，gateStage 留在 intent', async () => {
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還沒有任何個人技能可以修改')
  })

  it('太模糊：gateStage 留在 intent，推一句澄清問句', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })
})

describe('findModifyTarget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('第二句提到某顆技能：找到了，直接 loadSkill', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
    await sendAndWait(c, target.name)
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

  it('還是找不到：換句話重問，不是逐字重複入口訊息', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    const entryMessage = c.messages.value.at(-1)!.content
    await sendAndWait(c, '就是那個東西')
    expect(c.gateStage.value).toBe('findModifyTarget')
    expect(c.messages.value.at(-1)!.content).not.toBe(entryMessage)
  })
})

describe('關卡二與暫存草稿', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  async function reachGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
  }

  it('關卡二選「照現有規定做」：推 TODO 佔位，gateStage 轉 active，清掉 pendingSimilarSkillId', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await reachGate2(c, store.myPersonalSkills[0].name)
    expect(c.gateStage.value).toBe('gate2')
    await sendAndWait(c, '照現有規定做')
    expect(c.gateStage.value).toBe('active')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('關卡二選「改他」：帶入該技能內容進入修改模式，gateStage 轉 active', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    await sendAndWait(c, '改他')
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
    expect(c.draft.value.name).toBe(target.name)
  })

  it('關卡二選「另外新增一份」：空白開始，gateStage 轉 gathering，草稿沒有帶入相近技能的內容', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    await sendAndWait(c, '另外新增一份')
    expect(c.gateStage.value).toBe('gathering')
    expect(c.draft.value.name).toBe('')
    expect(c.draft.value.instructions).toBe('')
    expect(c.messages.value.at(-1)!.content).toBe('還有沒有需要特別注意的情況或例外？')
  })

  it('關卡二選「我要講別的」：暫存目前對話與草稿，gateStage 回 intent 處理新話題', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    const messagesBeforePause = c.messages.value.length
    await sendAndWait(c, '我要講別的')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.length).toBeLessThan(messagesBeforePause)
    // 換個新話題照常走一輪意圖判斷（太模糊 → 留在 intent 問澄清）
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })
})

describe('CLARIFY 補齊與關卡三確認', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    // Ensure the store has no matching skills for our test messages
    const store = useSkillStore()
    const hasSomeSkills = store.myPersonalSkills.length > 0
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    // Re-add one non-matching skill if we need to preserve non-empty state (for "清單非空" flow)
    if (hasSomeSkills) {
      store.createPersonalSkill({
        name: '簽核文件資訊',
        description: '簽核企業檔案',
        instructions: '檢視核簽狀況',
        triggerHint: '需要簽核文件時',
        assignedAgents: [],
        capabilities: [{ name: 'test', description: 'test' }],
        files: [],
      })
    }
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('clarify 階段一般描述：照既有 interpretStudioMessage 規則更新草稿，不轉關卡', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定') // 清單非空、零 bigram 重疊 → 直接 clarify
    expect(c.gateStage.value).toBe('clarify')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    expect(c.gateStage.value).toBe('clarify')
    expect(c.draft.value.name).toBeTruthy()
    await sendAndWait(c, '觸發條件改成當使用者提到缺貨時')
    expect(c.draft.value.triggerHint).toContain('缺貨')
  })

  it('clarify 階段說收尾語：轉關卡三，訊息帶草稿摘要', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    expect(c.gateStage.value).toBe('gate3')
    const last = c.messages.value.at(-1)!
    expect(last.content).toContain(c.draft.value.name)
  })

  it('關卡三選「這樣可以，存到個人技能」：實際呼叫 save()，技能出現在 myPersonalSkills，gateStage 轉 active', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    await sendAndWait(c, '這樣可以，存到個人技能')
    expect(c.gateStage.value).toBe('active')
    expect(store.myPersonalSkills.length).toBe(before + 1)
    expect(c.savedSkillId.value).toBeTruthy()
  })

  it('關卡三選「不對，我要改」：退回 clarify，草稿內容不清空', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    const nameBeforeRetry = c.draft.value.name
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    await sendAndWait(c, '不對，我要改')
    expect(c.gateStage.value).toBe('clarify')
    expect(c.draft.value.name).toBe(nameBeforeRetry)
  })
})

describe('暫存草稿的接續判斷', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  // 回傳暫停當下（「我要講別的」那句已計入）快照的訊息數，讓呼叫端能驗證
  // 還原後的 messages.value 長度剛好是「暫停快照＋一句銜接語」，藉此鎖定
  // 「接續觸發句不會混進最終還原的對話紀錄」這個行為（見 Step 3 code 下方的注意事項）
  async function pauseWithDraft(c: ReturnType<typeof useSkillStudioConversation>, skillName: string): Promise<number> {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    const pausedMessageCount = c.messages.value.length + 1 // +1：即將送出、會被存進快照的「我要講別的」
    await sendAndWait(c, '我要講別的')
    return pausedMessageCount
  }

  it('訊息含接續關鍵字：還原暫停當下的 gateStage／messages／draft，推一句銜接語，接續觸發句不會留在還原後的訊息裡', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    const pausedMessageCount = await pauseWithDraft(c, target.name)
    expect(c.gateStage.value).toBe('intent')

    await sendAndWait(c, '我們繼續剛才的')

    expect(c.gateStage.value).toBe('gate2')
    // 還原後只多了一句銜接語：暫存快照本身的訊息數＋1，觸發句「我們繼續剛才的」沒有被塞進去
    expect(c.messages.value.length).toBe(pausedMessageCount + 1)
    expect(c.messages.value.some(m => m.content.includes('我們繼續剛才的'))).toBe(false)
    const last = c.messages.value.at(-1)!
    expect(last.content).toContain('繼續')
  })

  it('訊息沒有接續訊號：正常走當下 gateStage 的路由，暫存草稿維持不動', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await pauseWithDraft(c, target.name)

    await sendAndWait(c, '嗯')

    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })

  it('沒有暫存草稿時，接續關鍵字就照正常意圖判斷處理（不會誤觸發還原、不會拋錯）', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    // 沒有 pausedDraft，接續檢查整段跳過；'嗯' 這句話太短、沒有任何訊號，
    // classifyBuildOrModify 會判成 ambiguous，gateStage 留在 intent 並推一句澄清問句。
    // pausedDraft 本身不是 useSkillStudioConversation() 回傳值的一部分（純內部狀態），
    // 測試只能斷言可觀察的行為結果，不能直接檢查它的值
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })
})

describe('關卡訊息不再帶 chip（actions）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('關卡二的訊息（建立意圖找到相近做法）不帶 actions', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${store.myPersonalSkills[0].name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('findModifyTarget 的訊息（修改意圖找不到相近技能）不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('太模糊的澄清問句不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })
})

describe('classifyGate2（模組內部邏輯，透過 gateStage 行為驗證）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  async function toGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    expect(c.gateStage.value).toBe('gate2')
  }

  it('本關比對到「改他」語意：帶入該技能內容進入修改模式', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await toGate2(c, target.name)
    await sendAndWait(c, '幫我修改他就好')
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

  it('本關比對不到：先清掉 pendingSimilarSkillId，再重定向到新話題判斷（太模糊 → 留在 intent 問澄清）', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await toGate2(c, store.myPersonalSkills[0].name)
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
    // 驗證 pendingSimilarSkillId 真的被清掉了：接著描述一個會命中「另一顆」技能的新內容，
    // 應該正確轉去 gate2 並帶那顆技能的名稱，而不是卡在舊的 pendingSimilarSkillId 對應的技能上
    const other = store.myPersonalSkills[1]
    await sendAndWait(c, `幫我記一個${other.name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.content).toContain(other.name)
  })
})

describe('classifyGate3（模組內部邏輯，透過 gateStage 行為驗證，不做新話題重定向）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  async function toGate3(c: ReturnType<typeof useSkillStudioConversation>) {
    c.startCreate()
    c.chooseMethod('chat')
    // 用 '我要新增一份規定'（不是 '幫我建立一個新技能'）當第一句：跟 mock 個人技能清單裡
    // 「週報自動生成」的 instructions 文字（"你是一個週報助理…"）有 bigram 重疊（透過
    // 「一個」兩個字），會讓 findSimilarSkill 誤判成「找到相近做法」、把流程導去關卡二而不是
    // clarify，整個 toGate3 就到不了關卡三。'我要新增一份規定' 已在別的既有測試驗證過對所有
    // mock 技能的 bigram 重疊分數是 0，能確保這裡走到 clarify
    await sendAndWait(c, '我要新增一份規定')
    await sendAndWait(c, '就改現有規定吧')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    expect(c.gateStage.value).toBe('gate3')
  }

  it('本關比對到「確認」語意（不是精確 chip 文字）：實際存檔', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    await toGate3(c)
    await sendAndWait(c, '好的，沒問題')
    expect(c.gateStage.value).toBe('active')
    expect(store.myPersonalSkills.length).toBe(before + 1)
  })

  it('本關比對到「不對」語意：不會被「對」字誤判成確認，退回 clarify', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    await toGate3(c)
    await sendAndWait(c, '不對，我打錯了')
    expect(c.gateStage.value).toBe('clarify')
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('本關比對不到：純文字重新描述選項，不呼叫 classifyIntent 重定向（草稿內容不因此被清空或跳關）', async () => {
    const c = useSkillStudioConversation()
    await toGate3(c)
    const nameBefore = c.draft.value.name
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('gate3')
    expect(c.draft.value.name).toBe(nameBefore)
    expect(c.messages.value.at(-1)!.content).not.toBe('') // 有換句話重述，不是空白
  })
})
