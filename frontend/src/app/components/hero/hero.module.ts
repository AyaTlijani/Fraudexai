// Optional: If not using standalone components
// Import and use this module in your app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { HeroComponent } from './hero.component';

@NgModule({
  declarations: [HeroComponent],
  imports: [BrowserModule, CommonModule],
  exports: [HeroComponent],
  providers: []
})
export class HeroModule { }

// Alternative: Using standalone components (RECOMMENDED)
// Simply import HeroComponent directly in your component:
// import { HeroComponent } from './components/hero/hero.component';
// 
// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [HeroComponent],
//   template: `<app-hero></app-hero>`
// })
// export class AppComponent {}
