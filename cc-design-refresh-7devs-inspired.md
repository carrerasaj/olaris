# CC Instructions — Olaris Design Refresh (7devs-Inspired)

**Source:** Design audit of https://7devs.co/about/ conducted April 2, 2026.

**Scope:** Apply site-wide for visual consistency — homepage, `/platform`, `/industries`, `/leasing/*`, `/features/*`, `/tools/*`, `/about`, and all blog pages.

**Important note:** The motion feeling on 7devs.co comes from FOUR things: (1) a **cursor-proximity highlight** on the wave background — lines near the cursor brighten from dark grey toward cyan; (2) a **scroll-linked SVG path** that draws progressively as you scroll; (3) scroll-reveal fade-in animations on section content; (4) generous typography and whitespace on a very dark background.

This instruction set layers these elements onto the Olaris site **without** rewriting the scroll system. The 7devs scroll-pinning architecture (wheel-event hijacking) is hostile to accessibility and mobile and is explicitly NOT replicated.

---

## DESIGN TOKENS TO ADOPT

Add these to the Tailwind config or global CSS as CSS variables:

```css
:root {
  --olaris-bg: #15161a;              /* 7devs dark background */
  --olaris-text-primary: rgba(255, 255, 255, 0.9);
  --olaris-text-secondary: #a8a8a8;  /* 7devs body text */
  --olaris-accent: #26D8FD;          /* 7devs cyan — close to Olaris cyan */
  --olaris-wave-dark: #262626;
  --olaris-wave-light: #787878;
  --olaris-border-subtle: #2c2d31;
}
```

**Tailwind config extensions (tailwind.config.ts):**

```typescript
theme: {
  extend: {
    colors: {
      'olaris-bg': '#15161a',
      'olaris-text-primary': 'rgba(255, 255, 255, 0.9)',
      'olaris-text-secondary': '#a8a8a8',
      'olaris-accent': '#26D8FD',
      'olaris-wave-dark': '#262626',
      'olaris-wave-light': '#787878',
      'olaris-border-subtle': '#2c2d31',
    },
    fontFamily: {
      display: ['"Space Grotesk"', '"Galano Grotesque"', 'sans-serif'],
      body: ['Archivo', 'sans-serif'],
    },
    fontSize: {
      'hero': ['72px', { lineHeight: '79.92px', letterSpacing: '-1.12px', fontWeight: '600' }],
      'section-title': ['48px', { lineHeight: '56px', fontWeight: '400' }],
      'body-lg': ['24px', { lineHeight: '40.08px', letterSpacing: '0.5px', fontWeight: '400' }],
    },
    maxWidth: {
      'content': '1140px',
    }
  }
}
```

---

## PHASE 1: Typography + Colour Palette

### Step 1.1 — Load fonts

In `app/layout.tsx` (or wherever the root layout is), import Space Grotesk and Archivo from Google Fonts:

```typescript
import { Space_Grotesk, Archivo } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// In the return:
<html lang="en" className={`${spaceGrotesk.variable} ${archivo.variable}`}>
  <body className="font-body bg-olaris-bg text-olaris-text-secondary">
```

### Step 1.2 — Apply typography to headings

Update global styles or Tailwind base layer:

```css
@layer base {
  h1 {
    @apply font-display text-hero text-olaris-text-primary;
  }
  h2 {
    @apply font-display text-section-title text-white;
  }
  h3 {
    @apply font-display text-2xl text-white font-medium;
  }
  p {
    @apply font-body text-body-lg text-olaris-text-secondary;
  }
}
```

**Note:** "Galano Grotesque" is a licensed font and 7devs self-hosts it. Space Grotesk is the closest free equivalent (geometric sans with similar proportions). If the client wants the exact 7devs feel, they can license Galano Grotesque later and swap `font-display` fallback order.

### Step 1.3 — Logo size bump

The current Olaris logo in the top nav reads as understated next to the confident 72px hero headline. Increase its presence without overpowering the nav.

**Find the logo component** (likely in `src/components/Navigation.tsx`, `Header.tsx`, or similar).

**Current state (approximate):**
```tsx
<Link href="/" className="flex items-center gap-2">
  <Image src="/logo.svg" alt="Olaris" width={24} height={24} />
  <span className="text-lg font-semibold">Olaris</span>
</Link>
```

