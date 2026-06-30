<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="ConfirmModal">
        <div class="cm-overlay" />
        <div class="cm-dialog">
          <div class="cm-head">
            <i v-if="variant === 'danger'" class="material-symbols-outlined cm-icon--danger">warning</i>
            <h3>{{ title }}</h3>
          </div>
          <div class="cm-body">{{ message }}</div>
          <div class="cm-footer">
            <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
            <button
              :class="['custom-btn', 'custom-main-btn', variant === 'danger' && 'cm-btn--danger']"
              @click="handleConfirm"
            >{{ confirmLabel ?? '確認' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'default' | 'danger'
}>(), { variant: 'default' })

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
