<!-- src/components/AppErrorState.vue -->
<template>
  <div :class="['app-error-state', { 'app-error-state--inline': inline }]">
    <i class="material-symbols-outlined app-error-state__icon">error_outline</i>
    <div class="app-error-state__message">{{ message }}</div>
    <button class="custom-btn custom-main-btn mt-3" @click="$emit('retry')">
      <i class="material-symbols-outlined">refresh</i>
      重試
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; inline?: boolean }>();
defineEmits<{ retry: [] }>();
</script>
