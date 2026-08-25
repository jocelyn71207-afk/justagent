<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="SkillDetailDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">

          <!-- ── Header ─────────────────────────────── -->
          <div class="drawer-head">
            <div class="dh-skill">
              <div :class="['dh-icon', iconScopeClass]">
                <i class="material-symbols-outlined">{{ iconName }}</i>
              </div>
              <div class="dh-title">
                <div class="dh-name">{{ skill.name }}</div>
                <div class="dh-badges">
                  <span v-if="!isPersonal" class="skill-tag tag--version">v{{ skill.version }}</span>
                  <span :class="['dh-status', skill.isEnabled ? 'dh-status--on' : 'dh-status--off']">
                    <span class="dh-status-dot"></span>
                    {{ skill.isEnabled ? '啟用中' : '已停用' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="dh-actions">
              <template v-if="!isPersonal">
                <button v-if="manageable" class="custom-btn dh-btn" @click="emit('edit', skill!)">
                  <i class="material-symbols-outlined">edit</i>編輯
                </button>
                <button class="custom-btn dh-btn" @click="emit('test', skill!)">
                  <i class="material-symbols-outlined">science</i>測試
                </button>
              </template>
              <template v-else>
                <button class="custom-btn dh-btn" @click="emit('test', skill!)">
                  <i class="material-symbols-outlined">science</i>測試
                </button>
                <button
                  v-if="skill.personalStatus !== 'reviewing'"
                  class="custom-btn dh-btn"
                  @click="emit('edit', skill!)"
                >
                  <i class="material-symbols-outlined">edit</i>編輯
                </button>
              </template>
              <button class="custom-btn dh-btn" @click="emit('duplicate', skill!)">
                <i class="material-symbols-outlined">content_copy</i>複製
              </button>
              <button
                v-if="isPersonal && skill.personalStatus !== 'reviewing'"
                class="custom-btn dh-btn dh-btn--submit"
                @click="emit('submit', skill!)"
              >
                <i class="material-symbols-outlined">send</i>送審
              </button>
              <button class="custom-btn dh-btn" @click="showMarkdown = true">
                <i class="material-symbols-outlined">description</i>skill.md
              </button>
              <button class="drawer-close-btn" @click="emit('close')">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
          </div>

          <!-- 有版本待審核：原本只有捲到版本歷史才看得到，容易被忽略，
               放在統計數據上方、一打開就看得到 -->
          <div v-if="!isPersonal && reviewingVersion" class="pending-review-banner">
            <div class="pending-review-text">
              <i class="material-symbols-outlined">pending_actions</i>
              新版本 <strong>v{{ reviewingVersion.versionTag }}</strong> 正在等待審核
            </div>
            <button
              v-if="manageable"
              class="custom-btn"
              @click="emit('review', skill!.id, reviewingVersion.id)"
            >
              <i class="material-symbols-outlined">rate_review</i>開始審核
            </button>
          </div>

          <!-- ── Metrics bar ────────────────────────── -->
          <!-- 只顯示本月使用次數，不放測試通過率/平均延遲。只有一格時
               不套用「多格平分寬度」的排版，改成靠左的緊湊區塊＋
               justify-content:space-between 把停用按鈕推到最右，
               不會像之前那樣留下一大塊空白 -->
          <div class="drawer-metrics">
            <div class="dm-cell">
              <i class="material-symbols-outlined dm-icon dm-icon--bolt">bolt</i>
              <div class="dm-num">{{ formatCount(skill.usageCount) }}</div>
              <div class="dm-lbl">本月使用</div>
            </div>
            <div v-if="isPersonal || manageable" class="dm-toggle">
              <button
                class="custom-btn dm-toggle-btn btn--danger-ghost"
                @click="emit('toggle', skill!)"
              >
                {{ skill.isEnabled ? '停用' : '啟用技能' }}
              </button>
            </div>
          </div>

          <!-- ── Body：雙欄——左邊是「這個技能在做什麼」的主要內容，
               右邊是常駐的中繼資料側欄（來源/Agent/趨勢/版本），概念上
               跟 GitHub PR 頁面「說明在左、標籤在右」是同一種分法 ──── -->
          <div class="drawer-body">

            <div class="drawer-body-main">

              <!-- 個人技能目前狀態：可能包含審核退回原因，屬於需要立刻
                   看到的內容，不放進側欄 -->
              <div v-if="isPersonal" class="drawer-section">
                <div class="section-label">目前狀態</div>
                <div class="psv-card">
                  <div class="psv-head">
                    <span
                      v-if="personalStatusLabel"
                      :class="['skill-tag', personalStatusClass]"
                    >
                      {{ personalStatusLabel }}
                    </span>
                    <span v-if="skill.submitMode" class="psv-mode">
                      {{ skill.submitMode === 'version_update' ? '更新版本' : '建立新技能' }}
                    </span>
                    <span
                      v-if="skill.personalStatus === 'reviewing' && skill.targetScope"
                      class="skill-tag psv-scope-tag"
                      :class="skill.targetScope === 'team' ? 'tag--team' : 'tag--enterprise'"
                    >
                      <i class="material-symbols-outlined">{{ skill.targetScope === 'team' ? 'group' : 'corporate_fare' }}</i>
                      預計發布：{{ skill.targetScope === 'team' ? `團隊技能（${skill.targetTeamName ?? '未指定團隊'}）` : '企業技能' }}
                    </span>
                  </div>

                  <div v-if="skill.hasLibraryUpdate" class="psv-upstream-hint">
                    <i class="material-symbols-outlined">system_update_alt</i>
                    <span>
                      Library 來源技能有新版本
                      <span v-if="derivedFromName" class="psv-upstream-src">「{{ derivedFromName }}」</span>
                    </span>
                  </div>

                  <div v-if="skill.submitNote" class="psv-note">
                    <i class="material-symbols-outlined">sticky_note_2</i>{{ skill.submitNote }}
                  </div>
                  <div v-if="skill.reviewFeedback" class="psv-reject-feedback">
                    <i class="material-symbols-outlined">feedback</i>
                    <div>
                      <div class="psv-reject-feedback-label">審核退回原因</div>
                      <div>{{ skill.reviewFeedback }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 技能指令：固定區塊，沒有指令內容時顯示提示文字 -->
              <div class="drawer-section">
                <div class="section-label">技能指令</div>
                <div v-if="skill.instructions" class="instructions-block">{{ skill.instructions }}</div>
                <p v-else class="section-empty-hint">尚未撰寫技能指令</p>
              </div>

              <!-- 附加檔案 -->
              <div v-if="skill.files?.length || canEditFiles" class="drawer-section">
                <div class="section-label-row">
                  <span class="section-label">附加檔案</span>
                  <button
                    v-if="canEditFiles && !isEditingFiles"
                    type="button"
                    class="section-edit-btn"
                    aria-label="編輯附加檔案"
                    @click="startEditFiles"
                  >
                    <i class="material-symbols-outlined">edit</i>
                  </button>
                </div>

                <template v-if="isEditingFiles">
                  <SkillFileUpload v-model="editFilesDraft" />
                  <div class="section-edit-actions">
                    <button type="button" class="custom-btn" @click="cancelEditFiles">取消</button>
                    <button type="button" class="custom-btn custom-main-btn" @click="saveEditFiles">儲存</button>
                  </div>
                </template>

                <template v-else>
                  <div v-if="skill.files?.length" class="attached-file-list">
                    <div v-for="f in skill.files" :key="f.id" class="attached-file-item">
                      <i class="material-symbols-outlined">{{ skillFileIcon(f.fileType) }}</i>
                      <span class="af-name">{{ f.fileName }}</span>
                      <span class="af-size">{{ formatFileSize(f.fileSize) }}</span>
                    </div>
                  </div>
                  <p v-else class="section-empty-hint">尚未附加檔案</p>
                </template>
              </div>

              <!-- 覆蓋能力：固定區塊，沒有拆解出能力項目時退回顯示技能描述 -->
              <div class="drawer-section">
                <div class="section-label">覆蓋能力</div>
                <template v-if="skill.capabilities?.length">
                  <div class="capability-grid">
                    <div
                      v-for="cap in skill.capabilities"
                      :key="cap.name"
                      class="capability-card"
                    >
                      <div class="cap-name">{{ cap.name }}</div>
                      <div class="cap-desc">{{ cap.description }}</div>
                    </div>
                  </div>
                  <div class="skill-summary">{{ skill.description }}</div>
                </template>
                <p v-else class="section-empty-hint">尚未拆解覆蓋能力項目</p>
              </div>

              <!-- 實際使用情境：固定區塊，沒有記錄使用情境時顯示提示文字 -->
              <div class="drawer-section">
                <div class="section-label">實際使用情境</div>
                <div v-if="skill.usageScenarios?.length" class="scenario-list">
                  <div
                    v-for="(sc, i) in skill.usageScenarios"
                    :key="sc.title"
                    class="scenario-item"
                  >
                    <div class="scenario-num">{{ i + 1 }}</div>
                    <div class="scenario-body">
                      <div class="scenario-title">{{ sc.title }}</div>
                      <div class="scenario-desc">{{ sc.description }}</div>
                    </div>
                  </div>
                </div>
                <p v-else class="section-empty-hint">尚無記錄的使用情境</p>
              </div>

              <!-- 演化上下文 -->
              <div v-if="skill.evolutionContext" class="drawer-section">
                <div class="section-label">
                  <i class="material-symbols-outlined">auto_awesome</i>演化上下文
                </div>
                <p class="evolution-context">{{ skill.evolutionContext }}</p>
              </div>

              <!-- 危險操作 -->
              <div v-if="isPersonal" class="drawer-danger-zone">
                <div class="danger-zone-label">危險操作</div>
                <button
                  class="custom-btn btn--danger-ghost drawer-delete-btn"
                  @click="showConfirm = true"
                >
                  <i class="material-symbols-outlined">delete</i>刪除此技能
                </button>
              </div>
            </div>

            <div class="drawer-body-side">

              <!-- 來源關係：企業技能是全公司唯一一份的正式發佈技能，沒有「延伸自
                   誰／自建」這種個人層級的血緣關係可看，顯示反而是雜訊 -->
              <div v-if="skill.scope !== 'enterprise'" class="drawer-section">
                <div class="section-label">來源關係</div>
                <div class="lineage-row">
                  <template v-if="lineageSourceName">
                    <span class="lineage-text">
                      <i class="material-symbols-outlined lineage-icon">call_split</i>
                      延伸自「{{ lineageSourceName }}」
                    </span>
                    <span v-if="lineageSourceVersion" class="skill-tag tag--version">v{{ lineageSourceVersion }}</span>
                    <span v-if="lineageSourceScopeLabel" :class="['skill-tag', lineageSourceScopeClass]">{{ lineageSourceScopeLabel }}</span>
                  </template>
                  <span v-else class="lineage-text">
                    <i class="material-symbols-outlined lineage-icon">edit_note</i>
                    自建
                  </span>
                  <span v-if="creationMethodLabel" class="lineage-divider">·</span>
                  <span v-if="creationMethodLabel" class="lineage-method">
                    <i class="material-symbols-outlined">{{ skill.creationMethod === 'ai_assisted' ? 'auto_awesome' : 'edit' }}</i>
                    {{ creationMethodLabel }}
                  </span>
                </div>
              </div>

              <!-- 可調用此技能的 Agent -->
              <div class="drawer-section">
                <div class="section-label">可調用此技能的 Agent</div>
                <div v-if="skill.assignedAgents?.length" class="agent-tag-list">
                  <span v-for="agent in skill.assignedAgents" :key="agent" class="agent-tag">
                    <i class="material-symbols-outlined">smart_toy</i>
                    {{ agent }}
                  </span>
                </div>
                <div v-else class="agent-empty">尚未指派給任何 Agent</div>
              </div>

              <!-- 近 7 天使用趨勢 -->
              <div class="drawer-section">
                <div class="section-label chart-section-label">
                  <span>近 7 天使用趨勢</span>
                </div>
                <div class="chart-wrap">
                  <svg viewBox="0 0 400 100" preserveAspectRatio="none" class="trend-svg">
                    <defs>
                      <linearGradient :id="`grad-${skill.id}`" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#059669" stop-opacity="0.18" />
                        <stop offset="100%" stop-color="#059669" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <path :d="chartData.area" :fill="`url(#grad-${skill.id})`" />
                    <path :d="chartData.line" fill="none" stroke="#059669" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" />
                    <circle
                      v-for="(p, i) in chartData.pts"
                      :key="i"
                      :cx="p.x" :cy="p.y" r="2.5"
                      fill="#059669"
                    />
                  </svg>
                  <div class="chart-x-labels">
                    <span v-for="l in CHART_LABELS" :key="l">{{ l }}</span>
                  </div>
                </div>
              </div>

              <!-- 版本歷史：固定區塊，但只有 Library 技能才有版本概念，
                   個人技能沒有這個區塊（不是資料剛好是空的，是本來就不該顯示） -->
              <div v-if="!isPersonal" class="drawer-section">
                <div class="section-label">版本歷史</div>
                <div v-if="skill.versions?.length" class="vt-list">
                  <div v-for="(ver, i) in sortedVersions" :key="ver.id" class="vt-item">
                    <div :class="['vt-dot', `vt-dot--${ver.status}`]"></div>
                    <div class="vt-body">
                      <div class="vt-header">
                        <!-- 版號是審核通過才正式核發，審核中的版本還沒有版號 -->
                        <span v-if="ver.status !== 'reviewing'" class="vt-version-tag">v{{ ver.versionTag }}</span>
                        <span :class="['vt-status-badge', `vt-status--${ver.status}`]">
                          {{ versionStatusLabel(ver.status) }}
                        </span>
                        <span class="vt-date">{{ formatDate(ver.createdAt) }}</span>
                      </div>
                      <div v-if="ver.updateNote" class="vt-note">{{ ver.updateNote }}</div>
                      <div class="vt-actions">
                        <!-- 「待啟用」（剛審核通過，還沒上線）或「歷史」（曾經生效、
                             後來被取代）才能設為使用中；審核中／草稿／退回都還沒
                             通過審核，不能直接上線 -->
                        <button
                          v-if="props.manageable && !isPersonal && (ver.status === 'approved' || ver.status === 'history')"
                          class="custom-btn vt-activate-btn"
                          @click="skillStore.setLibraryActiveVersion(skill!.id, ver.id)"
                        >
                          <i class="material-symbols-outlined">check_circle</i>設為使用中
                        </button>
                        <button
                          v-if="ver.status === 'reviewing'"
                          class="custom-btn"
                          @click="emit('review', skill!.id, ver.id)"
                        >
                          <i class="material-symbols-outlined">rate_review</i>開始審核
                        </button>
                        <button
                          v-if="i < sortedVersions.length - 1"
                          class="custom-btn"
                          @click="openCompare(sortedVersions[i + 1].id, ver.id)"
                        >
                          <i class="material-symbols-outlined">difference</i>與前版比較
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="section-empty-hint">尚無版本歷史</p>
              </div>

              <!-- 操作記錄 -->
              <div v-if="auditLog.length" class="drawer-section">
                <div class="section-label">操作記錄</div>
                <div class="audit-timeline">
                  <div v-for="(rec, i) in auditLog" :key="i" class="audit-item">
                    <div :class="['audit-dot', `audit-dot--${rec.action.toLowerCase()}`]"></div>
                    <div class="audit-body">
                      <span class="audit-action">{{ auditActionLabel(rec.action) }}</span>
                      <span class="audit-meta">· {{ rec.by }} · {{ formatAuditDate(rec.time) }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 版本比較 modal -->
    <SkillVersionCompareModal
      v-if="skill && compareV1Id && compareV2Id"
      v-model="showCompare"
      :skill-id="skill.id"
      :v1-id="compareV1Id"
      :v2-id="compareV2Id"
    />

    <!-- skill.md 內容 -->
    <SkillMarkdownModal v-model="showMarkdown" :skill="skill" />

    <!-- 刪除確認 -->
    <Transition name="confirm-fade">
      <div v-if="showConfirm && skill" class="drawer-confirm-overlay" @click.self="showConfirm = false">
        <div class="drawer-confirm-dialog">
          <div class="confirm-icon"><i class="material-symbols-outlined">warning</i></div>
          <h4>確定要刪除「{{ skill.name }}」？</h4>
          <p>刪除後此技能將無法繼續使用。</p>
          <div class="confirm-actions">
            <button class="custom-btn" @click="showConfirm = false">取消</button>
            <button class="custom-btn btn--danger-ghost" @click="confirmDelete">確定刪除</button>
          </div>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Skill, SkillVersionStatus, OperationRecord, SkillFile } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'
import SkillVersionCompareModal from '@/components/Skill/SkillVersionCompareModal.vue'
import SkillMarkdownModal from '@/components/Skill/SkillMarkdownModal.vue'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'
import { skillFileIcon } from '@/components/Skill/skillFileUpload'
import { formatFileSize } from '@/utils/file'

const CHART_LABELS = ['6天前', '5天前', '4天前', '3天前', '2天前', '昨天', '今天']

const props = defineProps<{
  skill: Skill | null
  upstreamVersion?: string
  manageable?: boolean
}>()
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
  edit: [skill: Skill]
  delete: [skill: Skill]
  duplicate: [skill: Skill]
  review: [skillId: string, versionId: string]
  openUpstreamUpdate: [skill: Skill]
  submit: [skill: Skill]
}>()

const skillStore = useSkillStore()
const showConfirm = ref(false)
const showMarkdown = ref(false)
const showCompare = ref(false)
const compareV1Id = ref('')
const compareV2Id = ref('')

const isPersonal = computed(() => props.skill?.zone === 'personal')

// ── 附加檔案：抽屜內直接編輯 ──────────────
const canEditFiles = computed(() => {
  if (!isPersonal.value) return true
  return props.skill?.personalStatus !== 'reviewing'
})

const isEditingFiles = ref(false)
const editFilesDraft = ref<SkillFile[]>([])

function startEditFiles() {
  editFilesDraft.value = [...(props.skill?.files ?? [])]
  isEditingFiles.value = true
}

function cancelEditFiles() {
  isEditingFiles.value = false
}

function saveEditFiles() {
  if (!props.skill) return
  skillStore.updateSkillFiles(props.skill.id, editFilesDraft.value)
  isEditingFiles.value = false
}

watch(() => props.skill?.id, () => { isEditingFiles.value = false })

const derivedFromName = computed(() => {
  if (!props.skill?.derivedFrom) return ''
  return skillStore.findSkill(props.skill.derivedFrom)?.name ?? props.skill.derivedFrom
})

const personalStatusLabel = computed(() => {
  const s = props.skill
  if (!s) return null
  if (s.personalStatus === 'draft') return '草稿'
  if (s.personalStatus === 'reviewing') return '審核中'
  if (s.personalStatus === 'has_library') {
    if (s.targetScope === 'team') return `已有Library版（團隊・${s.targetTeamName ?? '未指定團隊'}）`
    if (s.targetScope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return '可使用'
})

const personalStatusClass = computed(() => {
  const s = props.skill?.personalStatus
  if (s === 'draft') return 'tag--draft'
  if (s === 'reviewing') return 'tag--reviewing'
  if (s === 'has_library') return 'tag--has-library'
  return 'tag--available'
})

// 圖示跟卡片式目錄（SkillTile／PersonalSkillGroup）統一：用 scope 決定顏色、
// 個人技能用 person 圖示，其餘一律 psychology，不再依 type（system/extension）
// 另外分一套配色，避免同一顆技能在列表卡片跟詳情抽屜長得不一樣
const iconName = computed(() => (isPersonal.value ? 'person' : 'psychology'))

const iconScopeClass = computed(() => {
  if (isPersonal.value) return 'icon--personal'
  if (props.skill?.scope === 'enterprise') return 'icon--enterprise'
  if (props.skill?.scope === 'team') return 'icon--team'
  return 'icon--system'
})

const sortedVersions = computed(() => {
  if (!props.skill?.versions) return []
  return [...props.skill.versions].reverse()
})

// 有沒有一個「審核中」的新版本（Library 技能既有版本之外又送了新版本審核，
// 跟個人技能自己送審 Library 是兩回事，個人技能不會有這個狀態）
const reviewingVersion = computed(() =>
  props.skill?.versions?.find(v => v.status === 'reviewing')
)

const lineageSource = computed(() => {
  const s = props.skill
  if (!s) return null
  const sourceId = s.forkSourceId ?? s.derivedFrom
  if (!sourceId) return null
  return skillStore.findSkill(sourceId) ?? null
})

const lineageSourceName = computed(() => {
  const s = props.skill
  if (!s) return ''
  const sourceId = s.forkSourceId ?? s.derivedFrom
  if (!sourceId) return ''
  return lineageSource.value?.name ?? sourceId
})

const lineageSourceVersion = computed(() => {
  const s = props.skill
  if (!s) return ''
  return s.forkSourceVersion ?? s.derivedFromVersion ?? ''
})

const lineageSourceScopeLabel = computed(() => {
  const src = lineageSource.value
  if (!src) return ''
  if (src.zone === 'personal') return '個人技能'
  if (src.scope === 'team') return `團隊技能${src.teamName ? `・${src.teamName}` : ''}`
  if (src.scope === 'enterprise') return '企業技能'
  if (src.scope === 'system') return '系統技能'
  return ''
})

const lineageSourceScopeClass = computed(() => {
  const src = lineageSource.value
  if (!src) return ''
  if (src.zone === 'personal') return 'tag--personal'
  if (src.scope === 'team') return 'tag--team'
  if (src.scope === 'enterprise') return 'tag--enterprise'
  if (src.scope === 'system') return 'tag--sys'
  return ''
})

const creationMethodLabel = computed(() => {
  if (props.skill?.creationMethod === 'ai_assisted') return 'AI 協助建立'
  if (props.skill?.creationMethod === 'manual') return '手動撰寫'
  return ''
})

const auditLog = computed(() => (props.skill?.auditLog ?? []).slice(0, 5))

function auditActionLabel(action: OperationRecord['action']): string {
  const map: Record<OperationRecord['action'], string> = {
    ENABLED: '啟用此技能',
    DISABLED: '停用此技能',
    UPSTREAM_MERGED: '合併上游更新',
    UPSTREAM_IGNORED: '忽略上游更新',
    UPSTREAM_DETACHED: '永久分離上游',
  }
  return map[action]
}

function formatAuditDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function versionStatusLabel(status: SkillVersionStatus): string {
  const map: Record<SkillVersionStatus, string> = {
    draft: '草稿', reviewing: '審核中', approved: '待啟用', active: '生效中', history: '歷史', rejected: '已退回',
  }
  return map[status] ?? status
}

function openCompare(v1Id: string, v2Id: string) {
  compareV1Id.value = v1Id
  compareV2Id.value = v2Id
  showCompare.value = true
}

function mockWeeklyData(skill: Skill): number[] {
  const seed = skill.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const base = Math.max(skill.usageCount, 5)
  return Array.from({ length: 7 }, (_, i) =>
    Math.round(base * 0.12 * (0.4 + Math.abs(Math.sin(seed * 0.07 + i * 1.1))))
  )
}

const chartData = computed(() => {
  const skill = props.skill
  if (!skill) return { pts: [], line: '', area: '' }

  const values = mockWeeklyData(skill)
  const W = 400, H = 100
  const px = 8, pt = 8, pb = 12
  const maxVal = Math.max(...values, 1)

  const pts = values.map((v, i) => ({
    x: px + (i / (values.length - 1)) * (W - px * 2),
    y: pt + (1 - v / maxVal) * (H - pt - pb),
  }))

  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    line += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }

  const bottomY = H - pb
  const area = `${line} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`
  return { pts, line, area }
})

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function confirmDelete() {
  showConfirm.value = false
  emit('delete', props.skill!)
}
</script>
