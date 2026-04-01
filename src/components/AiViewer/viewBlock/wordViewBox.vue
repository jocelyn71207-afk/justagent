<template>
  <div class="wordViewBox">
    <img :src="wordIcon" alt="word Icon"/>
    <div>{{ 'TODO...這邊之後呈現檔案名稱或檔案url.' }}</div>
  </div>
</template>

<script setup lang="ts">
// word 預覽元件 (暫時只顯示圖示)
import { ref } from 'vue';
import wordIconPath from '@/assets/fileTypeIcon/word.png';

const wordIcon = ref(wordIconPath);

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
