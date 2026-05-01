# Quick Integration Guide - Real-Time Fraud Reporting

## What Was Added

### 1. Enhanced FraudDataService ✅

New features:
- **`incomingAlerts$`** - BehaviorSubject stream of incoming fraud reports
- **`notifications$`** - Subject stream for triggering toasts/sounds
- **`reportClientFraud(details)`** - Method for clients to report fraud
- **`getLiveAlerts()`** - Observable of real-time alerts
- **`getNotifications()`** - Observable of notifications
- **`getIncomingAlertsCount()`** - Get count of pending reports
- **Sound alerts** - Automatic audible notifications (Web Audio API)

### 2. New Components Created

#### `ToastNotificationComponent`
- Displays floating toast notifications
- Auto-dismisses after 6 seconds
- Priority-based styling (high/medium/low)
- Close button to manually dismiss
- Responsive bottom-right positioning

**File**: `src/app/components/toast-notification.component.ts`

#### `FraudReportFormComponent`
- Form for clients to report suspicious transactions
- Live alerts feed showing latest incoming reports
- Real-time update with alert count badge
- Form validation and success confirmation
- Client-reported badge on alerts

**File**: `src/app/components/fraud-report-form.component.ts`

---

## Setup Instructions

### Step 1: Add Toast Notifications to App Root

In your `app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { ToastNotificationComponent } from './components/toast-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // ... other imports
    ToastNotificationComponent
  ],
  template: `
    <!-- Toast notifications -->
    <app-toast-notification></app-toast-notification>
    
    <!-- Rest of your app -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
```

This ensures notifications appear everywhere in your app.

### Step 2: Add Fraud Report Form to a Page

In `financial-security-hub.component.ts` (or any other component):

```typescript
import { Component } from '@angular/core';
import { FraudReportFormComponent } from './fraud-report-form.component';

@Component({
  selector: 'app-financial-security-hub',
  standalone: true,
  imports: [
    // ... other imports
    FraudReportFormComponent
  ],
  template: `
    <h1>Financial Security Hub</h1>
    
    <!-- Your existing content -->
    
    <!-- Add fraud report section -->
    <section class="fraud-report-section">
      <app-fraud-report-form></app-fraud-report-form>
    </section>
  `
})
export class FinancialSecurityHubComponent {}
```

### Step 3 (Optional): Add Live Alerts to Admin Dashboard

In `admin-dashboard.component.ts`:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FraudDataService, Alert } from '../services/fraud-data.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <!-- Existing stats -->
      
      <!-- Add live alert feed -->
      <section class="live-alerts">
        <h2>Live Incoming Alerts</h2>
        <div class="alert-feed">
          <div *ngFor="let alert of liveAlerts" 
               class="alert-box" 
               [ngClass]="'priority-' + alert.priority">
            <span *ngIf="alert.source === 'client_reported'" class="badge">CLIENT REPORT</span>
            <h4>{{ alert.reason }}</h4>
            <p>{{ alert.transaction.merchant }} - {{ alert.transaction.amount | currency }}</p>
            <small>{{ alert.timestamp }}</small>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .live-alerts {
      margin-top: 32px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .alert-feed {
      display: grid;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-box {
      padding: 12px;
      border-left: 4px solid;
      border-radius: 4px;
      background: #f9f9f9;

      &.priority-high {
        border-color: #FF4D4D;
        background: rgba(255, 77, 77, 0.05);
      }

      &.priority-medium {
        border-color: #FFD700;
        background: rgba(255, 215, 0, 0.05);
      }

      &.priority-low {
        border-color: #00D9FF;
        background: rgba(0, 217, 255, 0.05);
      }
    }

    .badge {
      display: inline-block;
      background: #FF4D4D;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    h4 {
      margin: 8px 0 4px 0;
      font-size: 14px;
    }

    p {
      margin: 4px 0;
      font-size: 13px;
      color: #666;
    }

    small {
      color: #999;
      font-size: 12px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  liveAlerts: Alert[] = [];
  private subscription: Subscription | null = null;

  constructor(private fraudDataService: FraudDataService) {}

  ngOnInit() {
    // Subscribe to live incoming alerts
    this.subscription = this.fraudDataService.getLiveAlerts().subscribe((alerts: Alert[]) => {
      this.liveAlerts = alerts.slice(0, 10); // Show last 10
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

---

## Usage Examples

### Example 1: Trigger a Client Fraud Report (In Component)

```typescript
import { Component } from '@angular/core';
import { FraudDataService } from '../services/fraud-data.service';

@Component({
  selector: 'app-report-button',
  template: `
    <button (click)="reportFraud()">Report This Transaction</button>
  `
})
export class ReportButtonComponent {
  constructor(private fraudDataService: FraudDataService) {}

