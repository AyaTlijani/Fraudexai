import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <button class="back-button" (click)="goBack()">← Back</button>
      <div class="dashboard-content">
        <h1>Client Dashboard</h1>
        <p>Welcome to the Client Dashboard</p>
        <p>This page is under development</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      padding: 40px;
      background: linear-gradient(135deg, #F8F9FF 0%, rgba(108, 99, 255, 0.05) 100%);
      position: relative;
    }

    .back-button {
      position: absolute;
      top: 30px;
      left: 30px;
      padding: 12px 20px;
      border: 2px solid #6C63FF;
      border-radius: 25px;
      background: transparent;
      color: #6C63FF;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #6C63FF;
        color: white;
      }
    }

    .dashboard-content {
      max-width: 800px;
      margin: 100px auto 0;
      text-align: center;

      h1 {
        font-size: 2.5rem;
        color: #6C63FF;
        margin-bottom: 20px;
      }

      p {
        font-size: 1.1rem;
        color: #666;
        margin: 10px 0;
      }
    }
  `]
})
export class ClientDashboardComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/auth']);
  }
}
