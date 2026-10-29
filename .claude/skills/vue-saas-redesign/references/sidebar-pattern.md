# Sidebar pattern

This is a reference implementation of the sidebar plus the app shell. It is written with `<script setup>` for brevity. If the app uses `export default { setup() }` or the Options API, convert it and keep the same behaviour. Keep the app's i18n calls and nav destinations. Everything else here is a starting point, not a template to paste.

## Contents
1. State: collapse and mobile drawer
2. AppSidebar.vue
3. Shell layout in App.vue
4. Gotchas

## 1. State: collapse and mobile drawer

The sidebar, the header's hamburger button and the shell all need the same state. A tiny module-level composable is the lightest way to share it, the same singleton pattern many apps already use for filters:

```js
// composables/useSidebar.js
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

function readCollapsed() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

const collapsed = ref(readCollapsed())   // desktop icon rail
const mobileOpen = ref(false)            // mobile drawer

watch(collapsed, (v) => {
  try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* storage unavailable */ }
})

export function useSidebar() {
  return {
    collapsed,
    mobileOpen,
    toggleCollapsed: () => { collapsed.value = !collapsed.value },
    openMobile: () => { mobileOpen.value = true },
    closeMobile: () => { mobileOpen.value = false }
  }
}
```

## 2. AppSidebar.vue

```vue
<template>
  <!-- Overlay only renders on mobile while the drawer is open -->
  <div v-if="mobileOpen" class="sidebar-overlay" @click="closeMobile" />

  <aside
    class="sidebar"
    :class="{ 'is-collapsed': collapsed, 'is-mobile-open': mobileOpen }"
  >
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">{{ brandInitial }}</span>
      <span class="brand-name sidebar-label">{{ brandName }}</span>
    </div>

    <nav class="sidebar-nav" aria-label="Main">
      <template v-for="section in sections" :key="section.id">
        <div v-if="section.label" class="sidebar-section-label sidebar-label">{{ section.label }}</div>
        <router-link
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'is-active': isActive(item) }"
          :title="collapsed ? item.label : undefined"
        >
          <span class="nav-icon" aria-hidden="true" v-html="item.icon" />
          <span class="nav-label sidebar-label">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div class="sidebar-footer">
      <!-- Move the app's existing account utilities here (profile menu, language switcher).
           Their dropdowns must open upward; see Gotchas. -->
      <slot name="footer" />
      <button
        type="button"
        class="collapse-toggle"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
             :style="{ transform: collapsed ? 'rotate(180deg)' : 'none' }" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'

const props = defineProps({
  brandName: { type: String, required: true },
  // [{ id, label?, items: [{ to, label, icon (svg string), exact? }] }]
  sections: { type: Array, required: true }
})

const route = useRoute()
const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar()
const brandInitial = computed(() => props.brandName.charAt(0).toUpperCase())

// "/" must match exactly, or it would be active on every page.
// Other items are active on their own path and any child path.
const isActive = (item) =>
  item.to === '/' || item.exact
    ? route.path === item.to
    : route.path === item.to || route.path.startsWith(item.to + '/')

// Close the mobile drawer whenever navigation happens
watch(() => route.fullPath, closeMobile)

const onKey = (e) => { if (e.key === 'Escape') closeMobile() }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  border-right: 1px solid var(--sidebar-border);
  transition: width var(--transition-fast), transform var(--transition-fast);
}
.sidebar.is-collapsed { width: var(--sidebar-width-collapsed); }

.sidebar-brand {
  display: flex; align-items: center; gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--sidebar-border);
}
.brand-mark {
  flex: none; width: 32px; height: 32px; border-radius: var(--radius-md);
  display: grid; place-items: center;
  background: var(--color-accent); color: #fff; font-weight: var(--font-semibold);
}
.brand-name { color: var(--sidebar-text-active); font-weight: var(--font-semibold); white-space: nowrap; }

.sidebar-nav { flex: 1; overflow-y: auto; padding: var(--space-3); display: flex; flex-direction: column; gap: 2px; }
.sidebar-section-label {
  margin: var(--space-4) var(--space-3) var(--space-2);
  font-size: 11px; font-weight: var(--font-semibold); letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--sidebar-section-label);
}

.nav-item {
  position: relative;
  display: flex; align-items: center; gap: var(--space-3);
  height: 38px; padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--sidebar-text); text-decoration: none; font-weight: var(--font-medium);
  white-space: nowrap;
}
.nav-item:hover { background: var(--sidebar-bg-hover); color: var(--sidebar-text-active); }
.nav-item.is-active { background: var(--sidebar-bg-active); color: var(--sidebar-text-active); }
.nav-item.is-active::before {
  content: ""; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 3px;
  border-radius: 0 3px 3px 0; background: var(--color-accent);
}
.nav-icon { flex: none; width: 20px; height: 20px; display: grid; place-items: center; }

/* Collapse hides labels without reflowing the row height */
.sidebar-label { transition: opacity var(--transition-fast); }
.is-collapsed .sidebar-label { opacity: 0; width: 0; overflow: hidden; pointer-events: none; }
.is-collapsed .sidebar-section-label { display: none; }

.sidebar-footer {
  /* overflow stays visible here so upward dropdowns are not clipped */
  position: relative;
  padding: var(--space-3);
  border-top: 1px solid var(--sidebar-border);
  display: flex; flex-direction: column; gap: var(--space-2);
}
.collapse-toggle {
  align-self: flex-end;
  display: grid; place-items: center; width: 32px; height: 32px;
  border: 0; border-radius: var(--radius-md); background: transparent; color: var(--sidebar-text); cursor: pointer;
}
.collapse-toggle:hover { background: var(--sidebar-bg-hover); color: var(--sidebar-text-active); }

.sidebar-overlay { display: none; }

@media (max-width: 1023px) {
  .sidebar, .sidebar.is-collapsed { width: var(--sidebar-width); transform: translateX(-100%); }
  .sidebar.is-mobile-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  /* The drawer is always expanded */
  .is-collapsed .sidebar-label { opacity: 1; width: auto; pointer-events: auto; }
  .collapse-toggle { display: none; }
  .sidebar-overlay { display: block; position: fixed; inset: 0; z-index: 39; background: rgba(15, 23, 42, 0.5); }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar-label { transition: none; }
}
</style>
```

