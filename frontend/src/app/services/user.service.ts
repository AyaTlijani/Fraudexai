import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { LimitAlertService } from './limit-alert.service';

type TransactionBaseStatus = 'verified' | 'suspect' | 'pending';
export type TransactionStatus = TransactionBaseStatus | 'blocked';
export type TransactionChannel = 'online' | 'atm' | 'pos';
export type PolicyReasonCode =
  | 'LOCKDOWN'
  | 'CARD_FROZEN'
  | 'ONLINE_DISABLED'
  | 'ATM_DISABLED'
  | 'LIMIT_EXCEEDED';

export interface TransactionPolicyDecision {
  blocked: boolean;
  code?: PolicyReasonCode;
  reason?: string;
  triggeredAt?: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  timestamp: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  category: string;
  channel?: TransactionChannel;
  status: TransactionStatus;
  baseStatus?: TransactionBaseStatus;
  policyDecision?: TransactionPolicyDecision;
  isMerchantConfirmed?: boolean;
}

export interface CreditCard {
  cardNumber: string;
  maskedNumber: string;
  expiry: string;
  cvv: string;
  balance: number;
  limit: number;
  holderName: string;
  cardType: 'Visa' | 'MasterCard' | 'Amex';
  isFrozen: boolean;
}

export interface CardSecuritySettings {
  temporaryLimitEnabled: boolean;
  temporaryLimitAmount: number;
  onlinePaymentsEnabled: boolean;
  atmWithdrawalsEnabled: boolean;
  limitAlertSmsEnabled: boolean;
  limitAlertWhatsAppEnabled: boolean;
  emergencyLockdown: boolean;
  travelModeEnabled: boolean;
  travelCountries: string[];
  lastSecurityActionAt: string;
}

export interface UserClient {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  trustScore: number; // 0-100 percentage
  secureStatus: 'Secure' | 'Moderate' | 'At Risk';
  creditCard: CreditCard;
  cardSecurity: CardSecuritySettings;
  recentTransactions: Transaction[];
  whitelistedCountries: string[];
  trustedMerchants: string[];
  lastLogin: string;
  timezone: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private mockCurrentUser: UserClient;
  private currentClientSubject: BehaviorSubject<UserClient>;
  public currentClient$: Observable<UserClient>;

  constructor(private authService: AuthService, private limitAlertService: LimitAlertService) {
    // Initialize with authenticated user or default
    this.mockCurrentUser = this.createDefaultUser();
    this.currentClientSubject = new BehaviorSubject<UserClient>(this.mockCurrentUser);
    this.currentClient$ = this.currentClientSubject.asObservable();

    // Subscribe to auth changes to update user profile
    this.authService.currentAuthUser$.subscribe(authUser => {
      if (authUser) {
        this.mockCurrentUser = this.createUserProfile(authUser.fullName, authUser.email);
        this.currentClientSubject.next(this.mockCurrentUser);
        console.log('[USER SERVICE] Updated profile for:', authUser.fullName);
      }
    });

    console.log('[USER SERVICE] Initialized with current user:', this.mockCurrentUser.name);
  }

