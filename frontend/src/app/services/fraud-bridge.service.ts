import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FraudDataService, ClientFraudReport } from './fraud-data.service';

export interface ClientFraudReportRequest {
  transactionAmount: number;
  merchant: string;
  timestamp: string;
  location: string;
  description: string;
  fraudDetectionScores?: {
    autoencoderError: number;
    attentionWeight: number;
    transformerScore: number;
  };
}

export interface ReportStatus {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  message: string;
}

/**
 * FraudBridgeService
 * 
 * Bridge service between client-facing components and the core FraudDataService.
 * Handles:
 * - Client fraud report formatting and validation
 * - Loading state management
 * - Success/error feedback
 * - Real-time report status updates
 */
@Injectable({
  providedIn: 'root'
})
export class FraudBridgeService {
  // Track report submission status
  private reportStatus$ = new BehaviorSubject<ReportStatus>({
    isLoading: false,
    success: false,
    error: null,
    message: ''
  });

  // Last reported transaction ID
  private lastReportedTransactionId$ = new BehaviorSubject<string | null>(null);

  constructor(private fraudDataService: FraudDataService) {}

  /**
   * Get the incoming alerts stream from FraudDataService
   */
  getIncomingAlerts(): Observable<any[]> {
    return this.fraudDataService.incomingAlerts$.asObservable();
  }

  /**
   * Submit a client fraud report
   * Handles validation, formatting, and submission
   */
  reportClientFraud(
    userId: string,
    request: ClientFraudReportRequest
  ): Observable<ReportStatus> {
    // Set loading state
    this.reportStatus$.next({
      isLoading: true,
      success: false,
      error: null,
      message: 'Processing your fraud report...'
    });

    try {
      // Validate input
      this.validateReportRequest(request);

      // Format report for submission
      const fraudReport: ClientFraudReport = {
        userId,
        description: request.description,
        suspiciousTransaction: {
          amount: request.transactionAmount,
          merchant: request.merchant,
          timestamp: request.timestamp,
          location: request.location
        },
        reportedAt: new Date().toISOString()
      };

      // Submit to FraudDataService and create investigation case
      const caseId = this.fraudDataService.reportClientFraud(fraudReport);

      // Generate transaction ID for tracking
      const transactionId = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
      this.lastReportedTransactionId$.next(transactionId);

      // Set success state
      this.reportStatus$.next({
        isLoading: false,
        success: true,
        error: null,
        message: `✓ Alert sent to RCC Bank Fraud Center\nReport ID: ${transactionId}\nCase ID: ${caseId}`
      });

      // Log the report
      console.log('[FRAUD BRIDGE] Report submitted successfully', {
        reportId: transactionId,
        caseId,
        timestamp: new Date().toISOString(),
        request
      });

      return this.reportStatus$.asObservable();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit fraud report';

      this.reportStatus$.next({
        isLoading: false,
        success: false,
        error: errorMessage,
        message: `Error: ${errorMessage}`
      });

      console.error('[FRAUD BRIDGE] Report submission failed', error);
      return this.reportStatus$.asObservable();
    }
  }

  /**
   * Get the current report status as Observable
   */
  getReportStatus(): Observable<ReportStatus> {
    return this.reportStatus$.asObservable();
  }

  /**
   * Get the current report status value
   */
  getReportStatusValue(): ReportStatus {
    return this.reportStatus$.value;
  }

  /**
   * Get the last reported transaction ID
   */
  getLastReportedTransactionId(): Observable<string | null> {
    return this.lastReportedTransactionId$.asObservable();
  }

  /**
   * Reset report status (e.g., after showing confirmation)
   */
  resetReportStatus(): void {
    this.reportStatus$.next({
      isLoading: false,
      success: false,
      error: null,
      message: ''
    });
  }

  /**
   * Report server-detected fraud (from AI SimulationService)
   * This bypasses client validation and is used for AI-detected anomalies
   */
  reportServerFraud(request: ClientFraudReportRequest): void {
    try {
      // Submit AI-detected fraud directly
      const fraudReport: ClientFraudReport = {
        userId: 'AI-ENGINE',
        description: request.description,
        suspiciousTransaction: {
          amount: request.transactionAmount,
          merchant: request.merchant,
          timestamp: request.timestamp,
          location: request.location
        },
        reportedAt: new Date().toISOString()
      };

      // Submit to FraudDataService and create investigation case
      const caseId = this.fraudDataService.reportClientFraud(fraudReport);

      // Generate transaction ID for tracking
      const transactionId = `AI-RPT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

      console.log('[FRAUD BRIDGE] AI Server Fraud Report submitted', {
        reportId: transactionId,
        caseId,
        scores: request.fraudDetectionScores,
        merchant: request.merchant,
        transformerScore: request.fraudDetectionScores?.transformerScore,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FRAUD BRIDGE] AI Server Fraud Report submission failed', error);
    }
  }

  /**
   * Validate the fraud report request
   */
  private validateReportRequest(request: ClientFraudReportRequest): void {
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Please describe the suspicious activity');
    }

    if (request.description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters');
    }

    if (!request.merchant || request.merchant.trim().length === 0) {
      throw new Error('Merchant name is required');
    }

    if (!request.timestamp) {
      throw new Error('Transaction timestamp is required');
    }

    if (request.transactionAmount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }
  }
}
