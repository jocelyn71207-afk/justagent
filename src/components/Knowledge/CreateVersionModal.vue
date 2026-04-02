<template>
  <div v-if="modelValue" class="modal-root">
    <div class="swal2-container swal2-center swal2-backdrop-show" @click.self="$emit('update:modelValue', false)">
      <div class="swal2-popup swal2-modal swal2-show pop_dialog" style="display: flex;">
        <div class="swal2-content text-left">
          <h4 class="fw-700 mb-2">建立新版本草稿</h4>
          <p class="fs-14 fc-grey-1 mb-4">
            建立草稿不會影響目前已發布版本。您可以在編輯器中修改後再送審，審核通過才會正式取代目前版本。
          </p>

          <!-- 版本類型選擇 -->
          <div class="mb-4">
            <label class="field-label">版本升級類型 <span style="color: #e53935;">*</span></label>
            <div class="d-flex gap-3 mt-2">
              <div
                class="KnowledgeBase version-type-btn flex-1"
                :class="{ active: type === 'MINOR' }"
                @click="type = 'MINOR'"
              >
                <div class="version-type-title">小版本更新 (Minor)</div>
                <div class="version-type-desc">v1.2 → v1.3　適用：修正錯字、微調數據</div>
              </div>
              <div
                class="KnowledgeBase version-type-btn flex-1"
                :class="{ active: type === 'MAJOR' }"
                @click="type = 'MAJOR'"
              >
                <div class="version-type-title">大版本更新 (Major)</div>
                <div class="version-type-desc">v1.2 → v2.0　適用：政策重構、大幅改寫</div>
              </div>
            </div>
          </div>

          <!-- 更新說明 -->
          <div class="mb-4">
            <label class="field-label">本次更新說明 <span style="color: #e53935;">*</span></label>
            <textarea
              class="custom-input w-100 mt-2"
              rows="3"
              v-model="note"
              placeholder="請簡述本次更新的重點，例如：修正保固條款的有效期限描述..."
            ></textarea>
          </div>
        </div>

        <div class="swal2-actions w-100 mt-2">
          <button class="swal2-cancel swal2-styled" @click="$emit('update:modelValue', false)">取消</button>
          <button
            class="swal2-confirm swal2-styled btn-secondary"
            :disabled="!note.trim()"
            @click="handleConfirm"
          >
            <i class="material-symbols-outlined fs-18 mr-1">add_box</i>
            建立草稿版本
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', data: { type: 'MINOR' | 'MAJOR'; note: string }): void;
}>();

const type = ref<'MINOR' | 'MAJOR'>('MINOR');
const note = ref('');

watch(() => props.modelValue, (val) => {
  if (val) {
    type.value = 'MINOR';
    note.value = '';
  }
});

function handleConfirm() {
  if (!note.value.trim()) return;
  emit('confirm', { type: type.value, note: note.value });
  emit('update:modelValue', false);
}
</script>
