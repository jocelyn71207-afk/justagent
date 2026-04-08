<!-- src/components/AppDevToggle.vue -->
<template>
  <div v-if="isDev" class="app-dev-toggle" :class="{ open: isOpen }">
    <!-- 切換按鈕 -->
    <button class="dev-toggle-btn" @click="isOpen = !isOpen" title="API 模擬器">
      <i class="material-symbols-outlined">settings</i>
    </button>

    <!-- 展開面板 -->
    <div v-if="isOpen" class="dev-toggle-panel">
      <div class="dev-toggle-header">
        <i class="material-symbols-outlined fs-14">settings</i>
        API 模擬器
      </div>

      <!-- 模式 -->
      <div class="dev-toggle-section">
        <div class="dev-toggle-label">模式</div>
        <div class="dev-toggle-radio-group">
          <label v-for="m in modes" :key="m.value" class="dev-toggle-radio">
            <input type="radio" :value="m.value" v-model="currentMode" />
            {{ m.label }}
          </label>
        </div>
      </div>

      <!-- 延遲時間 -->
      <div class="dev-toggle-section">
        <div class="dev-toggle-label">延遲時間</div>
        <select class="custom-input w-100" v-model.number="currentDelay">
          <option v-for="d in delays" :key="d" :value="d">{{ d }} ms</option>
        </select>
      </div>

      <!-- 錯誤訊息（只在 error 模式顯示） -->
      <div class="dev-toggle-section" v-if="currentMode === 'error'">
        <div class="dev-toggle-label">錯誤訊息</div>
        <input class="custom-input w-100" v-model="currentErrorMessage" placeholder="錯誤訊息" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore';
import type { ApiMode, ApiDelay } from '@/stores/apiSimulatorStore';

const isDev = import.meta.env.DEV;
const simulator = useApiSimulatorStore();
const isOpen = ref(false);

const modes: { value: ApiMode; label: string }[] = [
  { value: 'normal',  label: '正常' },
  { value: 'loading', label: '載入中' },
  { value: 'error',   label: '錯誤' },
];
const delays: ApiDelay[] = [200, 500, 1000, 2000];

const currentMode = computed({
  get: () => simulator.mode,
  set: (v: ApiMode) => simulator.setMode(v),
});
const currentDelay = computed({
  get: () => simulator.delay,
  set: (v: number) => simulator.setDelay(v as ApiDelay),
});
const currentErrorMessage = computed({
  get: () => simulator.errorMessage,
  set: (v: string) => simulator.setErrorMessage(v),
});
</script>
