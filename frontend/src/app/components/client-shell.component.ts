import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { UserService, UserClient } from '../services/user.service';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="shell-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <div class="logo-icon">F</div>
            <span class="logo-text">FraudExAI</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-group">
            <a routerLink="/client-hub" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
              <span class="icon">📊</span>
              <span class="label">{{ 'shell.dashboard' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">💼</span>
              <span class="label">{{ 'shell.accounts' | t }}</span>
            </a>
            <a routerLink="/client-hub/cards" routerLinkActive="active" class="nav-item">
              <span class="icon">💳</span>
              <span class="label">{{ 'shell.cards' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">📝</span>
              <span class="label">{{ 'shell.checks' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">📱</span>
              <span class="label">{{ 'shell.topup' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">📫</span>
              <span class="label">{{ 'shell.requests' | t }}</span>
            </a>
          </div>

          <div class="nav-divider"></div>

          <div class="nav-group">
            <a routerLink="/client-hub/converter" routerLinkActive="active" class="nav-item">
              <span class="icon">🔄</span>
              <span class="label">{{ 'shell.converter' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">🧮</span>
              <span class="label">{{ 'shell.simulator' | t }}</span>
            </a>
            <a class="nav-item disabled">
              <span class="icon">📍</span>
              <span class="label">{{ 'shell.branches' | t }}</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button (click)="onLogout()" class="logout-btn">
            <span class="icon">🚪</span>
            <span>{{ 'shell.logout' | t }}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --shell-bg: radial-gradient(circle at 15% 15%, #2f2154 0%, #17132f 42%, #0f0a1e 100%);
      --shell-text: #f4f6ff;
      --sidebar-bg: linear-gradient(185deg, rgba(27, 21, 47, 0.96) 0%, rgba(15, 12, 29, 0.96) 100%);
      --sidebar-border: rgba(166, 176, 255, 0.2);
      --logo-icon-bg: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%);
      --logo-icon-shadow: 0 12px 24px rgba(124, 58, 237, 0.35);
      --logo-text-gradient: linear-gradient(120deg, #f5f7ff 0%, #c4b5fd 45%, #7dd3fc 100%);
      --nav-color: rgba(226, 233, 255, 0.74);
      --nav-hover-color: #f8f9ff;
      --nav-hover-bg: rgba(165, 180, 252, 0.14);
      --nav-active-color: #eef2ff;
      --nav-active-bg: linear-gradient(130deg, rgba(129, 140, 248, 0.3) 0%, rgba(45, 212, 191, 0.2) 100%);
      --nav-active-border: rgba(144, 168, 255, 0.34);
      --divider-color: rgba(180, 190, 255, 0.12);
      --logout-color: #f87171;
      --logout-border: rgba(248, 113, 113, 0.32);
      --logout-bg-hover: rgba(248, 113, 113, 0.16);
      --main-bg: linear-gradient(160deg, #140f28 0%, #191439 45%, #201b43 100%);
      --scrollbar-thumb: rgba(178, 185, 255, 0.22);
      --scrollbar-thumb-hover: rgba(195, 202, 255, 0.34);
    }

    :host-context(:root[data-theme='light']) {
      --shell-bg: linear-gradient(165deg, #f7faff 0%, #edf3ff 55%, #e7eefb 100%);
      --shell-text: #1d2b4c;
      --sidebar-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(242, 247, 255, 0.96) 100%);
      --sidebar-border: rgba(106, 124, 179, 0.28);
      --logo-icon-bg: linear-gradient(135deg, #7b70ff 0%, #5f7dff 100%);
      --logo-icon-shadow: 0 10px 24px rgba(98, 108, 220, 0.28);
      --logo-text-gradient: linear-gradient(115deg, #4f46e5 0%, #2f6ba7 100%);
      --nav-color: #5a678a;
      --nav-hover-color: #1f2c4f;
      --nav-hover-bg: rgba(97, 120, 226, 0.12);
      --nav-active-color: #223560;
      --nav-active-bg: linear-gradient(135deg, rgba(97, 120, 226, 0.18) 0%, rgba(34, 197, 203, 0.16) 100%);
      --nav-active-border: rgba(97, 120, 226, 0.4);
      --divider-color: rgba(106, 124, 179, 0.2);
      --logout-color: #b3263f;
      --logout-border: rgba(217, 70, 91, 0.36);
      --logout-bg-hover: rgba(217, 70, 91, 0.12);
      --main-bg: linear-gradient(165deg, #f9fbff 0%, #eef4ff 52%, #e9f0ff 100%);
      --scrollbar-thumb: rgba(97, 120, 226, 0.36);
      --scrollbar-thumb-hover: rgba(79, 101, 201, 0.55);
    }

    .shell-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      background: var(--shell-bg) !important;
      color: var(--shell-text) !important;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .sidebar {
      width: 268px;
      background: var(--sidebar-bg);
      backdrop-filter: blur(16px);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      box-shadow: 14px 0 32px rgba(20, 21, 45, 0.16);
    }

    .sidebar-header {
      padding: 26px 22px 18px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 42px;
      height: 42px;
      background: var(--logo-icon-bg);
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 24px;
      color: #ffffff;
      box-shadow: var(--logo-icon-shadow);
    }

    .logo-text {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: -0.7px;
      background: var(--logo-text-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .sidebar-nav {
      flex: 1;
      padding: 6px 14px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow-y: auto;
    }

    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-divider {
      height: 1px;
      background: var(--divider-color);
      margin: 2px 14px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 13px;
      text-decoration: none;
      color: var(--nav-color);
      font-size: 15px;
      font-weight: 600;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: 1px solid transparent;
    }

    .nav-item:hover {
      background: var(--nav-hover-bg);
      color: var(--nav-hover-color);
      transform: translateX(3px);
    }

    .nav-item.active {
      background: var(--nav-active-bg);
      color: var(--nav-active-color);
      border-color: var(--nav-active-border);
      box-shadow: 0 8px 16px rgba(84, 104, 197, 0.16);
    }

    .nav-item.active .icon {
      filter: drop-shadow(0 0 8px rgba(120, 131, 255, 0.35));
    }

    .nav-item.disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .icon {
      font-size: 18px;
      width: 22px;
      display: flex;
      justify-content: center;
      line-height: 1;
    }

    .label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-footer {
      padding: 18px 16px;
      border-top: 1px solid var(--divider-color);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 11px 12px;
      background: transparent;
      border: 1px solid var(--logout-border);
      border-radius: 12px;
      color: var(--logout-color);
      cursor: pointer;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--logout-bg-hover);
      transform: translateY(-1px);
    }

    .main-content {
      flex: 1;
      padding: 0;
      overflow-y: auto;
      background: var(--main-bg) !important;
      position: relative;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--scrollbar-thumb-hover);
    }

    @media (max-width: 980px) {
      .sidebar {
        width: 236px;
      }

      .nav-item {
        padding: 11px 12px;
        gap: 10px;
      }
    }

    @media (max-width: 760px) {
      .shell-container {
        flex-direction: column;
        height: auto;
        min-height: 100vh;
      }

      .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--sidebar-border);
      }

      .sidebar-header {
        padding: 16px 14px 10px;
      }

      .sidebar-nav {
        padding: 8px 10px 10px;
        gap: 10px;
      }

      .nav-group {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .nav-divider {
        display: none;
      }

      .nav-item {
        justify-content: center;
        flex-direction: column;
        text-align: center;
        gap: 4px;
        padding: 10px 6px;
        font-size: 11px;
      }

      .icon {
        width: auto;
        font-size: 16px;
      }

      .label {
        white-space: normal;
      }

      .sidebar-footer {
        padding: 10px;
      }
    }

    @media (max-width: 520px) {
      .nav-group {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .logo-text {
        font-size: 26px;
      }
    }
  `]
})
export class ClientShellComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  onLogout(): void {
    // Implement logout logic
    this.router.navigate(['/auth']);
  }
}
