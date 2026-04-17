# 麵包屑統一邏輯 Design Spec
*Version 1.0 · 2026-04-17*

> **目標**：將分散在各頁面的麵包屑文字統一成一個可重用元件（`<AppBreadcrumb>`）與一個 composable（`useBreadcrumb`）。資料來源集中在 router meta + rootStore，頁面僅需在有動態標題時呼叫一行 `setDynamic()`。

---

## 1. 範圍

以下頁面納入本次統一：

| Route Name | 目前模式 | 目標麵包屑輸出 |
|------------|---------|--------------|
| `ProjectDashboard` | `.banner-crumb` 靜態 | 最近使用 |
| `TeamProject` | `.banner-crumb` + query.teamName | Teva電子商務 / 團隊專案 |
| `KnowledgeBase` | `.banner-crumb` + query.teamName | Teva電子商務 / 知識庫管理 |
| `KnowledgeDetail` | `.views-page-header` 返回按鈕 | Teva電子商務 / 知識庫管理 / [文章標題] |
| `KnowledgeEditor` | `.views-page-header` 返回按鈕 | Teva電子商務 / 知識庫管理 / [文章標題] |
| `TeamAccessManagement` | `.banner-crumb` + query.teamName | Teva電子商務 / 權限管理 |
| `ProjectTrashCans` | `.banner-crumb` + query.teamName | Teva電子商務 / 垃圾桶 |
| `ResourceLibrary` | `.banner-crumb` 靜態 | 共享資源庫 |
| `CompanyTeamSettings` | `.banner-crumb` 靜態 | [公司名稱] / 企業/團隊設定 |
| `Explore` | `.banner-crumb` 靜態 | 探索 |

**不在範圍內：**
- `AiViewer`（fullscreen，無 banner）
- `GUI`（特殊工具頁）
- `Login`、`AppEntrance`（非主應用頁面）

---

## 2. Router Meta 變更

在 `src/router/index.ts` 的每個子路由加上 `meta` 欄位：

```typescript
// 子路由列表（全在 /view 下）
{ path: '/view/ProjectDashboard', name: 'ProjectDashboard',
  meta: { title: '最近使用' } }

{ path: '/view/TeamProject', name: 'TeamProject',
  meta: { title: '團隊專案' } }

{ path: '/view/KnowledgeBase', name: 'KnowledgeBase',
  meta: { title: '知識庫管理' } }

{ path: '/view/KnowledgeDetail/:id', name: 'KnowledgeDetail',
  meta: { title: '知識庫', parentName: 'KnowledgeBase' } }
  // title 為 fallback；頁面 API 回來後用 setDynamic() 覆蓋為真實文章標題

{ path: '/view/KnowledgeEditor/:knowledgeId/:versionId', name: 'KnowledgeEditor',
  meta: { title: '編輯器', parentName: 'KnowledgeBase' } }
  // 同上，setDynamic() 覆蓋為知識庫名稱

{ path: '/view/TeamAccessManagement', name: 'TeamAccessManagement',
  meta: { title: '權限管理' } }

{ path: '/view/ProjectTrashCans', name: 'ProjectTrashCans',
  meta: { title: '垃圾桶' } }

{ path: '/view/ResourceLibrary', name: 'ResourceLibrary',
  meta: { title: '共享資源庫' } }

{ path: '/view/CompanyTeamSettings', name: 'CompanyTeamSettings',
  meta: { title: '企業/團隊設定', useCompanyName: true } }

{ path: '/view/Explore', name: 'Explore',
  meta: { title: '探索' } }
```

**Meta 欄位說明：**

| 欄位 | 型別 | 說明 |
|------|------|------|
| `title` | `string` | 靜態麵包屑標籤，必填 |
| `parentName` | `string?` | 父層 route name，用於深層頁面（KnowledgeDetail 等）|
| `useCompanyName` | `boolean?` | true 時在麵包屑第一層插入 rootStore 的公司名稱 |

---

## 3. TypeScript 型別擴充

