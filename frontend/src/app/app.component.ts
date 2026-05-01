import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from './pipes/translate.pipe';
import { AppLanguage, LanguageService } from './services/language.service';
import { ThemeMode, ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe],
  template: `
    <div class="theme-top-bar">
      <div class="language-picker">
        <label for="lang-select" class="language-label">{{ 'app.language' | t }}</label>
        <select
          id="lang-select"
          class="language-select"
          [value]="currentLanguage"
          (change)="onLanguageChange($event)">
          <option value="fr">{{ 'app.language.fr' | t }}</option>
          <option value="en">{{ 'app.language.en' | t }}</option>
          <option value="ar">{{ 'app.language.ar' | t }}</option>
        </select>
      </div>

      <button
        type="button"
        class="theme-toggle-button"
        [attr.aria-label]="('app.theme.toggleAria' | t) + ' ' + (currentThemeMode === 'dark' ? ('app.theme.dark' | t) : ('app.theme.light' | t))"
        (click)="toggleTheme()">
        {{ 'app.theme' | t }}: {{ currentThemeMode === 'dark' ? ('app.theme.dark' | t) : ('app.theme.light' | t) }}
      </button>
    </div>

    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100vh;
    }

    .theme-top-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 0;
      pointer-events: auto;
    }

    .language-picker {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: 1px solid rgba(108, 99, 255, 0.28);
      border-radius: 999px;
      background: var(--theme-switcher-bg, rgba(255, 255, 255, 0.9));
      box-shadow: 0 8px 22px rgba(30, 30, 50, 0.12);
    }

    .language-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--theme-switcher-fg, #4b4b6b);
    }

    .language-select {
      border: 0;
      background: transparent;
      color: var(--theme-switcher-fg, #4b4b6b);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
    }

    .theme-toggle-button {
      border: 1px solid rgba(108, 99, 255, 0.28);
      border-radius: 999px;
      cursor: pointer;
      padding: 8px 14px;
      background: var(--theme-switcher-bg, rgba(255, 255, 255, 0.9));
      color: var(--theme-switcher-fg, #4b4b6b);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.01em;
      box-shadow: 0 8px 22px rgba(30, 30, 50, 0.12);
      transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease;
    }

    .theme-toggle-button:hover {
      transform: translateY(-1px);
      background: var(--theme-switcher-hover-bg, rgba(108, 99, 255, 0.08));
      border-color: rgba(108, 99, 255, 0.42);
    }

    @media (max-width: 720px) {
      .theme-top-bar {
        justify-content: space-between;
        padding: 10px 10px 0;
      }

      .language-label {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  protected currentThemeMode: ThemeMode;
  protected currentLanguage: AppLanguage;

  constructor(
    private readonly themeService: ThemeService,
    private readonly languageService: LanguageService
  ) {
    this.currentThemeMode = this.themeService.init();
    this.currentLanguage = this.languageService.init();
  }

  protected toggleTheme(): void {
    this.currentThemeMode = this.currentThemeMode === 'dark' ? 'light' : 'dark';
    this.themeService.setMode(this.currentThemeMode);
  }

  protected onLanguageChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value as AppLanguage;
    this.currentLanguage = selected;
    this.languageService.setLanguage(selected);
  }
}
