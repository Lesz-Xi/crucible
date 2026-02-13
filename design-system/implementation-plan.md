# Wabi-Sabi UI Implementation Plan
## Phase-by-Phase Execution Guide

---

## Overview

This document provides a step-by-step implementation plan for applying the Wabi-Sabi design system to the MASA (Methods of Automated Scientific Analysis) application.

**Estimated Timeline**: 2-3 weeks
**Priority**: High (aligns with core brand identity)

---

## Phase 1: Foundation (Week 1)

### 1.1 Update Global Styles
**Files to Modify:**
- `synthesis-engine/src/app/globals.css`
- `synthesis-engine/tailwind.config.ts`
- `synthesis-engine/src/app/layout.tsx`

**Tasks:**
1. Replace existing CSS variables with Wabi-Sabi palette
2. Add new font imports (Inter, JetBrains Mono, Noto Serif JP)
3. Create texture utilities (stone, linen, paper)
4. Update Tailwind config with custom colors and animations

**Critical Gaps:**
- ⚠️ Font files need to be downloaded or use Google Fonts
- ⚠️ Texture SVGs need to be created

### 1.2 Create Base Components
**New Files:**
- `synthesis-engine/src/components/wabi/Button.tsx`
- `synthesis-engine/src/components/wabi/Card.tsx`
- `synthesis-engine/src/components/wabi/Input.tsx`

**Design Specs:**

**Button:**
```tsx
// Clay pressing effect
// Organic border-radius (2px)
// Texture overlay on hover
// Ink brush underline for ghost variant
```

**Card:**
```tsx
// Stone texture background
// Subtle shadow (grounded feel)
// Hand-drawn line separator
// 4px border-radius (imperfect)
```

**Input:**
```tsx
// Ink well aesthetic
// Bottom border only
// Caret in bamboo color
// Focus: clay color transition
```

---

## Phase 2: Landing Page Redesign (Week 1-2)

### 2.1 Hero Section
**File:** `synthesis-engine/src/components/landing/Hero.tsx`

**Changes:**
1. Update color scheme to dark mode (ink/charcoal)
2. Redesign 3D visualization:
   - Organic ring shapes (not perfect circles)
   - Stone texture on rings
   - Bamboo-colored active states
   - Clay accent for ripples

3. Typography:
   - Headline: Inter Light (300)
   - Subhead: Inter Regular (400)
   - Japanese characters: Noto Serif JP

4. Layout:
   - Off-center headline (10% offset)
   - Generous whitespace (120px padding)

### 2.2 Header/Navigation
**File:** `synthesis-engine/src/components/landing/Header.tsx`

**Changes:**
1. Floating navigation bar:
   - Background: `--wabi-charcoal` with blur
   - Border: `--wabi-stone-dark` at 30%
   - Bamboo segment dividers

2. Logo:
   - Zap icon in clay color
   - "MASA" in mono font

3. Nav items:
   - Ghost style (no border)
   - Ink brush underline on hover
   - Active: Clay dot indicator

### 2.3 Features Section
**File:** `synthesis-engine/src/components/landing/Features.tsx`

**Changes:**
1. Asymmetrical grid layout
2. Feature cards:
   - Stone texture background
   - Natural material icons (bamboo, stone, etc.)
   - Generous padding (32px)

3. Section transitions:
   - Organic curved dividers (SVG)
   - Diagonal flow

### 2.4 Remaining Sections
**Files:**
- `StatsBar.tsx` - Minimal, data as "artifacts"
- `DashboardPreview.tsx` - Dark frame, glowing edges
- `Testimonials.tsx` - Scroll-like containers
- `Pricing.tsx` - Stone tablets
- `Footer.tsx` - Grounded, minimal

---

## Phase 3: Chat Interface Redesign (Week 2)

### 3.1 TruthStream Component
**File:** `synthesis-engine/src/components/causal-chat/visuals/TruthStream.tsx`

**Changes:**
1. Message redesign:
   - User: Stone-dark bubbles, right-aligned
   - Assistant: Left border accent (clay), no background
   - Paper texture on all messages

2. Typography:
   - User messages: Italic, lighter weight
   - Assistant: Regular, authoritative

3. Animations:
   - Ink-bleed entrance
   - Scroll unrolling effect

### 3.2 CausalGauge Redesign
**File:** `synthesis-engine/src/components/causal-chat/visuals/CausalGauge.tsx`

**New Design: "Stone Pillar"**
```
Vertical stone pillar with 3 levels:
- L1 (Blue): Bottom, subtle glow
- L2 (Purple): Middle, soft glow
- L3 (Amber): Top, warm illumination

Stone texture, ancient instrument aesthetic
```

### 3.3 OracleModeIndicator
**File:** `synthesis-engine/src/components/causal-chat/visuals/OracleModeIndicator.tsx`

