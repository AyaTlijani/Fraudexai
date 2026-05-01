# Fraudexia Hero Component - Visual Design Specifications

## 📐 Layout Architecture

### Desktop View (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────────────────┐    ┌────────────────────────────┐ │
│  │                          │    │                            │ │
│  │  FRAUDEXIA               │    │    ╔═══════════════════╗   │ │
│  │  (Large Gradient Text)   │    │    ║                   ║   │ │
│  │                          │    │    ║   SMARTPHONE     ║   │ │
│  │  Payment methods with    │    │    ║   (Animated)     ║   │ │
│  │  devices. Smart and      │    │    ║                   ║   │ │
│  │  safe online management. │    │    ╚═══════════════════╝   │ │
│  │                          │    │    ╭──────────────╮         │ │
│  │  ┌──────────────────────┐│    │   ╱ BANK BUILDING ╲        │ │
│  │  │ Welcome →            ││    │  (Animated)       │ 👥👥   │ │
│  │  └──────────────────────┘│    │  ╰────────────────╯   👥   │ │
│  │                          │    │   $ ₿ 💳 Icons        │   │ │
│  └──────────────────────────┘    └────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px-1024px)
```
┌────────────────────────────────────────────────┐
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  FRAUDEXIA                               │ │
│  │  (Large Text)                            │ │
│  │                                          │ │
│  │  Payment methods with devices...         │ │
│  │  ┌────────────────────────────────────┐ │ │
│  │  │ Welcome →                          │ │ │
│  │  └────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │      SMARTPHONE & BANK BUILDING          │ │
│  │      AND PEOPLE (Centered)               │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌──────────────────────────────┐
│                              │
│  FRAUDEXIA                   │
│  (Medium Text)               │
│                              │
│  Payment methods with        │
│  devices. Smart and safe     │
│  online management.          │
│                              │
│  ┌────────────────────────┐ │
│  │ Welcome →              │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │  SMARTPHONE            │ │
│  │  BANK BUILDING & PEOPLE│ │
│  │  (Stacked Layout)      │ │
│  └────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

## 🎨 Color Breakdown

### Primary Colors
- **Fraudexia Title**: Gradient from #6C63FF → #4B0082 (left to right)
- **Background**: Linear gradient #F8F9FF → transparent #6C63FF (135deg)

### SVG Elements
- **Smartphone Frame**: #6C63FF with darker #4B0082 details
- **Smartphone Screen**: #F0F0F0 (light gray)
- **Bank Building**: Multiple layers of #6C63FF and #4B0082
- **Financial Icons**: #FFD700 (Gold accent color)
- **People Figures**: #6C63FF and #9D8FFF (varying opacity)

### Background Blobs
- **Blob 1**: Positioned top-left with #9D8FFF fill, 30% opacity
- **Blob 2**: Positioned bottom-right with #9D8FFF fill, 25% opacity

## 🎬 Animation Timeline

```
Timeline: 0ms ────────────────────────── 800ms ────────────────── 1500ms
          │                              │                        │
          └→ Hero Container fades in    │                        │
             (fadeInUp 800ms)           │                        │
                                        │                        │
                    100ms →→→→→→→→→→→→→└→ Content slides in     │
                    (slideInLeft 800ms,  (after 300ms delay)     │
                    300ms delay)                                  │
                                                                  │
                         150ms →→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→└ Illustration
                         (slideInRight 800ms, 400ms delay)       slides in
```

## 🏗️ Component Hierarchy

```
HeroContainer (hero-container)
├── HeroContent (hero-content)
│   ├── Title (hero-title)
│   │   └─ "FRAUDEXIA" [Gradient Text]
│   ├── Subtitle (hero-subtitle)
│   │   └─ "Payment methods with devices..."
│   └── CTA Button (cta-button)
│       ├─ Button Text: "Welcome"
│       └─ Icon: "→"
│
└── HeroIllustration (hero-illustration)
    └── SVG (illustration-svg)
        ├── Defs (Gradients, Filters)
        ├── Background Blobs
        ├── Smartphone Group
        ├── Bank Building Group
        ├── People Group (3 figures)
        └── Financial Icons
```

## 📏 Key Measurements

### Desktop (1440px viewport)
- Hero Container: min-height 100vh
- Gap between sections: 60px
- Padding: 60px 40px
- Title Font Size: 4rem (~64px)
- Subtitle Font Size: 1.25rem (~20px)
- Button Padding: 16px 40px
- SVG Max Width: 500px
- SVG Max Height: 600px

### Tablet (768px viewport)
- Hero Container: Single column layout
- Gap: 40px
- Padding: 40px 30px
- Title Font Size: 3rem (~48px)
- Subtitle Font Size: 1.1rem (~18px)
- SVG Max Width: 400px
- SVG Max Height: 500px

### Mobile (375px viewport)
- Hero Container: Single column layout
- Gap: 30px
- Padding: 30px 20px
- Title Font Size: 2.5rem (~40px)
- Subtitle Font Size: 1rem (~16px)
- Button: Full responsive sizing
- SVG Max Width: 350px
- SVG Max Height: 450px

## 🎭 SVG Illustration Details

### Smartphone Element
```
Position: Center-left of illustration
Dimensions: 200x380 (25:47.5 aspect ratio)
Content:
  - Outer Frame: #6C63FF gradient
  - Notch: #333 (dark gray)
  - Screen: #F0F0F0 (light)
  - Interior Elements:
    - Circle indicator: #6C63FF at 50% opacity
    - Bars: Stepped opacity levels (50%, 40%, 30%)