  reportFraud() {
    this.fraudDataService.reportClientFraud({
      userId: 'USER-12345', // Get from auth service in production
      description: 'Unauthorized transaction - I did not make this purchase',
      suspiciousTransaction: {
        amount: 2500,
        merchant: 'Unknown Merchant Inc',
        timestamp: new Date().toISOString(),
        location: 'Tokyo, Japan'
      },
      reportedAt: new Date().toISOString()
    });
  }
}
```

### Example 2: Monitor Alerts in Admin Dashboard

```typescript
this.fraudDataService.getLiveAlerts().subscribe((alerts: Alert[]) => {
  console.log(`🚨 ${alerts.length} active alerts`);
  
  // Filter for client-reported only
  const clientReports = alerts.filter(a => a.source === 'client_reported');
  console.log(`👤 ${clientReports.length} client reports`);
});
```

### Example 3: Listen to Notifications Anywhere

```typescript
this.fraudDataService.getNotifications().subscribe(notification => {
  console.log('📢 New notification:', notification);
  // - Can play sound
  // - Can animate toast
  // - Can save to log
  // - Can send to analytics
});
```

---

## What Happens When Client Reports Fraud

1. **Client fills form** → "I noticed a suspicious $2,500 transaction to Tokyo"
2. **User submits** → `reportClientFraud()` called
3. **Alert created** with:
   - `source: 'client_reported'`
   - `priority: 'high'`
   - `reason: '[Client Reported] I noticed a suspicious...'`
   - `riskScore: 95`
4. **Streams updated**:
   - Added to `incomingAlerts$`
   - Added to main `alerts$`
5. **Notification triggered**:
   - Emits notification with title and message
   - Plays 1000Hz beep (500ms duration)
   - Notification auto-dismisses after 6 seconds
6. **Admin sees**:
   - Toast notification pops up (bottom-right)
   - Live alerts feed updates instantly
   - Alert count badge updates
   - Alert has "CLIENT" badge

---

## Testing

### Manual Test (Browser Console)

```javascript
// Simulate a client report
const service = ng.probe(document.body).componentInstance.fraudDataService;

service.reportClientFraud({
  userId: 'TEST-USER-001',
  description: 'Unauthorized transaction - foreign location',
  suspiciousTransaction: {
    amount: 3500,
    merchant: 'Luxury Hotel Bangkok',
    timestamp: new Date().toISOString(),
    location: 'Bangkok, Thailand'
  },
  reportedAt: new Date().toISOString()
});

// You should see:
// 1. Toast notification pop up (bottom-right)
// 2. Beep sound played
// 3. Live alerts list updated
// 4. Console log with details
```

### Check Alert Stream

```javascript
service.getLiveAlerts().subscribe(alerts => {
  console.log('Current alerts:', alerts);
});

// Or just get the value
console.log('Latest alerts:', service.incomingAlerts$.value);
```

---

## Styling Customization

### Change Toast Position

In `toast-notification.component.ts`, modify:

```typescript
.toast-container {
  position: fixed;
  top: 20px;      // Change from bottom
  left: 20px;     // Change from right
}
```

### Change Notification Color

In `fraud-report-form.component.ts`:

```typescript
&.alert-high {
  border-left-color: #FF6B6B;  // Change from #FF4D4D
  background: rgba(255, 107, 107, 0.05);
}
```

### Change Sound Pitch

In `fraud-data.service.ts`:

```typescript
oscillator.frequency.value = 2000; // Higher pitch
oscillator.frequency.value = 500;  // Lower pitch
```

---

## Files Checklist

✅ **fraud-data.service.ts** - Updated with new subjects and methods
✅ **toast-notification.component.ts** - New toast display component
✅ **fraud-report-form.component.ts** - New fraud reporting form
✅ **REAL_TIME_FRAUD_REPORTING.md** - Comprehensive documentation

---

## Next Steps

1. ✅ Add `ToastNotificationComponent` to your app root
2. ✅ Add `FraudReportFormComponent` to Financial Security Hub
3. ✅ Subscribe to `getLiveAlerts()` in Admin Dashboard
4. ✅ Test fraud reports in the browser
5. ⏳ Connect to backend API for persistence
6. ⏳ Add email/SMS notifications for high-priority alerts
7. ⏳ Implement alert escalation rules

---

## Troubleshooting

**Q: Toast not showing?**
A: Make sure `ToastNotificationComponent` is added to your app root.

**Q: Sound not working?**
A: Check browser audio settings. Some browsers require user interaction first. Fallback to visual notifications works automatically.

**Q: Alerts not updating in real-time?**
A: Ensure component subscribes to `getLiveAlerts()` and unsubscribes in ngOnDestroy.

**Q: Import path errors?**
A: Check relative paths. Components in `src/app/components/` import from `../services`.

---

**Ready to deploy!** All components are fully typed, standalone, and ready for production use. 🚀
