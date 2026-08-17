<template>
  <div class="KnowledgeBase KnowledgeEditor views-page">
    <div class="views-page-content-box" v-if="draft">

      <!-- 頂部麵包屑 -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">編輯草稿 {{ draft.versionNumber }}</div>
        </div>
      </div>

      <!-- 操作列：儲存草稿在任何步驟都可以按 -->
      <div class="views-page-header">
        <div class="d-flex align-items-center"></div>
        <div class="header-right-box">
          <button class="custom-btn" @click="handleSave">
            <i class="material-symbols-outlined">save</i>
            儲存草稿
          </button>
        </div>
      </div>

      <!-- 提示條：說明草稿不影響已發布版本 -->
      <div class="editor-banner">
        <i class="material-symbols-outlined">info</i>
        <div>
          您正在編輯 <strong>{{ draft.versionNumber }}</strong> 草稿版本。
          目前的正式發布版本仍為 <strong>{{ knowledge?.versions.find(v => v.status === 'active')?.versionNumber ?? '—' }}</strong>，
          在審核通過並發布前，所有使用者看到的內容均不會改變。
        </div>
      </div>

      <!-- 步驟指示器 -->
      <div class="ke-stepper">
        <button
          type="button"
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['ke-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          :disabled="currentStep <= i"
          :aria-current="currentStep === i ? 'step' : undefined"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <span class="ke-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="ke-step-label">{{ label }}</span>
        </button>
        <div class="ke-step-track">
          <div class="ke-step-fill" :style="{ width: fillWidth }" />
        </div>
      </div>

      <!-- 步驟內容 -->
      <div class="ke-body">

        <!-- Step 0：基本資訊 -->
        <template v-if="currentStep === 0">
          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">知識標題 <span class="required">*</span></label>
              <input
                type="text"
                class="custom-input w-100"
                v-model="formData.title"
                placeholder="輸入知識條目標題"
              />
            </div>
            <div class="field-group">
              <label class="field-label">內容摘要</label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.summary"
                placeholder="一句話說明此知識條目的用途"
              ></textarea>
            </div>
            <div class="field-group">
              <label class="field-label">分類</label>
              <compDropDown
                :options="[
                  { name: '商品文件', value: '商品文件' },
                  { name: '系統文件', value: '系統文件' },
                  { name: '客服知識', value: '客服知識' },
                  { name: '規則說明', value: '規則說明' },
                  { name: '市場情報', value: '市場情報' },
                ]"
                :show-search="false"
                :default-value="formData.category"
                class="w-100"
                @select="(item: any) => formData.category = String(item.value)"
              />
            </div>
            <div class="field-group">
              <label class="field-label">標籤</label>
              <div class="tags-input-wrap" @click="focusTagInput">
                <span class="tag-chip" v-for="tag in formData.tags" :key="tag">
                  {{ tag }}
                  <i class="material-symbols-outlined" @click.stop="removeTag(tag)">close</i>
                </span>
                <input
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  placeholder="輸入標籤後按 Enter"
                  @keydown.enter.prevent="addTag"
                  @keydown.backspace="handleBackspaceTag"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Step 1：內容與來源 -->
        <template v-else-if="currentStep === 1">
          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">知識內容 <span class="required">*</span></label>
              <div class="editor-toolbar">
                <span class="toolbar-badge">Markdown</span>
                <span class="fc-grey-1 fs-12">支援 Markdown 格式，未來將支援所見即所得編輯器</span>
              </div>
              <textarea
                class="custom-input w-100 editor-textarea"
                rows="18"
                v-model="formData.content"
                placeholder="在此輸入詳細知識內容（支援 Markdown 格式）

# 標題
## 子標題

- 列點項目
- 另一個項目

