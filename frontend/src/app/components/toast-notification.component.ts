import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FraudDataService, Notification } from '../services/fraud-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="activeNotifications.length > 0">
      <div
        *ngFor="let notification of activeNotifications; let i = index"
        class="toast-item"
        [ngClass]="'toast-' + notification.priority"
        [@slideIn]
      >
        <div class="toast-icon">
          <span *ngIf="notification.priority === 'high'">🚨</span>
          <span *ngIf="notification.priority === 'medium'">⚠️</span>
          <span *ngIf="notification.priority === 'low'">ℹ️</span>
        </div>
        <div class="toast-content">
          <h4 class="toast-title">{{ notification.title }}</h4>
          <p class="toast-message">{{ notification.message }}</p>
        </div>
        <button class="toast-close" (click)="dismissNotification(i)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      animation: slideInRight 0.3s ease-out;
      backdrop-filter: blur(8px);

      &.toast-high {
        border-left: 4px solid #FF4D4D;
        background: rgba(255, 77, 77, 0.1);
      }

      &.toast-medium {
        border-left: 4px solid #FFD700;
        background: rgba(255, 215, 0, 0.1);
      }

      &.toast-low {
        border-left: 4px solid #00D9FF;
        background: rgba(0, 217, 255, 0.1);
      }
    }

    .toast-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      margin: 0 0 4px 0;
      font-weight: 600;
      font-size: 14px;
    }

    .toast-message {
      margin: 0;
      font-size: 13px;
      opacity: 0.8;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.5;
      padding: 0;
      flex-shrink: 0;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  activeNotifications: Notification[] = [];
  private notificationSubscription: Subscription | null = null;

  constructor(private fraudDataService: FraudDataService) {}

  ngOnInit() {
    // Subscribe to notification stream
    this.notificationSubscription = this.fraudDataService.getNotifications().subscribe(
      (notification: Notification) => {
        this.activeNotifications.push(notification);

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          this.dismissNotification(0);
        }, 6000);
      }
    );
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  dismissNotification(index: number) {
    this.activeNotifications.splice(index, 1);
  }
}