在 `src/router/index.ts` 頂部加上 Vue Router meta 型別擴充：

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    parentName?: string
    useCompanyName?: boolean
    hideMenuTree?: boolean
  }
}
```

---

## 4. rootStore 變更

在 `src/stores/rootStore.ts` 新增公司名稱狀態：

```typescript
const nowMenuTreeCompanyName = ref<string>('Teva') // 預設選第一個公司
```

並在 `return` 中暴露：
```typescript
return {
  // ... 現有欄位
  nowMenuTreeCompanyName,
}
```

---

## 5. AppMenuTree 元件變更

**檔案：** `src/components/AppMenuTree.vue`

**變更 1：** select 選項改為真實公司名稱，加上 `v-model`：

```vue
<!-- 之前 -->
<select class="custom-select w-100">
  <option value="企業A">企業A</option>
  <option value="企業B">企業B</option>
</select>

<!-- 之後 -->
<select class="custom-select w-100" v-model="rootStore.nowMenuTreeCompanyName">
  <option value="Teva">Teva</option>
  <option value="UGG">UGG</option>
</select>
```

**變更 2：** 確認 `rootStore` 已正確 import（現有程式碼通常已有）。

---

## 6. useBreadcrumb Composable

**建立：** `src/composables/useBreadcrumb.ts`

```typescript
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'

export type BreadcrumbItem = {
  label: string
  to?: RouteLocationRaw
}

// Module-level 共享狀態：跨元件可見，路由切換自動清空
const _dynamicLabel = ref<string | null>(null)

export function useBreadcrumb() {
  const route = useRoute()
  const rootStore = useRootStore()

  // 路由切換時自動清除動態 label
  watch(
    () => route.fullPath,
    () => { _dynamicLabel.value = null }
  )

  const items = computed<BreadcrumbItem[]>(() => {
    const result: BreadcrumbItem[] = []
    const { title, parentName, useCompanyName } = route.meta

    // Step 1：useCompanyName → 插入目前公司名稱
    if (useCompanyName) {
      result.push({ label: rootStore.nowMenuTreeCompanyName })
    }

    // Step 2：有 query.teamName → 插入團隊名稱（可點擊，導回 TeamProject）
    if (route.query.teamName) {
      result.push({
        label: route.query.teamName as string,
        to: {
          name: 'TeamProject',
          query: {
            teamId: route.query.teamId,
            teamName: route.query.teamName,
          },
        },
      })
    }

    // Step 3：有 parentName → 插入父層頁面（可點擊）
    if (parentName) {
      // 從 router.getRoutes() 找同層路由的 meta.title
      const parentMeta = router.getRoutes().find(r => r.name === parentName)?.meta
      result.push({
        label: parentMeta?.title ?? parentName,
        to: {
          name: parentName,
          // 若有 teamId/teamName 也帶過去，讓父層頁面顯示正確麵包屑
          query: route.query.teamId
            ? { teamId: route.query.teamId, teamName: route.query.teamName }
            : undefined,
        },
      })
    }

    // Step 4：當前頁面（動態 label 優先，fallback 到 meta.title）
    result.push({
      label: _dynamicLabel.value ?? title ?? (route.name as string),
    })

    return result
  })

  /**
   * 頁面在 API 回來後呼叫，覆蓋最後一層麵包屑標籤。
   * 路由切換時自動清空，不需手動 reset。
   */
  function setDynamic(label: string) {
    _dynamicLabel.value = label
  }

  return { items, setDynamic }
}
```

**麵包屑建構邏輯（優先順序）：**

```
[useCompanyName → 公司名] → [teamName → 團隊] → [parentName → 父頁] → [當前頁 title / dynamicLabel]
```

單一層時（如 ProjectDashboard），只顯示 `[當前頁 title]`，不顯示分隔符。

---

## 7. AppBreadcrumb 元件

**建立：** `src/components/AppBreadcrumb.vue`

```vue
<template>
  <div class="banner-crumb" v-if="visibleItems.length">
    <template v-for="(item, i) in visibleItems" :key="i">
      <RouterLink v-if="item.to" :to="item.to" class="crumb-link">
        {{ item.label }}
      </RouterLink>
      <span v-else class="crumb-current">{{ item.label }}</span>
      <span v-if="i < visibleItems.length - 1" class="crumb-sep"> / </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'

