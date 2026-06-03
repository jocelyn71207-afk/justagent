<!-- src/components/Knowledge/ErrorLogModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="emit('update:modelValue', false)">
      <div class="modal-box error-log-modal">
        <div class="modal-header">
          <span class="modal-title">錯誤紀錄</span>
          <button class="modal-close-btn" @click="emit('update:modelValue', false)">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="modal-body error-log-body">
          <pre v-if="errorMessage" class="error-log-pre">{{ errorMessage }}</pre>
          <p v-else class="fc-grey-1 fs-13">無錯誤資訊</p>
        </div>
        <div class="modal-footer">
          <button class="custom-btn" @click="emit('update:modelValue', false)">關閉</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>
