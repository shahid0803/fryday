# FRYDAY — UI Design System

**Version**: 1.0  
**Updated**: September 2026  
**Status**: Phase 1 Baseline

---

## 1. Design Philosophy

FRYDAY's visual identity is built on one core idea: **a futuristic AI engineering laboratory where ideas become physical objects**. The interface must communicate **precision, intelligence, calm curiosity, and premium technology** — not a SaaS product, not a gaming UI, not a generic AI chatbot.

Visual references extracted from the cinematic reference:
- Deep obsidian / near-black environments with enormous negative space
- Warm ivory editorial typography as the primary textural element
- Cyan / teal luminous accents for interaction points and energy flows
- Restrained micro-borders defining structure without heaviness
- Subtle atmospheric glow suggesting contained power
- Monospace type for telemetry, data readouts, and coordinates
- Soft, intentional transitions — no bouncing, no flashy sci-fi theatrics

---

## 2. Color Tokens

### Background System

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-void` | `#020406` | Page background, canvas background, deepest layer |
| `--color-surface` | `rgba(8, 12, 16, 0.78)` | Panel surfaces, overlays with blur |
| `--color-surface-elevated` | `rgba(14, 20, 26, 0.88)` | Elevated panel surfaces, dropdowns |
| `--color-surface-subtle` | `rgba(255, 255, 255, 0.02)` | Extremely faint surface distinction |
| `--color-surface-active` | `rgba(78, 237, 222, 0.06)` | Selected/active state surface tint |

### Typography Colors

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-text-primary` | `#F5F2EB` | Warm ivory — primary headings, key content |
| `--color-text-muted` | `#9E9A91` | Secondary labels, descriptions |
| `--color-text-subtle` | `#5A564F` | Tertiary, hints, disabled text |
| `--color-text-dim` | `#383531` | Very dim, placeholder-level text |

### Accent System

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-cyan` | `#4EEDDE` | Primary interaction, active selections, CTA |
| `--color-cyan-bright` | `#00F5D4` | High-energy state, voice active, generation |
| `--color-cyan-glow` | `rgba(78, 237, 222, 0.22)` | Glow halos, box shadows on active states |
| `--color-cyan-dim` | `rgba(78, 237, 222, 0.12)` | Very subtle cyan surface tints |
| `--color-cyan-subtle` | `rgba(78, 237, 222, 0.05)` | Background presence only |
| `--color-cyan-border` | `rgba(78, 237, 222, 0.25)` | Active border color |

### Border System

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-border` | `rgba(255, 255, 255, 0.065)` | Default panel borders, dividers |
| `--color-border-hover` | `rgba(255, 255, 255, 0.14)` | Hover state border |
| `--color-border-active` | `rgba(78, 237, 222, 0.4)` | Active, focused, or highlighted border |

### Semantic Colors

| State | Color | Usage |
| :--- | :--- | :--- |
| Ready / Success | `#4EEDDE` | System ready dot, success indicators |
| Listening | `#00F5D4` + animate-ping | Voice/mic active |
| Thinking | `#4EEDDE` + animate-pulse | LLM inference |
| Executing | `#4EEDDE` + animate-pulse | Tool dispatch |
| Error | `#f43f5e` (rose-500) | System error state |
| Offline | `#5A564F` | Disconnected or unavailable |

---

## 3. Typography

### Font Families

| Family | CSS Variable | Use Case |
| :--- | :--- | :--- |
| **Syne** | `--font-display` | Display headings, brand name, section titles |
| **Plus Jakarta Sans** | `--font-sans` | UI body, labels, descriptions, conversational content |
| **JetBrains Mono** | `--font-mono` | Telemetry, coordinates, data readouts, nav labels |

### Scale & Hierarchy

| Level | Size | Weight | Tracking | Font | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display XL | `3rem–6rem` | 800 | `0.3em` | Syne | `IDEAS INTO OBJECTS.` |
| Display L | `1.5rem` | 700 | `0.24em` | Syne | `FRYDAY` brand |
| Heading | `0.875rem` | 600 | `0.14em` | Syne | Panel section headers |
| Body | `0.78rem` | 400 | `0.015em` | Plus Jakarta Sans | Conversation text |
| Label | `0.625rem` | 500 | `0.22em` | JetBrains Mono | Tab nav, system labels |
| Micro | `0.56rem` | 400 | `0.2em` | JetBrains Mono | Telemetry, coordinates |

