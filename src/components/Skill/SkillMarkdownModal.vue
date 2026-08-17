<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue && skill" class="SkillMarkdownModal" @click.self="emit('update:modelValue', false)">
        <div class="smm-panel">
          <div class="smm-head">
            <div class="smm-title">
              <i class="material-symbols-outlined">description</i>
              skill.md
              <span class="smm-skill-name">{{ skill.name }}</span>
            </div>
            <div class="smm-head-actions">
              <button class="custom-btn" @click="copyContent">
                <i class="material-symbols-outlined">{{ copied ? 'check' : 'content_copy' }}</i>
                {{ copied ? '已複製' : '複製' }}
              </button>
              <button class="drawer-close-btn" @click="emit('update:modelValue', false)">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
          </div>
          <div class="smm-body">
            <pre class="smm-content">{{ content }}</pre>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { buildSkillMarkdown } from '@/utils/skillMarkdown'

const props = defineProps<{ modelValue: boolean; skill: Skill | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const content = computed(() => (props.skill ? buildSkillMarkdown(props.skill) : ''))

const copied = ref(false)
async function copyContent() {
  try {
    await navigator.clipboard.writeText(content.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    copied.value = false
  }
}
</script>
