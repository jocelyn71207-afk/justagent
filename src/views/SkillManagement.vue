<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ activeTab === 'review' ? '團隊技能管理' : '技能管理' }}</div>
        </div>
        <div class="page-banner-actions">
          <button v-if="isManager && activeTab === 'my'" class="custom-btn custom-main-btn" @click="activeTab = 'review'">
            <i class="material-symbols-outlined">admin_panel_settings</i>團隊技能管理
          </button>
        </div>
      </div>

      <!-- 統計列：跟 TeamAccessManagement 的角色統計同一套「色點 + 文字」語彙，
           不用四個顏色各異的邊框卡片堆砌成一整排，避免看起來太像後台儀表板。
           只跟「我的技能」有關，團隊技能管理頁不顯示。待審核提醒併進同一列的
           最前面，但用實心 pill 徽章（不是安靜的色點），需要行動的提醒
           要比純資訊的三個數字更搶眼，不能跟它們長得一樣低調 -->
      <div v-if="activeTab === 'my'" class="skill-stats-row">
        <button
          v-if="isManager && store.pendingReviewSkills.length > 0"
          class="skill-stat skill-stat--pending"
          @click="activeTab = 'review'; reviewSubTab = 'pending'"
        >
          <i class="material-symbols-outlined">rate_review</i><b>{{ store.pendingReviewSkills.length }}</b>個技能等待審核
        </button>
        <div class="skill-stat skill-stat--enabled">
          <i class="stat-dot"></i><b>{{ store.enabledCount }}</b>啟用中技能
        </div>
        <div class="skill-stat skill-stat--ext">
          <i class="stat-dot"></i><b>{{ store.enterpriseExtensionCount }}</b>企業擴充
        </div>
        <div class="skill-stat skill-stat--team">
          <i class="stat-dot"></i><b>{{ store.teamExtensionCount }}</b>團隊擴充
        </div>
        <div class="skill-stat skill-stat--usage">
          <i class="stat-dot"></i><b>{{ store.totalUsageCount.toLocaleString() }}</b>本月自動觸發次數
        </div>
      </div>

      <!-- ── Sections ──────────────────────────────── -->
      <div class="skill-sections">

        <!-- 管理區：待審核送審 + Library 現有技能管理（限企業擁有者 / 企業管理者）
             兩塊內容都不小，不再直接上下堆疊成一個超長頁面，改成子分頁各自獨立。
             跟「我的技能」是完全分開的兩個頁面，不共用 tab bar 樣式，靠這顆按鈕互相切換 -->
        <div v-if="isManager" v-show="activeTab === 'review'" class="skill-tab-panel">
          <button class="custom-btn skill-back-btn" @click="activeTab = 'my'">
            <i class="material-symbols-outlined">arrow_back</i>返回技能管理
          </button>

          <div class="review-subtabs">
            <button
              :class="['review-subtab', { 'is-active': reviewSubTab === 'pending' }]"
              @click="reviewSubTab = 'pending'"
            >
              待審核
              <span class="skill-tab-count">{{ store.pendingReviewSkills.length }}</span>
            </button>
            <button
              :class="['review-subtab', { 'is-active': reviewSubTab === 'library' }]"
              @click="reviewSubTab = 'library'"
            >
              團隊技能範本管理
              <span class="skill-tab-count">{{ store.enterpriseExtensionCount + store.teamExtensionCount }}</span>
            </button>
          </div>

          <div v-show="reviewSubTab === 'pending'" class="skill-review-block">
            <p class="skill-tab-panel-desc">等待審核的技能送審申請，通過後將發佈至 Library</p>
            <SkillReviewQueue
              v-if="store.pendingReviewSkills.length"
              :skills="store.pendingReviewSkills"
              @view="detailSkillId = $event.id"
              @approve="handleApprove"
              @reject="handleReject"
            />
            <div v-else class="skill-section-empty">目前沒有待審核的技能</div>
          </div>

          <!-- 團隊技能範本管理（原「Library 現有技能管理」） -->
          <div v-show="reviewSubTab === 'library'" class="skill-manage-block">
            <div class="skill-manage-block-header">
              <span class="skill-manage-block-title">
                <i class="material-symbols-outlined">inventory_2</i>團隊技能範本管理
              </span>
              <div class="skill-search">
                <i class="material-symbols-outlined">search</i>
                <input v-model="libraryManageQuery" class="skill-search-input" placeholder="搜尋技能名稱或描述" />
              </div>
            </div>
            <div v-if="filteredLibrarySkills.length" class="lsr-sections">
              <!-- 企業技能 -->
              <div v-if="filteredEnterpriseSkills.length" class="lsr-section-block lsr-section-block--enterprise">
                <div class="lsr-section-header">
                  <i class="material-symbols-outlined">corporate_fare</i>
                  <span class="lsr-section-title">企業技能</span>
                  <span class="lsr-section-count">{{ filteredEnterpriseSkills.length }}</span>
                </div>
                <div class="lsr-section-list">
                  <SkillTile
                    v-for="skill in filteredEnterpriseSkills"
                    :key="skill.id"
                    :skill="skill"
                    @click="detailSkillId = skill.id"
                    @test="handleTest"
                    @duplicate="handleDuplicate"
                  />
                </div>
              </div>
              <!-- 團隊技能（依團隊分組，每團隊一張卡片） -->
              <div v-if="groupedTeamSkills.length" class="lsr-section-block lsr-section-block--team">
                <div class="lsr-section-header">
                  <i class="material-symbols-outlined">group</i>
                  <span class="lsr-section-title">團隊技能</span>
                  <span class="lsr-section-count">{{ groupedTeamSkills.reduce((s, g) => s + g.skills.length, 0) }}</span>
                </div>
                <div class="lsr-team-grid lively-stagger">
                  <div
                    v-for="(group, gi) in groupedTeamSkills"
                    :key="group.teamName"
                    :class="['lsr-team-card', 'lively-card', gi % 2 === 0 ? 'lively-corner-a' : 'lively-corner-b']"
                  >
                    <div class="lsr-team-label">
                      <i class="material-symbols-outlined">apartment</i>{{ group.teamName }}
                      <span class="lsr-section-count">{{ group.skills.length }}</span>
                    </div>
                    <div class="lsr-section-list lsr-section-list--in-card">
                      <SkillTile
                        v-for="skill in group.skills"
                        :key="skill.id"
                        :skill="skill"
                        @click="detailSkillId = skill.id"
                        @test="handleTest"
                        @duplicate="handleDuplicate"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="skill-section-empty">找不到符合條件的技能</div>
          </div>
        </div>

        <!-- 我的技能 -->
        <div v-show="activeTab === 'my'" class="skill-tab-panel">
          <div class="my-skills-actions">
            <button class="custom-btn" @click="showLibraryModal = true">
              <i class="material-symbols-outlined">library_books</i>瀏覽 Library
            </button>
            <button class="custom-btn custom-main-btn" @click="router.push('/view/SkillEditor')">
              <i class="material-symbols-outlined">add</i>建立技能
            </button>
          </div>
          <div v-if="store.myPersonalSkills.length" class="my-skills-list">
            <PersonalSkillGroup
              v-for="skill in pagedSkills"
              :key="skill.id"
              :skill="skill"
              @manage="detailSkillId = $event.id"
            />
            <!-- 分頁 -->
            <div v-if="totalPages > 1" class="my-skills-pagination">
              <button
                class="custom-btn pag-btn"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <i class="material-symbols-outlined">chevron_left</i>
              </button>
              <span class="pag-info">{{ currentPage }} / {{ totalPages }}</span>
              <button
                class="custom-btn pag-btn"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                <i class="material-symbols-outlined">chevron_right</i>
              </button>
            </div>
          </div>
          <div v-else class="my-skills-empty">
            <i class="material-symbols-outlined">person_search</i>
            <span>透過對話生成技能，或手動建立 skill 檔案後，技能會出現在這裡</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Library 瀏覽 Modal -->
    <LibraryBrowseModal
      v-model="showLibraryModal"
      @open-detail="(s) => { showLibraryModal = false; detailSkillId = s.id }"
      @test="handleTest"
      @duplicate="handleDuplicate"
    />

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      :upstream-version="upstreamVersionForDetail"
      @close="detailSkillId = null"
      @test="handleTest"
      :manageable="isManager && activeTab === 'review'"
      @toggle="handleToggle"
      @edit="handleEdit"
      @delete="handlePersonalDelete"
      @duplicate="handleDuplicate"
      @submit="handlePersonalSubmit"
      @review="(skillId, versionId) => { detailSkillId = null; openReview(skillId, versionId) }"
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

    <!-- 複製第一步：確認顯示名稱（確認後才真正建立副本，出現在「我的技能」列表） -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="pendingDuplicateSource"
          class="drawer-confirm-overlay"
          @click.self="cancelPendingDuplicate"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>建立副本</h4>
            <div v-if="pendingDuplicateConflict" class="confirm-warning-banner">
              <i class="material-symbols-outlined">info</i>
              你已經有一份來自「{{ pendingDuplicateSource.name }}」的技能了，建議修改顯示名稱以便區分。
            </div>
            <label class="dsd-note-label pdd-name-label">顯示名稱</label>
            <input
              v-model="pendingDuplicateName"
              class="custom-input pdd-name-input"
              placeholder="輸入顯示名稱"
              @keydown.enter="confirmPendingDuplicate"
            />
            <div class="confirm-actions">
              <button
                class="custom-btn custom-main-btn"
                :disabled="!pendingDuplicateName.trim()"
                @click="confirmPendingDuplicate"
              >
                <i class="material-symbols-outlined">check_circle</i>確認
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 選擇修改方式：複製完成後，或點個人技能的「編輯」 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="editChoiceSkill && !showEditChatForDuplicate"
          class="drawer-confirm-overlay"
          @click.self="editChoiceSkill = null"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>{{ editChoiceIsFreshDuplicate ? '已建立複本' : '編輯技能' }}</h4>
            <div v-if="editChoiceSkill.personalStatus === 'draft'" class="confirm-warning-banner">
              <i class="material-symbols-outlined">info</i>
              這份複本內容目前與原技能完全相同。內容一模一樣的技能會讓後續維運難以區分，也可能造成 Agent 判斷失準，建議修改後再使用。
            </div>
            <p>
              {{ editChoiceIsFreshDuplicate ? '接下來想怎麼修改這份複本？' : `接下來想怎麼修改「${editChoiceSkill.name}」？` }}
            </p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn" @click="handleChatEdit">
                <i class="material-symbols-outlined">forum</i>跟 Agent 對話修改
              </button>
              <button class="custom-btn custom-main-btn" @click="handleDirectEdit">
                <i class="material-symbols-outlined">edit</i>直接編輯
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <SkillEditChatModal
      v-model="showEditChatForDuplicate"
      :skill="editChoiceSkill"
      @done="closeChatEdit"
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

            <div class="dsd-scope">
              <label class="dsd-note-label">預計發布層級</label>
              <div class="dsd-scope-options">
                <button
                  :class="['dsd-scope-option', submitScope === 'enterprise' && 'is-selected']"
                  @click="submitScope = 'enterprise'"
                >
                  <i class="material-symbols-outlined">corporate_fare</i>企業技能
                </button>
                <button
                  :class="['dsd-scope-option', submitScope === 'team' && 'is-selected']"
                  :disabled="submitTeamLocked"
                  @click="!submitTeamLocked && (submitScope = 'team')"
                >
                  <i class="material-symbols-outlined">group</i>團隊技能
                </button>
              </div>
              <p v-if="submitTeamLocked" class="dsd-scope-hint">
                此技能已有團隊版本的 Library 版，本次只能送審企業層級
              </p>
              <div v-if="submitScope === 'team'" class="dsd-team">
                <label class="dsd-note-label">發布團隊</label>
                <select v-model="submitTeamName" class="dsd-team-select">
                  <option v-for="t in knownTeamNames" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div class="dsd-note">
              <label class="dsd-note-label">版本名稱</label>
              <div class="dsd-version-name-row">
                <input
                  v-model="submitVersionName"
                  class="custom-input"
                  maxlength="40"
                  placeholder="簡短描述這個版本，例如「VIP 退貨優惠更新」"
                  @keydown.enter="submitVersionName.trim() && confirmSubmitSkill()"
                />
                <button
                  type="button"
                  class="custom-btn dsd-ai-suggest-btn"
                  :disabled="suggestingVersionName"
                  title="AI 建議命名（會參考你填的說明，可自行修改）"
                  @click="suggestVersionNameNow"
                >
                  <i class="material-symbols-outlined">{{ suggestingVersionName ? 'progress_activity' : 'auto_awesome' }}</i>
                  AI 建議
                </button>
              </div>
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
              <button
                class="custom-btn custom-main-btn"
                :disabled="!submitVersionName.trim()"
                @click="confirmSubmitSkill"
              >
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillTile from '@/components/Skill/SkillTile.vue'
import PersonalSkillGroup from '@/components/Skill/PersonalSkillGroup.vue'
import SkillReviewQueue from '@/components/Skill/SkillReviewQueue.vue'
import LibraryBrowseModal from '@/components/Skill/LibraryBrowseModal.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import SkillReviewDrawer from '@/components/Skill/SkillReviewDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import BatchUpdateModal from '@/components/Skill/BatchUpdateModal.vue'
import SkillEditChatModal from '@/components/Skill/SkillEditChatModal.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, ConflictResolution } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkillId = ref<string | null>(null)
const detailSkill = computed<Skill | null>(() => {
  if (!detailSkillId.value) return null
  return store.myPersonalSkills.find(s => s.id === detailSkillId.value)
    ?? store.flatSkills.find(s => s.id === detailSkillId.value)
    ?? null
})
const showReviewDrawer = ref(false)
const reviewingSkillId = ref('')
const upstreamSkill = ref<Skill | null>(null)
const showBatchUpdate = ref(false)

