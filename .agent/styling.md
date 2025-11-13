# Styling Guide - Next.js Landing Page

USE SHADCN components whenever possible

## Overview

This is a modern, minimalist landing page design system built with Next.js 16, React 19, Tailwind CSS 4, and Framer Motion. The design emphasizes clean aesthetics, subtle animations, and a sophisticated monochromatic color palette with vibrant gradient accents. The overall feel is professional, contemporary, and startup-focused.

---

## Color Palette

### Primary Colors

**Black Shades:**
- `#09090B` (Woodsmoke) - Primary dark color for text, buttons, and footer
- `#27272A` (Shark) - Secondary dark for hover states and headings
- `#262626` - Dark gray for ticker component background

**White Shades:**
- `#FFFFFF` (White) - Primary background color, card backgrounds
- `#FAFAFA` (Alabaster) - Alternate section backgrounds (lighter gray)
- `#F4F4F5` (Athens Gray) - Subtle background variations

**Gray Shades:**
- `#71717B` (Storm Gray) - Secondary text, descriptions, muted content
- `#A1A1AA` (Santas Gray) - Footer links, tertiary text
- `#E4E4E7` (Iron) - Borders, dividers, subtle outlines

### Accent Colors
Avoid using gradient color unless explicityly mentioned

**Gradient Combinations:**
- Pink to Red: `from-[#f093fb] to-[#f5576c]`
- Blue to Cyan: `from-[#4facfe] to-[#00f2fe]`
- Pink to Yellow: `from-[#fa709a] to-[#fee140]`
- Purple to Deep Purple: `from-[#667eea] to-[#764ba2]`

**Status Colors:**
- Success Green: `#0CB300` - Used for status indicators (booking badge)

### Opacity Levels

- Full opacity: `opacity-100` (default)
- Reduced emphasis: `opacity-50` (secondary text in hero)
- Muted: `opacity-60` (inactive step cards)
- Subtle: `opacity-70` (hover states)
- Very subtle: `opacity-90` or `opacity-95` (CTA subtitle)
- Backdrop blur: `bg-white/65` (header with 65% opacity)

---

## Typography

### Font Family

**Primary Font:** Geist Sans (fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
**Monospace Font:** Geist Mono (for code/technical content if needed)

### Font Sizes

**Hero/Display:**
- Desktop XL: `text-[72px]` (72px) - Main hero heading
- Desktop: `text-6xl` (60px) - Hero heading on medium screens
- Mobile: `text-4xl` (36px) - Hero heading on small screens

**Headings:**
- H2 Large: `text-5xl` (48px) - Section titles on large screens
- H2 Medium: `text-4xl` (36px) - Section titles on medium screens
- H2 Small: `text-3xl` (30px) - Section titles on mobile
- H3: `text-2xl` (24px) - Card titles, step titles
- H6: `text-sm` (14px) - Footer section headers

**Body Text:**
- Large: `text-lg` (18px) - Section subtitles
- Base: `text-base` (16px) - Default body text, descriptions
- Small: `text-[15.1px]` - CTA button text
- Extra Small: `text-[14.8px]` - Badge text, small labels
- Tiny: `text-[11px]` - Ticker items

**Stats:**
- `text-[32px]` - Stat numbers in testimonial cards

### Font Weights

- Bold: `font-bold` (700) - Headings, CTAs, emphasis
- Semibold: `font-semibold` (600) - Navigation, footer links
- Medium: `font-medium` (500) - Section headings, card titles
- Normal: `font-normal` (400) - Body text, secondary headings

### Line Heights

- Tight: `leading-[1.2]` - Hero headings (tight spacing)
- Comfortable: `leading-[1.25]` - Section headings
- Relaxed: `leading-[1.5]` - Testimonial text
- Standard: `leading-[1.6]` - Body paragraphs
- Loose: `leading-[1.84]` - Small text (badges)

### Letter Spacing

- Tight: `tracking-[-0.04em]` - Hero headings (negative tracking)
- Subtle: `tracking-[-0.01em]` - Hero subheading
- Wide: `tracking-[0.1em]` - Footer section headers (uppercase)

---

## Layout & Spacing

### Container Widths

**Max Width:** `max-w-[1400px]` or `max-w-[1440px]` - Content container
**Centered:** `mx-auto` - Center containers horizontally

### Horizontal Padding (Responsive)

```
px-6 md:px-20 lg:px-32 xl:px-48
```
- Mobile: 24px (1.5rem)
- Medium: 80px (5rem)
- Large: 128px (8rem)
- XL: 192px (12rem)

### Vertical Padding

- Section padding: `py-20` (80px) - Standard section spacing
- Header padding: `py-4` (16px) - Navigation bar
- Card padding: `p-6` (24px) - Standard cards
- Large card padding: `p-8` (32px) - Testimonial cards
- Button padding: `py-[11px]` - Precise button height

### Gaps

- Hero elements: `gap-9` (36px) - Large spacing between hero sections
- Hero inner: `gap-8` (32px) - Between badge and heading
- Section title group: `gap-4` (16px) - Badge to title
- Card grid: `gap-6` (24px) - Between cards
- Feature grid: `gap-8` (32px) - Between feature cards
- Navigation items: `gap-14` (56px) - Between nav links
- Small gaps: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)

