# Real-Time Fraud Reporting & Notification System

## Overview

The enhanced `FraudDataService` now includes a complete real-time fraud reporting and notification system that allows:

1. **Clients** to report suspicious transactions
2. **Admins** to receive live fraud alerts with automatic notifications
3. **Automatic sound/visual alerts** when new fraud reports arrive
4. **Seamless integration** with existing components

## Key Components & Methods

### Service Methods

#### 1. `reportClientFraud(details: ClientFraudReport): void`

Allows clients to report suspicious activity. Creates a high-priority alert and triggers notifications.

```typescript
// In a component
fraudDataService.reportClientFraud({
  userId: 'USER-12345',
  description: 'Unauthorized transaction from overseas',
  suspiciousTransaction: {
    amount: 2500,
    merchant: 'unknown merchant',
    timestamp: '2024-04-08T14:30:00Z',
    location: 'Tokyo, Japan'
  },
  reportedAt: new Date().toISOString()
});
```

#### 2. `getLiveAlerts(): Observable<Alert[]>`

Returns the stream of real-time fraud alerts (both AI-generated and client-reported).

```typescript
this.fraudDataService.getLiveAlerts().subscribe(alerts => {
  console.log('Incoming alerts:', alerts);
  // Update UI with latest alerts
});
```

#### 3. `getNotifications(): Observable<Notification>`

Returns a stream of notification events for toast/sound alerts.

```typescript
this.fraudDataService.getNotifications().subscribe(notification => {
  console.log('New notification:', notification);
  // Display toast or trigger sound
});
```

#### 4. `getIncomingAlertsCount(): number`

Returns the current count of incoming alerts.

```typescript
const count = this.fraudDataService.getIncomingAlertsCount();
console.log(`${count} new reports waiting`);
```

### Public Observables

#### `incomingAlerts$: BehaviorSubject<Alert[]>`

Broadcast stream of all incoming fraud reports. Subscribe directly:

```typescript
this.fraudDataService.incomingAlerts$.subscribe(alerts => {
  // React to new alerts
});
```

#### `notifications$: Subject<Notification>`

Broadcast stream of notification events:

```typescript
this.fraudDataService.notifications$.subscribe(notification => {
  // Handle notification
});
```

## Interfaces

### ClientFraudReport

```typescript
interface ClientFraudReport {
  userId: string;
  description: string;
  suspiciousTransaction?: {
    amount?: number;
    merchant?: string;
    timestamp?: string;
    location?: string;
  };
  reportedAt: string;
}
```

### Notification

```typescript
interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}
```

### Alert (Updated)

```typescript
interface Alert {
  id: string;
  transaction: Transaction;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  timestamp: string;
  source?: 'ai' | 'client_reported' | 'manual';  // NEW
}
```

## Component Integration Examples

