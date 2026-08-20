<template>
  <div class="reportAssemblyViewBox">
    <div class="report-assembly-head">
      <span class="report-assembly-count">
        <i class="material-symbols-outlined">stacks</i>已選 {{ sectionIds.length }} 個章節
      </span>
      <button class="report-assembly-save-btn"
        :disabled="sectionIds.length === 0"
        @click="handleSaveTemplate">
        <i class="material-symbols-outlined">bookmark_add</i>存成模板
      </button>
    </div>

    <ol class="report-assembly-list" v-if="sectionIds.length > 0">
      <li v-for="sectionId in sectionIds" :key="sectionId"
        class="report-assembly-item"
        :class="{
          dragging: dragId === sectionId,
          'drag-over-before': dragOverId === sectionId && dragOverBefore,
          'drag-over-after': dragOverId === sectionId && !dragOverBefore,
        }"
        draggable="true"
        @dragstart.stop="handleDragStart($event, sectionId)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver($event, sectionId)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, sectionId)">
        <span class="report-assembly-handle material-symbols-outlined">drag_indicator</span>
        <span class="report-assembly-dot" :style="{ '--dot-color': categoryColor(sectionId) }"></span>
        <span class="report-assembly-item-body">
          <span class="report-assembly-item-name">{{ sectionName(sectionId) }}</span>
          <span class="report-assembly-item-desc">{{ sectionDesc(sectionId) }}</span>
        </span>
        <button class="report-assembly-remove" v-tooltip="'移除章節'" @click="removeSection(sectionId)">
          <i class="material-symbols-outlined">close</i>
        </button>
      </li>
    </ol>
    <div class="report-assembly-empty" v-else>
      <i class="material-symbols-outlined">library_add</i>
      還沒有章節，從下方積木盒加入
    </div>

    <div class="report-assembly-palette">
      <details v-for="category in categories" :key="category.id" class="report-assembly-category" open>
        <summary>
          <span class="report-assembly-dot" :style="{ '--dot-color': category.color }"></span>
          <span class="report-assembly-category-label">{{ category.label }}</span>
          <span class="report-assembly-category-count">{{ addedCountInCategory(category.id) }}/{{ sectionsByCategory(category.id).length }}</span>
        </summary>
        <div class="report-assembly-category-items">
          <div v-for="section in sectionsByCategory(category.id)" :key="section.id"
            class="report-assembly-palette-item" :class="{ added: sectionIds.includes(section.id) }">
            <span class="report-assembly-item-body">
              <span class="report-assembly-item-name">{{ section.name }}</span>
              <span class="report-assembly-item-desc">{{ section.description }}</span>
            </span>
            <button class="report-assembly-add-btn" v-tooltip="sectionIds.includes(section.id) ? '已加入' : '加入章節'" @click="addSection(section.id)">
              <i class="material-symbols-outlined">{{ sectionIds.includes(section.id) ? 'check' : 'add' }}</i>
            </button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';
import popDialog from '@/services/popDialog';
import type { ReportAssemblyBlockData } from '@/types/AiViewer';

interface ReportSection {
  id: string
  categoryId: string
  name: string
  description: string
}

interface ReportCategory {
  id: string
  label: string
  color: string
}

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  source: {
    type: Object as PropType<{ blockType: 'REPORT'; data: ReportAssemblyBlockData }>,
    required: true
  }
});

const aiviewerStore = useAiviewerStore();

const CATEGORIES: ReportCategory[] = [
  { id: 'promo', label: '行銷活動成效', color: '#c2703d' },
  { id: 'ta', label: 'TA 用戶畫像', color: '#3f7cac' },
  { id: 'member', label: '會員留存與流失', color: '#ba4a56' },
  { id: 'product', label: '商品深度分析', color: '#4f9d69' },
];

