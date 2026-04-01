<template>
	<div class="compListCardSwitch" role="tablist" aria-label="View mode switch">
    <!-- Card -->
		<button
			class="compListCardSwitch-item"
			:class="{ 'is-active': currentValue === 'card', 'is-disabled': disabled }"
			type="button"
			role="tab"
			:aria-selected="currentValue === 'card'"
			:disabled="disabled"
			@click="onClick('card')"
		>
      <i class="material-symbols-outlined">grid_view</i>
		</button>

    <!-- List -->
		<button
			class="compListCardSwitch-item"
			:class="{ 'is-active': currentValue === 'list', 'is-disabled': disabled }"
			type="button"
			role="tab"
			:aria-selected="currentValue === 'list'"
			:disabled="disabled"
			@click="onClick('list')"
		>
      <i class="material-symbols-outlined">format_list_bulleted</i>
		</button>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type ListCardMode = 'list' | 'card';

const props = withDefaults(
	defineProps<{
		modelValue?: ListCardMode;
		disabled?: boolean;
	}>(),
	{
		modelValue: 'card', // 預設為卡片模式
		disabled: false,
	}
);

const emit = defineEmits<{
	(e: 'update:modelValue', value: ListCardMode): void; // 更新 v-model 綁定的值
	(e: 'change', value: ListCardMode): void; // 外部可選，提供額外的 change 事件
}>();

const currentValue = computed<ListCardMode>(() => props.modelValue ?? 'list');

const onClick = (mode: ListCardMode) => {
	if (props.disabled || mode === currentValue.value) {
		return;
	}
	emit('update:modelValue', mode);
	emit('change', mode);
};
</script>
