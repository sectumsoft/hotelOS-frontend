import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardStats } from '../../shared/models';

declare const ApexCharts: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">

      <div class="page-header">
        <div class="page-title">
          <h2>Dashboard</h2>
          <p>Welcome back — here's what's happening at your hotel today.</p>
        </div>
        <div class="page-actions">
          <div class="date-pill">
            <i class="bi bi-calendar3"></i>
            <span>{{ today }}</span>
          </div>
        </div>
      </div>

      <!-- Metric cards -->
      @if (loading) {
        <div class="stats-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="metric-card skeleton" style="height:130px"></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          <div class="metric-card" style="--accent-color: var(--color-accent)">
            <div class="metric-icon" style="background:var(--color-accent-soft);color:var(--color-accent)">
              <i class="bi bi-door-open"></i>
            </div>
            <div class="metric-value">{{ stats?.totalRooms || 0 }}</div>
            <div class="metric-label">Total Rooms</div>
            <div class="metric-trend up">
              <i class="bi bi-arrow-up-short"></i> All managed
            </div>
          </div>

          <div class="metric-card" style="--accent-color: var(--color-red)">
            <div class="metric-icon" style="background:var(--color-red-soft);color:var(--color-red)">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="metric-value">{{ stats?.occupiedRooms || 0 }}</div>
            <div class="metric-label">Occupied Rooms</div>
            <div class="metric-trend" [class.up]="occupancyRate > 70" [class.down]="occupancyRate <= 70">
              <i class="bi" [class.bi-arrow-up-short]="occupancyRate > 70" [class.bi-arrow-down-short]="occupancyRate <= 70"></i>
              {{ occupancyRate }}% occupancy
            </div>
          </div>

          <div class="metric-card" style="--accent-color: var(--color-blue)">
            <div class="metric-icon" style="background:var(--color-blue-soft);color:var(--color-blue)">
              <i class="bi bi-calendar-check"></i>
            </div>
            <div class="metric-value">{{ stats?.todayBookings || 0 }}</div>
            <div class="metric-label">Today's Bookings</div>
            @if (stats?.bookingChange! > 0) {
              <div class="metric-trend up">
                <i class="bi bi-arrow-up-short"></i> +{{ stats?.bookingChange }}% vs yesterday
              </div>
            }
          </div>

          <div class="metric-card" style="--accent-color: var(--color-green)">
            <div class="metric-icon" style="background:var(--color-green-soft);color:var(--color-green)">
              <i class="bi bi-currency-dollar"></i>
            </div>
            <div class="metric-value">{{ stats?.revenueToday | currency:'INR':'symbol':'1.0-0' }}</div>
            <div class="metric-label">Revenue Today</div>
            @if (stats?.revenueChange! > 0) {
              <div class="metric-trend up">
                <i class="bi bi-arrow-up-short"></i> +{{ stats?.revenueChange }}% vs yesterday
              </div>
            }
          </div>
        </div>
      }

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-card chart-full">
          <div class="chart-header">
            <h4>Revenue Overview</h4>
            <span>Last 30 days</span>
          </div>
          <div id="revenueChart"></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h4>Occupancy Rate</h4>
            <span>Daily %</span>
          </div>
          <div id="occupancyChart"></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h4>Booking Sources</h4>
            <span>This month</span>
          </div>
          <div id="sourcesChart"></div>
        </div>
      </div>
<!-- ROOM AVAILABILITY -->
<div class="chart-card chart-full" style="margin-top:1.5rem">

  <div class="chart-header" style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <h4>Room Availability</h4>
      <span>Check rooms for selected date</span>
    </div>

    <input type="date"
           [value]="selectedDate"
           (change)="onDateChange($event)"
           style="padding:0.4rem 0.6rem;border-radius:6px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)" />
  </div>

  @if (loadingRooms) {
    <div style="padding:1rem;color:var(--color-text-muted)">Loading availability...</div>
  }

  @if (!loadingRooms) {
    <div style="overflow:auto;margin-top:0.75rem">
      <table style="width:100%;border-collapse:collapse">

        <tr style="border-bottom:1px solid var(--color-border);text-align:left">
          <th style="padding:0.75rem">Room</th>
          <th style="padding:0.75rem">Status</th>
          <th style="padding:0.75rem">Guest</th>
        </tr>

        @for (room of rooms; track room.roomId) {
          <tr style="border-bottom:1px solid var(--color-border)">

            <td style="padding:0.75rem;font-weight:500">
              {{ room.roomNumber }}
            </td>

            <td style="padding:0.75rem">
              <span
                [style.color]="room.isAvailable ? 'var(--color-green)' : 'var(--color-red)'"
                style="font-weight:600">
                {{ room.isAvailable ? 'Available' : 'Booked' }}
              </span>
            </td>

            <td style="padding:0.75rem;color:var(--color-text-muted)">
              {{ room.guestName || '-' }}
            </td>

          </tr>
        }

      </table>
    </div>
  }