const showLibraryModal = ref(false)
const editChoiceSkill = ref<Skill | null>(null)
const editChoiceIsFreshDuplicate = ref(false)
const showEditChatForDuplicate = ref(false)

// 建立副本第一步：先確認顯示名稱，確認後才真正建立副本（此時才會出現在「我的技能」列表）
const pendingDuplicateSource = ref<Skill | null>(null)
const pendingDuplicateName = ref('')
const pendingDuplicateConflict = computed(() =>
  pendingDuplicateSource.value ? store.wouldSkillNameConflict(pendingDuplicateSource.value.id) : false
)

// 角色（mock：企業管理者可見審核區）
const currentUserRole = ref<'user' | 'enterprise_admin' | 'enterprise_owner'>('enterprise_admin')
const isManager = computed(() =>
  currentUserRole.value === 'enterprise_admin' || currentUserRole.value === 'enterprise_owner'
)

// Tab：從 side-menu 進入一律預設「我的技能」
const activeTab = ref<'my' | 'review'>('my')
// 管理區底下再分兩個子分頁：待審核送審／Library 現有技能管理，
// 兩塊內容都不小，不再直接上下堆疊成一個超長頁面
const reviewSubTab = ref<'pending' | 'library'>('pending')

// 分頁
const PAGE_SIZE = 10
const currentPage = ref(1)
const pagedSkills = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return store.myPersonalSkills.slice(start, start + PAGE_SIZE)
})
const totalPages = computed(() => Math.max(1, Math.ceil(store.myPersonalSkills.length / PAGE_SIZE)))
watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = tp
})

