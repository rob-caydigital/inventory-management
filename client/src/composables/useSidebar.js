import { ref, computed, watch, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

// Single source of truth for the JS side. CSS media queries cannot read these,
// so AppSidebar.vue, AppHeader.vue, App.vue, ProfileMenu.vue and
// LanguageSwitcher.vue mirror them literally:
//   phone   : max-width 639px
//   tablet  : min-width 640px and max-width 1023px
//   desktop : min-width 1024px
export const BREAKPOINT_TABLET = 640
export const BREAKPOINT_DESKTOP = 1024

const PHONE_QUERY = `(max-width: ${BREAKPOINT_TABLET - 1}px)`
const DESKTOP_QUERY = `(min-width: ${BREAKPOINT_DESKTOP}px)`

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'

function readTier() {
  if (!hasMatchMedia) return 'desktop'
  if (window.matchMedia(PHONE_QUERY).matches) return 'phone'
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop'
  return 'tablet'
}

const collapsed = ref(readCollapsed()) // desktop icon rail (persisted)
const mobileOpen = ref(false) // phone drawer (transient)
const tabletOpen = ref(false) // tablet expanded overlay (transient, never persisted)
const tier = ref(readTier()) // 'phone' | 'tablet' | 'desktop'

watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable
  }
})

// Never leave a stuck overlay or backdrop after crossing a breakpoint
watch(tier, () => {
  mobileOpen.value = false
  tabletOpen.value = false
})

// Shared media-query listeners, reference counted across consumers
let listenerCount = 0
let mqls = []
const onChange = () => { tier.value = readTier() }

function startListening() {
  if (!hasMatchMedia) return
  if (listenerCount++ > 0) return
  mqls = [window.matchMedia(PHONE_QUERY), window.matchMedia(DESKTOP_QUERY)]
  mqls.forEach((mql) => {
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange)
  })
  onChange() // sync in case it changed between module load and mount
}

function stopListening() {
  if (!hasMatchMedia || listenerCount === 0) return
  if (--listenerCount > 0) return
  mqls.forEach((mql) => {
    if (mql.removeEventListener) mql.removeEventListener('change', onChange)
    else mql.removeListener(onChange)
  })
  mqls = []
}

// Whether the sidebar is currently drawn as the 64px icon rail
const isRail = computed(() => {
  if (tier.value === 'desktop') return collapsed.value
  if (tier.value === 'tablet') return !tabletOpen.value
  return false
})

// Whether the full-width sidebar is currently shown as an overlay with a backdrop
const overlayOpen = computed(() => {
  if (tier.value === 'phone') return mobileOpen.value
  if (tier.value === 'tablet') return tabletOpen.value
  return false
})

// Expanded state for the toggle's aria-expanded
const expanded = computed(() => !isRail.value)

export function useSidebar() {
  if (getCurrentInstance()) {
    onMounted(startListening)
    onBeforeUnmount(stopListening)
  }

  return {
    collapsed,
    mobileOpen,
    tabletOpen,
    tier,
    isRail,
    expanded,
    overlayOpen,
    toggleCollapsed: () => { collapsed.value = !collapsed.value },
    // Desktop toggles the persisted preference; tablet toggles the transient overlay only
    toggleSidebar: () => {
      if (tier.value === 'tablet') tabletOpen.value = !tabletOpen.value
      else if (tier.value === 'desktop') collapsed.value = !collapsed.value
    },
    openMobile: () => { mobileOpen.value = true },
    closeMobile: () => { mobileOpen.value = false },
    closeOverlay: () => {
      mobileOpen.value = false
      tabletOpen.value = false
    }
  }
}
