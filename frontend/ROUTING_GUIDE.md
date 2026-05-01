# Fraudexia Application - Navigation & Routing Guide

## Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Fraudexia Application                        │
└─────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │ Hero Page    │
                            │ (Landing)    │
                            │ Route: /     │
                            └──────────────┘
                                   │
                          (Welcome button click)
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Selection    │
                            │ Page         │
                            │ Route: /select
                            └──────────────┘
                                   │
                    ┌──────────────┬┴──────────────┐
                    │                             │
         (Client card click)          (Admin card click)
                    │                             │
                    ▼                             ▼
            ┌──────────────┐            ┌──────────────┐
            │ Client       │            │ Admin        │
            │ Dashboard    │            │ Dashboard    │
            │ Route:       │            │ Route:       │
            │ /client-dash │            │ /admin-dash  │
            └──────────────┘            └──────────────┘
                    │                             │
         (Back button click)          (Back button click)
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Selection    │
                            │ Page         │
                            │ (Returns)    │
                            └──────────────┘
                                   │
                         (Back button click)
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Hero Page    │
                            │ (Returns)    │
                            └──────────────┘
```

## Routes Configuration

### File: `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  // Home/Landing Page
  { path: '', component: HeroComponent },
  
  // Selection Page
  { path: 'select', component: SelectionComponent },
  
  // Dashboard Pages
  { path: 'client-dashboard', component: ClientDashboardComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  
  // Wildcard route (catch-all)
  { path: '**', redirectTo: '' }
];
```

## Component Hierarchy

```
AppComponent (root-outlet)
    │
    ├─ Route: /
    │   └─ HeroComponent
    │       ├─ Title: "Fraudexia"
    │       ├─ Subtitle: "Payment methods with devices..."
    │       └─ Welcome Button → Navigate to /select
    │
    ├─ Route: /select
    │   └─ SelectionComponent
    │       ├─ Back Button → Navigate to /
    │       ├─ Client Card → Navigate to /client-dashboard
    │       └─ Admin Card → Navigate to /admin-dashboard
    │
    ├─ Route: /client-dashboard
    │   └─ ClientDashboardComponent
    │       └─ Back Button → Navigate to /select
    │
    └─ Route: /admin-dashboard
        └─ AdminDashboardComponent
            └─ Back Button → Navigate to /select
```

## Detailed Page Information

### 1. Hero Component (Landing Page)
**Route**: `/` (default/home)

**Purpose**: Welcome users and introduce Fraudexia

**Features**:
- Large title with gradient effect
- Subtitle describing the service
- Call-to-action "Welcome" button
- SVG illustration (smartphone, bank, people)
- Responsive 2-column layout

**Navigation**:
- Clicking "Welcome" → Navigate to `/select`

**Files**:
- `src/app/components/hero/hero.component.ts`
- `src/app/components/hero/hero.component.html`
- `src/app/components/hero/hero.component.scss`

---

### 2. Selection Component (Role Selection)
**Route**: `/select`

**Purpose**: Allow users to choose their account type (Client or Administrator)

**Features**:
- Two interactive selection cards
- Card hover effects (scale + pink background)
- SVG icons for each role
- Back button to return home
- Responsive grid layout (2 columns desktop, 1 column mobile)

**Cards**:
1. **Client Card**
   - Icon: Person with shopping cart
   - Description: "Manage your payments securely"
   - Click → Navigate to `/client-dashboard`

2. **Administrator Card**
   - Icon: Person with shield/dashboard
   - Description: "Oversee and manage the system"
   - Click → Navigate to `/admin-dashboard`

**Navigation**:
- Clicking "Client" card → Navigate to `/client-dashboard`
- Clicking "Administrator" card → Navigate to `/admin-dashboard`
- Clicking "Back" button → Navigate to `/`

**Files**:
- `src/app/components/selection/selection.component.ts`
- `src/app/components/selection/selection.component.html`
- `src/app/components/selection/selection.component.scss`

---

### 3. Client Dashboard
**Route**: `/client-dashboard`

**Purpose**: Placeholder dashboard for client users

**Features**:
- Welcome message
- Back button to return to selection

**Navigation**:
- Clicking "Back" button → Navigate to `/select`

**Files**:
- `src/app/components/dashboards/client-dashboard.component.ts`

**Note**: This is a placeholder component. Replace with actual client dashboard implementation.

---

### 4. Admin Dashboard
**Route**: `/admin-dashboard`

**Purpose**: Placeholder dashboard for administrator users

**Features**:
- Welcome message
- Back button to return to selection

**Navigation**:
- Clicking "Back" button → Navigate to `/select`

**Files**:
- `src/app/components/dashboards/admin-dashboard.component.ts`

**Note**: This is a placeholder component. Replace with actual admin dashboard implementation.

---

## Navigation Implementation

### Hero Component Navigation

```typescript
// src/app/components/hero/hero.component.ts

constructor(private router: Router) {}

