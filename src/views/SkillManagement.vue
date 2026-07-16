<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">技能管理</div>
        </div>
        <div class="page-banner-actions">
          <button class="custom-btn custom-main-btn" @click="router.push('/view/SkillEditor')">
            <i class="material-symbols-outlined">add</i>建立技能
          </button>
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

      <!-- 上游更新 Banner -->
      <div v-if="store.pendingUpdateCount > 0" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.pendingUpdateSkills[0]?.name }}</strong>
          <template v-if="store.pendingUpdateCount > 1"> 等 {{ store.pendingUpdateCount }} 個技能</template>
          有上游更新可合併
        </span>
        <div class="upstream-banner-actions">
          <button class="custom-btn" @click="upstreamSkill = store.pendingUpdateSkills[0]">查看</button>
          <button v-if="store.pendingUpdateCount > 1" class="custom-btn" @click="showBatchUpdate = true">
            全部（{{ store.pendingUpdateCount }}）
          </button>
        </div>
      </div>

      <!-- 搜尋篩選 -->
      <SkillFilterBar v-model="filterState" />

      <!-- ── 我的技能 ─────────────────────────────── -->
      <div class="skill-sections">

        <div class="skill-section">
          <div class="skill-section-header">
            <i class="material-symbols-outlined">person</i>
            <span class="skill-section-title">我的技能</span>
            <span class="skill-section-count">{{ store.myPersonalSkills.length }}</span>
            <span class="skill-section-desc">你建立或從對話生成的個人技能，可送審加入 Library</span>
          </div>
          <div v-if="store.myPersonalSkills.length" class="my-skills-list">
            <PersonalSkillCard
              v-for="skill in store.myPersonalSkills"
              :key="skill.id"
              :skill="skill"
              @view="detailSkill = $event"
              @submit="handlePersonalSubmit"
            />
          </div>
          <div v-else class="my-skills-empty">
            <i class="material-symbols-outlined">person_search</i>
            <span>透過對話生成技能，或手動建立 skill 檔案後，技能會出現在這裡</span>
          </div>
        </div>

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
              @duplicate="handleDuplicate"
            />
            <div v-if="filteredTeamSkills.length === 0" class="skill-section-empty">
              此層級無符合條件的技能
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      :upstream-version="upstreamVersionForDetail"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="handlePersonalToggle"
      @edit="(s) => router.push({ path: '/view/SkillEditor', query: { skillId: s.id } })"
      @delete="handlePersonalDelete"
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

    <!-- 送審 dialog -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="submitConfirmSkill"
          class="draft-submit-overlay"
          @click.self="submitConfirmSkill = null"
        >
          <div class="draft-submit-dialog">
            <div class="dsd-header">
              <span class="dsd-title">送審至 Library</span>
              <button class="drawer-close-btn" @click="submitConfirmSkill = null">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>

            <div class="dsd-info">
              <div class="dsd-info-row">
                <span class="dsd-info-label">技能名稱</span>
                <span class="dsd-info-val">{{ submitConfirmSkill.name }}</span>
              </div>
              <div class="dsd-info-row">
                <span class="dsd-info-label">來源</span>
                <span class="dsd-info-val">{{ submitConfirmSkill.derivedFrom ? '對話延伸' : '手寫建立' }}</span>
              </div>
              <div v-if="submitConfirmSkill.derivedFrom" class="dsd-info-row">
                <span class="dsd-info-label">來源技能</span>
                <span class="dsd-info-val">{{ getDerivedFromName(submitConfirmSkill.derivedFrom) }}</span>
              </div>
            </div>

            <div class="dsd-options">
              <button
                :class="['dsd-option', submitMode === 'version_update' && 'is-selected']"
                :disabled="!submitConfirmSkill.derivedFrom"
                @click="submitMode = 'version_update'"
              >
                <i class="material-symbols-outlined">update</i>
                <div class="dsd-option-body">
                  <div class="dsd-option-title">更新版本</div>
                  <div class="dsd-option-desc">
                    提交為原技能的新版本，審核通過後更新現有技能
                    <span v-if="!submitConfirmSkill.derivedFrom">（此技能無來源技能）</span>
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
                  <div class="dsd-option-title">建立新技能</div>
                  <div class="dsd-option-desc">作為獨立技能加入 Library，不影響原有技能</div>
                </div>
                <i v-if="submitMode === 'new_skill'" class="material-symbols-outlined dsd-check">check_circle</i>
              </button>
            </div>

            <div class="dsd-note">
              <label class="dsd-note-label">說明（選填）</label>
              <textarea
                v-model="submitNote"
                class="dsd-note-input"
                rows="3"
                :placeholder="submitMode === 'version_update'
                  ? '說明此版本的改動重點...'
                  : '描述適用情境、與現有技能的差異...'"
              ></textarea>
            </div>

            <div class="dsd-footer">
              <button class="custom-btn" @click="submitConfirmSkill = null">取消</button>
              <button class="custom-btn custom-main-btn" @click="confirmSubmitSkill">
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
import PersonalSkillCard from '@/components/Skill/PersonalSkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import SkillReviewDrawer from '@/components/Skill/SkillReviewDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import BatchUpdateModal from '@/components/Skill/BatchUpdateModal.vue'
import SkillFilterBar, { type SkillFilterState } from '@/components/Skill/SkillFilterBar.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, ConflictResolution } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const showReviewDrawer = ref(false)
const reviewingSkillId = ref('')
const upstreamSkill = ref<Skill | null>(null)
const showBatchUpdate = ref(false)
const filterState = ref<SkillFilterState>({ query: '', type: 'all', status: 'all', update: 'all' })

// 送審 dialog 狀態
const submitConfirmSkill = ref<Skill | null>(null)
const submitMode = ref<'new_skill' | 'version_update'>('new_skill')
const submitNote = ref('')

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
}

// ── 個人技能 handlers ──────────────────────────────

function handlePersonalSubmit(skill: Skill) {
  submitConfirmSkill.value = skill
  submitMode.value = skill.derivedFrom ? 'version_update' : 'new_skill'
  submitNote.value = ''
}

function confirmSubmitSkill() {
  if (!submitConfirmSkill.value) return
  store.submitPersonalSkill(submitConfirmSkill.value.id, submitMode.value, submitNote.value)
  submitConfirmSkill.value = null
  submitNote.value = ''
}

function handlePersonalDelete(skill: Skill) {
  store.deletePersonalSkill(skill.id)
  if (detailSkill.value?.id === skill.id) detailSkill.value = null
}

function handlePersonalToggle(skill: Skill) {
  store.toggleSkill(skill.id)
  if (detailSkill.value?.id === skill.id) {
    detailSkill.value = { ...detailSkill.value, isEnabled: !detailSkill.value.isEnabled }
  }
}

function getDerivedFromName(derivedFrom: string): string {
  return store.flatSkills.find(s => s.id === derivedFrom)?.name ?? derivedFrom
}
</script>
