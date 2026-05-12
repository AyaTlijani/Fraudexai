import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';

type AuthState = 'login' | 'signup';
type UserRole = 'client' | 'admin' | null;

interface LoginFormData {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms?: boolean;
}

interface ValidationError {
  message: string;
  field: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  authState: AuthState = 'login';
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // UI State
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  validationErrors: ValidationError[] = [];

  // User Role
  selectedRole: UserRole = null;

  // Virtual Keypad
  keypadDigits: (number | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedRole = params['role'] || null;
    });

    this.initializeForms();
    this.shuffleKeypad();
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)]],
      confirmPassword: ['', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onToggleAuthState(state: AuthState): void {
    this.authState = state;
    this.validationErrors = [];
    this.clearPasswords();
  }

  quickLogin(role: 'admin' | 'client'): void {
    const identifier = role === 'admin' ? 'admin' : 'client';
    this.loginForm.patchValue({
      identifier,
      password: '123456',
      rememberMe: true
    });
    this.validationErrors = [];
    this.onLogin();
  }

  openExternal(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  onLogin(): void {
    const formData: LoginFormData = this.loginForm.value;

    // ✅ Hardcoded admin demo login
    if (
      (formData.identifier === 'admin@demo.com' && formData.password === '123456') ||
      (formData.identifier === 'admin' && formData.password === '123456')
    ) {
      this.navigateAfterAuth('admin');
      return;
    }

    // ✅ Hardcoded client demo login
    if (
      (formData.identifier === 'client@demo.com' && formData.password === '123456') ||
      (formData.identifier === 'client' && formData.password === '123456')
    ) {
      this.navigateAfterAuth('client');
      return;
    }

    // ✅ Check users added via AiLaboratoryComponent (localStorage)
    const raw = localStorage.getItem('admin_users');
    const storedUsers: any[] = raw ? JSON.parse(raw) : [];
    const match = storedUsers.find(
      u =>
        u.email.toLowerCase() === formData.identifier.trim().toLowerCase() &&
        u.password === formData.password
    );
    if (match) {
      this.navigateAfterAuth('client');
      return;
    }

    // Fallback: real backend
    if (this.loginForm.invalid) {
      if (!this.loginForm.get('password')?.value) {
        this.validationErrors = [{ field: 'password', message: this.tr('validation.passwordRequired') }];
        return;
      }
      this.handleValidationErrors(this.loginForm);
      return;
    }

    this.isLoading = true;

    this.authService.login(formData.identifier, formData.password).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.navigateAfterAuth(user.role);
      },
      error: (err) => {
        this.isLoading = false;

        let errorMessage = this.tr('validation.invalidEmailOrPassword');

        if (err.status === 401) {
          errorMessage = this.tr('validation.invalidPassword');
        } else {
          errorMessage = this.tr('validation.authServerError');
        }

        this.validationErrors = [{ field: 'auth', message: errorMessage }];
      }
    });
  }

  shuffleKeypad(): void {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const placeholders: (number | null)[] = [null, null, null, null];
    const combined = [...digits, ...placeholders];

    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    this.keypadDigits = combined;
  }

  onKeypadSelect(digit: number | null): void {
    if (digit === null) return;
    const currentPassword = this.loginForm.get('password')?.value || '';
    this.loginForm.patchValue({ password: currentPassword + digit.toString() });
  }

  onClearKeypad(): void {
    this.loginForm.patchValue({ password: '' });
  }

  onKeypadSubmit(): void {
    this.onLogin();
  }

  onSignup(): void {
    if (this.signupForm.invalid) {
      this.handleValidationErrors(this.signupForm);
      return;
    }

    this.isLoading = true;
    const formData: SignupFormData = this.signupForm.value;
    const { confirmPassword, ...submitData } = formData;

    setTimeout(() => {
      console.log('Signup attempt:', submitData);

      this.authService.signup(
        formData.fullName,
        formData.email,
        formData.password,
        this.selectedRole as 'client' | 'admin'
      );

      this.isLoading = false;
      this.navigateAfterAuth();
    }, 1500);
  }

  onSocialLogin(provider: string): void {
    console.log(`Attempting ${provider} login`);
    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      console.log(`${provider} login successful`);
      this.navigateAfterAuth();
    }, 1500);
  }

  private handleValidationErrors(form: FormGroup): void {
    this.validationErrors = [];

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);

      if (control && control.errors) {
        let message = '';
        const fieldLabel = this.getFieldLabel(key);

        if (control.errors['required']) {
          message = this.tr('validation.required', { field: fieldLabel });
        } else if (control.errors['email']) {
          message = this.tr('validation.invalidEmail');
        } else if (control.errors['minlength']) {
          const minLength = control.errors['minlength'].requiredLength;
          message = this.tr('validation.minlength', { field: fieldLabel, min: minLength });
        } else if (control.errors['pattern']) {
          message = this.tr('validation.passwordPattern');
        } else if (control.errors['passwordMismatch']) {
          message = this.tr('validation.passwordMismatch');
        }

        if (message) {
          this.validationErrors.push({ field: key, message });
        }
      }
    });
  }

  private getFieldLabel(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      identifier: 'field.identifier',
      password: 'field.password',
      fullName: 'field.fullName',
      email: 'field.email',
      confirmPassword: 'field.confirmPassword',
      agreeToTerms: 'field.terms'
    };

    return this.languageService.translate(fieldMap[fieldName] ?? fieldName);
  }

  private tr(key: string, params?: Record<string, string | number>): string {
    const template = this.languageService.translate(key);
    if (!params) return template;

    return Object.entries(params).reduce((acc, [name, value]) => {
      return acc.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }, template);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onBackClick(): void {
    this.router.navigate(['/']);
  }

  private clearPasswords(): void {
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  private navigateAfterAuth(userRole?: 'client' | 'admin'): void {
    if (userRole === 'client' || this.selectedRole === 'client') {
      this.router.navigate(['/client-hub']);
    } else if (userRole === 'admin' || this.selectedRole === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/auth']);
    }
  }

  getPasswordError(): string {
    const passwordControl = this.signupForm.get('password');
    if (!passwordControl || !passwordControl.errors) return '';

    if (passwordControl.errors['required']) return this.tr('validation.passwordRequired');
    if (passwordControl.errors['minlength']) return this.tr('validation.passwordMinLength');
    if (passwordControl.errors['pattern']) return this.tr('validation.passwordPatternShort');
    return '';
  }
}