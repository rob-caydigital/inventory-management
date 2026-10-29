<template>
  <div class="language-switcher">
    <button
      type="button"
      class="language-button"
      aria-haspopup="menu"
      :aria-expanded="isDropdownOpen"
      :title="localeName"
      @click="toggleDropdown"
      @blur="handleBlur"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        class="globe-icon"
      >
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10H17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 7.5 5.5 7.5 10C7.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 12.5 5.5 12.5 10C12.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span class="language-label">{{ localeName }}</span>
      <svg
        class="chevron"
        :class="{ 'chevron-open': isDropdownOpen }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div v-if="isDropdownOpen" class="dropdown-menu" role="menu">
      <button
        v-for="locale in availableLocales"
        :key="locale"
        class="dropdown-item"
        :class="{ active: currentLocale === locale }"
        @mousedown.prevent="selectLanguage(locale)"
      >
        <span class="language-name">{{ getLanguageName(locale) }}</span>
        <svg
          v-if="currentLocale === locale"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          class="check-icon"
        >
          <path d="M4 9L7.5 12.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'

const { currentLocale, setLocale, availableLocales, localeName } = useI18n()

const isDropdownOpen = ref(false)

const languageNames = {
  en: 'English',
  ja: '日本語'
}

const getLanguageName = (locale) => {
  return languageNames[locale] || locale
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleBlur = () => {
  // Delay to allow mousedown events on dropdown items to fire first
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 200)
}

const selectLanguage = (locale) => {
  setLocale(locale)
  isDropdownOpen.value = false
}
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.language-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-base);
  color: var(--sidebar-text);
  text-align: left;
}

.language-button:hover {
  background: var(--sidebar-bg-hover);
  color: var(--sidebar-text-active);
}

.globe-icon {
  flex: none;
}

.language-label {
  flex: 1;
  min-width: 0;
  font-weight: var(--font-medium);
  white-space: nowrap;
}

/* Menu opens upward from the sidebar footer, so the chevron points up when closed */
.chevron {
  flex: none;
  transform: rotate(180deg);
}

.chevron-open {
  transform: none;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 0;
  min-width: 160px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 60;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.dropdown-item:hover {
  background: var(--color-surface-muted);
}

.dropdown-item.active {
  background: var(--color-accent-soft);
  color: var(--color-info);
}

.language-name {
  flex: 1;
}

.check-icon {
  color: var(--color-info);
  flex-shrink: 0;
}

/* Icon rail (desktop collapsed or tablet): globe only, menu opens to the right.
   Plain descendant selector on purpose: scoped CSS only tags the last part,
   while :global(...) here compiles to a bare .sidebar.is-collapsed rule. */
@media (min-width: 640px) {
  .sidebar.is-collapsed .language-button {
    justify-content: center;
    padding: var(--space-2) 0;
  }

  .sidebar.is-collapsed .language-label,
  .sidebar.is-collapsed .chevron {
    display: none;
  }

  .sidebar.is-collapsed .dropdown-menu {
    bottom: 0;
    left: calc(100% + var(--space-4));
  }
}

@media (prefers-reduced-motion: no-preference) {
  .language-button,
  .dropdown-item {
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }

  .chevron {
    transition: transform var(--transition-fast);
  }
}
</style>
