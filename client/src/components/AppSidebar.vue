<template>
  <div v-if="overlayOpen" class="sidebar-overlay" @click="closeOverlay"></div>

  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ 'is-collapsed': isRail, 'is-mobile-open': mobileOpen, 'is-tablet-open': tabletOpen }"
  >
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">{{ brandInitial }}</span>
      <span class="brand-text sidebar-label">
        <span class="brand-name">{{ brandName }}</span>
        <span class="brand-subtitle">{{ brandSubtitle }}</span>
      </span>
    </div>

    <nav class="sidebar-nav" :aria-label="navLabel">
      <template v-for="section in sections" :key="section.id">
        <div class="sidebar-section-label sidebar-label">{{ section.label }}</div>
        <router-link
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'is-active': isActive(item) }"
          :aria-label="item.label"
          :title="isRail ? item.label : undefined"
        >
          <span class="nav-icon" aria-hidden="true" v-html="item.icon"></span>
          <span class="nav-label sidebar-label">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div class="sidebar-footer">
      <slot name="footer"></slot>
      <button
        type="button"
        class="collapse-toggle"
        :aria-label="expanded ? collapseLabel : expandLabel"
        :title="expanded ? collapseLabel : expandLabel"
        :aria-expanded="expanded"
        aria-controls="app-sidebar"
        @click="toggleSidebar"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          :style="{ transform: isRail ? 'rotate(180deg)' : 'none' }"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'

export default {
  name: 'AppSidebar',
  props: {
    brandName: { type: String, required: true },
    brandSubtitle: { type: String, default: '' },
    navLabel: { type: String, default: 'Main' },
    collapseLabel: { type: String, default: 'Collapse sidebar' },
    expandLabel: { type: String, default: 'Expand sidebar' },
    // [{ id, label, items: [{ to, label, icon }] }]
    sections: { type: Array, required: true }
  },
  setup(props) {
    const route = useRoute()
    const { mobileOpen, tabletOpen, isRail, expanded, overlayOpen, toggleSidebar, closeOverlay } = useSidebar()

    const brandInitial = computed(() => props.brandName.charAt(0).toUpperCase())

    const isActive = (item) =>
      item.to === '/'
        ? route.path === '/'
        : route.path === item.to || route.path.startsWith(item.to + '/')

    watch(() => route.fullPath, closeOverlay)

    const onKey = (e) => {
      if (e.key === 'Escape') closeOverlay()
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

    return {
      mobileOpen,
      tabletOpen,
      isRail,
      expanded,
      overlayOpen,
      toggleSidebar,
      closeOverlay,
      brandInitial,
      isActive
    }
  }
}
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
}

.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--sidebar-border);
  flex: none;
}

.brand-mark {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  background: var(--color-accent);
  color: #fff;
  font-weight: var(--font-semibold);
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.brand-name {
  color: var(--sidebar-text-active);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle {
  color: var(--sidebar-section-label);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-section-label {
  margin: var(--space-4) var(--space-3) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sidebar-section-label);
  white-space: nowrap;
}

.sidebar-section-label:first-child {
  margin-top: var(--space-2);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--sidebar-text);
  text-decoration: none;
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--sidebar-bg-hover);
  color: var(--sidebar-text-active);
}

.nav-item.is-active {
  background: var(--sidebar-bg-active);
  color: var(--sidebar-text-active);
}

.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-3));
  top: var(--space-2);
  bottom: var(--space-2);
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}

.nav-item.is-active .nav-icon {
  color: var(--color-accent);
}

.nav-item:focus-visible,
.collapse-toggle:focus-visible {
  outline-color: var(--color-accent);
}

.nav-icon {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
}

.sidebar-footer {
  /* overflow stays visible so upward dropdowns are not clipped */
  position: relative;
  flex: none;
  padding: var(--space-3);
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.collapse-toggle {
  align-self: flex-end;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
}

.collapse-toggle:hover {
  background: var(--sidebar-bg-hover);
  color: var(--sidebar-text-active);
}

.sidebar-overlay {
  display: none;
}

/* Breakpoints mirror useSidebar.js: phone < 640, tablet 640-1023, desktop >= 1024 */
@media (min-width: 640px) {
  /* Icon rail (desktop collapsed, or tablet not expanded) */
  .sidebar.is-collapsed .sidebar-label {
    display: none;
  }

  .sidebar.is-collapsed .sidebar-brand,
  .sidebar.is-collapsed .nav-item {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar.is-collapsed .nav-item.is-active::before {
    left: calc(-1 * var(--space-3));
  }

  .sidebar.is-collapsed .collapse-toggle {
    align-self: center;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  /* Expanded tablet sidebar floats over the content (main offset stays 64px) */
  .sidebar.is-tablet-open {
    box-shadow: var(--shadow-lg);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 39;
    background: var(--color-overlay);
  }
}

@media (max-width: 639px) {
  .sidebar,
  .sidebar.is-collapsed {
    width: var(--sidebar-width);
    transform: translateX(-100%);
    visibility: hidden;
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
    visibility: visible;
    box-shadow: var(--shadow-lg);
  }

  .collapse-toggle {
    display: none;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 39;
    background: rgba(15, 23, 42, 0.5);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sidebar {
    transition: width var(--transition-fast), transform var(--transition-fast), visibility var(--transition-fast);
  }

  .nav-item,
  .collapse-toggle {
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }
}
</style>