**Update to:**
```tsx
<Link href="/" className="flex items-center gap-3">
  <Image src="/logo.svg" alt="Olaris" width={44} height={44} className="h-11 w-11" />
  <span className="font-display text-2xl font-semibold tracking-tight text-white">
    Olaris
  </span>
</Link>
```

**Changes:**
- Icon: `24px` → `44px` (close to the 7devs 60px height but slightly more restrained)
- Gap between icon and wordmark: `gap-2` (8px) → `gap-3` (12px)
- Wordmark size: `text-lg` (18px) → `text-2xl` (24px)
- Wordmark font: default → `font-display` (Space Grotesk) for consistency with headings
- Letter-spacing: `tracking-tight` (~-0.025em) for a more confident, editorial feel
- Wordmark colour: explicit `text-white` so it doesn't inherit the muted body colour

**Also bump the nav height to match:**

Find the header/nav wrapper and increase its vertical padding:
```tsx
// BEFORE
<header className="py-4">

// AFTER
<header className="py-6">
```

This keeps the logo-to-nav ratio balanced — bigger logo needs slightly more header breathing room.

**Mobile consideration:** On screens below `md` breakpoint, drop the icon to 36px so the nav doesn't crowd:
```tsx
className="h-9 w-9 md:h-11 md:w-11"
```

---

### Step 1.4 — Update section padding and max-widths

Across all landing pages, update section wrappers:

```tsx
// BEFORE
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">

// AFTER
<section className="py-32 md:py-40 px-5">
  <div className="max-w-content mx-auto">
```

**Why:** 7devs uses 900px-tall sections with content centered vertically. A safer Olaris equivalent is `py-32` (128px) to `py-40` (160px) on desktop, giving the same "breathing room" without rebuilding the scroll system.

---

## PHASE 2: Wave Topography Background with Cursor-Proximity Highlight

This is the signature visual element on 7devs — a subtle topographic pattern of horizontal waves where lines near the cursor brighten from dark grey toward cyan. The technique uses two layered SVGs and a CSS radial-gradient mask driven by CSS custom properties updated on mousemove. This is very efficient (no React re-renders, just property writes).

### Step 2.1 — Create a WaveBackground component

Create `src/components/WaveBackground.tsx`:

```tsx
'use client';

import { useEffect, useMemo } from 'react';

export default function WaveBackground() {
  // Track cursor position via CSS custom properties (much more efficient than React state)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Set initial position off-screen so the highlight isn't visible until cursor moves
    document.documentElement.style.setProperty('--cursor-x', '-9999px');
    document.documentElement.style.setProperty('--cursor-y', '-9999px');

    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Generate 80 wave paths once (stable across re-renders)
  const paths = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const y = (i / 80) * 1080;
      const amplitude = 15 + (i % 7) * 8;
      const frequency = 0.003 + (i % 4) * 0.001;
      const phase = i * 0.5;
      const points = Array.from({ length: 100 })
        .map((_, x) => {
          const xPos = (x / 100) * 1920;
          const yPos = y + Math.sin(xPos * frequency + phase) * amplitude;
          return `${x === 0 ? 'M' : 'L'}${xPos.toFixed(1)},${yPos.toFixed(1)}`;
        })
        .join(' ');
      return points;
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Base layer: all wave lines in dark grey */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((d, i) => (
          <path
            key={`base-${i}`}
            d={d}
            fill="none"
            stroke="#262626"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        ))}
      </svg>

      {/* Highlight layer: same lines in cyan, masked by a radial gradient that follows the cursor */}
      <svg
        className="wave-highlight absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((d, i) => (
          <path
            key={`hi-${i}`}
            d={d}
            fill="none"
            stroke="#26D8FD"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <style jsx>{`
        .wave-highlight {
          -webkit-mask-image: radial-gradient(
            circle 260px at var(--cursor-x, -9999px) var(--cursor-y, -9999px),
            black 0%,
            rgba(0, 0, 0, 0.4) 60%,
            transparent 100%
          );
          mask-image: radial-gradient(
            circle 260px at var(--cursor-x, -9999px) var(--cursor-y, -9999px),
            black 0%,
            rgba(0, 0, 0, 0.4) 60%,
            transparent 100%
          );
          transition: -webkit-mask-image 0.1s ease-out, mask-image 0.1s ease-out;
        }
      `}</style>
    </div>
  );
}
```

### Step 2.2 — Mount the background in the root layout

In `app/layout.tsx`:

