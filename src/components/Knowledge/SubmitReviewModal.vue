<template>
  <div v-if="modelValue" class="modal-root">
    <div class="swal2-container swal2-center swal2-backdrop-show" @click.self="$emit('update:modelValue', false)">
      <div class="swal2-popup swal2-modal swal2-show pop_dialog" style="display: flex;">
        <div class="swal2-content text-left">
          <h4 class="fw-700 mb-3">送出版本審核</h4>
          <p class="fs-14 fc-grey-1 mb-4">請選擇審核人並填寫備註，審核通過後此版本將成為正式發布版本。</p>
          
          <div class="mb-4">
            <label class="form-label fs-14 fw-600 mb-2 block">選擇審核人</label>
            <compDropDown
              :options="reviewerOptions"
              :show-search="true"
              placeholder="請搜尋或選擇審核人"
              class="w-100"
              @select="(item: any) => reviewerId = String(item.value)"
            />
          </div>

          <div class="mb-4">
            <label class="form-label fs-14 fw-600 mb-2 block">審核備註</label>
            <textarea 
              class="custom-input w-100" 
              rows="3" 
              v-model="note" 
              placeholder="給審核人的訊息..."
            ></textarea>
          </div>
        </div>
        
        <div class="swal2-actions w-100 mt-4">
          <button class="swal2-cancel swal2-styled" @click="$emit('update:modelValue', false)">取消</button>
          <button 
            class="swal2-confirm swal2-styled btn-secondary" 
            :disabled="!reviewerId"
            @click="handleConfirm"
          >
            確認送審
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const reviewerId = ref('');
const note = ref('');

const reviewerOptions = [
  { name: 'Lucas (主管)', value: 'lucas' },
  { name: 'Rita (管理員)', value: 'rita' },
  { name: 'Kevin (負責人)', value: 'kevin' }
];

function handleConfirm() {
  if (!reviewerId.value) return;
  emit('confirm', { reviewer: reviewerId.value, note: note.value });
  emit('update:modelValue', false);
}
</script>