Animation: Float 4 seconds, continuous
```

### Bank Building Element
```
Position: Lower-right of illustration  
Dimensions: 100x160
Colors:
  - Base: #6C63FF at 60% opacity
  - Door: #4B0082
  - Door Handle: #FFD700 (gold)
  - Windows: 3x3 grid
  - Window Color: #4B0082 at 80% opacity
  - Roof: Triangle, #4B0082 at 90% opacity
  - Flag: #FFD700 on building peak
Animation: Float 5 seconds, 0.5s delay
```

### People Figures (3 total)
```
Position: Bottom of illustration, spread across
Each Person:
  - Head: Circle, 8px radius
  - Body: Rectangle, 12x20px
  - Arms: Lines, 8px length
  - Colors: Mix of #6C63FF and #9D8FFF

Associated Elements:
  - Person 1: Gold coins (representation of transaction)
  - Person 2: Credit card icon (blue background)
  - Person 3: Shield icon (security representation)

Animation: Float 6 seconds, 1s delay
```

### Financial Icons
```
Dollar Sign ($):
  - Position: Left-center area
  - Font Size: 36px
  - Color: #FFD700
  - Opacity: 40%

Bitcoin Symbol (₿):
  - Position: Right side
  - Size: Circle border + symbol
  - Color: #FFD700
  - Opacity: 50%

Animation: Pulse 3 seconds, continuous
```

### Background Blobs
```
Blob 1:
  - Position: Upper-left (100, 150)
  - Radius: 80px
  - Fill: #9D8FFF gradient
  - Opacity: 30%
  - Animation: Pulse 4 seconds

Blob 2:
  - Position: Lower-right (450, 450)
  - Radius: 100px
  - Fill: #9D8FFF gradient
  - Opacity: 25%
  - Animation: Pulse 4 seconds, 1s delay
```

## 🎯 Button States

### Normal/Idle State
```
┌──────────────────────────┐
│  Welcome →               │
└──────────────────────────┘
Background: Gradient #6C63FF → #4B0082
Color: White
Shadow: 0 10px 30px rgba(108, 99, 255, 0.3)
```

### Hover State
```
┌──────────────────────────┐
│  Welcome  →              │ ↑ (translateY -4px)
└──────────────────────────┘
Background: Same gradient
Color: White
Shadow: 0 15px 40px rgba(108, 99, 255, 0.4) [Stronger]
Arrow Icon: Shifts right 4px
```

### Active/Click State
```
┌──────────────────────────┐
│  Welcome →               │ ↑ (translateY -2px)
└──────────────────────────┘
Background: Same gradient
Color: White
Shadow: Intermediate
Scale: 98% (slight compress)
```

## 📊 Typography Scale

```
Desktop
├─ Heading 1 (Title):       64px, weight 800, line-height 1.2
├─ Heading 2 (Subtitle):    20px, weight 400, line-height 1.6
└─ Button Text:             18px, weight 600

Tablet
├─ Heading 1:               48px
├─ Heading 2:               18px
└─ Button Text:             16px

Mobile
├─ Heading 1:               40px
├─ Heading 2:               16px
└─ Button Text:             16px
```

## 🌈 Gradient Definitions

### Purple Main Gradient (Used for titles and buttons)
```
Direction: 135deg (↙)
Start: #6C63FF (108, 99, 255) @ 0%
End: #4B0082 (75, 0, 130) @ 100%
Usage: Text fill, button background
```

### Light Purple Gradient (Used for decorative blobs)
```
Direction: 135deg
Start: #9D8FFF @ 0% with 60% opacity
End: #6C63FF @ 100% with 40% opacity
Usage: SVG element fills, background accents
```

## 🔐 Shadow & Depth

### Drop Filter (SVG Illustration)
```
Horizontal Offset: 0px
Vertical Offset: 20px
Blur Radius: 40px
Color: #6C63FF
Opacity: 15%
Effect: Subtle depth below illustration
```

### Button Shadow
```
Idle: 0 10px 30px rgba(108, 99, 255, 0.3)
Hover: 0 15px 40px rgba(108, 99, 255, 0.4)
Transition: 0.3s ease
Effect: Lifting effect on hover
```

## ♿ Accessibility Features

### Visual
- Minimum color contrast ratio: 7:1 (WCAG AAA)
- Color is not sole method of communication
- Text is always readable over backgrounds

### Interactive
- All buttons have hover states
- Focus-visible outline: 3px solid #6C63FF
- Focus-visible offset: 2px
- ARIA label on CTA button

### Motion
- All animations respect `prefers-reduced-motion: reduce`
- Animations have clear start/end states
- No animation duration less than 100ms start delay

## 📏 Grid & Flexbox Layout

### Desktop (2-column Grid)
```
grid-template-columns: 1fr 1fr
gap: 60px
align-items: center
```

### Mobile (1-column Grid)
```
grid-template-columns: 1fr
gap: 30px
align-items: stretch
```

### Content Flex Container
```
display: flex
flex-direction: column
justify-content: center
gap: 30px
```

---

**Note**: All visual measurements are approximate and scale responsively using `clamp()` for fluid typography and flexible spacing.
