<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">AI 賦能</div>
        </div>
      </div>

      <div class="skill-studio-layout">
        <div class="studio-chat-col">
          <SkillStudioChat
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
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { LocationQuery } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import popDialog from '@/services/popDialog'

const route = useRoute()
const store = useSkillStore()
const conv = useSkillStudioConversation()
const activeTab = ref<'preview' | 'test'>(route.query.tab === 'test' ? 'test' : 'preview')

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && store.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// ?skillId= 進修改模式；找不到／不是個人技能都退回建立模式，不拋錯
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
  }
  conv.startCreate()
  activeTab.value = 'preview'
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
  })
}

function onNewSkill() {
  guardDirty(() => {
    conv.startCreate()
    activeTab.value = 'preview'
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
