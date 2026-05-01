import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Chart, registerables } from 'chart.js';

import { FraudDataService, InvestigationCase } from '../../services/fraud-data.service';
import { SimulationService } from '../../services/simulation.service';
import { StreamService } from '../../services/stream.service';

type AdminLabel =
  | 'UNVERIFIED'
  | 'CORRECT'
  | 'FALSE_POSITIVE'
  | 'FALSE_NEGATIVE';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  alertsFeed: any[] = [];
  cases: InvestigationCase[] = [];

  private alertsSub?: Subscription;
  private casesSub?: Subscription;

  barChart: Chart | null = null;
  radarChart: Chart | null = null;

  // LIVE STREAM (UNCHANGED)
  streamData: any[] = [];

  // HISTORY TABLE (PERSISTENT)
  historyData: any[] = [];

  adminLabels: Map<number, AdminLabel> = new Map();
  comments: Map<number, string> = new Map();

  alertCount: number = 0;

  constructor(
    private router: Router,
    private fraudDataService: FraudDataService,
    private simulationService: SimulationService,
    private streamService: StreamService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {

    this.simulationService.startSimulation();

    this.alertsSub = this.fraudDataService.getAlerts()
      .subscribe(a => this.alertsFeed = a);

    this.casesSub = this.fraudDataService.getCases()
      .subscribe(c => this.cases = c);

    this.loadCharts();

    // LIVE STREAM (UNCHANGED)
    this.streamService.connect();

    this.streamService.stream$.subscribe(stream => {
      this.streamData = stream;
      this.alertCount = stream.filter(tx => tx.status === 'FRAUD').length;
    });

    // HISTORY TABLE
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.alertsSub?.unsubscribe();
    this.casesSub?.unsubscribe();
    this.simulationService.stopSimulation();
    this.barChart?.destroy();
    this.radarChart?.destroy();
  }

  // =========================
  // LOAD HISTORY
  // =========================
  async loadHistory() {

    const res = await fetch('assets/history.json');
    const data = await res.json();

    this.historyData = data.map((tx: any) => {

      const savedLabel = localStorage.getItem(`label_${tx.tx_id}`);
      const savedComment = localStorage.getItem(`comment_${tx.tx_id}`);

      return {
        ...tx,
        adminLabel: (savedLabel as AdminLabel) || this.computeInitialLabel(tx),
        comment: savedComment || ''
      };
    });

    this.sortHistory();
  }

  // =========================
  // LABEL LOGIC
  // =========================
  computeInitialLabel(tx: any): AdminLabel {

    if (tx.status === 'OK' && tx.true === 'FRAUD') return 'FALSE_NEGATIVE';
    if (tx.status === 'FRAUD' && tx.true === 'FRAUD') return 'CORRECT';
    if (tx.status === 'FRAUD' && tx.true === 'OK') return 'FALSE_POSITIVE';

    return 'UNVERIFIED';
  }

  updateAdminLabel(tx: any, label: AdminLabel) {
    tx.adminLabel = label;
    localStorage.setItem(`label_${tx.tx_id}`, label);
    this.sortHistory();
  }

  saveComment(tx: any) {
    localStorage.setItem(`comment_${tx.tx_id}`, tx.comment || '');
  }

  // =========================
  // SORTING
  // =========================
  sortHistory() {

    this.historyData = [...this.historyData].sort((a, b) => {

      const order = (l: AdminLabel) => {
        switch (l) {
          case 'FALSE_NEGATIVE': return 0;
          case 'CORRECT': return 1;
          case 'FALSE_POSITIVE': return 2;
          default: return 3;
        }
      };

      return order(a.adminLabel) - order(b.adminLabel);
    });
  }

  // NAVIGATION (UNCHANGED)
  openForensicConsole() {
    this.router.navigate(['/forensic-console']);
  }

  openAiLaboratory() {
    this.router.navigate(['/ai-lab']);
  }

  openDataAnalyst() {
    this.router.navigate(['/data-analyst']);
  }

  // CHARTS (UNCHANGED)
  async loadCharts() {

    const res = await fetch('assets/eval_results.json');
    const data = await res.json();

    const models = Object.keys(data);

    const precision = models.map(m => data[m].precision);
    const recall = models.map(m => data[m].recall);
    const f1 = models.map(m => data[m].f1);

    this.barChart = new Chart('barChart', {
      type: 'bar',
      data: {
        labels: models,
        datasets: [
          { label: 'Precision', data: precision },
          { label: 'Recall', data: recall },
          { label: 'F1 Score', data: f1 }
        ]
      }
    });

    this.radarChart = new Chart('radarChart', {
      type: 'radar',
      data: {
        labels: models,
        datasets: [
          { label: 'F1', data: f1 }
        ]
      }
    });
  }
}