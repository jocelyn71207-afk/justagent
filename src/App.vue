<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

window.debug = {}; // DEBUG 用

onMounted(async () => {
  // 等待 Material Symbols Rounded 字型載入，避免 icon 一開始顯示為文字造成破版
  // 最多等待 3 秒，超時後無論如何都顯示畫面，防止 Google Fonts 失敗時白畫面卡死
  const timeout = new Promise<void>(resolve => setTimeout(resolve, 3000));
  await Promise.race([
    document.fonts.load('1em "Material Symbols Rounded"'),
    timeout,
  ]);
  document.getElementById('app')?.classList.add('show');
});
</script>
