import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Subscription } from 'rxjs';

import { StreamService } from '../../services/stream.service';

interface StreamTx {
  tx_id: number;
  status: string;
  risk: string;
  score: number;
  features?: number[];
  true?: string;
}

interface ReportItem {
  tx_id: number;
  score: number;
  risk: string;
  predicted: string;
  true_label: string;
  features: number[];
}

@Component({
  selector: 'app-forensic-console',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './forensic-console.component.html',
  styleUrls: ['./forensic-console.component.scss']
})
export class ForensicConsoleComponent implements OnInit, OnDestroy {

  private sub?: Subscription;

  private static seenTx = new Set<number>();
  private static reportCache: ReportItem[] = [];

  private static chartCache = {
    labels: [] as string[],
    scores: [] as number[],
    fraud: [] as any[],
    risk: [0, 0, 0] as number[]
  };

  selectedTransaction: ReportItem | null = null;
  rawTransactionData: any | null = null;
  showRawJson: boolean = false;

  report: ReportItem[] = ForensicConsoleComponent.reportCache;

  stats = {
    totalFrauds: 0,
    highestScore: 0
  };

  // =========================
  // FRAUD TIMELINE
  // =========================
  fraudScoreChart: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Fraud Score Live',
      data: [],
      borderColor: '#00d9ff',
      fill: true,
      tension: 0.35
    }]
  };

  // =========================
  // RISK FLOW
  // =========================
  riskPieChart: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['HIGH', 'MEDIUM', 'LOW'],
    datasets: [{ data: [0, 0, 0] }]
  };

  // =========================
  // FRAUD SPIKE TIMELINE
  // =========================
  scatterChart: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Fraud Spike Timeline',
        data: [],
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.25)',
        fill: true,
        tension: 0.3,
        pointRadius: 5
      }
    ]
  };

  constructor(
    private router: Router,
    private streamService: StreamService
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.restoreFromCache();
    this.streamService.connect();

    this.sub = this.streamService.stream$.subscribe((data: any) => {
      const txs: StreamTx[] = Array.isArray(data) ? data : [data];
      txs.forEach(tx => this.handleIncoming(tx));
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // =========================
  // STREAM HANDLER
  // =========================
  private handleIncoming(tx: StreamTx): void {
    if (ForensicConsoleComponent.seenTx.has(tx.tx_id)) return;
    ForensicConsoleComponent.seenTx.add(tx.tx_id);

    const item: ReportItem = this.map(tx);
    ForensicConsoleComponent.reportCache.push(item);
    this.report = ForensicConsoleComponent.reportCache;

    if (item.predicted === 'FRAUD') {
      this.stats.totalFrauds++;
    }

    this.stats.highestScore = Math.max(this.stats.highestScore, item.score);

    this.updateCache(tx, item);
    this.updateCharts();
  }

  // =========================
  // MAP
  // =========================
  private map(tx: StreamTx): ReportItem {
    return {
      tx_id: tx.tx_id,
      score: tx.score,
      risk: tx.risk,
      predicted: tx.status,
      true_label: tx.true || 'UNKNOWN',
      features: tx.features || []
    };
  }

  // =========================
  // CACHE UPDATE
  // =========================
  private updateCache(tx: StreamTx, item: ReportItem): void {
    const c = ForensicConsoleComponent.chartCache;

    c.labels.push(`TX ${tx.tx_id}`);
    c.scores.push(tx.score);

    if (item.predicted === 'FRAUD') {
      c.fraud.push({ label: `Fraud ${c.fraud.length + 1}`, score: item.score });
    }

    if (tx.risk === 'HIGH')        c.risk[0]++;
    else if (tx.risk === 'MEDIUM') c.risk[1]++;
    else                           c.risk[2]++;
  }

  // =========================
  // RESTORE CACHE
  // =========================
  private restoreFromCache(): void {
    const c = ForensicConsoleComponent.chartCache;

    this.fraudScoreChart = {
      labels: [...c.labels],
      datasets: [{
        label: 'Fraud Score Live',
        data: [...c.scores],
        borderColor: '#00d9ff',
        fill: true,
        tension: 0.35
      }]
    };

    this.scatterChart = {
      labels: c.fraud.map(f => f.label),
      datasets: [{
        label: 'Fraud Spike Timeline',
        data: c.fraud.map(f => f.score),
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.25)',
        fill: true,
        tension: 0.3,
        pointRadius: 5
      }]
    };

    this.riskPieChart = {
      labels: ['HIGH', 'MEDIUM', 'LOW'],
      datasets: [{ data: [...c.risk] }]
    };
  }

  // =========================
  // LIVE UPDATE
  // =========================
  private updateCharts(): void {
    const c = ForensicConsoleComponent.chartCache;

    this.fraudScoreChart = {
      ...this.fraudScoreChart,
      labels: [...c.labels],
      datasets: [{
        ...this.fraudScoreChart.datasets[0],
        data: [...c.scores]
      }]
    };

    this.scatterChart = {
      labels: c.fraud.map(f => f.label),
      datasets: [{
        label: 'Fraud Spike Timeline',
        data: c.fraud.map(f => f.score),
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.25)',
        fill: true,
        tension: 0.3,
        pointRadius: 5
      }]
    };
    this.scatterChart = { ...this.scatterChart };

    this.riskPieChart = {
      labels: ['HIGH', 'MEDIUM', 'LOW'],
      datasets: [{ data: [...c.risk] }]
    };
  }

  // =========================
  // INSPECT
  // Fetches assets/transactions.json, finds matching tx_id,
  // stores raw object for the forensic panel.
  // =========================
  inspectTransaction(tx: ReportItem): void {
    this.selectedTransaction = tx;
    this.rawTransactionData = null;
    this.showRawJson = false;

    fetch('assets/transactions.json')
      .then(res => res.json())
      .then((allTx: any[]) => {
        const match = allTx.find(t => t.tx_id === tx.tx_id);
        this.rawTransactionData = match
          ?? { error: `TX #${tx.tx_id} not found in transactions.json` };
      })
      .catch(err => {
        this.rawTransactionData = {
          error: 'Failed to load transactions.json',
          detail: String(err)
        };
      });
  }

  toggleRawJson(): void {
    this.showRawJson = !this.showRawJson;
  }

  // =========================
  // VERDICT
  // pred  = model output  ("FRAUD" | "SAFE")
  // truth = transactions.json "true" field ("FRAUD" | "OK")
  // =========================
  getVerdict(pred: string, truth: string): { label: string; css: string } {
    if (pred === 'FRAUD' && truth === 'FRAUD') return { label: '🚨 CONFIRMED FRAUD',           css: 'verdict-confirmed' };
    if (pred === 'FRAUD' && truth === 'OK')    return { label: '⚠️ FALSE POSITIVE',             css: 'verdict-fp'        };
    if (pred !== 'FRAUD' && truth === 'FRAUD') return { label: '❌ MISSED FRAUD (FALSE NEG)',  css: 'verdict-fn'        };
                                               return { label: '✅ CORRECTLY SAFE',             css: 'verdict-safe'      };
  }

  getFeatureBarWidth(value: number, allValues: number[]): number {
    const max = Math.max(...allValues.map(Math.abs));
    if (max === 0) return 0;
    return Math.round((Math.abs(value) / max) * 100);
  }

  // =========================
  // NAV
  // =========================
  goBackToDashboard(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}