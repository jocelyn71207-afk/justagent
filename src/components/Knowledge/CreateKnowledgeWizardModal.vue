<template>
  <compModal
    class="CreateKnowledgeWizardModal"
    v-model="isOpenModal"
    :width="660"
    :showClose="!isGenerating && !isChecking"
  >
    <template #title>
      <div class="wizard-header-box">
        <h4 class="wizard-modal-title">建立知識條目</h4>
        <div class="wizard-steps">
          <template v-for="(label, i) in stepLabels" :key="i">
            <div :class="['wizard-step-item', { 'is-active': currentStep >= i + 1 }]">
              <div :class="['wizard-step-dot', { 'is-done': currentStep > i + 1, 'is-active': currentStep === i + 1 }]">
                <i v-if="currentStep > i + 1" class="material-symbols-outlined">check</i>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="wizard-step-label">{{ label }}</span>
            </div>
            <div v-if="i < stepLabels.length - 1" :class="['wizard-step-connector', { 'is-done': currentStep > i + 1 }]"></div>
          </template>
        </div>
      </div>
    </template>

    <div class="wizard-modal-body">
      <!-- 來源檔案資訊列 -->
      <div class="wizard-file-info">
        <div class="file-icon-box">
          <i class="material-symbols-outlined">{{ fileTypeIcon }}</i>
        </div>
        <div class="file-text-content">
          <span class="file-label">來源檔案</span>
          <span class="file-name">{{ file?.fileName }}</span>
        </div>
      </div>

      <!-- ── Step 1：相似性檢查 ── -->
      <div v-if="currentStep === 1" class="wizard-step-content">
        <div v-if="isChecking" class="wizard-state-center">
          <div class="ai-pulse-icon">
            <i class="material-symbols-outlined">manage_search</i>
          </div>
          <div class="status-title">正在掃描相似知識條目...</div>
          <div class="status-desc">系統正在比對知識庫中的現有條目，確保內容不重複</div>
        </div>

        <div v-else>
          <!-- 有相似項目 -->
          <template v-if="similarItems.length">
            <div class="check-result-banner check-result-banner--warning">
              <i class="material-symbols-outlined">warning</i>
              <div class="banner-text">
                <div class="banner-title">發現 {{ similarItems.length }} 個可能相關的現有條目</div>
                <div class="banner-desc">建議先檢查現有內容，您仍可繼續建立新條目或選擇編輯舊有條目。</div>
              </div>
            </div>
            <div class="similar-items-list">
              <div class="similar-item-card" v-for="item in similarItems" :key="item.id">
                <div class="item-main">
                  <div class="item-icon">
                    <i class="material-symbols-outlined">menu_book</i>
                  </div>
                  <div class="item-info">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-meta">分類：{{ item.category || '未分類' }} · 版本：{{ item.currentVersion }}</div>
                  </div>
                </div>
                <span :class="['status-badge', `status-badge--${item.status}`]">
                  {{ statusLabelMap[item.status] }}
                </span>
              </div>
            </div>
          </template>

          <!-- 無相似項目 -->
          <div v-else class="check-result-banner check-result-banner--success">
            <i class="material-symbols-outlined">check_circle</i>
            <div class="banner-text">
              <div class="banner-title">未發現重複條目</div>
              <div class="banner-desc">知識庫中目前沒有與此檔案內容相似的條目，您可以放心地開始建立。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Step 2：模板選擇 ── -->
      <div v-if="currentStep === 2" class="wizard-step-content">
        <div class="step-guide-text">
          選擇最符合此知識條目用途的模板，AI 將據此產出對應格式的初稿。
        </div>
        <div class="template-grid">
          <div
            v-for="tpl in templates"
            :key="tpl.value"
            :class="['template-card', { 'is-active': selectedTemplate === tpl.value }]"
            @click="selectedTemplate = tpl.value"
          >
            <div class="template-card-icon">
              <i class="material-symbols-outlined">{{ tpl.icon }}</i>
            </div>
            <div class="template-card-content">
              <div class="template-card-title">{{ tpl.label }}</div>
              <div class="template-card-desc">{{ tpl.desc }}</div>
            </div>
            <div class="template-card-check" v-if="selectedTemplate === tpl.value">
              <i class="material-symbols-outlined">check_circle</i>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Step 3：AI 初稿生成 ── -->
      <div v-if="currentStep === 3" class="wizard-step-content">
        <!-- 生成中 -->
        <div v-if="isGenerating" class="wizard-state-center">
          <div class="ai-pulse-icon ai-pulse-icon--generating">
            <i class="material-symbols-outlined">auto_awesome</i>
          </div>
          <div class="status-title">AI 正在根據檔案內容產出初稿...</div>
          <div class="status-desc">選用模板：{{ selectedTemplateLabel }}</div>
          <div class="ai-progress-container mt-4">
            <div class="ai-progress-track">
              <div class="ai-progress-fill" :style="{ width: generateProgress + '%' }"></div>
            </div>
            <div class="progress-text">{{ generateProgress }}%</div>
          </div>
        </div>

        <!-- 生成完成 -->
        <div v-else class="ai-preview-container">
          <div class="ai-preview-header">
            <div class="header-left">
              <i class="material-symbols-outlined title-icon">auto_awesome</i>
              <span class="header-title">AI 初稿預覽</span>
              <span class="template-badge">{{ selectedTemplateLabel }}</span>
            </div>
            <span class="header-hint">進入編輯器後可進行細部修改</span>
          </div>
          <div class="ai-preview-body" v-if="generatedContent">
            <KnowledgeTablePreview
              v-if="isTablePreview"
              :data="(generatedContent as any)"
            />
            <KnowledgeFlashcardPreview
              v-else
              :cards="(generatedContent as any)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="wizard-footer-actions">
        <button class="custom-btn" @click="handleClose">取消</button>

        <div class="action-right">
          <!-- Step 1 -->
          <button
            v-if="currentStep === 1"
            class="custom-btn custom-main-btn"
            :disabled="isChecking"
            @click="goToStep2"
          >
            繼續建立知識 <i class="material-symbols-outlined fs-18 ml-1">arrow_forward</i>
          </button>

          <!-- Step 2 -->
          <template v-if="currentStep === 2">
            <button class="custom-btn mr-2" @click="currentStep = 1">上一步</button>
            <button
              class="custom-btn custom-main-btn"
              :disabled="!selectedTemplate"
              @click="goToStep3"
            >
              確定
            </button>
          </template>

          <!-- Step 3 -->
          <template v-if="currentStep === 3 && !isGenerating">
            <button class="custom-btn mr-2" @click="currentStep = 2">重新選擇模板</button>
            <button
              class="custom-btn custom-main-btn"
              @click="handleConfirm"
            >
              進入編輯器 <i class="material-symbols-outlined fs-18 ml-1">edit_square</i>
            </button>
          </template>
        </div>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import compModal from '@/components/compModal/compModal.vue';
