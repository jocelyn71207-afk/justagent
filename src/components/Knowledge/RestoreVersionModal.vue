<template>
  <div v-if="modelValue" class="modal-root">
    <div class="swal2-container swal2-center swal2-backdrop-show" @click.self="$emit('update:modelValue', false)">
      <div class="swal2-popup swal2-modal swal2-show pop_dialog" style="display: flex;">
        <div class="swal2-content text-left">
          <h4 class="fw-700 mb-3">還原舊版本內容</h4>
          <p class="fs-14 fc-grey-1 mb-4">系統將根據所選的舊版本內容（{{ versionNumber }}）建立一個新草稿。這不會影響目前的發布版本。</p>
          
          <div class="mb-4">
            <label class="form-label fs-14 fw-600 mb-2 block">還原原因 / 備註 (選填)</label>
            <textarea 
              class="custom-input w-100" 
              rows="3" 
              v-model="note" 
              placeholder="例如：目前發布版本有誤，回溯至前一版..."
            ></textarea>
          </div>
        </div>
        
        <div class="swal2-actions w-100 mt-4">
          <button class="swal2-cancel swal2-styled" @click="$emit('update:modelValue', false)">取消</button>
          <button 
            class="swal2-confirm swal2-styled btn-secondary" 
            @click="handleConfirm"
          >
            建立還原草稿
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  versionNumber: string;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const note = ref('');

function handleConfirm() {
  emit('confirm', note.value);
  emit('update:modelValue', false);
}
</script>
