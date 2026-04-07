<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="emit('update:modelValue', false)">
    <div class="modal-box SourceUpdateModal">

      <!-- Header -->
      <div class="modal-header-box">
        <div class="d-flex align-items-center gap-2">
          <div class="update-icon">
            <i class="material-symbols-outlined">update</i>
          </div>
          <div>
            <h5 class="modal-title">偵測到來源檔案更新</h5>
            <p class="modal-subtitle">請選擇如何處理受影響的知識條目</p>
          </div>
        </div>
        <button class="icon-btn" @click="emit('update:modelValue', false)">
          <i class="material-symbols-outlined">close</i>
        </button>
      </div>

      <!-- 更新的檔案資訊 -->
      <div class="file-update-banner">
        <div class="file-update-banner__icon">
          <i class="material-symbols-outlined">table_view</i>
        </div>
        <div class="file-update-banner__info">
          <div class="file-update-banner__name">{{ updatedFile?.fileName }}</div>
          <div class="file-update-banner__version">
            <span class="version-chip version-chip--old">v{{ prevVersion }}</span>
            <i class="material-symbols-outlined">arrow_forward</i>
            <span class="version-chip version-chip--new">v{{ updatedFile?.version }}</span>
            <span class="fc-grey-1 fs-12 ml-2">{{ updatedFile?.lastModify }} 更新</span>
          </div>
        </div>
      </div>

      <!-- 受影響的知識條目列表 -->
      <div class="affected-section">
        <div class="affected-section__label">
          <i class="material-symbols-outlined">menu_book</i>
          受影響的知識條目（{{ affectedItems.length }} 筆）
        </div>

        <div class="affected-list">
          <div class="affected-item" v-for="item in affectedItems" :key="item.id">
            <div class="affected-item__info">
              <div class="affected-item__title">{{ item.title }}</div>
              <div class="affected-item__meta">
                <span class="category-tag">{{ item.category }}</span>
                <span class="fc-grey-1 fs-12">目前版本 {{ item.currentVersion }}</span>
              </div>
            </div>
            <div class="affected-item__actions">
              <button class="custom-btn custom-btn--sm" @click="openDiff(item.id)">
                <i class="material-symbols-outlined">difference</i>
                查看差異
              </button>
              <button class="custom-btn custom-main-btn custom-btn--sm" @click="handleCreateDraft(item.id)">
                <i class="material-symbols-outlined">add_circle</i>
                建立新版本草稿
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 差異預覽（展開時顯示） -->
      <div class="diff-panel" v-if="diffKnowledgeId">
        <div class="diff-panel__header">
          <span class="fw-600 fs-14">{{ diffItem?.title }} — 來源差異預覽</span>
          <button class="icon-btn icon-btn--sm" @click="diffKnowledgeId = null">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="diff-panel__body">
          <div class="diff-col diff-col--old">
            <div class="diff-col__label">關聯版本</div>
            <div class="diff-col__file">
              <i class="material-symbols-outlined">table_view</i>
              {{ updatedFile?.fileName }}
              <span class="version-chip version-chip--old">v{{ prevVersion }}</span>
            </div>
            <div class="diff-col__note">知識條目建立時的來源版本</div>
          </div>
          <div class="diff-col diff-col--new">
            <div class="diff-col__label">最新版本</div>
            <div class="diff-col__file">
              <i class="material-symbols-outlined">table_view</i>
              {{ updatedFile?.fileName }}
              <span class="version-chip version-chip--new">v{{ updatedFile?.version }}</span>
            </div>
            <div class="diff-col__note">{{ updatedFile?.lastModify }} 上傳的新版本</div>
          </div>
        </div>
        <div class="diff-panel__hint">
          <i class="material-symbols-outlined">info</i>
          詳細欄位差異需在建立草稿後由 AI 解析產生。點擊「建立新版本草稿」，AI 將根據新版檔案重新生成知識內容建議。
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer-box">
        <button class="custom-btn" @click="handleDismissAll">
          稍後統一處理
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceStore } from '@/stores/resourceStore';
import { useKnowledgeStore } from '@/stores/knowledgeStore';

const props = defineProps<{
  modelValue: boolean;
  fileId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const router = useRouter();
const resourceStore = useResourceStore();
const knowledgeStore = useKnowledgeStore();

const updatedFile = computed(() => resourceStore.getFileById(props.fileId));

// 取得上一版版本號（目前版本 - 1）
const prevVersion = computed(() => {
  const v = updatedFile.value?.version ?? 1;
  return Math.max(1, v - 1);
});

// 找出所有關聯此檔案且 sourceStale 的知識條目
const affectedItems = computed(() =>
  knowledgeStore.knowledgeList.filter(k =>
    k.sourceStale && k.staleSourceFileIds?.includes(props.fileId)
  )
);

// 差異展開
const diffKnowledgeId = ref<string | null>(null);
const diffItem = computed(() =>
  diffKnowledgeId.value
    ? knowledgeStore.getKnowledgeById(diffKnowledgeId.value)
    : null
);

function openDiff(knowledgeId: string) {
  diffKnowledgeId.value = diffKnowledgeId.value === knowledgeId ? null : knowledgeId;
}

function handleCreateDraft(knowledgeId: string) {
  const versionId = knowledgeStore.createDraftFromSourceUpdate(
    knowledgeId,
    (id) => resourceStore.getFileById(id)
  );
  emit('update:modelValue', false);
  if (versionId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } });
  }
}

function handleDismissAll() {
  for (const item of affectedItems.value) {
    knowledgeStore.dismissSourceStale(item.id);
  }
  emit('update:modelValue', false);
}
</script>
