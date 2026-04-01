<template>
  <div class="compSwitch" role="tablist">
    <button
      v-for="(option, i) in options"
      :key="'option' + i"
      class="compSwitch-item"
      :class="{
        'is-active': option.value === currentValue,
        'is-disabled': disabled,
      }"
      type="button"
      role="tab"
      :aria-selected="option.value === currentValue"
      :disabled="disabled"
      @click="onClick(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type SwitchOption = {
  label: string;
  value: boolean;
  others?: any; // 可帶入其他資料，點擊事件會帶回整個 tab 物件
};

const props = withDefaults(
  defineProps<{
    options: SwitchOption[];
    modelValue?: boolean;
    disabled?: boolean;
  }>(),
  {
    options: () => [],
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'item-click', option: SwitchOption): void;
}>();

const currentValue = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  }

  return props.options[0]?.value ?? false;
});

const onClick = (option: SwitchOption) => {
  if (props.disabled) {
    return;
  }

  if (option.value !== currentValue.value) {
    emit('update:modelValue', option.value);
  }

  emit('item-click', option);
};
</script>
