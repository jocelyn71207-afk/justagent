<template>
  <div ref="autocompleteRef" class="compAutocomplete" :style="{ width: props.width }">
    <!-- 輸入框 -->
    <div class="autocomplete-input-wrapper">
      <input
        ref="inputRef"
        type="text"
        class="autocomplete-input custom-input"
        v-model="inputValue"
        :placeholder="props.placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />
      <i
        v-show="inputValue"
        class="material-symbols-outlined material-fill clear-icon"
        @click="clearInput"
      >
        close
      </i>
    </div>

    <!-- 建議列表 -->
    <div v-show="isOpen && filteredOptions.length > 0" class="autocomplete-dropdown" :class="{ 'dropup': isDropup }">
      <div
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        class="autocomplete-item"
        :class="{ 'highlighted': index === highlightedIndex }"
        @click="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        <span v-html="highlightMatch(option.label)"></span>
      </div>
    </div>

    <!-- 無匹配提示 -->
    <div v-show="isOpen && inputValue && filteredOptions.length === 0" class="autocomplete-dropdown" :class="{ 'dropup': isDropup }">
      <div class="no-match">{{ props.noMatchText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// 選項資料型別
export interface AutocompleteOption {
  label: string;
  value: any;
}

// Props 定義
const props = withDefaults(defineProps<{
  options: AutocompleteOption[];        // 選項列表
  placeholder?: string;                 // 輸入框提示文字
  noMatchText?: string;                 // 無匹配項目時的提示文字
  defaultValue?: string;                // 預設輸入值
  minChars?: number;                    // 開始過濾的最小字符數
  width?: string;                       // 組件寬度，支持 px 和 %
}>(), {
  placeholder: '請輸入',
  noMatchText: '無符合的項目',
  defaultValue: '',
  minChars: 0,
  width: '100%'
});

// Emits 定義
const emit = defineEmits<{
  select: [option: AutocompleteOption];  // 選擇項目時觸發，返回選中的完整選項對象
  input: [value: string];                // 輸入內容改變時觸發，返回當前輸入框的值
}>();

// 狀態
const inputValue = ref(props.defaultValue);
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const isDropup = ref(false);
const debounceTimer = ref<number | undefined>(undefined);
const debounceMs = 500;

// 元素引用
const autocompleteRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// 監聽 defaultValue 變化
watch(() => props.defaultValue, (newVal) => {
  inputValue.value = newVal;
});

// 過濾選項
const filteredOptions = computed(() => {
  // 沒有輸入時，返回所有選項
  if (!inputValue.value) {
    return props.options;
  }

  // 檢查最小字符數
  if (inputValue.value.length < props.minChars) {
    return [];
  }

  const keyword = inputValue.value.toLowerCase();
  return props.options.filter(option =>
    option.label.toLowerCase().includes(keyword)
  );
});

// 處理輸入
function handleInput() {
  if (debounceTimer.value !== undefined) {
    window.clearTimeout(debounceTimer.value);
  }

  debounceTimer.value = window.setTimeout(() => {
    emit('input', inputValue.value);
    checkDropupNeeded();
    isOpen.value = true;
    highlightedIndex.value = -1;
  }, debounceMs);
}

// 處理焦點
function handleFocus() {
  checkDropupNeeded();
  isOpen.value = true;
}

// 檢查是否需要向上展開
function checkDropupNeeded() {
  if (!autocompleteRef.value) return;

  const rect = autocompleteRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const dropdownMaxHeight = 200; // 與 CSS 中的 max-height 一致

  // 如果下方空間不足且上方空間充足，則向上展開
  isDropup.value = spaceBelow < dropdownMaxHeight && rect.top > dropdownMaxHeight;
}

// 向下導航
function navigateDown() {
  if (filteredOptions.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % filteredOptions.value.length;
}

// 向上導航
function navigateUp() {
  if (filteredOptions.value.length === 0) return;
  if (highlightedIndex.value <= 0) {
    highlightedIndex.value = filteredOptions.value.length - 1;
  } else {
    highlightedIndex.value--;
  }
}

// 選擇高亮項目
function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value]);
  }
}

// 選擇選項
function selectOption(option: AutocompleteOption) {
  inputValue.value = option.label;
  emit('select', option);
  emit('input', option.label);
  closeDropdown();
}

// 關閉下拉列表
function closeDropdown() {
  isOpen.value = false;
  highlightedIndex.value = -1;
}

// 清除輸入
function clearInput() {
  inputValue.value = '';
  emit('input', '');
  closeDropdown();
  inputRef.value?.focus();
}

// 高亮匹配文字
function highlightMatch(text: string): string {
  if (!inputValue.value) return text;

  const regex = new RegExp(`(${inputValue.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 處理點擊外部
function handleClickOutside(event: MouseEvent) {
  if (autocompleteRef.value && !autocompleteRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

// 生命週期
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (debounceTimer.value !== undefined) {
    window.clearTimeout(debounceTimer.value);
  }
});
</script>