import KnowledgeFlashcardPreview from '@/components/Knowledge/KnowledgeFlashcardPreview.vue'
import KnowledgeTablePreview from '@/components/Knowledge/KnowledgeTablePreview.vue'

interface FileItem {
  id: string;
  fileName: string;
  fileType: string;
}

const props = defineProps<{
  modelValue: boolean;
  file: FileItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', data: { template: string; content: string }): void;
}>();

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// ── 知識預覽資料型別 ──
interface FlashcardItem {
  q: string
  a: string
}

interface TableData {
  headers: string[]
  rows: string[][]
}

type GeneratedContent = FlashcardItem[] | TableData | null

const knowledgeStore = useKnowledgeStore();

// ── 狀態 ──
const currentStep = ref(1);
const isChecking = ref(false);
const similarItems = ref<any[]>([]);
const selectedTemplate = ref('');
const isGenerating = ref(false);
const generateProgress = ref(0);
const generatedContent = ref<GeneratedContent>(null)

const stepLabels = ['相似性檢查', '選擇模板', 'AI 生成初稿'];

const statusLabelMap: Record<string, string> = {
  PUBLISHED: '已發布',
  REVIEWING: '審核中',
  DRAFT: '草稿',
  REJECTED: '已退回',
};

const templates = [
  {
    value: 'PRODUCT',
    label: '商品 / 銷售資料',
    icon: 'storefront',
    desc: '商品規格與銷售數據整理，適合庫存管理、銷售報告',
  },
  {
    value: 'SOP',
    label: 'SOP 標準流程',
    icon: 'account_tree',
    desc: '標準作業程序，適合業務流程、操作規範',
  },
  {
    value: 'GUIDE',
    label: '操作說明',
    icon: 'menu_book',
    desc: '系統功能使用指引，適合軟體操作、功能介紹',
  },
  {
    value: 'RULE',
    label: '規則說明',
    icon: 'gavel',
    desc: '規則與政策說明，適合商業規則、合規文件',
  },
];

const TABLE_TYPES = ['EXCEL', 'MD']

