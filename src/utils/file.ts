
// file input accept 屬性用的副檔名清單
const acceptedFileExtensions = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.pdf,.xlsx,.xls,.pptx,.ppt,.txt,.md';

// 圖片類支援的 mime type 檔案格式
const imgFileTypes = [
  'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'
];
// pdf 支援的 mime type 檔案格式
const pdfFileTypes = [
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
];
// excel 支援的 mime type 檔案格式
const excelFileTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
];
// PowerPoint 支援的 mime type 檔案格式
const pptFileTypes = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
];
// txt 支援的 mime type 檔案格式
const txtFileTypes = [
  'text/plain',
  'text/plain; charset=utf-8',
];
// html 支援的 mime type 檔案格式
const htmlFileTypes = [
  'text/html',
  'application/xhtml+xml',
];
// markdown 支援的 mime type 檔案格式
const markdownFileTypes = [
  'text/markdown',
  'text/md',
];
// word 支援的 mime type 檔案格式
const wordFileTypes = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.ms-word.template.macroEnabled.12',
];

// file type 應該也是 block type 的定義, 實際還要同步於後端的定義
export type FileType = 'IMAGE' | 'MD' | 'HTML' | 'TXT' | 'PDF' | 'EXCEL' | 'CHART' | 'PPT' | 'WORD' | 'OTHER';

// 格式化檔案大小的函式，將檔案大小轉換為適當的單位（B、KB、MB、GB）
const formatFileSize = (size: number): string => {
  if (typeof size !== 'number' || isNaN(size)) return '';
  if (size < 1024) return size + ' B';
  const kb = size / 1024;
  if (kb < 1024) return kb.toFixed(2) + ' KB';
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(2) + ' MB';
  const gb = mb / 1024;
  return gb.toFixed(2) + ' GB';
}

// 根據副檔名補充 file mime type（瀏覽器有時不會自動填入）
function getFileMimeType(file: File): string {
  if (file.type) return file.type;
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.md')) return 'text/markdown';
  return '';
}

// 驗證使用者選擇的檔案（類型、數量、大小）
interface UploadedFileItem {
  file: File;
  [key: string]: any;
}

interface ValidateUploadFilesResult {
  valid: boolean;
  error?: string;
}

// 驗證使用者選擇的檔案（類型、數量、大小）
function validateUploadFiles(
  newFiles: File[],
  existingFiles: UploadedFileItem[],
  supportedTypes: string[],
  options: {
    maxCount?: number;           // 總數量上限，預設 5
    maxSingleSize?: number;      // 單檔大小上限 bytes，預設 5GB
    maxTotalSize?: number;       // 總大小上限 bytes，預設 25GB
  } = {}
): ValidateUploadFilesResult {
  const {
    maxCount = 5,
    maxSingleSize = 5 * 1024 * 1024 * 1024,
    maxTotalSize = 25 * 1024 * 1024 * 1024,
  } = options;

  // 檢查不支援的檔案類型
  const notSupportedFiles = newFiles.filter(file => !supportedTypes.includes(getFileMimeType(file)));
  if (notSupportedFiles.length) {
    const typeNames = Array.from(new Set(notSupportedFiles.map(f => getFileMimeType(f)))).join('<br>');
    return { valid: false, error: `<div>不支援的檔案類型:</div> ${typeNames}` };
  }

  // 檢查數量上限
  if (newFiles.length + existingFiles.length > maxCount) {
    return { valid: false, error: `一次最多只能上傳${maxCount}個檔案` };
  }

  // 檢查單檔與總容量
  let totalSize = existingFiles.reduce((sum, item) => sum + item.file.size, 0);
  for (const file of newFiles) {
    if (file.size > maxSingleSize) {
      return { valid: false, error: `單一檔案 "${file.name}" 超過 5GB 的限制` };
    }
    totalSize += file.size;
    if (totalSize > maxTotalSize) {
      return { valid: false, error: '上傳的檔案總容量超過 25GB 的限制' };
    }
  }

  return { valid: true };
}

export {
  imgFileTypes,
  pdfFileTypes,
  excelFileTypes,
  pptFileTypes,
  txtFileTypes,
  htmlFileTypes,
  markdownFileTypes,
  wordFileTypes,

  formatFileSize,
  getFileMimeType,
  validateUploadFiles,
  acceptedFileExtensions,
};