// Library 現有技能管理（審核區內，限管理者）
const libraryManageQuery = ref('')
const filteredLibrarySkills = computed(() => {
  const q = libraryManageQuery.value.toLowerCase().trim()
  if (!q) return store.flatSkills
  return store.flatSkills.filter(s =>
    s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
})
const filteredEnterpriseSkills = computed(() =>
  filteredLibrarySkills.value.filter(s => s.scope === 'enterprise')
)
const groupedTeamSkills = computed(() => {
  const teamSkills = filteredLibrarySkills.value.filter(s => s.scope === 'team')
  const map = new Map<string, Skill[]>()
  for (const s of teamSkills) {
    const key = s.teamName ?? '其他團隊'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return Array.from(map.entries()).map(([teamName, skills]) => ({ teamName, skills }))
})

const submitConfirmSkill = ref<Skill | null>(null)
const submitMode = ref<'new_skill' | 'version_update'>('new_skill')
const submitScope = ref<'enterprise' | 'team'>('enterprise')
// 若送審的版本已經是團隊 Library 版，團隊層級已經有了，只能往上送企業層級
const submitTeamLocked = ref(false)
const submitTeamName = ref('')
const submitNote = ref('')
const submitVersionName = ref('')
const suggestingVersionName = ref(false)

// 送審 dialog 的團隊選單：彙整目前 Library 團隊技能與其他個人技能已填寫過的團隊名稱
const knownTeamNames = computed(() => {
  const names = new Set<string>()
  store.flatSkills.forEach(s => { if (s.teamName) names.add(s.teamName) })
  store.myPersonalSkills.forEach(s => { if (s.targetTeamName) names.add(s.targetTeamName) })
  return Array.from(names)
})

const upstreamVersionForDetail = computed(() => {
  if (!detailSkill.value) return undefined
  return store.getUpstreamVersion(detailSkill.value.id)
})


function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}

function handleEdit(skill: Skill) {
  if (skill.zone !== 'personal') {
    router.push({ path: '/view/SkillEditor', query: { skillId: skill.id } })
    return
  }
  detailSkillId.value = null
  showLibraryModal.value = false
  editChoiceSkill.value = skill
  editChoiceIsFreshDuplicate.value = false
}

function openReview(skillId: string, _versionId: string) {
  reviewingSkillId.value = skillId
  showReviewDrawer.value = true
}

function openUpstreamUpdate(skill: Skill) {
  detailSkillId.value = null
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
  detailSkillId.value = null
  showLibraryModal.value = false
  pendingDuplicateSource.value = skill
  pendingDuplicateName.value = skill.name
}

function cancelPendingDuplicate() {
  pendingDuplicateSource.value = null
  pendingDuplicateName.value = ''
}

function confirmPendingDuplicate() {
  if (!pendingDuplicateSource.value) return
  const copy = store.duplicateAsPersonalSkill(pendingDuplicateSource.value.id, pendingDuplicateName.value)
  cancelPendingDuplicate()
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}

function handleDirectEdit() {
  if (!editChoiceSkill.value) return
  router.push({ path: '/view/SkillEditor', query: { skillId: editChoiceSkill.value.id } })
  editChoiceSkill.value = null
}

function handleChatEdit() {
  showEditChatForDuplicate.value = true
}

function closeChatEdit() {
  showEditChatForDuplicate.value = false
  editChoiceSkill.value = null
}

// ── 個人技能 handlers ──────────────────────────────

function handlePersonalSubmit(skill: Skill) {
  const teamAlreadyPublished = skill.personalStatus === 'has_library' && skill.targetScope === 'team'

  submitConfirmSkill.value = skill
  submitMode.value = skill.derivedFrom ? 'version_update' : 'new_skill'
  submitTeamLocked.value = teamAlreadyPublished
  submitScope.value = teamAlreadyPublished ? 'enterprise' : (skill.targetScope ?? 'enterprise')
  submitTeamName.value = skill.targetTeamName ?? knownTeamNames.value[0] ?? ''
  submitNote.value = ''
  submitVersionName.value = ''
  // 開啟 dialog 就先給一個 AI 建議草稿（此時說明通常還沒填，用泛用建議打底），
  // 使用者填完說明後可以再按「AI 建議」重新生成一次更貼近內容的名稱
  suggestVersionNameNow()
}

async function suggestVersionNameNow() {
  if (!submitConfirmSkill.value) return
  suggestingVersionName.value = true
  try {
    submitVersionName.value = await store.suggestVersionName(
      submitConfirmSkill.value.id,
      submitNote.value,
      submitMode.value
    )
  } finally {
    suggestingVersionName.value = false
  }
}

function confirmSubmitSkill() {
  if (!submitConfirmSkill.value || !submitVersionName.value.trim()) return
  store.submitPersonalSkill(
    submitConfirmSkill.value.id,
    submitMode.value,
    submitNote.value,
    submitVersionName.value.trim(),
    submitScope.value,
    submitScope.value === 'team' ? submitTeamName.value : undefined
  )
  submitConfirmSkill.value = null
  submitNote.value = ''
  submitVersionName.value = ''
}

function handlePersonalDelete(skill: Skill) {
  store.deletePersonalSkill(skill.id)
  if (detailSkillId.value === skill.id) detailSkillId.value = null
}

function handleApprove(skill: Skill) {
  store.approvePersonalSkill(skill.id)
}

function handleReject(skill: Skill, feedback: string) {
  store.rejectPersonalSkill(skill.id, feedback)
}

function handleToggle(skill: Skill) {
  store.toggleSkill(skill.id)
}

function getDerivedFromName(derivedFrom: string): string {
  return store.findSkill(derivedFrom)?.name ?? derivedFrom
}
</script>
