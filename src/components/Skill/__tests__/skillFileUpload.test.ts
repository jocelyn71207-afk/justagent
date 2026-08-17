import { describe, it, expect } from 'vitest'
import { extToFileType, skillFileIcon, validateSkillFiles, SKILL_FILE_MAX_COUNT, SKILL_FILE_MAX_SINGLE_SIZE, SKILL_FILE_MAX_TOTAL_SIZE } from '../skillFileUpload'
import type { SkillFile } from '@/stores/skillStore'

describe('skillFileUpload', () => {
  describe('extToFileType', () => {
    it('依副檔名判斷 FileType', () => {
      expect(extToFileType('rules.pdf')).toBe('PDF')
      expect(extToFileType('data.xlsx')).toBe('EXCEL')
      expect(extToFileType('data.xls')).toBe('EXCEL')
      expect(extToFileType('contract.docx')).toBe('WORD')
      expect(extToFileType('contract.doc')).toBe('WORD')
      expect(extToFileType('notes.txt')).toBe('TXT')
      expect(extToFileType('readme.md')).toBe('MD')
    })

    it('不支援的副檔名回傳 OTHER', () => {
      expect(extToFileType('photo.png')).toBe('OTHER')
      expect(extToFileType('noext')).toBe('OTHER')
    })
  })

  describe('skillFileIcon', () => {
    it('每種 FileType 都有對應圖示', () => {
      expect(skillFileIcon('PDF')).toBe('picture_as_pdf')
      expect(skillFileIcon('EXCEL')).toBe('table_chart')
      expect(skillFileIcon('WORD')).toBe('description')
      expect(skillFileIcon('TXT')).toBe('notes')
      expect(skillFileIcon('MD')).toBe('article')
      expect(skillFileIcon('OTHER')).toBe('insert_drive_file')
    })
  })

  describe('validateSkillFiles', () => {
    const existing: SkillFile[] = []

    it('支援類型且在限制內時通過驗證', () => {
      const file = new File(['x'.repeat(100)], 'rules.pdf', { type: 'application/pdf' })
      const result = validateSkillFiles([file], existing)
      expect(result.valid).toBe(true)
    })

    it('不支援的檔案類型會驗證失敗', () => {
      const file = new File(['x'], 'photo.png', { type: 'image/png' })
      const result = validateSkillFiles([file], existing)
      expect(result.valid).toBe(false)
    })

    it('超過單檔大小上限會驗證失敗', () => {
      const big = new File([new Uint8Array(SKILL_FILE_MAX_SINGLE_SIZE + 1)], 'big.pdf', { type: 'application/pdf' })
      const result = validateSkillFiles([big], existing)
      expect(result.valid).toBe(false)
    })

    it('超過檔案數量上限會驗證失敗', () => {
      const files = Array.from(
        { length: SKILL_FILE_MAX_COUNT + 1 },
        (_, i) => new File(['x'], `f${i}.txt`, { type: 'text/plain' })
      )
      const result = validateSkillFiles(files, existing)
      expect(result.valid).toBe(false)
    })

    it('加上既有檔案後超過檔案數量上限會驗證失敗', () => {
      const existingFiles: SkillFile[] = Array.from(
        { length: SKILL_FILE_MAX_COUNT - 1 },
        (_, i) => ({
          id: `sf-existing-${i + 1}`,
          fileName: `existing-${i + 1}.txt`,
          fileSize: 1024,
          fileType: 'TXT' as const,
          uploadedAt: new Date().toISOString(),
        })
      )
      const newFiles = Array.from(
        { length: 2 },
        (_, i) => new File(['x'.repeat(100)], `new-${i + 1}.txt`, { type: 'text/plain' })
      )
      const result = validateSkillFiles(newFiles, existingFiles)
      expect(result.valid).toBe(false)
    })

    it('加上既有檔案後超過總檔案大小上限會驗證失敗', () => {
      const existingFiles: SkillFile[] = [
        {
          id: 'sf-existing-1',
          fileName: 'large-existing.pdf',
          fileSize: SKILL_FILE_MAX_TOTAL_SIZE - 1024,
          fileType: 'PDF' as const,
          uploadedAt: new Date().toISOString(),
        },
      ]
      const newFile = new File(['x'.repeat(2048)], 'small.txt', { type: 'text/plain' })
      const result = validateSkillFiles([newFile], existingFiles)
      expect(result.valid).toBe(false)
    })
  })
})
