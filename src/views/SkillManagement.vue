<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">技能管理</div>
        </div>
      </div>

      <!-- Hero 統計列 -->
      <div class="skill-stats-row">
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--enabled">
            <i class="material-symbols-outlined">check_circle</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.enabledCount }}</div>
            <div class="skill-stat-lbl">啟用中技能</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--ext">
            <i class="material-symbols-outlined">extension</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.extensionCount }}</div>
            <div class="skill-stat-lbl">企業擴充</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--usage">
            <i class="material-symbols-outlined">bolt</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.totalUsageCount.toLocaleString() }}</div>
            <div class="skill-stat-lbl">本月自動觸發次數</div>
          </div>
        </div>
      </div>

      <!-- View 切換 + 操作列 -->
      <div class="skill-list-header">
        <div class="skill-view-tabs">
          <button
            :class="['sview-tab', activeView === 'list' && 'is-active']"
            @click="activeView = 'list'"
          >技能清單</button>
          <button
            :class="['sview-tab', activeView === 'drafts' && 'is-active']"
            @click="activeView = 'drafts'"
          >
            草稿區
            <span v-if="store.myDrafts.length" class="sview-badge">{{ store.myDrafts.length }}</span>
          </button>
        </div>
        <div class="skill-list-actions">
          <template v-if="activeView === 'list'">
            <button class="custom-btn custom-main-btn" @click="router.push('/view/SkillEditor')">
              <i class="material-symbols-outlined">add</i>建立
            </button>
          </template>
          <template v-else>
            <button class="custom-btn custom-main-btn" @click="handleCreateDraft">
              <i class="material-symbols-outlined">add</i>新建草稿
            </button>
          </template>
        </div>
      </div>

      <!-- 上游更新 Banner -->
      <div v-if="store.pendingUpdateCount > 0 && activeView === 'list'" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.pendingUpdateSkills[0]?.name }}</strong>
          <template v-if="store.pendingUpdateCount > 1"> 等 {{ store.pendingUpdateCount }} 個技能</template>
          有上游更新可合併
        </span>
        <div class="upstream-banner-actions">
          <button class="custom-btn" @click="upstreamSkill = store.pendingUpdateSkills[0]">查看</button>
          <button v-if="store.pendingUpdateCount > 1" class="custom-btn" @click="showBatchUpdate = true">全部（{{ store.pendingUpdateCount }}）</button>
        </div>
      </div>

      <!-- 搜尋篩選 -->
      <template v-if="activeView === 'list'">
        <SkillFilterBar v-model="filterState" />
      </template>

      <!-- ── 技能清單 view ──────────────────────── -->
      <template v-if="activeView === 'list'">
        <div class="skill-sections">

          <!-- 系統技能 -->
          <div v-if="showSystemSection" class="skill-section">
            <div class="skill-section-header">
              <i class="material-symbols-outlined">auto_awesome</i>
              <span class="skill-section-title">系統技能</span>
              <span class="skill-section-count">{{ filteredSystemSkills.length }}</span>
              <span class="skill-section-desc">平台提供的標準 AI 技能，企業可在此基礎上自訂擴充版本</span>
            </div>
            <div class="skill-tree">
              <template v-for="skill in filteredSystemSkills" :key="skill.id">
                <div class="skill-group-box">
                  <SkillCard
                    :skill="skill"
                    :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
                    @click="detailSkill = $event"
                    @test="handleTest"
                    @toggle="handleToggle"
                    @duplicate="handleDuplicate"
                  />
                  <div
                    v-if="skill.children?.filter(c => !c.deletedAt).length"
                    class="skill-group-children"
                  >
                    <SkillCard
                      v-for="child in skill.children!.filter(c => !c.deletedAt)"
                      :key="child.id"
                      :skill="child"
                      :is-extension="true"
                      :has-upstream-update="store.upstreamUpdateSkillIds.has(child.id)"
                      @click="detailSkill = $event"
                      @test="handleTest"
                      @toggle="handleToggle"
                      @duplicate="handleDuplicate"
                    />
                  </div>
                </div>
              </template>
              <div v-if="filteredSystemSkills.length === 0" class="skill-section-empty">
                此層級無符合條件的技能
              </div>
            </div>
          </div>

          <!-- 企業技能 -->
          <div v-if="showEnterpriseSection" class="skill-section">
            <div class="skill-section-header">
              <i class="material-symbols-outlined">corporate_fare</i>
              <span class="skill-section-title">企業技能</span>
              <span class="skill-section-count">{{ filteredEnterpriseSkills.length }}</span>
              <span class="skill-section-desc">企業自行建立，適用於全企業的自訂 AI 技能</span>
            </div>
            <div class="skill-tree">
              <SkillCard
                v-for="skill in filteredEnterpriseSkills"
                :key="skill.id"
                :skill="skill"
                :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
                @click="detailSkill = $event"
                @test="handleTest"
                @toggle="handleToggle"
                @duplicate="handleDuplicate"
              />
              <div v-if="filteredEnterpriseSkills.length === 0" class="skill-section-empty">
                此層級無符合條件的技能
              </div>
            </div>
          </div>

          <!-- 團隊技能 -->
          <div v-if="showTeamSection" class="skill-section">
            <div class="skill-section-header">
              <i class="material-symbols-outlined">groups</i>
              <span class="skill-section-title">團隊技能</span>
              <span class="skill-section-count">{{ filteredTeamSkills.length }}</span>
              <span class="skill-section-desc">由團隊成員建立，僅在本團隊範圍內使用</span>
            </div>
            <div class="skill-tree">
              <SkillCard
                v-for="skill in filteredTeamSkills"
                :key="skill.id"
                :skill="skill"
                :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
                @click="detailSkill = $event"
                @test="handleTest"
                @toggle="handleToggle"
                @duplicate="handleDuplicate"
              />
              <div v-if="filteredTeamSkills.length === 0" class="skill-section-empty">
                此層級無符合條件的技能
              </div>
            </div>
          </div>

        </div>
      </template>

      <!-- ── 草稿區 view ─────────────────────────── -->
      <template v-else>
        <div class="draft-list">
          <DraftCard
            v-for="draft in store.myDrafts"
            :key="draft.id"
            :draft="draft"
            @view="handleViewDraft"
            @edit="handleEditDraft"
            @submit="handleSubmitDraft"
            @delete="handleDeleteDraft"
          />

          <div v-if="!store.myDrafts.length" class="draft-empty">
            <i class="material-symbols-outlined">draft</i>
            <span>目前沒有草稿</span>
            <button class="custom-btn custom-main-btn" @click="handleCreateDraft">
              <i class="material-symbols-outlined">add</i>新建草稿
            </button>
          </div>
        </div>
      </template>

    </div>

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      :upstream-version="upstreamVersionForDetail"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="handleToggle"
      @edit="(s) => router.push({ path: '/view/SkillEditor', query: { skillId: s.id } })"
      @delete="(s) => { store.deleteSkill(s.id); detailSkill = null }"
      @duplicate="handleDuplicate"
      @review="(skillId, versionId) => { detailSkill = null; openReview(skillId, versionId) }"
      @open-upstream-update="openUpstreamUpdate"
    />

    <UpstreamUpdateDrawer
      :skill="upstreamSkill"
      :upstream-version="upstreamSkill ? (store.getUpstreamVersion(upstreamSkill.id) ?? '') : ''"
      @close="upstreamSkill = null"
      @merge="handleMerge"
      @ignore="(s) => { store.ignoreUpstreamUpdate(s.id); upstreamSkill = null }"
      @detach="handleDetach"
    />

    <SkillReviewDrawer
      v-model="showReviewDrawer"
      :skill-id="reviewingSkillId"
      @approved="showReviewDrawer = false"
      @rejected="showReviewDrawer = false"
    />

    <BatchUpdateModal
      v-model="showBatchUpdate"
      @merged="showBatchUpdate = false"
    />

    <!-- 提交確認 dialog -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="submitConfirmDraft"
          class="draft-submit-overlay"
          @click.self="submitConfirmDraft = null"
        >
          <div class="draft-submit-dialog">
            <div class="dsd-header">
              <span class="dsd-title">提交審核</span>
              <button class="drawer-close-btn" @click="submitConfirmDraft = null">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>

            <div class="dsd-ai-hint">
              <i class="material-symbols-outlined">auto_awesome</i>
              根據草稿內容，AI 建議：
              <strong>{{ submitConfirmDraft.forkSourceId ? '更新版本' : '建立新技能' }}</strong>
            </div>

            <div class="dsd-options">
              <button
                :class="['dsd-option', submitMode === 'version_update' && 'is-selected']"
                :disabled="!submitConfirmDraft.forkSourceId"
                @click="submitMode = 'version_update'"
              >
                <i class="material-symbols-outlined">update</i>
                <div class="dsd-option-body">
                  <div class="dsd-option-title">更新版本</div>
                  <div class="dsd-option-desc">
                    提交為原技能的新版本，審核通過後更新現有企業擴充
                    <span v-if="!submitConfirmDraft.forkSourceId">（此草稿無來源技能）</span>
                  </div>
                </div>
                <i v-if="submitMode === 'version_update'" class="material-symbols-outlined dsd-check">check_circle</i>
              </button>

              <button
                :class="['dsd-option', submitMode === 'new_skill' && 'is-selected']"
                @click="submitMode = 'new_skill'"
              >
                <i class="material-symbols-outlined">add_circle</i>
                <div class="dsd-option-body">
                  <div class="dsd-option-title">建立全新技能</div>
                  <div class="dsd-option-desc">作為獨立自建技能發布，不影響原系統技能</div>
                </div>
                <i v-if="submitMode === 'new_skill'" class="material-symbols-outlined dsd-check">check_circle</i>
              </button>
            </div>

            <div class="dsd-footer">
              <button class="custom-btn" @click="submitConfirmDraft = null">取消</button>
              <button class="custom-btn custom-main-btn" @click="confirmSubmitDraft">
                <i class="material-symbols-outlined">send</i>送出審核
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 停用確認 dialog -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="disableConfirmSkill"
          class="skill-disable-overlay"
          @click.self="disableConfirmSkill = null"
        >
          <div class="skill-disable-dialog">
            <div class="sdd-header">
              <div class="sdd-icon">
                <i class="material-symbols-outlined">warning</i>
              </div>
              <div class="sdd-title">停用「{{ disableConfirmSkill.name }}」？</div>
            </div>

            <template v-if="disableConfirmSkill.assignedAgents?.length">
              <p class="sdd-desc">停用後，以下 Agent 將無法繼續調用此技能：</p>
              <div class="sdd-agent-list">
                <span
                  v-for="agent in disableConfirmSkill.assignedAgents"
                  :key="agent"
                  class="sdd-agent-tag"
                >
                  <i class="material-symbols-outlined">smart_toy</i>{{ agent }}
                </span>
              </div>
            </template>
            <p v-else class="sdd-desc sdd-desc--no-agent">
              此技能目前未指派給任何 Agent，停用不影響現有對話流程。
            </p>

            <div class="sdd-footer">
              <button class="custom-btn" @click="disableConfirmSkill = null">取消</button>
              <button class="custom-btn btn--danger-ghost" @click="confirmDisable">
                <i class="material-symbols-outlined">block</i>確認停用
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import DraftCard from '@/components/Skill/DraftCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import SkillReviewDrawer from '@/components/Skill/SkillReviewDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import BatchUpdateModal from '@/components/Skill/BatchUpdateModal.vue'
import SkillFilterBar, { type SkillFilterState } from '@/components/Skill/SkillFilterBar.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, DraftSkill, ConflictResolution } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const showReviewDrawer = ref(false)
const reviewingSkillId = ref('')
const upstreamSkill = ref<Skill | null>(null)
const activeView = ref<'list' | 'drafts'>('list')
const showBatchUpdate = ref(false)
const filterState = ref<SkillFilterState>({ query: '', type: 'all', status: 'all', update: 'all' })

