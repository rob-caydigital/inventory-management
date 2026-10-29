---
name: vue-saas-redesign
description: Redesign a Vue 3 application's UI into a modern SaaS-style interface - replace the top navigation bar with a dark, collapsible vertical sidebar on the left, add a slim sticky header for page title and global controls, and apply a consistent spacing/typography/color system across every view. Use this skill whenever someone wants a Vue app to look more modern, professional, polished, "like Linear/Vercel/Stripe", or "like a real SaaS dashboard"; asks to move navigation into a sidebar or side menu; says the app looks dated, cluttered or inconsistent; or wants a layout/shell overhaul of a Vue 3 (Vite, vue-router) project - even if they don't say "redesign" or "sidebar".
---

# Vue 3 SaaS redesign

Turn an existing Vue 3 app into a modern SaaS-style interface:

- a dark, collapsible sidebar on the left holds the navigation
- a slim sticky header holds the page title and global controls
- every view shares one spacing, type and color system

The result should look deliberately designed. It should not look like the old app with the navigation moved.

This is a **presentation-layer** change. Users should be able to do everything they could before, in the same places conceptually, and the app's data, API calls, routing and business logic stay untouched. Preserving behaviour is what keeps a redesign safe to merge. If you change logic as well as layout, nobody can review the diff with confidence.

## Target design

| Region | Spec |
|---|---|
| Sidebar | Fixed, full height. Expanded width is 240px; the collapsed icon rail is 64px. Background is dark slate (`#0f172a`), with the brand/app name at the top, navigation in the middle, and user/account utilities pinned to the bottom. |
| Nav item | Icon plus label, 36–40px tall, 8px radius. Muted text (`#94a3b8`) at rest, a lighter background on hover, and a clearly highlighted active state (`#1e293b` background, white text, and an accent bar or tint). |
| Header | Sticky, 56–64px, with a white/surface background and a bottom border. Page title on the left. Global controls (filters, search, actions) inline after the title or on the right. |
| Content | Light background (`#f8fafc`), a 24–32px page gutter, and a max content width only if the app is text-heavy. Cards are white with a 1px `#e2e8f0` border, a 10–12px radius, a subtle shadow and 20–24px padding. |
| Mobile (< 1024px) | The sidebar becomes an off-canvas drawer over a dimmed overlay. A hamburger button in the header opens it. Close it on route change, overlay click and Esc. |

Spacing follows a **4px scale** (4, 8, 12, 16, 20, 24, 32, 40, 48). Choose from the scale and never use one-off values like 13px or 22px. Inconsistent spacing is the most common reason a UI looks amateur, so this matters more than any individual flourish.

When the app already has a strong brand color, use it as the single accent (active nav indicator, primary buttons, focus rings). Otherwise use blue (`#3b82f6`). Respect project rules that constrain design. For example, if a CLAUDE.md says "no emojis" or fixes a palette, follow it over these defaults.

## Workflow

### 1. Discover before you touch anything

Read enough of the app to answer the questions below. Getting these wrong is how redesigns break apps.

- **Shell**: where is the layout? It is usually `App.vue` containing the top nav and `<router-view>`. Check whether a layout component or nested layouts are used instead.
- **Navigation source**: are nav links hardcoded in the template, generated from the router config, or kept in an array? Collect every destination, including links hidden in dropdowns, so none gets lost.
- **Global utilities in the top bar**: profile/user menu, language switcher, filters, search, notifications, theme toggle. Each one needs a new home (see step 3).
- **Styling approach**: plain CSS in `App.vue` or `style.css`, scoped styles, CSS variables, Tailwind, or a component library (Vuetify, Element Plus, PrimeVue, Naive UI)? Work *with* what's there:
  - With Tailwind, use Tailwind classes.
  - With a component library, use its layout/drawer primitives where sensible.
  - With plain CSS, add CSS custom properties.
  - Never install a new styling framework as part of a redesign. It bloats the diff and fights the existing styles.
- **Component conventions**:
  - Options API, `setup()` function or `<script setup>`?
  - JS or TS?
  - Is there an i18n system? If nav labels go through `t('…')`, keep using it.
  - Is there an icon library already installed?
- **Project rules**: read any CLAUDE.md, README or contributing notes. They may require delegating `.vue` edits to a specific agent, ban emojis, or fix a palette.

### 2. Establish design tokens

Define tokens once in the app's global stylesheet (often `App.vue`'s unscoped `<style>` or `src/style.css`). See `references/tokens.css` for a ready-to-adapt set: colors, the spacing scale, radii, shadows, type scale and layout sizes. Keep any existing variable names the app already uses, and alias them rather than renaming them, so existing views keep working.

