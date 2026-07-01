<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="SkillDetailDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">

          <!-- ── Header ─────────────────────────────── -->
          <div class="drawer-head">
            <div class="dh-skill">
              <div :class="['dh-icon', skill.type === 'extension' ? 'icon--ext' : 'icon--sys']">
                <i class="material-symbols-outlined">{{ iconName }}</i>
              </div>
              <div class="dh-title">
                <div class="dh-name">{{ skill.name }}</div>
                <div class="dh-badges">
                  <span class="skill-tag tag--version">v{{ skill.version }}</span>
                  <span :class="['dh-status', skill.isEnabled ? 'dh-status--on' : 'dh-status--off']">
                    <span class="dh-status-dot"></span>
                    {{ skill.isEnabled ? '啟用中' : '已停用' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="dh-actions">
              <button class="custom-btn dh-btn" @click="emit('test', skill!)">
                <i class="material-symbols-outlined">science</i>測試
              </button>
              <button class="custom-btn dh-btn" @click="emit('edit', skill!)">
                <i class="material-symbols-outlined">edit</i>編輯
              </button>
              <button class="custom-btn dh-btn" @click="emit('duplicate', skill!)">
                <i class="material-symbols-outlined">content_copy</i>複製
              </button>
              <button class="drawer-close-btn" @click="emit('close')">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>
          </div>

          <!-- ── Metrics bar ────────────────────────── -->
          <div class="drawer-metrics">
            <div class="dm-cell">
              <i class="material-symbols-outlined dm-icon dm-icon--bolt">bolt</i>
              <div class="dm-num">{{ formatCount(skill.usageCount) }}</div>
              <div class="dm-lbl">本月使用</div>
            </div>
            <div class="dm-divider"></div>
            <div class="dm-cell">
              <i :class="['material-symbols-outlined', 'dm-icon', rateIconClass]">verified</i>
              <div :class="['dm-num', rateNumClass]">{{ Math.round(skill.testPassRate * 100) }}%</div>
              <div class="dm-lbl">通過率</div>
            </div>
            <div class="dm-divider"></div>
            <div class="dm-cell">
              <i class="material-symbols-outlined dm-icon">timer</i>
              <div class="dm-num">{{ skill.avgLatencyMs }}ms</div>
              <div class="dm-lbl">平均延遲</div>
            </div>
            <div class="dm-divider"></div>
            <div class="dm-toggle">
              <button
                class="custom-btn dm-toggle-btn btn--danger-ghost"
                @click="emit('toggle', skill!)"
              >
                {{ skill.isEnabled ? '停用' : '啟用技能' }}
              </button>
            </div>
          </div>

          <!-- ── Body ───────────────────────────────── -->
          <div class="drawer-body">

            <!-- Upstream update banner -->
            <div v-if="upstreamVersion" class="upstream-update-banner">
              <div class="upstream-banner-text">
                <i class="material-symbols-outlined">upgrade</i>
                上游系統技能已更新至 <strong>v{{ upstreamVersion }}</strong>
              </div>
              <button class="custom-btn" @click="emit('openUpstreamUpdate', skill!)">查看更新</button>
            </div>

            <!-- 來源關係 -->
            <div class="drawer-section">
              <div class="section-label">來源關係</div>
              <div class="lineage-row">
                <template v-if="skill.type === 'extension' && skill.forkSourceId">
                  <span class="lineage-node">
                    系統技能
                    <span class="lineage-source-version">v{{ skill.forkSourceVersion }}</span>
                  </span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--origin">{{ originLabel }}</span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                </template>
                <template v-else-if="skill.origin === 'manually_created'">
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge lineage-badge--manual">手動建立</span>
                </template>
                <template v-else>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge">系統技能</span>
                </template>
              </div>
            </div>

            <!-- 技能指令 -->
            <div v-if="skill.instructions" class="drawer-section">
              <div class="section-label">技能指令</div>
              <div class="instructions-block">{{ skill.instructions }}</div>
            </div>

            <!-- 覆蓋能力 -->
            <div v-if="skill.capabilities?.length" class="drawer-section">
              <div class="section-label">覆蓋能力</div>
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
            </div>

            <!-- 實際使用情境 -->
            <div v-if="skill.usageScenarios?.length" class="drawer-section">
              <div class="section-label">實際使用情境</div>
              <div class="scenario-list">
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

            <!-- 版本歷史 -->
            <div v-if="skill.versions?.length" class="drawer-section">
              <div class="section-label">版本歷史</div>
              <div class="vt-list">
                <div v-for="(ver, i) in sortedVersions" :key="ver.id" class="vt-item">
                  <div :class="['vt-dot', `vt-dot--${ver.status}`]"></div>
                  <div class="vt-body">
                    <div class="vt-header">
                      <span class="vt-version-tag">v{{ ver.versionTag }}</span>
                      <span :class="['vt-status-badge', `vt-status--${ver.status}`]">
                        {{ versionStatusLabel(ver.status) }}
                      </span>
                      <span class="vt-date">{{ formatDate(ver.createdAt) }}</span>
                    </div>
                    <div v-if="ver.updateNote" class="vt-note">{{ ver.updateNote }}</div>
                    <div class="vt-actions">
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

            <!-- 危險操作 -->
            <div v-if="skill.type === 'extension'" class="drawer-danger-zone">
              <div class="danger-zone-label">危險操作</div>
              <button
                class="custom-btn btn--danger-ghost drawer-delete-btn"
                @click="showConfirm = true"
              >
                <i class="material-symbols-outlined">delete</i>刪除此技能
              </button>
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
import { ref, computed } from 'vue'
import type { Skill, SkillVersionStatus, OperationRecord } from '@/stores/skillStore'
import SkillVersionCompareModal from '@/components/Skill/SkillVersionCompareModal.vue'

const CHART_LABELS = ['6天前', '5天前', '4天前', '3天前', '2天前', '昨天', '今天']

const props = defineProps<{
  skill: Skill | null
  upstreamVersion?: string
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
}>()

const showConfirm = ref(false)
const showCompare = ref(false)
const compareV1Id = ref('')
const compareV2Id = ref('')

const iconName = computed(() =>
  props.skill?.type === 'extension' ? 'extension' : 'psychology'
)

const rateIconClass = computed(() => {
  const r = props.skill?.testPassRate ?? 0
  return r >= 0.9 ? 'dm-icon--good' : r >= 0.75 ? 'dm-icon--warn' : 'dm-icon--bad'
})

const rateNumClass = computed(() => {
  const r = props.skill?.testPassRate ?? 0
  return r >= 0.9 ? 'dm-num--good' : r >= 0.75 ? 'dm-num--warn' : 'dm-num--bad'
})

const sortedVersions = computed(() => {
  if (!props.skill?.versions) return []
  return [...props.skill.versions].reverse()
})

const originLabel = computed(() => {
  if (!props.skill) return ''
  if (props.skill.origin === 'custom_version') return '自訂版本'
  if (props.skill.origin === 'manually_created') return '手動建立'
  return '擴充'
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
    draft: '草稿', reviewing: '審核中', active: '生效中', history: '歷史', rejected: '已退回',
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
