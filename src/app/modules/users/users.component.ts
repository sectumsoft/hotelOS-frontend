import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { UserService, CreateStaffPayload, UpdateStaffPayload } from '../../core/services/user.service';
import { StaffMember, STAFF_MODULES } from '../../shared/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Staff Management</h2>
          <p>{{ staff().length }} staff member{{ staff().length === 1 ? '' : 's' }}</p>
        </div>
        <div class="page-actions">
          <button class="btn-primary-custom" (click)="openCreate()">
            <i class="bi bi-person-plus"></i> Add Staff
          </button>
        </div>
      </div>

      <div class="card-surface" style="padding:0;overflow:hidden">
        @if (loading()) {
          <div style="padding:2rem;text-align:center;color:var(--color-text-muted)">Loading…</div>
        } @else if (staff().length === 0) {
          <div class="empty-state">
            <i class="bi bi-people"></i>
            <h4>No staff members yet</h4>
            <p>Add front-desk or housekeeping accounts and choose what they can access.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Module access</th><th>Status</th><th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of staff(); track u.id) {
                <tr>
                  <td><strong>{{ u.name }}</strong></td>
                  <td style="color:var(--color-text-muted)">{{ u.email }}</td>
                  <td>
                    @if (u.modules.length === 0) {
                      <span style="color:var(--color-text-muted);font-size:.8rem">Dashboard only</span>
                    } @else {
                      <div class="mod-chips">
                        @for (m of u.modules; track m) { <span class="mod-chip">{{ labelFor(m) }}</span> }
                      </div>
                    }
                  </td>
                  <td>
                    <span class="badge-status" [class.available]="u.isActive" [class.maintenance]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </td>
                  <td style="text-align:right">
                    <div style="display:inline-flex;gap:.4rem">
                      <button class="btn-ghost" style="padding:.3rem .7rem;font-size:.8rem" (click)="openEdit(u)">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                      <button class="btn-danger-ghost" style="padding:.3rem .7rem;font-size:.8rem" (click)="confirmDelete(u)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    @if (modal() !== null) {
      <div class="modal-overlay" (click)="modal.set(null)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ modal() === 'create' ? 'Add Staff Member' : 'Edit Staff Member' }}</h3>
            <button class="modal-close" (click)="modal.set(null)"><i class="bi bi-x"></i></button>
          </div>

          <div class="modal-body">
            <div class="form-group" style="margin-bottom:1rem">
              <label>Full Name</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="e.g. Priya Menon" />
            </div>

            <div class="form-group" style="margin-bottom:1rem">
              <label>Email</label>
              <input class="form-input" type="email" [(ngModel)]="form.email"
                     [readonly]="modal() === 'edit'"
                     [style.opacity]="modal() === 'edit' ? .6 : 1"
                     placeholder="name@hotel.com" />
              @if (modal() === 'edit') {
                <span style="font-size:.72rem;color:var(--color-text-muted)">Email can't be changed</span>
              }
            </div>

            <div class="form-group" style="margin-bottom:1.25rem">
              <label>{{ modal() === 'create' ? 'Temporary Password' : 'Reset Password (optional)' }}</label>
              <div style="display:flex;gap:.5rem">
                <input class="form-input" [(ngModel)]="form.password"
                       [placeholder]="modal() === 'create' ? 'min 6 characters' : 'leave blank to keep current'" />
                <button type="button" class="btn-ghost" (click)="genPassword()">Generate</button>
              </div>
            </div>

            <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.5rem">Module access</label>
            <p style="font-size:.75rem;color:var(--color-text-muted);margin-bottom:.6rem">
              Everyone can see the Dashboard. Tick the extra areas this person may use.
            </p>
            <div class="mod-grid">
              @for (m of allModules; track m.key) {
                <label class="mod-toggle" [class.on]="form.modules.includes(m.key)">
                  <input type="checkbox" [checked]="form.modules.includes(m.key)" (change)="toggleModule(m.key)" />
                  <i class="bi {{ m.icon }}"></i> {{ m.label }}
                </label>
              }
            </div>

            @if (modal() === 'edit') {
              <label class="mod-toggle" style="margin-top:1rem;max-width:200px" [class.on]="form.isActive">
                <input type="checkbox" [checked]="form.isActive" (change)="form.isActive = !form.isActive" />
                <i class="bi bi-toggle-on"></i> Account active
              </label>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" (click)="modal.set(null)">Cancel</button>
            <button class="btn-primary-custom" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (modal() === 'create' ? 'Create Staff' : 'Save Changes') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- DELETE CONFIRM -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Remove Staff</h3>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <p>Remove <strong>{{ deleteTarget()!.name }}</strong>? They will no longer be able to sign in.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger-ghost" style="border-color:var(--color-red);color:var(--color-red)" (click)="doDelete()">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-state { padding: 3rem 1rem; text-align: center; color: var(--color-text-muted); }
    .empty-state i { font-size: 2rem; opacity: .5; }
    .empty-state h4 { margin: .75rem 0 .25rem; }
    .empty-state p { font-size: .85rem; }

    .mod-chips { display: flex; flex-wrap: wrap; gap: .3rem; }
    .mod-chip {
      font-size: .72rem; font-weight: 600; padding: .12rem .5rem; border-radius: 100px;
      background: var(--color-accent-soft); color: var(--color-accent);
    }

    .mod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .mod-toggle {
      display: flex; align-items: center; gap: .5rem; cursor: pointer;
      padding: .55rem .7rem; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font-size: .85rem; font-weight: 500;
      transition: var(--transition);
    }
    .mod-toggle input { accent-color: var(--color-accent); }
    .mod-toggle.on { border-color: var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent); }

    @media (max-width: 640px) { .mod-grid { grid-template-columns: 1fr; } }
  `]
})
export class UsersComponent implements OnInit {
  private userSvc = inject(UserService);
  private toast = inject(ToastService);

  allModules = STAFF_MODULES;
  staff = signal<StaffMember[]>([]);
  loading = signal(true);
  saving = signal(false);

  modal = signal<'create' | 'edit' | null>(null);
  editId = signal<string | null>(null);
  deleteTarget = signal<StaffMember | null>(null);

  form = { name: '', email: '', password: '', modules: [] as string[], isActive: true };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.userSvc.list().subscribe({
      next: res => { if (res.success) this.staff.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  labelFor(key: string) { return this.allModules.find(m => m.key === key)?.label ?? key; }

  openCreate() {
    this.form = { name: '', email: '', password: '', modules: ['rooms', 'bookings'], isActive: true };
    this.editId.set(null);
    this.modal.set('create');
  }

  openEdit(u: StaffMember) {
    this.form = { name: u.name, email: u.email, password: '', modules: [...u.modules], isActive: u.isActive };
    this.editId.set(u.id);
    this.modal.set('edit');
  }

  toggleModule(key: string) {
    this.form.modules = this.form.modules.includes(key)
      ? this.form.modules.filter(m => m !== key)
      : [...this.form.modules, key];
  }

  genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    this.form.password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  save() {
    const name = this.form.name.trim();
    const email = this.form.email.trim();
    if (!name) { this.toast.error('Name is required'); return; }

    if (this.modal() === 'create') {
      if (!email) { this.toast.error('Email is required'); return; }
      if (!this.form.password || this.form.password.length < 6) {
        this.toast.error('Temporary password must be at least 6 characters'); return;
      }
      const payload: CreateStaffPayload = { name, email, tempPassword: this.form.password, modules: this.form.modules };
      this.saving.set(true);
      this.userSvc.create(payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) { this.toast.success('Staff created'); this.modal.set(null); this.load(); }
          else this.toast.error(res.message || 'Failed to create staff');
        },
        error: err => { this.saving.set(false); this.toast.error(err?.error?.message || 'Failed to create staff'); }
      });
    } else {
      const id = this.editId();
      if (!id) return;
      if (this.form.password && this.form.password.length < 6) {
        this.toast.error('New password must be at least 6 characters'); return;
      }
      const payload: UpdateStaffPayload = {
        name,
        modules: this.form.modules,
        isActive: this.form.isActive,
        newPassword: this.form.password || undefined
      };
      this.saving.set(true);
      this.userSvc.update(id, payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) { this.toast.success('Staff updated'); this.modal.set(null); this.load(); }
          else this.toast.error(res.message || 'Failed to update staff');
        },
        error: err => { this.saving.set(false); this.toast.error(err?.error?.message || 'Failed to update staff'); }
      });
    }
  }

  confirmDelete(u: StaffMember) { this.deleteTarget.set(u); }

  doDelete() {
    const u = this.deleteTarget();
    if (!u) return;
    this.userSvc.remove(u.id).subscribe({
      next: () => { this.toast.success('Staff removed'); this.deleteTarget.set(null); this.load(); },
      error: () => { this.toast.error('Failed to remove staff'); }
    });
  }
}
