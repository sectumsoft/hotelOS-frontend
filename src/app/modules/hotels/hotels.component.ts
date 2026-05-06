import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';

interface Hotel {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hotels-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <div class="title-icon">
            <i class="bi bi-building"></i>
          </div>
          <div>
            <h2>All Hotels</h2>
            <p>Manage and monitor all onboarded tenants</p>
          </div>
        </div>
        <button class="primary-btn" (click)="router.navigate(['/superadmin/onboard'])">
          <i class="bi bi-plus-circle"></i>
          <span>Onboard New Hotel</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--color-accent-soft);color:var(--color-accent)">
            <i class="bi bi-building"></i>
          </div>
          <div>
            <div class="stat-value">{{ hotels().length }}</div>
            <div class="stat-label">Total Hotels</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--color-green-soft);color:var(--color-green)">
            <i class="bi bi-check-circle"></i>
          </div>
          <div>
            <div class="stat-value">{{ activeCount() }}</div>
            <div class="stat-label">Active</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--color-red-soft);color:var(--color-red)">
            <i class="bi bi-x-circle"></i>
          </div>
          <div>
            <div class="stat-value">{{ inactiveCount() }}</div>
            <div class="stat-label">Inactive</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--color-purple-soft);color:var(--color-purple)">
            <i class="bi bi-people"></i>
          </div>
          <div>
            <div class="stat-value">{{ totalUsers() }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
      </div>

      <!-- Hotels Grid -->
      @if (loading()) {
        <div class="loading-state">
          <span class="loading-spinner"></span>
          <span>Loading hotels...</span>
        </div>
      } @else {
        <div class="hotels-grid">
          @for (hotel of hotels(); track hotel.id) {
            <div class="hotel-card">

              <!-- Card Header -->
              <div class="card-header">
                <div class="hotel-avatar">
                  {{ hotel.name.charAt(0) }}
                </div>
                <div class="hotel-meta">
                  <div class="hotel-name">{{ hotel.name }}</div>
                  <div class="hotel-subdomain">
                    <i class="bi bi-globe"></i>
                    <span>{{ hotel.subdomain }}.hotelOS.com</span>
                  </div>
                </div>
                <div class="status-badge" [class.active]="hotel.isActive" [class.inactive]="!hotel.isActive">
                  <span class="status-dot"></span>
                  {{ hotel.isActive ? 'Active' : 'Inactive' }}
                </div>
              </div>

              <hr class="card-divider" />

              <!-- Card Stats -->
              <div class="card-stats">
                <div class="card-stat">
                  <div class="card-stat-icon" style="color:var(--color-accent)">
                    <i class="bi bi-people"></i>
                  </div>
                  <div>
                    <div class="card-stat-value">{{ hotel.userCount }}</div>
                    <div class="card-stat-label">Users</div>
                  </div>
                </div>
                <div class="card-stat">
                  <div class="card-stat-icon" style="color:var(--color-text-muted)">
                    <i class="bi bi-calendar3"></i>
                  </div>
                  <div>
                    <div class="card-stat-value">{{ formatDate(hotel.createdAt) }}</div>
                    <div class="card-stat-label">Onboarded</div>
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                <button class="action-btn secondary" (click)="viewHotel(hotel)">
                  <i class="bi bi-eye"></i>
                  <span>View</span>
                </button>
                <button class="action-btn" [class.danger]="hotel.isActive" [class.success]="!hotel.isActive"
                  (click)="toggleStatus(hotel)">
                  <i class="bi" [class.bi-pause-circle]="hotel.isActive" [class.bi-play-circle]="!hotel.isActive"></i>
                  <span>{{ hotel.isActive ? 'Deactivate' : 'Activate' }}</span>
                </button>
              </div>

            </div>
          }

          @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-building-x"></i>
              </div>
              <div class="empty-title">No hotels yet</div>
              <div class="empty-desc">Get started by onboarding your first hotel tenant</div>
              <button class="primary-btn" (click)="router.navigate(['/superadmin/onboard'])">
                <i class="bi bi-plus-circle"></i>
                <span>Onboard First Hotel</span>
              </button>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .hotels-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .page-title h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    .page-title p {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin: 0.15rem 0 0;
    }

    .title-icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-md);
      background: var(--color-accent-soft);
      color: var(--color-accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .primary-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 1.1rem;
      background: var(--color-accent);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.875rem; font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }
    .primary-btn:hover {
      background: #2563eb;
      box-shadow: 0 4px 12px var(--color-accent-glow);
      transform: translateY(-1px);
    }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--color-text-muted);
      margin-top: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    /* ── Hotels Grid ── */
    .hotels-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    /* ── Hotel Card ── */
    .hotel-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: var(--transition);
    }
    .hotel-card:hover {
      border-color: var(--color-accent);
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .hotel-avatar {
      width: 42px; height: 42px;
      border-radius: var(--radius-md);
      background: var(--color-accent-soft);
      color: var(--color-accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .hotel-meta {
      flex: 1;
      min-width: 0;
    }

    .hotel-name {
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hotel-subdomain {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
      margin-top: 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .status-badge.active   { background: var(--color-green-soft); color: var(--color-green); }
    .status-badge.inactive { background: var(--color-red-soft);   color: var(--color-red); }

    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .card-divider {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 0;
    }

    /* ── Card Stats ── */
    .card-stats {
      display: flex;
      gap: 1.5rem;
    }

    .card-stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-stat-icon {
      font-size: 0.95rem;
    }

    .card-stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .card-stat-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }

    /* ── Card Footer ── */
    .card-footer {
      display: flex;
      gap: 0.6rem;
    }

    .action-btn {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      font-size: 0.78rem;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid var(--color-border);
    }
    .action-btn.secondary {
      background: var(--color-surface-2);
      color: var(--color-text-muted);
    }
    .action-btn.secondary:hover {
      color: var(--color-text);
      border-color: var(--color-text-muted);
    }
    .action-btn.danger {
      background: var(--color-red-soft);
      color: var(--color-red);
      border-color: transparent;
    }
    .action-btn.danger:hover { filter: brightness(0.95); }
    .action-btn.success {
      background: var(--color-green-soft);
      color: var(--color-green);
      border-color: transparent;
    }
    .action-btn.success:hover { filter: brightness(0.95); }

    /* ── Loading State ── */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 4rem;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    /* ── Empty State ── */
    .empty-state {
      grid-column: span 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 4rem 2rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .empty-icon {
      width: 56px; height: 56px;
      border-radius: var(--radius-lg);
      background: var(--color-surface-2);
      color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .empty-desc {
      font-size: 0.825rem;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    /* ── Responsive ── */
    @media (max-width: 1280px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .hotels-grid { grid-template-columns: repeat(2, 1fr); }
      .empty-state { grid-column: span 2; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .hotels-grid { grid-template-columns: 1fr; }
      .empty-state { grid-column: span 1; }
    }

    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class HotelsComponent implements OnInit {
  private http = inject(HttpClient);
  router       = inject(Router);

  hotels  = signal<Hotel[]>([]);
  loading = signal(true);

  activeCount   = () => this.hotels().filter(h => h.isActive).length;
  inactiveCount = () => this.hotels().filter(h => !h.isActive).length;
  totalUsers    = () => this.hotels().reduce((sum, h) => sum + h.userCount, 0);

  ngOnInit() {
    this.http.get<ApiResponse<Hotel[]>>(`${environment.apiUrl}/superadmin/hotels`)
      .subscribe({
        next: res => {
          if (res.success) this.hotels.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  viewHotel(hotel: Hotel) {
    this.router.navigate(['/superadmin/hotels', hotel.id]);
  }

  toggleStatus(hotel: Hotel) {
    // Toggle active/inactive — wire to your API endpoint
    const updated = { ...hotel, isActive: !hotel.isActive };
    this.hotels.update(list => list.map(h => h.id === hotel.id ? updated : h));
  }
}