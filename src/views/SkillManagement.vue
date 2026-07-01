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
            <div class="skill-stat-lbl">本月使用次數</div>
          </div>
        </div>
        <div v-if="pendingCount > 0" class="skill-stat-card skill-stat-card--alert">
          <div class="skill-stat-icon icon--pending">
            <i class="material-symbols-outlined">pending_actions</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ pendingCount }}</div>
            <div class="skill-stat-lbl">待處理</div>
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
            <div class="skill-search">
              <i class="material-symbols-outlined">search</i>
              <input v-model="searchQuery" class="skill-search-input" placeholder="搜尋技能..." />
              <button v-if="searchQuery" class="skill-search-clear" @click="searchQuery = ''">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
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

      <!-- ── 技能清單 view ──────────────────────── -->
      <template v-if="activeView === 'list'">
        <!-- Filter chips -->
        <div class="filter-chips">
          <button :class="['filter-chip', activeFilter === 'all' && 'is-active']" @click="activeFilter = 'all'">全部</button>
          <button :class="['filter-chip', activeFilter === 'system' && 'is-active']" @click="activeFilter = 'system'">
            <i class="material-symbols-outlined">psychology</i>系統技能
          </button>
          <button :class="['filter-chip', activeFilter === 'extension' && 'is-active']" @click="activeFilter = 'extension'">
            <i class="material-symbols-outlined">extension</i>企業擴充
          </button>
          <button
            v-if="store.reviewingSkillIds.size > 0"
            :class="['filter-chip', 'filter-chip--reviewing', activeFilter === 'reviewing' && 'is-active']"
            @click="activeFilter = 'reviewing'"
          >
            <i class="material-symbols-outlined">rate_review</i>審核中
            <span class="fc-badge">{{ store.reviewingSkillIds.size }}</span>
          </button>
          <button
            v-if="store.upstreamUpdateSkillIds.size > 0"
            :class="['filter-chip', 'filter-chip--upstream', activeFilter === 'upstream' && 'is-active']"
            @click="activeFilter = 'upstream'"
          >
            <i class="material-symbols-outlined">upgrade</i>待更新
            <span class="fc-badge fc-badge--amber">{{ store.upstreamUpdateSkillIds.size }}</span>
          </button>
        </div>

        <!-- Skill tree -->
        <div class="skill-tree">
          <template v-for="skill in filteredSystemSkills" :key="skill.id">
            <div class="skill-group-box">
              <SkillCard
                :skill="skill"
                :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
                @click="detailSkill = $event"
                @test="handleTest"
                @toggle="store.toggleSkill($event.id)"
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
                  @toggle="store.toggleSkill($event.id)"
                  @duplicate="handleDuplicate"
                />
              </div>
            </div>
          </template>

          <SkillCard
            v-for="skill in filteredStandaloneExtensions"
            :key="skill.id"
            :skill="skill"
            :is-extension="true"
            :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
            @click="detailSkill = $event"
            @test="handleTest"
            @toggle="store.toggleSkill($event.id)"
            @duplicate="handleDuplicate"
          />

          <div v-if="filteredSystemSkills.length === 0 && filteredStandaloneExtensions.length === 0" class="skill-empty">
            <i class="material-symbols-outlined">search_off</i>
            <span>找不到符合條件的技能</span>
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
      @toggle="store.toggleSkill($event.id)"
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
      @ignore="upstreamSkill = null"
      @detach="handleDetach"
    />

    <SkillReviewDrawer
      v-model="showReviewDrawer"
      :skill-id="reviewingSkillId"
      @approved="showReviewDrawer = false"
      @rejected="showReviewDrawer = false"
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
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, DraftSkill } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const showReviewDrawer = ref(false)
const reviewingSkillId = ref('')
const upstreamSkill = ref<Skill | null>(null)
const activeView = ref<'list' | 'drafts'>('list')
const activeFilter = ref<'all' | 'system' | 'extension' | 'reviewing' | 'upstream'>('all')
const searchQuery = ref('')

const pendingCount = computed(() => store.reviewingSkillIds.size + store.upstreamUpdateSkillIds.size)

const upstreamVersionForDetail = computed(() => {
  if (!detailSkill.value) return undefined
  return store.getUpstreamVersion(detailSkill.value.id)
})

const filteredSystemSkills = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.type !== 'system' || s.deletedAt) return false
    if (activeFilter.value === 'reviewing') {
      return store.reviewingSkillIds.has(s.id) ||
        (s.children ?? []).some(c => !c.deletedAt && store.reviewingSkillIds.has(c.id))
    }
    if (activeFilter.value === 'upstream') {
      return store.upstreamUpdateSkillIds.has(s.id) ||
        (s.children ?? []).some(c => !c.deletedAt && store.upstreamUpdateSkillIds.has(c.id))
    }
    if (activeFilter.value === 'extension') {
      return (s.children ?? []).some(c => !c.deletedAt)
    }
    if (!q) return true
    return s.name.toLowerCase().includes(q) ||
      (s.children ?? []).some(c => !c.deletedAt && c.name.toLowerCase().includes(q))
  })
})

const filteredStandaloneExtensions = computed(() => {
  if (activeFilter.value === 'system') return []
  const q = searchQuery.value.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.type !== 'extension' || s.deletedAt) return false
    if (activeFilter.value === 'reviewing') return store.reviewingSkillIds.has(s.id)
    if (activeFilter.value === 'upstream') return store.upstreamUpdateSkillIds.has(s.id)
    if (!q) return true
    return s.name.toLowerCase().includes(q)
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

function handleMerge(skill: Skill) {
  store.acceptUpstreamUpdate(skill.id)
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
</script>
