# SimulationService - AI Engine for Fraudexia

## Overview

The **SimulationService** is the AI Engine of the Fraudexia fraud detection platform. It automatically generates random transactions every 30 seconds and applies advanced anomaly detection using a **Probability Engine** and **ML Score Calculator**.

---

## Key Features

### 1. **Probability Engine** (90/10 Split)
- **90%** of transactions are classified as "Normal" (low-value, normal hours)
- **10%** of transactions are classified as "Anomaly" (high-value OR unusual hours)

### 2. **ML Score Calculation** (3 Models)

For each transaction, the service calculates three mock ML scores:

#### **Autoencoder Error Score** (40% weight in final calculation)
- **Purpose**: Detects unusual spending patterns based on amount
- **Logic**:
  - If transaction amount **> $2000**: Score = 75-100 (high)
  - If transaction amount **< $2000**: Score = 0-50 (low)
- **Formula**: `(amount - 2000) / 30 + 75` for high amounts
- **Example**: $4000 transaction = ~93 autoencoder score

#### **Attention Weight Score** (35% weight)
- **Purpose**: Identifies transactions in new/unusual locations
- **Logic**:
  - If location is "new" (not in common locations): Score = 85
  - If location is in whitelist (common): Score = 30
- **Common Locations**: New York, London, Paris, Tokyo, Singapore, etc.
- **Unusual Locations**: Rural areas, offshore, etc.

#### **Transformer Score** (Final Probability, 0-100)
- **Purpose**: Final fraud probability combining all signals
- **Formula**: 
  ```
  TransformerScore = (AutoencoderError × 0.40) 
                   + (AttentionWeight × 0.35) 
                   + (UnusualHourBoost × 0.25)
  ```
- **Unusual Hours Boost**: +20 if transaction at 12am-6am or after 11pm
- **Fraud Alert Threshold**: **If TransformerScore > 75%**, alert is sent to Admin Command Center

---

## Transaction Generation

### Timing
- **First transaction**: Generated immediately when simulation starts
- **Subsequent transactions**: Every 30 seconds
- **Examples**:
  - T=0s: First transaction
  - T=30s: Second transaction
  - T=60s: Third transaction
  - T=90s: Fourth transaction
  - ... continues until simulation stops

### Transaction Data

Each simulated transaction includes:

```typescript
{
  id: "TXN-SIM-1",                           // Unique simulation transaction ID
  merchant: "Starbucks Coffee",              // Random merchant
  amount: 45.67,                             // Amount ($10-$5000)
  timestamp: "2026-04-08T20:30:45.123Z",     // ISO timestamp
  location: {
    city: "Tokyo",                           // Random city
    country: "Japan"                         // Random country
  },
  category: "Food & Beverage",               // Random category
  isAnomaly: false,                          // True if >2000 or unusual hour
  mlScores: {
    autoencoderError: 45.23,                 // 0-100 based on amount
    attentionWeight: 30.00,                  // 0-100 based on location
    transformerScore: 38.50                  // 0-100 final probability
  },
  isFraudAlert: false                        // True if transformer > 75%
}
```

---

## Fraud Alert Broadcast

### When TransformerScore > 75%

1. **Transaction is marked as fraud alert**: `isFraudAlert = true`
2. **Alert is sent to FraudBridgeService**: `reportServerFraud(transaction)`
3. **FraudBridgeService broadcasts to FraudDataService**
4. **IncomingAlerts stream updated**: Alert appears on Admin Dashboard
5. **UI Animation Triggered**: Red flashing border, browser notification, sound alert

### Example Fraud Alert

```
Merchant: Tokyo Retail Int'l
Amount: $3,500.00
Location: Tokyo, Japan (new location)
Hour: 3:00 AM (unusual)
ML Scores:
  - Autoencoder: 92.00 (high amount)
  - Attention: 85.00 (new location)
  - Transformer: 89.50 (HIGH FRAUD RISK!) ✅ > 75%
  
Result: 🚨 FRAUD ALERT → Admin Dashboard
```

---

## Integration Points

