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

          <!-- 查看目前技能內容：使用者要用文字描述怎麼改，得先看得到現在
               長什麼樣子，不能只憑印象。在這個小對話框裡直接展開內容會
               佔掉太多空間，改成開獨立的 skill.md 檢視 Modal（跟
               SkillDetailDrawer 的「skill.md」按鈕共用同一個元件），
               有自己完整的空間，不會擠壓對話區 -->
          <div class="secm-view-original">
            <button type="button" class="custom-btn secm-view-original-btn" @click="showMarkdown = true">
              <i class="material-symbols-outlined">visibility</i>查看目前技能內容
            </button>
          </div>

          <div ref="messagesEl" class="secm-messages">
            <div v-if="!store.editChatHistory.length" class="secm-empty">
              <i class="material-symbols-outlined">chat_bubble_outline</i>
              <p>告訴 Agent 你想怎麼修改這份技能，不知道從何開始？可以先點下面的建議：</p>
              <!-- 依這顆技能實際有的內容區塊動態產生建議，點擊帶入輸入框
                   （不會直接送出），取代原本一句固定、跟這顆技能無關的範例 -->
              <div class="secm-suggestions">
                <button
                  v-for="chip in suggestionChips"
                  :key="chip.label"
                  type="button"
                  class="secm-chip"
                  @click="applySuggestion(chip)"
                >
                  <i class="material-symbols-outlined">{{ chip.icon }}</i>
                  {{ chip.label }}
                </button>
              </div>
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

          <!-- 附加檔案：預設收合，只留一行摘要，不要固定佔用一大塊空間
               擠壓對話區——這裡才是主要互動 -->
          <div class="secm-files-panel">
            <button
              type="button"
              class="secm-files-toggle"
              @click="toggleFiles"
            >
              <span class="secm-files-label">
                附加檔案<template v-if="localFiles.length"> ({{ localFiles.length }})</template>
              </span>
              <i class="material-symbols-outlined">{{ filesExpanded ? 'expand_less' : 'expand_more' }}</i>
            </button>
            <SkillFileUpload
              v-if="filesExpanded"
              :model-value="localFiles"
              @update:model-value="onFilesChange"
            />
          </div>

          <div class="secm-input-row">
            <input
              v-model="inputText"
              ref="inputEl"
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

    <!-- 查看目前技能內容：獨立 Modal，跟 SkillDetailDrawer 的
         「skill.md」按鈕共用同一個元件 -->
    <SkillMarkdownModal v-model="showMarkdown" :skill="skill" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Skill, SkillFile } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'
import SkillMarkdownModal from '@/components/Skill/SkillMarkdownModal.vue'

const props = defineProps<{ modelValue: boolean; skill: Skill | null }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  done: []
}>()

const store = useSkillStore()
const inputText = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const messagesEl = ref<HTMLElement | null>(null)
const localFiles = ref<SkillFile[]>([])
const filesExpanded = ref(false)
const showMarkdown = ref(false)

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

interface SuggestionChip {
  label: string
  icon: string
  prefill: string
}

// 依技能實際有沒有內容決定文案（已經有 vs. 還沒有，動詞不同），不是
// 固定列出四顆一樣的按鈕；附加檔案不在這裡——那是直接操作，不是用文字
// 描述給 Agent，點擊行為另外處理（展開附加檔案面板）
const suggestionChips = computed<SuggestionChip[]>(() => {
  const s = props.skill
  if (!s) return []
  const chips: SuggestionChip[] = []

  chips.push(s.instructions
    ? { label: '調整技能指令', icon: 'terminal', prefill: '我想調整技能指令，' }
    : { label: '撰寫技能指令', icon: 'terminal', prefill: '幫我撰寫技能指令，' })

  chips.push(s.capabilities?.length
    ? { label: '調整覆蓋能力', icon: 'checklist', prefill: '我想調整覆蓋能力，' }
    : { label: '新增覆蓋能力', icon: 'checklist', prefill: '幫我新增覆蓋能力，' })

  chips.push(s.usageScenarios?.length
    ? { label: '補充使用情境', icon: 'lightbulb', prefill: '我想補充使用情境，' }
    : { label: '新增使用情境', icon: 'lightbulb', prefill: '幫我新增使用情境，' })

  return chips
})

function applySuggestion(chip: SuggestionChip) {
  inputText.value = chip.prefill
  nextTick(() => inputEl.value?.focus())
}

function toggleFiles() {
  filesExpanded.value = !filesExpanded.value
}

watch(() => props.modelValue, (open) => {
  if (open) {
    store.resetEditChat()
    inputText.value = ''
    localFiles.value = [...(props.skill?.files ?? [])]
    filesExpanded.value = false
    showMarkdown.value = false
  }
})

function onFilesChange(files: SkillFile[]) {
  localFiles.value = files
  if (props.skill) store.updateSkillFiles(props.skill.id, files)
}

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
