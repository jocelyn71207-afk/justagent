<template>
  <div class="KnowledgeBase KnowledgeEditor views-page">
    <div class="views-page-content-box" v-if="draft">

      <!-- 頂部操作列 -->
      <div class="views-page-header">
        <div class="d-flex align-items-center">
          <button class="custom-btn mr-3" @click="handleBack">
            <i class="material-symbols-outlined">close</i>
          </button>
          <div class="page-title-group">
            <h3>編輯草稿 {{ draft.versionNumber }}</h3>
          </div>
        </div>
        <div class="header-right-box">
          <button class="custom-btn" @click="handleSave">
            <i class="material-symbols-outlined">save</i>
            儲存草稿
          </button>
          <button class="custom-btn custom-main-btn ml-2" @click="isReviewModalOpen = true">
            <i class="material-symbols-outlined">send</i>
            送出審核
          </button>
        </div>
      </div>

      <!-- 提示條：說明草稿不影響已發布版本 -->
      <div class="editor-banner">
        <i class="material-symbols-outlined">info</i>
        <div>
          您正在編輯 <strong>{{ draft.versionNumber }}</strong> 草稿版本。
          目前的正式發布版本仍為 <strong>{{ knowledge?.currentVersion }}</strong>，
          在審核通過並發布前，所有使用者看到的內容均不會改變。
        </div>
      </div>

      <!-- 主要編輯區 + 右側資訊欄 -->
      <div class="row">

        <!-- 左側：主要欄位 -->
        <div class="col-8">
          <div class="editor-card">

            <!-- 標題 -->
            <div class="field-group">
              <label class="field-label">知識標題 <span class="required">*</span></label>
              <input
                type="text"
                class="custom-input w-100"
                v-model="formData.title"
                placeholder="輸入知識條目標題"
              />
            </div>

            <!-- 摘要 -->
            <div class="field-group">
              <label class="field-label">內容摘要</label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.summary"
                placeholder="一句話說明此知識條目的用途"
              ></textarea>
            </div>

            <!-- 內容編輯器（Rich Text placeholder） -->
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

          </div>
        </div>

        <!-- 右側：發布設定 -->
        <div class="col-4">
          <div class="editor-card">
            <h6 class="fw-700 mb-4 pb-3 border-bottom d-flex align-items-center">
              <i class="material-symbols-outlined mr-2 fs-18">settings</i>
              發布設定
            </h6>

            <!-- 分類 -->
            <div class="field-group">
              <label class="field-label">分類</label>
              <compDropDown
                :options="[
                  { name: '商品文件', value: '商品文件' },
                  { name: '系統文件', value: '系統文件' },
                  { name: '客服知識', value: '客服知識' },
                  { name: '規則說明', value: '規則說明' },
                ]"
                :show-search="false"
                :default-value="formData.category"
                class="w-100"
                @select="(item: any) => formData.category = String(item.value)"
              />
            </div>

            <!-- 標籤 -->
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

            <!-- 關聯來源檔案 -->
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

            <!-- 可見範圍 -->
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

            <!-- 本次更新說明 -->
            <div class="field-group">
              <label class="field-label">本次更新說明 <span class="required">*</span></label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.updateNote"
                placeholder="例如：修正產品保固說明有誤的段落"
              ></textarea>
            </div>

            <div class="divider my-4"></div>

            <!-- 狀態資訊 -->
            <div class="meta-info-list">
              <div class="meta-info-item">
                <span class="meta-label">狀態</span>
                <span :class="['status-badge', `status-badge--${draft.status}`]">
                  {{ statusLabelMap[draft.status] ?? draft.status }}
                </span>
              </div>
              <div class="meta-info-item">
                <span class="meta-label">草稿版本</span>
                <span class="version-badge">{{ draft.versionNumber }}</span>
              </div>
              <div class="meta-info-item">
                <span class="meta-label">前一版本</span>
                <span class="fc-grey-1 fs-13">{{ knowledge?.currentVersion ?? '—' }}</span>
              </div>
              <div class="meta-info-item">
                <span class="meta-label">最後編輯</span>
                <span class="fc-grey-1 fs-13">{{ draft.lastUpdateBy }}</span>
              </div>
              <div class="meta-info-item">
                <span class="meta-label">建立時間</span>
                <span class="fc-grey-1 fs-13">{{ draft.lastUpdateTime }}</span>
              </div>
            </div>

          </div>
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
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { SourceFileRef } from '@/stores/knowledgeStore';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import SubmitReviewModal from '@/components/Knowledge/SubmitReviewModal.vue';
import popDialog from '@/services/popDialog';

const props = defineProps<{
  knowledgeId: string;
  versionId: string;
}>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const draft = computed(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));

const statusLabelMap: Record<string, string> = {
  DRAFT:    '草稿',
  REJECTED: '已退回',
};

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
    formData.category = draft.value.category;
    formData.tags = [...(draft.value.tags ?? [])];
    formData.visibility = draft.value.visibility ?? 'ALL';
    formData.sourceFiles = [...(draft.value.sourceFiles ?? [])];
    formData.updateNote = draft.value.updateNote;
  }
});

function handleSave() {
  if (!formData.updateNote.trim()) {
    popDialog.alert('請填寫本次更新說明後再儲存。');
    return;
  }
  knowledgeStore.saveDraft(props.knowledgeId, props.versionId, { ...formData });
  popDialog.toast('草稿已儲存', 1500);
}

function handleBack() {
  popDialog.confirm('尚未儲存的變更將會遺失，確定要關閉嗎？', () => {
    router.back();
  });
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
