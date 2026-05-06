import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Settings</h2>
          <p>Manage your hotel and account settings</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;align-items:start">
        
        <!-- LEFT NAV -->
        <div class="card-surface" style="padding:.5rem">
          @for (tab of tabs; track tab.id) {
            <button class="settings-nav-item"
                    [class.active]="activeTab===tab.id"
                    (click)="activeTab=tab.id">
              <i class="bi {{ tab.icon }}"></i> {{ tab.label }}
            </button>
          }
        </div>

        <!-- RIGHT CONTENT -->
        <div class="card-surface">

          <!-- HOTEL TAB -->
          @if (activeTab === 'hotel') {
            <h4 style="margin-bottom:1.25rem">Hotel Profile</h4>

            <form [formGroup]="hotelForm" (ngSubmit)="saveHotel()">

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
                <div class="form-group">
                  <label>Hotel Name</label>
                  <input type="text" class="form-input" formControlName="hotelName" />
                </div>

                <div class="form-group">
                  <label>Subdomain</label>
                  <input type="text" class="form-input" formControlName="subdomain" />
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-input" formControlName="email" />
                </div>

                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" class="form-input" formControlName="phone" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:1.25rem">
                <label>Address</label>
                <textarea class="form-input" formControlName="address" rows="3"></textarea>
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button type="submit" class="btn-primary-custom">
                  Save Changes
                </button>
              </div>

            </form>
          }

          <!-- PROFILE TAB -->
          @if (activeTab === 'profile') {
            <h4 style="margin-bottom:1.25rem">My Profile</h4>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" class="form-input" formControlName="name" />
                </div>

                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-input" formControlName="email" />
                </div>
              </div>

              <hr class="section-divider" />

              <h5 style="margin-bottom:1rem">Change Password</h5>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
                <div class="form-group">
                  <label>Current Password</label>
                  <input type="password" class="form-input" formControlName="currentPw" />
                </div>

                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" class="form-input" formControlName="newPw" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button type="submit" class="btn-primary-custom">
                  Update Profile
                </button>
              </div>

            </form>
          }

          <!-- BILLING TAB -->
          @if (activeTab === 'billing') {
            <h4 style="margin-bottom:1.25rem">Subscription</h4>

            <div class="card-surface" style="background:var(--color-surface-2);border-color:var(--color-accent)">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-weight:700;font-size:1.1rem">Pro Plan</div>
                  <div style="color:var(--color-text-muted);font-size:.875rem">
                    Unlimited rooms, bookings, and reports
                  </div>
                </div>
                <span class="badge-status available">Active</span>
              </div>

              <div class="section-divider"></div>

              <div style="font-size:1.5rem;font-weight:700;color:var(--color-accent)">
                $79<span style="font-size:.875rem;color:var(--color-text-muted)">/month</span>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-nav-item {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .65rem .75rem;
      border-radius: var(--radius-md);
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      width: 100%;
      text-align: left;
    }

    .settings-nav-item.active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  `]
})
export class SettingsComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private settingsService = inject(SettingsService);

  activeTab = 'hotel';

  tabs = [
    { id:'hotel', label:'Hotel Profile', icon:'bi-building' },
    { id:'profile', label:'My Profile', icon:'bi-person' },
    { id:'billing', label:'Billing', icon:'bi-credit-card' },
  ];

  // ✅ Add basic validation
  hotelForm = this.fb.group({
    hotelName: ['', Validators.required],
    subdomain: ['', Validators.required],
    email: [''],
    phone: [''],
    address: ['']
  });

  profileForm = this.fb.group({
    name: [this.auth.currentUser?.name || ''],
    email: [this.auth.currentUser?.email || ''],
    currentPw: [''],
    newPw: ['']
  });

  ngOnInit() {
    this.loadHotelSettings();
  }

  loadHotelSettings() {
    this.settingsService.getHotelSettings().subscribe({
      next: (res: any) => {
        if (!res?.data) return;

        this.hotelForm.patchValue(res.data);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  saveHotel() {
    if (this.hotelForm.invalid) return;

    this.settingsService.createHotelSettings(this.hotelForm.value).subscribe({
      next: () => {
        this.toast.success('Hotel settings saved!');
        this.loadHotelSettings();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to save settings');
      }
    });
  }

  saveProfile() {
    const { currentPw, newPw } = this.profileForm.value;

    // ✅ PASSWORD CHANGE FLOW
    if (currentPw || newPw) {

      if (!currentPw || !newPw) {
        this.toast.error('Please fill both password fields');
        return;
      }

      if (newPw.length < 6) {
        this.toast.error('Password must be at least 6 characters');
        return;
      }

      this.auth.changePassword({
        currentPassword: currentPw,
        newPassword: newPw
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Password updated successfully');

            this.profileForm.patchValue({
              currentPw: '',
              newPw: ''
            });
          } else {
            this.toast.error(res.message || 'Failed to update password');
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Invalid current password');
        }
      });

      return;
    }

    // ✅ NORMAL PROFILE UPDATE (future)
    this.toast.success('Profile updated!');
  }
}