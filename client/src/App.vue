<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <AppSidebar
      :brand-name="t('nav.companyName')"
      :brand-subtitle="t('nav.subtitle')"
      :sections="navSections"
      :nav-label="t('nav.mainNavigation')"
      :collapse-label="t('nav.collapseSidebar')"
      :expand-label="t('nav.expandSidebar')"
    >
      <template #footer>
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </template>
    </AppSidebar>

    <div class="app-main">
      <AppHeader
        :title="pageTitle"
        :open-label="t('nav.openMenu')"
        :close-label="t('nav.closeMenu')"
      >
        <FilterBar />
      </AppHeader>
      <main class="app-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import { useSidebar } from './composables/useSidebar'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    AppSidebar,
    AppHeader
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const route = useRoute()
    const { collapsed } = useSidebar()

    // Stroke icons (24x24 viewBox, currentColor)
    const icon = (paths) =>
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

    const icons = {
      overview: icon('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
      inventory: icon('<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
      orders: icon('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
      demand: icon('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
      restocking: icon('<path d="M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4"/>'),
      finance: icon('<path d="M12 3v18M16 7.5C16 6 14.2 5 12 5S8 6 8 7.5 9.8 9.8 12 10.3s4 1.3 4 2.8-1.8 2.5-4 2.5-4-1-4-2.5"/>'),
      reports: icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')
    }

    const navSections = computed(() => [
      {
        id: 'operations',
        label: t('nav.groupOperations'),
        items: [
          { to: '/', label: t('nav.overview'), icon: icons.overview },
          { to: '/inventory', label: t('nav.inventory'), icon: icons.inventory },
          { to: '/orders', label: t('nav.orders'), icon: icons.orders }
        ]
      },
      {
        id: 'planning',
        label: t('nav.groupPlanning'),
        items: [
          { to: '/demand', label: t('nav.demandForecast'), icon: icons.demand },
          { to: '/restocking', label: t('nav.restocking'), icon: icons.restocking }
        ]
      },
      {
        id: 'finance',
        label: t('nav.groupFinance'),
        items: [
          { to: '/spending', label: t('nav.finance'), icon: icons.finance },
          { to: '/reports', label: t('nav.reports'), icon: icons.reports }
        ]
      }
    ])

    // Page title follows the active nav item
    const pageTitle = computed(() => {
      const items = navSections.value.flatMap(section => section.items)
      const match = items.find(item => item.to === route.path)
      return match ? match.label : t('nav.companyName')
    })
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      collapsed,
      navSections,
      pageTitle,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
/* ==========================================================================
   Design tokens
   ========================================================================== */
:root {
  /* Surfaces */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  /* Text */
  --color-text: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Sidebar */
  --sidebar-bg: #0f172a;
  --sidebar-bg-hover: #1e293b;
  --sidebar-bg-active: #1e293b;
  --sidebar-text: #94a3b8;
  --sidebar-text-active: #ffffff;
  --sidebar-section-label: #64748b;
  --sidebar-border: #1e293b;

  /* Accent */
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-accent-soft: #eff6ff;
  --color-accent-ring: rgba(59, 130, 246, 0.25);
  --color-on-accent: #ffffff;

  /* Status: solid, soft background, and readable text on soft */
  --color-success: #16a34a;
  --color-success-soft: #dcfce7;
  --color-success-strong: #166534;
  --color-info: #2563eb;
  --color-info-soft: #dbeafe;
  --color-info-strong: #1e40af;
  --color-warning: #ca8a04;
  --color-warning-soft: #fef9c3;
  --color-warning-strong: #854d0e;
  --color-danger: #dc2626;
  --color-danger-soft: #fee2e2;
  --color-danger-strong: #991b1b;

  /* Chart series (slate plus status colors; purple is a chart-only series) */
  --chart-blue: #3b82f6;
  --chart-green: #16a34a;
  --chart-yellow: #eab308;
  --chart-red: #dc2626;
  --chart-purple: #8b5cf6;
  --chart-slate: #0f172a;
  --chart-muted: #64748b;

  /* Overlay */
  --color-overlay: rgba(15, 23, 42, 0.5);

  /* Spacing: 4px scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Semantic spacing */
  --card-padding: var(--space-6);
  --card-header-padding: var(--space-4) var(--space-6);
  --gap-card: var(--space-6);
  --gap-section: var(--space-6);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 4px 6px -4px rgba(15, 23, 42, 0.1);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --header-height: 60px;
  --page-gutter: var(--space-8);
  --control-height: 36px;
  --transition-fast: 150ms ease;
}

@media (max-width: 1023px) {
  :root {
    --page-gutter: var(--space-4);
  }
}

/* ==========================================================================
   Base
   ========================================================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .card,
  .btn,
  .form-control,
  tbody tr,
  .badge {
    transition: background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast);
  }
}

/* ==========================================================================
   Shell
   ========================================================================== */
.app-shell {
  min-height: 100vh;
}

.app-main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  min-width: 0;
}

.sidebar-collapsed .app-main {
  margin-left: var(--sidebar-width-collapsed);
}

.app-content {
  padding: var(--space-6) var(--page-gutter) var(--space-12);
}

@media (prefers-reduced-motion: no-preference) {
  .app-main {
    transition: margin-left var(--transition-fast);
  }
}

/* Breakpoints mirror useSidebar.js. Tablet: always 64px rail offset (overlay never pushes). */
@media (min-width: 640px) and (max-width: 1023px) {
  .app-main,
  .sidebar-collapsed .app-main {
    margin-left: var(--sidebar-width-collapsed);
  }
}

@media (max-width: 639px) {
  .app-main,
  .sidebar-collapsed .app-main {
    margin-left: 0;
  }
}

/* ==========================================================================
   Page structure
   ========================================================================== */
.page {
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  min-width: 0;
}

.page-body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  min-width: 0;
}

.page-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

/* The app header shows the page title; views keep a visually hidden h2 for the document outline */
.page-header h2 {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.page-header p {
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: var(--gap-card);
}

.card-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap-card);
}

.card-grid-2 > .full-width {
  grid-column: 1 / -1;
}

@media (max-width: 1023px) {
  .card-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ==========================================================================
   Cards
   ========================================================================== */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  padding: var(--card-header-padding);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.card-body {
  padding: var(--card-padding);
}

/* ==========================================================================
   Stat / KPI cards (one look for every view and modal)
   ========================================================================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: var(--gap-card);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: 1.2;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.stat-meta {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.stat-meta.positive,
.stat-meta .positive {
  color: var(--color-success);
}

.stat-progress {
  width: 100%;
  height: 6px;
  margin-top: var(--space-2);
  background: var(--color-surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stat-progress-bar {
  height: 100%;
  background: var(--color-accent);
  border-radius: var(--radius-full);
}

.stat-progress-bar.success {
  background: var(--color-success);
}

.stat-card.success .stat-value,
.stat-card.success-card .stat-value {
  color: var(--color-success);
}

.stat-card.info .stat-value,
.stat-card.primary .stat-value,
.stat-card.total .stat-value {
  color: var(--color-info);
}

.stat-card.warning .stat-value,
.stat-card.warning-card .stat-value {
  color: var(--color-warning);
}

.stat-card.danger .stat-value,
.stat-card.danger-card .stat-value {
  color: var(--color-danger);
}

@media (prefers-reduced-motion: no-preference) {
  .stat-progress-bar {
    transition: width 0.4s ease;
  }
}

/* ==========================================================================
   Tables (live inside cards, scroll horizontally on narrow screens)
   ========================================================================== */
.table-container {
  overflow-x: auto;
  max-width: 100%;
}

.table-container > table {
  min-width: 720px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: var(--space-3) var(--space-4);
  height: 48px;
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--color-surface-muted);
}

th:first-child,
td:first-child {
  padding-left: var(--space-6);
}

th:last-child,
td:last-child {
  padding-right: var(--space-6);
}

.text-right,
th.num,
td.num {
  text-align: right;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--color-accent-soft);
}

