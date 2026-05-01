import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { FraudBridgeService } from './fraud-bridge.service';
import { FraudDataService } from './fraud-data.service';

export interface MLScores {
  autoencoderError: number; // 0-100: High if amount > 2000
  attentionWeight: number;  // 0-100: High if location is new
  transformerScore: number; // 0-100: Final fraud probability
}

export interface SimulatedTransaction {
  id: string;
  merchant: string;
  amount: number;
  timestamp: string;
  location: {
    city: string;
    country: string;
  };
  category: string;
  isAnomaly: boolean;
  mlScores: MLScores;
  isFraudAlert: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  // Observable stream of simulated transactions
  private simulatedTransactionsSubject = new BehaviorSubject<SimulatedTransaction[]>([]);
  public simulatedTransactions$: Observable<SimulatedTransaction[]> = this.simulatedTransactionsSubject.asObservable();

  // Track recent locations to identify "new" locations (for attentionWeight)
  private recentLocations: Set<string> = new Set([
    'New York', 'Los Angeles', 'San Francisco', 'Seattle', 'Boston',
    'London', 'Paris', 'Tokyo', 'Singapore', 'Dubai'
  ]);

  private simulationRunning = false;
  private transactionCount = 0;
  private simulationSub: Subscription | null = null;

  // Mock merchants
  private merchants = [
    'Amazon Store', 'Starbucks Coffee', 'Target Store', 'Best Buy',
    'iTunes Store', 'Netflix Streaming', 'Uber', 'Lyft', 'DoorDash',
    'Walmart', 'Gas Station Shell', 'Hotel Hyatt', 'Flights Delta',
    'Tokyo Retail Int\'l', 'Unknown Online Store', 'Dark Web Market'
  ];

  // Mock cities
  private cities = [
    { city: 'New York', country: 'USA' },
    { city: 'Los Angeles', country: 'USA' },
    { city: 'San Francisco', country: 'USA' },
    { city: 'London', country: 'UK' },
    { city: 'Paris', country: 'France' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'Singapore', country: 'Singapore' },
    { city: 'Dubai', country: 'UAE' },
    { city: 'Sydney', country: 'Australia' },
    { city: 'Mumbai', country: 'India' },
    { city: 'Toronto', country: 'Canada' },
    { city: 'Berlin', country: 'Germany' },
    { city: 'Seoul', country: 'South Korea' },
    { city: 'Bangkok', country: 'Thailand' },
    { city: 'Moscow', country: 'Russia' }
  ];

  private categories = [
    'Shopping', 'Food & Beverage', 'Entertainment', 'Travel',
    'Gas Station', 'Hotel', 'Online Purchase', 'Streaming'
  ];

  constructor(
    private fraudBridgeService: FraudBridgeService,
    private fraudDataService: FraudDataService
  ) {
    console.log('[SIMULATION SERVICE] Initialized - AI Engine ready');
  }

  /**
   * Start the simulation - generates transaction every 30 seconds
   */
  startSimulation(): void {
    if (this.simulationRunning) {
      console.log('[SIMULATION SERVICE] Simulation already running');
      return;
    }

    this.simulationRunning = true;
    console.log('[SIMULATION SERVICE] ▶️ Starting transaction simulation (30s interval)');

    // Generate first transaction immediately
    this.generateTransaction();

    // Then generate every 30 seconds
    this.simulationSub = interval(30000).subscribe(() => {
      this.generateTransaction();
    });
  }

  /**
   * Stop the simulation
   */
  stopSimulation(): void {
    this.simulationRunning = false;
    if (this.simulationSub) {
      this.simulationSub.unsubscribe();
      this.simulationSub = null;
    }
    console.log('[SIMULATION SERVICE] ⏹️ Simulation stopped');
  }

  /**
   * Generate a random transaction and apply ML analysis
   */
  private generateTransaction(): void {
    this.transactionCount++;

    // 90% Normal, 10% Anomaly
    const isAnomaly = Math.random() < 0.1;

    // Generate transaction data
    const transaction = this.createRandomTransaction(isAnomaly);

    const threshold = this.fraudDataService.getFraudThreshold();

    // Calculate ML scores
    transaction.mlScores = this.calculateMLScores(transaction, threshold);

    // Check if this is a fraud alert based on analyst-defined threshold.
    transaction.isFraudAlert = transaction.mlScores.transformerScore > threshold;

    // Log the transaction
    console.log(`[SIMULATION SERVICE] Transaction #${this.transactionCount}:`, {
      type: transaction.isAnomaly ? '⚠️ ANOMALY' : '✓ NORMAL',
      merchant: transaction.merchant,
      amount: transaction.amount,
      mlScores: transaction.mlScores,
      threshold,
      isFraudAlert: transaction.isFraudAlert ? '🚨 FRAUD ALERT' : ''
    });

    // Add to transactions list
    const currentTransactions = this.simulatedTransactionsSubject.value;
    this.simulatedTransactionsSubject.next([transaction, ...currentTransactions]);

    // If fraud alert, push to FraudBridgeService
    if (transaction.isFraudAlert) {
      this.pushFraudAlert(transaction);
    }
  }

