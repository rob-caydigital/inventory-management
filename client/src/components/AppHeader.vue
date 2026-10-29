<template>
  <header class="app-header">
    <div class="header-title-group">
      <button
        type="button"
        class="hamburger"
        :aria-label="mobileOpen ? closeLabel : openLabel"
        :aria-expanded="mobileOpen"
        aria-controls="app-sidebar"
        @click="openMobile"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
        </svg>
      </button>
      <h1 class="header-title">{{ title }}</h1>
    </div>
    <div class="header-controls">
      <slot></slot>
    </div>
  </header>
</template>

<script>
import { useSidebar } from '../composables/useSidebar'

export default {
  name: 'AppHeader',
  props: {
    title: { type: String, default: '' },
    openLabel: { type: String, default: 'Open menu' },
    closeLabel: { type: String, default: 'Close menu' }
  },
  setup() {
    const { mobileOpen, openMobile } = useSidebar()
    return { mobileOpen, openMobile }
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-6);
  min-height: var(--header-height);
  padding: var(--space-2) var(--page-gutter);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
}

.header-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.header-controls {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.hamburger {
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

.hamburger:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

/* Breakpoints mirror useSidebar.js: hamburger only below 640 (phone) */
@media (max-width: 1023px) {
  .header-controls {
    flex-basis: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 639px) {
  .hamburger {
    display: grid;
  }
}
</style>
