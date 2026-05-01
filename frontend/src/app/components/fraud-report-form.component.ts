import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FraudDataService, Alert } from '../services/fraud-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fraud-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fraud-report-container">
      <!-- Report Form -->
      <div class="report-form-section">
        <h3>Report Suspicious Activity</h3>
        <form (ngSubmit)="submitFraudReport()">
          <!-- Description -->
          <div class="form-group">
            <label for="description">What happened?</label>
            <textarea
              id="description"
              [(ngModel)]="reportForm.description"
              name="description"
              placeholder="Describe the suspicious transaction or activity..."
              rows="4"
              required
            ></textarea>
          </div>

          <!-- Transaction Amount -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="amount">Transaction Amount (optional)</label>
              <input
                id="amount"
                type="number"
                [(ngModel)]="reportForm.amount"
                name="amount"
                placeholder="e.g., 100.00"
                step="0.01"
              />
            </div>

            <!-- Merchant -->
            <div class="form-group flex-1">
              <label for="merchant">Merchant (optional)</label>
              <input
                id="merchant"
                type="text"
                [(ngModel)]="reportForm.merchant"
                name="merchant"
                placeholder="e.g., Amazon, Apple Store"
              />
            </div>
          </div>

          <!-- Location -->
          <div class="form-group">
            <label for="location">Location (optional)</label>
            <input
              id="location"
              type="text"
              [(ngModel)]="reportForm.location"
              name="location"
              placeholder="Where did this occur?"
            />
          </div>

          <!-- Transaction Time -->
          <div class="form-group">
            <label for="timestamp">When did this happen? (optional)</label>
            <input
              id="timestamp"
              type="datetime-local"
              [(ngModel)]="reportForm.timestamp"
              name="timestamp"
            />
          </div>

          <!-- Submit Button -->
          <button type="submit" class="submit-btn" [disabled]="!reportForm.description || isSubmitting">
            <span *ngIf="!isSubmitting">Submit Report</span>
            <span *ngIf="isSubmitting">Submitting...</span>
          </button>
        </form>

        <div *ngIf="reportSuccess" class="success-message">
          ✓ Thank you! Your fraud report has been submitted and will be reviewed by our team.
        </div>
      </div>

      <!-- Live Alerts Stream -->
      <div class="live-alerts-section">
        <h3>Live Fraud Alerts
          <span class="alert-count" *ngIf="getIncomingCount() > 0">{{ getIncomingCount() }}</span>
        </h3>
        <div class="alerts-list">
          <div
            *ngFor="let alert of liveAlerts; let i = index"
            class="alert-item"
            [ngClass]="'alert-' + alert.priority"
          >
            <div class="alert-header">
              <span class="alert-badge" *ngIf="alert.source === 'client_reported'">CLIENT</span>
              <span class="alert-id">{{ alert.id }}</span>
              <span class="alert-time">{{ alert.timestamp | slice:11:16 }}</span>
            </div>
            <div class="alert-details">
              <p class="alert-reason">{{ alert.reason }}</p>
              <div class="alert-transaction">
                <span>{{ alert.transaction.merchant }}</span>
                <span class="amount">{{ alert.transaction.amount | currency }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="liveAlerts.length === 0" class="no-alerts">
            No incoming alerts
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fraud-report-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #F5F3FF 0%, #E8E4FF 100%);
      border-radius: 16px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .report-form-section,
    .live-alerts-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 32px rgba(107, 99, 255, 0.1);
    }

    h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #0F0F1E;
      display: flex;
      align-items: center;
      gap: 10px;

      .alert-count {
        background: #FF4D4D;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.flex-1 {
        flex: 1;
      }

      label {
        font-size: 13px;
        font-weight: 500;
        color: #0F0F1E;
      }

      input,
      textarea {
        padding: 10px 12px;
        border: 1px solid #E0DDF5;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #6C63FF;
          box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
        }

        &:disabled {
          background: #F5F3FF;
          color: #999;
          cursor: not-allowed;
        }
      }

      textarea {
        resize: vertical;
        min-height: 100px;
      }
    }

    .submit-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(108, 99, 255, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .success-message {
      margin-top: 12px;
      padding: 12px;
      background: rgba(0, 230, 118, 0.1);
      border: 1px solid #00E676;
      border-radius: 8px;
      color: #00AA4F;
      font-size: 13px;
      animation: slideIn 0.3s ease-out;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 600px;
      overflow-y: auto;
    }

    .alert-item {
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid;
      background: white;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateX(4px);
      }

      &.alert-high {
        border-left-color: #FF4D4D;
        background: rgba(255, 77, 77, 0.05);
      }

      &.alert-medium {
        border-left-color: #FFD700;
        background: rgba(255, 215, 0, 0.05);
      }

      &.alert-low {
        border-left-color: #00D9FF;
        background: rgba(0, 217, 255, 0.05);
      }
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;

      .alert-badge {
        background: #FF4D4D;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 10px;
      }

      .alert-id {
        font-weight: 600;
        color: #0F0F1E;
      }

      .alert-time {
        margin-left: auto;
        color: #999;
      }
    }

    .alert-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alert-reason {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: #0F0F1E;
    }

    .alert-transaction {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;

      .amount {
        font-weight: 600;
        color: #FF4D4D;
      }
    }

    .no-alerts {
      text-align: center;
      padding: 40px 20px;
      color: #999;
      font-size: 14px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class FraudReportFormComponent implements OnInit, OnDestroy {
  reportForm = {
    description: '',
    amount: null as number | null,
    merchant: '',
    location: '',
    timestamp: ''
  };

  liveAlerts: Alert[] = [];
  isSubmitting = false;
  reportSuccess = false;

  private incomingAlertsSubscription: Subscription | null = null;

  constructor(private fraudDataService: FraudDataService) {}

  ngOnInit() {
    // Subscribe to live incoming alerts
    this.incomingAlertsSubscription = this.fraudDataService.getLiveAlerts().subscribe((alerts: Alert[]) => {
      this.liveAlerts = alerts.slice(0, 5); // Show only the latest 5
    });
  }

  ngOnDestroy() {
    if (this.incomingAlertsSubscription) {
      this.incomingAlertsSubscription.unsubscribe();
    }
  }

  submitFraudReport() {
    if (!this.reportForm.description.trim()) {
      alert('Please describe the suspicious activity');
      return;
    }

    this.isSubmitting = true;

    // Get current user ID (from session/auth service)
    const userId = (window as any).__currentUserId || 'USER-' + Math.random().toString(36).substr(2, 9);

    // Call the service method
    this.fraudDataService.reportClientFraud({
      userId,
      description: this.reportForm.description,
      suspiciousTransaction: {
        amount: this.reportForm.amount || undefined,
        merchant: this.reportForm.merchant || undefined,
        timestamp: this.reportForm.timestamp || new Date().toISOString(),
        location: this.reportForm.location || undefined
      },
      reportedAt: new Date().toISOString()
    });

    // Reset form
    setTimeout(() => {
      this.reportForm = {
        description: '',
        amount: null,
        merchant: '',
        location: '',
        timestamp: ''
      };
      this.isSubmitting = false;
      this.reportSuccess = true;

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.reportSuccess = false;
      }, 5000);
    }, 800);
  }

  getIncomingCount(): number {
    return this.fraudDataService.getIncomingAlertsCount();
  }
}