Then refactor shared classes that many views rely on (`.card`, `.page-header`, `.stats-grid`, tables, badges, buttons) to use the tokens. Fixing shared classes upgrades every view at once with a small diff. Editing each view separately is slower and drifts.

### 3. Build the shell

Create a sidebar component, typically `components/AppSidebar.vue`, and, if the header has any real content, `components/AppHeader.vue`. Rewrite the root layout as:

```
.app-shell  (CSS grid: sidebar | main)
├── AppSidebar   brand · nav · footer (account utilities)
└── .app-main
    ├── AppHeader   [hamburger on mobile] page title · global controls
    └── <main> <router-view/> </main>
```

`references/sidebar-pattern.md` has a complete annotated sidebar implementation. It covers the collapse state, the mobile drawer, active-link logic and accessibility. Adapt it to the app's component conventions rather than pasting it verbatim.

Where the old top-bar items go:

- **Nav links** go to the sidebar. Group them under small uppercase section labels if there are more than about 6, or if they fall into natural groups (e.g. "Operations", "Finance").
- **Profile/user menu and language/theme switchers** go to the sidebar footer. Their dropdowns must open **upward** and must not be clipped by the sidebar's overflow. Check this; it is the most common bug in this redesign.
- **Global filters, search and page actions** go to the header. If there are many filters, let them wrap or sit in a second header row. Do not cram them.
- **Page title**: derive it from the active nav item's label, or from `route.meta.title` if the app uses it. When views already render their own big `<h1>`/`<h2>` page header, either drop the header title or slim down the in-view header. Two stacked titles look broken.

Icons:

- Use the app's icon library if it has one.
- Otherwise inline simple 20×20 stroke SVGs (`stroke="currentColor"`, `stroke-width="1.75"`, `fill="none"`), one per nav item, chosen to match the meaning (grid for overview, box for inventory, cart/clipboard for orders, and so on).
- Don't add an icon package just for this.

### 4. Normalize the views

Go through every routed view and bring it onto the system:

- One page-level wrapper with consistent padding. Remove leftover containers that assumed a top nav (e.g. `max-width` wrappers or top margins sized to clear a fixed header).
- Consistent vertical rhythm between sections (24px is a good default) and consistent grid gaps.
- Tables: comfortable row height (44–48px), muted uppercase header labels, right-aligned numeric columns, and a subtle hover. They must scroll horizontally inside their card on narrow screens.
- Buttons and inputs share radius, height and focus ring.
- Modals or overlays: check that they still center over the whole viewport and sit above the sidebar (z-index).

Touch only styling and template structure. If a view has inline styles or one-off colors, move them onto tokens. Don't rewrite its script logic.

### 5. Polish

These details separate "polished" from "rearranged":

- `:focus-visible` rings on every interactive element. The sidebar must be fully keyboard-navigable.
- Hover/active transitions of 150–200ms, wrapped in `@media (prefers-reduced-motion: no-preference)`.
- Accessibility:
  - `aria-current="page"` on the active link. Router-link does this automatically when exact-active.
  - `aria-expanded` and `aria-label` on the collapse toggle and the hamburger.
  - The sidebar is a `<nav>` landmark.
  - In the collapsed rail, add `title` tooltips or visually hidden labels so icons stay identifiable.
- The collapse preference is saved in `localStorage`. Wrap access in try/catch, because it can throw in private modes.
- Text never wraps awkwardly in the collapsed rail. Hide labels with opacity/width, not by reflowing.
- No layout shift on load: the sidebar width is known before data arrives.

### 6. Verify

Don't declare success from reading code alone. Layout bugs only show up when rendered.

1. The production build passes (`npm run build` or the project's equivalent).
2. Start the dev server and load every route at desktop width (≈1440px) and mobile width (≈390px). Use a browser automation tool (e.g. Playwright MCP) if one is available, and take screenshots.
3. Check:
   - every former nav destination is reachable
   - the active state follows the route
   - collapse/expand works and persists
   - the drawer opens and closes on mobile
   - footer menus open fully visible
   - modals still work
   - no horizontal page scroll at 390px
   - no new console errors
4. Fix what you find, then re-check.

## Report back

Finish with a short summary:

- the files created and changed
- where each former top-bar item now lives
- the design decisions you made (accent color, grouping, title strategy)
- verification results, including anything you could not verify

If you found pre-existing bugs while touching views (broken links, console errors unrelated to the redesign), list them separately. Don't fix them silently.
