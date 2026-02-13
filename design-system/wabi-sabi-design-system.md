# MASA Wabi-Sabi Design System
## "The Automated Scientist" - Natural Intelligence Aesthetic

---

## Design Philosophy

### Core Concept: "Digital Wabi-Sabi"
Wabi-Sabi in the context of MASA (Methods of Automated Scientific Analysis) represents:
- **Imperfection as Truth**: The beauty of the scientific process—uncertainty, iteration, refinement
- **Impermanence as Flow**: Real-time streaming, continuous learning, evolving understanding
- **Natural Materials as Foundation**: Grounding AI in physical reality (causal validation, empirical truth)

### The Automated Scientist Narrative
The UI should communicate that this is not just another AI chatbot, but a **digital scientist** that:
1. **Observes** (L1 - Association) with humility
2. **Intervenes** (L2 - Causal reasoning) with precision
3. **Imagines** (L3 - Counterfactuals) with wisdom

---

## Color Palette: Extracted from Natural Materials

### Primary Palette (Dark Mode Foundation)

| Token | Hex | Material Inspiration | Usage |
|-------|-----|---------------------|-------|
| `--wabi-ink` | `#0D0D0D` | Deep Sumi ink | Primary background, void |
| `--wabi-charcoal` | `#1A1A1A` | Charcoal on washi | Cards, containers |
| `--wabi-stone-dark` | `#2D2D2D` | Weathered stone | Elevated surfaces |
| `--wabi-clay` | `#8B7355` | Terracotta clay | Warm accents, CTAs |
| `--wabi-bamboo` | `#C4A77D` | Aged bamboo | Secondary accents |
| `--wabi-linen` | `#E8E4DE` | Natural linen | Primary text |
| `--wabi-paper` | `#F5F3EF` | Handmade paper | Light text, highlights |

### Secondary Palette (Scientific Truth)

| Token | Hex | Meaning | Usage |
|-------|-----|---------|-------|
| `--causal-blue` | `#4A6FA5` | L1 Association | Pattern matching |
| `--causal-purple` | `#7B68EE` | L2 Intervention | Do-calculus |
| `--causal-amber` | `#D4A574` | L3 Counterfactual | Sovereign reasoning |
| `--truth-emerald` | `#5A8F7B` | Validation success | Ground truth |
| `--warning-ochre` | `#B8860B` | Caution | Uncertainty |

### Material Textures (CSS Implementation)

```css
/* Stone Texture - For backgrounds */
--texture-stone: url("data:image/svg+xml,...");

/* Linen Texture - For cards */
--texture-linen: url("data:image/svg+xml,...");

/* Ink Wash Gradient - For depth */
--gradient-ink: linear-gradient(180deg, 
  rgba(13,13,13,0) 0%, 
  rgba(13,13,13,0.8) 100%
);
```

---

## Typography: "Modern Sans with Wabi-Sabi Soul"

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Display** | Inter | 300-600 | Headlines, brand |
| **Body** | Inter | 400-500 | Paragraphs, UI |
| **Mono** | JetBrains Mono | 400-500 | Code, data, timestamps |
| **Accent** | Noto Serif JP | 400-600 | Japanese characters, quotes |

### Typography Scale

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `text-hero` | 72px | 1.1 | -0.02em | Landing hero |
| `text-h1` | 48px | 1.2 | -0.01em | Page titles |
| `text-h2` | 32px | 1.3 | 0 | Section headers |
| `text-h3` | 24px | 1.4 | 0 | Card titles |
| `text-body` | 16px | 1.7 | 0.01em | Paragraphs |
| `text-small` | 14px | 1.5 | 0.02em | Captions |
| `text-mono` | 13px | 1.6 | 0.05em | Code, data |

### Wabi-Sabi Typography Principles

1. **Asymmetrical Balance**: Headlines slightly offset, not centered
2. **Generous Whitespace**: Line heights at 1.6-1.8 for breathing room
3. **Imperfect Alignment**: Slight variations in text blocks (2-4px)
4. **Ink Bleed Effect**: Subtle text-shadow for depth

---

## Components: "Digital Artifacts"

### 1. Cards: "Stone Tablets"

```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Subtle stone texture
│                                     │
│   Content sits with gravity         │
│   Heavy, grounded, permanent        │
│                                     │
│  ─────────────────────────────────  │  ← Hand-drawn line
│  Meta information                   │
└─────────────────────────────────────┘
```