**Changes:**
1. Golden light effect (amber)
2. Incense smoke animation
3. Crown icon in gold
4. Ambient particle effects

### 3.4 Input Area
**File:** `synthesis-engine/src/components/causal-chat/CausalChatInterface.tsx`

**Changes:**
1. Floating input bar:
   - Centered
   - Ink well aesthetic
   - Bamboo submit button

2. Background:
   - Deep ink color
   - Subtle stone texture

---

## Phase 4: Dashboard & Analytics (Week 2-3)

### 4.1 HistorySidebar
**File:** `synthesis-engine/src/components/causal-chat/HistorySidebar.tsx`

**Already Updated** ✅ (in Phase 4 implementation)

### 4.2 AxiomPanel
**File:** `synthesis-engine/src/components/causal-chat/visuals/AxiomPanel.tsx`

**Changes:**
1. Sliding wooden panel aesthetic
2. Axioms as "scrolls"
3. Clay accent for confidence scores

### 4.3 MechanismCloud
**File:** `synthesis-engine/src/components/causal-chat/visuals/MechanismCloud.tsx`

**Already Updated** ✅ (in Phase 5 implementation)

---

## Phase 5: Polish & Animation (Week 3)

### 5.1 Add Animations
**Files:**
- `globals.css` - Keyframe animations
- Component files - Animation hooks

**Animations to Add:**
1. `ink-bleed` - Text entrance
2. `stone-settle` - Card entrance
3. `breathe` - Subtle continuous
4. `brush-stroke` - Underline draw
5. `ripple` - Loading state

### 5.2 Add Textures
**Files:**
- Create `public/textures/` directory
- Add SVG patterns:
  - `stone.svg`
  - `linen.svg`
  - `paper.svg`

### 5.3 Responsive Adjustments
**All component files**

**Breakpoints:**
- Mobile: < 640px (simplified, stacked)
- Tablet: 640px - 1024px (adjusted spacing)
- Desktop: > 1024px (full experience)

### 5.4 Accessibility Audit
**Checklist:**
- [ ] Color contrast ratios (WCAG AA)
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Reduced motion support
- [ ] Focus indicators

---

## File Structure

```
synthesis-engine/src/
├── app/
│   ├── globals.css          # Updated with Wabi-Sabi variables
│   ├── layout.tsx           # Updated fonts
│   └── page.tsx             # Landing page
│
├── components/
│   ├── wabi/                # NEW: Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   │
│   ├── landing/             # UPDATED
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── ...
│   │
│   └── causal-chat/         # UPDATED
│       ├── CausalChatInterface.tsx
│       └── visuals/
│           ├── TruthStream.tsx
│           ├── CausalGauge.tsx
│           ├── OracleModeIndicator.tsx
│           ├── AxiomPanel.tsx
│           └── MechanismCloud.tsx
│
├── styles/
│   └── textures/            # NEW
│       ├── stone.svg
│       ├── linen.svg
│       └── paper.svg
│
└── tailwind.config.ts       # Updated theme
```

---

## Critical Gaps & User Actions

### ⚠️ Required Before Implementation

1. **Font Licensing**
   - Verify Inter and JetBrains Mono licenses (should be OK)
   - Noto Serif JP: Google Fonts (free)

2. **Texture Assets**
   - Create or source SVG textures
   - Alternative: Use CSS patterns

3. **3D Assets**
   - Hero visualization may need adjustment
   - Ensure Three.js materials match new palette

4. **Build Testing**
   - Run `npm run build` after each phase
   - Check for Tailwind class conflicts

---

## Testing Checklist

### Visual
- [ ] Colors match design system
- [ ] Typography renders correctly
- [ ] Textures display properly
- [ ] Animations are smooth (60fps)

### Functional
- [ ] All buttons work
- [ ] Navigation scrolls correctly
- [ ] Chat interface functional
- [ ] Responsive on all breakpoints

### Performance
- [ ] First paint < 1.5s
- [ ] No layout shift
- [ ] Animations GPU-accelerated

### Accessibility
- [ ] Contrast ratios pass
- [ ] Keyboard navigable
- [ ] Screen reader friendly

---

## Rollback Plan

If issues arise:
1. Keep old components in `components/legacy/`
2. Use feature flags for gradual rollout
3. A/B test with subset of users

---

## Success Metrics

1. **User Feedback**: Positive reception on aesthetic
2. **Engagement**: Increased time on site
3. **Brand Recognition**: Distinct from competitors
4. **Accessibility**: WCAG 2.1 AA compliance

---

## Next Steps

1. Review design system document
2. Approve implementation plan
3. Switch to Code mode for execution
4. Implement Phase 1 (Foundation)

---

*"The journey of a thousand miles begins with a single step."*
