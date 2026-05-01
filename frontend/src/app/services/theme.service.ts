import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'fraudexia-theme-mode';

  private mode: ThemeMode = 'light';

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  init(): ThemeMode {
    this.mode = this.readStoredMode();
    this.applyTheme();
    return this.mode;
  }

  setMode(mode: ThemeMode): void {
    this.mode = mode;
    this.persistMode(mode);
    this.applyTheme();
  }

  private readStoredMode(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === 'light' || raw === 'dark') {
      return raw;
    }

    return 'light';
  }

  private persistMode(mode: ThemeMode): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.storageKey, mode);
  }

  private applyTheme(): void {
    const root = this.document.documentElement;

    root.setAttribute('data-theme', this.mode);
    root.setAttribute('data-theme-mode', this.mode);
    root.style.colorScheme = this.mode;

    const themeColor = this.document.querySelector('meta[name="theme-color"]');
    if (themeColor instanceof HTMLMetaElement) {
      themeColor.content = this.mode === 'dark' ? '#171a2b' : '#6C63FF';
    }
  }
}