const upstreamVersionForDetail = computed(() => {
  if (!detailSkill.value) return undefined
  return store.getUpstreamVersion(detailSkill.value.id)
})

const showSystemSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'system'
)
const showEnterpriseSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'enterprise'
)
const showTeamSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'team'
)

const filteredSystemSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'enterprise' || f.type === 'team') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.type !== 'system' || s.deletedAt) return false
    const selfMatch = (
      (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
      (f.status === 'all' || (f.status === 'enabled' ? s.isEnabled : !s.isEnabled)) &&
      (f.update === 'all' || store.upstreamUpdateSkillIds.has(s.id))
    )
    const childMatch = (s.children ?? []).some(c =>
      !c.deletedAt &&
      (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
      (f.status === 'all' || (f.status === 'enabled' ? c.isEnabled : !c.isEnabled)) &&
      (f.update === 'all' || store.upstreamUpdateSkillIds.has(c.id))
    )
    return selfMatch || childMatch
  })
})

const filteredEnterpriseSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'system' || f.type === 'team') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.scope !== 'enterprise' || s.deletedAt) return false
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
    if (f.status !== 'all' && (f.status === 'enabled' ? !s.isEnabled : s.isEnabled)) return false
    if (f.update === 'has_update' && !store.upstreamUpdateSkillIds.has(s.id)) return false
    return true
  })
})

const filteredTeamSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'system' || f.type === 'enterprise') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.scope !== 'team' || s.deletedAt) return false
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
    if (f.status !== 'all' && (f.status === 'enabled' ? !s.isEnabled : s.isEnabled)) return false
    if (f.update === 'has_update' && !store.upstreamUpdateSkillIds.has(s.id)) return false
    return true
  })
})

function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}

function openReview(skillId: string, _versionId: string) {
  reviewingSkillId.value = skillId
  showReviewDrawer.value = true
}

function openUpstreamUpdate(skill: Skill) {
  detailSkill.value = null
  upstreamSkill.value = skill
}

function handleMerge(skill: Skill, resolutions?: ConflictResolution[]) {
  store.mergeUpstreamUpdate(skill.id, resolutions)
  upstreamSkill.value = null
}

function handleDetach(skill: Skill) {
  store.detachFromUpstream(skill.id)
  upstreamSkill.value = null
}

function handleDuplicate(skill: Skill) {
  store.duplicateSkill(skill.id)
  detailSkill.value = null
  activeView.value = 'drafts'
}

function handleCreateDraft() {
  const draft = store.createDraft()
  router.push({ path: '/view/SkillEditor', query: { draftId: draft.id } })
}

function handleViewDraft(draft: DraftSkill) {
  detailSkill.value = {
    id: draft.id,
    name: draft.name || '未命名草稿',
    description: draft.description,
    type: draft.type,
    origin: draft.forkSourceId ? 'custom_version' : 'manually_created',
    version: '草稿',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: draft.instructions,
    forkSourceId: draft.forkSourceId,
  }
}