1. 有序列表
2. 第二項"
              ></textarea>
            </div>
            <div class="field-group">
              <label class="field-label">關聯來源檔案</label>
              <div class="source-files-list" v-if="formData.sourceFiles.length">
                <div
                  class="source-file-item"
                  v-for="file in formData.sourceFiles"
                  :key="file.fileId"
                >
                  <i class="material-symbols-outlined fs-16">description</i>
                  <span class="flex-1 fs-13">{{ file.fileName }}</span>
                  <i class="material-symbols-outlined fs-16 cursor-pointer fc-grey-1" @click="removeSourceFile(file.fileId)">close</i>
                </div>
              </div>
              <button class="custom-btn w-100 mt-2" @click="popDialog.alert('功能開發中：將開啟共用檔案管理選擇器')">
                <i class="material-symbols-outlined">add</i>
                從共用檔案管理選取
              </button>
            </div>
            <div class="field-group">
              <label class="field-label">可見範圍</label>
              <compDropDown
                :options="[
                  { name: '全部成員', value: 'ALL' },
                  { name: '僅限本團隊', value: 'TEAM' },
                  { name: '僅限管理者', value: 'MANAGERS' },
                ]"
                :show-search="false"
                :default-value="formData.visibility"
                class="w-100"
                @select="(item: any) => formData.visibility = item.value"
              />
            </div>
          </div>
        </template>

        <!-- Step 2：確認與發布 -->
        <template v-else>
          <h3 class="ke-confirm-title">{{ formData.title }}</h3>

          <div class="ke-confirm-grid lively-stagger">
            <div class="ke-confirm-group lively-card">
              <div class="ke-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">description</i>內容摘要
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">分類</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.category">{{ formData.category }}</span>
                  <span v-else class="ke-empty">（未選擇）</span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">標籤</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.tags.length">{{ formData.tags.join('、') }}</span>
                  <span v-else class="ke-empty">（未設定）</span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">內容字數</span>
                <span class="ke-confirm-val">{{ formData.content.length }} 字元</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">來源檔案</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.sourceFiles.length">{{ formData.sourceFiles.length }} 個檔案</span>
                  <span v-else class="ke-empty">（未關聯）</span>
                </span>
              </div>
            </div>

            <div class="ke-confirm-group lively-card">
              <div class="ke-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">settings</i>狀態資訊
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">狀態</span>
                <span class="ke-confirm-val">
                  <span :class="['status-badge', `status-badge--${draft.status}`]">
                    {{ statusLabelMap[draft.status] ?? draft.status }}
                  </span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">草稿版本</span>
                <span class="ke-confirm-val">{{ draft.versionNumber }}</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">前一版本</span>
                <span class="ke-confirm-val">{{ knowledge?.versions.find(v => v.status === 'active')?.versionNumber ?? '—' }}</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">最後編輯</span>
                <span class="ke-confirm-val">{{ draft.lastUpdateBy }}</span>
              </div>
            </div>
          </div>

          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">本次更新說明 <span class="required">*</span></label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.updateNote"
                placeholder="例如：修正產品保固說明有誤的段落"
              ></textarea>
            </div>
          </div>
        </template>

      </div>

      <!-- 底部導覽 -->
      <div class="ke-footer">
        <button v-if="currentStep > 0" class="custom-btn" @click="currentStep--">
          <i class="material-symbols-outlined">arrow_back</i>上一步
        </button>
        <span v-else />
        <div class="ke-footer-right">
          <button
            v-if="currentStep < STEPS.length - 1"
            class="custom-btn custom-main-btn"
            :disabled="!canGoNext"
            @click="currentStep++"
          >
            下一步<i class="material-symbols-outlined">arrow_forward</i>
          </button>
          <button
            v-else
            class="custom-btn custom-main-btn"
            :disabled="!formData.updateNote.trim()"
            @click="isReviewModalOpen = true"
          >
            <i class="material-symbols-outlined">send</i>
            送出審核
          </button>
        </div>
      </div>

    </div>

    <!-- 找不到草稿 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <i class="material-symbols-outlined fs-48 fc-grey-1">search_off</i>
      <h4 class="mt-3">找不到草稿版本</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 送審 Modal -->
    <SubmitReviewModal
      v-model="isReviewModalOpen"
      @confirm="handleSubmitReview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { SourceFileRef } from '@/stores/knowledgeStore';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import SubmitReviewModal from '@/components/Knowledge/SubmitReviewModal.vue';
