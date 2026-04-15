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
          <div class="ai-preview-body">
            <div class="preview-title">{{ previewTitle }}</div>
            <div class="preview-scroll-area">
              <pre class="preview-text">{{ generatedContent }}</pre>
            </div>
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

const previewTitle = computed(
  () => props.file?.fileName.replace(/\.[^.]+$/, '') ?? ''
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

function buildContent(template: string, fileName: string): string {
  const name = fileName.replace(/\.[^.]+$/, '');
  switch (template) {
    case 'PRODUCT':
      return `# ${name} — 商品 / 銷售資料

## 商品概覽
本文件整理相關商品規格與銷售數據，供業務人員及管理層查閱參考。

## 商品資料表
| 商品名稱 | 商品編號 | 規格 | 售價 | 庫存量 |
|---|---|---|---|---|
| 商品 A | SKU-001 | 標準款 | NT$1,200 | 350 |
| 商品 B | SKU-002 | 進階款 | NT$2,500 | 120 |
| 商品 C | SKU-003 | 旗艦款 | NT$4,800 | 45 |

## 銷售數據摘要

### 本期銷售概況
- **銷售總額**：NT$2,340,000
- **銷售筆數**：1,245 筆
- **平均客單價**：NT$1,880
- **同期成長率**：+12.3%

### 各通路銷售分布
| 通路 | 銷售額 | 佔比 |
|---|---|---|
| 官方電商 | NT$1,100,000 | 47% |
| 實體門市 | NT$820,000 | 35% |
| 第三方平台 | NT$420,000 | 18% |

## 庫存警示
- 庫存低於安全水位（< 50）之品項，請優先安排補貨
- 滯銷品（30 天無銷售紀錄）建議啟動促銷活動

## 備註
資料來源：${name}，如有更新請以最新版文件為準。`;

    case 'SOP':
      return `# ${name} — 標準作業程序 (SOP)

## 1. 目的
本 SOP 旨在確保相關作業之一致性與正確性，降低人為錯誤風險。

## 2. 適用範圍
本程序適用於所有執行相關業務的人員。

## 3. 作業流程

### Step 1：前置準備
- 確認所需資料及文件已備妥
- 確認系統存取權限正常

### Step 2：執行作業
1. 開啟相關系統，確認連線正常
2. 依標準格式輸入或核對資料
3. 執行雙重確認程序

### Step 3：結果驗證
- 核對輸出結果與預期值一致
- 如有差異，啟動異常處理流程

### Step 4：存檔與回報
- 將結果存入指定路徑
- 通知相關主管或部門

## 4. 注意事項
- 作業前請確認已完成必要教育訓練
- 遇不確定情況請即時詢問主管`;

    case 'GUIDE':
      return `# ${name} — 操作說明

## 功能概述
本說明文件提供完整的操作指引，協助使用者正確、有效率地使用相關功能。

## 系統需求
- 瀏覽器：Chrome 90+ / Edge 90+
- 權限：需具備相應操作角色

## 操作步驟

### 1. 進入功能
登入系統後，從主選單點選對應功能模組進入操作頁面。

### 2. 設定查詢條件
依業務需求設定篩選條件：
- 日期區間
- 資料類別
- 部門或人員範圍

### 3. 執行操作
確認設定無誤後，點擊「確認」按鈕開始處理。

### 4. 查閱與匯出結果
處理完成後即可瀏覽結果，並透過「匯出」功能下載報表。

## 常見錯誤排除
| 錯誤訊息 | 可能原因 | 解決方式 |
|---|---|---|
| 無法登入 | 帳號密碼有誤 | 確認帳密或聯繫管理員 |
| 資料載入失敗 | 網路或權限問題 | 重新整理頁面後再試 |`;

    case 'RULE':
      return `# ${name} — 規則說明

## 1. 適用範圍
本規則適用於所有涉及相關業務之人員及作業活動。

## 2. 基本原則
- 所有操作須符合公司規定及相關法規要求
- 資料安全與保密依資訊安全政策執行
- 異常情況須即時回報並完整記錄

## 3. 執行標準

### 3.1 時效要求
標準流程須在規定時間內完成，逾期須提出說明並獲主管核准。

### 3.2 品質要求
輸出結果須符合既定品質標準，不符規格者須重新處理。

### 3.3 記錄要求
所有重要操作須留存完整紀錄，保存期限依規定辦理。

## 4. 例外處理
特殊情況無法遵循標準程序時：
1. 說明原因並取得主管書面授權
2. 記錄例外情況與實際處理過程
3. 事後補充完整文件並歸檔

## 5. 違規處理
違反本規則者，依公司相關人事規定處理，情節重大者依法追究。`;

    default:
      return '';
  }
}

function handleConfirm() {
  emit('confirm', {
    template: selectedTemplateLabel.value,
    content: generatedContent.value,
  });
  emit('update:modelValue', false);
}

function handleClose() {
  emit('update:modelValue', false);
}
</script>