## 3. Shell layout in App.vue

```vue
<div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
  <AppSidebar :brand-name="t('nav.companyName')" :sections="navSections">
    <template #footer>
      <LanguageSwitcher />  <!-- existing components, moved -->
      <ProfileMenu ... />
    </template>
  </AppSidebar>
  <div class="app-main">
    <AppHeader />          <!-- hamburger (mobile) · page title · global filters -->
    <main class="app-content"><router-view /></main>
  </div>
</div>
```

```css
.app-main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  min-width: 0;            /* lets wide tables scroll inside cards instead of stretching the page */
  transition: margin-left var(--transition-fast);
}
.sidebar-collapsed .app-main { margin-left: var(--sidebar-width-collapsed); }
.app-content { padding: var(--space-6) var(--page-gutter) var(--space-12); }

@media (max-width: 1023px) {
  .app-main, .sidebar-collapsed .app-main { margin-left: 0; }
}
```

`navSections` is a `computed` that returns labels through the app's i18n function, so switching language updates the sidebar.

The header holds:
- a hamburger button, shown only below 1024px, that calls `openMobile()` and has `aria-label` and `aria-expanded`
- the page title
- the global controls

Make it `position: sticky; top: 0; z-index: 30` with a surface background and a bottom border.

## 4. Gotchas

- **Footer dropdowns clipped or off-screen.**
  - Existing profile and language menus were built to drop *down* from a top bar. In the sidebar footer they must open *up*: `bottom: calc(100% + 8px); top: auto`.
  - In the collapsed rail they must open to the *right*: `left: calc(100% + 8px); bottom: 0`.
  - Make sure no ancestor has `overflow: hidden`.
  - Check the dropdown's own width fits.
  - Restyle the trigger for a dark background (light text, compact layout; in the collapsed rail, avatar only).
- **Styling child components for the collapsed rail.** In a scoped style, write `.sidebar.is-collapsed .profile-name { display: none }` as a plain descendant selector. Vue only adds the scope attribute to the last part of the selector, so this works from inside the child component. Do not wrap it as `:global(.sidebar.is-collapsed) .profile-name`: Vue compiles that to a bare `.sidebar.is-collapsed` rule. The labels then never hide and spill out of the rail, and the declarations land on the sidebar itself.
- **The `/` route active everywhere.** Use exact matching for the root route, as `isActive` does above.
- **Modals behind the sidebar.** Modal overlays need a z-index above the sidebar (40) and overlay (39). Use 50 or more.
- **Duplicate page titles.** If views render their own page header, don't also put a big title in the app header.
- **Fixed-position leftovers.** Remove the old nav's styles, any `padding-top` or `margin-top` that compensated for a fixed top bar, and old `max-width: 1400px` centered containers that now leave odd gaps beside the sidebar.
- **Filter bars.** A filter bar that used to span full width under the top nav should become part of the sticky header, or a compact toolbar. Let it wrap on narrow screens.
