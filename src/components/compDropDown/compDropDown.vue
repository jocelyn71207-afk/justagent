<template>
  <div class="compDropDown" ref="dropdownRef" :style="{ width: props.width }">
    <!-- 觸發按鈕 -->
    <div class="dropdown-trigger" @click="toggleDropdown">
      <span class="selected-text">{{ selectedText || props.placeholder }}</span>
      <div class="trigger-icons">
        <i
          v-show="selectedValue && selectedText && props.showClearTriggerIcon"
          class="material-symbols-outlined material-fill clear-trigger-icon"
          @click.stop="clearSelection"
        >
          close
        </i>
        <i class="material-symbols-outlined arrow-icon" :class="{ 'open': isOpen }">
          expand_more
        </i>
      </div>
    </div>

    <!-- 下拉選單 -->
    <div v-show="isOpen" class="dropdown-menu" :class="{ 'dropup': isDropup }">
      <!-- 搜尋框 -->
      <div class="search-box" v-if="props.showSearch">
        <div class="search-input-wrapper">
          <input
            type="text"
            class="search-input custom-input"
            v-model="searchKeyword"
            :placeholder="props.searchPlaceholder"
          />
          <i
            v-show="searchKeyword"
            class="material-symbols-outlined clear-icon"
            @click="clearSearch"
          >
            close
          </i>
        </div>
      </div>

      <!-- 選單清單 -->
      <div class="options-list" :style="{ maxHeight: props.maxHeight }">
        <template v-if="filteredOptions.length > 0">
          <DropDownItem
            v-for="option in filteredOptions"
            :key="option.value"
            :option="option"
            :selected-value="selectedValue"
            :indent="0"
            :indent-size="props.indent"
            @select="handleSelect"
          />
        </template>
        <div v-else class="no-match-data">無符合的選項</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import DropDownItem from './DropDownItem.vue';

// 選項資料型別定義
export interface DropDownOption {
  name: string;
  value: string | number;
  children?: DropDownOption[];
}

// Props 定義
const props = withDefaults(defineProps<{
  options: DropDownOption[];
  showSearch?: boolean;
  showClearTriggerIcon?: boolean;
  defaultValue?: string | number;
  maxHeight?: string;
  width?: string;
  indent?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  openByDefault?: boolean;
  alwaysOpen?: boolean;
}>(), {
  showSearch: false,
  showClearTriggerIcon: true,
  defaultValue: '',
  maxHeight: '200px',
  width: '200px',
  indent: '20px',
  placeholder: '請選擇',
  searchPlaceholder: '搜尋...',
  openByDefault: false,
  alwaysOpen: false
});

// Emits 定義
const emit = defineEmits<{
  select: [option: DropDownOption];
}>();

// 搜尋關鍵字
const searchKeyword = ref('');

// 選中的值
const selectedValue = ref<string | number>(props.defaultValue);

// 下拉選單是否展開
const isOpen = ref(false);

// 是否向上展開
const isDropup = ref(false);

// 組件根元素 ref
const dropdownRef = ref<HTMLElement | null>(null);

// 監聽 defaultValue 變化
watch(() => props.defaultValue, (newVal) => {
  selectedValue.value = newVal;
});

// 處理點擊外部區域
function handleClickOutside(event: MouseEvent) {
  if (!props.alwaysOpen && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

// 掛載時添加事件監聽
onMounted(() => {
  if (props.openByDefault) {
    isOpen.value = true;
    checkDropupNeeded();
  }
  document.addEventListener('click', handleClickOutside);
});

// 卸載時移除事件監聽
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 切換下拉選單
function toggleDropdown() {
  if (!isOpen.value) {
    // 檢查下方空間是否足夠
    checkDropupNeeded();
  }
  isOpen.value = !isOpen.value;
}

// 檢查是否需要向上展開
function checkDropupNeeded() {
  if (!dropdownRef.value) return;

  const rect = dropdownRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const menuHeight = parseInt(props.maxHeight) || 200;

  // 如果下方空間不足且上方空間充足，則向上展開
  isDropup.value = spaceBelow < menuHeight && rect.top > menuHeight;
}

// 關閉下拉選單
function closeDropdown() {
  if (!props.alwaysOpen) {
    isOpen.value = false;
  }
}

// 清除搜尋關鍵字
function clearSearch() {
  searchKeyword.value = '';
}

// 清除選擇
function clearSelection() {
  selectedValue.value = '';
  emit('select', { name: '', value: '', children: undefined });
  if (!props.alwaysOpen) {
    closeDropdown();
  }
}

// 獲取選中項目的文字
const selectedText = computed(() => {
  if (!selectedValue.value) return '';

  function findOption(options: DropDownOption[]): string {
    for (const option of options) {
      if (option.value === selectedValue.value) {
        return option.name;
      }
      if (option.children) {
        const found = findOption(option.children);
        if (found) return found;
      }
    }
    return '';
  }

  return findOption(props.options);
});

// 遞迴過濾選項
function filterOptions(options: DropDownOption[], keyword: string): DropDownOption[] {
  if (!keyword) return options;

  const result: DropDownOption[] = [];

  for (const option of options) {
    // 檢查當前項目是否匹配
    const isMatch = option.name.toLowerCase().includes(keyword.toLowerCase());

    // 遞迴檢查子項目
    const filteredChildren = option.children
      ? filterOptions(option.children, keyword)
      : [];

    // 如果當前項目匹配或有子項目匹配，則加入結果
    if (isMatch || filteredChildren.length > 0) {
      result.push({
        ...option,
        children: filteredChildren.length > 0 ? filteredChildren : option.children
      });
    }
  }

  return result;
}

// 過濾後的選項
const filteredOptions = computed(() => {
  return filterOptions(props.options, searchKeyword.value);
});

// 處理選擇
function handleSelect(option: DropDownOption) {
  selectedValue.value = option.value;
  emit('select', option);
  searchKeyword.value = ''; // 清空搜尋關鍵字
  closeDropdown(); // 選擇後關閉選單
}

</script>