**Specs:**
- Background: `--wabi-charcoal` with stone texture overlay
- Border: 1px solid `--wabi-stone-dark` at 30% opacity
- Border-radius: 4px (subtle, not perfect)
- Shadow: `0 4px 24px rgba(0,0,0,0.4)`
- Padding: 32px (generous)

### 2. Buttons: "Clay Pressings"

**Primary (CTA):**
- Background: `--wabi-clay`
- Text: `--wabi-ink`
- Border-radius: 2px (organic, not machine-perfect)
- Hover: Slight emboss effect, texture shift

**Secondary:**
- Background: transparent
- Border: 1px solid `--wabi-bamboo`
- Text: `--wabi-linen`
- Hover: Background fills with `--wabi-bamboo` at 10%

**Ghost:**
- No border
- Text: `--wabi-stone-dark`
- Hover: Underline animation (ink brush stroke)

### 3. Input Fields: "Ink Wells"

```
┌────────────────────────────────────┐
│  Query the causal field...         │  ← Placeholder in muted tone
│                                    │
└────────────────────────────────────┘
     ↑
   Bottom border only, 2px
   Color transitions on focus
```

**Specs:**
- Background: transparent
- Border-bottom: 2px solid `--wabi-stone-dark`
- Focus: Border color transitions to `--wabi-clay`
- Caret: `--wabi-bamboo` color

### 4. The Causal Gauge: "Truth Meter"

Redesigned as a **vertical stone pillar** with three levels:

```
    ┌───┐
    │ ◉ │  ← L3: Gold (Counterfactual)
    │   │     Illuminated, warm glow
    ├───┤
    │ ◉ │  ← L2: Purple (Intervention)
    │   │     Soft glow
    ├───┤
    │ ◉ │  ← L1: Blue (Association)
    │   │     Subtle
    └───┘
    
    Stone texture, ancient instrument
```

### 5. Chat Bubbles: "Rice Paper Scrolls"

**User Messages:**
- Aligned right
- Background: `--wabi-stone-dark` at 50%
- Border-radius: 16px 16px 4px 16px (organic)
- Subtle paper texture

**Assistant Messages:**
- Aligned left
- Background: transparent
- Border-left: 2px solid `--wabi-clay`
- No border-radius (clean, authoritative)

### 6. Navigation: "Bamboo Sections"

```
  ═══════════════════════════════════
  
    Home    Research    Lab    About
    
  ───────────────────────────────────
```

- Horizontal lines like bamboo segments
- Active state: Slight indent, color shift
- Hover: Underline draws like ink stroke

---

## Layout Principles

### 1. The "Ma" (Negative Space)

Wabi-Sabi emphasizes **Ma** - the space between elements.

**Implementation:**
- Section padding: 120px vertical minimum
- Card margins: 48px between
- Text line length: Max 65 characters
- Grid gaps: 32px minimum

### 2. Asymmetrical Balance

Avoid perfect centering. Use:
- 60/40 splits instead of 50/50
- Off-center hero text (offset 10%)
- Staggered card heights
- Varied image crops

### 3. Natural Flow

Content should feel like it **grew** rather than was placed:
- Organic curved dividers (SVG paths)
- Diagonal section transitions
- Floating elements with subtle rotation (1-2°)

---

## Animations: "Living Ink"

### 1. Entrance Animations

**Ink Bleed:**
```css
@keyframes ink-bleed {
  0% { opacity: 0; filter: blur(8px); transform: translateY(10px); }
  100% { opacity: 1; filter: blur(0); transform: translateY(0); }
}
```

**Stone Settle:**
```css
@keyframes stone-settle {
  0% { transform: translateY(-20px); opacity: 0; }
  60% { transform: translateY(5px); }
  100% { transform: translateY(0); opacity: 1; }
}
```

### 2. Interaction Animations

**Hover (Brush Stroke):**
- Underline draws from left to right
- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Focus (Ink Pool):**
- Subtle glow spreads
- Color: `--wabi-clay` at 20% opacity
- Duration: 200ms

**Loading (Ripple):**
- Concentric circles expanding
- Like ink drops in water
- Monochrome (sumi ink aesthetic)

### 3. Continuous Animations

**Breathing:**
- Subtle scale: 1.0 → 1.02 → 1.0
- Duration: 8s
- Applied to: Hero elements, active states

**Drift:**
- Slow position shift
- Duration: 20s
- Applied to: Background elements, floating UI

---

## Page-Specific Designs

### Landing Page: "The Laboratory Entrance"

