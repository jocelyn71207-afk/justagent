
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

// 檔案類型圖示：全站共用的「色塊 tile + material icon」語言（畫布區塊、專案檔案清單、
// 共用資源庫都吃這一份，不要各自重複定義），不用外部 SVG 那種折角+漸層邊框+
// 內建假文字/假內文線的通用素材圖——那種畫法在卡片放大看很廉價，縮到列表小圖示時
// 內建文字更是完全糊掉、讀不出字，本質上是「圖示大小跟語意脫節」的問題。
// 顏色刻意讓最常見的四種格式（PDF/PPT/Excel/Word）互相盡量不撞色——
// rust/rose 這兩個暖色系 token 放在一起太像，PPT 改用 amber 才跟 PDF 的 rose 分得開
const FILE_TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  PDF:   { icon: 'picture_as_pdf', color: 'rose',    label: 'PDF 文件' },
  PPT:   { icon: 'slideshow',      color: 'amber',   label: 'PowerPoint 簡報' },
  EXCEL: { icon: 'table_chart',    color: 'green',   label: 'Excel 表格' },
  WORD:  { icon: 'description',    color: 'blue',    label: 'Word 文件' },
  HTML:  { icon: 'code',           color: 'violet',  label: 'HTML 檔案' },
  MD:    { icon: 'article',        color: 'teal',    label: 'Markdown 文件' },
  TXT:   { icon: 'draft',          color: 'neutral', label: '純文字檔' },
  CHART: { icon: 'bar_chart',      color: 'rust',    label: '圖表檔案' },
  JSON:  { icon: 'data_object',    color: 'violet',  label: 'JSON 檔案' },
  OTHER: { icon: 'question_mark',  color: 'slate',   label: '未知的檔案類型' },
};
// 副檔名/常見別名對到上面定義好的類型，避免呼叫端各自傳 'XLSX'、'DOCX' 之類的
// 副檔名字串卻查不到對照，掉進 OTHER 的灰色問號圖示
const FILE_TYPE_ALIAS: Record<string, string> = {
  XLSX: 'EXCEL', XLS: 'EXCEL',
  DOCX: 'WORD', DOC: 'WORD',
  PPTX: 'PPT',
};
function fileTypeMeta(fileType: string) {
  const key = fileType.toUpperCase();
  return FILE_TYPE_META[FILE_TYPE_ALIAS[key] ?? key] ?? FILE_TYPE_META.OTHER;
}

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

  FILE_TYPE_META,
  fileTypeMeta,
};
