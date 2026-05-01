import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../services/currency.service';

interface RateInfo {
  code: string;
  name: string;
  flag: string;
  value: number;
}

@Component({
  selector: 'app-currency-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="converter-page">
      <header class="page-header">
        <h1 class="title">Convertisseur de devise</h1>
        <p class="subtitle">Taux de change en temps réel</p>
      </header>

      <!-- Main Converter Section -->
      <div class="converter-card glass-card">
        <div class="input-section">
          <div class="amount-field">
            <label>Montant</label>
            <input type="number" [(ngModel)]="amount" (ngModelChange)="onAmountChange()" class="amount-input" placeholder="0.00">
          </div>

          <div class="selectors-row">
            <div class="currency-selector">
              <div class="selector-box" (click)="toggleDropdown('from')">
                <span class="flag">{{ getCurrencyFlag(fromCurrency) }}</span>
                <span class="code">{{ fromCurrency }}</span>
                <span class="arrow">▼</span>
              </div>
              <!-- Dropdown (simplified as a select for this exercise) -->
              <select [(ngModel)]="fromCurrency" (change)="onCurrencyChange()" class="hidden-select">
                <option *ngFor="let c of supportedCurrencies" [value]="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
              </select>
            </div>

            <button class="swap-btn" (click)="swapCurrencies()">
              <span class="swap-icon">⇄</span>
            </button>

            <div class="currency-selector">
              <div class="selector-box" (click)="toggleDropdown('to')">
                <span class="flag">{{ getCurrencyFlag(toCurrency) }}</span>
                <span class="code">{{ toCurrency }}</span>
                <span class="arrow">▼</span>
              </div>
              <select [(ngModel)]="toCurrency" (change)="onCurrencyChange()" class="hidden-select">
                <option *ngFor="let c of supportedCurrencies" [value]="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="result-section">
          <div class="converted-amount">
            <span class="value">{{ convertedAmount | number:'1.2-2' }}</span>
            <span class="unit">{{ toCurrency }}</span>
          </div>
          <div class="exchange-rate">
            1.000 {{ fromCurrency }} → {{ currentRate | number:'1.4-4' }} {{ toCurrency }}
          </div>
        </div>

        <div class="update-info" *ngIf="lastUpdate">
          Dernière mise à jour : {{ lastUpdate | date:'dd/MM/yyyy HH:mm' }}
        </div>
      </div>

      <!-- Currency Table Section -->
      <section class="rates-section">
        <h2 class="section-title">Liste des devises</h2>
        <div class="rates-table-container glass-card">
          <table class="rates-table">
            <thead>
              <tr>
                <th>Monnaie</th>
                <th>Devise</th>
                <th>Unité</th>
                <th>Achat</th>
                <th>Vente</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rate of displayRates">
                <td>
                  <div class="currency-info">
                    <span class="table-flag">{{ rate.flag }}</span>
                    <span class="currency-name">{{ rate.name }}</span>
                  </div>
                </td>
                <td class="bold">{{ rate.code }}</td>
                <td>1</td>
                <td class="rate-buy">{{ rate.value | number:'1.3-3' }}</td>
                <td class="rate-sell">{{ rate.value * 1.02 | number:'1.3-3' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .converter-page {
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.5);
      margin: 5px 0 0;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 30px;
    }

    /* Converter Card */
    .converter-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
    }

    .input-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
    }

    .amount-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .amount-field label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .amount-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px 20px;
      color: white;
      font-size: 24px;
      width: 200px;
      text-align: center;
      outline: none;
      transition: all 0.3s;
    }

    .amount-input:focus {
      border-color: #a855f7;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
    }

    .selectors-row {
      display: flex;
      align-items: center;
      gap: 15px;
      width: 100%;
      justify-content: center;
    }

    .currency-selector {
      position: relative;
    }

    .selector-box {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      min-width: 120px;
      transition: all 0.2s;
    }

    .selector-box:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .hidden-select {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .flag { font-size: 24px; }
    .code { font-weight: 600; font-size: 18px; }
    .arrow { font-size: 10px; opacity: 0.5; }

    .swap-btn {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      border: none;
      background: #a855f7;
      color: white;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
      transition: all 0.3s;
    }

    .swap-btn:hover {
      transform: rotate(180deg);
      background: #9333ea;
    }

    .result-section {
      text-align: center;
    }

    .converted-amount {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 10px;
      margin-bottom: 5px;
    }

    .converted-amount .value {
      font-size: 48px;
      font-weight: 800;
      color: white;
    }

    .converted-amount .unit {
      font-size: 24px;
      color: #a855f7;
      font-weight: 600;
    }

    .exchange-rate {
      color: rgba(255, 255, 255, 0.5);
      font-size: 15px;
    }

    .update-info {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);
    }

    /* Table Section */
    .rates-section {
      margin-top: 50px;
    }

    .section-title {
      font-size: 20px;
      color: white;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .rates-table-container {
      padding: 0;
      overflow: hidden;
    }

    .rates-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
    }

    .rates-table th {
      background: rgba(255, 255, 255, 0.03);
      text-align: left;
      padding: 18px 25px;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 500;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .rates-table td {
      padding: 18px 25px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .rates-table tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .currency-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .table-flag { font-size: 20px; }
    .currency-name { color: #fff; font-weight: 500; }
    .bold { font-weight: 700; color: #a855f7; }

    .rate-buy { color: #4ade80; font-weight: 600; }
    .rate-sell { color: #f87171; font-weight: 600; }

    /* Fix for mobile */
    @media (max-width: 600px) {
      .selectors-row { flex-direction: column; }
      .swap-btn { transform: rotate(90deg); }
      .swap-btn:hover { transform: rotate(270deg); }
    }

    :host-context(:root[data-theme='dark']) .converter-page {
      color: #eef2ff;
    }

    :host-context(:root[data-theme='dark']) .glass-card {
      background: rgba(18, 24, 45, 0.9);
      border-color: rgba(149, 165, 235, 0.24);
    }

    :host-context(:root[data-theme='dark']) .converter-card {
      background: linear-gradient(140deg, rgba(116, 95, 220, 0.16), rgba(34, 197, 203, 0.12));
      box-shadow: 0 20px 44px rgba(4, 9, 28, 0.42);
    }

    :host-context(:root[data-theme='dark']) .title,
    :host-context(:root[data-theme='dark']) .section-title,
    :host-context(:root[data-theme='dark']) .converted-amount .value,
    :host-context(:root[data-theme='dark']) .currency-name,
    :host-context(:root[data-theme='dark']) .code {
      color: #eef3ff;
    }

    :host-context(:root[data-theme='dark']) .subtitle,
    :host-context(:root[data-theme='dark']) .exchange-rate,
    :host-context(:root[data-theme='dark']) .update-info,
    :host-context(:root[data-theme='dark']) .rates-table th {
      color: #a9b4d7;
    }

    :host-context(:root[data-theme='light']) .converter-page {
      color: #1b2948;
    }

    :host-context(:root[data-theme='light']) .glass-card {
      background: linear-gradient(150deg, rgba(255, 255, 255, 0.95), rgba(245, 249, 255, 0.92));
      border-color: rgba(106, 124, 179, 0.24);
      box-shadow: 0 12px 26px rgba(37, 55, 100, 0.12);
    }

    :host-context(:root[data-theme='light']) .converter-card {
      background: linear-gradient(145deg, rgba(95, 114, 206, 0.11), rgba(34, 197, 203, 0.09));
      box-shadow: 0 16px 34px rgba(40, 58, 104, 0.15);
    }

    :host-context(:root[data-theme='light']) .title,
    :host-context(:root[data-theme='light']) .section-title,
    :host-context(:root[data-theme='light']) .converted-amount .value,
    :host-context(:root[data-theme='light']) .currency-name,
    :host-context(:root[data-theme='light']) .code,
    :host-context(:root[data-theme='light']) .amount-input {
      color: #1b2948;
    }

    :host-context(:root[data-theme='light']) .subtitle,
    :host-context(:root[data-theme='light']) .exchange-rate,
    :host-context(:root[data-theme='light']) .update-info,
    :host-context(:root[data-theme='light']) .rates-table th,
    :host-context(:root[data-theme='light']) .amount-field label,
    :host-context(:root[data-theme='light']) .arrow {
      color: #5d6b90;
    }

    :host-context(:root[data-theme='light']) .amount-input {
      background: #f3f7ff;
      border-color: rgba(95, 114, 206, 0.3);
    }

    :host-context(:root[data-theme='light']) .amount-input:focus {
      background: #ecf2ff;
      border-color: rgba(95, 114, 206, 0.5);
      box-shadow: 0 0 0 3px rgba(95, 114, 206, 0.14);
    }

    :host-context(:root[data-theme='light']) .selector-box {
      background: rgba(95, 114, 206, 0.12);
      border-color: rgba(95, 114, 206, 0.24);
      color: #22335e;
    }

    :host-context(:root[data-theme='light']) .selector-box:hover {
      background: rgba(95, 114, 206, 0.18);
      border-color: rgba(95, 114, 206, 0.36);
    }

    :host-context(:root[data-theme='light']) .rates-table th {
      background: rgba(95, 114, 206, 0.1);
    }

    :host-context(:root[data-theme='light']) .rates-table td {
      border-top-color: rgba(106, 124, 179, 0.2);
      color: #1f2d4e;
    }

    :host-context(:root[data-theme='light']) .rates-table tr:hover {
      background: rgba(95, 114, 206, 0.08);
    }
  `]
})
export class CurrencyConverterComponent implements OnInit {
  amount: number = 100;
  fromCurrency: string = 'TND';
  toCurrency: string = 'EUR';
  convertedAmount: number = 0;
  currentRate: number = 0;
  lastUpdate: Date | null = null;
  
  supportedCurrencies = [
    { code: 'USD', name: 'Dollar Américain', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'TND', name: 'Dinar Tunisien', flag: '🇹🇳' },
    { code: 'SAR', name: 'Riyal Saoudien', flag: '🇸🇦' },
    { code: 'QAR', name: 'Riyal Qatari', flag: '🇶🇦' },
    { code: 'GBP', name: 'Livre Sterling', flag: '🇬🇧' },
    { code: 'CAD', name: 'Dollar Canadien', flag: '🇨🇦' },
    { code: 'JPY', name: 'Yen Japonais', flag: '🇯🇵' },
  ];

  displayRates: RateInfo[] = [];

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.currencyService.getLatestRates(this.fromCurrency).subscribe(data => {
      this.lastUpdate = new Date(data.time_last_update_utc);
      this.currentRate = data.rates[this.toCurrency];
      this.calculateConversion();
      this.updateDisplayRates(data.rates);
    });
  }

  onAmountChange(): void {
    this.calculateConversion();
  }

  onCurrencyChange(): void {
    this.refreshData();
  }

  swapCurrencies(): void {
    const temp = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = temp;
    this.refreshData();
  }

  calculateConversion(): void {
    this.convertedAmount = this.amount * this.currentRate;
  }

  updateDisplayRates(rates: any): void {
    this.displayRates = this.supportedCurrencies
      .filter(c => c.code !== this.fromCurrency)
      .map(c => ({
        ...c,
        value: rates[c.code]
      }));
  }

  getCurrencyFlag(code: string): string {
    return this.supportedCurrencies.find(c => c.code === code)?.flag || '🏳️';
  }

  toggleDropdown(type: 'from' | 'to'): void {
    // Dropdown is handled by the hidden select for simplicity in this demo
  }
}
