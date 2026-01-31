# Apple "Liquid Glass" UI/UX Redesign Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan to transform the **Hype Me Up** fitness voice agent app into a premium, Apple-inspired experience using the 2026 "Liquid Glass" design language. The redesign will modernize every aspect of the application while maintaining full functionality.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Design System Foundation](#design-system-foundation)
3. [Component Architecture](#component-architecture)
4. [Page-by-Page Redesign](#page-by-page-redesign)
5. [Motion & Animation System](#motion--animation-system)
6. [Implementation Phases](#implementation-phases)
7. [Technical Dependencies](#technical-dependencies)
8. [File Structure Changes](#file-structure-changes)

---

## Current State Analysis

### Existing UI Inventory

| Component | Current Style | Issues to Address |
|-----------|---------------|-------------------|
| **Auth Pages** | Purple gradient, white cards | Generic, lacks premium feel |
| **Welcome Page** | Purple gradient header, basic layout | No grid system, inconsistent spacing |
| **Analytics Page** | Dark theme, stat cards, charts | Good foundation, needs refinement |
| **Voice Agent** | White card, basic visualizer | Needs Liquid Glass treatment |
| **Navigation** | Basic header buttons | No Apple-style navigation |

### Current Tech Stack

- **React 19** with TypeScript
- **Vite 7** for bundling
- **React Router 7** for navigation
- **Recharts** for data visualization
- **LiveKit** for voice agent
- **Supabase** for backend

### Pain Points to Address

1. Inconsistent design language across pages
2. No unified typography system
3. Missing scroll-based animations
4. No Bento grid layout system
5. Generic button and form styles
6. Lack of premium "glassy" materials

---

## Design System Foundation

### 1. Typography System

#### Font Setup

```css
/* SF Pro Emulation using Inter/Geist */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
                 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}
```

#### Typography Scale

| Element | Size | Weight | Letter Spacing | Line Height | Color |
|---------|------|--------|----------------|-------------|-------|
| **Hero Headline** | 72px-96px | 600 | -0.022em | 1.05 | `#ffffff` or `#1d1d1f` |
| **Section Headline** | 48px-56px | 600 | -0.022em | 1.1 | `#ffffff` or `#1d1d1f` |
| **Subheadline** | 28px-32px | 500 | -0.016em | 1.2 | `#86868b` |
| **Body Large** | 21px | 400 | -0.011em | 1.5 | `#86868b` |
| **Body** | 17px | 400 | -0.011em | 1.5 | `#86868b` |
| **Eyebrow** | 12px | 600 | 0.1em | 1.4 | `#86868b` |
| **Caption** | 12px | 500 | 0.02em | 1.4 | `#6e6e73` |

#### CSS Variables for Typography

```css
:root {
  /* Font Sizes */
  --text-hero: clamp(56px, 8vw, 96px);
  --text-headline: clamp(40px, 5vw, 56px);
  --text-subhead: clamp(24px, 3vw, 32px);
  --text-body-lg: 21px;
  --text-body: 17px;
  --text-eyebrow: 12px;
  --text-caption: 12px;
  
  /* Font Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  /* Letter Spacing */
  --tracking-tight: -0.022em;
  --tracking-normal: -0.011em;
  --tracking-wide: 0.1em;
  
  /* Line Heights */
  --leading-tight: 1.05;
  --leading-snug: 1.1;
  --leading-normal: 1.5;
}
```

---

### 2. Color System

#### Core Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #000000;          /* True black */
  --bg-secondary: #1d1d1f;        /* Near black */
  --bg-tertiary: #f5f5f7;         /* Light gray */
  --bg-white: #ffffff;            /* Pure white */
  
  /* Text Colors */
  --text-primary: #1d1d1f;        /* Headings (light mode) */
  --text-primary-dark: #f5f5f7;   /* Headings (dark mode) */
  --text-secondary: #86868b;      /* Body text */
  --text-tertiary: #6e6e73;       /* Muted text */
  
  /* Accent Colors */
  --accent-blue: #0071e3;         /* Primary CTA */
  --accent-blue-hover: #0077ed;   /* Blue hover */
  --accent-green: #30d158;        /* Success */
  --accent-orange: #ff9f0a;       /* Warning */
  --accent-red: #ff3b30;          /* Error/Destructive */
  --accent-purple: #bf5af2;       /* Special accent */
  
  /* Gradients */
  --gradient-hero: linear-gradient(180deg, #1d1d1f 0%, #000000 100%);
  --gradient-glass: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 100%);
}
```

#### Dark/Light Mode Support

```css
/* Light Mode (default for auth pages) */
[data-theme="light"] {
  --bg-page: var(--bg-white);
  --text-headline: var(--text-primary);
  --card-bg: rgba(255, 255, 255, 0.72);
  --card-border: rgba(0, 0, 0, 0.04);
}

/* Dark Mode (default for app pages) */
[data-theme="dark"] {
  --bg-page: var(--bg-primary);
  --text-headline: var(--text-primary-dark);
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-border: rgba(255, 255, 255, 0.08);
}
```

---

### 3. Liquid Glass Material System

#### Glass Card Variants

```css
/* Primary Glass Card (Dark Background) */
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Secondary Glass Card (Light Background) */
.glass-card-light {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 28px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

/* Navigation Glass */
.glass-nav {
  background: rgba(29, 29, 31, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Elevated Glass (for modals, dropdowns) */
.glass-elevated {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.2),
    0 0 1px rgba(255, 255, 255, 0.2);
}
```

---

### 4. Layout System

#### 12-Column Grid

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 max(22px, calc((100vw - 1200px) / 2));
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* Responsive breakpoints */
@media (max-width: 1068px) {
  .container { max-width: 980px; }
  .grid { gap: 20px; }
}

@media (max-width: 734px) {
  .container { padding: 0 20px; }
  .grid { gap: 16px; }
}
```

#### Bento Grid System

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(200px, auto);
  gap: 16px;
}

/* Bento Card Sizes */
.bento-card {
  padding: 40px;
  border-radius: 28px;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.bento-card:hover {
  transform: scale(1.02);
}

/* Size variants */
.bento-sm { grid-column: span 3; grid-row: span 1; }
.bento-md { grid-column: span 4; grid-row: span 1; }
.bento-lg { grid-column: span 6; grid-row: span 1; }
.bento-xl { grid-column: span 6; grid-row: span 2; }
.bento-full { grid-column: span 12; grid-row: span 1; }

/* Responsive */
@media (max-width: 1068px) {
  .bento-sm { grid-column: span 6; }
  .bento-md { grid-column: span 6; }
  .bento-lg { grid-column: span 12; }
}

@media (max-width: 734px) {
  .bento-sm, .bento-md, .bento-lg, .bento-xl { 
    grid-column: span 12; 
    grid-row: span 1;
  }
}
```

---

### 5. Spacing System

```css
:root {
  /* Spacing Scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  
  /* Section Spacing */
  --section-padding-y: 120px;
  --section-padding-y-mobile: 80px;
}
```

---

### 6. Border Radius System

```css
:root {
  /* Corner Radius (Apple "Squircle" approximation) */
  --radius-xs: 6px;     /* Small badges, tags */
  --radius-sm: 8px;     /* Inputs, small buttons */
  --radius-md: 12px;    /* Buttons, form elements */
  --radius-lg: 20px;    /* Cards, modals */
  --radius-xl: 28px;    /* Large cards, hero elements */
  --radius-2xl: 40px;   /* Hero sections */
  --radius-full: 9999px; /* Pill buttons, avatars */
}
```

---

## Component Architecture

### New Component Library Structure

```
client/src/
├── components/
│   ├── ui/                          # Base UI Components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── GlassCard.tsx
│   │   │   ├── BentoCard.tsx
│   │   │   ├── Card.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.css
│   │   │   └── index.ts
│   │   ├── Typography/
│   │   │   ├── Heading.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Eyebrow.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── layout/                      # Layout Components
│   │   ├── Container.tsx
│   │   ├── Grid.tsx
│   │   ├── BentoGrid.tsx
│   │   ├── Section.tsx
│   │   └── index.ts
│   │
│   ├── navigation/                  # Navigation Components
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Navbar.css
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── motion/                      # Animation Wrappers
│   │   ├── FadeInUp.tsx
│   │   ├── ScrollScale.tsx
│   │   ├── StickyHero.tsx
│   │   └── index.ts
│   │
│   ├── VoiceAgent/                  # Existing (Redesigned)
│   │   ├── VoiceAgentContainer.tsx
│   │   ├── AgentVisualizer.tsx
│   │   ├── AgentControls.tsx
│   │   ├── VoiceAgent.css
│   │   └── index.ts
│   │
│   └── ProtectedRoute.tsx
│
├── styles/                          # Global Styles
│   ├── design-tokens.css            # CSS Variables
│   ├── typography.css               # Typography Classes
│   ├── utilities.css                # Utility Classes
│   ├── animations.css               # Keyframes & Animations
│   └── index.css                    # Main Entry
│
└── hooks/                           # Custom Hooks
    ├── useScrollProgress.ts         # For scroll-driven animations
    ├── useInView.ts                 # Intersection Observer hook
    └── useAnalytics.ts              # Existing
```

---

### Component Specifications

#### 1. Button Component

```tsx
// Button variants matching Apple design
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text' | 'pill';
  size: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  chevron?: boolean; // For Apple's text-link style with >
}
```

**CSS Implementation:**

```css
/* Primary Button (Blue Pill) */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent-blue);
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.011em;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: 
    background-color 0.2s ease,
    transform 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-blue-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary Text Link with Chevron */
.btn-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  transition: gap 0.2s ease;
}

.btn-text:hover {
  gap: 8px;
}

.btn-text .chevron {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.btn-text:hover .chevron {
  transform: translateX(2px);
}
```

---

#### 2. GlassCard Component

```tsx
interface GlassCardProps {
  variant: 'default' | 'light' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}
```

---

#### 3. Typography Components

```tsx
// Heading Component
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  variant: 'hero' | 'headline' | 'subhead' | 'title';
  gradient?: boolean;
  children: React.ReactNode;
}

// Eyebrow Component (uppercase small text)
interface EyebrowProps {
  children: React.ReactNode;
  color?: 'default' | 'accent';
}
```

---

#### 4. Input Component

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

**CSS Implementation:**

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.input {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary-dark);
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.011em;
  transition: 
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.2);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

---

## Page-by-Page Redesign

### 1. Auth Pages (Login & Signup)

#### Current State
- Purple gradient background
- White card in center
- Basic form styling

#### Target Design

**Layout:**
- Full-screen split layout (desktop: 50/50, mobile: stack)
- Left: Hero product image/animation
- Right: Minimal glass form card

**Key Elements:**
1. **Hero Side (Left)**
   - Pure black background
   - Animated waveform visualizer (preview of voice agent)
   - Subtle gradient overlay
   - "Hype Me Up" logo large and centered

2. **Form Side (Right)**
   - Dark gradient background (`#1d1d1f` to `#000000`)
   - Glass card form container
   - Apple-style inputs with floating labels
   - Blue pill primary button
   - Text-link secondary action

**New Components Needed:**
- `AuthLayout.tsx` - Split layout wrapper
- `AuthHero.tsx` - Left side with animation
- `AuthForm.tsx` - Glass card form wrapper

**Wireframe Structure:**

```
┌─────────────────────────────────────────────────────┐
│                    NAVBAR (glass)                    │
├───────────────────────┬─────────────────────────────┤
│                       │      EYEBROW: WELCOME       │
│     ANIMATED          │      HEADLINE: Sign In      │
│     VISUALIZER        │                             │
│     PREVIEW           │     ┌─────────────────┐     │
│                       │     │ Email Input     │     │
│     "Hype Me Up"      │     └─────────────────┘     │
│     Your Personal     │     ┌─────────────────┐     │
│     Fitness Coach     │     │ Password Input  │     │
│                       │     └─────────────────┘     │
│                       │                             │
│                       │     [    Sign In    ]       │
│                       │     Don't have account? >   │
├───────────────────────┴─────────────────────────────┤
```

---

### 2. Welcome Page (Main Dashboard)

#### Current State
- Purple gradient full page
- Simple header with logo/buttons
- VoiceAgent card centered

#### Target Design

**Layout:**
- Full black background with subtle radial gradient
- Sticky glass navigation
- Hero section with large greeting
- Central voice agent with enhanced visualizer
- Bento grid of quick stats below (optional)

**Key Elements:**
1. **Navigation Bar**
   - Glass material navbar
   - Logo left-aligned
   - Navigation links center (Home, Analytics)
   - User menu right (avatar dropdown)

2. **Hero Section**
   - Massive headline: "Hey, {FirstName}"
   - Subheadline: "Ready to crush your workout?"
   - Fade-in animation on load

3. **Voice Agent Card**
   - Enhanced glass card with glow effect
   - Larger, more premium visualizer
   - Apple-style control buttons
   - State indicator with animation

4. **Quick Stats Bento (Optional)**
   - 4 small bento cards showing:
     - Current streak
     - Today's goal
     - Last workout
     - Weekly progress

**Wireframe Structure:**

```
┌─────────────────────────────────────────────────────┐
│  [Logo]     Home  Analytics           [Avatar ▼]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│           EYEBROW: YOUR PERSONAL COACH              │
│                                                     │
│              Hey, Michael.                          │
│         Ready to crush your workout?                │
│                                                     │
├─────────────────────────────────────────────────────┤
│         ┌─────────────────────────────┐             │
│         │                             │             │
│         │   ▁▂▃▅▆█▆▅▃▂▁▂▃▅▆█▆▅▃▂▁    │             │
│         │                             │             │
│         │      ● Listening...         │             │
│         │                             │             │
│         │   [🎤 Mute]  [Disconnect]   │             │
│         │                             │             │
│         └─────────────────────────────┘             │
│                                                     │
├─────────────────────────────────────────────────────┤
│   ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│   │ 🔥 12   │  │ 💪 3    │  │ ⏱️ 45m  │            │
│   │ Streak  │  │ Today   │  │ Last    │            │
│   └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────┘
```

---

### 3. Analytics Page

#### Current State
- Dark gradient background
- Good stat cards, charts
- Needs Bento grid refinement

#### Target Design

**Layout:**
- Black background
- Sticky section headers
- True Bento grid for stats
- Enhanced Recharts styling
- Scroll-triggered animations

**Key Elements:**
1. **Page Header**
   - Glass breadcrumb navigation
   - Large headline with user name
   - Time period selector (Week/Month/Year)

2. **Overview Bento**
   - 4 stat cards in Bento layout
   - Glass material with gradient accents
   - Large numbers, small labels (Apple style)
   - Hover scale effect

3. **Charts Section**
   - Scroll-fade-in animation
   - Restyled charts with Apple colors
   - Glass card containers
   - Interactive tooltips

4. **Tables Section**
   - Glass card wrapper
   - Minimal table design
   - Hover row highlights
   - Sticky table headers

**Bento Grid Layout:**

```
┌─────────────────────────────────────────────────────┐
│  ← Home     Analytics                    [Logout]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Michael's Workout Analytics                       │
│   Week  Month  Year                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│   ┌───────────────────┐  ┌───────────────────┐      │
│   │    12             │  │    24             │      │
│   │    Day Streak     │  │    Total Workouts │      │
│   │    ●●●●●●●●●●●●   │  │    +3 this week   │      │
│   └───────────────────┘  └───────────────────┘      │
│   ┌───────────────────┐  ┌───────────────────┐      │
│   │    4h 32m         │  │    2,450          │      │
│   │    Total Time     │  │    Total Reps     │      │
│   └───────────────────┘  └───────────────────┘      │
├─────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────┐   │
│   │  Exercise Frequency                         │   │
│   │  ▇▇▇▇▇▇▇▇                                   │   │
│   │  ▇▇▇▇▇▇                                     │   │
│   │  ▇▇▇▇                                       │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   ┌─────────────────┐  ┌────────────────────────┐   │
│   │  Distribution   │  │  Consistency Stats     │   │
│   │     [PIE]       │  │  12  |  15  |  4.2     │   │
│   └─────────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

### 4. Voice Agent Component Redesign

#### Current State
- White card on gradient
- Basic bar visualizer
- Simple controls

#### Target Design

**Visual Changes:**
1. **Glass Card Container**
   - Black glass with subtle blue glow
   - 28px border radius
   - Inset shadow for depth

2. **Enhanced Visualizer**
   - Smooth curved waveform (vs. bars)
   - Gradient fill (blue to purple)
   - Glow effect when speaking
   - Responsive to audio frequency

3. **State Indicator**
   - Pulsing orb animation
   - Color changes: 
     - Green (listening)
     - Blue (processing)
     - Purple (speaking)
   - Subtle glow radius

4. **Control Buttons**
   - Pill-shaped glass buttons
   - Icon + text layout
   - Active states with color fill
   - Haptic-feel animations

---

## Motion & Animation System

### Required Dependencies

```bash
npm install framer-motion
# or
npm install @motionone/solid  # lighter alternative
```

For this plan, we'll use **CSS animations** for simpler effects and **Framer Motion** for complex scroll-driven animations.

---

### Animation Primitives

#### 1. Fade-In-Up (Intersection Observer)

```tsx
// hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
```

```css
/* animations.css */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  transition: 
    opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1),
    transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.fade-in-up.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children */
.fade-in-up.delay-1 { transition-delay: 0.1s; }
.fade-in-up.delay-2 { transition-delay: 0.2s; }
.fade-in-up.delay-3 { transition-delay: 0.3s; }
```

---

#### 2. Scroll-Driven Scale (Hero Animation)

```tsx
// hooks/useScrollProgress.ts
import { useEffect, useState } from 'react';

export function useScrollProgress(ref: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress from 0 (top of viewport) to 1 (bottom of viewport)
      const progress = Math.max(0, Math.min(1, 
        1 - (rect.top / windowHeight)
      ));
      
      setProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return progress;
}
```

```tsx
// Usage: Scale hero from 0.8 to 1.0 as user scrolls
function HeroImage() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref);
  const scale = 0.8 + (progress * 0.2); // 0.8 -> 1.0

  return (
    <div 
      ref={ref}
      style={{ transform: `scale(${scale})` }}
    >
      <img src="/hero.png" alt="Hero" />
    </div>
  );
}
```

---

#### 3. Sticky Hero with Fade Text

```tsx
// components/motion/StickyHero.tsx
interface StickyHeroProps {
  heroContent: React.ReactNode;
  textSections: Array<{
    eyebrow?: string;
    headline: string;
    body?: string;
  }>;
}

export function StickyHero({ heroContent, textSections }: StickyHeroProps) {
  return (
    <div className="sticky-hero-container">
      <div className="sticky-hero-visual">
        {heroContent}
      </div>
      <div className="sticky-hero-text-container">
        {textSections.map((section, i) => (
          <div key={i} className="sticky-hero-text-section">
            {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
            <h2>{section.headline}</h2>
            {section.body && <p>{section.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

```css
.sticky-hero-container {
  position: relative;
  min-height: 300vh; /* Allow scrolling */
}

.sticky-hero-visual {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.sticky-hero-text-container {
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.sticky-hero-text-section {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
```

---

#### 4. Button Hover/Press Animation

```css
.btn {
  transition: 
    transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1),
    box-shadow 0.15s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: scale(0.98) translateY(0);
}
```

---

#### 5. Bento Card Hover Scale

```css
.bento-card {
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.bento-card:hover {
  transform: scale(1.02);
  z-index: 10;
}
```

---

#### 6. Loading Spinner (Apple Style)

```css
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

#### 7. Pulse Indicator (Voice State)

```css
.pulse-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-green);
  position: relative;
}

.pulse-indicator::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.4;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2); opacity: 0; }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Set up design system, new folder structure, base components

**Tasks:**
1. [ ] Create `/styles/` directory with design tokens
   - `design-tokens.css` - All CSS variables
   - `typography.css` - Typography classes
   - `utilities.css` - Utility classes
   - `animations.css` - Keyframes

2. [ ] Update `/components/ui/` base components
   - `Button/Button.tsx` & styles
   - `Input/Input.tsx` & styles
   - `Card/GlassCard.tsx` & styles
   - `Typography/` components

3. [ ] Create layout components
   - `Container.tsx`
   - `Grid.tsx`
   - `BentoGrid.tsx`
   - `Section.tsx`

4. [ ] Install Framer Motion (optional)
   ```bash
   npm install framer-motion
   ```

5. [ ] Create animation hooks
   - `useInView.ts`
   - `useScrollProgress.ts`

**Deliverable:** Fully functional design system with isolated components

---

### Phase 2: Navigation & Layout (Week 2)

**Goal:** Implement new navigation and page layouts

**Tasks:**
1. [ ] Create `Navbar/` component
   - Glass material styling
   - Logo component
   - Navigation links
   - User dropdown menu

2. [ ] Create `AuthLayout.tsx` for split-screen auth
   - Left hero panel
   - Right form panel
   - Mobile stacked view

3. [ ] Create `AppLayout.tsx` for main app pages
   - Navbar integration
   - Container setup
   - Page transition wrapper

4. [ ] Update `App.tsx` routing with layouts

**Deliverable:** Consistent navigation across all pages

---

### Phase 3: Auth Pages Redesign (Week 2-3)

**Goal:** Completely redesign Login and Signup pages

**Tasks:**
1. [ ] Create `AuthHero.tsx` component
   - Animated waveform preview
   - Branding text
   - Gradient background

2. [ ] Redesign `Login.tsx`
   - New layout with AuthLayout
   - Apple-style form inputs
   - Glass card wrapper
   - Animation on mount

3. [ ] Redesign `Signup.tsx`
   - Same treatment as Login
   - Multi-step form (optional)
   - Progress indicator

4. [ ] Update `Auth.css` to new design system

**Deliverable:** Premium authentication experience

---

### Phase 4: Welcome Page Redesign (Week 3)

**Goal:** Transform Welcome page to Apple-style dashboard

**Tasks:**
1. [ ] Update page structure
   - Hero greeting section
   - Voice agent centered card
   - Quick stats bento (optional)

2. [ ] Create enhanced voice agent card
   - Glass material container
   - Glow effects
   - Premium styling

3. [ ] Add animations
   - Fade-in on load
   - Stagger animation for elements
   - Interactive hover states

4. [ ] Update `Welcome.css` to new design system

**Deliverable:** Striking dashboard experience

---

### Phase 5: Voice Agent Redesign (Week 3-4)

**Goal:** Elevate voice agent to signature Apple-quality experience

**Tasks:**
1. [ ] Redesign `VoiceAgentContainer.tsx`
   - Glass card wrapper
   - Loading state redesign
   - Connection states redesign

2. [ ] Enhance `AgentVisualizer.tsx`
   - Curved waveform (optional)
   - Gradient colors
   - Glow effects
   - Smooth animations

3. [ ] Redesign `AgentControls.tsx`
   - Pill-shaped buttons
   - Icon redesign
   - Active state colors

4. [ ] Update `VoiceAgent.css` completely

**Deliverable:** Premium voice interaction experience

---

### Phase 6: Analytics Page Redesign (Week 4)

**Goal:** Transform Analytics into Bento grid showcase

**Tasks:**
1. [ ] Implement Bento grid layout
   - Responsive grid system
   - Card size variants
   - Hover animations

2. [ ] Redesign stat cards
   - Glass material
   - Large typography
   - Subtle gradients

3. [ ] Restyle Recharts
   - Apple color palette
   - Custom tooltip
   - Grid line styles

4. [ ] Add scroll animations
   - Section fade-in
   - Chart reveal
   - Table row stagger

5. [ ] Update `Analytics.css` completely

**Deliverable:** Data visualization showcase

---

### Phase 7: Polish & Accessibility (Week 5)

**Goal:** Final polish, responsive testing, accessibility

**Tasks:**
1. [ ] Responsive testing
   - Mobile (320px - 767px)
   - Tablet (768px - 1023px)
   - Desktop (1024px+)

2. [ ] Accessibility audit
   - Color contrast (21:1 ratio target)
   - Focus states
   - Screen reader testing
   - Keyboard navigation

3. [ ] Performance optimization
   - Reduce motion preference
   - Lazy load animations
   - Optimize CSS bundle

4. [ ] Cross-browser testing
   - Chrome
   - Firefox
   - Safari
   - Edge

**Deliverable:** Production-ready redesign

---

## Technical Dependencies

### New Dependencies to Install

```bash
# Animation library (optional but recommended)
npm install framer-motion

# Icon library (Apple-style icons)
npm install lucide-react
```

### Updated Dependencies

Current dependencies remain compatible:
- React 19 ✓
- React Router 7 ✓
- Recharts 3 ✓
- LiveKit ✓
- Supabase ✓

---

## File Structure Changes

### Files to Create

```
client/src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   │   ├── Button.tsx          [NEW]
│   │   │   ├── Button.css          [NEW]
│   │   │   └── index.ts            [NEW]
│   │   ├── Card/
│   │   │   ├── GlassCard.tsx       [NEW]
│   │   │   ├── BentoCard.tsx       [NEW]
│   │   │   ├── Card.css            [NEW]
│   │   │   └── index.ts            [NEW]
│   │   ├── Input/
│   │   │   ├── Input.tsx           [NEW]
│   │   │   ├── Input.css           [NEW]
│   │   │   └── index.ts            [NEW]
│   │   ├── Typography/
│   │   │   ├── Heading.tsx         [NEW]
│   │   │   ├── Text.tsx            [NEW]
│   │   │   ├── Eyebrow.tsx         [NEW]
│   │   │   └── index.ts            [NEW]
│   │   └── index.ts                [NEW]
│   │
│   ├── layout/
│   │   ├── Container.tsx           [NEW]
│   │   ├── Grid.tsx                [NEW]
│   │   ├── BentoGrid.tsx           [NEW]
│   │   ├── Section.tsx             [NEW]
│   │   ├── AuthLayout.tsx          [NEW]
│   │   ├── AppLayout.tsx           [NEW]
│   │   └── index.ts                [NEW]
│   │
│   ├── navigation/
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx          [NEW]
│   │   │   ├── UserMenu.tsx        [NEW]
│   │   │   ├── Navbar.css          [NEW]
│   │   │   └── index.ts            [NEW]
│   │   └── index.ts                [NEW]
│   │
│   └── motion/
│       ├── FadeInUp.tsx            [NEW]
│       ├── ScrollScale.tsx         [NEW]
│       └── index.ts                [NEW]
│
├── hooks/
│   ├── useInView.ts                [NEW]
│   ├── useScrollProgress.ts        [NEW]
│   └── useAnalytics.ts             [EXISTING]
│
├── styles/
│   ├── design-tokens.css           [NEW]
│   ├── typography.css              [NEW]
│   ├── utilities.css               [NEW]
│   ├── animations.css              [NEW]
│   └── index.css                   [REPLACE - new entry point]
│
└── pages/
    ├── Auth/
    │   ├── AuthHero.tsx            [NEW]
    │   ├── Login.tsx               [MODIFY]
    │   ├── Signup.tsx              [MODIFY]
    │   └── Auth.css                [REPLACE]
    ├── Welcome/
    │   ├── Welcome.tsx             [MODIFY]
    │   └── Welcome.css             [REPLACE]
    └── Analytics/
        ├── Analytics.tsx           [MODIFY]
        └── Analytics.css           [REPLACE]
```

### Files to Modify

| File | Type of Change |
|------|----------------|
| `App.tsx` | Add layout wrappers, update routes |
| `index.css` | Replace with new design system import |
| `Welcome.tsx` | Restructure with new components |
| `Welcome.css` | Complete rewrite |
| `Login.tsx` | Add new layout, update styling |
| `Signup.tsx` | Add new layout, update styling |
| `Auth.css` | Complete rewrite |
| `Analytics.tsx` | Add Bento grid, animations |
| `Analytics.css` | Complete rewrite |
| `VoiceAgentContainer.tsx` | Glass card wrapper, states |
| `AgentVisualizer.tsx` | Enhanced visualizer |
| `AgentControls.tsx` | Pill buttons, new icons |
| `VoiceAgent.css` | Complete rewrite |

---

## Success Metrics

### Visual Checklist

- [ ] Typography matches SF Pro specifications (letter-spacing, weights)
- [ ] Colors are pure black (#000000) and white (#ffffff)
- [ ] Glass materials have 20px blur, correct opacity
- [ ] Border radius is consistent (28px cards, 12px buttons)
- [ ] Bento grid is responsive and properly sized
- [ ] All animations are smooth (60fps)
- [ ] Hover states provide tactile feedback
- [ ] Loading states are polished
- [ ] Dark mode is cohesive

### Performance Targets

- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total CSS bundle < 50KB gzipped

### Accessibility Compliance

- [ ] WCAG 2.1 AA compliant
- [ ] Color contrast ratio ≥ 4.5:1 (body), ≥ 3:1 (large text)
- [ ] All interactive elements keyboard accessible
- [ ] Reduced motion preference respected

---

## Appendix: CSS Variables Reference

```css
/* Complete CSS Variables for reference */
:root {
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  --text-hero: clamp(56px, 8vw, 96px);
  --text-headline: clamp(40px, 5vw, 56px);
  --text-subhead: clamp(24px, 3vw, 32px);
  --text-body-lg: 21px;
  --text-body: 17px;
  --text-eyebrow: 12px;
  --tracking-tight: -0.022em;
  --tracking-normal: -0.011em;
  --tracking-wide: 0.1em;
  
  /* Colors */
  --bg-primary: #000000;
  --bg-secondary: #1d1d1f;
  --bg-white: #ffffff;
  --text-primary: #1d1d1f;
  --text-primary-dark: #f5f5f7;
  --text-secondary: #86868b;
  --accent-blue: #0071e3;
  --accent-green: #30d158;
  --accent-red: #ff3b30;
  
  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 20px;
  
  /* Spacing */
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-16: 64px;
  --space-24: 96px;
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 24px 48px rgba(0, 0, 0, 0.2);
  
  /* Transitions */
  --ease-out: cubic-bezier(0.25, 0.1, 0.25, 1);
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.8s;
}
```

---

## Next Steps

1. **Review this plan** and confirm priorities
2. **Phase 1 kickoff** - Set up design tokens and base components
3. **Weekly check-ins** to review progress
4. **Design QA** at each phase milestone

---

*Document Version: 1.0*  
*Last Updated: January 31, 2026*  
*Author: Senior Apple Creative Technologist (AI Assistant)*