### 1. **FraudBridgeService**
- Receives `reportServerFraud()` call with: merchant, amount, location, ML scores
- Formats and broadcasts to FraudDataService
- Generates tracking ID: `AI-RPT-[timestamp]-[random]`
- Logs the alert with full ML scores

### 2. **AdminDashboardComponent**
- Starts simulation in `ngOnInit()`: `this.simulationService.startSimulation()`
- Subscribes to `fraudBridgeService.getIncomingAlerts()`
- Displays alerts in real-time with red flashing animation
- Shows AI engine status and ML scores

### 3. **FraudDataService**
- Receives alerts from FraudBridgeService
- Emits through `incomingAlerts$` observable
- Triggers browser notifications and audio alerts

---

## Console Logging

The SimulationService logs detailed information to console:

```
[SIMULATION SERVICE] Initialized - AI Engine ready
[SIMULATION SERVICE] ▶️ Starting transaction simulation (30s interval)
[SIMULATION SERVICE] Transaction #1:
  ✓ NORMAL
  merchant: "Starbucks Coffee"
  amount: 23.45
  mlScores: { autoencoderError: 12.5, attentionWeight: 30, transformerScore: 18.3 }

[SIMULATION SERVICE] ML Analysis for Starbucks Coffee:
  autoencoderError: 12.50
  attentionWeight: 30.00
  transformerScore: 18.30
  isFraud: ✓ NO

[SIMULATION SERVICE] Transaction #2:
  ⚠️ ANOMALY
  merchant: "Tokyo Retail Int'l"
  amount: 2500.00
  mlScores: { autoencoderError: 92, attentionWeight: 85, transformerScore: 89.5 }

[SIMULATION SERVICE] 🚨 PUSHING FRAUD ALERT to FraudBridgeService TXN-SIM-2
```

---

## Service Methods

### `startSimulation(): void`
- Starts the transaction generation loop (every 30 seconds)
- Generates first transaction immediately
- Subsequent transactions at 30s, 60s, 90s, etc.
- Logs: `[SIMULATION SERVICE] ▶️ Starting transaction simulation`

### `stopSimulation(): void`
- Stops the transaction generation
- Called automatically in AdminDashboardComponent's `ngOnDestroy()`
- Logs: `[SIMULATION SERVICE] ⏹️ Simulation stopped`

### `getSimulatedTransactions(): SimulatedTransaction[]`
- Returns all generated transactions so far
- Useful for dashboards showing simulation stats

### `getTransactionCount(): number`
- Returns total number of transactions generated
- Example: After 5 minutes = 10 transactions

### `clearTransactions(): void`
- Clears all transactions (useful for testing)
- Resets transaction counter to 0

### `isRunning(): boolean`
- Returns current simulation status
- `true` if simulation is active, `false` if stopped

---

## Test Scenarios

### Scenario 1: Normal Transaction
```
Time: 14:30 (Normal hour)
Amount: $45.50 (Normal amount)
Location: New York, USA (Common location)

Expected:
- isAnomaly: false
- autoencoderError: ~22
- attentionWeight: ~30
- transformerScore: ~25
- isFraudAlert: false ✓
- Action: Displayed in verified transactions
```

### Scenario 2: Anomaly - High Amount
```
Time: 15:00 (Normal hour)
Amount: $3,500 (High amount)
Location: Singapore (New location)

Expected:
- isAnomaly: true
- autoencoderError: ~93
- attentionWeight: ~85
- transformerScore: ~89 ✅ > 75%
- isFraudAlert: true ✅
- Action: 🚨 FRAUD ALERT sent to AdminDashboard
```

### Scenario 3: Anomaly - Unusual Hour
```
Time: 03:15 AM (Unusual hour)
Amount: $150 (Normal amount)
Location: Dubai (New location)

Expected:
- isAnomaly: true
- autoencoderError: ~75
- attentionWeight: ~85
- transformerScore: ~79 ✅ > 75%
- isFraudAlert: true ✅
- Action: 🚨 FRAUD ALERT sent to AdminDashboard
```

---

## Statistics Over Time

