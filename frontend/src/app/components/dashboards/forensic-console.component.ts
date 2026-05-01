import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FraudDataService, InvestigationDetails, Transaction, Alert } from '../../services/fraud-data.service';
import { SimulationService, SimulatedTransaction } from '../../services/simulation.service';
import { Subscription } from 'rxjs';

interface TimelineNode {
  id: string;
  amount: number;
  merchant: string;
  timestamp: string;
  location: string;
  isSuspicious: boolean;
  x: number;
}

interface HeatmapData {
  feature: string;
  attention: number;
  color: string;
}

interface ComparisonData {
  field: string;
  expected: string;
  observed: string;
  anomaly: boolean;
}

interface AuditLogEntry {
  timestamp: string;
  action: string;
  details: string;
  user: string;
  status: 'success' | 'pending' | 'info';
}

@Component({
  selector: 'app-forensic-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forensic-console.component.html',
  styleUrls: ['./forensic-console.component.scss']
})
export class ForensicConsoleComponent implements OnInit, OnDestroy {
  userId = '#4421';
  riskScore = 92;
  suspiciousEventCount = 0;
  investigationDetails: InvestigationDetails | null = null;
  
  // Timeline data
  timelineNodes: TimelineNode[] = [];

  // Heatmap data - showing which features the AI focused on
  heatmapData: HeatmapData[] = [];

  // Reconstruction error data points
  reconstructionErrorData: {x: number, y: number, label: string, isAnomaly: boolean}[] = [];

  // Case comparison data
  comparisonData: ComparisonData[] = [
    {
      field: 'Location',
      expected: 'France, Germany, UK',
      observed: 'France → USA (7 hours)',
      anomaly: true
    },
    {
      field: 'Travel Velocity',
      expected: '< 900 km/day',
      observed: '5,800 km in 7 hours (Paris to NYC)',
      anomaly: true
    },
    {
      field: 'Transaction Amount',
      expected: '$50 - $200',
      observed: '$3,400 (17x higher)',
      anomaly: true
    },
    {
      field: 'Merchant Category',
      expected: 'Local shops, Cafes',
      observed: 'Luxury boutique, 5-star hotel',
      anomaly: true
    },
    {
      field: 'Transaction Frequency',
      expected: '1-2 per hour',
      observed: '4 transactions in 3 hours',
      anomaly: true
    },
    {
      field: 'Time Pattern',
      expected: '08:00 - 18:00 (business hours)',
      observed: '21:30 (late night)',
      anomaly: true
    }
  ];

  // Audit Log
  auditLog: AuditLogEntry[] = [];
  showAuditLog = false;

  // PDF Export
  showPDFPreview = false;
  pdfContent = '';

  // Transaction Simulator
  showSimulator = false;
  simulatedTransactions: SimulatedTransaction[] = [];

  hoveredNode: TimelineNode | null = null;
  selectedComparisonField: string | null = null;
  
