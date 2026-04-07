import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import type { AiViewerBlock, BlockTypeData, BlockType, MemoItem } from '@/types/AiViewer'
import { isTouchDeviceFn } from '@/utils/utils'
import popDialog from '@/services/popDialog';
import {
  imgFileTypes,
  pdfFileTypes,
  excelFileTypes,
  pptFileTypes,
  txtFileTypes,
  htmlFileTypes,
  markdownFileTypes,
  wordFileTypes,
} from '@/utils/file';

const centerSpaceX = 60; // 建立新的區塊時,在畫布的初始座標 (左上角預留空間)
const centerSpaceY = 70; // 建立新的區塊時,在畫布的初始座標 (左上角預留空間)

// 各檔案類型對應的圖示
import pdfIcon from '@/assets/fileTypeIcon/pdf.png';
import excelIcon from '@/assets/fileTypeIcon/excel.png';
import pptIcon from '@/assets/fileTypeIcon/ppt.png';
import txtIcon from '@/assets/fileTypeIcon/txt.png';
import htmlIcon from '@/assets/fileTypeIcon/html.png';
import mdIcon from '@/assets/fileTypeIcon/md.png';
import wordIcon from '@/assets/fileTypeIcon/word.png';

export const useAiviewerStore = defineStore('AiviewerStore', () => {
  const lookDebug = ref(false);          // 是否顯示除錯區塊
  const touchDebug = ref(true) as any;   // 觸控專用的除錯變數
  const debugCount = ref(0);             // 方便再手機上面除錯用的點擊次數叫出 debug 區塊用

  // 能支援本地端上傳的 mime type 檔案類型
  const supportedFileTypes = [
    ...imgFileTypes,
    ...pdfFileTypes,
    ...excelFileTypes,
    ...pptFileTypes,
    ...txtFileTypes,
    // ...htmlFileTypes, // 注意: html 檔不能上傳, 但是可以重畫布帶入
    ...markdownFileTypes,
    ...wordFileTypes,
  ];

  // 圖檔 能支援本地端上傳的 mime type 檔案類型
  const supportedImgFileTypes = imgFileTypes;

  // 各檔案 mime type 類型對應的圖示
  const useIconFileTypes = ref<any>({
    // pdf
    PDF: pdfIcon,
    'application/pdf': pdfIcon,
    'application/x-pdf': pdfIcon,
    'application/acrobat': pdfIcon,
    'applications/vnd.pdf': pdfIcon,
    // excel
    EXCEL: excelIcon,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': excelIcon,
    'application/vnd.ms-excel': excelIcon,
    'application/vnd.ms-excel.sheet.macroEnabled.12': excelIcon,
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12': excelIcon,
    // powerPoint
    PPT: pptIcon,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': pptIcon,
    'application/vnd.ms-powerpoint': pptIcon,
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12': pptIcon,
    'application/vnd.ms-powerpoint.slideshow.macroEnabled.12': pptIcon,
    // txt
    TXT: txtIcon,
    'text/plain': txtIcon,
    'text/plain; charset=utf-8': txtIcon,
    // html
    HTML: htmlIcon,
    'text/html': htmlIcon,
    'application/xhtml+xml': htmlIcon,
    // markdown
    MD: mdIcon,
    'text/markdown': mdIcon,
    // word
    WORD: wordIcon,
    'application/msword': wordIcon,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': wordIcon,
    'application/vnd.ms-word.document.macroEnabled.12': wordIcon,
    'application/vnd.ms-word.template.macroEnabled.12': wordIcon,
  });
  // 各檔案 mime type 類型對應的 BlockType
  function getBlockTypeByFileMime(fileMime: string): BlockType {
    console.log('getBlockTypeByFileMime >>> ', fileMime);

    if (pdfFileTypes.indexOf(fileMime) >= 0) {
      return 'PDF';
    } else if (excelFileTypes.indexOf(fileMime) >= 0) {
      return 'EXCEL';
    } else if (pptFileTypes.indexOf(fileMime) >= 0) {
      return 'PPT';
    } else if (txtFileTypes.indexOf(fileMime) >= 0) {
      return 'TXT';
    } else if (htmlFileTypes.indexOf(fileMime) >= 0) {
      return 'HTML';
    } else if (markdownFileTypes.indexOf(fileMime) >= 0) {
      return 'MD';
    } else if (imgFileTypes.indexOf(fileMime) >= 0) {
      return 'IMAGE';
    } else if (wordFileTypes.indexOf(fileMime) >= 0) {
      return 'WORD';
    } else {
      return 'OTHER';
    }
  }

  // 偵測是否為觸控裝置
  const isTouchDevice: ComputedRef<boolean> = computed(isTouchDeviceFn);

  // konva.js 主場景物件
  const mainStage: Ref<any> = ref(null);

  // 使用者輸入參考  TODO... 之後再定義 interface
  const userInputModal = ref({
    msg: '',                          // 使用者輸入的文字內容
    userUploadFiles: [] as File[],    // 使用者上傳的檔案列表
    aiFiles: [] as string[],          // 使用者使用 ai 產生的檔案列表
  }) as Ref<any>;
  // 使用者輸入框是否聚焦中
  const isFocusUserInput = ref(false) as Ref<boolean>;

  // 是否進入檢視 comment 清單 一覽模式
  const isShowCommentListView = ref(false) as Ref<boolean>;

  // 是否進入檢視 Block 清單 一覽模式
  const isShowBlockListView = ref(false) as Ref<boolean>;

  // 是否進入檢視 專案檔案清單 一覽模式
  const isShowFileListView = ref(false) as Ref<boolean>;

  // 是否開啟對話列表 Modal
  const isOpenConversationListModal = ref(false) as Ref<boolean>;

  // 目前選中的對話 ID
  const currentConversationId = ref('conv1') as Ref<string>;

  // 專案檔案清單資料
  const projectFiles = ref([
    { name: 'AW26 Product Descriptions_翻譯.xlsx', fileType: 'EXCEL', size: 2834016 },
    { name: 'AW26 Product Descriptions.xlsx', fileType: 'EXCEL', size: 2834016 },
    { name: 'AW26 Product Descriptions_trade_mark.txt', fileType: 'TXT', size: 133 },
  ]);

  // 使用者畫布中的區塊  TODO... 之後再定義 interface
  const INITIAL_BLOCKS = [
    {
      id: 'init-txt-aw26',
      x: centerSpaceX,
      y: centerSpaceY,
      width: 500,
      height: 300,
      blockName: 'AW26 Product Descriptions_trade_mark.txt',
      z: 1,
      data: {
        blockType: 'TXT',
        data: {
          content: 'HYPER-COMF®\nSpider Rubber®\nFuseLock™\nGORE TEX\nVibram\nCordura\nREPREVE®\nMAX-COMF®\nHYPER-COMF®\nSpider Rubber®\nGORE-TEX\nVibram®',
        }
      }
    },
    {
      id: 'init-excel-aw26-orig',
      x: centerSpaceX,
      y: centerSpaceY + 340,
      width: 780,
      height: 420,
      blockName: 'AW26 Product Descriptions.xlsx',
      z: 2,
      data: {
        blockType: 'EXCEL',
        data: { fileUrl: `${import.meta.env.BASE_URL}AW26%20Product%20Descriptions.xlsx` }
      }
    },
    {
      id: 'init-excel-aw26-trans',
      x: centerSpaceX + 820,
      y: centerSpaceY + 340,
      width: 780,
      height: 420,
      blockName: 'AW26 Product Descriptions_翻譯.xlsx',
      z: 3,
      data: {
        blockType: 'EXCEL',
        data: { fileUrl: `${import.meta.env.BASE_URL}AW26%20Product%20Descriptions_%E7%BF%BB%E8%AD%AF.xlsx` }
      }
    },
  ];
  const aiViewerBlocks = ref([...INITIAL_BLOCKS]) as Ref<any[]>;
  // 目前選中的內容區塊 ID
  const nowChoiceAiViewerId = ref('') as Ref<string>;
  // 是否為多選模式
  const isMultiChoiceAiViewerMode = ref(false);
  // 目前多選的內容區塊 ID
  const nowMultiChoiceAiViewerIds = ref([]) as Ref<string[]>;
  // 已複製的內容區塊 JSON string 參考
  const copyAiViewerBlock = ref(null) as Ref<any | null>;
  // 是否停止複製與貼上內容區塊
  const isStopCopyPasteAiViewerBlock = ref(false);
  // 便條紙資料  TODO... 後端不知道是會落在block內還是另外給勒？  TODO... 之後再定義 interface
  const memos = ref([
    {
      id: 'memo1',
      blockId: 'testForm',
      list: [
        { commentId:'cm1', userName: 'Lucasssssssssssssssssssssss', userId: 'a', text: '嗚嗚嗚嗚嗚' },
        { commentId:'cm2', userName: 'Kari', userId: 'b', text: '哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈' },
        { commentId:'cm3', userName: 'Kari', userId: 'b', text: 'OK' },
        { commentId:'cm4', userName: 'Lucas', userId: 'a', text: 'no ok 啦' },
      ]
    },
  ]) as Ref<MemoItem[]>;
  // 顯示便條紙內容的區塊 ID
  const showCommentByBlockId = ref('') as Ref<string>;

  // 單一小區塊進入放大滿版
  const fullAiViewerBlockId = ref(null) as Ref<string | null>;
  // 是否進入等比例放大縮小狀態
  const isAspectRatioMode = ref(false);


  // 內容區塊取得下一個 z-index 方法
  function calcNextZindex(): number {
    let maxZ = 1;
    aiViewerBlocks.value.forEach((item: any) => {
      if (item.z > maxZ) {
        maxZ = item.z;
      }
    });
    return maxZ + 1;
  }

  /** 判斷新增的 block 座標
   * @param tempBlock 臨時區塊資料
   * @param checkCount 檢查次數 (避免無限遞迴用)
  */
  function checkCreatePos(tempBlock: AiViewerBlock, checkCount = 0): AiViewerBlock {
    // 如果沒有其他區塊,直接返回
    if (aiViewerBlocks.value.length === 0) {
      return tempBlock;
    }

    // 先取得當前可視範圍
    const stage = mainStage.value;                // konva.js 主場景物件
    if (!stage) return tempBlock;
    const scale = stage.scaleX();                 // 目前縮放比例
    const visibleWidth = stage.width() / scale;   // 可視寬度
    const visibleHeight = stage.height() / scale; // 可視高度
    const offsetX = stage.x() / scale;            // 目前偏移量 X
    const offsetY = stage.y() / scale;            // 目前偏移量 Y
    const viewLeft = -offsetX;                    // 可視區域左邊界 X
    const viewTop = -offsetY;                     // 可視區域上邊界 Y
    const viewRight = viewLeft + visibleWidth;    // 可視區域右邊界 X
    const viewBottom = viewTop + visibleHeight;   // 可視區域下邊界 Y

    console.log('取得當前可視範圍', {
      '目前縮放比例': scale,
      '可視寬度': visibleWidth,
      '可視高度': visibleHeight,
      '目前偏移量 X': offsetX,
      '目前偏移量 Y': offsetY,
      '可視區域左邊界 X': viewLeft,
      '可視區域上邊界 Y': viewTop,
      '可視區域右邊界': viewRight,
      '可視區域下邊界 Y': viewBottom
    });

    let isOverlap = false;
    aiViewerBlocks.value.forEach((item: AiViewerBlock) => {
      // 檢查是否有跟其他區塊座標與大小完全重疊
      if (
        item.x === tempBlock.x &&
        item.y === tempBlock.y &&
        item.width === tempBlock.width &&
        item.height === tempBlock.height
      ) {
        isOverlap = true;
        console.log('有重疊', item.id);
        // 如果有重疊，則將新區塊往右下角移動一定距離
        tempBlock.x = item.x + 20;
        tempBlock.y = item.y + 20;
      }
    });

    if (isOverlap) {
      // 如果移動後超出可視範圍，則重置到畫面中央位置
      if (tempBlock.x + tempBlock.width > viewRight) {
        tempBlock.x = viewLeft + centerSpaceX;
      }
      if (tempBlock.y + tempBlock.height > viewBottom) {
        tempBlock.y = viewTop + centerSpaceY;
      }
      if (checkCount <= 10) {
        console.log('isOverlap=', isOverlap);
        console.log('遞迴檢查: ', checkCount);
        return checkCreatePos(tempBlock, checkCount+1); // 遞迴檢查
      } else {
        // 超過遞迴次數就不檢查了,強制使用左上角的位置
        tempBlock.x = centerSpaceX;
        tempBlock.y = centerSpaceY;
      }
    }

    return tempBlock;
  }

  // 送出使用者輸入內容
  function sendUserInput(): void {
    // TODO... 這邊先造假,如果是這幾個 id 就直接呼叫 testCreatMsg
    const testIds = [
      'testHtmlFileA', 'testHtmlFileB', 'testHtmlFileC',
      'test_report_251210',
      'testForm',
      'chartA', 'chartB', 'chartC', 'chartD', 'chartE',
      'excelA', 'excelB', 'excelC', 'excelD', 'excelE',
      'pdfA', 'pdfB',
      'txtA', 'txtB',
      'mdA', 'mdB',
      'imgA', 'imgB'
    ];

    // 新增: 判斷是否為檔案名稱 (結尾為常見副檔名)
    const fileExts = ['.xlsx', '.xls', '.pdf', '.txt', '.md', '.png', '.jpg', '.html', '.docx', '.pptx'];
    const msg = userInputModal.value.msg.trim();
    const hasFileExt = fileExts.some(ext => msg.toLowerCase().endsWith(ext));

    if (testIds.includes(msg) || hasFileExt) {
      testCreatMsg();
      return;
    }
    console.log('sendUserInput >>> ', userInputModal.value);

    // TODO... 這邊之後應該是 ajax 或 websocket 傳送到後端處理, 然後看是 ajax 回傳結果,
    // 還是 websocket 推播結果, 再來處理顯示在畫布上.
    // 目前先在畫布建立一個新的區塊來模擬,
    if (userInputModal.value.userUploadFiles.length) {
      userInputModal.value.userUploadFiles.forEach((item: any, index: number) => {
        console.log('item >>> ...', item.preview);

        // TODO... 之後不用這樣處理, 因為是後端要提供 blockType
        let blockData: BlockTypeData = {
          blockType: 'OTHER',
          data: {}
        };
        // 先檢查是否為 markdown, 但是是透過檔案副檔名來判斷, 因為 markdown 的檔案類型通常是空字串
        if (blockData.blockType === 'OTHER' && item.file.name.toLowerCase().endsWith('.md')) {
          blockData = {
            blockType: 'MD',
            data: {}
          };
        }
        // blockType 是否為圖片
        if (blockData.blockType === 'OTHER' && imgFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'IMAGE',
            data: {
              fileUrl: item.preview,
            }
          };
        }
        // blockType 是否為 pdf
        if (blockData.blockType === 'OTHER' && pdfFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'PDF',
            data: {}
          };
        }
        // blockType 是否為 excel
        if (blockData.blockType === 'OTHER' && excelFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'EXCEL',
            data: {}
          };
        }
        // blockType 是否為 PowerPoint
        if (blockData.blockType === 'OTHER' && pptFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'PPT',
            data: {}
          };
        }
        // blockType 是否為 txt
        if (blockData.blockType === 'OTHER' && txtFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'TXT',
            data: {}
          };
        }
        // blockType 是否為 Html
        if (blockData.blockType === 'OTHER' && htmlFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'HTML',
            data: {}
          };
        }
        // blockType 是否為 Word
        if (blockData.blockType === 'OTHER' && wordFileTypes.indexOf(item.file.type) >= 0) {
          blockData = {
            blockType: 'WORD',
            data: {}
          };
        }

        // TODO... interface 之後再定義
        let temp: AiViewerBlock = {
          id: 'msg-' + index + Date.now(),
          x: centerSpaceX * (index + 1) - (mainStage.value?.x() ?? 0),
          y: centerSpaceY * (index + 1) - (mainStage.value?.y() ?? 0),
          width: 200,
          height: 200,
          blockName: 'new block',
          z: calcNextZindex(),
          data: blockData
        }
        temp = checkCreatePos(temp);
        aiViewerBlocks.value.push(temp);
      });
      return;
    }
    // 先假設是一般文字發話
    let temp: AiViewerBlock = {
      id: 'msg-' + Date.now(),
      x: centerSpaceX - (mainStage.value?.x() ?? 0),
      y: centerSpaceY - (mainStage.value?.y() ?? 0),
      width: 200,
      height: 200,
      blockName: 'new block',
      z: calcNextZindex(),
      data: {
        blockType: 'OTHER',
        data: {
          msg: userInputModal.value.msg
        }
      }
    }
    temp = checkCreatePos(temp);
    aiViewerBlocks.value.push(temp);
  }

  // 貼上複製的 block 方法
  function pasteBlock(blockData: AiViewerBlock, notCalcPos = false): AiViewerBlock {
    console.log('貼上複製 blockData >>> ', blockData);

    let temp = JSON.parse(JSON.stringify(blockData)) as AiViewerBlock;

    // TODO... 產生新的 ID, 先使用 timestemp 之後在思考要怎麼決定 id
    // 暫時用如果複製的id已經是曾經複製過的, 就用 '_copy_' 取前面的部分再加上新的 timestemp
    // 之後應該是呼叫後端api產生新的id才對
    temp.id = (temp.id.indexOf('_copy_') > 0) ?
      temp.id.split('_copy_')[0] + '_copy_' + Date.now() :
      temp.id + '_copy_' + Date.now();

    if (!notCalcPos) {
      temp.x = centerSpaceX - (mainStage.value?.x() ?? 0);
      temp.y = centerSpaceY - (mainStage.value?.y() ?? 0);
    }

    temp.z = calcNextZindex();
    temp = checkCreatePos(temp);

    aiViewerBlocks.value.push(temp);

    return temp; // 回傳是為了讓鍵盤能重複貼上用
  }

  // 刪除區塊方法
  function deleteBlock(blockId: string): void {
    popDialog.confirm('確定刪除此區塊？', () => {
      // TODO... callAjax or websocket 傳給後端
      console.log('刪除區塊 id >>> ', blockId);

      // 從 aiViewerBlocks 中移除該區塊
      aiViewerBlocks.value.splice(
        aiViewerBlocks.value.findIndex((i: any) => i.id === blockId),
        1,
      );
      // 如果移除的區塊是目前選中的區塊,則清空選中狀態
      if (blockId === nowChoiceAiViewerId.value) {
        nowChoiceAiViewerId.value = "";
      }
      // TODO... 這邊還要思考是否要檢查便條紙的部分

    });
  }

  // 修改區塊名稱方法
  function renameBlock(blockId: string, newName: string): void {
    console.log('修改區塊名稱 >>> ', blockId, newName);
    // TODO... callAjax or websocket 傳給後端記錄

    // 在 aiViewerBlocks 中找到該區塊並修改名稱
    const block = aiViewerBlocks.value.find((i: any) => i.id === blockId);
    if (block) {
      block.blockName = newName;
    }
    console.log('修改後的 aiViewerBlocks >>> ', aiViewerBlocks.value);
  }

  // TODO... 開發測試用 start
  const testExcelOptions = {
    // mode: (isTouchDevice.value) ? 'read' : 'edit', // read | edit
    mode: 'read',
    showToolbar: false, // 是否顯示工具列
    showBottomBar: true, // 是否顯示底部sheet列
    showGrid: true,
    showContextmenu: false, // 是否顯示右鍵選單
    row: {
      //len: 3,   // 注意: 這樣等於寫死row數,可是不設定套件預設就100row (之後可能要用拿後端資料後,前端在決定要顯示多少row)
      height: 18, // row 高度 default 25
    },
    col: {
      // len: 26, // 注意: 這樣等於寫死col數,可是不設定套件預設就26row (之後可能要用拿後端資料後,前端在決定要顯示多少row)
      width: 80,  // col 寬度 default 100
    },
    autoFocus: false, // 是否自動聚焦到表格 (注意官方文件沒寫這個參數, 但實際套件有支援)
  };
  const testMap: any = {
    'chartA': {
      blockType: 'CHART',
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    'chartB': {
      blockType: 'CHART',
      type: 'line',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [{
          label: 'My First dataset',
          data: [0, 10, 5, 2, 20, 30, 45],
          backgroundColor: 'rgb(255, 99, 132)', // 點的顏色
          borderColor: 'rgb(255, 99, 132)', // 線的顏色
          pointRadius: 7, // 點的大小
          pointHoverRadius: 10, // 滑鼠移到點上時放大
        }]
      },
      options: {}
    },
    'chartC': {
      blockType: 'CHART',
      data: [{
        type: 'bar',
        x: [1, 2, 3, 4],
        y: [5, 10, 2, 8],
        marker: {
          color: '#C8A2C8',
          line: {
            width: 2.5
          }
        }
      }],
      layout: {
        title: {
          text: 'Responsive to window size!'
        },
        font: {size: 18},
        margin: { l: 10, r: 10, t: 10, b: 10 },
        autosize: true,
        showlegend: false,
        xaxis: { automargin: true },
        yaxis: { automargin: true },
      }
    },
    'chartD': {
      blockType: 'CHART',
      data: {
        "node": "2025年每月銷售量",
        "chart": "line",
        "data": {
          "labels": [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月"
          ],
          "values": [
            {
              "銷售量": [
                1500,
                1800,
                2000,
                2200,
                2500,
                2700,
                3000,
                3200,
                3500,
                3700,
                4000,
                4500
              ],
              "庫存量": [
                1000,
                110,
                150,
                1000,
                500,
                1000,
                2000,
                600,
                1010,
                210,
                1008,
                170
              ],
              "進貨量": [
                2000,
                1600,
                2300,
                2100,
                2800,
                2600,
                3200,
                3000,
                3800,
                3500,
                4200,
                4800
              ],
              "退貨量": [
                120,
                95,
                180,
                140,
                210,
                160,
                250,
                200,
                310,
                270,
                380,
                430
              ]
            }
          ]
        },
        "title": "2025年每月銷售量",
        "x_axis": {
          "title": "分類"
        },
        "y_axis": {
          "title": "數值"
        }
      },
    },
    'chartE': {
      blockType: 'CHART',
      data: {
        "node": "2025年每月銷售量分地區",
        "chart": "bar",
        "data": {
          "labels": [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月"
          ],
          "values": [
            {
              "地區A": [
                500,
                600,
                700,
                800,
                900,
                1000,
                1100,
                1200,
                1300,
                1400,
                1500,
                1600
              ]
            },
            {
              "地區B": [
                400,
                500,
                600,
                700,
                800,
                900,
                1000,
                1100,
                1200,
                1300,
                1400,
                1500
              ]
            },
            {
              "地區C": [
                600,
                700,
                800,
                900,
                1000,
                1100,
                1200,
                1300,
                1400,
                1500,
                1600,
                1700
              ]
            }
          ]
        },
        "title": "2025年每月銷售量分地區",
        "x_axis": {
          "title": "分類"
        },
        "y_axis": {
          "title": "數值"
        }
      }
    },
    'excelA': {
      blockType: 'EXCEL',
      options: testExcelOptions,
      data: [
        {
          name: 'Sheet1',
          rows: {
            0: {
              cells: {
                0:{ text: '滷卡酥酥酥酥酥酥酥酥酥酥酥酥酥酥酥酥' },
                1:{ text: '嘿嘿嘿' },
                2:{ text: '哈哈哈' },
              },
            },
            1: {cells: { 0: { text: '500' }}},
            2: {cells: { 0: { text: '200' }}},
            3: {cells: { 0: { text: '=SUM(A2:A3)' }}},
            110: {cells: { 28: { text: '嗚嗚嗚' }}}, // 測試很下面很右邊的儲存格(看AiViewerContentBox.vue的計算最大列與最大欄程式用)
          },
          cols: {
            0: { width: 250 }, // 對應 A 欄的樣式
          }
        }, {
          name: 'Sheet2',
          rows: {
            0: {
              cells: {
                1: { text: '這是第二個工作表' },
              },
            },
          },
          cols: {
            1: { width: 134 },  // 對應 B 欄的樣式
          },
        },
      ],
    },
    'excelB': {
      blockType: 'EXCEL',
      options: testExcelOptions,
      data: [
        {
          name: 'Sheet1',
          rows: [
            {
              cells: [
                { text: '手機型號' },
                { text: '單價' },
                { text: '數量' },
                { text: '總成本' },
              ]
            },
            {
              cells: [
                { text: 'a-360-001' },
                { text: '150' },
                { text: '1000' },
                { text: '=B2*C2' },
              ]
            },
            {
              cells: [
                { text: 'b-360-002' },
                { text: '100' },
                { text: '300' },
                { text: '=B3*C3' },
              ]
            }
          ]
        }
      ]
    },
    'excelC': {
      blockType: 'EXCEL',
      options: testExcelOptions,
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/0101-0331 sales raw data for TEVA.xls'
      }
    },
    'excelD': {
      blockType: 'EXCEL',
      options: testExcelOptions,
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/AW26 Product Descriptions_translated.xlsx'
      }
    },
    'excelE': {
      blockType: 'EXCEL',
      options: testExcelOptions,
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/AW26+Product+Descriptions_translated_all_columns.xlsx'
      }
    },
    'pdfA': {
      blockType: 'PDF',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/Kopernio快速教學手冊.pdf'
      }
    },
    'pdfB': {
      blockType: 'PDF',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/創新創業新秀選拔_莫比機器人0924 2.pdf'
      }
    },
    'txtA': {
      blockType: 'TXT',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/Teva_AW26_GBC_GrowtheCore_JB_Final_agent_translated.txt',
      }
    },
    'txtB': {
      blockType: 'TXT',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/AW26+Product+Descriptions_trade_mark.txt',
      }
    },
    'testHtmlFileA': {
      blockType: 'HTML',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/untitled.html'
      }
    },
    'testHtmlFileB': {
      blockType: 'HTML',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/LangChain & LangGraph 1.0 里程碑發布.html'
      }
    },
    'testHtmlFileC': {
      blockType: 'HTML',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/testSecurity.html'
      }
    },
    'test_report_251210': {
      blockType: 'HTML',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/test_report_251210.html'
      }
    },
    'mdA': {
      blockType: 'MD',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/testMarkdown.md',
      }
    },
    'mdB': {
      blockType: 'MD',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/markdownAll.md',
      }
    },
    'imgA': {
      blockType: 'IMAGE',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/c8.png',
      }
    },
    'imgB': {
      blockType: 'IMAGE',
      data: {
        fileUrl: 'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/嘿嘿嘿.jpg',
      }
    }
  };
  function testCreatMsg() {
    const testId = userInputModal.value.msg.trim();
    console.log('testCreatMsg testId=', testId);
    if (!testId) return;
    if (aiViewerBlocks.value.find((item: any) => item.id === testId)) return; // 不可重複

    let W = 200;
    let H = 200;

    W = (testId === 'chartA' || testId === 'chartB' || testId === 'chartC' || testId === 'chartD' || testId === 'chartE') ? 600 : W;
    H = (testId === 'chartA' || testId === 'chartB' || testId === 'chartC' || testId === 'chartD' || testId === 'chartE') ? 400 : H;

    W = (testId === 'excelA' || testId === 'excelB') ? 800 : W;
    H = (testId === 'excelA' || testId === 'excelB') ? 400 : H;

    W = (testId === 'excelC' || testId === 'excelD' || testId === 'excelE') ? 800 : W;
    H = (testId === 'excelC' || testId === 'excelD' || testId === 'excelE') ? 400 : H;

    W = (testId === 'pdfA' || testId === 'pdfB') ? 800 : W;
    H = (testId === 'pdfA' || testId === 'pdfB') ? 450 : H;

    W = (testId === 'txtA' || testId === 'txtB') ? 500 : W;
    H = (testId === 'txtA' || testId === 'txtB') ? 300 : H;

    W = (testId === 'testHtmlFileA' || testId === 'testHtmlFileB' || testId === 'testHtmlFileC' || testId === 'test_report_251210') ? 640 : W;
    H = (testId === 'testHtmlFileA' || testId === 'testHtmlFileB' || testId === 'testHtmlFileC' || testId === 'test_report_251210') ? 480 : H;

    W = (testId === 'mdA' || testId === 'mdB') ? 500 : W;
    H = (testId === 'mdA' || testId === 'mdB') ? 300 : H;

    // 造假資料
    let temp: any = testMap[testId] || null;

    // 如果 testMap 沒有，但訊息看起來像檔案，則建立動態資料 (抓取 public/ 下的檔案)
    if (!temp) {
      const lowerId = testId.toLowerCase();
      if (lowerId.endsWith('.xlsx') || lowerId.endsWith('.xls')) {
        temp = {
          blockType: 'EXCEL',
          options: testExcelOptions,
          data: { fileUrl: '/' + testId }
        }
        W = 800; H = 400;
      } else if (lowerId.endsWith('.pdf')) {
        temp = { blockType: 'PDF', data: { fileUrl: '/' + testId } }
        W = 800; H = 450;
      } else if (lowerId.endsWith('.txt')) {
        temp = { blockType: 'TXT', data: { fileUrl: '/' + testId } }
        W = 500; H = 300;
      } else if (lowerId.endsWith('.md')) {
        temp = { blockType: 'MD', data: { fileUrl: '/' + testId } }
        W = 500; H = 300;
      } else if (lowerId.endsWith('.png') || lowerId.endsWith('.jpg') || lowerId.endsWith('.jpeg')) {
        temp = { blockType: 'IMAGE', data: { fileUrl: '/' + testId } }
      } else if (lowerId.endsWith('.html')) {
        temp = { blockType: 'HTML', data: { fileUrl: '/' + testId } }
        W = 640; H = 480;
      }
    }

    console.log('testCreatMsg temp=', temp);
    if (!temp) return; // 如果還是沒有，就不處理

    let tempMsg: AiViewerBlock = {
      id: testId,
      x: centerSpaceX - (mainStage.value?.x() ?? 0),
      y: centerSpaceY - (mainStage.value?.y() ?? 0),
      width: W,
      height: H,
      blockName: testId,
      z: calcNextZindex(),
      data: temp
    };

    tempMsg = checkCreatePos(tempMsg);

    // 加入畫布
    aiViewerBlocks.value.push(tempMsg);
  }
  // 報告生成後自動加入畫布
  function addReportBlock(fileUrl: string, blockName: string) {
    let temp: any = {
      id: 'report-' + Date.now(),
      x: centerSpaceX - (mainStage.value?.x() ?? 0),
      y: centerSpaceY - (mainStage.value?.y() ?? 0),
      width: 640,
      height: 480,
      blockName,
      z: calcNextZindex(),
      data: { blockType: 'HTML', data: { fileUrl } }
    };
    temp = checkCreatePos(temp);
    aiViewerBlocks.value.push(temp);
  }

  // TODO... 開發測試用 end



  // 重設 AiViewerStore 狀態
  function resetAiViewerState(): void {
    userInputModal.value = { msg: '', userUploadFiles: [], aiFiles: [] };
    isFocusUserInput.value = false;
    isShowCommentListView.value = false;
    isShowBlockListView.value = false;
    isShowFileListView.value = false;
    isOpenConversationListModal .value = false;
    aiViewerBlocks.value = [...INITIAL_BLOCKS];
    nowChoiceAiViewerId.value = '';
    isMultiChoiceAiViewerMode.value = false;
    nowMultiChoiceAiViewerIds.value = [];
    copyAiViewerBlock.value = null;
    isStopCopyPasteAiViewerBlock.value = false;
    memos.value = [];
    showCommentByBlockId.value = '';
    fullAiViewerBlockId.value = null;
    isAspectRatioMode.value = false;
  }

  return {
    touchDebug,
    lookDebug,
    debugCount,

    isTouchDevice,
    supportedFileTypes,
    supportedImgFileTypes,
    useIconFileTypes,
    getBlockTypeByFileMime,

    mainStage,
    userInputModal,
    isFocusUserInput,
    isShowCommentListView,
    isShowBlockListView,
    isShowFileListView,
    isOpenConversationListModal,
    currentConversationId,
    projectFiles,
    aiViewerBlocks,
    nowChoiceAiViewerId,
    isMultiChoiceAiViewerMode,
    nowMultiChoiceAiViewerIds,
    copyAiViewerBlock,
    isStopCopyPasteAiViewerBlock,

    memos,
    showCommentByBlockId,
    fullAiViewerBlockId,
    isAspectRatioMode,

    calcNextZindex,
    sendUserInput,
    pasteBlock,
    deleteBlock,
    renameBlock,
    addReportBlock,

    resetAiViewerState,
  }
})
