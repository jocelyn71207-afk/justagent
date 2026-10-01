<template>
  <div class="skill-studio-layout">
    <div class="studio-chat-col">
      <!-- 方案三：從 conv4 交接過來的草稿，帶一條回原對話的路，並說明這顆草稿從哪來 -->
      <template v-if="handoffOrigin">
        <button type="button" class="custom-btn studio-back-link" @click="onBackToOrigin">
          <i class="material-symbols-outlined">arrow_back</i>返回原本的對話
        </button>
        <div class="studio-origin-bar">
          <i class="material-symbols-outlined">history</i>來自本對話的「{{ handoffOrigin.reason }}」流程
        </div>
      </template>
      <SkillMethodChooser v-if="!conv.draft.value.method" @choose="conv.chooseMethod" />
      <SkillStudioChat
        v-else-if="conv.draft.value.method === 'chat'"
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
      <div v-else class="studio-composer-col">
        <div class="studio-composer-head">
          <span :class="['ssc-mode-chip', `ssc-mode-chip--${conv.mode.value}`]">
            <i class="material-symbols-outlined">dashboard_customize</i>{{ conv.mode.value === 'create' ? '用行銷積木組裝' : `修改：${conv.draft.value.name}` }}
          </span>
        </div>
        <SkillBlockComposer
          :name="conv.draft.value.name"
          :description="conv.draft.value.description"
          :section-ids="conv.draft.value.sectionIds"
          :name-conflict="nameConflict"
          @update:name="v => conv.updateBlocks({ name: v })"
          @update:description="v => conv.updateBlocks({ description: v })"
          @update:section-ids="ids => conv.updateBlocks({ sectionIds: ids })"
        />
      </div>
    </div>
    <div class="studio-side-col">
      <SkillStudioPreview
        v-model:active-tab="activeTab"
        hide-files
        hide-nav-links
        show-discard
        :draft="conv.draft.value"
        :mode="conv.mode.value"
        :saved-skill-id="conv.savedSkillId.value"
        :is-dirty="conv.isDirty.value"
        :can-save="conv.canSave.value"
        :name-conflict="nameConflict"
        @save="onSave"
        @discard="onDiscard"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { LocationQuery } from 'vue-router'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import SkillMethodChooser from '@/components/Skill/SkillMethodChooser.vue'
import SkillBlockComposer from '@/components/Skill/SkillBlockComposer.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import { consumeSkillHandoff } from '@/composables/useSkillHandoff'
import type { SkillHandoffOrigin } from '@/composables/useSkillHandoff'
import popDialog from '@/services/popDialog'

// 外殼（頁面／抽屜）只認得「query 長什麼樣子」，不用知道 conv 內部狀態——
// 初次掛載讀 initialQuery；之後外殼自己的路由守衛通過後，用 defineExpose 出去的
// applyQuery() 重新套用，跟現在 SkillStudio.vue 的 applyQuery() 呼叫時機一致
const props = defineProps<{ initialQuery?: LocationQuery }>()
// 放棄修改：草稿重設回目前已儲存的版本後，請外殼（抽屜）關閉
const emit = defineEmits<{ discard: [] }>()

const router = useRouter()
const store = useSkillStore()
const aiviewerStore = useAiviewerStore()
const conv = useSkillStudioConversation()
const activeTab = ref<'preview' | 'test'>('preview')
// 方案三：conv4 的建議卡按「是」交接過來的來源；只在真的套用了交接草稿時設，
// 換去別的技能／重新開一顆新技能後清空——「返回原對話」連結才不會誤導
const handoffOrigin = ref<SkillHandoffOrigin | null>(null)

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && store.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// AI 快速測試完成（store.aiTestReport 從 null 變成一份報告，一輪測驗只會發生一次
// 這樣的轉換——見 _computeAITestReport 在所有題目答完前都是 no-op）：交給 conv 判斷
// 要不要在左側對話主動引導使用者調整內容
watch(() => store.aiTestReport, report => {
  if (report) conv.notifyTestResult(report)
})

