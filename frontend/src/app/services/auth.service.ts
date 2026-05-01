import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, throwError } from 'rxjs';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'client' | 'admin';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentAuthUserSubject = new BehaviorSubject<AuthUser | null>(
    this.loadUserFromSession()
  );
  public currentAuthUser$: Observable<AuthUser | null> = this.currentAuthUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.loadUserFromSession());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {
    console.log('[AUTH SERVICE] Initialized');
  }

  /**
   * Register a new user (signup)
   */
  signup(fullName: string, email: string, password: string, role: 'client' | 'admin'): Observable<AuthUser> {
    // In a real app, this would call /signup. For now, we'll keep it mock or implement if needed.
    const newUser: AuthUser = {
      id: `USR-${role.toUpperCase()}-${Date.now()}`,
      fullName,
      email,
      role,
      createdAt: new Date().toISOString()
    };

    sessionStorage.setItem('authUser', JSON.stringify(newUser));
    this.currentAuthUserSubject.next(newUser);
    this.isAuthenticatedSubject.next(true);

    return of(newUser);
  }

  /**
   * Login user
   */
  login(identifier: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/login`, { identifier, password }).pipe(
      map(user => {
        sessionStorage.setItem('authUser', JSON.stringify(user));
        this.currentAuthUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        console.log('[AUTH SERVICE] User logged in:', user);
        return user;
      }),
      catchError(error => {
        console.error('[AUTH SERVICE] Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentAuthUser(): AuthUser | null {
    return this.currentAuthUserSubject.value;
  }

  /**
   * Logout current user
   */
  logout(): void {
    sessionStorage.removeItem('authUser');
    this.currentAuthUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    console.log('[AUTH SERVICE] User logged out');
  }

  /**
   * Load user from session storage (for page refresh)
   */
  private loadUserFromSession(): AuthUser | null {
    const stored = sessionStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentAuthUserSubject.value;
  }
}
