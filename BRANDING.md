# TrueVoice HQ Branding Guide

## Logo
**Location:** `/public/truevoice-logo.jpg`

**Usage:**
```jsx
<img src="/truevoice-logo.jpg" alt="TrueVoice HQ" className="h-8" />
```

## Color Palette

### Primary Colors
- **TRUE Green (Bright, energetic):** `#A8E34A`
  - Tailwind: `bg-true-green`, `text-true-green`
  - CSS Variable: `hsl(83 73% 59%)`
  - Use for: Primary actions, "TRUE" text in logo, highlights

- **VoiceHQ Green (Deep, professional):** `#0A5C36`
  - Tailwind: `bg-voicehq-green`, `text-voicehq-green`
  - CSS Variable: `hsl(152 80% 20%)`
  - Use for: "voiceHQ" text in logo, secondary elements, trust signals

- **Background White:** `#FFFFFF`
  - Tailwind: `bg-background`
  - Use for: Main backgrounds, cards

### Supporting Colors
- **Dark Background (Dark mode):** `#1A2F2A`
  - Tailwind: `bg-truevoice-dark`
  - CSS Variable: `hsl(166 29% 14%)`
  - Use for: Dark mode backgrounds, footer

- **Light Gray Accent:** `#F4F7F5`
  - Tailwind: `bg-truevoice-light`
  - CSS Variable: `hsl(140 15% 96%)`
  - Use for: Subtle backgrounds, sections

- **Neutral Gray (Body text):** `#64748B`
  - Tailwind: `text-truevoice-gray`
  - CSS Variable: `hsl(215 16% 47%)`
  - Use for: Body text, secondary info, muted content

- **Accent / CTA (Emerald green):** `#10B981`
  - Tailwind: `bg-truevoice-accent`, `bg-accent`
  - CSS Variable: `hsl(160 84% 39%)`
  - Use for: Buttons, links, call-to-action elements

## Typography
- **Font Family:** Inter (system-ui fallback)
- **Headings:** Bold (700), letter-spacing: -0.025em
- **Body:** Regular (400), Neutral Gray (#64748B)

## Component Examples

### Buttons
```jsx
// Primary CTA
<Button className="bg-truevoice-accent hover:bg-truevoice-accent/90">
  Start Interview
</Button>

// Secondary
<Button variant="outline" className="border-voicehq-green text-voicehq-green">
  Learn More
</Button>
```

### Cards
```jsx
<div className="bg-truevoice-light border border-border rounded-xl p-6">
  <h3 className="text-voicehq-green font-bold">Card Title</h3>
  <p className="text-truevoice-gray">Card description</p>
</div>
```

### Gradient Backgrounds
```css
background: linear-gradient(135deg, #A8E34A, #10B981);
/* TRUE Green → Emerald */
```

## Logo Variants
- **Full Color:** "TRUE" in #A8E34A, "voiceHQ" in #0A5C36
- **Dark Mode:** Adjust brightness for visibility on dark backgrounds
- **Minimum Size:** 120px width (maintain readability)

## Spacing & Layout
- **Border Radius:** 0.75rem (12px) for cards, 0.5rem (8px) for buttons
- **Container Max Width:** 1400px
- **Section Padding:** 2rem mobile, 4rem desktop

## Voice & Tone
- **Confident** but not aggressive
- **Professional** with human warmth
- **Trustworthy** through transparency
- **Innovative** but accessible
