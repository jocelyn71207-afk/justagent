<!-- App.vue -->
<template>
  <div
    class="app-progress-bar"
    :style="{ width: progress + '%', opacity: showProgress ? 1 : 0 }"
  ></div>
  <RouterView />
  <AppDevToggle />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import AppDevToggle from '@/components/AppDevToggle.vue';

const router = useRouter();
const progress = ref(0);
const showProgress = ref(false);
let t1: ReturnType<typeof setTimeout>;
let t2: ReturnType<typeof setTimeout>;

router.beforeEach(() => {
  clearTimeout(t1); clearTimeout(t2);
  showProgress.value = true;
  progress.value = 20;
  t1 = setTimeout(() => { progress.value = 60; }, 150);
  t2 = setTimeout(() => { progress.value = 80; }, 400);
});

router.afterEach(() => {
  clearTimeout(t1); clearTimeout(t2);
  progress.value = 100;
  setTimeout(() => { showProgress.value = false; progress.value = 0; }, 300);
});

(window as any).debug = {};

onMounted(async () => {
  const timeout = new Promise<void>(resolve => setTimeout(resolve, 3000));
  await Promise.race([
    document.fonts.load('1em "Material Symbols Rounded"'),
    timeout,
  ]);
  document.getElementById('app')?.classList.add('show');
});
</script>
