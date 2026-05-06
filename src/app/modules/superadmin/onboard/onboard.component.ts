import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models';

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="onboard-page">

      <div class="page-header">
        <div class="page-title">
          <button class="back-btn" (click)="router.navigate(['/superadmin'])">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div>
            <h2>Onboard New Hotel</h2>
            <p>Create a new tenant and admin account</p>
          </div>
        </div>
      </div>

      <div class="onboard-grid">

        <!-- LEFT: Form -->
        <div class="onboard-form">

          <div class="form-section">
            <div class="section-label">
              <div class="section-icon" style="background:var(--color-accent-soft);color:var(--color-accent)">
                <i class="bi bi-building"></i>
              </div>
              <span>Hotel Details</span>
            </div>

            <div class="field-grid">
              <div class="form-group">
                <label>Hotel Name</label>
                <input class="form-input" [(ngModel)]="form.hotelName"
                  placeholder="Grand Palace Hotel" />
              </div>
              <div class="form-group">
                <label>Subdomain</label>
                <div class="input-addon">
                  <input class="form-input" [(ngModel)]="form.subdomain"
                    placeholder="grandpalace" />
                  <span class="addon-text">.hotelOS.com</span>
                </div>
              </div>
            </div>
          </div>

          <hr class="section-divider" />

          <div class="form-section">
            <div class="section-label">
              <div class="section-icon" style="background:var(--color-green-soft);color:var(--color-green)">
                <i class="bi bi-person-badge"></i>
              </div>
              <span>Admin Account</span>
            </div>

            <div class="field-grid">
              <div class="form-group">
                <label>Admin Name</label>
                <input class="form-input" [(ngModel)]="form.adminName"
                  placeholder="Hotel Manager" />
              </div>
              <div class="form-group">
                <label>Admin Email</label>
                <input class="form-input" [(ngModel)]="form.adminEmail"
                  placeholder="admin@grandpalace.com" type="email" />
              </div>
              <div class="form-group full-width">
                <label>Temporary Password</label>
                <input class="form-input" [(ngModel)]="form.tempPassword"
                  placeholder="Hotel@1234" />
                <p class="field-hint">
                  <i class="bi bi-info-circle"></i>
                  Share this with the hotel admin — they should change it on first login
                </p>
              </div>
            </div>
          </div>

          @if (message()) {
            <div class="alert" [class.alert-success]="success()" [class.alert-error]="!success()">
              <i class="bi" [class.bi-check-circle]="success()" [class.bi-exclamation-circle]="!success()"></i>
              {{ message() }}
            </div>
          }

          <button class="submit-btn" (click)="submit()" [disabled]="loading()">
            @if (loading()) {
              <span class="loading-spinner"></span>
              <span>Creating Hotel...</span>
            } @else {
              <i class="bi bi-plus-circle"></i>
              <span>Onboard Hotel</span>
            }
          </button>

        </div>

        <!-- RIGHT: Info panel -->
        <div class="info-panel">
          <div class="info-header">
            <i class="bi bi-stars"></i>
            <span>What happens next?</span>
          </div>

          <div class="step-list">
            <div class="step-item">
              <div class="step-dot" style="background:var(--color-accent)">1</div>
              <div>
                <div class="step-title">Tenant Created</div>
                <div class="step-desc">A new isolated tenant environment is set up for the hotel</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-dot" style="background:var(--color-green)">2</div>
              <div>
                <div class="step-title">Admin Account Ready</div>
                <div class="step-desc">The hotel admin can log in with the provided credentials</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-dot" style="background:var(--color-purple)">3</div>
              <div>
                <div class="step-title">Hotel Goes Live</div>
                <div class="step-desc">Admin can start adding rooms, staff, and managing bookings</div>
              </div>
            </div>
          </div>

          <hr class="section-divider" />

          <div class="preview-block">
            <p class="preview-label">Subdomain Preview</p>
            <div class="preview-url">
              <i class="bi bi-globe"></i>
              <span>{{ form.subdomain || 'yourhotel' }}.hotelOS.com</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .onboard-page { display: flex; flex-direction: column; }

    .back-btn {
      width: 36px; height: 36px;
      border-radius: var(--radius-md);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition);
      flex-shrink: 0;
    }
    .back-btn:hover { color: var(--color-text); background: var(--color-surface); }

    .page-title {
      display: flex; align-items: center; gap: 1rem;
    }

    .onboard-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
      align-items: start;
    }

    .onboard-form {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section { display: flex; flex-direction: column; gap: 1.25rem; }

    .section-label {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.85rem; font-weight: 600;
      color: var(--color-text);
      text-transform: uppercase; letter-spacing: 0.06em;
    }

    .section-icon {
      width: 30px; height: 30px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem;
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .full-width { grid-column: span 2; }

    .input-addon {
      position: relative;
    }
    .input-addon .form-input { padding-right: 8rem; }
    .addon-text {
      position: absolute; right: 0.75rem; top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem; color: var(--color-text-muted);
      pointer-events: none;
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.4rem;
      display: flex; align-items: center; gap: 0.35rem;
    }

    .alert {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem; font-weight: 500;
    }
    .alert-success { background: var(--color-green-soft); color: var(--color-green); }
    .alert-error   { background: var(--color-red-soft);   color: var(--color-red); }

    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 0.6rem;
      width: 100%;
      padding: 0.85rem;
      background: var(--color-accent);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.95rem; font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: var(--transition);
    }
    .submit-btn:hover:not(:disabled) {
      background: #2563eb;
      box-shadow: 0 4px 12px var(--color-accent-glow);
      transform: translateY(-1px);
    }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Info panel */
    .info-panel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1.25rem;
      position: sticky; top: calc(var(--topbar-height) + 1.5rem);
    }

    .info-header {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.85rem; font-weight: 600;
      color: var(--color-text);
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .info-header i { color: var(--color-yellow); }

    .step-list { display: flex; flex-direction: column; gap: 1rem; }

    .step-item {
      display: flex; align-items: flex-start; gap: 0.85rem;
    }

    .step-dot {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700; color: #fff;
      flex-shrink: 0; margin-top: 0.1rem;
    }

    .step-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.2rem; }
    .step-desc  { font-size: 0.775rem; color: var(--color-text-muted); }

    .preview-label {
      font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-muted); margin-bottom: 0.5rem;
    }

    .preview-url {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 0.6rem 0.875rem;
      font-size: 0.875rem; font-weight: 500;
      color: var(--color-accent);
      font-family: var(--font-mono);
    }

    @media (max-width: 1024px) {
      .onboard-grid { grid-template-columns: 1fr; }
      .info-panel { position: static; }
    }

    @media (max-width: 768px) {
      .onboard-form { padding: 1.25rem; }
      .field-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
    }
  `]
})
export class OnboardComponent {
  private http = inject(HttpClient);
  router       = inject(Router);

  loading = signal(false);
  message = signal('');
  success = signal(false);

  form = {
    hotelName: '', subdomain: '',
    adminName: '', adminEmail: '',
    tempPassword: '', plan: 1
  };

  submit() {
    if (!this.form.hotelName || !this.form.subdomain ||
        !this.form.adminName || !this.form.adminEmail || !this.form.tempPassword) {
      this.success.set(false);
      this.message.set('All fields are required');
      return;
    }

    this.loading.set(true);
    this.http.post<ApiResponse<string>>(`${environment.apiUrl}/superadmin/onboard`, this.form)
      .subscribe({
        next: res => {
          this.loading.set(false);
          if (res.success) {
            this.success.set(true);
            this.message.set('Hotel onboarded successfully!');
            setTimeout(() => this.router.navigate(['/superadmin']), 1500);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.success.set(false);
          this.message.set(err.error?.message || 'Failed to onboard hotel');
        }
      });
  }
}