### Margins

- Section bottom: `mb-16` (64px) - Below section headers
- Title bottom: `mb-4` (16px) - Below titles
- Text bottom: `mb-6` (24px) - Below testimonial text
- Hero subheading top: `mt-2` (8px) - Above subheading

---

## Border Radius (Corner Rounding)

### Standard Radii

- Extra Large: `rounded-3xl` (24px) - Large cards, hero cards, slideshow
- Large: `rounded-2xl` (16px) - Standard cards, step cards, gradient placeholders
- Medium: `rounded-xl` (12px) - Stat card images
- Small: `rounded-lg` (8px) - Header CTA button
- Pill/Full: `rounded-full` - Badges, avatars, primary buttons, status dots
- Custom: `rounded-[33px]` - Button container wrapper

### Component-Specific

- Slideshow container: `rounded-3xl`
- Ticker container: `rounded-3xl`
- Badge: `rounded-full`
- Primary CTA: `rounded-full`
- Cards: `rounded-2xl` or `rounded-3xl`
- Avatar images: `rounded-full`
- Status indicator: `rounded-full`

---

## Shadows

### Component Shadows

**Badge Shadow:**
```css
shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
```

**Slideshow/Ticker Shadow:**
```css
shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)]
```
Multi-layered shadow for depth

**Primary Button Shadow:**
```css
shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]
```
Combines outer shadow with inner shadow for depth

**CTA Button Shadow:**
```css
shadow-[0px_4px_20px_rgba(0,0,0,0.15)]
hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)]
```
Elevates on hover

---

## Animations & Motion

### Framer Motion

**Package:** `framer-motion@^12.23.24`

Use Framer Motion for:
- Page transitions
- Component entrance animations
- Interactive hover effects
- Scroll-triggered animations
- Gesture-based interactions

### CSS Animations

**Slideshow Animation:**
```css
@keyframes slideshow {
  0%, 30% { transform: translateX(0); }
  33%, 63% { transform: translateX(-100px); }
  66%, 96% { transform: translateX(-200px); }
  100% { transform: translateX(0); }
}
```
- Duration: 9s
- Timing: infinite loop
- Effect: Horizontal slide through 3 images

**Ticker Animation:**
```css
@keyframes ticker {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
```
- Duration: 12s
- Timing: linear infinite
- Effect: Vertical scroll through items

### Transition Classes

**Standard Transitions:**
```
transition-all duration-300
transition-opacity
transition-colors
```

**Hover Effects:**
- Opacity: `hover:opacity-70`
- Background: `hover:bg-[#27272A]`
- Scale: `hover:scale-105`
- Shadow elevation: `hover:shadow-[...]`

---

