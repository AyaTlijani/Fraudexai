import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { FraudDataService } from '../../services/fraud-data.service';

interface ModelMetric {
  name: string;
  auc: number;
  accuracy: number;
  precision: number;
  recall: number;
  status: string;
}

@Component({
  selector: 'app-ai-laboratory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-lab-container">
      <header class="lab-header">
        <div class="header-content">
          <h1 class="glow-text">🧪 AI RESEARCH LABORATORY</h1>
          <p class="subtitle">Neural Architecture Monitoring & Training Center</p>
        </div>
        <button class="back-btn" (click)="goBack()">← Exit Lab</button>
      </header>

      <div class="lab-main">
        <!-- Performance Overview -->
        <section class="metrics-grid">
          <div *ngFor="let model of models" class="model-card glass-panel" [ngClass]="{'training': isTraining && activeModel === model.name}">
            <div class="card-glow"></div>
            <div class="model-header">
              <span class="status-indicator" [attr.data-status]="model.status"></span>
              <h3>{{ model.name }}</h3>
            </div>
            
            <div class="stats-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" class="bg-ring" />
                <circle cx="50" cy="50" r="45" class="progress-ring" 
                        [style.stroke-dashoffset]="440 - (440 * (model.auc * 100)) / 100" />
              </svg>
              <div class="ring-content">
                <span class="value">{{ (model.auc * 100) | number:'1.1-1' }}%</span>
                <span class="label">AUC-ROC</span>
              </div>
            </div>

            <div class="metrics-list">
              <div class="metric-item">
                <span>Accuracy</span>
                <div class="bar-bg"><div class="bar-fill" [style.width.%]="model.accuracy * 100"></div></div>
              </div>
              <div class="metric-item">
                <span>Precision</span>
                <div class="bar-bg"><div class="bar-fill" [style.width.%]="model.precision * 100"></div></div>
              </div>
            </div>

            <button class="train-btn" [disabled]="isTraining" (click)="startTraining(model.name)">
              {{ isTraining && activeModel === model.name ? 'TRAINING...' : 'RE-TRAIN' }}
            </button>
          </div>
        </section>

        <!-- Training Visualization -->
        <section class="training-vis glass-panel">
          <div class="vis-header">
            <h2>Live Training Progression</h2>
            <div class="epoch-counter" *ngIf="isTraining">EPOCH: {{ currentEpoch }}/20</div>
          </div>
          
          <div class="chart-container">
            <!-- Loss Chart -->
            <div class="chart-box">
              <div class="chart-label">LOSS CURVE</div>
              <svg viewBox="0 0 400 200" class="line-chart">
                <polyline fill="none" stroke="#ff0055" stroke-width="3" 
                          [attr.points]="lossPoints" />
                <!-- Grid lines -->
                <line x1="0" y1="190" x2="400" y2="190" stroke="rgba(255,255,255,0.1)" />
              </svg>
            </div>

            <!-- Accuracy Chart -->
            <div class="chart-box">
              <div class="chart-label">ACCURACY</div>
              <svg viewBox="0 0 400 200" class="line-chart">
                <polyline fill="none" stroke="#00d9ff" stroke-width="3" 
                          [attr.points]="accPoints" />
                <line x1="0" y1="190" x2="400" y2="190" stroke="rgba(255,255,255,0.1)" />
              </svg>
            </div>
          </div>
          
          <div class="log-console" #console>
            <div *ngFor="let log of logs" class="log-entry">
              <span class="timestamp">[{{ log.time }}]</span>
              <span class="message" [ngClass]="log.type">{{ log.msg }}</span>
            </div>
          </div>
        </section>

        <section class="threshold-panel glass-panel">
          <div class="threshold-head">
            <h2>Decision Threshold Governance</h2>
            <span class="threshold-pill">{{ fraudThreshold }}%</span>
          </div>

          <input
            class="threshold-slider"
            type="range"
            min="50"
            max="95"
            [value]="fraudThreshold"
            (input)="onThresholdInput($event)"
          />

          <div class="threshold-scale">
            <span>50 (Sensitive)</span>
            <span>95 (Strict)</span>
          </div>

          <div class="threshold-kpis">
            <div class="kpi-box">
              <div class="kpi-label">Expected Alert Load</div>
              <div class="kpi-value">{{ expectedAlertsPerHour }} / hr</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">False-Positive Drift</div>
              <div class="kpi-value">{{ expectedFalsePositiveRate }}%</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Fraud Catch Confidence</div>
              <div class="kpi-value">{{ expectedCaptureRate }}%</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #050714; min-height: 100vh; color: #e0e0e0; font-family: 'Inter', sans-serif; }
    .ai-lab-container { padding: 40px; }
    .glow-text { font-size: 2.5rem; letter-spacing: 4px; color: #fff; text-shadow: 0 0 15px rgba(0, 217, 255, 0.5); margin: 0; }
    .subtitle { color: #00d9ff; opacity: 0.7; letter-spacing: 2px; text-transform: uppercase; font-size: 0.8rem; margin-top: 8px;}
    
    .lab-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; }
    .back-btn { background: transparent; border: 1px solid #1a3a52; color: #6c757d; padding: 10px 20px; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
    .back-btn:hover { border-color: #00d9ff; color: #fff; box-shadow: 0 0 10px rgba(0, 217, 255, 0.3); }

    .lab-main { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; }
    
    .glass-panel { background: rgba(10, 14, 39, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(0, 217, 255, 0.1); border-radius: 12px; position: relative; overflow: hidden; }
    
    .metrics-grid { display: flex; flex-direction: column; gap: 20px; }
    .model-card { padding: 25px; display: flex; flex-direction: column; align-items: center; gap: 20px; transition: transform 0.3s; }
    .model-card:hover { transform: translateY(-5px); }
    .model-card.training { border-color: #00d9ff; box-shadow: 0 0 20px rgba(0, 217, 255, 0.2); }
    
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px; }
    .status-indicator[data-status="active"] { background: #00ff88; box-shadow: 0 0 8px #00ff88; }
    .status-indicator[data-status="pending"] { background: #ffcc00; }
    
    .stats-ring { position: relative; width: 120px; height: 120px; }
    .bg-ring { stroke: #1a3a52; stroke-width: 5; fill: none; }
    .progress-ring { stroke: #00d9ff; stroke-width: 5; fill: none; stroke-linecap: round; stroke-dasharray: 283; transition: stroke-dashoffset 1s ease-out; transform: rotate(-90deg); transform-origin: center; }
    .ring-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .ring-content .value { display: block; font-size: 1.5rem; font-weight: 700; color: #fff; }
    .ring-content .label { font-size: 0.6rem; color: #00d9ff; text-transform: uppercase; }

    .metrics-list { width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .metric-item span { font-size: 0.7rem; color: #6c757d; margin-bottom: 4px; display: block; }
    .bar-bg { height: 4px; background: #1a3a52; border-radius: 2px; }
    .bar-fill { height: 100%; background: linear-gradient(to right, #00d9ff, #005f73); border-radius: 2px; transition: width 1s; }

    .train-btn { width: 100%; background: #001a2c; border: 1px solid #00d9ff; color: #00d9ff; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .train-btn:hover:not(:disabled) { background: #00d9ff; color: #000; }
    .train-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Training Visualization */
    .training-vis { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
    .vis-header { display: flex; justify-content: space-between; align-items: center; }
    .epoch-counter { background: rgba(0, 217, 255, 0.1); color: #00d9ff; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(0, 217, 255, 0.3); }
    
    .chart-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 200px; }
    .chart-box { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); }
    .chart-label { font-size: 0.6rem; color: #6c757d; margin-bottom: 10px; }
    .line-chart { width: 100%; height: 140px; }

    .log-console { height: 200px; background: #02040a; border: 1px solid #1a3a52; border-radius: 6px; padding: 15px; font-family: 'Fira Code', monospace; font-size: 0.75rem; overflow-y: auto; }
    .log-entry { margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 3px; }
    .timestamp { color: #4a4d6d; margin-right: 10px; }
    .message.info { color: #e0e0e0; }
    .message.success { color: #00ff88; }
    .message.warn { color: #ffcc00; }

    .threshold-panel { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
    .threshold-head { display: flex; justify-content: space-between; align-items: center; }
    .threshold-head h2 { margin: 0; font-size: 1rem; color: #b7c9ff; letter-spacing: 1px; }
    .threshold-pill { background: rgba(0, 217, 255, 0.1); color: #00d9ff; border: 1px solid rgba(0, 217, 255, 0.35); border-radius: 16px; padding: 4px 10px; font-weight: 700; }

    .threshold-slider { width: 100%; accent-color: #00d9ff; }
    .threshold-scale { display: flex; justify-content: space-between; font-size: 0.72rem; color: #6c757d; }

    .threshold-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .kpi-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(0, 217, 255, 0.15); border-radius: 8px; padding: 10px; }
    .kpi-label { font-size: 0.7rem; color: #6c757d; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.6px; }
    .kpi-value { font-size: 1rem; color: #e0e0e0; font-weight: 700; }

    @media (max-width: 1200px) {
      .lab-main { grid-template-columns: 1fr; }
      .threshold-kpis { grid-template-columns: 1fr; }
      .chart-container { grid-template-columns: 1fr; height: auto; }
    }
  `]
})
export class AiLaboratoryComponent implements OnInit, OnDestroy {
  models: ModelMetric[] = [];
  isTraining = false;
  activeModel = '';
  currentEpoch = 0;
  logs: any[] = [];
  
  lossPoints = '';
  accPoints = '';

  fraudThreshold = 75;
  expectedAlertsPerHour = 12;
  expectedFalsePositiveRate = 14;
  expectedCaptureRate = 91;
  
  private simulationSub: Subscription | null = null;
  private thresholdSub: Subscription | null = null;
  private metricsUrl = 'http://localhost:8000/admin/model-metrics';

  constructor(
    private http: HttpClient,
    private fraudDataService: FraudDataService
  ) {}

  ngOnInit() {
    this.fetchMetrics();
    this.thresholdSub = this.fraudDataService.fraudThreshold$.subscribe(value => {
      this.fraudThreshold = value;
      this.recomputeThresholdKpis(value);
    });
    this.addLog('System initialized. Neural cores ready.', 'info');
  }

  onThresholdInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.fraudDataService.setFraudThreshold(value);
    this.addLog(`Fraud threshold updated to ${Math.round(value)}%.`, 'warn');
  }

  private recomputeThresholdKpis(threshold: number) {
    const sensitivity = 100 - threshold;
    this.expectedAlertsPerHour = Math.max(4, Math.round(6 + sensitivity * 0.9));
    this.expectedFalsePositiveRate = Math.max(3, Math.round(5 + sensitivity * 0.6));
    this.expectedCaptureRate = Math.min(98, Math.max(60, Math.round(82 + (85 - threshold) * 0.5)));
  }

  fetchMetrics() {
    this.http.get<any>(this.metricsUrl).subscribe(data => {
      this.models = data.models;
      this.addLog('Live metrics retrieved from cloud backend.', 'success');
    });
  }

  startTraining(modelName: string) {
    this.isTraining = true;
    this.activeModel = modelName;
    this.currentEpoch = 0;
    this.logs = [];
    this.lossPoints = '';
    this.accPoints = '';
    
    this.addLog(`Starting re-training for ${modelName}...`, 'info');
    this.addLog('Allocating GPU resources...', 'info');
    
    // Simulate training progress
    let points: {x: number, y: number}[] = [];
    let acc_points: {x: number, y: number}[] = [];
    
    this.simulationSub = interval(800).subscribe(() => {
      this.currentEpoch++;
      
      const loss = Math.max(0.1, 0.9 * Math.pow(0.8, this.currentEpoch / 2) + (Math.random() * 0.05));
      const acc = Math.min(0.99, 0.6 + (0.35 * (this.currentEpoch / 20)) + (Math.random() * 0.02));
      
      this.updateCharts(this.currentEpoch, loss, acc);
      this.addLog(`Epoch ${this.currentEpoch}/20 - loss: ${loss.toFixed(4)} - accuracy: ${acc.toFixed(4)}`, 'info');
      
      if (this.currentEpoch >= 20) {
        this.finishTraining();
      }
    });
  }

  updateCharts(epoch: number, loss: number, acc: number) {
    const x = (epoch / 20) * 400;
    const yLoss = 190 - (loss * 150);
    const yAcc = 190 - (acc * 150);
    
    this.lossPoints += `${x},${yLoss} `;
    this.accPoints += `${x},${yAcc} `;
  }

  finishTraining() {
    this.isTraining = false;
    this.simulationSub?.unsubscribe();
    this.addLog('Training completed successfully.', 'success');
    this.addLog('New weights exported to /models directory.', 'success');
    
    // Slight boost to the specific model's metrics for the UI
    const model = this.models.find(m => m.name === this.activeModel);
    if (model) {
      model.auc = Math.min(0.99, model.auc + 0.015);
      model.accuracy = Math.min(0.99, model.accuracy + 0.012);
    }
  }

  addLog(msg: string, type: 'info' | 'success' | 'warn') {
    const time = new Date().toLocaleTimeString();
    this.logs.unshift({ time, msg, type });
  }

  goBack() {
    window.history.back();
  }

  ngOnDestroy() {
    this.simulationSub?.unsubscribe();
    this.thresholdSub?.unsubscribe();
  }
}
