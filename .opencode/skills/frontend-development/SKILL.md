---
name: frontend-development
description: Frontend development expertise including HTML5, CSS3, JavaScript, TypeScript, React, Next.js, Vue, performance optimization, accessibility (WCAG 2.2 AA), responsive design, and modern web architecture patterns.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: frontend
---

## What I do

### Architecture & Rendering
- Default to **server-first** rendering (React Server Components, SSR, ISR) — move heavy logic to the server, send minimal JavaScript to the client
- Use **Island Architecture** — static HTML with small interactive "islands" of client JS only where needed (e.g., date pickers, drag-and-drop)
- Apply **Partial Prerendering (PPR)** to stream dynamic content into a static shell for near-zero INP
- Choose frameworks by constraint: **Next.js** for most React apps, **Astro** for content sites, **Qwik** when load time is critical (resumability), **Svelte** for small interactive surfaces

### Performance (Core Web Vitals)
- Target: **INP ≤ 200ms** (p75), **LCP ≤ 2.5s**, **CLS ≤ 0.1**
- Performance budget: ≤ 200KB JS at first paint, ≤ 100KB CSS, images as WebP/AVIF, fonts subset to used characters
- Inline critical CSS, defer non-critical JS, preload above-the-fold resources
- Use `requestIdleCallback` for non-urgent work, break long tasks into < 50ms chunks
- Lazy-load off-screen images and components, use code-splitting at route level

### HTML5 & Semantic Markup
- Use semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`)
- Proper heading hierarchy (h1 → h6), one `<h1>` per page
- Buttons for actions, links for navigation
- `<meta>` tags for SEO (description, Open Graph, viewport)
- Accessible forms with `<label>`, `aria-*`, `role` attributes, and proper error messages

### CSS & Styling
- Use **Utility-first CSS** (Tailwind) or **Compiled CSS-in-JS** (StyleX, Vanilla Extract) — no runtime CSS-in-JS
- **Container Queries** for truly modular, space-aware components (not just media queries)
- Design tokens via CSS custom properties for theming
- Mobile-first responsive design, fluid typography (`clamp()`), touch targets ≥ 24×24px
- Minimize CSS specificity wars with cascade layers (`@layer`)

### JavaScript & TypeScript
- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any`
- Use `satisfies` operator and `as const` for type-safe constants
- Modern ES6+ features: destructuring, optional chaining, nullish coalescing, dynamic imports
- Favor `const` over `let`, pure functions, avoid side effects
- Use `MutationObserver` over polling for DOM changes

### React & Next.js Best Practices
- **React Server Components (RSC)** as the default — only use `'use client'` for interactive islands
- Server Actions for data mutations — no manual API routes for simple CRUD
- Remove most `useMemo`/`useCallback` — **React Compiler** auto-memoizes in React 19+
- Global state is mostly dead — use Server Actions + Next.js cache; only Zustand for complex local UI flows
- Headless UI components (Radix UI, React Aria) for accessibility + Tailwind for styling
- Separate data fetching from presentation: custom hooks for business logic, components just render

### Accessibility (A11y)
- **WCAG 2.2 AA minimum**: visible focus indicators (≥ 3:1 contrast), 24×24px touch targets, no drag-only interactions
- Semantic HTML first, ARIA as supplement
- Keyboard navigation: logical tab order, skip-to-content links, no keyboard traps
- Screen-reader tested early, color contrast validated, reduced-motion respected
- Run **axe-core** in CI, manual testing every sprint

### Build & Tooling
- **Vite** as the default bundler (replace CRA/Webpack), **Turbopack** for Next.js
- Pre-commit hooks (husky + lint-staged) for linting/formatting
- Bundle analysis in CI to catch size regressions
