import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import { LanguageService } from '../services/language.service';
import { FraudBridgeService, ReportStatus } from '../services/fraud-bridge.service';
import { UserService, UserClient, Transaction } from '../services/user.service';
import { FraudDataService, InvestigationCase } from '../services/fraud-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './client-hub.component.html',
  styleUrls: ['./client-hub.component.scss']
})
export class ClientHubComponent implements OnInit, OnDestroy {
  // Observable data from UserService
  currentClient$: any;
  currentClient: UserClient | null = null;

  // Transaction properties
  blockedTransactions: Transaction[] = [];
  suspectTransactions: Transaction[] = [];
  verifiedTransactions: Transaction[] = [];
  pendingTransactions: Transaction[] = [];

  // UI State
  reportStatus: ReportStatus = {
    isLoading: false,
    success: false,
    error: null,
    message: ''
  };

  activeAlerts: number = 0;
  openCases: number = 0;
  recentCases: InvestigationCase[] = [];
  selectedCase: InvestigationCase | null = null;
  allClientCases: InvestigationCase[] = [];
  currentHour: number = new Date().getHours();
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night' = this.getTimeOfDay();

  // Added countries list for travel mode
  availableCountries = [
    'USA', 'Canada', 'UK', 'France', 'Germany', 'Japan', 
    'Singapore', 'India', 'Australia', 'Brazil', 'Mexico'
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private fraudBridgeService: FraudBridgeService,
    private userService: UserService,
    private fraudDataService: FraudDataService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user data
    this.currentClient$ = this.userService.currentClient$;
    this.subscriptions.push(
      this.currentClient$.subscribe((user: UserClient) => {
        this.currentClient = user;
        this.categorizeTransactions();
        this.refreshCaseStats(this.fraudDataService.getCasesValue());
      })
    );

    // Subscribe to fraud report status
    this.subscriptions.push(
      this.fraudBridgeService.getReportStatus().subscribe((status: ReportStatus) => {
        this.reportStatus = status;
      })
    );

    this.subscriptions.push(
      this.fraudDataService.getCases().subscribe(cases => {
        this.refreshCaseStats(cases);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Categorize transactions into suspect and verified
   */
  private categorizeTransactions(): void {
    if (this.currentClient?.recentTransactions) {
      this.blockedTransactions = this.currentClient.recentTransactions.filter(
        t => t.status === 'blocked'
      );
      this.suspectTransactions = this.currentClient.recentTransactions.filter(
        t => t.status === 'suspect'
      );
      this.verifiedTransactions = this.currentClient.recentTransactions.filter(
        t => t.status === 'verified'
      );
      this.pendingTransactions = this.currentClient.recentTransactions.filter(
        t => t.status === 'pending'
      );
    }
  }

  private refreshCaseStats(cases: InvestigationCase[]): void {
    if (!this.currentClient) {
      this.openCases = 0;
      this.recentCases = [];
      this.activeAlerts = 0;
      this.allClientCases = [];
      this.selectedCase = null;
      return;
    }

    this.allClientCases = cases
      .filter(c => c.userId === this.currentClient!.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    this.openCases = this.allClientCases.filter(c => c.status !== 'resolved').length;
    this.recentCases = this.allClientCases.slice(0, 3);
    this.activeAlerts = this.openCases;

    if (!this.selectedCase && this.recentCases.length > 0) {
      this.selectedCase = this.recentCases[0];
    }

    if (this.selectedCase) {
      this.selectedCase = this.allClientCases.find(c => c.caseId === this.selectedCase!.caseId) || this.selectedCase;
    }
  }

  /**
   * Get time of day greeting (EN)
   */
  private getTimeOfDay(): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  }

  /**
   * Get French time of day greeting
   */
  getTimeOfDayFrench(): string {
    const hour = new Date().getHours();
    const language = this.languageService.getCurrentLanguage();

    if (language === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      if (hour < 21) return 'Good evening';
      return 'Good night';
    }

    if (language === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      if (hour < 21) return 'مساء النور';
      return 'ليلة سعيدة';
    }

    if (hour < 12) return 'Bonjour';
    if (hour < 17) return 'Bon apres-midi';
    if (hour < 21) return 'Bonsoir';
    return 'Bonne nuit';
  }

  /**
   * Get masked card number (first 12 digits masked, show last 4)
   */
  getMaskedCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const lastFour = cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  }

  /**
   * Get security score color (Green >80, Orange 50-80, Red <50)
   */
  getScoreColor(score: number): string {
    if (score > 80) return '#00E676';
    if (score >= 50) return '#FFD700';
    return '#FF4D4D';
  }

  /**
   * Get trust score ngStyle object for color binding
   */
  getTrustScoreStyle(score: number): { [key: string]: string } {
    let color: string;

    if (score > 80) {
      color = '#00E676';
    } else if (score >= 50) {
      color = '#FFD700';
    } else {
      color = '#FF4D4D';
    }

    return {
      'color': color,
      'font-weight': '600',
      'text-transform': 'uppercase',
      'letter-spacing': '0.5px'
    };
  }

  /**
   * Get trust score percentage style for circular gauge
   */
  getTrustScoreAngle(score: number): number {
    return (score / 100) * 360;
  }

  /**
   * Report fraud for a specific transaction
   */
  onReportFraud(transaction: Transaction): void {
    if (!this.currentClient) {
      console.error('No user data available');
      return;
    }

    const userId = this.currentClient.id;
    this.fraudBridgeService.reportClientFraud(userId, {
      transactionAmount: transaction.amount,
      merchant: transaction.merchant,
      timestamp: transaction.timestamp,
      location: `${transaction.location.city}, ${transaction.location.country}`,
      description: `Suspected fraudulent transaction at ${transaction.merchant}`
    });

    console.log('[CLIENT HUB] Fraud report submitted', {
      userId,
      transaction,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Confirm transaction is legitimate (Oui, c'était moi)
   */
  onConfirmTransaction(transaction: Transaction): void {
    if (transaction.status === 'blocked') {
      this.reportStatus = {
        isLoading: false,
        success: false,
        error: `Transaction blocked by policy (${this.getPolicyReasonCode(transaction)}): ${this.getPolicyReasonText(transaction)}`,
        message: ''
      };
      return;
    }

    console.log('[CLIENT HUB] Transaction confirmed as legitimate:', transaction.id);
    console.log('[CLIENT HUB] User confirmed: "Oui, c\'était moi" for transaction:', transaction.id);
    this.userService.updateTransactionStatus(transaction.id, 'verified');

    if (!this.userService.isMerchantTrusted(transaction.merchant)) {
      this.userService.addTrustedMerchant(transaction.merchant);
    }

    if (this.currentClient) {
      this.userService.updateTrustScore(Math.min(100, this.currentClient.trustScore + 2));
    }
  }

  /**
   * Report transaction as fraud (Non, ce n'était pas moi)
   * Calls FraudBridgeService.reportClientFraud()
   */
  onRejectTransaction(transaction: Transaction): void {
    if (!this.currentClient) {
      console.error('No user data available');
      return;
    }

    console.log('[CLIENT HUB] Transaction rejected as fraudulent:', transaction.id);
    console.log('[CLIENT HUB] User responded: "Non, ce n\'était pas moi" for transaction:', transaction.id);

    // Call FraudBridgeService to report fraud
    const userId = this.currentClient.id;
    const policySuffix = this.isPolicyBlocked(transaction)
      ? ` [ReasonCode:${this.getPolicyReasonCode(transaction)}] ${this.getPolicyReasonText(transaction)}`
      : '';

    this.fraudBridgeService.reportClientFraud(userId, {
      transactionAmount: transaction.amount,
      merchant: transaction.merchant,
      timestamp: transaction.timestamp,
      location: `${transaction.location.city}, ${transaction.location.country}`,
      description: `Transaction suspecte - utilisateur a confirmé: "Non, ce n'était pas moi" - ${transaction.merchant}${policySuffix}`
    });

    this.userService.updateTransactionStatus(transaction.id, 'pending');

    // Auto-freeze card for high-risk disputes.
    if (transaction.amount >= 1000 && !this.currentClient.creditCard.isFrozen) {
      this.userService.setCardFrozen(true);
    }

    this.userService.updateTrustScore(Math.max(0, this.currentClient.trustScore - 4));

    console.log('[CLIENT HUB] Fraud report submitted successfully', {
      userId,
      transaction,
      timestamp: new Date().toISOString()
    });
  }

  toggleCardFreeze(): void {
    if (!this.currentClient) return;
    this.userService.setCardFrozen(!this.currentClient.creditCard.isFrozen);
  }

  getTrustedMerchants(): string[] {
    return this.currentClient?.trustedMerchants || [];
  }

  getSuggestedTrustedMerchants(): string[] {
    const trusted = new Set(this.getTrustedMerchants().map(m => m.toLowerCase()));
    const suggestions: string[] = [];

    this.verifiedTransactions.forEach(tx => {
      const key = tx.merchant.toLowerCase();
      if (!trusted.has(key) && !suggestions.some(s => s.toLowerCase() === key)) {
        suggestions.push(tx.merchant);
      }
    });

    return suggestions.slice(0, 4);
  }

  isMerchantTrusted(merchant: string): boolean {
    return this.userService.isMerchantTrusted(merchant);
  }

  onTrustMerchant(merchant: string): void {
    this.userService.addTrustedMerchant(merchant);
    if (this.currentClient) {
      this.userService.updateTrustScore(Math.min(100, this.currentClient.trustScore + 1));
    }
  }

  onRemoveTrustedMerchant(merchant: string): void {
    this.userService.removeTrustedMerchant(merchant);
  }

  selectCase(caseId: string): void {
    this.selectedCase = this.allClientCases.find(c => c.caseId === caseId) || null;
  }

  getCaseStatusLabel(status: string): string {
    const language = this.languageService.getCurrentLanguage();

    if (language === 'en') {
      switch (status) {
        case 'triage':
          return 'Triage Queue';
        case 'investigating':
          return 'Under Investigation';
        case 'escalated':
          return 'Escalated';
        case 'resolved':
          return 'Resolved';
        default:
          return 'Open';
      }
    }

    if (language === 'ar') {
      switch (status) {
        case 'triage':
          return 'قائمة الفرز';
        case 'investigating':
          return 'قيد التحقيق';
        case 'escalated':
          return 'مصعد';
        case 'resolved':
          return 'تم الحل';
        default:
          return 'مفتوح';
      }
    }

    switch (status) {
      case 'triage':
        return 'File de triage';
      case 'investigating':
        return 'En investigation';
      case 'escalated':
        return 'Escalade';
      case 'resolved':
        return 'Resolue';
      default:
        return 'Ouverte';
    }
  }

  getCaseStatusClass(status: string): string {
    return `status-${status}`;
  }

  isPolicyBlocked(transaction: Transaction): boolean {
    return transaction.status === 'blocked' && !!transaction.policyDecision?.code;
  }

  getPolicyReasonCode(transaction: Transaction): string {
    return transaction.policyDecision?.code || 'MANUAL_REVIEW';
  }

  getPolicyReasonText(transaction: Transaction): string {
    if (transaction.policyDecision?.reason) {
      return transaction.policyDecision.reason;
    }
    if (transaction.status === 'suspect') {
      return 'Transaction flagged by anomaly engine';
    }
    return 'Under manual verification';
  }

  formatPolicyCode(code: string): string {
    return code.replace(/_/g, ' ');
  }

  extractReasonCodes(text?: string): string[] {
    if (!text) return [];
    const matches = [...text.matchAll(/ReasonCode:([A-Z_]+)/g)].map(m => m[1]);
    return Array.from(new Set(matches));
  }

  getReviewNeededCount(): number {
    return this.suspectTransactions.length + this.blockedTransactions.length;
  }

  formatEventTime(isoTimestamp: string): string {
    const d = new Date(isoTimestamp);
    if (Number.isNaN(d.getTime())) {
      return isoTimestamp;
    }
    return d.toLocaleString();
  }

  /**
   * Whitelist a country for travel
   */
  onWhitelistCountry(country: string): void {
    this.userService.whitelistCountry(country);
    console.log('[TRAVEL MODE] Whitelisted country:', country);
  }

  /**
   * Remove country from whitelist
   */
  onRemoveCountryFromWhitelist(country: string): void {
    this.userService.removeCountryFromWhitelist(country);
    console.log('[TRAVEL MODE] Removed country from whitelist:', country);
  }

  /**
   * Get available countries not yet whitelisted
   */
  getAvailableCountriesToAdd(): string[] {
    if (!this.currentClient) return [];
    return this.availableCountries.filter(
      country => !this.currentClient!.whitelistedCountries.includes(country)
    );
  }

  /**
   * Get flag emoji for country
   */
  getCountryFlag(country: string): string {
    return this.userService.getCountryFlag(country);
  }

  /**
   * Reset report status
   */
  resetReport(): void {
    this.fraudBridgeService.resetReportStatus();
  }

  /**
   * Check if currently loading
   */
  isLoading(): boolean {
    return this.reportStatus.isLoading;
  }
}
