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
  address?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-ai-laboratory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="admin-container">

    <!-- BACK BUTTON -->
    <button class="back-btn" (click)="goBack()">← Back</button>

    <header class="header">
      <h1>🛡️ Admin Control Panel</h1>
      <p>User Management Interface</p>
    </header>

    <!-- ADD USER FORM -->
    <div class="form-box">
      <h2>Add New User</h2>

      <div class="grid">
        <div class="field">
          <label>First Name *</label>
          <input [(ngModel)]="newUser.firstName" placeholder="John" />
        </div>
        <div class="field">
          <label>Last Name *</label>
          <input [(ngModel)]="newUser.lastName" placeholder="Doe" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input [(ngModel)]="newUser.phone" placeholder="+1 555 000 0000" />
        </div>
        <div class="field">
          <label>Email *</label>
          <input [(ngModel)]="newUser.email" placeholder="john@example.com" type="email" />
        </div>
        <div class="field">
          <label>Password *</label>
          <input [(ngModel)]="newUser.password" placeholder="Password" type="password" />
        </div>
        <div class="field">
          <label>Credit Card</label>
          <input [(ngModel)]="newUser.creditCard" placeholder="1234 5678 9012 3456" />
        </div>
        <div class="field full">
          <label>Address</label>
          <input [(ngModel)]="newUser.address" placeholder="123 Main St, City, Country" />
        </div>
      </div>

      <button class="btn-primary" (click)="addUser()">+ Add User</button>

      <p class="msg error"   *ngIf="errorMsg">{{ errorMsg }}</p>
      <p class="msg success" *ngIf="successMsg">{{ successMsg }}</p>
    </div>

    <!-- USERS TABLE -->
    <div class="table-box">
      <div class="table-header">
        <h2>Registered Users <span class="count">{{ users.length }}</span></h2>
        <input class="search" [(ngModel)]="searchTerm" placeholder="🔍  Search by name or email…" />
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Address</th>
            <th>Password</th>
            <th>Credit Card</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of filteredUsers()">
            <td><span class="avatar">{{ u.firstName[0] }}{{ u.lastName[0] }}</span> {{ u.firstName }} {{ u.lastName }}</td>
            <td>{{ u.phone || '—' }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.address || '—' }}</td>
            <td><span class="masked">••••••••</span></td>
            <td>{{ maskCard(u.creditCard) }}</td>
            <td class="date">{{ u.createdAt || '—' }}</td>
            <td class="actions">
              <button class="btn-edit"   (click)="openEdit(u)">✏️ Edit</button>
              <button class="btn-delete" (click)="deleteUser(u.email)">🗑 Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="users.length === 0" class="empty">No users yet. Add one above.</p>
    </div>

    <!-- ── EDIT MODAL ── -->
    <div class="modal-backdrop" *ngIf="editingUser" (click)="closeEdit()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h3>Edit User — {{ editingUser.email }}</h3>
          <button class="modal-close" (click)="closeEdit()">✕</button>
        </div>

        <div class="grid">
          <div class="field">
            <label>First Name</label>
            <input [(ngModel)]="editCopy.firstName" />
          </div>
          <div class="field">
            <label>Last Name</label>
            <input [(ngModel)]="editCopy.lastName" />
          </div>
          <div class="field">
            <label>Phone</label>
            <input [(ngModel)]="editCopy.phone" />
          </div>
          <div class="field">
            <label>Email</label>
            <input [(ngModel)]="editCopy.email" type="email" />
          </div>
          <div class="field">
            <label>Password</label>
            <input [(ngModel)]="editCopy.password" type="password" />
          </div>
          <div class="field">
            <label>Credit Card</label>
            <input [(ngModel)]="editCopy.creditCard" />
          </div>
          <div class="field full">
            <label>Address</label>
            <input [(ngModel)]="editCopy.address" />
          </div>
        </div>

        <p class="msg error"   *ngIf="editError">{{ editError }}</p>
        <p class="msg success" *ngIf="editSuccess">{{ editSuccess }}</p>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeEdit()">Cancel</button>
          <button class="btn-primary"   (click)="saveEdit()">Save changes</button>
        </div>

      </div>
    </div>

  </div>
  `,
  styles: [`
    /* ── reset / base ───────────────────────────────────── */
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .admin-container {
      min-height: 100vh;
      background: #f0f4ff;
      color: #1a2340;
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 28px 36px;
    }

    /* ── back button ────────────────────────────────────── */
    .back-btn {
      background: transparent;
      border: 1px solid #7b9cf4;
      color: #4a72e8;
      padding: 7px 14px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      margin-bottom: 18px;
      transition: background 0.15s;
    }
    .back-btn:hover { background: #e8effe; }

    /* ── header ─────────────────────────────────────────── */
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #3b5bdb;
      letter-spacing: 1px;
    }
    .header p {
      font-size: 13px;
      color: #6b7db3;
      margin-top: 4px;
    }

    /* ── cards ──────────────────────────────────────────── */
    .form-box, .table-box {
      background: #ffffff;
      border: 1px solid #d4dcf7;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 2px 12px rgba(74,114,232,0.07);
    }
    .form-box h2, .table-box h2 {
      font-size: 16px;
      font-weight: 600;
      color: #2d3f8f;
      margin-bottom: 18px;
    }

    /* ── form grid ──────────────────────────────────────── */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 18px;
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field.full { grid-column: 1 / -1; }
    label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7db3;
    }
    input {
      padding: 9px 12px;
      border-radius: 7px;
      border: 1px solid #c8d3f5;
      background: #f7f9ff;
      color: #1a2340;
      font-size: 13px;
      transition: border 0.15s, box-shadow 0.15s;
    }
    input:focus {
      outline: none;
      border-color: #7b9cf4;
      box-shadow: 0 0 0 3px rgba(123,156,244,0.18);
      background: #fff;
    }
    input::placeholder { color: #aab5d4; }

    /* ── buttons ────────────────────────────────────────── */
    .btn-primary {
      padding: 9px 20px;
      background: #4a72e8;
      color: #fff;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-primary:hover  { background: #3b5bdb; }
    .btn-primary:active { transform: scale(0.98); }

    .btn-secondary {
      padding: 9px 20px;
      background: transparent;
      color: #4a72e8;
      border: 1px solid #7b9cf4;
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: #e8effe; }

    /* ── messages ───────────────────────────────────────── */
    .msg { font-size: 13px; margin-top: 10px; padding: 8px 12px; border-radius: 6px; }
    .error   { background: #fff0f0; color: #c0392b; border: 1px solid #f5c6c6; }
    .success { background: #f0fff6; color: #1a7a46; border: 1px solid #b6ecd1; }

    /* ── table header row ───────────────────────────────── */
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 14px;
    }
    .count {
      display: inline-block;
      background: #e8effe;
      color: #4a72e8;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      vertical-align: middle;
    }
    .search {
      width: 240px;
      padding: 8px 12px;
      border-radius: 7px;
      border: 1px solid #c8d3f5;
      background: #f7f9ff;
      font-size: 13px;
      color: #1a2340;
    }
    .search:focus { outline: none; border-color: #7b9cf4; }

    /* ── table ──────────────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #6b7db3;
      border-bottom: 2px solid #e2e8f8;
    }
    td {
      padding: 11px 12px;
      border-bottom: 1px solid #edf0fa;
      color: #2a3560;
      vertical-align: middle;
    }
    tr:hover td { background: #f7f9ff; }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e0e8ff;
      color: #3b5bdb;
      font-size: 10px;
      font-weight: 700;
      margin-right: 6px;
      vertical-align: middle;
      text-transform: uppercase;
    }
    .masked { color: #aab5d4; letter-spacing: 2px; }
    .date   { font-size: 11px; color: #9aa5c8; }

    /* ── action buttons ─────────────────────────────────── */
    .actions { display: flex; gap: 6px; }
    .btn-edit {
      padding: 5px 10px;
      background: #eef2ff;
      color: #4a72e8;
      border: 1px solid #c5d0f7;
      border-radius: 5px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .btn-edit:hover { background: #dde5ff; }
    .btn-delete {
      padding: 5px 10px;
      background: #fff0f3;
      color: #c0392b;
      border: 1px solid #f5c6c6;
      border-radius: 5px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .btn-delete:hover { background: #ffe0e5; }

    .empty {
      text-align: center;
      color: #aab5d4;
      font-size: 13px;
      padding: 28px 0;
    }

    /* ── modal ──────────────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(30, 40, 90, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #d4dcf7;
      padding: 28px 32px;
      width: 100%;
      max-width: 680px;
      box-shadow: 0 8px 40px rgba(74,114,232,0.15);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .modal-header h3 {
      font-size: 15px;
      font-weight: 600;
      color: #2d3f8f;
    }
    .modal-close {
      background: transparent;
      border: none;
      font-size: 16px;
      color: #9aa5c8;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #f0f4ff; color: #c0392b; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `]
})
export class AiLaboratoryComponent implements OnInit {

  // ── storage key ──────────────────────────────────────────
  private readonly STORAGE_KEY = 'admin_users';

  users: User[] = [];
  searchTerm = '';

  newUser: User = this.emptyUser();

  errorMsg   = '';
  successMsg = '';

  // edit modal state
  editingUser: User | null = null;
  editCopy:    User = this.emptyUser();
  editError   = '';
  editSuccess = '';

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUsers();
  }

  // ── navigation ───────────────────────────────────────────
  goBack(): void {
    window.location.href = 'http://localhost:4200/admin-dashboard';
  }

  // ── persistence (localStorage acts as local DB for now) ──
  private loadUsers(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.users = raw ? JSON.parse(raw) : [];
  }

  private saveUsers(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.users));
  }

  // ── validation helpers ───────────────────────────────────
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    if (!phone) return true;
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    return /^[0-9]{7,15}$/.test(cleaned);
  }

  private isValidCreditCard(card: string): boolean {
    if (!card) return true;
    const cleaned = card.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
  }

  // ── add ──────────────────────────────────────────────────
  addUser(): void {
    this.errorMsg   = '';
    this.successMsg = '';

    const fn = this.newUser.firstName.trim();
    const ln = this.newUser.lastName.trim();
    const em = this.newUser.email.trim();
    const pw = this.newUser.password.trim();
    const ph = this.newUser.phone.trim();
    const cc = this.newUser.creditCard.trim();

    if (!fn || !ln || !em || !pw) {
      this.errorMsg = 'First name, last name, email and password are required.';
      return;
    }

    if (!this.isValidEmail(em)) {
      this.errorMsg = 'Please enter a valid email address.';
      return;
    }

    if (pw.length < 4) {
      this.errorMsg = 'Password must be at least 4 characters long.';
      return;
    }

    if (!this.isValidPhone(ph)) {
      this.errorMsg = 'Phone number is not in a valid format.';
      return;
    }

    if (!this.isValidCreditCard(cc)) {
      this.errorMsg = 'Credit card must be 13 to 19 digits.';
      return;
    }

    if (this.users.find(u => u.email === em.toLowerCase())) {
      this.errorMsg = 'A user with this email already exists.';
      return;
    }

    const user: User = {
      ...this.newUser,
      firstName: fn,
      lastName: ln,
      email: em.toLowerCase(),
      phone: ph,
      creditCard: cc,
      address: this.newUser.address?.trim(),
      createdAt: new Date().toLocaleDateString('en-GB')
    };

    this.users.push(user);
    this.saveUsers();

    this.successMsg = `User ${user.firstName} ${user.lastName} registered successfully.`;
    this.newUser = this.emptyUser();
  }

  // ── delete ───────────────────────────────────────────────
  deleteUser(email: string): void {
    if (!confirm(`Delete user ${email}?`)) return;
    this.users = this.users.filter(u => u.email !== email);
    this.saveUsers();
  }

  // ── edit modal ───────────────────────────────────────────
  openEdit(user: User): void {
    this.editingUser = user;
    this.editCopy    = { ...user };
    this.editError   = '';
    this.editSuccess = '';
  }

  closeEdit(): void {
    this.editingUser = null;
  }

  saveEdit(): void {
    this.editError   = '';
    this.editSuccess = '';

    const fn = this.editCopy.firstName.trim();
    const ln = this.editCopy.lastName.trim();
    const em = this.editCopy.email.trim();
    const pw = this.editCopy.password.trim();
    const ph = this.editCopy.phone.trim();
    const cc = this.editCopy.creditCard.trim();

    if (!fn || !ln || !em) {
      this.editError = 'First name, last name and email are required.';
      return;
    }

    if (!this.isValidEmail(em)) {
      this.editError = 'Please enter a valid email address.';
      return;
    }

    if (pw && pw.length < 4) {
      this.editError = 'Password must be at least 4 characters long.';
      return;
    }

    if (!this.isValidPhone(ph)) {
      this.editError = 'Phone number is not in a valid format.';
      return;
    }

    if (!this.isValidCreditCard(cc)) {
      this.editError = 'Credit card must be 13 to 19 digits.';
      return;
    }

    const duplicate = this.users.find(
      u => u.email === em.toLowerCase() && u.email !== this.editingUser!.email
    );
    if (duplicate) {
      this.editError = 'Another user already has that email.';
      return;
    }

    const idx = this.users.indexOf(this.editingUser!);
    if (idx !== -1) {
      this.users[idx] = {
        ...this.editCopy,
        firstName: fn,
        lastName: ln,
        email: em.toLowerCase(),
        phone: ph,
        creditCard: cc,
        address: this.editCopy.address?.trim()
      };
      this.saveUsers();
      this.editSuccess = 'Changes saved.';
      setTimeout(() => this.closeEdit(), 900);
    }
  }

  // ── search filter ────────────────────────────────────────
  filteredUsers(): User[] {
    if (!this.searchTerm.trim()) return this.users;
    const q = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  // ── helpers ──────────────────────────────────────────────
  maskCard(card: string): string {
    if (!card) return '—';
    return '**** **** **** ' + card.slice(-4);
  }

  private emptyUser(): User {
    return { firstName: '', lastName: '', phone: '', email: '', password: '', creditCard: '', address: '' };
  }
}