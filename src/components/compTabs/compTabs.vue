<template>
  <ul class="compTabs">
    <li
      v-for="tab in tabs"
      :key="String(tab.value)"
      class="compTabs-item"
      :class="{ 'is-active': tab.value === currentValue, 'is-disabled': tab.disabled }"
      :aria-disabled="tab.disabled ? 'true' : 'false'"
      @click="onTabClick(tab)"
    >
      <button class="custom-btn compTabs-label-btn" :disabled="tab.disabled" v-html="tab.label"></button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

type TabItem = {
  label: string;
  value: string | number;
  disabled?: boolean;
  others?: any; // 可帶入其他資料，點擊事件會帶回整個 tab 物件
};

const props = defineProps<{
  tabs: TabItem[];
  modelValue?: TabItem['value'];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TabItem['value']): void;
  (e: 'tab-click', tab: TabItem): void;
}>();

const currentValue = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  }

  return props.tabs[0]?.value;
});

const onTabClick = (tab: TabItem) => {
  if (tab.disabled) {
    return;
  }
  emit('update:modelValue', tab.value);
  emit('tab-click', tab);
};

watch(
  () => props.tabs,
  (tabs) => {
    if (props.modelValue === undefined && tabs.length > 0) {
      emit('update:modelValue', tabs[0].value);
    }
  },
  { immediate: true }
);
</script>

