import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { ReportRow, ReportFilter } from '../../shared/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div class="page-title"><h2>Reports</h2><p>Booking and revenue analytics</p></div>
        <div class="page-actions">
          <button class="btn-ghost" (click)="exportCsv()"><i class="bi bi-filetype-csv"></i> CSV</button>
          <button class="btn-ghost" (click)="exportExcel()"><i class="bi bi-file-earmark-excel"></i> Excel</button>
          <button class="btn-ghost" (click)="print()"><i class="bi bi-printer"></i> Print</button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="form-group" style="flex-direction:row;align-items:center;gap:.5rem">
          <label style="white-space:nowrap;text-transform:none;font-size:.875rem">From</label>
          <input type="date" class="form-input" style="width:auto" [(ngModel)]="filter.dateFrom" />
        </div>
        <div class="form-group" style="flex-direction:row;align-items:center;gap:.5rem">
          <label style="white-space:nowrap;text-transform:none;font-size:.875rem">To</label>
          <input type="date" class="form-input" style="width:auto" [(ngModel)]="filter.dateTo" />
        </div>
        <select class="form-input" style="width:auto" [(ngModel)]="filter.roomType">
          <option value="">All Room Types</option>
          <option value="Standard">Standard</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Suite">Suite</option>
        </select>
        <select class="form-input" style="width:auto" [(ngModel)]="filter.status">
          <option value="">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="CheckedIn">Checked In</option>
          <option value="CheckedOut">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button class="btn-primary-custom" (click)="loadReport()"><i class="bi bi-search"></i> Run Report</button>
      </div>

      <div class="report-summary" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="card-surface" style="text-align:center">
          <div style="font-size:1.6rem;font-weight:700;font-family:var(--font-mono);color:var(--color-accent)">{{ totalRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
          <div style="font-size:.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:.25rem">Total Revenue</div>
        </div>
        <div class="card-surface" style="text-align:center">
          <div style="font-size:1.6rem;font-weight:700;font-family:var(--font-mono)">{{ rows.length }}</div>
          <div style="font-size:.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:.25rem">Bookings</div>
        </div>
        <div class="card-surface" style="text-align:center">
          <div style="font-size:1.6rem;font-weight:700;font-family:var(--font-mono);color:var(--color-green)">{{ checkedOutCount }}</div>
          <div style="font-size:.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:.25rem">Completed</div>
        </div>
        <div class="card-surface" style="text-align:center">
          <div style="font-size:1.6rem;font-weight:700;font-family:var(--font-mono)">{{ avgRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
          <div style="font-size:.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:.25rem">Avg per Booking</div>
        </div>
      </div>

      @if (loading) {
        <div class="page-loading"><div class="loading-spinner"></div><span>Loading report…</span></div>
      } @else if (rows.length === 0) {
        <div class="card-surface" style="text-align:center;padding:3rem;color:var(--color-text-muted)">
          <i class="bi bi-bar-chart" style="font-size:2rem;display:block;margin-bottom:.75rem"></i>
          No data found for the selected filters.
        </div>
      } @else {
        <div class="card-surface" style="padding:0;overflow:hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Nights</th>
                <th>Total</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows; track r.bookingNumber) {
                <tr>
                  <td><span style="font-family:var(--font-mono);font-size:.8rem">{{ r.bookingNumber }}</span></td>
                  <td>{{ r.guestName }}</td>
                  <td>{{ r.roomNumber }} <span style="color:var(--color-text-muted);font-size:.75rem">{{ r.roomType }}</span></td>
                  <td>{{ r.checkInDate | date:'MMM d, y' }}</td>
                  <td>{{ r.checkOutDate | date:'MMM d, y' }}</td>
                  <td style="text-align:center">{{ r.nights }}</td>
                  <td><span style="font-family:var(--font-mono);color:var(--color-accent)">{{ r.totalAmount | currency:'INR':'symbol':'1.0-0' }}</span></td>
                  <td style="color:var(--color-text-muted)">{{ r.advanceAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                  <td>{{ r.balanceAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                  <td><span class="badge-status {{ r.status.toLowerCase() }}">{{ r.status === 'CheckedIn' ? 'Checked In' : r.status === 'CheckedOut' ? 'Checked Out' : r.status }}</span></td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr style="background:var(--color-surface-2)">
                <td colspan="6" style="font-weight:600;color:var(--color-text-muted)">Totals</td>
                <td><span style="font-family:var(--font-mono);font-weight:700;color:var(--color-accent)">{{ totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span></td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private reportSvc = inject(ReportService);
  private toast = inject(ToastService);

  rows: ReportRow[] = [];
  loading = false;
  filter: ReportFilter = {
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    pageNumber: 1,
    pageSize: 100
  };

  get totalRevenue() { return this.rows.reduce((s, r) => s + r.totalAmount, 0); }
  get checkedOutCount() { return this.rows.filter(r => r.status === 'CheckedOut').length; }
  get avgRevenue() { return this.rows.length ? Math.round(this.totalRevenue / this.rows.length) : 0; }

  ngOnInit() { this.loadReport(); }

  loadReport() {
    this.loading = true;
    this.reportSvc.getReport(this.filter).subscribe({
      next: res => {
        if (res.success) {
          this.rows = res.data.items;
        } else {
          this.toast.error('Failed to load report.');
        }
        this.loading = false;
      },
      error: err => {
        this.toast.error('Error loading report. Please try again.');
        console.error('Report load error:', err);
        this.loading = false;
      }
    });
  }

  exportCsv() {
    this.reportSvc.exportCsv(this.filter).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `hotel-report-${this.filter.dateFrom}-to-${this.filter.dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.toast.success('CSV exported!');
      },
      error: () => this.toast.error('CSV export failed.')
    });
  }

  exportExcel() {
    this.reportSvc.exportExcel(this.filter).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `hotel-report-${this.filter.dateFrom}-to-${this.filter.dateTo}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.toast.success('Excel exported!');
      },
      error: () => this.toast.error('Excel export failed.')
    });
  }

  print() { window.print(); }
} 