// 使用者在引導訊息點「重新測試」：conv 自己呼叫得到 store.generateAITestScenarios，
// 但切不了這裡才有的 activeTab——讀到這個單次訊號就切到測試 tab，讀完歸零
watch(() => conv.requestTestTab.value, requested => {
  if (!requested) return
  activeTab.value = 'test'
  conv.requestTestTab.value = false
})

// ?skillId= 進修改模式；找不到／不是個人技能都退回建立模式，不拋錯。
// ?intent=ask 是從測試沙盒點「詢問技能助理」進來的——一樣是 loadSkill()，
// 只是開場白換一句不預設「要改」的問句，其餘（gateStage/mode/method）完全相同。
// ?from= 是方案三的 conv4 交接：consumeSkillHandoff() 有值才套用預填草稿並記住
// 返回連結；讀不到（例如重新整理過頁面、交接資料已被用掉）就退回一般建立模式。
function applyQuery(query: LocationQuery) {
  activeTab.value = query.tab === 'test' ? 'test' : 'preview'
  const skillId = typeof query.skillId === 'string' ? query.skillId : ''
  if (skillId) {
    const skill = store.findSkill(skillId)
    if (!skill) {
      popDialog.toast('找不到這個技能')
    } else if (skill.zone !== 'personal') {
      popDialog.toast('Library 技能請先在技能管理複製為個人技能')
    } else if (conv.loadSkill(skillId, query.intent === 'ask' ? 'ask' : 'edit')) {
      return
    }
  } else if (query.from) {
    const handoff = consumeSkillHandoff()
    if (handoff) {
      handoffOrigin.value = handoff.origin
      conv.startCreate(handoff.prefill, handoff.openingMessage)
      activeTab.value = 'preview'
      return
    }
  }
  conv.startCreate()
  // ?method= 是從技能管理「建立技能」選擇框直接指定的方式（對話／積木），
  // 讓使用者不用進來又被 SkillMethodChooser 問一次同樣的問題
  if (query.method === 'chat' || query.method === 'blocks') {
    conv.chooseMethod(query.method)
  }
  activeTab.value = 'preview'
}

// 方案三：真的存過技能才補一句「已建立」——回去晃一圈但沒存，代理人沒東西好回報
function onBackToOrigin() {
  guardDirty(() => {
    if (handoffOrigin.value?.conversationId === 'conv4' && conv.savedSkillId.value) {
      aiviewerStore.pushConv4Message({ agent: 'brain', msg: `✅ 個人技能「${conv.draft.value.name}」已建立完成。` })
    }
    router.push({ name: 'AiViewer' })
  })
}

// 有未儲存變更時，離開（返回原對話）前要確認；沒有變更就直接做
function guardDirty(proceed: () => void) {
  if (!conv.isDirty.value) {
    proceed()
    return
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', proceed)
}

function onSave() {
  const wasCreate = conv.mode.value === 'create'
  const id = conv.save()
  if (!id) return
  if (wasCreate) {
    popDialog.toast('已儲存為個人技能，可到「測試」tab 驗證')
    activeTab.value = 'test'
  } else {
    popDialog.toast('已儲存修改')
  }
}

// 放棄修改：草稿只是從已儲存版本複製出來改的，從沒呼叫過 save() 就不會寫回原本的
// 技能——loadSkill 本來就是「從目前儲存版本重新載入草稿」的邏輯，直接複用來重設，
// 再請外殼（抽屜）關閉。不用額外確認：guardDirty 已經會在真的有變更時才跳出確認，
// 沒變更的話按這顆鍵跟直接關閉沒兩樣
function onDiscard() {
  guardDirty(() => {
    if (conv.mode.value === 'edit' && conv.savedSkillId.value) {
      conv.loadSkill(conv.savedSkillId.value)
    }
    emit('discard')
  })
}

onMounted(() => {
  applyQuery(props.initialQuery ?? {})
})

defineExpose({
  isDirty: conv.isDirty,
  mode: conv.mode,
  skillName: computed(() => conv.draft.value.name),
  applyQuery,
})
</script>