### Rules
- All uppercase labels use `tracking-[0.18em]` or higher
- **Never use** italic or serif fonts for UI elements
- Keep warm ivory (`#F5F2EB`) for primary readable content; avoid pure white (`#fff`) which is too harsh against the void background
- AI assistant output uses Plus Jakarta Sans at `font-light` (300), giving an effortless quality
- User input uses Plus Jakarta Sans at `font-normal` (400), slightly heavier than AI output

---

## 4. Spacing & Layout

### Grid System (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (h-12 = 48px)                                       │
├──────────────┬──────────────────────────────┬───────────────┤
│ Scene Tree   │                              │ AI Copilot    │
│ w-260px      │  3D Viewport (flex: 1)       │ w-320px       │
│              │  — The dominant element      │               │
│              │                              │               │
│              │  ┌────────────────────┐      │               │
│              │  │  Command Bar       │      │               │
│              │  │  floating bottom   │      │               │
│              │  └────────────────────┘      │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout |
| :--- | :--- |
| `< 900px` | Scene tree and assistant panels become absolute drawers with toggle buttons |
| `900px–1200px` | Scene tree 240px, assistant 280px |
| `> 1200px` | Scene tree 260px, assistant 320px |
| `1920px` | Max comfortable — panels expand naturally |

### Spacing Scale
- **XS**: `0.25rem` (4px) — tight label spacing
- **S**: `0.5rem` (8px) — compact panel padding
- **M**: `0.75rem–1rem` (12–16px) — standard panel padding
- **L**: `1.25rem–1.5rem` (20–24px) — section separation
- **XL**: `2rem+` — generous breathing room in viewports

---

## 5. Border & Radius Principles

- Use **sharp or nearly-sharp** corners. Max radius: `0.25rem` (4px = `rounded-sm`).
- **Never** use `rounded-xl`, `rounded-2xl`, or card-style rounded borders.
- All panels use a 1px border: `border border-white/[0.06]`.
- Active states use 1px cyan border: `border-[#4EEDDE]/40`.
- Selected items in the hierarchy use a 2px left-border cyan accent: `border-l-2 border-[#4EEDDE]`.

---

## 6. Shadows & Glow

| Usage | Value |
| :--- | :--- |
| System status dot (ready) | `box-shadow: 0 0 6px rgba(78,237,222,0.6)` |
| System status dot (active) | `box-shadow: 0 0 8px rgba(78,237,222,0.9)` |
| Microphone button (listening) | `box-shadow: 0 0 12px rgba(78,237,222,0.8)` |
| Generation progress bar | `box-shadow: 0 0 8px rgba(78,237,222,0.8)` |
| Command bar (focused) | `box-shadow: 0 0 24px rgba(78,237,222,0.25)` |
| Ambient overlay gradient | `radial-gradient(circle at 50% 0%, rgba(78,237,222,0.035)...)` |

**Rule**: Glow is always a hint — never overwhelming. If you can clearly see the glow from a distance, it's too strong. Reduce opacity.

---

## 7. Animation Principles

### Core Philosophy
- **Purpose over decoration**: every animation communicates state or guides attention.
- **Smooth interpolation**: use CSS transitions with `ease-in-out` or `cubic-bezier(0.16, 1, 0.3, 1)`.
- No bounce, spring excess, or acceleration-based physics in UI chrome.

### Standard Durations

| Purpose | Duration |
| :--- | :--- |
| Panel open/close (slide) | `250ms` |
| Hover state transitions | `150ms` |
| Status dot transitions | `150ms` |
| Cinematic intro text fade-in | `1000ms` |
| Cinematic intro exit fade | `900ms` |
| Generation progress bar | `300ms` |

### Active State Animations (Tailwind)

| State | Animation |
| :--- | :--- |
| LISTENING (mic/dot) | `animate-ping` on concentric ring |
| THINKING | `animate-pulse` on dot + activity text |
| EXECUTING | `animate-pulse` on dot |
| Generation Sparkles icon | `animate-spin` |
| Voice mic button (active) | `animate-pulse` on icon |

### Reduced Motion
All animations respect `@media (prefers-reduced-motion: reduce)` — durations collapse to `0.01ms`.

---

## 8. Panel Behavior

