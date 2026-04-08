// src/composables/useApiCall.ts
import { ref, watch, watchEffect, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore';

export function useApiCall<T>(fetcher: () => T) {
  const simulator = useApiSimulatorStore();
  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(true);
  const hasError = ref(false);
  const errorMessage = ref('');

  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopEffect: (() => void) | null = null;

  function clearTimer() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  function execute() {
    clearTimer();
    if (stopEffect) { stopEffect(); stopEffect = null; }

    isLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    // 永遠 pending：不設 timer，等待 mode 改變後 watch 重新觸發
    if (simulator.mode === 'loading') return;

    timer = setTimeout(() => {
      timer = null;
      if (simulator.mode === 'error') {
        isLoading.value = false;
        hasError.value = true;
        errorMessage.value = simulator.errorMessage;
      } else {
        // 成功後用 watchEffect 保持 data 與 store 同步（響應後續 store mutations）
        stopEffect = watchEffect(() => {
          data.value = fetcher();
        });
        isLoading.value = false;
      }
    }, simulator.delay);
  }

  // mode 改變時重新執行（immediate: true 表示 mount 時立即執行）
  watch(() => simulator.mode, execute, { immediate: true });

  onUnmounted(() => {
    clearTimer();
    if (stopEffect) stopEffect();
  });

  return { data, isLoading, hasError, errorMessage, retry: execute };
}