**Hero Section:**
- Full viewport height
- Background: `--wabi-ink` with subtle stone texture
- 3D visualization: Concentric rings (like the Hero.tsx, but more organic)
- Headline: "Methods of Automated Scientific Analysis"
- Subhead: "Where causal reasoning meets natural intelligence"
- CTA: "Enter the Lab" (clay button)

**Features Section:**
- Asymmetrical grid
- Cards with stone textures
- Icons: Line drawings (bamboo, stone, ink brush)
- Each feature tied to a natural element

**Testimonials:**
- Scroll-like containers
- Handwritten-style signatures
- Natural paper backgrounds

### Chat Interface: "The Meditation Hall"

**Layout:**
- Full-screen immersive
- Background: Deep ink with subtle texture
- Messages flow like scrolls unrolling

**TruthStream Redesign:**
- Messages as "scrolls" with paper texture
- Causal Gauge as "stone pillar" on right
- Oracle Mode: Golden light, incense smoke effect
- Axiom Panel: Sliding wooden panel

**Input Area:**
- Centered, floating
- Like an ink stone waiting for brush
- Submit button: Bamboo stamp effect

### Dashboard: "The Observatory"

**Layout:**
- Dark, focused
- Data visualizations as "constellations"
- Cards with depth (layered stone effect)
- Mechanism Cloud: Floating ink particles

---

## Implementation Strategy

### Phase 1: Foundation
1. Update CSS variables in `globals.css`
2. Create texture assets (SVG patterns)
3. Update layout.tsx with new fonts

### Phase 2: Components
1. Redesign Button component
2. Redesign Card component
3. Redesign Input component
4. Create new CausalGauge (stone pillar)

### Phase 3: Pages
1. Redesign Landing page (Hero, Features)
2. Redesign Chat interface (TruthStream)
3. Create Dashboard page

### Phase 4: Polish
1. Add animations
2. Add textures
3. Responsive adjustments
4. Accessibility audit

---

## Technical Notes

### CSS Custom Properties Structure

```css
:root {
  /* Colors */
  --wabi-ink: #0D0D0D;
  --wabi-charcoal: #1A1A1A;
  --wabi-stone-dark: #2D2D2D;
  --wabi-clay: #8B7355;
  --wabi-bamboo: #C4A77D;
  --wabi-linen: #E8E4DE;
  --wabi-paper: #F5F3EF;
  
  /* Causal Colors */
  --causal-blue: #4A6FA5;
  --causal-purple: #7B68EE;
  --causal-amber: #D4A574;
  --truth-emerald: #5A8F7B;
  --warning-ochre: #B8860B;
  
  /* Textures */
  --texture-stone: url(...);
  --texture-linen: url(...);
  --texture-paper: url(...);
  
  /* Spacing */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 32px;
  --space-lg: 64px;
  --space-xl: 120px;
  
  /* Animation */
  --ease-ink: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-stone: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 800ms;
}
```

### Tailwind Config Extensions

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        wabi: {
          ink: '#0D0D0D',
          charcoal: '#1A1A1A',
          stone: '#2D2D2D',
          clay: '#8B7355',
          bamboo: '#C4A77D',
          linen: '#E8E4DE',
          paper: '#F5F3EF',
        },
        causal: {
          blue: '#4A6FA5',
          purple: '#7B68EE',
          amber: '#D4A574',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Noto Serif JP', 'serif'],
      },
      animation: {
        'ink-bleed': 'ink-bleed 1s var(--ease-ink) forwards',
        'stone-settle': 'stone-settle 0.8s var(--ease-stone) forwards',
        'breathe': 'breathe 8s ease-in-out infinite',
      }
    }
  }
}
```

---

## Success Metrics

The redesign should achieve:

1. **Visual Cohesion**: All elements feel part of the same "digital artifact"
2. **Brand Alignment**: Communicates "Automated Scientist" not "Generic AI"
3. **Usability**: Dark mode reduces eye strain during long research sessions
4. **Differentiation**: Distinct from typical SaaS/Silicon Valley aesthetics
5. **Accessibility**: WCAG 2.1 AA compliant despite dark theme

---

## References & Inspiration

- **Traditional Japanese**: Sumi-e painting, Zen gardens, tea ceremony
- **Modern Minimal**: Muji aesthetic, Apple design philosophy
- **Scientific**: Laboratory equipment, observatory instruments, field notebooks
- **Digital**: Monument Valley game, Sublime Text editor, Linear app

---

*"In the pursuit of truth, we find beauty in the imperfect, the impermanent, and the incomplete."*