## Component Patterns

### Badges

```tsx
<div className="inline-flex items-center gap-2 px-4 py-[7px] bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
  <span className="w-1.5 h-1.5 bg-[#0CB300] rounded-full"></span>
  <span className="text-[14.8px] leading-[1.84]">Badge Text</span>
</div>
```

**Section Badge:**
```tsx
<span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
  Section Label
</span>
```

### Buttons

**Primary CTA:**
```tsx
<div className="bg-white rounded-[33px] p-2">
  <button className="bg-[#09090B] text-white px-6 py-[11px] border-none rounded-full font-bold text-[15.1px] cursor-pointer shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]">
    Button Text
  </button>
</div>
```

**Secondary CTA:**
```tsx
<button className="bg-white text-[#09090B] px-8 py-4 border-none rounded-full font-bold text-base cursor-pointer shadow-[0px_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)] transition-all hover:scale-105">
  Button Text
</button>
```

**Header CTA:**
```tsx
<a href="#" className="bg-[#09090B] text-[#FAFAFA] px-5 py-2.5 rounded-lg text-base font-semibold no-underline shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#27272A] transition-colors">
  Try for Free
</a>
```

### Cards

**Standard Card:**
```tsx
<div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
  {/* Content */}
</div>
```

**Feature Card:**
```tsx
<div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
  <div className="w-full h-[324px] bg-gradient-to-br from-[#fa709a] to-[#fee140] rounded-2xl mb-4"></div>
  <h3 className="text-2xl font-medium text-[#27272A] mb-2 px-5">Title</h3>
  <p className="text-[#71717B] text-base px-5 pb-5">Description</p>
</div>
```

**Testimonial Card:**
```tsx
<div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
  <p className="text-base leading-[1.5] text-[#09090B] mb-6">
    "Testimonial text"
  </p>
  <div className="flex items-center gap-3 mt-auto">
    <Image src="/avatar.png" alt="Name" width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
    <div className="flex flex-col gap-1">
      <div className="font-bold text-base text-[#09090B]">Name</div>
      <div className="text-base text-[#71717B]">Company</div>
    </div>
  </div>
</div>
```

### Interactive Step Cards

```tsx
<button
  onClick={() => setActiveStep(1)}
  className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
    activeStep === 1 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
  }`}
>
  <span className="font-semibold text-sm mr-4">01.</span>
  <h3 className="text-2xl font-medium mb-2 inline">Step Title</h3>
  {activeStep === 1 && (
    <p className="text-[#71717B] text-sm mt-2">Description</p>
  )}
</button>
```

### Avatar Stack

```tsx
<div className="flex gap-[-6px]">
  <Image src="/avatar1.png" alt="Client 1" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-0 first:ml-0" />
  <Image src="/avatar2.png" alt="Client 2" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
  {/* More avatars */}
</div>
```

---

## Special Effects

### Noise Texture Overlay

**Component:** `<Noise />`

**Props:**
- `patternSize`: 250 (default)
- `patternScaleX`: 1
- `patternScaleY`: 1
- `patternRefreshInterval`: 2 (frames)
- `patternAlpha`: 10 (transparency, 0-255)

**Usage:**
```tsx
<section className="relative overflow-hidden">
  <Noise patternAlpha={10} />
  <div className="relative z-10">
    {/* Content */}
  </div>
</section>
```

Creates a subtle animated grain texture overlay for visual interest.

### Backdrop Blur

**Header:**
```tsx
<header className="fixed top-0 left-0 right-0 bg-white/65 backdrop-blur-[10px] z-[1000]">
```

Creates a frosted glass effect with 10px blur.

---

## Grid Layouts

### Standard 3-Column Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### 2-Column Feature Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {/* Feature cards */}
</div>
```

### Complex Testimonial Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[minmax(200px,auto)] gap-6">
  <div className="col-span-1 md:col-span-3 row-span-1">{/* Large card */}</div>
  <div className="col-span-1 md:col-span-2 row-span-1">{/* Medium card */}</div>
  {/* More cards with varying spans */}
