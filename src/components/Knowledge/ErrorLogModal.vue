<template>
  <compModal v-model="props.modelValue" title="錯誤紀錄" :width="560" @update:model-value="v => emit('update:modelValue', v)">
    <pre v-if="errorMessage" class="error-log-pre">{{ errorMessage }}</pre>
    <p v-else class="fc-grey-1 fs-13">無錯誤資訊</p>

    <template #footer>
      <button class="custom-btn" @click="emit('update:modelValue', false)">關閉</button>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import compModal from '@/components/compModal/compModal.vue'

const props = defineProps<{
  modelValue: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>
