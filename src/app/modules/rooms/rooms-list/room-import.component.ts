import { Component, EventEmitter, Output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { RoomService } from '../../../core/services/room.service';
import { RoomTypeService } from '../../../core/services/room-type.service';
import { ToastService } from '../../../core/services/toast.service';
import { BulkImportResult } from '../../../shared/models';

interface PreviewRow {
  row: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number | null;
  status: string;
  description: string;
  amenities: string[];
  errors: string[];
}

const STATUSES = ['Available', 'Occupied', 'Maintenance'];

@Component({
  selector: 'app-room-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-panel import-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="bi bi-file-earmark-spreadsheet"></i> Import rooms from Excel</h3>
          <button class="modal-close" (click)="close.emit()"><i class="bi bi-x"></i></button>
        </div>

        <div class="modal-body">
          @if (!result()) {
            <!-- STEP 1 / 2 -->
            <div class="import-intro">
              <p>
                Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with one room per row.
                Columns: <code>RoomNumber</code>, <code>RoomType</code> (Standard/Deluxe/Suite),
                <code>PricePerNight</code>, <code>Status</code> (default Available),
                <code>Description</code>, <code>Amenities</code> (comma-separated). Photos are added later per room.
              </p>
              <div class="import-actions">
                <button class="btn-ghost" (click)="downloadTemplate()">
                  <i class="bi bi-download"></i> Download template
                </button>
                <label class="btn-primary-custom file-label">
                  <i class="bi bi-upload"></i> Choose file
                  <input type="file" accept=".xlsx,.xls,.csv" hidden (change)="onFile($event)" />
                </label>
                @if (fileName()) { <span class="file-name">{{ fileName() }}</span> }
              </div>
            </div>

            @if (rows().length > 0) {
              <div class="preview-summary">
                <span class="badge-status available">{{ validCount() }} valid</span>
                @if (errorCount() > 0) {
                  <span class="badge-status maintenance">{{ errorCount() }} with errors</span>
                }
              </div>

              <div class="preview-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Room</th><th>Type</th><th>Price</th><th>Status</th><th>Amenities</th><th>Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of rows(); track r.row) {
                      <tr [class.row-error]="r.errors.length > 0">
                        <td>{{ r.row }}</td>
                        <td><strong>{{ r.roomNumber || '—' }}</strong></td>
                        <td>{{ r.roomType || '—' }}</td>
                        <td>{{ r.pricePerNight ?? '—' }}</td>
                        <td>{{ r.status }}</td>
                        <td>{{ r.amenities.join(', ') }}</td>
                        <td>
                          @if (r.errors.length === 0) {
                            <span class="ok"><i class="bi bi-check-circle-fill"></i></span>
                          } @else {
                            <span class="err" [title]="r.errors.join('; ')">
                              <i class="bi bi-exclamation-triangle-fill"></i> {{ r.errors.join('; ') }}
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          } @else {
            <!-- STEP 3: result -->
            <div class="import-result">
              <div class="result-big">
                <i class="bi bi-check-circle-fill"></i>
                {{ result()!.added }} room{{ result()!.added === 1 ? '' : 's' }} added
              </div>
              @if (result()!.skipped.length > 0) {
                <p class="result-skipped-label">{{ result()!.skipped.length }} row(s) skipped:</p>
                <div class="preview-table-wrap">
                  <table class="data-table">
                    <thead><tr><th>#</th><th>Room</th><th>Reason</th></tr></thead>
                    <tbody>
                      @for (s of result()!.skipped; track s.row) {
                        <tr class="row-error">
                          <td>{{ s.row }}</td>
                          <td>{{ s.roomNumber || '—' }}</td>
                          <td>{{ s.reason }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>

        <div class="modal-footer">
          @if (!result()) {
            <button class="btn-ghost" (click)="close.emit()">Cancel</button>
            <button class="btn-primary-custom"
                    [disabled]="validCount() === 0 || submitting()"
                    (click)="submit()">
              @if (submitting()) { <i class="bi bi-arrow-repeat spin"></i> Importing… }
              @else { <i class="bi bi-check-lg"></i> Import {{ validCount() }} room{{ validCount() === 1 ? '' : 's' }} }
            </button>
          } @else {
            <button class="btn-primary-custom" (click)="done()">Done</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .import-panel { max-width: 820px; width: 100%; }
    .import-intro p { font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 1rem; }
    .import-intro code { background: var(--color-surface-2); padding: 0.05rem 0.35rem; border-radius: 4px; font-size: 0.78rem; }
    .import-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .file-label { cursor: pointer; }
    .file-name { font-size: 0.8rem; color: var(--color-text-muted); }
    .preview-summary { display: flex; gap: 0.5rem; margin: 1rem 0 0.5rem; }
    .preview-table-wrap { max-height: 340px; overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .preview-table-wrap .data-table { margin: 0; font-size: 0.8rem; }
    .preview-table-wrap th { position: sticky; top: 0; background: var(--color-surface-2); z-index: 1; }
    tr.row-error { background: var(--color-red-soft); }
    .ok { color: var(--color-green); }
    .err { color: var(--color-red); font-size: 0.75rem; }
    .import-result { text-align: center; padding: 0.5rem 0; }
    .result-big { font-size: 1.05rem; font-weight: 700; color: var(--color-green); display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; }
    .result-skipped-label { font-size: 0.85rem; color: var(--color-text-muted); text-align: left; margin-bottom: 0.5rem; }
    .spin { display: inline-block; animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 560px) {
      .import-intro p { font-size: 0.8rem; }
      .import-actions { flex-direction: column; align-items: stretch; }
      .import-actions .btn-ghost, .import-actions .btn-primary-custom { width: 100%; justify-content: center; }
      .file-name { text-align: center; }
      .preview-table-wrap { max-height: 46vh; }
      .preview-table-wrap .data-table { font-size: 0.72rem; }
      .preview-table-wrap th, .preview-table-wrap td { padding: 0.35rem 0.4rem; white-space: nowrap; }
    }
  `]
})
export class RoomImportComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() imported = new EventEmitter<void>();

  private roomSvc = inject(RoomService);
  private roomTypeSvc = inject(RoomTypeService);
  private toast = inject(ToastService);

  private types: string[] = ['Standard', 'Deluxe', 'Suite'];

  ngOnInit() {
    this.roomTypeSvc.list().subscribe({
      next: res => { if (res.success && res.data.length) this.types = res.data.map(t => t.name); },
      error: () => {}
    });
  }

  fileName = signal('');
  rows = signal<PreviewRow[]>([]);
  submitting = signal(false);
  result = signal<BulkImportResult | null>(null);

  validCount = computed(() => this.rows().filter(r => r.errors.length === 0).length);
  errorCount = computed(() => this.rows().filter(r => r.errors.length > 0).length);

  downloadTemplate() {
    const headers = ['RoomNumber', 'RoomType', 'PricePerNight', 'Status', 'Description', 'Amenities'];
    const examples = [
      ['101', 'Standard', 1500, 'Available', 'Garden view', 'WiFi, AC, TV'],
      ['102', 'Deluxe', 2500, 'Available', 'City view', 'WiFi, AC, TV, Mini Bar'],
      ['201', 'Suite', 5000, 'Maintenance', 'Top floor', 'WiFi, AC, TV, Mini Bar, Jacuzzi'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'rooms-template.xlsx');
  }

  onFile(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    this.result.set(null);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        this.parseRows(json);
        if (this.rows().length === 0) this.toast.info('No rows found in the file');
      } catch {
        this.toast.error('Could not read that file — is it a valid .xlsx or .csv?');
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }

  private pick(r: Record<string, unknown>, ...keys: string[]): string {
    for (const k of keys) {
      const hit = Object.keys(r).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
      if (hit != null && r[hit] !== '' && r[hit] != null) return String(r[hit]).trim();
    }
    return '';
  }

  private parseRows(json: Record<string, unknown>[]) {
    const seen = new Set<string>();
    const rows: PreviewRow[] = json.map((r, i) => {
      const roomNumber = this.pick(r, 'RoomNumber', 'Room Number', 'Room');
      const rawType = this.pick(r, 'RoomType', 'Room Type', 'Type');
      const rawPrice = this.pick(r, 'PricePerNight', 'Price Per Night', 'Price', 'Rate');
      const rawStatus = this.pick(r, 'Status') || 'Available';
      const description = this.pick(r, 'Description', 'Desc', 'Notes');
      const amenities = this.pick(r, 'Amenities', 'Amenity', 'Features')
        .split(/[,;|]/).map(a => a.trim()).filter(Boolean);

      const type = this.types.find(t => t.toLowerCase() === rawType.toLowerCase());
      const status = STATUSES.find(s => s.toLowerCase() === rawStatus.toLowerCase());
      const price = rawPrice === '' ? null : Number(rawPrice);

      const errors: string[] = [];
      if (!roomNumber) errors.push('Room number required');
      if (!type) errors.push(`Bad type "${rawType || ''}"`);
      if (!status) errors.push(`Bad status "${rawStatus}"`);
      if (price === null || isNaN(price) || price <= 0) errors.push('Price must be > 0');
      if (roomNumber) {
        const key = roomNumber.toLowerCase();
        if (seen.has(key)) errors.push('Duplicate in file');
        else seen.add(key);
      }

      return {
        row: i + 2, // header is spreadsheet row 1
        roomNumber,
        roomType: type ?? rawType,
        pricePerNight: price,
        status: status ?? rawStatus,
        description,
        amenities,
        errors,
      };
    });
    this.rows.set(rows);
  }

  submit() {
    const payload = this.rows()
      .filter(r => r.errors.length === 0)
      .map(r => ({
        row: r.row,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
        pricePerNight: r.pricePerNight,
        description: r.description || undefined,
        status: r.status,
        amenities: r.amenities,
      }));

    if (payload.length === 0) return;
    this.submitting.set(true);
    this.roomSvc.bulkCreate(payload).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.success) {
          this.result.set(res.data);
          this.toast.success(res.message || 'Import complete');
          this.imported.emit();
        } else {
          this.toast.error(res.message || 'Import failed');
        }
      },
      error: err => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'Import failed');
      },
    });
  }

  done() { this.close.emit(); }
}