```tsx
<body className="font-body bg-olaris-bg text-olaris-text-secondary">
  <WaveBackground />
  <main className="relative z-0">
    {children}
  </main>
</body>
```

**Why this works:**

- **Two layers:** The base layer draws all wave lines in dark grey (`#262626`). The highlight layer draws the same lines in cyan (`#26D8FD`), but is masked so only a ~260px circle around the cursor is visible.
- **CSS custom properties:** Updating `--cursor-x` and `--cursor-y` on `mousemove` is ~100x cheaper than React state updates. No component re-renders.
- **Radial gradient mask:** `mask-image: radial-gradient(...)` reveals the cyan layer only near the cursor, with a soft fade at the edges. Lines progressively brighten as the cursor approaches them.
- **Fallback:** On first load, the cursor position is set to `-9999px` so the highlight is off-screen and invisible until the user actually moves the mouse.
- **Mobile:** On touch devices with no mousemove events, the cursor stays at `-9999px` and only the base layer shows — the effect gracefully degrades.

**Accessibility:** The wave background is purely decorative. `pointer-events-none` means it never blocks interaction. Users with `prefers-reduced-motion` can opt out via the global CSS rule in the accessibility section below.

---

## PHASE 3: Flowing Cyan Scroll-Linked SVG Line

This is the element that creates the "motion follows you" illusion.

### Step 3.1 — Create a ScrollPathLine component

Create `src/components/ScrollPathLine.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function ScrollPathLine() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength}`;
    path.style.strokeDashoffset = `${pathLength}`;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min(scrollTop / docHeight, 1);
      path.style.strokeDashoffset = `${pathLength * (1 - scrollPercent)}`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none -z-[5]"
      viewBox="0 0 1920 8000"
      preserveAspectRatio="xMidYMin slice"
    >
      <path
        ref={pathRef}
        d="M960,0 Q1200,800 800,1600 T1100,3200 T700,4800 T1200,6400 T960,8000"
        fill="none"
        stroke="#26D8FD"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

### Step 3.2 — Mount the line in the root layout

```tsx
<body className="font-body bg-olaris-bg text-olaris-text-secondary">
  <WaveBackground />
  <ScrollPathLine />
  <main className="relative z-0">
    {children}
  </main>
</body>
```

**Why:** As the user scrolls, `strokeDashoffset` reduces from the full path length to 0, progressively "drawing" the cyan line. The curve meanders left and right down the page, creating the signature 7devs flowing feel. Adjust the `d` attribute to tune the curve shape.

**Important:** This needs to be a client component (`'use client'`) because it uses `useEffect` and `window.scrollY`.

---

## PHASE 4: Scroll Reveal Animations

7devs uses CSS transitions on an `.animatedEntrance` class triggered by react-waypoint. Simpler equivalent using Intersection Observer:

### Step 4.1 — Create a useScrollReveal hook

Create `src/hooks/useScrollReveal.ts`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
```

### Step 4.2 — Create a Reveal wrapper component

Create `src/components/Reveal.tsx`:

```tsx
'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down';
}

