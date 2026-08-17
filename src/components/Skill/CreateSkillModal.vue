<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="CreateSkillModal modal-mask" @click.self="emit('update:modelValue', false)">
        <div class="modal-panel">
          <div class="modal-head">
            <span class="modal-title">建立技能</span>
            <button class="modal-close" @click="emit('update:modelValue', false)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">技能名稱 <span class="required">*</span></label>
              <input
                v-model="form.name"
                class="custom-input"
                placeholder="例：ERP 庫存查詢"
                maxlength="40"
              />
            </div>
            <div class="form-field">
              <label class="form-label">描述</label>
              <textarea
                v-model="form.description"
                class="custom-input form-textarea"
                placeholder="簡短描述此技能的用途"
                rows="3"
                maxlength="120"
              />
            </div>
            <div class="form-field form-field--inline">
              <label class="form-label">建立後立即啟用</label>
              <label class="toggle-switch">
                <input type="checkbox" v-model="form.isEnabled" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
            <button
              class="custom-btn custom-main-btn"
              :disabled="!form.name.trim()"
              @click="handleSubmit"
            >
              建立
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  create: [data: { name: string; description: string; isEnabled: boolean }]
}>()

const form = reactive({ name: '', description: '', isEnabled: true })

watch(() => props.modelValue, (open) => {
  if (open) {
    form.name = ''
    form.description = ''
    form.isEnabled = true
  }
})

function handleSubmit() {
  if (!form.name.trim()) return
  emit('create', { name: form.name.trim(), description: form.description.trim(), isEnabled: form.isEnabled })
  emit('update:modelValue', false)
}
</script>
