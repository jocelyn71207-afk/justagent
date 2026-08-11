import type { FileType } from '@/utils/file'
import {
  pdfFileTypes, excelFileTypes, txtFileTypes, markdownFileTypes, wordFileTypes,
  validateUploadFiles,
} from '@/utils/file'
import type { SkillFile } from '@/stores/skillStore'

// file input accept 屬性；跟 utils/file.ts 的 acceptedFileExtensions 分開維護，
// 因為技能參考檔案只接受文件類型，不含圖片
export const SKILL_FILE_ACCEPT = '.pdf,.xlsx,.xls,.txt,.md,.doc,.docx'

export const SKILL_FILE_MAX_COUNT = 5
export const SKILL_FILE_MAX_SINGLE_SIZE = 20 * 1024 * 1024   // 20MB
export const SKILL_FILE_MAX_TOTAL_SIZE = 60 * 1024 * 1024    // 60MB

const EXT_TO_FILE_TYPE: Record<string, FileType> = {
  pdf: 'PDF',
  xlsx: 'EXCEL', xls: 'EXCEL',
  doc: 'WORD', docx: 'WORD',
  txt: 'TXT',
  md: 'MD',
}

export function extToFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_FILE_TYPE[ext] ?? 'OTHER'
}

const FILE_TYPE_ICON: Record<FileType, string> = {
  PDF: 'picture_as_pdf',
  EXCEL: 'table_chart',
  WORD: 'description',
  PPT: 'insert_drive_file',
  TXT: 'notes',
  MD: 'article',
  IMAGE: 'insert_drive_file',
  HTML: 'insert_drive_file',
  CHART: 'insert_drive_file',
  OTHER: 'insert_drive_file',
}

export function skillFileIcon(type: FileType): string {
  return FILE_TYPE_ICON[type] ?? 'insert_drive_file'
}

// 技能所需檔案是純 metadata（不上傳到任何後端），既有 validateUploadFiles() 的
// existingFiles 參數只用得到 `.file.size`，用假的 File shape 轉接即可
export function validateSkillFiles(newFiles: File[], existing: SkillFile[]) {
  const supportedTypes = [
    ...pdfFileTypes, ...excelFileTypes, ...txtFileTypes, ...markdownFileTypes, ...wordFileTypes,
  ]
  const existingAsItems = existing.map(f => ({ file: { size: f.fileSize } as File }))
  return validateUploadFiles(newFiles, existingAsItems, supportedTypes, {
    maxCount: SKILL_FILE_MAX_COUNT,
    maxSingleSize: SKILL_FILE_MAX_SINGLE_SIZE,
    maxTotalSize: SKILL_FILE_MAX_TOTAL_SIZE,
  })
}
