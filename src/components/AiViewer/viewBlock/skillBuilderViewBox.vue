<template>
  <div :class="['skillBuilderViewBox', { 'is-full': props.isFullView }]">
    <div class="skb-toolbar">
      <div class="skb-tabs">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          :class="['skb-tab-btn', { 'is-active': activeTab === t.id }]"
          @click="setTab(t.id)"
        >
          <i class="material-symbols-outlined">{{ t.icon }}</i>{{ t.label }}
        </button>
      </div>
      <!-- 同一顆技能要做長時間調整就到 AI 賦能頁；沒儲存前沒有 skillId 可帶。
           tooltip 掛在外層 span：disabled 的 button 不會觸發 hover 事件，「先儲存技能」的提示就出不來 -->
      <span class="skb-open-studio-wrap" v-tooltip="conv.savedSkillId.value ? '在 AI 賦能開啟' : '先儲存技能'">
        <button
          type="button"
          class="custom-btn skb-open-studio"
          :disabled="!conv.savedSkillId.value"
          @click="openStudio"
        >
          <i class="material-symbols-outlined">open_in_new</i>在 AI 賦能開啟
        </button>
      </span>
    </div>

    <div v-if="props.source.data.origin && activeTab === 'chat'" class="skb-origin-bar">
      <i class="material-symbols-outlined">history</i>來自本對話的「{{ props.source.data.origin.reason }}」流程
    </div>
    <div v-if="missingSkill" class="skb-missing-bar">
      <i class="material-symbols-outlined">warning</i>這顆技能已不存在，儲存會建立新的個人技能
    </div>

    <div class="skb-body">
      <SkillStudioChat
        v-if="activeTab === 'chat'"
        compact
        :mode="conv.mode.value"
        :skill-name="conv.draft.value.name"
        :saved-skill-id="conv.savedSkillId.value"
        :messages="conv.messages.value"
        :is-running="conv.isRunning.value"
        :suggestion-chips="conv.suggestionChips.value"
        :personal-skills="[]"
        @send="conv.send"
      />
      <SkillStudioPreview
        v-else
        hide-tabs
        :active-tab="previewTab"
        :draft="conv.draft.value"
        :mode="conv.mode.value"
        :saved-skill-id="conv.savedSkillId.value"
        :is-dirty="conv.isDirty.value"
        :can-save="conv.canSave.value"
        :name-conflict="nameConflict"
        @save="onSave"
        @update:files="conv.updateFiles"
        @update:active-tab="setTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 技能建立 Block：把 AI 賦能的三個零件放進畫布 block。狀態來源是 block data 裡的
// StudioSnapshot——掛載時 hydrate，變動時 toSnapshot 寫回 store，所以拖曳、放大縮小、
// 畫布重繪都不會丟狀態；全螢幕與畫布上的兩個實例也透過同一份快照同步。
import { ref, computed, watch, nextTick } from 'vue'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import type { StudioSnapshot } from '@/composables/useSkillStudioConversation'
import type { SkillBuilderBlockData } from '@/types/AiViewer'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import popDialog from '@/services/popDialog'

type BlockTab = SkillBuilderBlockData['activeTab']

const props = defineProps({
  id: { type: String, required: true },
  source: { type: Object as PropType<{ blockType: 'SKILL'; data: SkillBuilderBlockData }>, required: true },
  isFullView: { type: Boolean, default: false },
})

const TABS: { id: BlockTab; icon: string; label: string }[] = [
  { id: 'chat', icon: 'forum', label: '對話' },
  { id: 'preview', icon: 'preview', label: '預覽' },
  { id: 'test', icon: 'science', label: '測試' },
]

const aiviewerStore = useAiviewerStore()
const skillStore = useSkillStore()
const router = useRouter()
const conv = useSkillStudioConversation()

const activeTab = computed<BlockTab>(() => props.source.data.activeTab)
// SkillStudioPreview 的 activeTab 只收 'preview' | 'test'，這裡窄化掉 block 的 'chat'
const previewTab = computed<'preview' | 'test'>(() => (activeTab.value === 'test' ? 'test' : 'preview'))
const missingSkill = ref(false)
let applyingExternal = false

function setTab(tab: BlockTab) {
  aiviewerStore.updateSkillBuilderBlock(props.id, { activeTab: tab })
}

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && skillStore.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// 套用一份快照；若它指到的技能已被刪除（例如在技能管理刪掉），退回建立模式並提示
function applySnapshot(snap: StudioSnapshot) {
  applyingExternal = true
  conv.hydrate(snap)
  if (snap.savedSkillId && !skillStore.findSkill(snap.savedSkillId)) {
    missingSkill.value = true
    conv.detachSavedSkill()
    // detach 後的狀態要寫回 block data，不然「已退回建立模式」只存在這個實例的記憶體裡，
    // 其他實例、或這個 block 之後重新掛載時看到的仍是指向已刪除技能的舊快照
    aiviewerStore.updateSkillBuilderBlock(props.id, { snapshot: conv.toSnapshot() })
  } else {
    missingSkill.value = false
  }
  nextTick(() => { applyingExternal = false })
}

// 同步套用（而非 onMounted）：讓初次渲染就反映 hydrate 結果，不用等一次 microtask flush
applySnapshot(props.source.data.snapshot)

// 自己的變動 → 寫回 block data
watch(
  [conv.draft, conv.messages, conv.mode, conv.savedSkillId],
  () => {
    if (applyingExternal) return
    aiviewerStore.updateSkillBuilderBlock(props.id, { snapshot: conv.toSnapshot() })
  },
  { deep: true }
)

// 別的實例（全螢幕／畫布）寫回的快照 → 只要內容跟自己現在的不一樣就套用（last-write-wins）。
// 舊版用「!isDirty || 對方訊息更多」擋，但 isDirty 的基準是「上次 hydrate」，不是「已存的技能」，
// 會導致自己這邊還有未儲存變更時，永遠看不到對方剛儲存／改名的結果——JSON 相等比對已經
// 足夠避免把自己剛寫出去的快照當成外部變動再套用一次（見下方 applyingExternal 視窗）
watch(
  () => props.source.data.snapshot,
  (snap) => {
    if (JSON.stringify(snap) === JSON.stringify(conv.toSnapshot())) return
    applySnapshot(snap)
  },
  { deep: true }
)

function onSave() {
  const wasCreate = conv.mode.value === 'create'
  const id = conv.save()
  if (!id) return
  missingSkill.value = false
  if (wasCreate) {
    popDialog.toast('已儲存為個人技能，可到「測試」tab 驗證')
    setTab('test')
  } else {
    popDialog.toast('已儲存修改')
  }
}

function openStudio() {
  if (!conv.savedSkillId.value) return
  router.push({ name: 'SkillStudio', query: { skillId: conv.savedSkillId.value } })
}
</script>
