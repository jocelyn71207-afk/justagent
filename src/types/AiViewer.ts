/** Block 相關 */

// 單一個 AiViewerBlock 的定義
interface AiViewerBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blockName: string;
  z: number;
  data: BlockTypeData;
}

// 單一個 block 的資料集定義
type BlockTypeData = {
  [K in BlockType]: {
    blockType: K;
    data: BlockData<K>;
  }
}[BlockType];

// block data 的定義, 隨者 blockType 的不同, data 的結構也會不同
type BlockData<K extends BlockType = BlockType> = BlockDataMap[K];

// 這裡定義了每種 block type 對應的 data 結構, 目前先簡單定義成 any, 之後再根據實際情況調整
type BlockDataMap = {
  IMAGE: { fileUrl: string };
  MD: any;
  HTML: any;
  TXT: any;
  PDF: any;
  EXCEL: any;
  CHART: SourceChart; // SourceChart 類型
  PPT: any;
  WORD: any;
  OTHER: any;
  REPORT: ReportAssemblyBlockData; // 報告組裝（可拖曳排序、積木盒加入/移除章節）
}

// block type 應該也是 file type 的定義, 實際還要同步於後端的定義
type BlockType = keyof BlockDataMap;

// 這個是 chart block 的 data 定義, 之後要再根據實際情況調整
type SourceChart = {
  chart: string
  data: {
    labels: string[]
    values: Record<string, number[]>[]
  }
  title?: string
  x_axis?: { title?: string }
  y_axis?: { title?: string }
}

/** 報告組裝相關 */

// 報告組裝 Block 的資料結構，sectionIds 為已組裝章節（依排序），templateName 為存成模板後的名稱
type ReportAssemblyBlockData = {
  sectionIds: string[]
  templateName: string | null
}

/** 工具箱相關 */

// 工具箱選單裡的單一個工具項目
interface ToolboxItem {
  id: string
  icon: string          // Material Symbols icon 名稱
  name: string
  description: string
  enabled: boolean       // false = 灰化、不可點擊（即將推出）
}

/** comment 相關 */

// comment 的定義, 目前是放在 AiViewer 裡面, 之後如果其他地方也會用到再抽出去
type MemoComment = {
  commentId: string
  userName: string
  userId: string
  text: string
}

// 這個是便條紙的定義, 目前先簡單定義成一個 blockId 對應多筆 comment, 之後如果有需要再調整
type MemoItem = {
  id: string
  blockId: string
  list: MemoComment[]
}

export type {
  AiViewerBlock,
  BlockTypeData,
  BlockType,
  SourceChart,
  ReportAssemblyBlockData,
  ToolboxItem,

  MemoItem,
}