const SECTIONS: ReportSection[] = [
  { id: 'promo_kpi', categoryId: 'promo', name: '促銷核心 KPI', description: '取得行銷活動核心 KPI 資料（完成訂單數、GMV、折扣總額、折扣佔比、規則數）。' },
  { id: 'promo_top10', categoryId: 'promo', name: '前 10 大活動', description: '取得各促銷活動帶動效果 Top 10 資料，並自動生成圖表。' },
  { id: 'promo_type', categoryId: 'promo', name: '活動類型分析', description: '取得各促銷類型效益資料（類型分布、有折扣 vs 無折扣 AOV），並自動生成圖表。' },
  { id: 'promo_monthly', categoryId: 'promo', name: '月度促銷趨勢', description: '取得已完成訂單的月度訂單數與 GMV 走勢，並自動生成圖表。' },
  { id: 'time_heatmap', categoryId: 'promo', name: '銷售熱門時段', description: '取得星期 x 小時的訂單量/GMV 熱力圖資料，回答「什麼時候該推活動」。' },
  { id: 'gender', categoryId: 'ta', name: '性別分布', description: '取得會員性別分布資料，圖表自動生成。' },
  { id: 'age', categoryId: 'ta', name: '年齡層分布', description: '取得會員年齡分布資料，圖表自動生成。' },
  { id: 'gender_age_cross', categoryId: 'ta', name: '性別 × 年齡交叉', description: '性別 × 年齡層交叉分布，回答「不同性別的年齡結構」這類橫跨兩個維度的問題。' },
  { id: 'city_distribution', categoryId: 'ta', name: '地理分布', description: '會員地理分布（佔比 ≥1% 的城市）資料，圖表自動生成。' },
  { id: 'persona', categoryId: 'ta', name: '會員人物誌', description: '性別 × 年齡層 × 主力購買品類 × RFM 行為分群的四維交叉輪廓。' },
  { id: 'member_kpi', categoryId: 'member', name: '會員留存核心 KPI', description: '有購買記錄會員數、新客/回購比例、平均購買頻次、高價值會員數。' },
  { id: 'rfm_segments', categoryId: 'member', name: 'RFM 分群', description: 'R/F/M 各自五分位數評 1-5 分，交叉對到 10 種標準命名分群（冠軍客戶/忠實顧客/潛力顧客等）。' },
  { id: 'top_products', categoryId: 'product', name: '熱銷商品 Top 10', description: '分別按營收與按銷量排名，含自動生成橫條圖。' },
  { id: 'low_sales_products', categoryId: 'product', name: '低銷量商品清單', description: '銷量最低的 20 個商品清單（依銷量由低到高），含自動生成圖表。' },
];

const SECTION_MAP: Record<string, ReportSection> = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
const CATEGORY_MAP: Record<string, ReportCategory> = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const categories = CATEGORIES;

const sectionIds = computed<string[]>(() => props.source.data.sectionIds ?? []);

function sectionName(sectionId: string): string {
  return SECTION_MAP[sectionId]?.name ?? sectionId;
}
function sectionDesc(sectionId: string): string {
  return SECTION_MAP[sectionId]?.description ?? '';
}
function categoryColor(sectionId: string): string {
  const section = SECTION_MAP[sectionId];
  if (!section) return '#c7c9d1';
  return CATEGORY_MAP[section.categoryId]?.color ?? '#c7c9d1';
}
function sectionsByCategory(categoryId: string): ReportSection[] {
  return SECTIONS.filter(s => s.categoryId === categoryId);
}
function addedCountInCategory(categoryId: string): number {
  return sectionsByCategory(categoryId).filter(s => sectionIds.value.includes(s.id)).length;
}

function addSection(sectionId: string) {
  if (sectionIds.value.includes(sectionId)) return;
  aiviewerStore.updateReportAssemblySections(props.id, [...sectionIds.value, sectionId]);
}
function removeSection(sectionId: string) {
  aiviewerStore.updateReportAssemblySections(props.id, sectionIds.value.filter((id: string) => id !== sectionId));
}

// 拖曳排序（原生 HTML5 drag and drop，不引入新套件）
const dragId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dragOverBefore = ref(true);

function handleDragStart(event: DragEvent, sectionId: string) {
  dragId.value = sectionId;
  // 部分瀏覽器（尤其 Firefox）若未設定 dataTransfer 資料/effectAllowed，可能拒絕啟動原生拖曳
  event.dataTransfer?.setData('text/plain', sectionId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function handleDragEnd() {
  dragId.value = null;
  dragOverId.value = null;
}
function handleDragOver(event: DragEvent, sectionId: string) {
  event.preventDefault();
  if (sectionId === dragId.value) {
    // 拖曳到自己身上時清除殘留的 drag-over 高亮，避免卡在錯誤的元素上
    dragOverId.value = null;
    return;
  }
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  dragOverId.value = sectionId;
  dragOverBefore.value = (event.clientY - rect.top) < rect.height / 2;
}
function handleDragLeave() {
  dragOverId.value = null;
}
function handleDrop(event: DragEvent, targetId: string) {
  event.preventDefault();
  dragOverId.value = null;
  const from = dragId.value;
  if (!from || from === targetId) return;
  const next = sectionIds.value.filter((id: string) => id !== from);
  let to = next.indexOf(targetId);
  to = dragOverBefore.value ? to : to + 1;
  next.splice(to, 0, from);
  aiviewerStore.updateReportAssemblySections(props.id, next);
}

function handleSaveTemplate() {
  if (sectionIds.value.length === 0) return;
  const name = props.source.data.templateName || '促銷週報';
  aiviewerStore.saveReportAssemblyTemplate(props.id, name);
  popDialog.toast('已儲存章節排列。跟 AI 說「用新的組合幫我生成新的報告」就能套用最新排列重新產生報告。', 3000);
}
</script>
