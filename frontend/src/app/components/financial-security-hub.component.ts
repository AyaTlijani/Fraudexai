import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProtectionHistoryItem {
  id: string;
  type: 'blocked' | 'detected' | 'verified';
  description: string;
  location: string;
  timestamp: string;
  icon?: string;
}

interface SecurityNotification {
  id: string;
  type: 'login' | 'score_updated' | 'protection' | 'alert';
  label: string;
  message: string;
  timestamp: string;
  read: boolean;
  color: string;
}

@Component({
  selector: 'app-financial-security-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-security-hub.component.html',
  styleUrls: ['./financial-security-hub.component.scss']
})
export class FinancialSecurityHubComponent implements OnInit {
  // Dark mode toggle
  isDarkMode = true;

  // Trust Score settings
  trustScore = 94;
  trustScoreMax = 100;
  safetyStatus = 'Your account is fully protected';

  // Travel Mode
  travelModeEnabled = false;
  travelStartDate = '';
  travelEndDate = '';
  travelDestination = '';
  showTravelForm = false;

  // Protection History
  protectionHistory: ProtectionHistoryItem[] = [
    {
      id: '1',
      type: 'blocked',
      description: 'Unauthorized login attempt blocked',
      location: 'Moscow, Russia',
      timestamp: '2 hours ago',
      icon: '🔒'
    },
    {
      id: '2',
      type: 'blocked',
      description: 'Suspicious transaction from unknown merchant',
      location: 'Lagos, Nigeria',
      timestamp: '5 hours ago',
      icon: '🛡️'
    },
    {
      id: '3',
      type: 'detected',
      description: 'Unusual spending pattern detected',
      location: 'Your Location',
      timestamp: '1 day ago',
      icon: '⚠️'
    },
    {
      id: '4',
      type: 'verified',
      description: 'New device login verified',
      location: 'New York, USA',
      timestamp: '2 days ago',
      icon: '✓'
    },
    {
      id: '5',
      type: 'blocked',
      description: 'Phishing email attempt filtered',
      location: 'Email Security',
      timestamp: '3 days ago',
      icon: '📧'
    }
  ];

  // Security Notifications
  securityNotifications: SecurityNotification[] = [
    {
      id: '1',
      type: 'login',
      label: 'New Login',
      message: 'Your account was accessed from a new device',
      timestamp: '30 mins ago',
      read: false,
      color: '#00D9FF'
    },
    {
      id: '2',
      type: 'score_updated',
      label: 'Score Updated',
      message: 'Your security score improved to 94/100',
      timestamp: '2 hours ago',
      read: false,
      color: '#6C63FF'
    },
    {
      id: '3',
      type: 'protection',
      label: 'Protection Active',
      message: 'Real-time fraud detection is enabled',
      timestamp: '5 hours ago',
      read: true,
      color: '#00E676'
    },
    {
      id: '4',
      type: 'alert',
      label: 'Alert Resolved',
      message: 'Previous suspicious activity cleared',
      timestamp: '1 day ago',
      read: true,
      color: '#FFD700'
    }
  ];

  // File upload
  selectedFile: File | null = null;
  showReportModal = false;
  reportDescription = '';

  // Gauge progress
  @ViewChild('trustGauge') trustGaugeRef!: ElementRef;

  constructor() {}

  ngOnInit() {
    // Initialize component
    this.drawTrustScoreGauge();
  }

  /**
   * Draw the Trust Score gauge on canvas
   */
  drawTrustScoreGauge() {
    setTimeout(() => {
      const canvas = this.trustGaugeRef?.nativeElement as HTMLCanvasElement;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2.5;

      // Draw background circle
      ctx.fillStyle = this.isDarkMode ? 'rgba(30, 30, 50, 0.4)' : 'rgba(240, 240, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw gauge background
      ctx.strokeStyle = this.isDarkMode ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.3)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Draw score line (gradient from purple to green)
      const scorePercentage = this.trustScore / this.trustScoreMax;
      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, '#9B59B6');
      gradient.addColorStop(0.5, '#6C63FF');
      gradient.addColorStop(1, '#00E676');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + Math.PI * scorePercentage);
      ctx.stroke();

      // Draw score text
      ctx.fillStyle = this.isDarkMode ? '#FFFFFF' : '#1a1a2e';
      ctx.font = 'bold 48px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.trustScore.toString(), centerX, centerY - 15);

      ctx.font = 'normal 16px Poppins, sans-serif';
      ctx.fillStyle = this.isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 26, 46, 0.6)';
      ctx.fillText(`of ${this.trustScoreMax}`, centerX, centerY + 20);

      // Draw circular border
      ctx.strokeStyle = this.isDarkMode ? 'rgba(108, 99, 255, 0.5)' : 'rgba(108, 99, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }, 100);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    setTimeout(() => this.drawTrustScoreGauge(), 50);
  }

  /**
   * Toggle travel mode
   */
  toggleTravelMode() {
    this.travelModeEnabled = !this.travelModeEnabled;
    if (this.travelModeEnabled) {
      this.showTravelForm = true;
    }
  }

  /**
   * Save travel mode settings
   */
  saveTravelMode() {
    if (this.travelStartDate && this.travelEndDate && this.travelDestination) {
      console.log(`Travel Mode enabled for ${this.travelDestination} from ${this.travelStartDate} to ${this.travelEndDate}`);
      alert(`Travel Mode enabled! Protected until ${this.travelEndDate} in ${this.travelDestination}`);
      this.showTravelForm = false;
    } else {
      alert('Please fill in all travel details');
    }
  }

  /**
   * Cancel travel mode form
   */
  cancelTravelMode() {
    this.showTravelForm = false;
    this.travelModeEnabled = false;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string) {
    const notification = this.securityNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  /**
   * Open report modal
   */
  openReportModal() {
    this.showReportModal = true;
    this.selectedFile = null;
    this.reportDescription = '';
  }

  /**
   * Close report modal
   */
  closeReportModal() {
    this.showReportModal = false;
    this.selectedFile = null;
    this.reportDescription = '';
  }

  /**
   * Submit problem report
   */
  submitReport() {
    if (!this.reportDescription) {
      alert('Please describe the problem');
      return;
    }

    const reportData = {
      description: this.reportDescription,
      file: this.selectedFile?.name || 'No file',
      timestamp: new Date().toISOString()
    };

    console.log('Problem Report Submitted:', reportData);
    alert('Thank you for reporting! Our team will review your issue shortly.');
    this.closeReportModal();
  }

  /**
   * Get notification icon SVG
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'login':
        return '🔐';
      case 'score_updated':
        return '📊';
      case 'protection':
        return '🛡️';
      case 'alert':
        return '⚠️';
      default:
        return '📬';
    }
  }

  /**
   * Get protection history type color
   */
  getProtectionColor(type: string): string {
    switch (type) {
      case 'blocked':
        return '#FF4D4D';
      case 'detected':
        return '#FFD700';
      case 'verified':
        return '#00E676';
      default:
        return '#6C63FF';
    }
  }

  /**
   * Get protection history type label
   */
  getProtectionLabel(type: string): string {
    switch (type) {
      case 'blocked':
        return 'BLOCKED';
      case 'detected':
        return 'DETECTED';
      case 'verified':
        return 'VERIFIED';
      default:
        return 'LOGGED';
    }
  }

  /**
   * Get readable time format
   */
  getTimeFromNow(timestamp: string): string {
    // For now, timestamps are already formatted
    return timestamp;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.securityNotifications.filter(n => !n.read).length;
  }
}