const isTablePreview = computed(() =>
  TABLE_TYPES.includes(props.file?.fileType?.toUpperCase() ?? '')
)

const selectedTemplateLabel = computed(
  () => templates.find(t => t.value === selectedTemplate.value)?.label ?? ''
);


const fileTypeIcon = computed(() => {
  const type = props.file?.fileType?.toUpperCase() ?? '';
  const map: Record<string, string> = {
    EXCEL: 'table_view',
    PDF: 'picture_as_pdf',
    WORD: 'description',
    PPT: 'slideshow',
    IMAGE: 'image',
    TXT: 'article',
    MD: 'article',
    HTML: 'html',
    CHART: 'bar_chart',
  };
  return map[type] ?? 'insert_drive_file';
});

// ── 監聽開啟，自動觸發相似性檢查 ──
watch(() => props.modelValue, (val) => {
  if (val) {
    currentStep.value = 1;
    selectedTemplate.value = '';
    similarItems.value = [];
    generatedContent.value = null;
    runSimilarityCheck();
  }
});

function runSimilarityCheck() {
  isChecking.value = true;
  setTimeout(() => {
    const fileName = props.file?.fileName?.toLowerCase() ?? '';
    const stripped = fileName.replace(/[._\-\d]/g, ' ').trim();
    const words = stripped.split(/\s+/).filter(w => w.length > 1);

    similarItems.value = knowledgeStore.knowledgeList.filter(k => {
      const title = k.title.toLowerCase();
      return words.some(word => title.includes(word));
    });

    isChecking.value = false;
  }, 1800);
}

function goToStep2() {
  currentStep.value = 2;
}

function goToStep3() {
  if (!selectedTemplate.value) return;
  currentStep.value = 3;
  startGeneration();
}

function startGeneration() {
  isGenerating.value = true;
  generateProgress.value = 0;

  const interval = setInterval(() => {
    generateProgress.value += Math.floor(Math.random() * 12) + 5;
    if (generateProgress.value >= 100) {
      generateProgress.value = 100;
      clearInterval(interval);
      setTimeout(() => {
        generatedContent.value = buildContent(selectedTemplate.value, props.file?.fileName ?? '');
        isGenerating.value = false;
      }, 300);
    }
  }, 200);
}

function buildFlashcardContent(template: string): FlashcardItem[] {
  switch (template) {
    case 'PRODUCT':
      return [
        { q: '此商品的適用對象為何？', a: '適用於零售業門市人員與電商營運人員，用於日常銷售管理與庫存查核。' },
        { q: '商品定價調整的授權層級為何？', a: '門市主管可調整 ±5%，超過 5% 需區域督導核准，超過 15% 需總部審批。' },
        { q: '庫存低於安全水位時應如何處理？', a: '庫存低於安全水位（< 50 件）時，系統自動發送補貨通知，需於 3 個工作天內完成採購請購單。' },
        { q: '促銷活動的設定流程為何？', a: '由行銷部門建立活動方案 → 主管審核 → ERP 系統設定折扣 → 通知各通路門市執行。' },
        { q: '退貨商品應如何進行庫存調整？', a: '退貨完成後，系統自動回補庫存數量，若商品損壞需另建調撥單移轉至報廢倉。' },
      ]

    case 'SOP':
      return [
        { q: '開店前盤點作業的標準步驟為何？', a: '①收銀機初始化 ②商品陳列確認 ③庫存抽查（至少 5 項）④填寫開店檢查表 ⑤回報完成。' },
        { q: '顧客退換貨的標準流程為何？', a: '確認購買憑證 → 商品狀態檢查 → 填寫退換貨單 → 退款（原路返還）或換貨處理 → 庫存更新。' },
        { q: '每日結帳作業應在何時完成？', a: '須於閉店後 30 分鐘內完成日報表核對，並上傳至系統，異常金額需附說明。' },
        { q: '遇到系統故障時應如何處理？', a: '立即通知 IT 部門（分機 119），啟用備用紙本流程，記錄所有交易並在系統恢復後補登。' },
        { q: '消費者投訴的處理時效要求為何？', a: '當場受理 → 24 小時內初步回覆 → 72 小時內提供最終處理結果，嚴重投訴需主管親自簽核。' },
        { q: '新進員工獨立上崗前需完成哪些訓練？', a: '三天職前教育訓練 + POS 系統操作認證 + 消防安全演練，全部通過後主管簽核始可獨立作業。' },
      ]

    case 'GUIDE':
      return [
        { q: '如何進入此功能模組？', a: '登入系統後，從頂部主選單選擇對應功能，或使用側邊欄快捷入口進入。' },
        { q: '查詢資料時如何設定篩選條件？', a: '在篩選列依序設定「日期區間」→「資料類別」→「人員或部門範圍」，點擊「套用」即可。' },
        { q: '匯出報表支援哪些格式？', a: '支援 Excel（.xlsx）、CSV、PDF 三種格式，在結果頁右上角點選「匯出」後選擇格式下載。' },
        { q: '操作時出現「權限不足」提示應如何處理？', a: '聯繫系統管理員確認角色設定，或請主管在後台為您授予對應功能的存取權限。' },
        { q: '資料送出後可以修改嗎？', a: '送出後 2 小時內可由本人撤回修改，超過時限需由主管在審核介面退回後重新填送。' },
      ]

    case 'RULE':
      return [
        { q: '本規則的適用對象為何？', a: '適用於所有涉及相關業務的正職、約聘及外包人員，自入職日起生效。' },
        { q: '標準作業的完成時效要求為何？', a: '常規流程須在規定時間內完成，逾期需填寫延遲說明並取得主管書面核准。' },
        { q: '遇到無法遵循標準程序的特殊情況如何處理？', a: '說明原因並取得主管書面授權 → 記錄例外情況與實際處理過程 → 事後補充完整文件並歸檔。' },
        { q: '違反本規則的處理方式為何？', a: '輕微違規予以書面警告並要求改善，情節重大者依公司人事規定處理，必要時依法追究責任。' },
      ]

    default:
      return []
  }
}

