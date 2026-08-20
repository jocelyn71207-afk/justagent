import { ref, computed, watch, effectScope } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'

export type BreadcrumbItem = {
  label: string
  to?: RouteLocationRaw
}

const _dynamicLabel = ref<string | null>(null)
// Detached scope ensures the route watcher survives component unmounts
const _scope = effectScope(true)
let _watchInstalled = false

export function useBreadcrumb() {
  const route = useRoute()
  const router = useRouter()
  const rootStore = useRootStore()

  if (!_watchInstalled) {
    _scope.run(() => {
      watch(
        () => route.fullPath,
        () => { _dynamicLabel.value = null }
      )
    })
    _watchInstalled = true
  }

  const items = computed<BreadcrumbItem[]>(() => {
    const result: BreadcrumbItem[] = []
    // vue-tsc/@vue/language-core mis-resolves RouteMeta's augmented fields (src/router/index.ts)
    // to `{}` when accessed via useRoute()/router.getRoutes() from a plain .ts composable —
    // plain `tsc` type-checks this correctly, confirming it's a checker bug, not a type error.
    // The explicit annotation sidesteps the buggy inference path without changing behavior.
    const { title, parentName, useCompanyName } = route.meta as {
      title?: string
      parentName?: string
      useCompanyName?: boolean
    }

    if (useCompanyName) {
      result.push({ label: rootStore.nowMenuTreeCompanyName })
    }

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

    if (parentName) {
      // Same vue-tsc inference bug as above, applied at this second RouteMeta access point.
      const parentMeta = router.getRoutes().find(r => r.name === parentName)?.meta as { title?: string } | undefined
      result.push({
        label: parentMeta?.title ?? parentName,
        to: {
          name: parentName,
          query: route.query.teamId
            ? { teamId: route.query.teamId, teamName: route.query.teamName }
            : undefined,
        },
      })
    }

    result.push({
      label: _dynamicLabel.value ?? title ?? (route.name as string),
    })

    return result
  })

  function setDynamic(label: string) {
    _dynamicLabel.value = label
  }

  return { items, setDynamic }
}