  /**
   * Create a random transaction
   */
  private createRandomTransaction(isAnomaly: boolean): SimulatedTransaction {
    const randomCity = this.cities[Math.floor(Math.random() * this.cities.length)];
    const hour = new Date().getHours();
    const isUnusualHour = hour < 6 || hour > 23; // Transactions between 12am-6am or after 11pm

    let amount: number;
    if (isAnomaly) {
      // Anomaly: either high amount or unusual hour
      if (Math.random() < 0.5) {
        // High amount (> 2000)
        amount = parseFloat((Math.random() * 5000 + 2000).toFixed(2));
      } else {
        // Normal amount but at unusual hour
        amount = parseFloat((Math.random() * 200 + 10).toFixed(2));
      }
    } else {
      // Normal transaction
      amount = parseFloat((Math.random() * 300 + 10).toFixed(2));
    }

    const transaction: SimulatedTransaction = {
      id: `TXN-SIM-${this.transactionCount}`,
      merchant: this.merchants[Math.floor(Math.random() * this.merchants.length)],
      amount: amount,
      timestamp: new Date().toISOString(),
      location: randomCity,
      category: this.categories[Math.floor(Math.random() * this.categories.length)],
      isAnomaly: isAnomaly,
      mlScores: { autoencoderError: 0, attentionWeight: 0, transformerScore: 0 }, // Will be calculated
      isFraudAlert: false
    };

    // Track new location
    const locationKey = `${randomCity.city}, ${randomCity.country}`;
    if (!this.recentLocations.has(locationKey)) {
      this.recentLocations.add(locationKey);
    }

    return transaction;
  }

  /**
   * Calculate ML scores for anomaly detection
   */
  private calculateMLScores(transaction: SimulatedTransaction, threshold: number): MLScores {
    // 1. Autoencoder Error: High if amount > 2000
    const autoencoderError = transaction.amount > 2000 
      ? Math.min(100, (transaction.amount - 2000) / 30 + 75) // Scale: 75-100+
      : Math.min(50, (transaction.amount / 2000) * 30);      // Scale: 0-50

    // 2. Attention Weight: High if location is "new" (not in recent locations much)
    const locationKey = `${transaction.location.city}, ${transaction.location.country}`;
    const isNewLocation = this.isLocationNew(locationKey);
    const attentionWeight = isNewLocation ? 85 : 30;

    // 3. Transformer Score: Weighted combination with time anomaly boost
    const hour = new Date().getHours();
    const isUnusualHour = hour < 6 || hour > 23;
    const unusualHourBoost = isUnusualHour ? 20 : 0;

    const transformerScore = Math.min(100,
      (autoencoderError * 0.40) +      // Autoencoder weight: 40%
      (attentionWeight * 0.35) +       // Attention weight: 35%
      (unusualHourBoost * 0.25)        // Unusual hour: 25%
    );

    console.log(`[SIMULATION SERVICE] ML Analysis for ${transaction.merchant}:`, {
      autoencoderError: autoencoderError.toFixed(2),
      attentionWeight: attentionWeight.toFixed(2),
      transformerScore: transformerScore.toFixed(2),
      threshold,
      isFraud: transformerScore > threshold ? '🚨 YES' : '✓ NO'
    });

    return {
      autoencoderError: parseFloat(autoencoderError.toFixed(2)),
      attentionWeight: parseFloat(attentionWeight.toFixed(2)),
      transformerScore: parseFloat(transformerScore.toFixed(2))
    };
  }

  /**
   * Check if location is new (using simple heuristic)
   */
  private isLocationNew(locationKey: string): boolean {
    // If it's not in our common locations, it's "new"
    const commonLocations = [
      'New York, USA', 'Los Angeles, USA', 'San Francisco, USA',
      'London, UK', 'Paris, France', 'Tokyo, Japan', 'Singapore, Singapore'
    ];
    return !commonLocations.includes(locationKey);
  }

  /**
   * Push fraud alert to FraudBridgeService for Admin dashboard
   */
  private pushFraudAlert(transaction: SimulatedTransaction): void {
    console.log(`[SIMULATION SERVICE] 🚨 PUSHING FRAUD ALERT to FraudBridgeService`, transaction.id);

    // Call FraudBridgeService to broadcast alert
    this.fraudBridgeService.reportServerFraud({
      transactionAmount: transaction.amount,
      merchant: transaction.merchant,
      timestamp: transaction.timestamp,
      location: `${transaction.location.city}, ${transaction.location.country}`,
      description: `AI DETECTED: High fraud probability (${transaction.mlScores.transformerScore}%) - ${transaction.merchant}`,
      fraudDetectionScores: {
        autoencoderError: transaction.mlScores.autoencoderError,
        attentionWeight: transaction.mlScores.attentionWeight,
        transformerScore: transaction.mlScores.transformerScore
      }
    });
  }

  /**
   * Get all simulated transactions
   */
  getSimulatedTransactions(): SimulatedTransaction[] {
    return this.simulatedTransactionsSubject.value;
  }

  /**
   * Get transaction count
   */
  getTransactionCount(): number {
    return this.transactionCount;
  }

  /**
   * Clear all transactions (for testing)
   */
  clearTransactions(): void {
    this.transactionCount = 0;
    this.simulatedTransactionsSubject.next([]);
    console.log('[SIMULATION SERVICE] Transactions cleared');
  }

  /**
   * Get simulation status
   */
  isRunning(): boolean {
    return this.simulationRunning;
  }
}
