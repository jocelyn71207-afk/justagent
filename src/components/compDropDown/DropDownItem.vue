<template>
  <div class="dropdown-item-wrapper">
    <div class="dropdown-item" :class="{
      'selected': itemProps.selectedValue === itemProps.option.value,
      'has-children': itemProps.option.children && itemProps.option.children.length > 0
    }" :style="{ paddingLeft: `calc(${itemProps.indentSize} + ${itemProps.indentSize} * ${itemProps.indent})` }" @click="handleClick">
      <!-- 展開/收合圖示 -->
      <i v-if="itemProps.option.children && itemProps.option.children.length > 0"
        class="material-symbols-outlined expand-icon" :class="{ 'expanded': isExpanded }">
        chevron_right
      </i>

      <!-- 項目名稱 -->
      <span class="item-name">{{ itemProps.option.name }}</span>

      <!-- 選中圖示 -->
      <i v-if="itemProps.selectedValue === itemProps.option.value" class="material-symbols-outlined check-icon">
        check
      </i>
    </div>

    <!-- 子選單 (遞迴) -->
    <div v-if="itemProps.option.children && itemProps.option.children.length > 0 && isExpanded" class="children-list">
      <DropDownItem v-for="child in itemProps.option.children" :key="child.value" :option="child"
        :selected-value="itemProps.selectedValue" :indent="itemProps.indent + 1" :indent-size="itemProps.indentSize"
        @select="handleChildSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface DropDownOption {
  name: string;
  value: string | number;
  children?: DropDownOption[];
}

const itemProps = defineProps<{
  option: DropDownOption;
  selectedValue: string | number;
  indent: number;
  indentSize: string;
}>();

const itemEmit = defineEmits<{
  select: [option: DropDownOption];
}>();

const isExpanded = ref(true);

function handleClick() {
  if (itemProps.option.children && itemProps.option.children.length > 0) {
    isExpanded.value = !isExpanded.value;
  } else {
    itemEmit('select', itemProps.option);
  }
}

function handleChildSelect(option: DropDownOption) {
  itemEmit('select', option);
}
</script>
