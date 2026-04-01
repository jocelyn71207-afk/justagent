<template>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    IMAGE 載入失敗
  </div>

  <div class="imageViewBox" v-if="!isFailure">
    <img @load="isFailure = false" @error="isFailure = true; emit('failure', true)"
      :src="props.source.data.fileUrl" />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const props = defineProps({
    isFullView: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    source: {
      type: Object,
      required: true
    }
  });

  // 定義 emit
  const emit = defineEmits<{
    (e: 'failure', value: boolean): void
  }>();

  const isFailure = ref(false);
</script>
