<template>
  <div v-if="modelValue" class="modal-root">
    <div class="swal2-container swal2-center swal2-backdrop-show" @click.self="$emit('update:modelValue', false)">
      <div class="swal2-popup swal2-modal swal2-show pop_dialog" style="display: flex;">
        <div class="swal2-content text-left">
          <h4 class="fw-700 mb-2">建立新版本草稿</h4>
          <p class="fs-14 fc-grey-1 mb-4">
            建立草稿不會影響目前已發布版本。您可以在編輯器中修改後再送審，審核通過才會正式取代目前版本。
          </p>

          <!-- 版本名稱 -->
          <div class="mb-4">
            <label class="field-label">版本名稱 <span class="required-mark">*</span></label>
            <input
              type="text"
              class="custom-input w-100 mt-2"
              v-model="name"
              placeholder="請幫這個版本取個名字，例如：修正保固條款用詞"
            />
          </div>

          <!-- 更新說明 -->
          <div class="mb-4">
            <label class="field-label">本次更新說明 <span class="required-mark">*</span></label>
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
            :disabled="!name.trim() || !note.trim()"
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
  (e: 'confirm', data: { name: string; note: string }): void;
}>();

const name = ref('');
const note = ref('');

watch(() => props.modelValue, (val) => {
  if (val) {
    name.value = '';
    note.value = '';
  }
});

function handleConfirm() {
  if (!name.value.trim() || !note.value.trim()) return;
  emit('confirm', { name: name.value, note: note.value });
  emit('update:modelValue', false);
}
</script>