export default function Reveal({ children, delay = 0, direction = 'up' }: RevealProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const initialTransform = direction === 'up' ? 'translate3d(0, 70px, 0)' : 'translate3d(0, -70px, 0)';

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : initialTransform,
        transition: `opacity 1s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

### Step 4.3 — Apply Reveal to section content

Wrap headings, paragraphs, and cards in `<Reveal>`:

```tsx
<section className="py-40">
  <div className="max-w-content mx-auto px-5">
    <Reveal>
      <h2>Fleet intelligence that actually understands your business</h2>
    </Reveal>
    <Reveal delay={150}>
      <p className="mt-8 max-w-3xl">
        Orbis plugs into your vehicles, drivers, and contracts — and gives you the full picture in one place.
      </p>
    </Reveal>
  </div>
</section>
```

**Why:** The staggered delay creates a cascading reveal. 7devs uses 1s for opacity and 0.5s for transform — this matches that timing.

---

## PHASE 5: CTA Button with SVG Border Sweep (Optional)

The 7devs "Contact us" CTA has an SVG-drawn border and a fill that slides up on hover. High-effort, high-polish.

### Step 5.1 — Create a GradientBorderButton component

```tsx
'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}

export default function GradientBorderButton({ children, href, onClick }: Props) {
  const content = (
    <span className="relative block w-[225px] h-[78px]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 225 78"
        preserveAspectRatio="none"
      >
        <rect
          x="1"
          y="1"
          width="223"
          height="76"
          fill="none"
          stroke="#26D8FD"
          strokeWidth="2"
        />
        <rect
          className="fill-rect"
          x="1"
          y="1"
          width="223"
          height="76"
          fill="#26D8FD"
        />
      </svg>
      <span className="relative z-10 flex items-center justify-center h-full font-display text-base font-semibold text-white group-hover:text-olaris-bg transition-colors duration-300">
        {children}
      </span>

      <style jsx>{`
        .fill-rect {
          transform: translateY(77px);
          transition: transform 0.3s ease-out;
        }
        span:hover .fill-rect {
          transform: translateY(0);
        }
      `}</style>
    </span>
  );

  if (href) {
    return <a href={href} className="group inline-block">{content}</a>;
  }
  return <button onClick={onClick} className="group inline-block">{content}</button>;
}
```

**Usage:**

```tsx
<GradientBorderButton href="/contact">Talk to us</GradientBorderButton>
```

---

## PHASE 6 (OPTIONAL): Sidebar Vertical Nav with Scroll Progress

The 7devs about page has a fixed right-side sidebar with rotated-90° nav links and a cyan progress line. This only makes sense on long-form pages (about, platform).

Skip this for now unless the brief calls for it.

---

## WHAT WE ARE NOT REPLICATING (and why)

1. **Scroll-pinned sections** — 7devs captures wheel events and maps them to section transitions. This is a significant architectural change that breaks mobile scrolling and accessibility. Skip.

2. **Lottie animations** — 7devs has 4 Lottie SVGs with magenta→purple→cyan gradients. These take time to design. Can add later as enhancement.

3. **Custom cursor effects** — 7devs doesn't have any. The user's perception of "cursor effects" was the scroll-linked SVG path drawing. That's covered in Phase 3.

4. **MUI / Emotion** — 7devs uses Material UI. Olaris uses Tailwind. No need to switch.

---

## IMPLEMENTATION ORDER

**Deploy in order, verifying each phase before moving on. Apply site-wide (all pages) for visual consistency:**

1. **Phase 1** (typography + colours) — 30 min. Safe, high-impact, foundational. Applied via root layout so it covers every page automatically.
2. **Phase 2** (wave background + cursor-proximity highlight) — 1 hour. **This is the signature effect.** The component mounts once in the root layout and covers every page automatically. Test the cursor-highlight smoothness on Mac and Windows.
3. **Phase 4** (scroll reveals) — 1 hour. Adds polish to every section. Wrap major content blocks in `<Reveal>` component on each page.
4. **Phase 3** (flowing SVG line) — 1 hour. Second signature effect. Test on mobile — the scroll math needs to work across all page lengths.
5. **Phase 5** (CTA button) — 45 min. Apply to primary CTAs site-wide (contact, signup, book-demo buttons).

Total: ~4.5 hours for a complete site-wide aesthetic refresh.

**Pages to verify after deployment:**
- `/` (homepage)
- `/platform`
- `/industries`
- `/leasing`, `/leasing/business-contract-hire`, `/leasing/salary-sacrifice`
- `/features/cost-tracking`, `/features/dvla-compliance`, `/features/driver-behaviour`, `/features/mileage-tracking`, `/features/ev-transition`
- `/tools/excess-mileage-calculator`, `/tools/fleet-compliance-checker`, `/tools/company-car-tax-calculator`
- `/about`
- `/contact`
- `/blog` and all blog posts

---

## VERIFICATION CHECKLIST

After each phase:

- [ ] Phase 1: Headings render in Space Grotesk, body in Archivo, background is `#15161a`
- [ ] Phase 2: Wave background visible on all pages, doesn't block clicks, fades at edges
- [ ] Phase 3: Cyan line draws progressively as you scroll from top to bottom
- [ ] Phase 4: Section content fades up as it enters viewport, staggered by 150ms
- [ ] Phase 5: CTA button border is SVG-drawn, fill sweeps up on hover, text colour inverts
- [ ] Mobile: Everything still works, touch-scroll is smooth, no horizontal overflow
- [ ] Accessibility: Scroll reveals respect `prefers-reduced-motion`
- [ ] PageSpeed: Mobile score stays >70

---

## ACCESSIBILITY NOTE

Add this to the global CSS to respect users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This ensures users with vestibular disorders or who've opted out of motion don't see the reveals or scroll animations.