</div>
    </div>
  `,
  styles: [`
    .dashboard-page { display: flex; flex-direction: column; gap: 0; }

    /* Date pill */
    .date-pill {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.875rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 100px;
      font-size: 0.8rem; color: var(--color-text-muted);
      white-space: nowrap;
    }

    /* Charts grid */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-top: 1.5rem;
    }

    /* Revenue chart spans full width */
    .chart-full {
      grid-column: span 2;
    }

    /* ===== TABLET (768px - 1024px) ===== */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* ===== MOBILE (< 768px) ===== */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .date-pill {
        font-size: 0.75rem;
        padding: 0.35rem 0.75rem;
      }

      .date-pill span {
        /* Shorten the date on very small screens */
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.75rem !important;
      }

      .charts-grid {
        grid-template-columns: 1fr !important;
        gap: 0.75rem;
      }

      .chart-full {
        grid-column: span 1 !important;
      }
    }

    /* ===== SMALL MOBILE (< 480px) ===== */
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr !important;
      }

      .metric-card .metric-value {
        font-size: 1.5rem !important;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardSvc = inject(DashboardService);
  private themeSvc = inject(ThemeService);
selectedDate: string = new Date().toISOString().split('T')[0];
rooms: any[] = [];
loadingRooms = false;

  stats: DashboardStats | null = null;
  loading = true;
  today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  get occupancyRate(): number {
    if (!this.stats) return 0;
    return Math.round((this.stats.occupiedRooms / this.stats.totalRooms) * 100);
  }

  private getTheme() { return this.themeSvc.getTheme(); }

  private getChartColors() {
    const isLight = this.getTheme() === 'light';
    return {
      gridColor:      isLight ? 'rgba(0,0,0,0.08)'    : 'rgba(255,255,255,0.05)',
      textColor:      isLight ? '#374151'              : '#6b7280',
      strokeColor:    isLight ? '#e5e7eb'              : '#111317',
      revenueColor:   isLight ? '#059669'              : '#c8a97e',
      occupancyColor: isLight ? '#2563eb'              : '#60a5fa',
      sourceColors:   isLight ? ['#059669','#2563eb','#dc2626'] : ['#c8a97e','#60a5fa','#34d399']
    };
  }

  private getChartHeight(): number {
    return window.innerWidth <= 480 ? 180 : 220;
  }

  ngOnInit() {
    this.loadStats();
    this.loadCharts();
      this.loadAvailability(); 

  }

  loadStats() {
    this.dashboardSvc.getStats().subscribe({
      next: res => { if (res.success) this.stats = res.data; this.loading = false; },
      error: () => { this.stats = this.getMockStats(); this.loading = false; }
    });
  }

  loadCharts() {
    setTimeout(() => {
      this.renderRevenueChart();
      this.renderOccupancyChart();
      this.renderSourcesChart();
    }, 500);
  }

  getMockStats(): DashboardStats {
    return {
      totalRooms: 48, occupiedRooms: 32, availableRooms: 12,
      todayBookings: 7, revenueToday: 4850, occupancyRate: 66,
      revenueChange: 12, bookingChange: 8
    };
  }

  renderRevenueChart() {
    const el = document.getElementById('revenueChart');
    if (!el || typeof (window as any).ApexCharts === 'undefined') return;
    const colors = this.getChartColors();
    const isMobile = window.innerWidth <= 768;
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000) + 2000);
    new (window as any).ApexCharts(el, {
      chart: {
        type: 'area', height: this.getChartHeight(),
        toolbar: { show: false }, background: 'transparent',
        animations: { enabled: true, speed: 600 }
      },
      series: [{ name: 'Revenue', data }],
      xaxis: {
        categories: dates,
        labels: { style: { colors: colors.textColor, fontSize: '11px' }, rotate: 0 },
        tickAmount: isMobile ? 4 : 6
      },
      yaxis: {
        labels: {
          style: { colors: colors.textColor, fontSize: '11px' },
          formatter: (v: number) => '$' + v.toLocaleString()
        }
      },
      colors: [colors.revenueColor],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.01 } },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: colors.gridColor, strokeDashArray: 3 },
      tooltip: { theme: this.getTheme() },
      dataLabels: { enabled: false }
    }).render();
  }
loadAvailability() {
  this.loadingRooms = true;

  this.dashboardSvc.getRoomAvailability(this.selectedDate)
    .subscribe({
      next: (res: any) => {
        this.rooms = res?.data || [];
        this.loadingRooms = false;
      },
      error: () => {
        this.loadingRooms = false;
      }
    });
}

onDateChange(event: any) {
  this.selectedDate = event.target.value;
  this.loadAvailability();
}
  renderOccupancyChart() {
    const el = document.getElementById('occupancyChart');
    if (!el || typeof (window as any).ApexCharts === 'undefined') return;
    const colors = this.getChartColors();
    const isMobile = window.innerWidth <= 768;
    const days = isMobile ? 7 : 14;
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1) + i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = Array.from({ length: days }, () => Math.floor(Math.random() * 40) + 50);
    new (window as any).ApexCharts(el, {
      chart: {
        type: 'bar', height: this.getChartHeight(),
        toolbar: { show: false }, background: 'transparent'
      },
      series: [{ name: 'Occupancy %', data }],
      xaxis: { categories: dates, labels: { style: { colors: colors.textColor, fontSize: '11px' } } },
      yaxis: {
        max: 100,
        labels: { style: { colors: colors.textColor, fontSize: '11px' }, formatter: (v: number) => v + '%' }
      },
      colors: [colors.occupancyColor],
      grid: { borderColor: colors.gridColor },
      tooltip: { theme: this.getTheme() },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      dataLabels: { enabled: false }
    }).render();
  }

  renderSourcesChart() {
    const el = document.getElementById('sourcesChart');
    if (!el || typeof (window as any).ApexCharts === 'undefined') return;
    const colors = this.getChartColors();
    new (window as any).ApexCharts(el, {
      chart: { type: 'donut', height: this.getChartHeight(), background: 'transparent' },
      series: [45, 30, 25],
      labels: ['Direct', 'Online (OTA)', 'Travel Agent'],
      colors: colors.sourceColors,
      legend: { position: 'bottom', labels: { colors: colors.textColor }, fontSize: '12px' },
      tooltip: { theme: this.getTheme() },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: { show: true, label: 'Total', color: colors.textColor, formatter: () => '100%' }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { colors: [colors.strokeColor] }
    }).render();
  }
}