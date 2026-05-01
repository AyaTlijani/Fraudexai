# Angular Project Setup Guide for Fraudexia Hero Component

This guide provides setup instructions for the PROGET PI frontend Angular project.

## Prerequisites

- Node.js 18.0+ 
- npm 9.0+ or yarn 3.0+
- Angular CLI 17.0+

## Quick Start

### 1. Install Angular CLI (if not already installed)

```bash
npm install -g @angular/cli@17
```

### 2. Create a New Angular Project (if starting fresh)

```bash
cd frontend
ng new fraudexia-app --routing --style=scss --skip-git
cd fraudexia-app
```

**Or**, if you already have a project structure:

```bash
cd frontend
npm install
```

### 3. Copy Component Files

The hero component files should be placed in:

```
src/app/components/hero/
├── hero.component.ts
├── hero.component.html
├── hero.component.scss
└── hero.module.ts (optional, for non-standalone)
```

### 4. Update Required Dependencies

Make sure your `package.json` includes:

```json
{
  "name": "fraudexia-frontend",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@types/jasmine": "^5.1.0",
    "jasmine-core": "^5.1.0",
    "karma": "^6.4.0",
    "karma-chrome-launcher": "^3.2.0",
    "karma-coverage": "^2.2.0",
    "karma-jasmine": "^5.1.0",
    "karma-jasmine-html-reporter": "^2.1.0",
    "typescript": "~5.2.0"
  }
}
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Update Main Application Component

Edit `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeroComponent],
  template: `<app-hero></app-hero>`,
  styles: []
})
export class AppComponent {
  title = 'fraudexia-frontend';
}
```

### 7. Update Global Styles

Edit `src/styles.scss`:

```scss
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica', 
              'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #F8F9FF 0%, rgba(108, 99, 255, 0.05) 100%);
}

@media (prefers-color-scheme: dark) {
  body {
    background: linear-gradient(135deg, #1a1a2e 0%, rgba(108, 99, 255, 0.1) 100%);
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #6C63FF;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4B0082;
}
```

### 8. Update Angular Configuration

Ensure `angular.json` has SCSS support configured:

```json
{
  "projects": {
    "fraudexia-app": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/fraudexia-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        }
      }
    }
  }
}
```

### 9. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

## Project Structure Recommendation

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── hero/
│   │   │   │   ├── hero.component.ts
│   │   │   │   ├── hero.component.html
│   │   │   │   ├── hero.component.scss
│   │   │   │   └── hero.component.spec.ts
│   │   │   ├── navbar/
│   │   │   ├── footer/
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── ...
│   │   ├── guards/
│   │   │   └── ...
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── ...
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── ...
│   ├── styles.scss
│   ├── main.ts
│   ├── index.html
│   └── ...
├── angular.json
├── tsconfig.json
├── package.json
├── README.md
└── ...
```

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run unit tests
npm test

# Run linting
npm run lint

# Build and watch for changes
npm run watch
```

## Troubleshooting

### Common Issues

#### 1. SCSS Not Compiling

**Solution**: Ensure `styles.scss` is referenced in `angular.json`:

```json
"styles": ["src/styles.scss"]
```

#### 2. Hero Component Not Found

**Solution**: Verify the component path and ensure it's imported correctly:

```typescript
import { HeroComponent } from './components/hero/hero.component';
```

#### 3. Animations Not Working

**Solution**: Add `@angular/animations` to imports (usually automatic):

```bash
npm install @angular/animations
```

#### 4. SVG Not Displaying

**Solution**: Ensure `preserveAspectRatio="xMidYMid meet"` is set on the SVG element. The component already includes this.

#### 5. Styles Not Applied

**Solution**: 
- Clear browser cache (Ctrl+Shift+R)
- Rebuild: `ng build --configuration development`
- Check that SCSS syntax is correct (no typos in variable names)

## Building for Production

```bash
# Build optimized production bundle
ng build --configuration production

# The build artifacts will be stored in the `dist/` directory

# To serve the production build locally:
npx http-server dist/fraudexia-app
```

## Deployment

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
ng build --configuration production
netlify deploy --prod --dir=dist/fraudexia-app
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
ng build --configuration production
vercel --prod
```

### Deploy to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
ng build --configuration production
firebase deploy
```

## Environment Configuration

Create environment files for different configurations:

**src/environments/environment.ts** (development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**src/environments/environment.prod.ts** (production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.fraudexia.com'
};
```

## Performance Tips

1. **Enable OnPush Change Detection**: Add to hero component
```typescript
@Component({
  ...,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

2. **Lazy Load Routes**: 
```typescript
const routes: Routes = [
  { path: '', loadComponent: () => import('./components/hero/hero.component').then(m => m.HeroComponent) }
];
```

3. **Use Production Build**:
```bash
ng serve --configuration production
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run E2E Tests (if configured)

```bash
ng e2e
```

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI Guide](https://angular.io/cli)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SCSS Documentation](https://sass-lang.com/documentation)

## Next Steps

1. ✅ Copy component files to `src/app/components/hero/`
2. ✅ Install dependencies with `npm install`
3. ✅ Update `app.component.ts` to use HeroComponent
4. ✅ Update global styles in `src/styles.scss`
5. ✅ Run `npm start` to see the hero component
6. ✅ Customize colors, texts, and styles as needed
7. ✅ Add additional pages/components as required
8. ✅ Deploy to your preferred hosting platform

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Node Version Required**: 18.0+  
**Angular Version**: 17.0+
