<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title-row">
            <div class="banner-title">{{ conv.mode.value === 'create' ? '新增技能' : '修改技能' }}</div>
            <span :class="['ssc-mode-chip', `ssc-mode-chip--${conv.mode.value}`]">
              <i class="material-symbols-outlined">{{ conv.mode.value === 'create' ? 'auto_fix_high' : 'person' }}</i>
              {{ conv.mode.value === 'create' ? '建立新技能' : `修改：${conv.draft.value.name}` }}
            </span>
          </div>
        </div>
      </div>

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
            :mode="conv.mode.value"
            :skill-name="conv.draft.value.name"
            :saved-skill-id="conv.savedSkillId.value"
            :messages="conv.messages.value"
            :is-running="conv.isRunning.value"
            :suggestion-chips="conv.suggestionChips.value"
            :personal-skills="store.myPersonalSkills"
            @send="conv.send"
            @switch-skill="onSwitchSkill"
            @new-skill="onNewSkill"
          />
          <div v-else class="studio-composer-col">
            <div class="studio-composer-head">
              <span :class="['ssc-mode-chip', `ssc-mode-chip--${conv.mode.value}`]">
                <i class="material-symbols-outlined">dashboard_customize</i>{{ conv.mode.value === 'create' ? '用行銷積木組裝' : `修改：${conv.draft.value.name}` }}
              </span>
              <button type="button" class="custom-btn studio-new-btn" @click="onNewSkill">
                <i class="material-symbols-outlined">add</i>建立新技能
              </button>
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
            :draft="conv.draft.value"
            :mode="conv.mode.value"
            :saved-skill-id="conv.savedSkillId.value"
            :is-dirty="conv.isDirty.value"
            :can-save="conv.canSave.value"
            :name-conflict="nameConflict"
            @save="onSave"
            @update:files="conv.updateFiles"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { LocationQuery } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
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

const route = useRoute()
const router = useRouter()
const store = useSkillStore()
const aiviewerStore = useAiviewerStore()
const conv = useSkillStudioConversation()
const activeTab = ref<'preview' | 'test'>(route.query.tab === 'test' ? 'test' : 'preview')
// 方案三：conv4 的建議卡按「是」交接過來的來源；只在真的套用了交接草稿時設，
// 換去別的技能／重新開一顆新技能後清空——「返回原對話」連結才不會誤導
const handoffOrigin = ref<SkillHandoffOrigin | null>(null)

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && store.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// ?skillId= 進修改模式；找不到／不是個人技能都退回建立模式，不拋錯。
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
    } else if (conv.loadSkill(skillId)) {
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

onMounted(() => {
  applyQuery(route.query)
})

onBeforeRouteUpdate((to, _from, next) => {
  if (!conv.isDirty.value) {
    applyQuery(to.query)
    return next()
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', () => {
    applyQuery(to.query)
    next()
  }, () => next(false))
})

// 有未儲存變更時，切換／新建／離開前都要確認；沒有變更就直接做
function guardDirty(proceed: () => void) {
  if (!conv.isDirty.value) {
    proceed()
    return
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', proceed)
}

function onSwitchSkill(skillId: string) {
  guardDirty(() => {
    if (!conv.loadSkill(skillId)) popDialog.toast('找不到這個技能')
    activeTab.value = 'preview'
    handoffOrigin.value = null
  })
}

function onNewSkill() {
  guardDirty(() => {
    conv.startCreate()
    activeTab.value = 'preview'
    handoffOrigin.value = null
  })
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

onBeforeRouteLeave((_to, _from, next) => {
  if (!conv.isDirty.value) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
</script>
