import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="login-brand">
          <div class="brand-icon">H</div>
          <span>HotelOS</span>
        </div>
        <div class="login-hero">
          <h1>Premium Hotel<br>Management Platform</h1>
          <p>Multi-tenant SaaS solution for modern hotel operations. Manage rooms, bookings, guests, and revenue all in one place.</p>
        </div>
        <div class="login-stats">
          <div class="stat"><span class="stat-num">2,400+</span><span class="stat-label">Hotels</span></div>
          <div class="stat"><span class="stat-num">98.9%</span><span class="stat-label">Uptime</span></div>
          <div class="stat"><span class="stat-num">50M+</span><span class="stat-label">Bookings</span></div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>Sign in</h2>
            <p>Welcome back. Enter your credentials to continue.</p>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group" style="margin-bottom:1rem">
              <label>Email address</label>
              <input type="email" class="form-input" formControlName="email" placeholder="admin@grandhotel.com" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="field-error">Valid email required</span>
              }
            </div>
            <div class="form-group" style="margin-bottom:0.5rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                <label>Password</label>
                <a href="#" class="forgot-link" (click)="$event.preventDefault();goToForgotPassword()">Forgot?</a>
              </div>
              <div class="pw-wrap">
                <input [type]="showPw ? 'text' : 'password'" class="form-input" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
                <button type="button" class="pw-toggle" (click)="showPw = !showPw">
                  <i class="bi" [class.bi-eye]="!showPw" [class.bi-eye-slash]="showPw"></i>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="field-error">Password required</span>
              }
            </div>
            <div class="form-group-checkbox" style="margin-bottom:1.5rem;margin-top:1rem">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="rememberMe" />
                <span>Keep me signed in</span>
              </label>
            </div>
            @if (errorMsg) {
              <div class="error-banner">
                <i class="bi bi-exclamation-triangle"></i> {{ errorMsg }}
              </div>
            }
            <button type="submit" class="btn-primary-custom" style="width:100%;justify-content:center;padding:0.75rem" [disabled]="loading">
              @if (loading) { <span class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span> }
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
          <div class="auth-footer">
            <p>Don't have an account? <a href="#" class="signup-link" (click)="$event.preventDefault();goToSignup()">Create one</a></p>
          </div>
          <div class="demo-hint">
            <i class="bi bi-lightbulb"></i>
            <span><strong>Demo credentials:</strong> admin&#64;grandhotel.com / password123</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex;
      background: var(--color-bg);
    }
    .login-left {
      flex: 1; display: flex; flex-direction: column;
      justify-content: space-between;
      padding: 3rem;
      background: linear-gradient(135deg, rgba(15,17,23,0.95) 0%, rgba(17,24,39,0.95) 100%),
                  linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%);
      border-right: 1px solid var(--color-border);
      position: relative;
      overflow: hidden;
      &::before {
        content: '';
        position: absolute;
        top: -10%; left: -5%;
        width: 600px; height: 600px;
        background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
        border-radius: 50%;
      }
      &::after {
        content: '';
        position: absolute;
        bottom: -15%; right: -10%;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
        border-radius: 50%;
      }
      @media (max-width: 768px) { display: none; }
    }
    .login-brand {
      display: flex; align-items: center; gap: 0.75rem;
      font-weight: 700; font-size: 1.2rem;
      position: relative; z-index: 1;
      .brand-icon {
        width: 40px; height: 40px;
        background: var(--color-accent); color: #fff;
        border-radius: var(--radius-md);
        display: flex; align-items: center; justify-content: center;
        font-weight: 800;
        box-shadow: 0 4px 12px rgba(59,130,246,0.3);
      }
    }
    .login-hero {
      position: relative; z-index: 1;
      h1 { font-size: 2.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; background: linear-gradient(135deg, #fff 0%, #abeeff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      p { font-size: 1rem; color: var(--color-text-muted); line-height: 1.6; max-width: 380px; }
    }
    .login-stats {
      display: flex; gap: 2.5rem; position: relative; z-index: 1;
      .stat { display: flex; flex-direction: column; gap: 0.2rem; }
      .stat-num { font-size: 1.5rem; font-weight: 700; font-family: var(--font-mono); color: var(--color-accent); }
      .stat-label { font-size: 0.8rem; color: var(--color-text-muted); }
    }
    .login-right {
      width: 480px; display: flex; align-items: center; justify-content: center;
      padding: 2rem;
      @media (max-width: 768px) { width: 100%; }
    }
    .login-card { width: 100%; max-width: 380px; }
    .login-header {
      margin-bottom: 2rem;
      h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
      p { font-size: 0.875rem; color: var(--color-text-muted); }
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block; font-size: 0.875rem; font-weight: 500; 
      color: var(--color-text); margin-bottom: 0.5rem;
    }
    .form-input {
      width: 100%; padding: 0.75rem 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-size: 1rem;
      transition: all 0.2s ease;
      &:focus {
        outline: none;
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
      }
      &::placeholder { color: var(--color-text-subtle); }
    }
    .pw-wrap { position: relative; }
    .pw-toggle {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--color-text-muted);
      cursor: pointer; font-size: 1rem; transition: color 0.2s;
      &:hover { color: var(--color-accent); }
    }
    .forgot-link {
      font-size: 0.8rem; color: var(--color-accent);
      text-decoration: none; transition: color 0.2s;
      &:hover { color: var(--color-accent); text-decoration: underline; }
    }
    .form-group-checkbox {
      label { margin-bottom: 0; }
      .checkbox-label {
        display: flex; align-items: center; gap: 0.5rem;
        cursor: pointer; font-size: 0.875rem;
        color: var(--color-text-muted);
        input {
          width: 18px; height: 18px;
          cursor: pointer;
          accent-color: var(--color-accent);
        }
        &:hover { color: var(--color-text); }
      }
    }
    .field-error { 
      font-size: 0.75rem; color: var(--color-red); 
      margin-top: 0.25rem; display: block;
    }
    .error-banner {
      background: var(--color-red-soft); border: 1px solid var(--color-red);
      border-radius: var(--radius-md); padding: 0.75rem 1rem;
      color: var(--color-red); font-size: 0.875rem;
      margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .auth-footer {
      text-align: center; margin-top: 1.5rem;
      p { font-size: 0.875rem; color: var(--color-text-muted); }
      .signup-link {
        color: var(--color-accent); font-weight: 500;
        text-decoration: none; transition: color 0.2s;
        &:hover { text-decoration: underline; }
      }
    }
    .demo-hint {
      margin-top: 1.5rem; padding: 0.75rem 1rem;
      background: var(--color-accent-soft); 
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: var(--radius-md);
      font-size: 0.75rem; color: var(--color-text-muted);
      display: flex; align-items: flex-start; gap: 0.75rem;
      i { flex-shrink: 0; margin-top: 2px; color: var(--color-accent); font-size: 0.85rem; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form = this.fb.group({
    email: ['admin@grandhotel.com', [Validators.required, Validators.email]],
    password: ['password123', Validators.required],
    rememberMe: [false]
  });

  loading = false;
  showPw = false;
  errorMsg = '';

  ngOnInit() {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);
    // Load rememberMe preference
    const savedEmail = localStorage.getItem('rememberMe_email');
    if (savedEmail) {
      this.form.patchValue({ email: savedEmail, rememberMe: true });
    }
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { email, password, rememberMe } = this.form.value;
    
    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('rememberMe_email', email!);
    } else {
      localStorage.removeItem('rememberMe_email');
    }

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Welcome back!', 'Signed in');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMsg = res.message || 'Login failed';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Invalid credentials. Please check your email and password.';
        this.loading = false;
      }
    });
  }

  goToForgotPassword() {
    // TODO: Implement forgot password page/modal
    this.toast.info('Coming soon', 'Password reset functionality will be available soon');
  }

  goToSignup() {
    // TODO: Implement sign up page or redirect to signup URL
    this.toast.info('Coming soon', 'Sign up functionality will be available soon');
  }
}