const { items } = useBreadcrumb()

// 只顯示前段（非當前頁）：若只有 1 層，不顯示（避免重複顯示標題）
const visibleItems = computed(() =>
  items.value.length > 1 ? items.value : []
)
</script>
```

> **說明：** 只有 1 層（如 Explore、ProjectDashboard）時，麵包屑不顯示，因為標題本身已夠清楚。多層時才顯示完整路徑，最後一層無連結（當前頁）。

**SCSS（沿用既有 `.banner-crumb` 樣式，加上連結樣式）：**

在 `src/scss/_layout.scss` 現有 `.banner-crumb` 區塊下補上：

```scss
.banner-crumb {
  // ... 既有樣式不動

  .crumb-link {
    color: inherit;
    text-decoration: none;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
  .crumb-current {
    opacity: 1;
  }
  .crumb-sep {
    opacity: 0.4;
    margin: 0 2px;
  }
}
```

---

## 8. 各頁面修改

### 通用模式（大多數頁面）

**移除**頁面內的手動 `.banner-crumb` HTML，**換成** `<AppBreadcrumb />`：

```vue
<!-- 之前 -->
<div class="banner-crumb">{{ teamName }} / 垃圾桶</div>
<div class="banner-title">專案垃圾桶</div>

<!-- 之後 -->
<AppBreadcrumb />
<div class="banner-title">專案垃圾桶</div>
```

受影響的頁面（移除手動 banner-crumb，換元件）：
- `KnowledgeBase.vue`
- `TeamAccessManagement.vue`
- `ProjectTrashCans.vue`
- `ResourceLibrary.vue`
- `CompanyTeamSettings.vue`
- `Explore.vue`（如有）
- `TeamProject.vue`（透過 ProjectListContent 的 `.plc-banner-breadcrumb` 一併處理）

### ProjectListContent 元件

`ProjectListContent.vue` 目前有 `.plc-banner-breadcrumb`，需改為使用 `<AppBreadcrumb />`，並移除 `plc-banner-breadcrumb` class 及相關 SCSS。

### KnowledgeDetail.vue / KnowledgeEditor.vue（返回按鈕 → 麵包屑）

移除 `.views-page-header` 的返回按鈕 HTML，改用 `.page-banner` + `<AppBreadcrumb>`，並在 API 回來後呼叫 `setDynamic()`：

```vue
<div class="page-banner">
  <AppBreadcrumb />
  <div class="banner-title">{{ knowledge.title }}</div>
</div>

<script setup lang="ts">
import { useBreadcrumb } from '@/composables/useBreadcrumb'
const { setDynamic } = useBreadcrumb()

// 在 watch 或 onMounted 中 API 回來後：
watch(knowledge, (val) => {
  if (val?.title) setDynamic(val.title)
}, { immediate: true })
</script>
```

---

## 9. 不應更動的項目

| 項目 | 原因 |
|------|------|
| `.banner-crumb` 的核心 SCSS 樣式 | 元件沿用此 class，視覺不變 |
| `testGroups` store 資料 | 不在本次範圍 |
| `AiViewer`、`GUI` 頁面 | 無 banner 區域 |
| router beforeEach guard | 只處理 search 狀態，不影響麵包屑 |

---

## 10. 注意事項

1. **KnowledgeDetail / KnowledgeEditor 的 `route.query.teamId` / `teamName`**：需確認這兩個頁面導航時有帶 teamId/teamName 在 query，讓 parentName 父層連結也能正確保留團隊脈絡。若目前沒有帶，實作時需在所有跳轉至 KnowledgeDetail/Editor 的 `router.push` 補上 `query: { teamId, teamName }`。若確認無法取得 teamId/teamName（如從全域搜尋直接開啟），則父層連結省略 query，只導回 KnowledgeBase 首頁。

2. **`_dynamicLabel` module-level ref**：在同一 session 切換路由時自動清空（由 `watch(route.fullPath)` 觸發），無需手動 reset。

3. **單一層不顯示**：`visibleItems` 在 items 只有 1 項時回傳空陣列，元件不渲染。避免 Explore、ProjectDashboard 等頁面出現多餘的麵包屑列。
