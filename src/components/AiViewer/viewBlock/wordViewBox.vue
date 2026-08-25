<template>
  <div class="wordViewBox">
    <div class="file-icon-tile" :class="`file-icon-tile--${meta.color}`">
      <i class="material-symbols-outlined file-type-icon">{{ meta.icon }}</i>
    </div>
    <div>{{ 'TODO...這邊之後呈現檔案名稱或檔案url.' }}</div>
  </div>
</template>

<script setup lang="ts">
// word 預覽元件 (暫時只顯示圖示)：跟共用資源庫同一份 file-icon-tile 語言，
// 不再用 fileTypeIcon/word.png 那組舊的素材圖
import { fileTypeMeta } from '@/utils/file';

const meta = fileTypeMeta('WORD');

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