</div>
```

Uses CSS Grid with 6 columns and flexible row heights for masonry-like layout.

---

## Responsive Breakpoints

### Tailwind Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Common Responsive Patterns

**Text Sizing:**
```
text-4xl md:text-6xl xl:text-[72px]
```

**Padding:**
```
px-6 md:px-20 lg:px-32 xl:px-48
```

**Layout:**
```
flex-col md:flex-row
grid-cols-1 md:grid-cols-3
```

**Gaps:**
```
gap-2 md:gap-4
```

**Visibility:**
```
hidden md:flex
hidden md:inline
```

---

## Using ReactBits MCP

### Available via MCP Server

The project has access to ReactBits components through the MCP (Model Context Protocol) server. These are pre-built, animated React components.

### How to Use

1. **Search for components:**
   ```
   Search ReactBits for "button", "card", "animation", etc.
   ```

2. **Get component code:**
   ```
   Get ReactBits component "component-name"
   ```

3. **Integration:**
   - Components use Tailwind CSS (compatible with this project)
   - May use Framer Motion (already installed)
   - Copy component code into `app/components/`
   - Import and use in pages

### Recommended Components

- Animated buttons and CTAs
- Card hover effects
- Background patterns
- Loading states
- Interactive elements
- Scroll animations

---

## Best Practices

### 1. Consistency

- Use the defined color palette consistently
- Stick to the spacing scale (multiples of 4px/0.25rem)
- Maintain border radius patterns per component type
- Follow typography hierarchy

### 2. Accessibility

- Maintain color contrast ratios (WCAG AA minimum)
- Use semantic HTML elements
- Include alt text for images
- Ensure interactive elements are keyboard accessible
- Use `aria-label` for icon buttons

### 3. Performance

- Use Next.js Image component for optimized images
- Lazy load components below the fold
- Minimize animation complexity
- Use CSS transforms for animations (GPU-accelerated)

### 4. Responsive Design

- Mobile-first approach
- Test at all breakpoints
- Use responsive utilities consistently
- Ensure touch targets are at least 44x44px

### 5. Motion

- Keep animations subtle and purposeful
- Use consistent timing (300ms for most transitions)
- Respect `prefers-reduced-motion` for accessibility
- Avoid animations that could cause motion sickness

---

## File Structure

```
app/
├── app/
│   ├── page.tsx          # Main landing page
│   ├── globals.css       # Global styles, animations
│   └── layout.tsx        # Root layout
├── components/
│   ├── Header.tsx        # Fixed header with backdrop blur
│   ├── Slideshow.tsx     # Animated image slideshow
│   ├── Ticker.tsx        # Vertical scrolling ticker
│   └── Noise.tsx         # Grain texture overlay
├── contexts/
│   └── LanguageContext.tsx  # i18n context
└── lib/
    └── translations.ts   # Translation strings
```

---

## Quick Reference

### Most Used Colors
- Background: `bg-white`, `bg-[#FAFAFA]`
- Text: `text-[#09090B]`, `text-[#71717B]`
- Borders: `border-[#E4E4E7]`
- Buttons: `bg-[#09090B]`, `text-white`

### Most Used Spacing
- Section: `py-20`
- Card: `p-6` or `p-8`
- Gap: `gap-6` or `gap-8`
- Padding: `px-6 md:px-20 lg:px-32 xl:px-48`

### Most Used Radii
- Cards: `rounded-2xl` or `rounded-3xl`
- Buttons: `rounded-full` or `rounded-lg`
- Badges: `rounded-full`

### Most Used Shadows
- Subtle: `shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]`
- Elevated: `shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),...]`

---

## Notes

- This design system prioritizes clean, modern aesthetics
- Gradients are used sparingly for visual interest
- Animations are subtle and enhance UX without distraction
- The monochromatic base allows gradient accents to stand out
- Responsive design ensures consistency across all devices
- Framer Motion is available but not yet implemented (ready for advanced animations)
