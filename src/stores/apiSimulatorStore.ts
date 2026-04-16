// src/stores/apiSimulatorStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ApiMode = 'normal' | 'loading' | 'error';
export type ApiDelay = 200 | 500 | 1000 | 2000;

const STORAGE_KEY = 'api-simulator';

interface PersistedState {
  mode: ApiMode;
  delay: ApiDelay;
  errorMessage: string;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: 'normal', delay: 500, errorMessage: '伺服器發生錯誤，請稍後再試' };
}

export const useApiSimulatorStore = defineStore('apiSimulator', () => {
  const saved = loadState();
  const mode = ref<ApiMode>(saved.mode);
  const delay = ref<ApiDelay>(saved.delay);
  const errorMessage = ref<string>(saved.errorMessage);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      delay: delay.value,
      errorMessage: errorMessage.value,
    }));
  }

  function setMode(m: ApiMode) { mode.value = m; save(); }
  function setDelay(d: ApiDelay) { delay.value = d; save(); }
  function setErrorMessage(msg: string) { errorMessage.value = msg; save(); }

  return { mode, delay, errorMessage, setMode, setDelay, setErrorMessage };
});