  private navigationSubscription: Subscription | null = null;
  private currentAlert: Alert | null = null;
  private alertsSubscription: Subscription | null = null;
  private simulationSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fraudDataService: FraudDataService,
    private simulationService: SimulationService
  ) {}

  ngOnInit() {
    // Initialize audit log with system startup
    this.addAuditLogEntry('SYSTEM', 'Forensic Console Initialized', 'Console ready for investigation', 'success');

    // Retrieve userId from route parameters, query params, or navigation state
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
        this.loadInvestigationData();
      }
    });

    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['userId']) {
        this.userId = queryParams['userId'];
        this.loadInvestigationData();
      }
    });

    // If no route params, try navigation state
    const stateNavigation = window.history.state;
    if (stateNavigation && stateNavigation.userId) {
      this.userId = stateNavigation.userId;
      this.loadInvestigationData();
    } else if (!this.userId.startsWith('USER')) {
      // Default userId if nothing provided
      this.loadInvestigationData();
    }

    // Subscribe to simulated transactions for real-time updates
    this.simulationSubscription = this.simulationService.simulatedTransactions$.subscribe(transactions => {
      this.simulatedTransactions = transactions.slice(0, 5); // Show latest 5
      
      // Update risk score based on latest fraud alerts
      if (transactions.length > 0) {
        const latestFraudAlerts = transactions.filter(t => t.isFraudAlert);
        if (latestFraudAlerts.length > 0) {
          this.riskScore = Math.round(latestFraudAlerts[0].mlScores.transformerScore);
          this.addAuditLogEntry('AI ENGINE', 'Risk Score Updated', 
            `New risk score: ${this.riskScore}% from simulated transaction`, 'info');
        }
      }
    });
  }

  /**
   * Load investigation data from the service
   */
  private loadInvestigationData(): void {
    // Get investigation details from service
    this.investigationDetails = this.fraudDataService.getInvestigationDetails(this.userId);

    // Try to find the corresponding alert in the global alerts stream
    this.alertsSubscription = this.fraudDataService.getAlerts().subscribe(alerts => {
      this.currentAlert = alerts.find(alert => alert.transaction.userId === this.userId) || null;
    });

    if (this.investigationDetails) {
      this.riskScore = this.investigationDetails.riskScore;

      // Populate heatmap from investigation details
      this.heatmapData = this.investigationDetails.attentionWeights.map(weight => ({
        feature: weight.feature,
        attention: Math.round(weight.weight * 100),
        color: weight.importance === 'critical' ? '#FF4D4D' : 
               weight.importance === 'high' ? '#FF6D6D' : 
               weight.importance === 'medium' ? '#FF8D8D' : '#FFADAD'
      }));

      // Populate timeline from transactions
      this.timelineNodes = this.investigationDetails.transactions.map((txn, index) => ({
        id: txn.id,
        amount: txn.amount,
        merchant: txn.merchant || 'Unknown',
        timestamp: txn.timestamp,
        location: `${txn.location.city}, ${txn.location.country}`,
        isSuspicious: txn.riskScore > 60,
        x: (index + 1) * (100 / (this.investigationDetails!.transactions.length + 1))
      }));

      this.suspiciousEventCount = this.timelineNodes.filter(n => n.isSuspicious).length;

      // Populate reconstruction errors for chart using real service data
      this.reconstructionErrorData = this.investigationDetails.reconstructionErrors.map((error, idx) => ({
        x: (idx + 1) * 50,
        y: Math.min(error.value, 100), // Scale to 0-100
        label: error.isAnomaly ? 'ANOMALY' : 'Normal',
        isAnomaly: error.isAnomaly
      }));

      // Log investigation loaded
      this.addAuditLogEntry('SYSTEM', 'Investigation Data Loaded', 
        `Loaded investigation for user ${this.userId} with ${this.investigationDetails.transactions.length} transactions`, 'success');

      // Initialize chart after view renders
      setTimeout(() => {
        this.drawReconstructionErrorChart();
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.alertsSubscription) {
      this.alertsSubscription.unsubscribe();
    }
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  /**
   * Add entry to audit log
   */
  private addAuditLogEntry(user: string, action: string, details: string, status: 'success' | 'pending' | 'info'): void {
    this.auditLog.unshift({
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      user,
      status
    });
    
    // Keep only last 50 entries
    if (this.auditLog.length > 50) {
      this.auditLog.pop();
    }
  }

  /**
   * Confirm fraud for the investigated user/transaction
   * This removes the alert from the global stream and logs the action
   */
  confirmFraud() {
    if (this.currentAlert) {
      const alertId = this.currentAlert.id;
      const userIdInvolved = this.currentAlert.transaction.userId;

      // Call service to update alert status
      this.fraudDataService.confirmFraud(alertId);

      // Log the action
      this.addAuditLogEntry('INVESTIGATOR', 'Fraud Confirmed', 
        `Alert ${alertId} marked as confirmed fraud. Risk: ${this.currentAlert.transaction.riskScore}%`, 'success');

      console.log(`[FRAUD CONFIRMED] Alert ID: ${alertId}, User: ${userIdInvolved}, Risk Score: ${this.currentAlert.transaction.riskScore}%`);
      console.log(`[ACTION LOG] User account flagged, transaction marked as confirmed fraud.`);
      console.log(`[TIMESTAMP] ${new Date().toISOString()}`);

      // Show confirmation feedback
      alert(`✅ Fraud confirmed for User ${userIdInvolved}. Alert #${alertId} marked and account flagged.`);

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        this.goBackToDashboard();
      }, 500);
    }
  }

  /**
   * Mark alert as false positive
   * This removes the alert from fraud stream and logs the action
   */
  falsePositive() {
    if (this.currentAlert) {
      const alertId = this.currentAlert.id;
      const userIdInvolved = this.currentAlert.transaction.userId;

      // Call service to update alert status
      this.fraudDataService.markFalsePositive(alertId);

      // Log the action
      this.addAuditLogEntry('INVESTIGATOR', 'False Positive Marked', 
        `Alert ${alertId} cleared as false positive`, 'success');

      console.log(`[FALSE POSITIVE DETECTED] Alert ID: ${alertId}, User: ${userIdInvolved}`);
      console.log(`[ACTION LOG] Alert cleared, user account restored to normal status.`);
      console.log(`[TIMESTAMP] ${new Date().toISOString()}`);

      // Show confirmation feedback
      alert(`✓ Alert cleared for User ${userIdInvolved}. Marked as false positive.`);

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        this.goBackToDashboard();
      }, 500);
    }
  }

  /**
   * Export investigation to PDF
   */
  exportPDF(): void {
    this.addAuditLogEntry('SYSTEM', 'PDF Export Initiated', 'Investigation report export started', 'pending');

    // Generate PDF content
    const pdfTitle = `Forensic Investigation Report - User ${this.userId}`;
    const investigationDate = new Date().toLocaleString();
    
    this.pdfContent = `
FRAUDEXIA - FORENSIC INVESTIGATION REPORT
==========================================

Investigation ID: ${this.userId}
Generated: ${investigationDate}
Risk Score: ${this.riskScore}%
Suspicious Events: ${this.suspiciousEventCount}

INVESTIGATION SUMMARY:
${this.investigationDetails?.transactions.length || 0} transactions analyzed
${this.heatmapData.length} AI attention features tracked
${this.comparisonData.filter(c => c.anomaly).length} Critical anomalies detected

TIMELINE ANALYSIS:
${this.timelineNodes.map(n => `- ${n.timestamp}: ${n.merchant} ($${n.amount.toFixed(2)}) in ${n.location}${n.isSuspicious ? ' [SUSPICIOUS]' : ''}`).join('\n')}

AI ATTENTION HEATMAP:
${this.heatmapData.map(h => `- ${h.feature}: ${h.attention}% importance`).join('\n')}

ANOMALIES DETECTED:
${this.comparisonData.filter(c => c.anomaly).map(c => `- ${c.field}: ${c.observed}`).join('\n')}

RECOMMENDATION: ${this.riskScore > 80 ? 'IMMEDIATE ACTION RECOMMENDED' : 'REQUIRES REVIEW'}
    `;

    this.showPDFPreview = true;
    this.addAuditLogEntry('SYSTEM', 'PDF Generated', 'Investigation report ready for download', 'success');
    
    // Simulate PDF download
    setTimeout(() => {
      this.showPDFPreview = false;
      alert('📄 Investigation PDF report generated and downloaded successfully!');
    }, 2000);
  }

  /**
   * View detailed audit log
   */
  viewAuditLog(): void {
    this.showAuditLog = !this.showAuditLog;
    if (this.showAuditLog) {
      this.addAuditLogEntry('SYSTEM', 'Audit Log Opened', 'Investigator viewing detailed action history', 'info');
    }
  }

  /**
   * Simulate a new transaction and analyze it
   */
  simulateTransaction(): void {
    this.showSimulator = !this.showSimulator;
    
    if (this.showSimulator) {
      this.addAuditLogEntry('SIMULATOR', 'Transaction Simulator Opened', 'Manual transaction simulation started', 'info');
    }
  }

  /**
   * Inject a simulated transaction for testing
   */
  injectSimulatedTransaction(): void {
    const riskScore = Math.round(Math.random() * 100);
    const merchant = ['Amazon', 'Target', 'Starbucks', 'Unknown Store', 'Luxury Boutique'][Math.floor(Math.random() * 5)];
    const amount = Math.round(Math.random() * 5000 * 100) / 100;

    const newTransaction: TimelineNode = {
      id: `TXN-SIM-${Date.now()}`,
      amount: amount,
      merchant: merchant,
      timestamp: new Date().toLocaleString(),
      location: ['New York', 'Tokyo', 'London', 'Paris'][Math.floor(Math.random() * 4)] + ', World',
      isSuspicious: riskScore > 60,
      x: 100
    };

    // Add to timeline
    this.timelineNodes.unshift(newTransaction);
    this.suspiciousEventCount = this.timelineNodes.filter(n => n.isSuspicious).length;

    // Update risk score if suspicious
    if (riskScore > 75) {
      this.riskScore = Math.max(this.riskScore, riskScore);
    }

    // Log the action
    this.addAuditLogEntry('SIMULATOR', 'Transaction Injected', 
      `Simulated transaction: ${merchant} ($${amount}) - Risk: ${riskScore}%`, 
      riskScore > 60 ? 'pending' : 'info');

    console.log(`[SIMULATOR] New transaction injected:`, newTransaction);
  }

  drawReconstructionErrorChart() {
    const canvas = document.getElementById('reconstructionChart') as HTMLCanvasElement;
    if (!canvas || this.reconstructionErrorData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Calculate max values from actual data for proper scaling
    const maxY = Math.max(...this.reconstructionErrorData.map(d => d.y), 100);
    const maxX = this.reconstructionErrorData.length * 50 || 400;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Draw background
    ctx.fillStyle = '#0B0E14';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.1)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (graphHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(224, 224, 224, 0.6)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const value = Math.round((maxY / gridLines) * (gridLines - i));
      const y = padding.top + (graphHeight / gridLines) * i;
      ctx.fillText(value.toString(), padding.left - 10, y + 4);
    }

    // Draw X-axis label
    ctx.fillStyle = 'rgba(224, 224, 224, 0.6)';
    ctx.textAlign = 'center';
    ctx.font = '11px Arial';
    ctx.fillText('Transaction Events', width / 2, height - 10);

    // Draw data line (smooth curve)
    if (this.reconstructionErrorData.length > 1) {
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      this.reconstructionErrorData.forEach((point, index) => {
        const x = padding.left + (point.x / maxX) * graphWidth;
        const y = padding.top + graphHeight - (point.y / maxY) * graphHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw data points with enhanced styling
    this.reconstructionErrorData.forEach((point, idx) => {
      const x = padding.left + (point.x / maxX) * graphWidth;
      const y = padding.top + graphHeight - (point.y / maxY) * graphHeight;

      if (point.isAnomaly) {
        // Anomaly point - red with glow
        ctx.fillStyle = '#FF4D4D';
        ctx.shadowColor = '#FF4D4D';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer ring for anomaly
        ctx.strokeStyle = '#FF8D8D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
      } else {
        // Normal point - green
        ctx.fillStyle = '#00E676';
        ctx.shadowColor = '#00E676';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }
    });

    // Draw anomaly threshold line
    const anomalyThreshold = 50; // Threshold for anomaly detection
    const thresholdY = padding.top + graphHeight - (anomalyThreshold / maxY) * graphHeight;
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(width - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw threshold label
    ctx.fillStyle = 'rgba(255, 77, 77, 0.8)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Anomaly Threshold (${anomalyThreshold})`, padding.left + 5, thresholdY - 8);

    // Draw legend
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    let legendX = width - 200;
    let legendY = padding.top + 15;

    // Normal point legend
    ctx.fillStyle = '#00E676';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224, 224, 224, 0.8)';
    ctx.fillText('Normal', legendX + 15, legendY + 4);

    // Anomaly point legend
    legendY += 20;
    ctx.fillStyle = '#FF4D4D';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224, 224, 224, 0.8)';
    ctx.fillText('Anomaly', legendX + 15, legendY + 4);
  }

  onNodeHover(node: TimelineNode) {
    this.hoveredNode = node;
  }

  onNodeLeave() {
    this.hoveredNode = null;
  }

  selectComparisonField(field: string) {
    this.selectedComparisonField = this.selectedComparisonField === field ? null : field;
  }

  goBackToDashboard() {
    this.addAuditLogEntry('SYSTEM', 'Investigation Closed', 'Returning to admin dashboard', 'info');
    this.router.navigate(['/admin-dashboard']);
  }

  // Helper methods for timeline calculations
  getNodeX(x: number): number {
    return x * 10 + 50;
  }

  getNodeY2(isSuspicious: boolean): number {
    return isSuspicious ? 30 : 45;
  }

  getNodeRadius(isSuspicious: boolean): number {
    return isSuspicious ? 10 : 5;
  }

  getNodeFill(isSuspicious: boolean): string {
    return isSuspicious ? '#FF4D4D' : 'white';
  }

  getNodeClass(isSuspicious: boolean): string {
    return isSuspicious ? 'timeline-node suspicious' : 'timeline-node';
  }

  getTooltipLeftPercent(x: number): number {
    return x * 10;
  }
}