  /**
   * Create a user profile based on authenticated user's info
   */
  private createUserProfile(fullName: string, email: string): UserClient {
    // Generate unique ID based on email hash
    const userId = `USR-CLIENT-${Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
    
    // Generate card number based on name
    const cardNumber = this.generateCardNumber(email);
    
    const profile: UserClient = {
      id: userId,
      name: fullName || email.split('@')[0],
      email: email,
      phoneNumber: this.generatePhoneNumber(email),
      trustScore: 80,
      secureStatus: 'Secure',
      creditCard: {
        cardNumber: cardNumber,
        maskedNumber: '**** **** **** ' + cardNumber.slice(-4),
        expiry: this.generateExpiry(),
        cvv: this.generateCVV(),
        balance: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
        limit: 20000,
        holderName: fullName.toUpperCase() || email.split('@')[0].toUpperCase(),
        cardType: this.getRandomCardType(),
        isFrozen: false
      },
      cardSecurity: {
        temporaryLimitEnabled: false,
        temporaryLimitAmount: 1500,
        onlinePaymentsEnabled: true,
        atmWithdrawalsEnabled: true,
        limitAlertSmsEnabled: true,
        limitAlertWhatsAppEnabled: true,
        emergencyLockdown: false,
        travelModeEnabled: false,
        travelCountries: ['USA', 'Canada'],
        lastSecurityActionAt: new Date().toISOString()
      },
      recentTransactions: this.generateMockTransactions(),
      whitelistedCountries: ['USA', 'Canada', 'UK', 'France'],
      trustedMerchants: ['Amazon Store', 'Starbucks Coffee'],
      lastLogin: new Date().toISOString(),
      timezone: 'America/New_York'
    };

    return this.applySecurityPoliciesForUser(profile);
  }

  /**
   * Create default user (if not authenticated)
   */
  private createDefaultUser(): UserClient {
    const profile: UserClient = {
      id: 'USR-CLIENT-001',
      name: 'Guest User',
      email: 'guest@example.com',
      phoneNumber: '+1-202-555-0101',
      trustScore: 75,
      secureStatus: 'Moderate',
      creditCard: {
        cardNumber: '4532123456789012',
        maskedNumber: '**** **** **** 9012',
        expiry: '08/26',
        cvv: '425',
        balance: 3000,
        limit: 15000,
        holderName: 'GUEST USER',
        cardType: 'Visa',
        isFrozen: false
      },
      cardSecurity: {
        temporaryLimitEnabled: false,
        temporaryLimitAmount: 1000,
        onlinePaymentsEnabled: true,
        atmWithdrawalsEnabled: true,
        limitAlertSmsEnabled: true,
        limitAlertWhatsAppEnabled: true,
        emergencyLockdown: false,
        travelModeEnabled: false,
        travelCountries: ['USA'],
        lastSecurityActionAt: new Date().toISOString()
      },
      recentTransactions: [],
      whitelistedCountries: ['USA', 'Canada'],
      trustedMerchants: [],
      lastLogin: new Date().toISOString(),
      timezone: 'America/New_York'
    };

    return this.applySecurityPoliciesForUser(profile);
  }

  private normalizeMerchantName(merchant: string): string {
    return merchant.trim().toLowerCase();
  }

  private inferTransactionChannel(transaction: Transaction): TransactionChannel {
    const category = transaction.category.toLowerCase();
    const merchant = transaction.merchant.toLowerCase();

    if (category.includes('atm') || category.includes('cash') || merchant.includes('atm')) {
      return 'atm';
    }

    if (category.includes('online') || merchant.includes('online') || category.includes('streaming') || merchant.includes('streaming')) {
      return 'online';
    }

    return 'pos';
  }

  private evaluateTransactionAgainstSecurity(transaction: Transaction, user: UserClient): Transaction {
    const channel = transaction.channel || this.inferTransactionChannel(transaction);
    const baseStatus: TransactionBaseStatus =
      transaction.baseStatus ||
      (transaction.status === 'blocked' ? 'suspect' : (transaction.status as TransactionBaseStatus));

    const nowIso = new Date().toISOString();
    const security = user.cardSecurity;
    let policyDecision: TransactionPolicyDecision | undefined;

    if (security.emergencyLockdown) {
      policyDecision = {
        blocked: true,
        code: 'LOCKDOWN',
        reason: 'Emergency lockdown is currently active',
        triggeredAt: nowIso
      };
    } else if (user.creditCard.isFrozen) {
      policyDecision = {
        blocked: true,
        code: 'CARD_FROZEN',
        reason: 'Card is frozen',
        triggeredAt: nowIso
      };
    } else if (security.temporaryLimitEnabled && transaction.amount > security.temporaryLimitAmount) {
      policyDecision = {
        blocked: true,
        code: 'LIMIT_EXCEEDED',
        reason: `Amount exceeds temporary cap of $${security.temporaryLimitAmount}`,
        triggeredAt: nowIso
      };
    } else if (channel === 'online' && !security.onlinePaymentsEnabled) {
      policyDecision = {
        blocked: true,
        code: 'ONLINE_DISABLED',
        reason: 'Online payments are disabled',
        triggeredAt: nowIso
      };
    } else if (channel === 'atm' && !security.atmWithdrawalsEnabled) {
      policyDecision = {
        blocked: true,
        code: 'ATM_DISABLED',
        reason: 'ATM withdrawals are disabled',
        triggeredAt: nowIso
      };
    }

    if (policyDecision) {
      return {
        ...transaction,
        channel,
        baseStatus,
        status: 'blocked',
        policyDecision
      };
    }

    return {
      ...transaction,
      channel,
      baseStatus,
      status: baseStatus,
      policyDecision: undefined
    };
  }

  private applySecurityPoliciesForUser(user: UserClient): UserClient {
    return {
      ...user,
      recentTransactions: user.recentTransactions.map(transaction =>
        this.evaluateTransactionAgainstSecurity(transaction, user)
      )
    };
  }

  /**
   * Generate a unique card number based on email
   */
  private generateCardNumber(email: string): string {
    // Visa card format: 4532 followed by random digits
    const prefix = '4532';
    const random = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
    return prefix + random;
  }

  private generatePhoneNumber(email: string): string {
    const hash = Math.abs(
      email.split('').reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0)
    );
    const sevenDigits = String(hash % 10000000).padStart(7, '0');
    return `+1-202-${sevenDigits.slice(0, 3)}-${sevenDigits.slice(3)}`;
  }

  /**
   * Generate expiry date (current year + 4 years)
   */
  private generateExpiry(): string {
    const currentYear = new Date().getFullYear();
    const expiryYear = (currentYear + 4) % 100;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${month}/${String(expiryYear).padStart(2, '0')}`;
  }