onWelcomeClick(): void {
  console.log('Welcome button clicked');
  this.router.navigate(['/select']);
}
```

### Selection Component Navigation

```typescript
// src/app/components/selection/selection.component.ts

onCardClick(cardId: string): void {
  if (cardId === 'client') {
    this.router.navigate(['/client-dashboard']);
  } else if (cardId === 'administrator') {
    this.router.navigate(['/admin-dashboard']);
  }
}

onBackClick(): void {
  this.router.navigate(['/']);
}
```

## Router Setup

### Main Bootstrap File: `src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)  // Provides routing to the application
  ]
}).catch(err => console.error(err));
```

### Root Component: `src/app/app.component.ts`

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],  // Required for routing to work
  template: `<router-outlet></router-outlet>`  // Renders active route
})
export class AppComponent {}
```

**Key Point**: `<router-outlet>` is the placeholder where Angular renders the active component based on the current route.

## Programmatic Navigation

Both methods are equivalent:

```typescript
// Method 1: Single path
this.router.navigate(['/select']);

// Method 2: With navigation extras
this.router.navigate(['/client-dashboard'], {
  queryParams: { id: '123' },
  state: { data: 'some-data' }
});
```

## URL Structure

```
Base URL: http://localhost:4200

Home Page (Hero):          http://localhost:4200/
Selection Page:            http://localhost:4200/select
Client Dashboard:          http://localhost:4200/client-dashboard
Admin Dashboard:           http://localhost:4200/admin-dashboard
Invalid Route:             http://localhost:4200/invalid → redirects to /
```

## Routing Guards (Optional Future Enhancement)

To add authentication/authorization:

```typescript
// auth.guard.ts
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getUser();
    if (user) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

// Then add to routes:
{
  path: 'admin-dashboard',
  component: AdminDashboardComponent,
  canActivate: [AuthGuard]
}
```

## Query Parameters & State (Optional)

Pass data between routes:

```typescript
// From Hero to Selection
this.router.navigate(['/select'], {
  state: { data: 'some-value' }
});

// Receive in Selection
constructor(private location: Location) {
  const navigation = this.location.getState();
  console.log(navigation?.data);  // Access passed data
}
```

## Lazy Loading Routes (Performance Enhancement)

For large applications:

```typescript
const routes: Routes = [
  { path: '', component: HeroComponent },
  {
    path: 'dashboards',
    loadComponent: () => import('./dashboards/dashboard.component')
      .then(m => m.DashboardComponent)
  }
];
```

## Browser History

The Angular Router integrates with browser history:

```
User clicks "Back" button
    ↓
router.navigate(['/'])
    ↓
URL changes to http://localhost:4200/
    ↓
Browser back button (⬅️) goes to previous URL in history
```

## Testing Navigation

Unit test example:

```typescript
it('should navigate to selection on Welcome click', () => {
  spyOn(router, 'navigate');
  component.onWelcomeClick();
  expect(router.navigate).toHaveBeenCalledWith(['/select']);
});
```

## Troubleshooting Navigation Issues

### Issue: Navigation not working
**Solution**: 
- Verify `provideRouter(routes)` is in bootstrapApplication
- Ensure `RouterOutlet` is in root component
- Check route paths match exactly (case-sensitive)

### Issue: Page not found (404 redirect)
**Solution**: 
- Verify wildcard route `{ path: '**', redirectTo: '' }` is at end of routes array
- Check component is correctly imported in routes file

### Issue: Router not injected
**Solution**:
```typescript
constructor(private router: Router) {}
```
Ensure Router is imported from `@angular/router`

### Issue: NavigationEnd event needed
**Solution**:
```typescript
import { Router, NavigationEnd } from '@angular/router';

constructor(private router: Router) {
  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
    console.log('Navigated to:', event.url);
  });
}
```

## Development Workflow

```bash
# Run development server
npm start
# Application starts at http://localhost:4200/

# Build for production
ng build --configuration production

# Run tests
ng test
```

## Future Enhancements

1. **Add Navigation Guards**
   - AuthGuard for protected routes
   - CanDeactivateGuard for unsaved changes

2. **Implement Breadcrumb Navigation**
   - Show current route in breadcrumbs
   - Allow jumping to parent routes

3. **Add Route Animations**
   - Fade-in/out between route changes
   - Slide transitions for page changes

4. **Implement Lazy Loading**
   - Load dashboard components only when needed
   - Improve initial load time

5. **Add Query Parameters**
   - Pass filter/sort parameters
   - Maintain state in URL

## Summary

✅ **Current Implementation**:
- 4 main routes (home, select, client-dash, admin-dash)
- Simple stack-based navigation
- All routes directly imported (eager loading)
- Direct navigation via router.navigate()

✅ **Navigation Flow**:
```
Home → Selection → Client/Admin Dashboard → Back to Selection → Back to Home
```

✅ **Technology Stack**:
- Angular v17+ standalone components
- @angular/router for navigation
- Programmatic navigation with Router.navigate()
- Browser history integration

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Framework**: Angular 17+