import popDialog from '@/services/popDialog';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import { useBreadcrumb } from '@/composables/useBreadcrumb';

const props = defineProps<{
  knowledgeId: string;
  versionId: string;
}>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const draft = computed(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));

const { setDynamic } = useBreadcrumb();

watch(knowledge, (val) => {
  if (val?.title) setDynamic(val.title);
}, { immediate: true });

const statusLabelMap: Record<string, string> = {
  draft:    '草稿',
  rejected: '已退回',
};

const STEPS = ['基本資訊', '內容與來源', '確認與發布'] as const;
const currentStep = ref(0);

const fillWidth = computed(() => `${(currentStep.value / (STEPS.length - 1)) * 100}%`);

const canGoNext = computed(() => {
  if (currentStep.value === 0) return !!formData.title.trim();
  if (currentStep.value === 1) return !!formData.content.trim();
  return true;
});

const formData = reactive({
  title: '',
  summary: '',
  content: '',
  category: '',
  tags: [] as string[],
  visibility: 'ALL' as 'ALL' | 'TEAM' | 'MANAGERS',
  sourceFiles: [] as SourceFileRef[],
  updateNote: '',
});

// 標籤輸入
const tagInputRef = ref<HTMLInputElement | null>(null);
const tagInputValue = ref('');

function focusTagInput() {
  tagInputRef.value?.focus();
}

function addTag() {
  const val = tagInputValue.value.trim();
  if (val && !formData.tags.includes(val)) {
    formData.tags.push(val);
  }
  tagInputValue.value = '';
}

function removeTag(tag: string) {
  formData.tags = formData.tags.filter(t => t !== tag);
}

function handleBackspaceTag() {
  if (!tagInputValue.value && formData.tags.length) {
    formData.tags.pop();
  }
}

function removeSourceFile(fileId: string) {
  formData.sourceFiles = formData.sourceFiles.filter(f => f.fileId !== fileId);
}

onMounted(() => {
  if (draft.value) {
    formData.title = draft.value.title;
    formData.summary = draft.value.summary;
    formData.content = draft.value.content;
    formData.category = knowledge.value?.category ?? '';
    formData.tags = [...(draft.value.tags ?? [])];
    formData.visibility = 'ALL';
    formData.sourceFiles = [...(draft.value.sourceFiles ?? [])];
    formData.updateNote = draft.value.updateNote;
  }
});

function handleSave() {
  if (!formData.updateNote.trim()) {
    if (currentStep.value !== STEPS.length - 1) {
      // 「本次更新說明」欄位只存在於最後一步（確認與發布），
      // 若使用者在前面步驟按下「儲存草稿」，先導覽過去讓欄位可見，再提示原因。
      currentStep.value = STEPS.length - 1;
    }
    popDialog.alert('請填寫本次更新說明後再儲存。');
    return;
  }
  knowledgeStore.saveDraft(props.knowledgeId, props.versionId, { ...formData });
  popDialog.toast('草稿已儲存', 1500);
}

const isReviewModalOpen = ref(false);

function handleSubmitReview(reviewData: { reviewer: string; note: string }) {
  if (!formData.updateNote.trim()) {
    popDialog.alert('請填寫本次更新說明後再送審。');
    return;
  }
  knowledgeStore.saveDraft(props.knowledgeId, props.versionId, { ...formData });
  knowledgeStore.submitForReview(props.knowledgeId, props.versionId, reviewData.reviewer, reviewData.note);
  router.push({ name: 'KnowledgeBase' }).then(() => {
    popDialog.alert('已送出審核！等待審核人批准後即可發布。');
  });
}
</script>