.mono {
  font-family: var(--font-mono);
}

/* ==========================================================================
   Badges
   ========================================================================== */
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.badge.success,
.badge.increasing,
.badge.completed {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
}

.badge.warning,
.badge.medium,
.badge.urgent {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
}

.badge.danger,
.badge.decreasing,
.badge.high,
.badge.overdue {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
}

.badge.info,
.badge.low,
.badge.upcoming {
  background: var(--color-info-soft);
  color: var(--color-info-strong);
}

.badge.stable {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

/* ==========================================================================
   Buttons and form controls
   ========================================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding: 0 var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  height: 28px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-strong);
}

.btn-icon {
  width: var(--control-height);
  padding: 0;
}

.form-control {
  height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-base);
  min-width: 0;
}

.form-control:hover {
  border-color: var(--color-text-subtle);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-ring);
}

/* ==========================================================================
   Feedback states
   ========================================================================== */
.loading {
  padding: var(--space-12) var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

.error {
  padding: var(--space-4);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger-strong);
  font-size: var(--text-base);
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.notice-success {
  background: var(--color-success-soft);
  border-color: var(--color-success);
  color: var(--color-success-strong);
}

.notice-success a {
  color: var(--color-success-strong);
  font-weight: var(--font-semibold);
}

.notice-error {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
  color: var(--color-danger-strong);
}

.empty-state {
  padding: var(--space-12) var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

/* ==========================================================================
   Modals (shared by every modal component; above sidebar z-index 40)
   ========================================================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-overlay);
}

.modal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--card-header-padding);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
}

.close-button:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--gap-card);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-fast);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Detail modals: identity header, key/value grid */
.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.detail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-accent-soft);
  color: var(--color-accent-hover);
}

.detail-icon.success-icon {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.detail-icon.warning-icon {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.detail-icon.danger-icon {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.detail-title-section {
  flex: 1;
  min-width: 0;
}

.detail-name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.detail-sku {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: var(--gap-card);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: var(--space-6);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.info-value {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.info-value.mono-value {
  font-family: var(--font-mono);
  color: var(--color-info);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
</style>