### Left: Scene Hierarchy
- Full height from below TopBar to bottom
- Header: `h-10` with icon + label + count
- Tree: scrollable, `space-y-0.5`
- Footer: `h-9` with telemetry status
- All objects visible (visible + hidden) — hidden objects shown with `line-through` and dimmed text

### Center: 3D Viewport
- **Dominant element** — receives all available space (`flex: 1`)
- Contains the floating CommandBar at the bottom (absolutely positioned)
- TelemetryOverlay HUD is non-interactive, absolute overlay
- GenerationProgress banner is absolute, centered at top
- No borders on the viewport itself — blends directly with the void background

### Right: AI Assistant Feed
- Full height, fixed width (`320px` desktop)
- Header: `h-14` with dual label (FRYDAY / AI DESIGN COPILOT) + status badge
- Feed: scrollable conversation, auto-scrolls to bottom
- Footer: `h-9` telemetry strip

### Top: TopBar
- Fixed `h-12` (48px)
- Left: brand + version + system state dot
- Right: navigation items + panel toggle buttons (mobile only)

---

## 9. Component Rules

### Status Dots
- Always circular, `w-1.5 h-1.5`
- Never larger than `6px`
- Use glow shadow — never a ring or halo separately

### Navigation Items
- Font: JetBrains Mono, `text-[10px]`, `tracking-[0.2em]`, uppercase
- Active: `text-[#F5F2EB]` + bottom border `border-[#4EEDDE]`
- Inactive: `text-[#9E9A91]` with hover to `text-[#F5F2EB]`
- No background highlight on hover — color change only

### Buttons (Primary Action)
- Command submit, voice mic in active: `bg-[#4EEDDE]`, `text-black`
- Hover state: full teal background with glow shadow
- Default state: transparent with subtle border + muted icon

### Input Fields
- Transparent background
- Warm ivory text (`#F5F2EB`)
- Placeholder: `#5A564F`
- No visible border on the input itself — the wrapping form container provides the border
- Focus: border color shifts to `rgba(78,237,222,0.6)` on the container

### Scene Tree Nodes
- Padding: `px-2.5 py-1.5`
- Selected: `border-l-2 border-[#4EEDDE]`, `bg-[#4EEDDE]/[0.06]`
- Hidden: `line-through`, `text-[#5A564F]`
- Hover: `bg-white/[0.02]`, color shift to `#F5F2EB`

### Suggestion Chips
- Font: JetBrains Mono `text-[9px]`
- Color: `text-[#9E9A91]` hover `text-[#F5F2EB]`
- Border: `border-white/[0.06]` hover `border-[#4EEDDE]/40`

---

## 10. Accessibility

| Requirement | Implementation |
| :--- | :--- |
| Keyboard focus | `focus-visible` outline: `1px solid #4EEDDE`, `outline-offset: 1px` |
| Text contrast | All primary text ≥ 4.5:1 contrast against `#020406` |
| ARIA labels | All icon-only buttons have `aria-label` |
| Screen reader roles | Scene hierarchy uses `role="treeitem"` and `aria-selected` |
| Reduced motion | All animations disabled via `prefers-reduced-motion: reduce` |
| Voice status | Mic state changes announced via `aria-live="polite"` in assistant feed |

---

## 11. 3D Viewport Design Principles

### Lighting Palette
- **Key light**: Warm ivory directional (`#fbf8f0`, high angle)
- **Rim light**: Luminous cyan point (`#4EEDDE`) from left-rear
- **Fill**: Soft ivory point from right-front
- **Ambient**: Cool blue-grey ambient (`#d4e8ec`, low intensity)

### Floor & Grid
- Floor: Near-black circle (`#030608`), below world origin
- Grid: Teal-tinted cells (`#0b1a21`), section lines (`#1d4d5a`), fades at ~22 units

### Energy Ribbons
- Two overlapping `<Line>` curves through 3D space
- Primary: `#4EEDDE` at `opacity: 0.4`, `lineWidth: 0.9`
- Secondary: `#00F5D4` at `opacity: 0.2`, `lineWidth: 0.4`
- Paths extend from background to foreground — suggesting motion and depth

### Object Selection
- Selected objects render with higher emissive intensity
- `<TransformControls>` appear at `size: 0.6`
- Orbit controls target `[0, 0.8, 0]` to center on bike assembly
