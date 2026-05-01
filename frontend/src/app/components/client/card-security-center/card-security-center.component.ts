import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Transaction, TransactionChannel, UserClient, UserService } from '../../../services/user.service';
import { LimitAlertEvent, LimitAlertService } from '../../../services/limit-alert.service';

type ActionSeverity = 'info' | 'warning' | 'critical' | 'success';

type SecurityAction = {
  label: string;
  severity: ActionSeverity;
  at: string;
};

type PolicyTestType = 'online' | 'atm' | 'high' | 'pos';

type PolicyTestResult = {
  id: string;
  label: string;
  amount: number;
  channel: TransactionChannel;
  blocked: boolean;
  code?: string;
  reason?: string;
  at: string;
};

@Component({
  selector: 'app-card-security-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cards-center" *ngIf="currentClient as client">
      <header class="page-header">
        <div>
          <h1>Card Security Control Center</h1>
          <p>Control payment channels, spending caps, travel countries, and emergency response.</p>
        </div>
        <div class="status-pill" [class.critical]="client.cardSecurity.emergencyLockdown">
          {{ client.cardSecurity.emergencyLockdown ? 'EMERGENCY LOCKDOWN ACTIVE' : 'Protection Active' }}
        </div>
      </header>

      <section class="status-grid">
        <article class="status-card">
          <span class="status-label">Card State</span>
          <strong [class.bad]="client.creditCard.isFrozen">
            {{ client.creditCard.isFrozen ? 'Frozen' : 'Active' }}
          </strong>
        </article>

        <article class="status-card">
          <span class="status-label">Online Payments</span>
          <strong [class.bad]="!client.cardSecurity.onlinePaymentsEnabled">
            {{ client.cardSecurity.onlinePaymentsEnabled ? 'Enabled' : 'Disabled' }}
          </strong>
        </article>

        <article class="status-card">
          <span class="status-label">ATM Withdrawals</span>
          <strong [class.bad]="!client.cardSecurity.atmWithdrawalsEnabled">
            {{ client.cardSecurity.atmWithdrawalsEnabled ? 'Enabled' : 'Disabled' }}
          </strong>
        </article>

        <article class="status-card">
          <span class="status-label">Temporary Spending Cap</span>
          <strong>
            {{ client.cardSecurity.temporaryLimitEnabled ? (client.cardSecurity.temporaryLimitAmount | currency) : 'No Cap' }}
          </strong>
        </article>
      </section>

      <section class="panel critical-panel">
        <div class="panel-head">
          <h2>Critical Controls</h2>
          <p>High impact actions available in one tap.</p>
        </div>

        <div class="critical-actions">
          <button class="action-btn" (click)="toggleCardFreeze()">
            {{ client.creditCard.isFrozen ? 'Unfreeze Card' : 'Freeze Card' }}
          </button>

          <button
            class="action-btn warning"
            [disabled]="client.cardSecurity.emergencyLockdown"
            (click)="triggerEmergencyLockdown()">
            Activate Emergency Lockdown
          </button>

          <button
            class="action-btn success"
            [disabled]="!client.cardSecurity.emergencyLockdown"
            (click)="releaseEmergencyLockdown()">
            Release Lockdown
          </button>
        </div>

        <div class="mode-row">
          <span class="mode-title">Quick Security Modes</span>
          <div class="mode-buttons">
            <button class="mode-btn" (click)="applyQuickMode('normal')">Normal</button>
            <button class="mode-btn" (click)="applyQuickMode('shopping')">Shopping Safe</button>
            <button class="mode-btn" (click)="applyQuickMode('travel')">Travel Safe</button>
            <button class="mode-btn danger" (click)="applyQuickMode('lockdown')">Lockdown</button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Temporary Spending Limit</h2>
          <label class="switch">
            <input
              type="checkbox"
              [checked]="client.cardSecurity.temporaryLimitEnabled"
              (change)="setTemporaryLimitEnabled($any($event.target).checked)" />
            <span>Enable cap</span>
          </label>
        </div>

        <div class="limit-body" *ngIf="client.cardSecurity.temporaryLimitEnabled">
          <div class="limit-value">{{ spendingLimitDraft | currency }}</div>
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            [value]="spendingLimitDraft"
            (input)="onLimitRangeInput($event)" />
          <div class="limit-presets">
            <button (click)="applyLimitPreset(300)">$300</button>
            <button (click)="applyLimitPreset(750)">$750</button>
            <button (click)="applyLimitPreset(1500)">$1500</button>
            <button (click)="applyLimitPreset(3000)">$3000</button>
          </div>
        </div>

        <div class="limit-alert-controls">
          <div class="panel-head compact">
            <h2>Limit Breach Notifications</h2>
            <span class="last-action">Instant outbound messages when cap is exceeded</span>
          </div>

          <div class="toggle-row no-border">
            <span>SMS alert to {{ client.phoneNumber }}</span>
            <label class="switch">
              <input
                type="checkbox"
                [checked]="client.cardSecurity.limitAlertSmsEnabled"
                (change)="setLimitAlertSms($any($event.target).checked)" />
              <span>{{ client.cardSecurity.limitAlertSmsEnabled ? 'ON' : 'OFF' }}</span>
            </label>
          </div>

          <div class="toggle-row no-border">
            <span>WhatsApp alert to {{ client.phoneNumber }}</span>
            <label class="switch">
              <input
                type="checkbox"
                [checked]="client.cardSecurity.limitAlertWhatsAppEnabled"
                (change)="setLimitAlertWhatsApp($any($event.target).checked)" />
              <span>{{ client.cardSecurity.limitAlertWhatsAppEnabled ? 'ON' : 'OFF' }}</span>
            </label>
          </div>
        </div>
      </section>

      <section class="panel split">
        <div>
          <div class="panel-head compact">
            <h2>Payment Channel Controls</h2>
          </div>

          <div class="toggle-row">
            <span>Online payments</span>
            <label class="switch">
              <input
                type="checkbox"
                [checked]="client.cardSecurity.onlinePaymentsEnabled"
                [disabled]="client.cardSecurity.emergencyLockdown"
                (change)="setOnlinePayments($any($event.target).checked)" />
              <span>{{ client.cardSecurity.onlinePaymentsEnabled ? 'ON' : 'OFF' }}</span>
            </label>
          </div>

          <div class="toggle-row">
            <span>ATM withdrawals</span>
            <label class="switch">
              <input
                type="checkbox"
                [checked]="client.cardSecurity.atmWithdrawalsEnabled"
                [disabled]="client.cardSecurity.emergencyLockdown"
                (change)="setAtmWithdrawals($any($event.target).checked)" />
              <span>{{ client.cardSecurity.atmWithdrawalsEnabled ? 'ON' : 'OFF' }}</span>
            </label>
          </div>
        </div>

        <div>
          <div class="panel-head compact">
            <h2>Travel Safe Mode</h2>
            <label class="switch">
              <input
                type="checkbox"
                [checked]="client.cardSecurity.travelModeEnabled"
                [disabled]="client.cardSecurity.emergencyLockdown"
                (change)="setTravelMode($any($event.target).checked)" />
              <span>{{ client.cardSecurity.travelModeEnabled ? 'Enabled' : 'Disabled' }}</span>
            </label>
          </div>

          <div class="chips" *ngIf="client.cardSecurity.travelCountries.length > 0">
            <button class="chip active" *ngFor="let country of client.cardSecurity.travelCountries" (click)="removeTravelCountry(country)">
              {{ country }} x
            </button>
          </div>

          <div class="chips suggestions">
            <button
              class="chip"
              *ngFor="let country of getAvailableTravelCountries()"
              (click)="addTravelCountry(country)">
              + {{ country }}
            </button>
          </div>
        </div>
      </section>

      <section class="panel audit-panel">
        <div class="panel-head compact">
          <h2>Policy Test Bench</h2>
          <span class="last-action">Inject live demo transactions and verify rules instantly</span>
        </div>

        <div class="test-actions">
          <button class="test-btn" (click)="injectPolicyTest('online')">Inject Online Purchase</button>
          <button class="test-btn" (click)="injectPolicyTest('atm')">Inject ATM Withdrawal</button>
          <button class="test-btn" (click)="injectPolicyTest('high')">Inject High Amount</button>
          <button class="test-btn" (click)="injectPolicyTest('pos')">Inject POS Purchase</button>
        </div>

        <div class="test-results" *ngIf="policyTestResults.length > 0">
          <div class="test-result" *ngFor="let result of policyTestResults" [class.blocked]="result.blocked" [class.allowed]="!result.blocked">
            <div class="result-top">
              <span class="result-label">{{ result.label }}</span>
              <span class="result-status">{{ result.blocked ? 'BLOCKED' : 'ALLOWED' }}</span>
            </div>
            <div class="result-meta">{{ result.amount | currency }} • {{ result.channel | uppercase }} • {{ formatTime(result.at) }}</div>
            <div class="result-reason" *ngIf="result.blocked">{{ formatPolicyCode(result.code || 'UNKNOWN') }} - {{ result.reason }}</div>
          </div>
        </div>
      </section>

      <section class="panel audit-panel" *ngIf="limitAlertEvents.length > 0">
        <div class="panel-head compact">
          <h2>Outbound Limit Alerts (SMS + WhatsApp)</h2>
          <span class="last-action">{{ limitAlertEvents.length }} event(s) dispatched</span>
        </div>

        <div class="notification-events">
          <article class="notification-event" *ngFor="let event of limitAlertEvents">
            <div class="event-header">
              <span class="event-title">Transaction {{ event.transactionId }} blocked</span>
              <span class="event-time">{{ formatTime(event.createdAt) }}</span>
            </div>
            <div class="event-meta">
              {{ event.transactionAmount | currency }} exceeded cap {{ event.temporaryLimitAmount | currency }}
            </div>
            <div class="event-reason">{{ event.reason }}</div>

            <div class="delivery-list">
              <div class="delivery-item" *ngFor="let delivery of event.deliveries">
                <span class="delivery-channel">{{ getChannelLabel(delivery.channel) }}</span>
                <span class="delivery-destination">{{ delivery.destination }}</span>
                <span class="delivery-status" [class.failed]="delivery.status !== 'sent'">
                  {{ delivery.status | uppercase }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="panel audit-panel">
        <div class="panel-head compact">
          <h2>Security Action Log</h2>
          <span class="last-action">Last action: {{ formatTime(client.cardSecurity.lastSecurityActionAt) }}</span>
        </div>

        <div class="action-log">
          <div class="log-item" *ngFor="let item of actionFeed" [class]="'sev-' + item.severity">
            <span class="dot"></span>
            <div>
              <div class="log-label">{{ item.label }}</div>
              <div class="log-time">{{ formatTime(item.at) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .cards-center {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px;
      color: #f0ecff;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.6rem;
      letter-spacing: 0.3px;
      color: #faf7ff;
    }

    .page-header p {
      margin: 6px 0 0;
      color: rgba(240, 236, 255, 0.72);
      font-size: 0.93rem;
      max-width: 700px;
    }

    .status-pill {
      border: 1px solid rgba(0, 230, 118, 0.35);
      background: rgba(0, 230, 118, 0.12);
      color: #94f0c1;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    .status-pill.critical {
      border-color: rgba(255, 77, 77, 0.42);
      background: rgba(255, 77, 77, 0.12);
      color: #ffb3b3;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .status-card {
      background: linear-gradient(135deg, rgba(42, 30, 68, 0.92), rgba(33, 25, 58, 0.9));
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-label {
      font-size: 0.75rem;
      color: rgba(240, 236, 255, 0.66);
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .status-card strong {
      font-size: 1rem;
      color: #9bf3c6;
    }

    .status-card strong.bad {
      color: #ff9da0;
    }

    .panel {
      background: linear-gradient(135deg, rgba(37, 28, 60, 0.94), rgba(31, 24, 53, 0.92));
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
    }

    .critical-panel {
      border-color: rgba(255, 77, 77, 0.32);
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .panel-head h2 {
      margin: 0;
      font-size: 1rem;
      color: #f7f0ff;
    }

    .panel-head p {
      margin: 2px 0 0;
      width: 100%;
      font-size: 0.82rem;
      color: rgba(240, 236, 255, 0.65);
    }

    .panel-head.compact {
      margin-bottom: 8px;
    }

    .critical-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .action-btn {
      border: 1px solid rgba(168, 85, 247, 0.35);
      background: rgba(168, 85, 247, 0.12);
      color: #e7d7ff;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(168, 85, 247, 0.2);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.warning {
      border-color: rgba(255, 165, 0, 0.42);
      background: rgba(255, 165, 0, 0.12);
      color: #ffd59a;
    }

    .action-btn.success {
      border-color: rgba(0, 230, 118, 0.38);
      background: rgba(0, 230, 118, 0.12);
      color: #9af0c4;
    }

    .mode-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-top: 1px dashed rgba(168, 85, 247, 0.22);
      padding-top: 10px;
    }

    .mode-title {
      font-size: 0.8rem;
      color: rgba(240, 236, 255, 0.75);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mode-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .mode-btn {
      border: 1px solid rgba(168, 85, 247, 0.3);
      background: rgba(39, 27, 64, 0.75);
      color: #d9c5f7;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.74rem;
      font-weight: 700;
      cursor: pointer;
    }

    .mode-btn.danger {
      border-color: rgba(255, 77, 77, 0.38);
      color: #ffb2b5;
    }

    .switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #d8c7f4;
      font-weight: 700;
    }

    .limit-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .limit-value {
      font-size: 1.15rem;
      color: #9ef2c6;
      font-weight: 800;
    }

    input[type='range'] {
      width: 100%;
      accent-color: #a855f7;
    }

    .limit-presets {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .limit-presets button {
      border: 1px solid rgba(168, 85, 247, 0.28);
      background: rgba(168, 85, 247, 0.08);
      color: #decdf6;
      border-radius: 999px;
      padding: 5px 9px;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
    }

    .limit-alert-controls {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed rgba(168, 85, 247, 0.2);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .panel.split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 0;
      border-bottom: 1px dashed rgba(168, 85, 247, 0.2);
      font-size: 0.87rem;
      color: rgba(240, 236, 255, 0.9);
    }

    .toggle-row.no-border {
      border-bottom: none;
      padding: 7px 0;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .chip {
      border: 1px solid rgba(168, 85, 247, 0.28);
      background: rgba(168, 85, 247, 0.08);
      color: #decdf6;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }

    .chip.active {
      border-color: rgba(0, 230, 118, 0.3);
      background: rgba(0, 230, 118, 0.11);
      color: #99efc2;
    }

    .chips.suggestions .chip {
      opacity: 0.9;
    }

    .audit-panel .last-action {
      font-size: 0.72rem;
      color: rgba(240, 236, 255, 0.6);
      font-weight: 600;
    }

    .test-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }

    .test-btn {
      border: 1px solid rgba(168, 85, 247, 0.35);
      background: rgba(168, 85, 247, 0.14);
      color: #eadcff;
      border-radius: 999px;
      padding: 7px 11px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .test-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 5px 14px rgba(168, 85, 247, 0.24);
    }

    .test-results {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .test-result {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(168, 85, 247, 0.16);
      border-radius: 10px;
      padding: 9px 10px;
    }

    .test-result.allowed {
      border-color: rgba(0, 230, 118, 0.3);
      background: rgba(0, 230, 118, 0.08);
    }

    .test-result.blocked {
      border-color: rgba(255, 77, 77, 0.35);
      background: rgba(255, 77, 77, 0.08);
    }

    .result-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .result-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #f0e7ff;
    }

    .result-status {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .test-result.allowed .result-status {
      color: #95f0c0;
    }

    .test-result.blocked .result-status {
      color: #ffb0b4;
    }

    .result-meta {
      margin-top: 4px;
      font-size: 0.72rem;
      color: rgba(240, 236, 255, 0.66);
    }

    .result-reason {
      margin-top: 5px;
      font-size: 0.72rem;
      color: #ffb9bc;
    }

    .notification-events {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .notification-event {
      border: 1px solid rgba(168, 85, 247, 0.18);
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      padding: 9px 10px;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .event-title {
      font-size: 0.81rem;
      font-weight: 800;
      color: #f2e9ff;
    }

    .event-time {
      font-size: 0.7rem;
      color: rgba(240, 236, 255, 0.62);
      font-weight: 600;
    }

    .event-meta,
    .event-reason {
      margin-top: 4px;
      font-size: 0.73rem;
      color: rgba(240, 236, 255, 0.7);
    }

    .delivery-list {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .delivery-item {
      display: grid;
      grid-template-columns: 90px 1fr auto;
      gap: 8px;
      align-items: center;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(168, 85, 247, 0.08);
      border: 1px solid rgba(168, 85, 247, 0.12);
      font-size: 0.72rem;
    }

    .delivery-channel {
      font-weight: 800;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      color: #dcbcff;
    }

    .delivery-destination {
      color: rgba(240, 236, 255, 0.82);
      font-weight: 600;
    }

    .delivery-status {
      color: #97efc1;
      font-weight: 800;
      letter-spacing: 0.4px;
    }

    .delivery-status.failed {
      color: #ffb0b4;
    }

    .action-log {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .log-item {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 8px;
      align-items: start;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(168, 85, 247, 0.12);
      border-radius: 10px;
      padding: 9px 10px;
    }

    .log-item .dot {
      width: 8px;
      height: 8px;
      margin-top: 4px;
      border-radius: 50%;
      background: #a855f7;
    }

    .log-item.sev-success .dot {
      background: #00e676;
    }

    .log-item.sev-warning .dot {
      background: #ffa500;
    }

    .log-item.sev-critical .dot {
      background: #ff4d4d;
    }

    .log-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #f0e7ff;
    }

    .log-time {
      font-size: 0.72rem;
      color: rgba(240, 236, 255, 0.58);
      margin-top: 2px;
    }

    :host-context(:root[data-theme='light']) .cards-center {
      color: #1c2945;
    }

    :host-context(:root[data-theme='light']) .page-header h1 {
      color: #182545;
    }

    :host-context(:root[data-theme='light']) .page-header p {
      color: #5c6990;
    }

    :host-context(:root[data-theme='light']) .status-pill {
      border-color: rgba(18, 163, 106, 0.34);
      background: rgba(18, 163, 106, 0.12);
      color: #187752;
    }

    :host-context(:root[data-theme='light']) .status-pill.critical {
      border-color: rgba(210, 70, 70, 0.38);
      background: rgba(210, 70, 70, 0.12);
      color: #a62d39;
    }

    :host-context(:root[data-theme='light']) .status-card {
      background: linear-gradient(140deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 255, 0.9));
      border-color: rgba(100, 121, 181, 0.26);
      box-shadow: 0 10px 22px rgba(39, 57, 103, 0.1);
    }

    :host-context(:root[data-theme='light']) .status-label {
      color: #5e6f97;
    }

    :host-context(:root[data-theme='light']) .status-card strong {
      color: #147c55;
    }

    :host-context(:root[data-theme='light']) .status-card strong.bad {
      color: #b33645;
    }

    :host-context(:root[data-theme='light']) .panel {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(245, 249, 255, 0.92));
      border-color: rgba(103, 124, 185, 0.26);
      box-shadow: 0 14px 30px rgba(33, 51, 96, 0.12);
    }

    :host-context(:root[data-theme='light']) .critical-panel {
      border-color: rgba(212, 82, 82, 0.3);
    }

    :host-context(:root[data-theme='light']) .panel-head h2 {
      color: #1b2745;
    }

    :host-context(:root[data-theme='light']) .panel-head p,
    :host-context(:root[data-theme='light']) .audit-panel .last-action {
      color: #5f6d92;
    }

    :host-context(:root[data-theme='light']) .action-btn {
      border-color: rgba(91, 110, 214, 0.34);
      background: rgba(91, 110, 214, 0.11);
      color: #334582;
    }

    :host-context(:root[data-theme='light']) .action-btn:hover:not(:disabled) {
      box-shadow: 0 8px 16px rgba(83, 103, 206, 0.2);
    }

    :host-context(:root[data-theme='light']) .action-btn.warning {
      border-color: rgba(232, 151, 42, 0.44);
      background: rgba(232, 151, 42, 0.12);
      color: #9b5d16;
    }

    :host-context(:root[data-theme='light']) .action-btn.success {
      border-color: rgba(18, 163, 106, 0.4);
      background: rgba(18, 163, 106, 0.12);
      color: #0f724a;
    }

    :host-context(:root[data-theme='light']) .mode-row,
    :host-context(:root[data-theme='light']) .limit-alert-controls,
    :host-context(:root[data-theme='light']) .toggle-row {
      border-color: rgba(103, 124, 185, 0.24);
    }

    :host-context(:root[data-theme='light']) .mode-title,
    :host-context(:root[data-theme='light']) .switch,
    :host-context(:root[data-theme='light']) .toggle-row {
      color: #4e5f88;
    }

    :host-context(:root[data-theme='light']) .mode-btn,
    :host-context(:root[data-theme='light']) .limit-presets button,
    :host-context(:root[data-theme='light']) .chip,
    :host-context(:root[data-theme='light']) .test-btn {
      border-color: rgba(96, 118, 214, 0.33);
      background: rgba(96, 118, 214, 0.1);
      color: #354982;
    }

    :host-context(:root[data-theme='light']) .mode-btn.danger {
      border-color: rgba(212, 82, 82, 0.36);
      color: #a23544;
    }

    :host-context(:root[data-theme='light']) .limit-value {
      color: #167a52;
    }

    :host-context(:root[data-theme='light']) .chip.active {
      border-color: rgba(18, 163, 106, 0.35);
      background: rgba(18, 163, 106, 0.12);
      color: #0f6f48;
    }

    :host-context(:root[data-theme='light']) .test-btn:hover {
      box-shadow: 0 7px 14px rgba(83, 103, 206, 0.18);
    }

    :host-context(:root[data-theme='light']) .test-result,
    :host-context(:root[data-theme='light']) .notification-event,
    :host-context(:root[data-theme='light']) .log-item {
      background: rgba(255, 255, 255, 0.72);
      border-color: rgba(103, 124, 185, 0.24);
    }

    :host-context(:root[data-theme='light']) .test-result.allowed {
      border-color: rgba(18, 163, 106, 0.35);
      background: rgba(18, 163, 106, 0.11);
    }

    :host-context(:root[data-theme='light']) .test-result.blocked {
      border-color: rgba(212, 82, 82, 0.34);
      background: rgba(212, 82, 82, 0.11);
    }

    :host-context(:root[data-theme='light']) .result-label,
    :host-context(:root[data-theme='light']) .event-title,
    :host-context(:root[data-theme='light']) .log-label {
      color: #1f2b49;
    }

    :host-context(:root[data-theme='light']) .result-meta,
    :host-context(:root[data-theme='light']) .event-meta,
    :host-context(:root[data-theme='light']) .event-reason,
    :host-context(:root[data-theme='light']) .event-time,
    :host-context(:root[data-theme='light']) .log-time {
      color: #5c6b91;
    }

    :host-context(:root[data-theme='light']) .test-result.allowed .result-status,
    :host-context(:root[data-theme='light']) .delivery-status {
      color: #0f7048;
    }

    :host-context(:root[data-theme='light']) .test-result.blocked .result-status,
    :host-context(:root[data-theme='light']) .result-reason,
    :host-context(:root[data-theme='light']) .delivery-status.failed {
      color: #a3303f;
    }

    :host-context(:root[data-theme='light']) .delivery-item {
      background: rgba(95, 118, 214, 0.1);
      border-color: rgba(95, 118, 214, 0.19);
    }

    :host-context(:root[data-theme='light']) .delivery-channel {
      color: #2f4481;
    }

    :host-context(:root[data-theme='light']) .delivery-destination {
      color: #22345f;
    }

    :host-context(:root[data-theme='light']) .log-item .dot {
      background: #5f6fd9;
    }

    @media (max-width: 1024px) {
      .status-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .panel.split {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .cards-center {
        padding: 18px 14px;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CardSecurityCenterComponent implements OnInit, OnDestroy {
  currentClient: UserClient | null = null;
  spendingLimitDraft = 1000;

  readonly countryPool = [
    'USA', 'Canada', 'UK', 'France', 'Germany', 'Japan', 'Singapore', 'India', 'Australia', 'Brazil', 'Mexico'
  ];

  actionFeed: SecurityAction[] = [];
  policyTestResults: PolicyTestResult[] = [];
  limitAlertEvents: LimitAlertEvent[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private userService: UserService, private limitAlertService: LimitAlertService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userService.currentClient$.subscribe(user => {
        this.currentClient = user;
        this.spendingLimitDraft = user.cardSecurity.temporaryLimitAmount;
        this.limitAlertEvents = this.filterLimitAlertsForCurrentClient(this.limitAlertService.getAlertsValue());
      })
    );

    this.subscriptions.push(
      this.limitAlertService.alerts$.subscribe(events => {
        this.limitAlertEvents = this.filterLimitAlertsForCurrentClient(events);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleCardFreeze(): void {
    if (!this.currentClient) return;
    const nextFrozen = !this.currentClient.creditCard.isFrozen;
    this.userService.setCardFrozen(nextFrozen);
    this.pushAction(nextFrozen ? 'Card manually frozen' : 'Card manually unfrozen', nextFrozen ? 'warning' : 'success');
  }

  setOnlinePayments(enabled: boolean): void {
    this.userService.updateCardSecurity({ onlinePaymentsEnabled: enabled });
    this.pushAction(`Online payments ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
  }

  setAtmWithdrawals(enabled: boolean): void {
    this.userService.updateCardSecurity({ atmWithdrawalsEnabled: enabled });
    this.pushAction(`ATM withdrawals ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
  }

  setTravelMode(enabled: boolean): void {
    this.userService.updateCardSecurity({ travelModeEnabled: enabled });
    this.pushAction(`Travel mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }

  setTemporaryLimitEnabled(enabled: boolean): void {
    this.userService.setTemporaryLimit(enabled, this.spendingLimitDraft);
    this.pushAction(enabled ? 'Temporary spending cap enabled' : 'Temporary spending cap disabled', 'info');
  }

  setLimitAlertSms(enabled: boolean): void {
    this.userService.updateCardSecurity({ limitAlertSmsEnabled: enabled });
    this.pushAction(`SMS limit alerts ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
  }

  setLimitAlertWhatsApp(enabled: boolean): void {
    this.userService.updateCardSecurity({ limitAlertWhatsAppEnabled: enabled });
    this.pushAction(`WhatsApp limit alerts ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
  }

  onLimitRangeInput(event: Event): void {
    const amount = Number((event.target as HTMLInputElement).value);
    this.spendingLimitDraft = amount;
    this.userService.setTemporaryLimit(true, amount);
    this.pushAction(`Temporary spending cap set to $${amount}`, 'info');
  }

  applyLimitPreset(amount: number): void {
    this.spendingLimitDraft = amount;
    this.userService.setTemporaryLimit(true, amount);
    this.pushAction(`Limit preset applied: $${amount}`, 'info');
  }

  addTravelCountry(country: string): void {
    this.userService.addTravelCountryToSecurity(country);
    this.pushAction(`Travel country added: ${country}`, 'info');
  }

  removeTravelCountry(country: string): void {
    this.userService.removeTravelCountryFromSecurity(country);
    this.pushAction(`Travel country removed: ${country}`, 'warning');
  }

  getAvailableTravelCountries(): string[] {
    if (!this.currentClient) return [];
    const existing = new Set(this.currentClient.cardSecurity.travelCountries);
    return this.countryPool.filter(country => !existing.has(country)).slice(0, 8);
  }

  triggerEmergencyLockdown(): void {
    this.userService.setEmergencyLockdown(true);
    this.pushAction('Emergency lockdown activated', 'critical');
  }

  releaseEmergencyLockdown(): void {
    this.userService.setEmergencyLockdown(false);
    this.pushAction('Emergency lockdown released', 'success');
  }

  applyQuickMode(mode: 'normal' | 'shopping' | 'travel' | 'lockdown'): void {
    if (mode === 'lockdown') {
      this.triggerEmergencyLockdown();
      return;
    }

    if (mode === 'normal') {
      this.userService.setEmergencyLockdown(false);
      this.userService.updateCardSecurity({
        onlinePaymentsEnabled: true,
        atmWithdrawalsEnabled: true,
        travelModeEnabled: false
      });
      this.userService.setTemporaryLimit(false, this.spendingLimitDraft);
      this.pushAction('Quick mode: Normal', 'success');
      return;
    }

    if (mode === 'shopping') {
      this.userService.setEmergencyLockdown(false);
      this.userService.updateCardSecurity({
        onlinePaymentsEnabled: true,
        atmWithdrawalsEnabled: false,
        travelModeEnabled: false
      });
      this.userService.setTemporaryLimit(true, 1200);
      this.spendingLimitDraft = 1200;
      this.pushAction('Quick mode: Shopping Safe', 'warning');
      return;
    }

    this.userService.setEmergencyLockdown(false);
    this.userService.updateCardSecurity({
      onlinePaymentsEnabled: true,
      atmWithdrawalsEnabled: true,
      travelModeEnabled: true
    });
    this.userService.setTemporaryLimit(true, 2500);
    this.spendingLimitDraft = 2500;
    this.pushAction('Quick mode: Travel Safe', 'info');
  }

  injectPolicyTest(type: PolicyTestType): void {
    if (!this.currentClient) return;

    const now = new Date();
    const transaction: Transaction = this.buildPolicyTestTransaction(type, now);

    this.userService.addTransaction(transaction);
    const inserted = this.userService.getCurrentUser().recentTransactions[0];

    const blocked = inserted.status === 'blocked';
    const result: PolicyTestResult = {
      id: inserted.id,
      label: this.getPolicyTestLabel(type),
      amount: inserted.amount,
      channel: inserted.channel || 'pos',
      blocked,
      code: inserted.policyDecision?.code,
      reason: inserted.policyDecision?.reason,
      at: inserted.policyDecision?.triggeredAt || now.toISOString()
    };

    this.policyTestResults = [result, ...this.policyTestResults].slice(0, 8);

    this.pushAction(
      blocked
        ? `${result.label} blocked (${this.formatPolicyCode(result.code || 'UNKNOWN')})`
        : `${result.label} allowed`,
      blocked ? 'critical' : 'success'
    );
  }

  formatPolicyCode(code: string): string {
    return code.replace(/_/g, ' ');
  }

  getChannelLabel(channel: 'sms' | 'whatsapp'): string {
    return channel === 'sms' ? 'SMS' : 'WhatsApp';
  }

  private getPolicyTestLabel(type: PolicyTestType): string {
    switch (type) {
      case 'online':
        return 'Online Purchase Test';
      case 'atm':
        return 'ATM Withdrawal Test';
      case 'high':
        return 'High Amount Test';
      default:
        return 'POS Purchase Test';
    }
  }

  private buildPolicyTestTransaction(type: PolicyTestType, when: Date): Transaction {
    const timestamp = when.toISOString();
    const id = `TXN-DEMO-${when.getTime()}-${Math.floor(Math.random() * 900 + 100)}`;

    if (type === 'online') {
      return {
        id,
        merchant: 'Demo Online Marketplace',
        amount: 190,
        timestamp,
        location: { city: 'Paris', country: 'France' },
        category: 'Online Purchase',
        channel: 'online',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      };
    }

    if (type === 'atm') {
      return {
        id,
        merchant: 'ATM Demo Terminal',
        amount: 260,
        timestamp,
        location: { city: 'New York', country: 'USA' },
        category: 'Cash Withdrawal',
        channel: 'atm',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      };
    }

    if (type === 'high') {
      const amount = this.currentClient?.cardSecurity.temporaryLimitEnabled
        ? this.currentClient.cardSecurity.temporaryLimitAmount + 500
        : 3200;
      return {
        id,
        merchant: 'Luxury Demo Store',
        amount,
        timestamp,
        location: { city: 'London', country: 'UK' },
        category: 'Shopping',
        channel: 'pos',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      };
    }

    return {
      id,
      merchant: 'Corner Cafe Demo',
      amount: 24,
      timestamp,
      location: { city: 'Montreal', country: 'Canada' },
      category: 'Food & Beverage',
      channel: 'pos',
      status: 'verified',
      baseStatus: 'verified',
      isMerchantConfirmed: true
    };
  }

  private pushAction(label: string, severity: ActionSeverity): void {
    this.actionFeed = [
      {
        label,
        severity,
        at: new Date().toISOString()
      },
      ...this.actionFeed
    ].slice(0, 10);
  }

  private filterLimitAlertsForCurrentClient(events: LimitAlertEvent[]): LimitAlertEvent[] {
    if (!this.currentClient) {
      return [];
    }

    return events
      .filter(event => event.userId === this.currentClient!.id)
      .slice(0, 6);
  }

  formatTime(isoTimestamp: string): string {
    const dt = new Date(isoTimestamp);
    if (Number.isNaN(dt.getTime())) {
      return isoTimestamp;
    }
    return dt.toLocaleString();
  }
}
