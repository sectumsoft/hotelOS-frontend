import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';
import { RoomTypeService } from '../../core/services/room-type.service';
import { RoomTypeOption } from '../../shared/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Settings</h2>
          <p>Manage your hotel and account settings</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:1.5rem;align-items:start" class="settings-grid">

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
            <h4 style="margin-bottom:.35rem">Hotel Profile</h4>
            <p style="color:var(--color-text-muted);font-size:.8rem;margin-bottom:1.25rem">
              These details were set up when your hotel was onboarded. Update them any time.
            </p>

            <form [formGroup]="hotelForm" (ngSubmit)="saveHotel()">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" class="two-col">
                <div class="form-group">
                  <label>Hotel Name</label>
                  <input type="text" class="form-input" formControlName="hotelName" />
                  @if (hotelForm.get('hotelName')?.invalid && hotelForm.get('hotelName')?.touched) {
                    <span style="font-size:.75rem;color:var(--color-red)">Hotel name is required</span>
                  }
                </div>
                <div class="form-group">
                  <label>Subdomain</label>
                  <input type="text" class="form-input" formControlName="subdomain" readonly
                         style="opacity:.6;cursor:not-allowed" />
                  <span style="font-size:.72rem;color:var(--color-text-muted)">Managed by the platform admin</span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" class="two-col">
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
                <button type="submit" class="btn-primary-custom" [disabled]="savingHotel()">
                  {{ savingHotel() ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          }

          <!-- ROOM TYPES TAB -->
          @if (activeTab === 'roomTypes') {
            <h4 style="margin-bottom:.35rem">Room Types</h4>
            <p style="color:var(--color-text-muted);font-size:.8rem;margin-bottom:1rem">
              Define the room categories your hotel offers. These appear when you add or import rooms.
            </p>

            <div style="display:flex;gap:.5rem;margin-bottom:1.25rem;max-width:420px">
              <input type="text" class="form-input" placeholder="e.g. Executive Suite"
                     [(ngModel)]="newType" (keyup.enter)="addType()" />
              <button class="btn-primary-custom" (click)="addType()" [disabled]="!newType.trim()">
                <i class="bi bi-plus-lg"></i> Add
              </button>
            </div>

            @if (loadingTypes()) {
              <p style="color:var(--color-text-muted);font-size:.85rem">Loading…</p>
            } @else {
              <div class="rt-list">
                @for (t of roomTypes(); track t.id) {
                  <div class="rt-row">
                    @if (editingId() === t.id) {
                      <input type="text" class="form-input" style="max-width:260px" [(ngModel)]="editName"
                             (keyup.enter)="saveEdit(t)" />
                      <div class="rt-actions">
                        <button class="btn-ghost" (click)="saveEdit(t)"><i class="bi bi-check-lg"></i></button>
                        <button class="btn-ghost" (click)="editingId.set(null)"><i class="bi bi-x-lg"></i></button>
                      </div>
                    } @else {
                      <div class="rt-name">
                        {{ t.name }}
                        <span class="rt-count">{{ t.roomCount }} room{{ t.roomCount === 1 ? '' : 's' }}</span>
                      </div>
                      <div class="rt-actions">
                        <button class="btn-ghost" (click)="startEdit(t)"><i class="bi bi-pencil"></i></button>
                        <button class="btn-danger-ghost" (click)="removeType(t)"
                                [disabled]="t.roomCount > 0"
                                [title]="t.roomCount > 0 ? 'In use by ' + t.roomCount + ' room(s)' : 'Delete'">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    }
                  </div>
                }
                @if (roomTypes().length === 0) {
                  <p style="color:var(--color-text-muted);font-size:.85rem">No room types yet — add one above.</p>
                }
              </div>
            }
          }

          <!-- PROFILE TAB -->
          @if (activeTab === 'profile') {
            <h4 style="margin-bottom:1.25rem">My Profile</h4>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" class="two-col">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" class="form-input" formControlName="name" readonly style="opacity:.6" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-input" formControlName="email" readonly style="opacity:.6" />
                </div>
              </div>

              <hr class="section-divider" />
              <h5 style="margin-bottom:1rem">Change Password</h5>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem" class="two-col">
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
                <button type="submit" class="btn-primary-custom">Update Password</button>
              </div>
            </form>
          }

          <!-- BILLING TAB -->
          @if (activeTab === 'billing') {
            <h4 style="margin-bottom:1.25rem">Subscription</h4>
            <div class="card-surface" style="background:var(--color-surface-2);border-color:var(--color-accent)">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-weight:700;font-size:1.1rem">{{ tenantPlan }} Plan</div>
                  <div style="color:var(--color-text-muted);font-size:.875rem">
                    Unlimited rooms, bookings, and reports
                  </div>
                </div>
                <span class="badge-status available">Active</span>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-nav-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .65rem .75rem; border-radius: var(--radius-md);
      background: none; border: none; color: var(--color-text-muted);
      cursor: pointer; width: 100%; text-align: left;
    }
    .settings-nav-item.active { background: var(--color-accent-soft); color: var(--color-accent); }

    .rt-list { display: flex; flex-direction: column; }
    .rt-row {
      display: flex; align-items: center; justify-content: space-between; gap: .75rem;
      padding: .65rem .25rem; border-bottom: 1px solid var(--color-border);
    }
    .rt-name { font-weight: 600; font-size: .9rem; display: flex; align-items: center; gap: .6rem; }
    .rt-count { font-weight: 500; font-size: .72rem; color: var(--color-text-muted); }
    .rt-actions { display: flex; gap: .25rem; }
    .rt-actions .btn-ghost, .rt-actions .btn-danger-ghost { padding: .3rem .55rem; font-size: .8rem; }

    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr !important; }
      .two-col { grid-template-columns: 1fr !important; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private settingsService = inject(SettingsService);
  private roomTypeService = inject(RoomTypeService);

  activeTab = 'hotel';
  tabs = [
    { id: 'hotel', label: 'Hotel Profile', icon: 'bi-building' },
    { id: 'roomTypes', label: 'Room Types', icon: 'bi-door-open' },
    { id: 'profile', label: 'My Profile', icon: 'bi-person' },
    { id: 'billing', label: 'Billing', icon: 'bi-credit-card' },
  ];

  get tenantPlan() { return this.auth.currentTenant?.plan || 'Pro'; }

  hotelForm = this.fb.group({
    hotelName: ['', Validators.required],
    subdomain: [{ value: '', disabled: false }],
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

  savingHotel = signal(false);

  // room types
  roomTypes = signal<RoomTypeOption[]>([]);
  loadingTypes = signal(false);
  newType = '';
  editingId = signal<string | null>(null);
  editName = '';

  ngOnInit() {
    this.loadHotelSettings();
    this.loadRoomTypes();
  }

  // ── Hotel profile ──────────────────────────────────────────────
  loadHotelSettings() {
    this.settingsService.getHotelSettings().subscribe({
      next: (res: any) => {
        if (res?.data) this.hotelForm.patchValue(res.data);
      },
      error: () => {}
    });
  }

  saveHotel() {
    if (this.hotelForm.invalid) {
      this.hotelForm.markAllAsTouched();
      this.toast.error('Hotel name is required');
      return;
    }
    this.savingHotel.set(true);
    const v = this.hotelForm.getRawValue();
    this.settingsService.createHotelSettings(v).subscribe({
      next: () => {
        this.savingHotel.set(false);
        this.toast.success('Hotel settings saved');
        this.auth.refreshTenantName(v.hotelName || '');
        this.loadHotelSettings();
      },
      error: (err) => {
        this.savingHotel.set(false);
        this.toast.error(err?.error?.message || 'Failed to save settings');
      }
    });
  }

  // ── Room types ─────────────────────────────────────────────────
  loadRoomTypes() {
    this.loadingTypes.set(true);
    this.roomTypeService.list().subscribe({
      next: res => {
        if (res.success) this.roomTypes.set(res.data);
        this.loadingTypes.set(false);
      },
      error: () => this.loadingTypes.set(false)
    });
  }

  addType() {
    const name = this.newType.trim();
    if (!name) return;
    this.roomTypeService.create(name).subscribe({
      next: () => { this.newType = ''; this.toast.success('Room type added'); this.loadRoomTypes(); },
      error: err => this.toast.error(err?.error?.message || 'Could not add room type')
    });
  }

  startEdit(t: RoomTypeOption) { this.editingId.set(t.id); this.editName = t.name; }

  saveEdit(t: RoomTypeOption) {
    const name = this.editName.trim();
    if (!name || name === t.name) { this.editingId.set(null); return; }
    this.roomTypeService.update(t.id, name).subscribe({
      next: () => { this.editingId.set(null); this.toast.success('Room type updated'); this.loadRoomTypes(); },
      error: err => this.toast.error(err?.error?.message || 'Could not update room type')
    });
  }

  removeType(t: RoomTypeOption) {
    if (t.roomCount > 0) return;
    this.roomTypeService.remove(t.id).subscribe({
      next: () => { this.toast.success('Room type deleted'); this.loadRoomTypes(); },
      error: err => this.toast.error(err?.error?.message || 'Could not delete room type')
    });
  }

  // ── Password ───────────────────────────────────────────────────
  saveProfile() {
    const { currentPw, newPw } = this.profileForm.value;
    if (!currentPw || !newPw) {
      this.toast.error('Please fill both password fields');
      return;
    }
    if (newPw.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }
    this.auth.changePassword({ currentPassword: currentPw, newPassword: newPw }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Password updated successfully');
          this.profileForm.patchValue({ currentPw: '', newPw: '' });
        } else {
          this.toast.error(res.message || 'Failed to update password');
        }
      },
      error: (err) => this.toast.error(err?.error?.message || 'Invalid current password')
    });
  }
}
