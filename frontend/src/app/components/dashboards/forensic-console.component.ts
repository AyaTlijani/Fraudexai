import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

interface Transaction {
  tx_id: number;
  features: number[];
  true: string;
}

interface History {
  tx_id: number;
  status: string;
  risk: string;
  score: number;
}

interface ReportItem {
  tx_id: number;
  true_label: string;
  predicted: string;
  risk: string;
  score: number;
  case_type: string;
  anomalyMagnitude: number;
  dominantFeature: string;
  features: number[];
}

@Component({
  selector: 'app-forensic-console',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './forensic-console.component.html',
  styleUrls: ['./forensic-console.component.scss']
})
export class ForensicConsoleComponent implements OnInit {

  transactions: Transaction[] = [];
  history: History[] = [];
  report: ReportItem[] = [];

  missedFrauds: ReportItem[] = [];
  selectedTransaction: ReportItem | null = null;

  confusionMatrix = {
    TP: 0,
    FP: 0,
    FN: 0,
    TN: 0
  };

  stats = {
    totalFrauds: 0,
    highestScore: 0
  };

  // CHARTS
  fraudScoreChart!: ChartConfiguration<'line'>['data'];
  riskPieChart!: ChartConfiguration<'doughnut'>['data'];
  scatterChart!: ChartConfiguration<'scatter'>['data'];
  radarChart!: ChartConfiguration<'radar'>['data'];

  fraudScoreOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };
  pieOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false };
  scatterOptions: ChartOptions<'scatter'> = { responsive: true, maintainAspectRatio: false };
  radarOptions: ChartOptions<'radar'> = { responsive: true, maintainAspectRatio: false };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  loadData(): void {
    this.http.get<Transaction[]>('assets/transactions.json').subscribe(tx => {
      this.http.get<History[]>('assets/history.json').subscribe(hist => {
        this.transactions = tx;
        this.history = hist;
        this.runAnalysis();
      });
    });
  }

  // ----------------------------
  // MAIN ANALYSIS
  // ----------------------------
  runAnalysis(): void {
    this.resetState();

    this.report = this.transactions.map((tx, i) => {
      const h = this.history[i];

      const item: ReportItem = {
        tx_id: tx.tx_id,
        true_label: tx.true,
        predicted: h.status,
        risk: h.risk,
        score: h.score,
        case_type: this.getCaseType(h.status, tx.true),
        anomalyMagnitude: this.getMagnitude(tx.features),
        dominantFeature: this.getDominantFeature(tx.features),
        features: tx.features
      };

      this.updateConfusion(item.case_type);

      if (item.case_type === 'FALSE_NEGATIVE') {
        this.missedFrauds.push(item);
      }

      return item;
    });

    this.computeStats();
    this.buildCharts();
  }

  // ----------------------------
  // RESET
  // ----------------------------
  resetState(): void {
    this.report = [];
    this.missedFrauds = [];

    this.confusionMatrix = {
      TP: 0,
      FP: 0,
      FN: 0,
      TN: 0
    };
  }

  // ----------------------------
  // CLASSIFICATION
  // ----------------------------
  getCaseType(pred: string, truth: string): string {
    if (pred === 'FRAUD' && truth === 'FRAUD') return 'TP';
    if (pred === 'FRAUD' && truth === 'OK') return 'FP';
    if (pred === 'OK' && truth === 'FRAUD') return 'FN';
    return 'TN';
  }

  updateConfusion(type: string): void {
    this.confusionMatrix[type as keyof typeof this.confusionMatrix]++;
  }

  // ----------------------------
  // FEATURE ANALYTICS
  // ----------------------------
  getMagnitude(features: number[]): number {
    return Number(
      Math.sqrt(features.reduce((s, v) => s + v * v, 0)).toFixed(2)
    );
  }

  getDominantFeature(features: number[]): string {
    let max = 0;
    let index = 0;

    features.forEach((val, i) => {
      const abs = Math.abs(val);
      if (abs > max) {
        max = abs;
        index = i;
      }
    });

    return `Feature ${index}`;
  }

  // ----------------------------
  // STATS
  // ----------------------------
  computeStats(): void {
    this.stats.totalFrauds = this.report.filter(r => r.predicted === 'FRAUD').length;

    this.stats.highestScore = this.report.length
      ? Math.max(...this.report.map(r => r.score))
      : 0;
  }

  // ----------------------------
  // CHARTS
  // ----------------------------
  buildCharts(): void {
    this.buildFraudScoreChart();
    this.buildRiskChart();
    this.buildScatterChart();
  }

  buildFraudScoreChart(): void {
    this.fraudScoreChart = {
      labels: this.report.map(r => `TX ${r.tx_id}`),
      datasets: [{
        label: 'Fraud Score',
        data: this.report.map(r => r.score),
        borderColor: '#00d9ff',
        fill: true,
        tension: 0.4
      }]
    };
  }

  buildRiskChart(): void {
    const high = this.report.filter(r => r.risk === 'HIGH').length;
    const med = this.report.filter(r => r.risk === 'MEDIUM').length;
    const low = this.report.filter(r => r.risk === 'LOW').length;

    this.riskPieChart = {
      labels: ['HIGH', 'MEDIUM', 'LOW'],
      datasets: [{
        data: [high, med, low],
        backgroundColor: ['#ff4d4d', '#ffb703', '#00d9ff']
      }]
    };
  }

  buildScatterChart(): void {
    this.scatterChart = {
      datasets: [
        {
          label: 'Fraud',
          data: this.report
            .filter(r => r.predicted === 'FRAUD')
            .map(r => ({ x: r.features[0], y: r.features[1] })),
          pointBackgroundColor: '#ff4d4d'
        },
        {
          label: 'Normal',
          data: this.report
            .filter(r => r.predicted === 'OK')
            .map(r => ({ x: r.features[0], y: r.features[1] })),
          pointBackgroundColor: '#00d9ff'
        }
      ]
    };
  }

  // ----------------------------
  // RADAR VIEW
  // ----------------------------
  inspectTransaction(tx: ReportItem): void {
    this.selectedTransaction = tx;

    this.radarChart = {
      labels: tx.features.map((_, i) => `F${i}`),
      datasets: [{
        label: `TX ${tx.tx_id}`,
        data: tx.features,
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.2)'
      }]
    };
  }

  // ----------------------------
  // NAVIGATION
  // ----------------------------
  goBackToDashboard(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}