function buildTableContent(template: string, name: string): TableData {
  switch (template) {
    case 'PRODUCT':
      return {
        headers: ['商品名稱', '商品編號', '規格', '售價', '庫存量'],
        rows: [
          [name + ' A', 'SKU-001', '標準款', 'NT$1,200', '350'],
          [name + ' B', 'SKU-002', '進階款', 'NT$2,500', '120'],
          [name + ' C', 'SKU-003', '旗艦款', 'NT$4,800', '45'],
        ],
      }
    case 'SOP':
      return {
        headers: ['步驟', '作業項目', '負責人', '完成時限', '備註'],
        rows: [
          ['1', '開店前盤點', '門市人員', '開店前 30 分鐘', '填寫開店檢查表'],
          ['2', '收銀機初始化', '門市人員', '開店前 15 分鐘', '確認零用金金額'],
          ['3', '日報表上傳', '門市主管', '閉店後 30 分鐘', '異常需附說明'],
        ],
      }
    case 'GUIDE':
      return {
        headers: ['功能名稱', '操作路徑', '所需權限', '備註'],
        rows: [
          ['資料查詢', '主選單 → 查詢', '一般使用者', '可匯出 Excel / CSV / PDF'],
          ['資料送審', '查詢結果 → 送審', '一般使用者', '2 小時內可撤回'],
          ['審核作業', '主選單 → 審核', '主管以上', '可退回或核准'],
        ],
      }
    case 'RULE':
      return {
        headers: ['規則項目', '適用對象', '標準', '違規處理'],
        rows: [
          ['完成時效', '全體人員', '依各作業規定', '逾期需主管核准說明'],
          ['資料記錄', '全體人員', '完整留存紀錄', '缺漏者書面警告'],
          ['例外申請', '全體人員', '書面授權', '事後歸檔存查'],
        ],
      }
    default:
      return { headers: ['項目', '說明'], rows: [['（無資料）', '']] }
  }
}

function buildContent(template: string, _fileName: string): GeneratedContent {
  const fileType = props.file?.fileType?.toUpperCase() ?? ''
  const name = _fileName.replace(/\.[^.]+$/, '')
  if (TABLE_TYPES.includes(fileType)) {
    return buildTableContent(template, name)
  }
  return buildFlashcardContent(template)
}

function contentToString(content: GeneratedContent): string {
  if (!content) return ''
  if (Array.isArray(content)) {
    return (content as FlashcardItem[])
      .map((card, i) => `Q${i + 1}. ${card.q}\nA${i + 1}. ${card.a}`)
      .join('\n\n')
  }
  const tableData = content as TableData
  return `| ${tableData.headers.join(' | ')} |\n| ${tableData.headers.map(() => '---').join(' | ')} |\n${tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`
}

function handleConfirm() {
  emit('confirm', {
    template: selectedTemplateLabel.value,
    content: contentToString(generatedContent.value),
  });
  emit('update:modelValue', false);
}

function handleClose() {
  emit('update:modelValue', false);
}
</script>
