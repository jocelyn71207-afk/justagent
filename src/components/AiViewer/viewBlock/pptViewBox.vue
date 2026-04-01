<template>
  <div class="ppfViewBox">
    <img :src="pptIcon" alt="PPT Icon"/>
    <div>{{ 'TODO...這邊之後呈現檔案名稱或檔案url.' }}</div>
  </div>
</template>

<script setup lang="ts">
// Powerpoint 預覽元件 (暫時只顯示圖示)
import { ref } from 'vue';
import pptIconPath from '@/assets/fileTypeIcon/ppt.png';

const pptIcon = ref(pptIconPath);

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  source: {
    type: Object,
    required: true
  }
});

</script>
