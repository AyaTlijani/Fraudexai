# Fraudexia Landing Page Hero Component

A modern, responsive Angular hero section component featuring a purple color palette, custom SVG illustrations, and smooth animations.

## Features

✨ **Component Features:**
- Fully responsive design (mobile, tablet, desktop)
- Animated SVG illustrations (smartphone, bank building, people, financial icons)
- Smooth fade-in and slide-in animations
- Floating element animations
- Accessible ARIA labels
- Dark mode support
- Reduced motion support for accessibility
- Flexbox + CSS Grid layout
- TypeScript class with animation state management

## Color Palette

- **Primary Purple**: `#6C63FF`
- **Dark Purple**: `#4B0082`
- **Light Purple**: `#9D8FFF`
- **Accent Gold**: `#FFD700`

## Component Structure

```
frontend/
├── src/
│   └── app/
│       ├── app.component.ts (Root component using HeroComponent)
│       └── components/
│           └── hero/
│               ├── hero.component.ts (Component logic)
│               ├── hero.component.html (Template with SVG)
│               └── hero.component.scss (Responsive styling)
```

## File Descriptions

### hero.component.ts
- **Purpose**: Contains component logic and animation state management
- **Key Features**:
  - `AnimationState` interface for tracking hero and content visibility
  - Lifecycle hook to trigger staggered animations
  - `onWelcomeClick()` method for CTA button interaction

### hero.component.html
- **Purpose**: Contains the responsive layout and complex SVG illustration system
- **Sections**:
  1. **Left Content**: Title, subtitle, and Welcome button
  2. **Right Illustration**: Multi-layered SVG with:
     - Gradient definitions for smooth color transitions
     - Drop shadow filters
     - Smartphone element with notch and screen content
     - Bank building with windows, door, and roof
     - Small people figures with financial elements
     - Floating financial icons (dollar signs, crypto symbols)
     - Animated background blob shapes

### hero.component.scss
- **Purpose**: Complete styling with responsive breakpoints
- **Key Sections**:
  - Animation keyframes (fadeInUp, slideInLeft, slideInRight, float, pulse)
  - Responsive grid layout (desktop: 2 columns, mobile: 1 column)
  - Mobile-first design with breakpoints at 1024px, 768px, and 480px
  - Dark mode media query support
  - Reduced motion support for accessibility
  - Advanced button hover states with visual feedback

## Responsive Breakpoints

| Device | Max Width | Layout | Grid Columns |
|--------|-----------|---------|--------------|
| Desktop | 1024px+ | Side-by-side | 1fr 1fr |
| Tablet | 1024px | Single column | 1fr |
| Mobile | 768px | Single column | 1fr |
| Small Mobile | 480px | Single column with optimized spacing | 1fr |

## Usage

### Basic Implementation

```typescript
// In your main app component or routing module
import { HeroComponent } from './components/hero/hero.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeroComponent],
  template: `<app-hero></app-hero>`
})
export class AppComponent {}
```

### With Routing

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { HeroComponent } from './components/hero/hero.component';

export const routes: Routes = [
  { path: '', component: HeroComponent }
];
```

## Customization

### Change Colors

Modify the SCSS variables at the top of `hero.component.scss`:

```scss
$primary-purple: #6C63FF;    // Change primary color
$dark-purple: #4B0082;        // Change dark accent
$light-purple: #9D8FFF;       // Change light accent
$accent-gold: #FFD700;        // Change accent color
```

### Update Text Content

Edit the HTML in `hero.component.html`:

```html
<h1 class="hero-title">Your Title</h1>
<p class="hero-subtitle">Your subtitle here</p>
<button class="cta-button" (click)="onWelcomeClick()">Your Button Text</button>
```

### Customize SVG Elements

The SVG contains several customizable elements:

1. **Smartphone**: Modify `x`, `y`, `width`, `height` attributes in the `smartphone` group
2. **Bank Building**: Adjust colors and dimensions in the `bank-building` group
3. **People**: Customize positions and styles in the `people-group` section
4. **Financial Icons**: Change symbols in the `financial-icons` group

Example - Change smartphone accent color:

```html
<rect x="165" y="100" width="170" height="340" rx="20" fill="#YOUR_COLOR" />
```

### Adjust Animation Timing

Modify the duration and delay values in SCSS:

```scss
.smartphone {
  animation: float 4s ease-in-out infinite;  // Change 4s for duration
}
```

## Animation Details

### Types of Animations

1. **fadeInUp**: Container fades in and moves up
2. **slideInLeft**: Content slides in from left
3. **slideInRight**: Illustration slides in from right
4. **float**: Continuous vertical floating motion
5. **pulse**: Subtle opacity pulsing effect

### Animation Timing

- Hero container: 800ms (immediate)
- Content fade-in: 300ms delay + 800ms duration
- Illustration fade-in: 400ms delay + 800ms duration
- Floating elements: 4-6 second cycles with staggered delays

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 12+)
- IE11: Not supported (uses CSS Grid, modern SCSS features)

## Accessibility Features

✅ **Implemented:**
- ARIA label on CTA button
- Semantic HTML structure
- Color contrast compliance (WCAG AA)
- Reduced motion support (`prefers-reduced-motion: reduce`)
- SVG uses `viewBox` for responsive scaling
- Text hierarchy with proper heading levels

## Performance Considerations

⚡ **Optimizations:**
- CSS Grid and Flexbox for efficient layout
- Transform and opacity animations (GPU accelerated)
- SVG uses filters and gradients for visual effects
- Standalonecomponent (no NgModule overhead)
- OnPush change detection ready (can be added)
- Filter and animation declarations in CSS

## Integration with Backend

To connect the Welcome button to backend navigation:

```typescript
// hero.component.ts
import { Router } from '@angular/router';

constructor(private router: Router) {}

onWelcomeClick(): void {
  this.router.navigate(['/dashboard']);  // Navigate to desired route
  // Or: window.location.href = '/your-path';  // Full page navigation
}
```

## Known Limitations & Enhancements

### Current Limitations
- SVG decorations are static (no interactive elements)
- Limited to 3 people figures in illustration

### Possible Enhancements
- Make SVG elements interactive (clickable icons)
- Add parallax scrolling effect
- Implement Lottie animations for more complex illustrations
- Add video background option
- Create variant layouts (left-aligned, centered, full-width)
- Add language i18n support

## Dependencies

- Angular 17.0+ (standalone components)
- No external UI library required
- CSS3 with SCSS support

## Browser Console Logging

The component logs "Welcome button clicked" to console. To extend this:

```typescript
onWelcomeClick(): void {
  console.log('Welcome button clicked');
  // Add your custom logic here
  this.router.navigate(['/your-page']);
}
```

## Testing

Example unit test structure:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
  let component: HeroComponent;
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger animations on init', (done) => {
    setTimeout(() => {
      expect(component.animationState.heroVisible).toBe(true);
      expect(component.animationState.contentVisible).toBe(true);
      done();
    }, 400);
  });

  it('should call onWelcomeClick when button is clicked', () => {
    spyOn(component, 'onWelcomeClick');
    const button = fixture.nativeElement.querySelector('.cta-button');
    button.click();
    expect(component.onWelcomeClick).toHaveBeenCalled();
  });
});
```

## Global Styles Setup

Add to your global `styles.scss`:

```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2D2D2D;
  background-color: #FFFFFF;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a2e;
    color: #F0F0F0;
  }
}
```

## License

This component is part of the PROGET PI project. Modify and use freely for your project needs.

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Framework**: Angular 17+