function handleEditDraft(draft: DraftSkill) {
  router.push({ path: '/view/SkillEditor', query: { draftId: draft.id } })
}

const submitConfirmDraft = ref<DraftSkill | null>(null)
const submitMode = ref<'new_skill' | 'version_update'>('new_skill')

function handleSubmitDraft(draft: DraftSkill) {
  submitConfirmDraft.value = draft
  submitMode.value = draft.forkSourceId ? 'version_update' : 'new_skill'
}

function confirmSubmitDraft() {
  if (!submitConfirmDraft.value) return
  store.submitDraft(submitConfirmDraft.value.id, submitMode.value)
  submitConfirmDraft.value = null
  activeView.value = 'list'
}

function handleDeleteDraft(draft: DraftSkill) {
  store.deleteDraft(draft.id)
}

const disableConfirmSkill = ref<Skill | null>(null)

function handleToggle(skill: Skill) {
  if (skill.isEnabled) {
    disableConfirmSkill.value = skill
  } else {
    store.toggleSkill(skill.id)
  }
}

function confirmDisable() {
  if (!disableConfirmSkill.value) return
  store.toggleSkill(disableConfirmSkill.value.id)
  if (detailSkill.value?.id === disableConfirmSkill.value.id) {
    detailSkill.value = { ...detailSkill.value, isEnabled: false }
  }
  disableConfirmSkill.value = null
}
</script>
