import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('版本管理', () => {
    it('getSkillVersions 返回指定技能的版本列表', () => {
      const store = useSkillStore()
      const versions = store.getSkillVersions('ext-cs-return-001')
      expect(versions.length).toBeGreaterThan(0)
    })

    it('approveSkillVersion 將版本設為 active，前一 active 設為 history', () => {
      const store = useSkillStore()
      const reviewing = store.getSkillVersions('ext-cs-return-001').find(v => v.status === 'reviewing')
      expect(reviewing).toBeDefined()
      store.approveSkillVersion('ext-cs-return-001', reviewing!.id)
      const versions = store.getSkillVersions('ext-cs-return-001')
      expect(versions.find(v => v.id === reviewing!.id)!.status).toBe('active')
      expect(versions.filter(v => v.status === 'active').length).toBe(1)
    })

    it('rejectSkillVersion 將版本設為 rejected', () => {
      const store = useSkillStore()
      const reviewing = store.getSkillVersions('ext-cs-return-001').find(v => v.status === 'reviewing')
      expect(reviewing).toBeDefined()
      store.rejectSkillVersion('ext-cs-return-001', reviewing!.id, '需修改語氣')
      expect(store.getSkillVersions('ext-cs-return-001').find(v => v.id === reviewing!.id)!.status).toBe('rejected')
    })
  })

  describe('Draft CRUD', () => {
    it('createDraft 新增一筆草稿', () => {
      const store = useSkillStore()
      const before = store.drafts.length
      store.createDraft()
      expect(store.drafts.length).toBe(before + 1)
    })

    it('updateDraft 更新草稿欄位', () => {
      const store = useSkillStore()
      const draft = store.drafts[0]
      store.updateDraft(draft.id, { name: '測試草稿' })
      expect(store.drafts.find(d => d.id === draft.id)!.name).toBe('測試草稿')
    })

    it('deleteDraft 移除草稿', () => {
      const store = useSkillStore()
      const before = store.drafts.length
      const draft = store.drafts[0]
      store.deleteDraft(draft.id)
      expect(store.drafts.length).toBe(before - 1)
    })

    it('submitDraft 移除草稿並在 flatSkills 中新增技能', () => {
      const store = useSkillStore()
      store.updateDraft(store.drafts[0].id, { name: '訂單追蹤助理', instructions: '測試指令' })
      const draftName = store.drafts[0].name
      const before = store.drafts.length
      store.submitDraft(store.drafts[0].id, 'new_skill')
      expect(store.drafts.length).toBe(before - 1)
      expect(store.flatSkills.some(s => s.name === draftName)).toBe(true)
    })
  })

  describe('批量更新', () => {
    it('pendingUpdateCount 大於 0', () => {
      const store = useSkillStore()
      expect(store.pendingUpdateCount).toBeGreaterThan(0)
    })

    it('pendingUpdateSkills 包含正確的技能', () => {
      const store = useSkillStore()
      expect(store.pendingUpdateSkills.length).toBeGreaterThan(0)
      store.pendingUpdateSkills.forEach(s => {
        expect(store.upstreamUpdateSkillIds.has(s.id)).toBe(true)
      })
    })

    it('batchMergeUpstreamUpdates 跳過有衝突的技能', () => {
      const store = useSkillStore()
      const allIds = store.pendingUpdateSkills.map(s => s.id)
      store.batchMergeUpstreamUpdates(allIds)
      // Skills with upstreamConflicts should NOT have been merged
      // ext-cs-return-001 has upstreamConflicts set in mock data
      const conflictSkill = store.findSkill('ext-cs-return-001')
      expect(conflictSkill?.upstreamConflicts?.length).toBeGreaterThan(0)
      // It should still have the same forkSourceVersion (not updated)
      expect(conflictSkill?.forkSourceVersion).toBe('2.4.0')
    })
  })

  describe('稽核記錄', () => {
    it('toggleSkill 寫入 auditLog', () => {
      const store = useSkillStore()
      const skill = store.flatSkills[0]
      store.toggleSkill(skill.id)
      expect(store.findSkill(skill.id)!.auditLog!.length).toBeGreaterThan(0)
    })

    it('mergeUpstreamUpdate（無衝突技能）寫入 UPSTREAM_MERGED', () => {
      const store = useSkillStore()
      // ext-meeting-eng-001 has update available and no conflicts
      const target = store.findSkill('ext-meeting-eng-001')
      expect(target).toBeDefined()
      store.mergeUpstreamUpdate(target!.id)
      expect(store.findSkill(target!.id)!.auditLog?.some(r => r.action === 'UPSTREAM_MERGED')).toBe(true)
    })

    it('ignoreUpstreamUpdate 寫入 UPSTREAM_IGNORED', () => {
      const store = useSkillStore()
      const target = store.findSkill('ext-meeting-eng-001')
      expect(target).toBeDefined()
      store.ignoreUpstreamUpdate(target!.id)
      expect(store.findSkill(target!.id)!.auditLog?.some(r => r.action === 'UPSTREAM_IGNORED')).toBe(true)
      expect(store.findSkill(target!.id)!.upstreamUpdateStatus).toBe('ignored')
    })

    it('detachFromUpstream 寫入 UPSTREAM_DETACHED', () => {
      const store = useSkillStore()
      const target = store.findSkill('ext-cs-return-001')
      expect(target).toBeDefined()
      store.detachFromUpstream(target!.id)
      expect(store.findSkill(target!.id)!.auditLog?.some(r => r.action === 'UPSTREAM_DETACHED')).toBe(true)
    })
  })

  describe('測試歷史', () => {
    it('saveTestRun 儲存記錄', () => {
      const store = useSkillStore()
      store.saveTestRun('sys-cs-001', { total: 7, passed: 5 })
      expect(store.getTestRunHistory('sys-cs-001').length).toBeGreaterThan(0)
    })

    it('超過 10 筆時不超過上限', () => {
      const store = useSkillStore()
      for (let i = 0; i < 12; i++) {
        store.saveTestRun('sys-cs-001', { total: 7, passed: i % 7 })
      }
      expect(store.getTestRunHistory('sys-cs-001').length).toBeLessThanOrEqual(10)
    })

    it('saveTestRun 計算 passRate 正確', () => {
      const store = useSkillStore()
      store.saveTestRun('sys-cs-001', { total: 10, passed: 7 })
      const history = store.getTestRunHistory('sys-cs-001')
      const last = history[history.length - 1]
      expect(last.passRate).toBeCloseTo(0.7)
    })
  })

  describe('PersonalSkill', () => {
    it('myPersonalSkills 初始有 3 筆且都是 zone:personal', () => {
      const store = useSkillStore()
      expect(store.myPersonalSkills.length).toBe(6)
      store.myPersonalSkills.forEach(s => expect(s.zone).toBe('personal'))
    })

    it('submitPersonalSkill 將 personalStatus 設為 reviewing 並記錄 note 和 mode', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills[0]
      expect(skill.personalStatus).toBe('available')
      store.submitPersonalSkill(skill.id, 'new_skill', '測試說明')
      expect(store.myPersonalSkills[0].personalStatus).toBe('reviewing')
      expect(store.myPersonalSkills[0].submitNote).toBe('測試說明')
      expect(store.myPersonalSkills[0].submitMode).toBe('new_skill')
    })

    it('submitPersonalSkill 對不存在 id 不報錯', () => {
      const store = useSkillStore()
      expect(() => store.submitPersonalSkill('nonexistent', 'new_skill', '')).not.toThrow()
    })

    it('deletePersonalSkill 從列表中移除', () => {
      const store = useSkillStore()
      const before = store.myPersonalSkills.length
      store.deletePersonalSkill(store.myPersonalSkills[0].id)
      expect(store.myPersonalSkills.length).toBe(before - 1)
    })

    it('findSkill 可找到個人技能', () => {
      const store = useSkillStore()
      const result = store.findSkill('personal-001')
      expect(result).toBeDefined()
      expect(result?.zone).toBe('personal')
    })
  })

  describe('Library skill 欄位', () => {
    it('Library skill 有 isEnabled 欄位但 zone 不為 personal', () => {
      const store = useSkillStore()
      const libSkill = store.flatSkills[0]
      expect(libSkill.zone).not.toBe('personal')
      expect(typeof libSkill.isEnabled).toBe('boolean')
    })
  })

  describe('SkillManagement 頁面整合', () => {
    it('myPersonalSkills 與 flatSkills 無 id 交集', () => {
      const store = useSkillStore()
      const libraryIds = new Set(store.flatSkills.map(s => s.id))
      store.myPersonalSkills.forEach(s => {
        expect(libraryIds.has(s.id)).toBe(false)
      })
    })
  })

  describe('版本測試選擇（SkillTest 沙盒）', () => {
    it('getVersionOptions 對個人技能一律回傳單一項目（不做版控）', () => {
      const store = useSkillStore()
      expect(store.getVersionOptions('personal-001')).toEqual([{ versionTag: '1.1.0', isActive: true }])
      expect(store.getVersionOptions('personal-002')).toEqual([{ versionTag: '1.0.0', isActive: true }])
    })

    it('getVersionOptions 對多版本 Library 技能依 status 判斷使用中版本', () => {
      const store = useSkillStore()
      const options = store.getVersionOptions('sys-cs-001')
      expect(options).toContainEqual({ versionTag: '2.4.0', isActive: true })
      expect(options).toContainEqual({ versionTag: '2.4.1', isActive: false })
    })

    it('getVersionOptions 對不存在的技能回傳空陣列', () => {
      const store = useSkillStore()
      expect(store.getVersionOptions('nonexistent')).toEqual([])
    })

    it('setSelectedSkill 未指定 versionTag 時預設使用技能目前版本', () => {
      const store = useSkillStore()
      store.setSelectedSkill('personal-001')
      expect(store.selectedVersionTag).toBe('1.1.0')
    })
  })

  describe('複製為個人技能與名稱衝突', () => {
    it('duplicateAsPersonalSkill 從 Library 技能建立新的個人技能，skillName 沿用來源名稱', () => {
      const store = useSkillStore()
      const before = store.myPersonalSkills.length
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(store.myPersonalSkills.length).toBe(before + 1)
      expect(copy.zone).toBe('personal')
      expect(copy.skillName).toBe('通用客服機器人')
      expect(copy.name).toBe('通用客服機器人')
      expect(copy.derivedFrom).toBe('sys-cs-001')
    })

    it('duplicateAsPersonalSkill 建立的副本 personalStatus 為 draft（尚未修改，內容與原技能相同）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
    })

    it('duplicateAsPersonalSkill 從個人技能複製時，skillName 沿用來源的 skillName（不是來源的 name）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('personal-001')
      expect(copy.skillName).toBe('會議摘要')
      expect(copy.derivedFrom).toBe('personal-001')
    })

    it('hasSkillNameConflict 偵測到相同 skillName 的其他個人技能', () => {
      const store = useSkillStore()
      // personal-001 與 personal-005 的 skillName 都是「會議摘要」（mock 資料刻意設計）
      expect(store.hasSkillNameConflict('personal-001')).toBe(true)
      expect(store.hasSkillNameConflict('personal-005')).toBe(true)
    })

    it('hasSkillNameConflict 對沒有同名技能的個人技能回傳 false', () => {
      const store = useSkillStore()
      expect(store.hasSkillNameConflict('personal-004')).toBe(false)
    })

    it('myPersonalSkills 動態計算 hasLibraryUpdate：來源版本不同才為 true', () => {
      const store = useSkillStore()
      const p002 = store.myPersonalSkills.find(s => s.id === 'personal-002')!
      const p001 = store.myPersonalSkills.find(s => s.id === 'personal-001')!
      expect(p002.hasLibraryUpdate).toBe(true) // derivedFromVersion 2.4.0 != sys-cs-001 目前 2.5.0
      expect(p001.hasLibraryUpdate).toBe(false) // derivedFromVersion 2.2.0 == sys-meeting-001 目前 2.2.0
    })

    it('duplicateAsPersonalSkill 複製「個人技能」時，derivedFrom 指向另一個個人技能不會被誤判為 Library 有更新', () => {
      // personal-001 是個人技能（不在 flatSkills / Library 範圍內）。
      // 複製後的新技能 derivedFrom 會指向 personal-001，flatSkills.find(...) 必然找不到，
      // 因此 hasLibraryUpdate 必須為 false，否則會出現無法作用的「來源有新版本」提示。
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('personal-001')
      const found = store.myPersonalSkills.find(s => s.id === copy.id)!
      expect(found.hasLibraryUpdate).toBe(false)
    })

    // myPersonalSkills 是用 .map() 動態算出 hasLibraryUpdate 的 computed，一旦底層
    // myPersonalSkillsRef 有任何變動（哪怕改的是另一筆技能），整個 computed 都會重新
    // map、產生全新的物件陣列——連沒被動到的項目也會拿到新的物件參照。
    // 這是刻意的設計，但代表任何 consumer 都不可以快取單一個 myPersonalSkills 項目後長期持有，
    // 必須每次都重新從 store 取得，否則會拿到過期的快照（先前這個 refactor 就因此出過 bug：
    // 元件持有了舊的物件參照，畫面沒有跟著 store 的變動更新）。
    it('myPersonalSkillsRef 變動後，myPersonalSkills 中未被直接修改的項目也會是全新的物件參照', () => {
      const store = useSkillStore()
      const before = store.myPersonalSkills.find(s => s.id === 'personal-001')!
      // 觸發的是 personal-002 的變動，personal-001 本身資料沒有變動
      store.toggleSkill('personal-002')
      const after = store.myPersonalSkills.find(s => s.id === 'personal-001')!
      expect(before).not.toBe(after)
      expect(before).toEqual(after)
    })

    it('updateSkill 更新草稿狀態的個人技能後，personalStatus 轉為 available', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      store.updateSkill(copy.id, {
        name: copy.name!,
        instructions: '已修改過的指令內容',
        triggerHint: copy.triggerHint ?? '',
        isEnabled: false,
        assignedAgents: [],
      })
      const updated = store.findSkill(copy.id)
      expect(updated?.personalStatus).toBe('available')
      expect(updated?.instructions).toBe('已修改過的指令內容')
    })

    it('updateSkill 儲存內容未變動的草稿時，personalStatus 保持 draft（不因為單純按下儲存就清除）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      const source = store.flatSkills.find(s => s.id === 'sys-cs-001')!
      expect(copy.personalStatus).toBe('draft')
      store.updateSkill(copy.id, {
        name: copy.name!,
        instructions: source.instructions!, // 跟來源完全相同，代表使用者沒有真的修改內容
        triggerHint: copy.triggerHint ?? '',
        isEnabled: false,
        assignedAgents: [],
      })
      expect(store.findSkill(copy.id)?.personalStatus).toBe('draft')
    })

    it('updateSkill 對非草稿狀態的個人技能不會意外改動 personalStatus', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills.find(s => s.personalStatus === 'available')!
      store.updateSkill(skill.id, {
        name: skill.name!,
        instructions: '再次修改',
        triggerHint: skill.triggerHint ?? '',
        isEnabled: skill.isEnabled ?? false,
        assignedAgents: [],
      })
      expect(store.findSkill(skill.id)?.personalStatus).toBe('available')
    })

    it('updateSkill 對 reviewing 狀態的個人技能不會意外改動 personalStatus', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills[0]
      store.submitPersonalSkill(skill.id, 'new_skill', '測試說明')
      expect(store.findSkill(skill.id)?.personalStatus).toBe('reviewing')
      store.updateSkill(skill.id, {
        name: skill.name!,
        instructions: '再次修改',
        triggerHint: skill.triggerHint ?? '',
        isEnabled: skill.isEnabled ?? false,
        assignedAgents: [],
      })
      expect(store.findSkill(skill.id)?.personalStatus).toBe('reviewing')
    })

    it('updateSkill 對 has_library 狀態的個人技能不會意外改動 personalStatus', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills.find(s => s.personalStatus === 'has_library')
      expect(skill).toBeDefined()
      store.updateSkill(skill!.id, {
        name: skill!.name!,
        instructions: '再次修改',
        triggerHint: skill!.triggerHint ?? '',
        isEnabled: skill!.isEnabled ?? false,
        assignedAgents: [],
      })
      expect(store.findSkill(skill!.id)?.personalStatus).toBe('has_library')
    })

    it('sendEditChatMessage 對草稿狀態的個人技能對話修改後，personalStatus 轉為 available', async () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      await store.sendEditChatMessage(copy.id, '請幫我調整語氣')
      const updated = store.findSkill(copy.id)
      expect(updated?.personalStatus).toBe('available')
      expect(updated?.instructions).toContain('請幫我調整語氣')
    })
  })
})
