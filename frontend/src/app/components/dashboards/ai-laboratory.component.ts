import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  creditCard: string;
}

@Component({
  selector: 'app-ai-laboratory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="admin-container">

    <!-- BACK BUTTON (ONLY ADDITION) -->
    <button class="back-btn" (click)="goBack()">← Back</button>

    <header class="header">
      <h1>🛡️ ADMIN CONTROL PANEL</h1>
      <p>User Management Interface </p>
    </header>

    <!-- FORM -->
    <div class="form-box">
      <h2>Add New User</h2>

      <div class="grid">
        <input [(ngModel)]="newUser.firstName" placeholder="First Name" />
        <input [(ngModel)]="newUser.lastName" placeholder="Last Name" />
        <input [(ngModel)]="newUser.phone" placeholder="Phone" />
        <input [(ngModel)]="newUser.email" placeholder="Email" />
        <input [(ngModel)]="newUser.password" placeholder="Password" type="password" />
        <input [(ngModel)]="newUser.creditCard" placeholder="Credit Card Number" />
      </div>

      <button (click)="addUser()">Add User</button>

      <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>
      <p class="success" *ngIf="successMsg">{{ successMsg }}</p>
    </div>

    <!-- TABLE -->
    <div class="table-box">
      <h2>Registered Users</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Password</th>
            <th>Credit Card</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let u of users">
            <td>{{ u.firstName }} {{ u.lastName }}</td>
            <td>{{ u.phone }}</td>
            <td>{{ u.email }}</td>
            <td>••••••</td>
            <td>{{ maskCard(u.creditCard) }}</td>
            <td>
              <button class="delete" (click)="deleteUser(u.email)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="users.length === 0" class="empty">No users yet</p>
    </div>

  </div>
  `,
  styles: [`
    .admin-container {
      min-height: 100vh;
      background: #050714;
      color: #fff;
      font-family: Arial, sans-serif;
      padding: 30px;
    }

    /* BACK BUTTON STYLE */
    .back-btn {
      background: transparent;
      border: 1px solid #00d9ff;
      color: #00d9ff;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 15px;
    }

    .back-btn:hover {
      background: rgba(0,217,255,0.1);
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #00d9ff;
      letter-spacing: 2px;
    }

    .form-box, .table-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(0,217,255,0.2);
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }

    input {
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #1a3a52;
      background: #0a0f1f;
      color: white;
    }

    button {
      padding: 10px 15px;
      background: #00d9ff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }

    button:hover {
      opacity: 0.8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 10px;
      border-bottom: 1px solid #1a3a52;
      text-align: left;
      font-size: 0.9rem;
    }

    th {
      color: #00d9ff;
    }

    .delete {
      background: #ff0055;
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 5px;
    }

    .error {
      color: #ff4d4d;
      margin-top: 10px;
    }

    .success {
      color: #00ff88;
      margin-top: 10px;
    }

    .empty {
      text-align: center;
      opacity: 0.6;
      margin-top: 10px;
    }
  `]
})
export class AiLaboratoryComponent implements OnInit {

  users: User[] = [];

  newUser: User = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    creditCard: ''
  };

  errorMsg = '';
  successMsg = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  // ✅ BACK BUTTON FUNCTION
  goBack() {
    window.location.href = 'http://localhost:4200/admin-dashboard';
  }

  loadUsers() {
    const data = localStorage.getItem('admin_users');
    this.users = data ? JSON.parse(data) : [];
  }

  saveUsers() {
    localStorage.setItem('admin_users', JSON.stringify(this.users));
  }

  addUser() {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.newUser.email || !this.newUser.firstName) {
      this.errorMsg = 'Missing required fields';
      return;
    }

    const exists = this.users.find(u => u.email === this.newUser.email);
    if (exists) {
      this.errorMsg = 'User already exists';
      return;
    }

    this.users.push({ ...this.newUser });
    this.saveUsers();

    this.successMsg = 'User added successfully';

    this.newUser = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      creditCard: ''
    };
  }

  deleteUser(email: string) {
    this.users = this.users.filter(u => u.email !== email);
    this.saveUsers();
  }

  maskCard(card: string): string {
    if (!card) return '';
    return '**** **** **** ' + card.slice(-4);
  }
}