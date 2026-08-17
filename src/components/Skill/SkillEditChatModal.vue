<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue && skill" class="SkillEditChatModal" @click.self="handleClose">
        <div class="secm-panel">
          <div class="secm-head">
            <div class="secm-title">
              <i class="material-symbols-outlined">forum</i>
              跟 Agent 對話修改
              <span class="secm-skill-name">{{ skill.name }}</span>
            </div>
            <button class="drawer-close-btn" @click="handleClose">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div v-if="hasNameConflict" class="name-conflict-banner">
            <i class="material-symbols-outlined">info</i>
            你已經有一份來自「{{ conflictSourceName }}」的技能了，建議修改顯示名稱以便區分。
          </div>

          <div ref="messagesEl" class="secm-messages">
            <div v-if="!store.editChatHistory.length" class="secm-empty">
              <i class="material-symbols-outlined">chat_bubble_outline</i>
              <p>告訴 Agent 你想怎麼修改這份技能，例如「幫我把退貨期限改成 60 天」</p>
            </div>
            <template v-for="msg in store.editChatHistory" :key="msg.id">
              <div :class="['secm-bubble', msg.role === 'user' ? 'bubble--user' : 'bubble--agent']">
                <div v-if="msg.role === 'agent'" class="bubble-label">AI Agent</div>
                <div class="bubble-content">{{ msg.content }}</div>
              </div>
            </template>
            <div v-if="store.editChatIsRunning" class="secm-bubble bubble--agent">
              <div class="bubble-label">AI Agent</div>
              <div class="bubble-typing"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="secm-input-row">
            <input
              v-model="inputText"
              class="custom-input"
              placeholder="描述你想怎麼修改這份技能..."
              :disabled="store.editChatIsRunning"
              @keydown.enter.prevent="handleSend"
            />
            <button
              class="custom-btn"
              :disabled="!inputText.trim() || store.editChatIsRunning"
              @click="handleSend"
            >
              <i class="material-symbols-outlined">send</i>
            </button>
          </div>

          <div class="secm-footer">
            <button class="custom-btn custom-main-btn" @click="handleClose">
              <i class="material-symbols-outlined">check_circle</i>完成修改
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ modelValue: boolean; skill: Skill | null }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  done: []
}>()

const store = useSkillStore()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)

const hasNameConflict = computed(() => {
  if (!props.skill || props.skill.zone !== 'personal' || !props.skill.derivedFrom) return false
  return store.hasSkillNameConflict(props.skill.id)
})

const conflictSourceName = computed(() => {
  if (!props.skill?.derivedFrom) return ''
  return store.flatSkills.find(s => s.id === props.skill!.derivedFrom)?.name
    ?? store.myPersonalSkills.find(s => s.id === props.skill!.derivedFrom)?.name
    ?? props.skill.derivedFrom
})

watch(() => props.modelValue, (open) => {
  if (open) {
    store.resetEditChat()
    inputText.value = ''
  }
})

async function handleSend() {
  const msg = inputText.value.trim()
  if (!msg || !props.skill || store.editChatIsRunning) return
  inputText.value = ''
  await store.sendEditChatMessage(props.skill.id, msg)
}

function handleClose() {
  emit('update:modelValue', false)
  emit('done')
}

watch(() => store.editChatHistory.length, async () => {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
})
</script>
