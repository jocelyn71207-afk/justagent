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
          <div>
            <div class="skill-stat-num">{{ store.enabledCount }}</div>
            <div class="skill-stat-lbl">啟用中技能</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--ext">
            <i class="material-symbols-outlined">extension</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.extensionCount }}</div>
            <div class="skill-stat-lbl">企業擴充</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--usage">
            <i class="material-symbols-outlined">bolt</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.totalUsageCount }}</div>
            <div class="skill-stat-lbl">本月自動觸發</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--pass">
            <i class="material-symbols-outlined">verified</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.avgTestPassRate }}%</div>
            <div class="skill-stat-lbl">測試通過率</div>
          </div>
        </div>
      </div>

      <!-- 上游更新 Banner -->
      <div v-if="store.firstPendingUpdate" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.firstPendingUpdate.name }}</strong> 的上游有新版本可合併
        </span>
        <button class="custom-btn" @click="upstreamSkill = store.firstPendingUpdate">查看</button>
      </div>

      <!-- 技能清單 -->
      <div class="skill-list-header">
        <h2>技能清單</h2>
        <button class="custom-btn" disabled title="後續規劃">
          <i class="material-symbols-outlined">add</i>建立
        </button>
      </div>

      <div class="skill-tree">
        <!-- System Skills（含其下的 Extension） -->
        <template v-for="skill in systemSkills" :key="skill.id">
          <div class="skill-group">
            <SkillCard
              :skill="skill"
              @click="detailSkill = $event"
              @test="handleTest"
              @toggle="store.toggleSkill($event.id)"
              @update="upstreamSkill = $event"
            />
            <template v-if="skill.children">
              <SkillCard
                v-for="child in skill.children"
                :key="child.id"
                :skill="child"
                :is-extension="true"
                @click="detailSkill = $event"
                @test="handleTest"
                @toggle="store.toggleSkill($event.id)"
                @update="upstreamSkill = $event"
              />
            </template>
          </div>
        </template>

        <!-- 獨立 Extension（頂層、無父系統技能） -->
        <SkillCard
          v-for="skill in standaloneExtensions"
          :key="skill.id"
          :skill="skill"
          :is-extension="true"
          @click="detailSkill = $event"
          @test="handleTest"
          @toggle="store.toggleSkill($event.id)"
          @update="upstreamSkill = $event"
        />
      </div>

    </div>

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="store.toggleSkill($event.id)"
    />
    <UpstreamUpdateDrawer
      :skill="upstreamSkill"
      @close="upstreamSkill = null"
      @merge="(s) => { store.mergeUpstreamUpdate(s.id); upstreamSkill = null }"
      @ignore="(s) => { store.ignoreUpstreamUpdate(s.id); upstreamSkill = null }"
      @detach="(s) => { store.detachUpstream(s.id); upstreamSkill = null }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const upstreamSkill = ref<Skill | null>(null)

// store.skills 是頂層陣列，system skill 的 extension 子項放在 children 內
// 頂層中 type === 'extension' 的即為獨立 extension（無父系統技能）
const systemSkills = computed(() => store.skills.filter(s => s.type === 'system'))
const standaloneExtensions = computed(() => store.skills.filter(s => s.type === 'extension'))

function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}
</script>
