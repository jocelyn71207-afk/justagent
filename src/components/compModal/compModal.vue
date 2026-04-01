<template>
  <div class="compModal" v-if="modelValue" @wheel.prevent @touchmove.prevent>
    <div class="compModal-mask" @click="handleMaskClick"></div>
    <div class="compModal-panel" :style="panelStyle" role="dialog" aria-modal="true" >
      <div class="compModal-header">
        <div class="compModal-title">
          <slot name="title">
            {{ title }}
          </slot>
        </div>
        <button v-if="showClose" class="compModal-close-btn" @click="handleClose">
          <i class="material-symbols-outlined material-fill clear-trigger-icon" style="">close</i>
        </button>
      </div>
      <div class="compModal-body" @wheel.stop @touchmove.stop>
        <slot />
        <div class="compModal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type SizeValue = string | number | undefined;

const props = withDefaults(
  defineProps<{
    modelValue: boolean; // 是否顯示 Modal
    title?: string;
    width?: SizeValue;
    height?: SizeValue;
    showClose?: boolean;
    closeOnMask?: boolean;
  }>(),
  {
    title: "",
    width: undefined,
    height: undefined,
    showClose: true,
    closeOnMask: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const normalizeSize = (value: SizeValue): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
};

const panelStyle = computed(() => {
  const width = normalizeSize(props.width);
  const height = normalizeSize(props.height);

  return {
    width: width ?? "100%",
    height: height ?? "auto",
    maxWidth: width ? undefined : "476px",
    maxHeight: height ? undefined : "75vh",
  } as Record<string, string | undefined>;
});

const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleMaskClick = () => {
  if (props.closeOnMask) {
    handleClose();
  }
};
</script>