### Example 1: Add to Admin Dashboard

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FraudDataService, Alert } from '../services/fraud-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="alert-feed">
      <div *ngFor="let alert of incomingAlerts" class="alert-item">
        <span *ngIf="alert.source === 'client_reported'" class="badge-client">CLIENT</span>
        {{ alert.reason }}
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  incomingAlerts: Alert[] = [];
  private subscription: Subscription | null = null;

  constructor(private fraudDataService: FraudDataService) {}

  ngOnInit() {
    // Subscribe to live alerts
    this.subscription = this.fraudDataService.getLiveAlerts().subscribe(alerts => {
      this.incomingAlerts = alerts;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### Example 2: Add Toast Notifications to App Root

```typescript
import { Component, OnInit } from '@angular/core';
import { ToastNotificationComponent } from './components/toast-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToastNotificationComponent],
  template: `
    <app-toast-notification></app-toast-notification>
    <!-- Rest of your app -->
  `
})
export class AppComponent {}
```

### Example 3: Add Fraud Report Form (e.g., in Financial Security Hub)

```typescript
import { Component } from '@angular/core';
import { FraudReportFormComponent } from './fraud-report-form.component';

@Component({
  selector: 'app-financial-security-hub',
  imports: [FraudReportFormComponent],
  template: `
    <h1>Security Hub</h1>
    
    <!-- Your existing components -->
    
    <!-- Add fraud report form -->
    <section class="report-section">
      <app-fraud-report-form></app-fraud-report-form>
    </section>
  `
})
export class FinancialSecurityHubComponent {}
```

## How It Works

### Client Reports Fraud Flow

```
1. Client fills out fraud report form
   ↓
2. reportClientFraud() called with details
   ↓
3. Alert created with source: 'client_reported'
   ↓
4. Alert added to incomingAlerts$ stream
   ↓
5. Alert added to main alerts$ stream (visible to all)
   ↓
6. Notification emitted through notifications$ stream
   ↓
7. Sound played (Web Audio API)
   ↓
8. Admin dashboard receives update in real-time
   ↓
9. Toast notification displayed
```

### Alert with 'Client Reported' Badge

When a client submits a fraud report:

- **Priority**: Always set to `'high'`
- **Source**: Marked as `'client_reported'`
- **Reason**: Prefixed with `[Client Reported]` tag
- **Risk Score**: Set to 95 (high risk)
- **Status**: Automatically set to `'flagged'`

### Notification System

Notifications include:

- **Title**: "🚨 Client Fraud Report Received"
- **Message**: User description of the fraudulent activity
- **Priority**: Always 'high' for client reports
- **Auto-dismiss**: After 6 seconds (configurable)
- **Sound**: Generated using Web Audio API (1000Hz sine wave, 500ms)

## Features & Behavior

### ✅ Real-Time Updates

`incomingAlerts$` is a `BehaviorSubject`, so new subscribers immediately get the latest alerts:

```typescript
// New observers always get current state
this.fraudDataService.incomingAlerts$.subscribe(alerts => {
  console.log(alerts); // Immediately logs current alerts
});
```

### ✅ Automatic Sound Alerts

Whenever a new alert is generated:

- Web Audio API creates a 1000Hz beep
- Duration: 500ms
- Volume: 0.3 (configurable)
- Fallback: Gracefully logs if audio unavailable

### ✅ Both Streams Work Together

- **alerts$**: All system alerts (AI + client + manual)
- **incomingAlerts$**: Only newly reported fraud (client & incoming)

Admins can monitor both streams for a complete picture.

### ✅ Automatic Logging

All client fraud reports are logged to console with:

```javascript
[CLIENT FRAUD REPORT]
- timestamp
- userId
- description
- transaction details
```

## Customization

### Change Notification Sound Pitch

In `fraud-data.service.ts`, modify `playNotificationSound()`:

```typescript
oscillator.frequency.value = 2000; // Higher pitch
gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Louder
```

### Adjust Auto-Dismiss Time

In `toast-notification.component.ts`:

```typescript
setTimeout(() => {
  this.dismissNotification(0);
}, 3000); // 3 seconds instead of 6
```

### Filter Alerts by Priority

```typescript
this.fraudDataService.getLiveAlerts().subscribe(alerts => {
  const highPriorityAlerts = alerts.filter(a => a.priority === 'high');
});
```

### Get Client-Only Reports

```typescript
this.fraudDataService.getLiveAlerts().subscribe(alerts => {
  const clientReports = alerts.filter(a => a.source === 'client_reported');
});
```

## Testing

### Trigger a Client Report

In browser console:

```javascript
const app = ng.probe(document.body).componentInstance;
const service = app.fraudDataService;

service.reportClientFraud({
  userId: 'TEST-USER',
  description: 'Test fraud report - unauthorized transaction',
  suspiciousTransaction: {
    amount: 5000,
    merchant: 'test_merchant',
    timestamp: new Date().toISOString(),
    location: 'Tokyo'
  },
  reportedAt: new Date().toISOString()
});
```

### Monitor Alerts in Console

```javascript
app.fraudDataService.getNotifications().subscribe(notif => {
  console.log('📢 Notification:', notif);
});

app.fraudDataService.getLiveAlerts().subscribe(alerts => {
  console.log('🚨 Live alerts:', alerts);
});
```

## Performance Considerations

- **BehaviorSubject** vs **Subject**: Using BehaviorSubject for `incomingAlerts$` ensures late subscribers get the current state
- **Notification cleanup**: Notifications are auto-dismissed after 6 seconds to prevent memory leaks
- **No persistence**: Alerts are stored in memory; consider adding backend persistence for production
- **Scalability**: For high-volume alert systems, consider:
  - Event streaming (Kafka, RabbitMQ)
  - Backend database storage
  - Alert deduplication

## Backend Integration

When ready to connect to a backend:

```typescript
reportClientFraud(details: ClientFraudReport): void {
  // New code: Send to backend API
  this.http.post('/api/fraud/report', details).subscribe(response => {
    // Handle response
  });

  // Existing code: Update local streams
  const alert = this.createAlertFromReport(details);
  this.incomingAlerts$.next([alert, ...this.incomingAlerts$.value]);
}
```

## Files Created

1. **fraud-data.service.ts** (updated)
   - New `incomingAlerts$` BehaviorSubject
   - New `notifications$` Subject
   - `reportClientFraud()` method
   - `getLiveAlerts()` method
   - `getNotifications()` method
   - Sound alert system

2. **toast-notification.component.ts** (new)
   - Toast UI component
   - Auto-dismiss functionality
   - Priority-based styling
   - Responsive design

3. **fraud-report-form.component.ts** (new)
   - Client fraud report form
   - Live alerts feed display
   - Form validation
   - Success confirmation

## Next Steps

1. ✅ Add `ToastNotificationComponent` to your app root
2. ✅ Add `FraudReportFormComponent` to Financial Security Hub or a dedicated page
3. ✅ Subscribe to `getLiveAlerts()` in AdminDashboard for real-time updates
4. ✅ Test with sample fraud reports
5. ⏳ Connect to backend API when ready
6. ⏳ Add persistent storage (database)
7. ⏳ Configure alert routing and escalation rules