  /**
   * Generate random CVV
   */
  private generateCVV(): string {
    return String(Math.floor(Math.random() * 900) + 100);
  }

  /**
   * Get random card type
   */
  private getRandomCardType(): 'Visa' | 'MasterCard' | 'Amex' {
    const types: ('Visa' | 'MasterCard' | 'Amex')[] = ['Visa', 'MasterCard', 'Amex'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Generate mock transactions for display
   */
  private generateMockTransactions(): Transaction[] {
    return [
      {
        id: 'TXN-1',
        merchant: 'Amazon Store',
        amount: 89.99,
        timestamp: '2026-04-08 14:32:15',
        location: { city: 'New York', country: 'USA' },
        category: 'Shopping',
        channel: 'online',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      },
      {
        id: 'TXN-2',
        merchant: 'Tokyo Retail Int\'l',
        amount: 2500.00,
        timestamp: '2026-04-08 12:15:42',
        location: { city: 'Tokyo', country: 'Japan' },
        category: 'Shopping',
        channel: 'online',
        status: 'suspect',
        baseStatus: 'suspect',
        isMerchantConfirmed: false
      },
      {
        id: 'TXN-3',
        merchant: 'Starbucks Coffee',
        amount: 12.45,
        timestamp: '2026-04-08 09:23:18',
        location: { city: 'San Francisco', country: 'USA' },
        category: 'Food & Beverage',
        channel: 'pos',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      },
      {
        id: 'TXN-4',
        merchant: 'Target Store',
        amount: 156.72,
        timestamp: '2026-04-07 18:45:33',
        location: { city: 'Seattle', country: 'USA' },
        category: 'Shopping',
        channel: 'pos',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      },
      {
        id: 'TXN-5',
        merchant: 'Netflix Streaming',
        amount: 15.99,
        timestamp: '2026-04-07 00:00:00',
        location: { city: 'Los Angeles', country: 'USA' },
        category: 'Entertainment',
        channel: 'online',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      },
      {
        id: 'TXN-6',
        merchant: 'Unknown Online Store',
        amount: 499.99,
        timestamp: '2026-04-06 16:20:10',
        location: { city: 'Singapore', country: 'Singapore' },
        category: 'Online Purchase',
        channel: 'online',
        status: 'suspect',
        baseStatus: 'suspect',
        isMerchantConfirmed: false
      },
      {
        id: 'TXN-7',
        merchant: 'ATM Midtown',
        amount: 380.00,
        timestamp: '2026-04-06 09:11:00',
        location: { city: 'New York', country: 'USA' },
        category: 'Cash Withdrawal',
        channel: 'atm',
        status: 'verified',
        baseStatus: 'verified',
        isMerchantConfirmed: true
      }
    ];
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): UserClient {
    return this.mockCurrentUser;
  }

  /**
   * Update user data (e.g., after transaction update)
   */
  updateUser(updatedUser: Partial<UserClient>): void {
    this.mockCurrentUser = { ...this.mockCurrentUser, ...updatedUser };
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Add transaction to recent transactions
   */
  addTransaction(transaction: Transaction): void {
    const nextUser = this.applySecurityPoliciesForUser({
      ...this.mockCurrentUser,
      recentTransactions: [transaction, ...this.mockCurrentUser.recentTransactions]
    });
    const insertedTransaction = nextUser.recentTransactions[0];

    this.mockCurrentUser = nextUser;
    this.currentClientSubject.next(this.mockCurrentUser);
    this.dispatchLimitExceededAlert(insertedTransaction);
  }

  private dispatchLimitExceededAlert(transaction: Transaction): void {
    if (transaction.policyDecision?.code !== 'LIMIT_EXCEEDED') {
      return;
    }

    const settings = this.mockCurrentUser.cardSecurity;
    const shouldSendSms = settings.limitAlertSmsEnabled;
    const shouldSendWhatsApp = settings.limitAlertWhatsAppEnabled;

    if (!shouldSendSms && !shouldSendWhatsApp) {
      return;
    }

    this.limitAlertService.dispatchLimitReachedAlert({
      userId: this.mockCurrentUser.id,
      userName: this.mockCurrentUser.name,
      destinationPhone: this.mockCurrentUser.phoneNumber,
      transactionId: transaction.id,
      transactionAmount: transaction.amount,
      temporaryLimitAmount: settings.temporaryLimitAmount,
      reason: transaction.policyDecision.reason || 'Transaction blocked by temporary spending cap',
      sendSms: shouldSendSms,
      sendWhatsApp: shouldSendWhatsApp
    });
  }

  /**
   * Update one transaction status in the local profile timeline
   */
  updateTransactionStatus(transactionId: string, status: TransactionBaseStatus): void {
    this.mockCurrentUser = this.applySecurityPoliciesForUser({
      ...this.mockCurrentUser,
      recentTransactions: this.mockCurrentUser.recentTransactions.map(txn =>
        txn.id === transactionId
          ? {
              ...txn,
              baseStatus: status,
              status
            }
          : txn
      )
    });
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Freeze or unfreeze the active card
   */
  setCardFrozen(isFrozen: boolean): void {
    if (!isFrozen && this.mockCurrentUser.cardSecurity.emergencyLockdown) {
      // Lockdown state does not allow manual unfreeze.
      return;
    }

    this.mockCurrentUser = this.applySecurityPoliciesForUser({
      ...this.mockCurrentUser,
      creditCard: {
        ...this.mockCurrentUser.creditCard,
        isFrozen
      },
      cardSecurity: {
        ...this.mockCurrentUser.cardSecurity,
        lastSecurityActionAt: new Date().toISOString()
      }
    });
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Update card security controls
   */
  updateCardSecurity(settings: Partial<CardSecuritySettings>): void {
    const mergedSecurity: CardSecuritySettings = {
      ...this.mockCurrentUser.cardSecurity,
      ...settings,
      lastSecurityActionAt: new Date().toISOString()
    };

    let nextUser: UserClient = {
      ...this.mockCurrentUser,
      cardSecurity: mergedSecurity
    };

    if (mergedSecurity.emergencyLockdown) {
      mergedSecurity.onlinePaymentsEnabled = false;
      mergedSecurity.atmWithdrawalsEnabled = false;
      nextUser = {
        ...nextUser,
        creditCard: {
          ...nextUser.creditCard,
          isFrozen: true
        },
        cardSecurity: mergedSecurity
      };
    }

    this.mockCurrentUser = this.applySecurityPoliciesForUser(nextUser);
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  setTemporaryLimit(enabled: boolean, amount: number): void {
    this.updateCardSecurity({
      temporaryLimitEnabled: enabled,
      temporaryLimitAmount: Math.max(100, Math.min(5000, Math.round(amount)))
    });
  }

  setEmergencyLockdown(enabled: boolean): void {
    if (enabled) {
      this.updateCardSecurity({ emergencyLockdown: true });
      return;
    }

    this.updateCardSecurity({
      emergencyLockdown: false,
      onlinePaymentsEnabled: true,
      atmWithdrawalsEnabled: true
    });
    this.setCardFrozen(false);
  }

  addTravelCountryToSecurity(country: string): void {
    const cleanCountry = country.trim();
    if (!cleanCountry) return;

    const exists = this.mockCurrentUser.cardSecurity.travelCountries.includes(cleanCountry);
    if (exists) return;

    this.updateCardSecurity({
      travelCountries: [...this.mockCurrentUser.cardSecurity.travelCountries, cleanCountry],
      travelModeEnabled: true
    });
  }

  removeTravelCountryFromSecurity(country: string): void {
    this.updateCardSecurity({
      travelCountries: this.mockCurrentUser.cardSecurity.travelCountries.filter(c => c !== country)
    });
  }

  /**
   * Update trust score (called after fraud analysis)
   */
  updateTrustScore(newScore: number): void {
    this.mockCurrentUser.trustScore = Math.max(0, Math.min(100, newScore));
    this.mockCurrentUser.secureStatus = this.calculateSecureStatus(newScore);
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Calculate secure status based on trust score
   */
  private calculateSecureStatus(score: number): 'Secure' | 'Moderate' | 'At Risk' {
    if (score >= 75) return 'Secure';
    if (score >= 50) return 'Moderate';
    return 'At Risk';
  }

  /**
   * Add country to whitelist
   */
  whitelistCountry(country: string): void {
    if (!this.mockCurrentUser.whitelistedCountries.includes(country)) {
      this.mockCurrentUser.whitelistedCountries = [
        ...this.mockCurrentUser.whitelistedCountries,
        country
      ];
      this.currentClientSubject.next(this.mockCurrentUser);
    }
  }

  /**
   * Remove country from whitelist
   */
  removeCountryFromWhitelist(country: string): void {
    this.mockCurrentUser.whitelistedCountries = this.mockCurrentUser.whitelistedCountries.filter(
      (c) => c !== country
    );
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Add merchant to trusted vault
   */
  addTrustedMerchant(merchant: string): void {
    const cleanMerchant = merchant.trim();
    if (!cleanMerchant) return;

    const normalized = this.normalizeMerchantName(cleanMerchant);
    const exists = this.mockCurrentUser.trustedMerchants.some(
      m => this.normalizeMerchantName(m) === normalized
    );

    if (!exists) {
      this.mockCurrentUser.trustedMerchants = [
        cleanMerchant,
        ...this.mockCurrentUser.trustedMerchants
      ];
      this.currentClientSubject.next(this.mockCurrentUser);
    }
  }

  /**
   * Remove merchant from trusted vault
   */
  removeTrustedMerchant(merchant: string): void {
    const normalized = this.normalizeMerchantName(merchant);
    this.mockCurrentUser.trustedMerchants = this.mockCurrentUser.trustedMerchants.filter(
      m => this.normalizeMerchantName(m) !== normalized
    );
    this.currentClientSubject.next(this.mockCurrentUser);
  }

  /**
   * Check if merchant is trusted
   */
  isMerchantTrusted(merchant: string): boolean {
    const normalized = this.normalizeMerchantName(merchant);
    return this.mockCurrentUser.trustedMerchants.some(
      m => this.normalizeMerchantName(m) === normalized
    );
  }

  /**
   * Get country flag emoji
   */
  getCountryFlag(countryCode: string): string {
    const countryToFlag: { [key: string]: string } = {
      USA: '🇺🇸',
      Canada: '🇨🇦',
      UK: '🇬🇧',
      France: '🇫🇷',
      Germany: '🇩🇪',
      Japan: '🇯🇵',
      Singapore: '🇸🇬',
      India: '🇮🇳',
      Australia: '🇦🇺',
      Brazil: '🇧🇷',
      Mexico: '🇲🇽',
      Spain: '🇪🇸',
      Italy: '🇮🇹',
      Netherlands: '🇳🇱',
      Switzerland: '🇨🇭',
      Sweden: '🇸🇪',
      Norway: '🇳🇴',
      Denmark: '🇩🇰',
      Belgium: '🇧🇪',
      Korea: '🇰🇷'
    };
    return countryToFlag[countryCode] || '🌍';
  }
}