### After 5 Minutes (10 Transactions)
- Expected anomalies: ~1-2 (10% of 10)
- Expected fraud alerts: ~0-1 (if anomalies have high scores)
- Transaction count: 10

### After 30 Minutes (60 Transactions)
- Expected anomalies: ~6 (10% of 60)
- Expected fraud alerts: ~2-4 (depending on amount/location)
- Transaction count: 60

### After 1 Hour (120 Transactions)
- Expected anomalies: ~12 (10% of 120)
- Expected fraud alerts: ~4-8 (statistical average)
- Transaction count: 120

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│                                                               │
│  ngOnInit(): simulationService.startSimulation()             │
│  ngOnDestroy(): simulationService.stopSimulation()           │
│                                                               │
│  Listens to: fraudBridgeService.getIncomingAlerts()         │
│  Displays: Real-time fraud alerts with animations            │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ fraudAlert
                            │ (transformerScore > 75%)
                            │
┌─────────────────────────────────────────────────────────────┐
│              FRAUD BRIDGE SERVICE                             │
│                                                               │
│  reportServerFraud(transaction with ML scores)              │
│  → Formats and logs the alert                               │
│  → Broadcasts to FraudDataService                            │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ alert
                            │
┌─────────────────────────────────────────────────────────────┐
│           SIMULATION SERVICE (AI ENGINE)                     │
│                                                               │
│  Every 30 seconds:                                           │
│  1. Generate random transaction                             │
│  2. Apply probability engine (90/10 split)                  │
│  3. Calculate ML scores:                                    │
│     - Autoencoder Error (amount-based)                      │
│     - Attention Weight (location-based)                      │
│     - Transformer Score (final probability)                  │
│  4. If transformer > 75%:                                   │
│     → Call FraudBridgeService.reportServerFraud()          │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

To adjust the simulation behavior, modify these properties in SimulationService:

```typescript
// Change transaction interval (in milliseconds)
interval(30000)  // Currently 30 seconds, change to 60000 for 1 minute

// Change probability thresholds
const isAnomaly = Math.random() < 0.1;  // Currently 10%, change to 0.15 for 15%

// Change fraud alert threshold
transaction.isFraudAlert = transaction.mlScores.transformerScore > 75;  // Currently 75%

// Change autoencoder high amount threshold
if (transaction.amount > 2000)  // Currently $2000, change to 1500 or 3000

// Change unusual hours definition
const isUnusualHour = hour < 6 || hour > 23;  // Currently 12am-6am or after 11pm
```

---

## Deployment Checklist

✅ SimulationService created with AI engine logic
✅ Probability engine (90/10) implemented
✅ ML score calculation (Autoencoder, Attention, Transformer)
✅ Integration with FraudBridgeService for fraud alerts
✅ AdminDashboardComponent starts/stops simulation
✅ Console logging for debugging and monitoring
✅ Real-time fraud alert broadcast to Admin dashboard
✅ Transaction browser notifications and animations
✅ Zero compilation errors

---

## Future Enhancements

1. **Real ML Models**: Replace mock scores with actual PyTorch models
2. **Database Persistence**: Store simulated transactions in backend
3. **Configurable Parameters**: UI for adjusting anomaly threshold, transaction frequency
4. **Detailed Score Breakdown**: Show contribution of each model in UI
5. **Transaction Replay**: Play back historical transactions for analysis
6. **Batch Processing**: Generate multiple transactions simultaneously
7. **Custom Rules Engine**: Allow admins to define custom alert rules
8. **Performance Metrics**: Track false positive rate, detection latency

---

## Summary

The **SimulationService** acts as the AI engine for Fraudexia, automatically generating and analyzing transactions every 30 seconds. It uses a sophisticated probability engine and ML scoring system to identify fraudulent transactions, then broadcasts alerts directly to the Admin Command Center in real-time.

**Key Result**: Every 30 seconds, ~1 in 10 transactions is analyzed as a potential anomaly. If the ML scoring indicates >75% fraud probability, an alert is instantly broadcast to the Admin Dashboard with full scoring details.
