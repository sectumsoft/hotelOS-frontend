import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RoomService } from '../../core/services/room.service';
import { BookingService } from '../../core/services/booking.service';
import { Booking, Room } from '../../shared/models';

interface DayCell {
  date: Date;
  ymd: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  booked: number;
  free: number;
  level: 'none' | 'low' | 'mid' | 'high' | 'full';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cal-card">
      <div class="cal-head">
        <div class="cal-title">
          <h4>Availability calendar</h4>
          <span>Rooms free vs booked, by date</span>
        </div>
        <div class="cal-nav">
          <button class="cal-btn" (click)="shiftMonth(-1)" aria-label="Previous month"><i class="bi bi-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel() }}</span>
          <button class="cal-btn" (click)="shiftMonth(1)" aria-label="Next month"><i class="bi bi-chevron-right"></i></button>
          <button class="cal-today" (click)="goToday()">Today</button>
        </div>
      </div>

      @if (loading()) {
        <div class="cal-loading">Loading availability…</div>
      } @else {
        <div class="cal-legend">
          <span><i class="dot low"></i> Mostly free</span>
          <span><i class="dot mid"></i> Filling up</span>
          <span><i class="dot high"></i> Nearly full</span>
          <span><i class="dot full"></i> Full</span>
        </div>

        <div class="cal-grid cal-weekdays">
          @for (w of weekdays; track w) { <div class="cal-wd">{{ w }}</div> }
        </div>

        <div class="cal-grid">
          @for (cell of cells(); track cell.ymd) {
            <button class="cal-cell lvl-{{ cell.level }}"
                    [class.out]="!cell.inMonth"
                    [class.today]="cell.isToday"
                    [class.selected]="cell.ymd === selected()"
                    (click)="selected.set(cell.ymd)">
              <span class="cal-date">{{ cell.date.getDate() }}</span>
              @if (cell.inMonth && capacity() > 0) {
                <span class="cal-free">{{ cell.free }} free</span>
                <span class="cal-bar"><span [style.width.%]="cell.booked / capacity() * 100"></span></span>
              }
            </button>
          }
        </div>

        @if (detail(); as d) {
          <div class="cal-detail">
            <div class="cal-detail-head">
              <strong>{{ d.label }}</strong>
              <span>{{ d.free.length }} of {{ capacity() }} rooms free</span>
            </div>

            <div class="cal-detail-cols">
              <div class="cal-col">
                <div class="cal-col-h booked">Booked ({{ d.booked.length }})</div>
                @if (d.booked.length === 0) { <p class="cal-none">No rooms booked</p> }
                @for (b of d.booked; track b.roomNumber + b.guestName) {
                  <div class="cal-room">
                    <span class="rn">{{ b.roomNumber }}</span>
                    <span class="rt">{{ b.roomType }}</span>
                    <span class="gn">{{ b.guestName }}</span>
                    <span class="st st-{{ b.status.toLowerCase() }}">{{ b.status }}</span>
                  </div>
                }
              </div>

              <div class="cal-col">
                <div class="cal-col-h free">Available ({{ d.free.length }})</div>
                @if (d.free.length === 0) { <p class="cal-none">Fully booked</p> }
                <div class="cal-chips">
                  @for (r of d.free; track r.roomNumber) {
                    <span class="chip">{{ r.roomNumber }}<small>{{ r.roomType }}</small></span>
                  }
                </div>
                @if (d.maint.length > 0) {
                  <div class="cal-col-h maint" style="margin-top:0.75rem">Maintenance ({{ d.maint.length }})</div>
                  <div class="cal-chips">
                    @for (r of d.maint; track r.roomNumber) { <span class="chip muted">{{ r.roomNumber }}</span> }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .cal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-top: 1.5rem; }
    .cal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .cal-title h4 { margin: 0; font-size: 1rem; }
    .cal-title span { font-size: 0.78rem; color: var(--color-text-muted); }
    .cal-nav { display: flex; align-items: center; gap: 0.4rem; }
    .cal-month { font-size: 0.85rem; font-weight: 600; min-width: 130px; text-align: center; }
    .cal-btn { width: 30px; height: 30px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface-2); color: var(--color-text-muted); cursor: pointer; transition: var(--transition); }
    .cal-btn:hover { color: var(--color-text); }
    .cal-today { padding: 0.35rem 0.7rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface-2); color: var(--color-text-muted); font-size: 0.75rem; cursor: pointer; }
    .cal-today:hover { color: var(--color-text); }

    .cal-loading { padding: 2rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; }

    .cal-legend { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0 0.5rem; font-size: 0.72rem; color: var(--color-text-muted); }
    .cal-legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 0.35rem; vertical-align: middle; }
    .dot.low { background: var(--color-green); }
    .dot.mid { background: #f59e0b; }
    .dot.high { background: #f97316; }
    .dot.full { background: var(--color-red); }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .cal-weekdays { margin-bottom: 6px; }
    .cal-wd { text-align: center; font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 0.25rem 0; }

    .cal-cell {
      min-height: 74px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--color-surface-2); padding: 0.4rem; cursor: pointer;
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem;
      transition: var(--transition); font-family: var(--font-sans); position: relative; overflow: hidden;
    }
    .cal-cell::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
    .cal-cell.lvl-low::before  { background: var(--color-green); }
    .cal-cell.lvl-mid::before  { background: #f59e0b; }
    .cal-cell.lvl-high::before { background: #f97316; }
    .cal-cell.lvl-full::before { background: var(--color-red); }
    .cal-cell:hover { border-color: var(--color-accent); }
    .cal-cell.out { opacity: 0.4; }
    .cal-cell.today { box-shadow: inset 0 0 0 1px var(--color-accent); }
    .cal-cell.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
    .cal-date { font-size: 0.82rem; font-weight: 700; }
    .cal-free { font-size: 0.68rem; color: var(--color-text-muted); }
    .cal-bar { width: 100%; height: 4px; border-radius: 2px; background: var(--color-border); margin-top: auto; overflow: hidden; }
    .cal-bar > span { display: block; height: 100%; background: var(--color-accent); }
    .cal-cell.lvl-full .cal-bar > span { background: var(--color-red); }
    .cal-cell.lvl-high .cal-bar > span { background: #f97316; }
    .cal-cell.lvl-mid .cal-bar > span { background: #f59e0b; }
    .cal-cell.lvl-low .cal-bar > span { background: var(--color-green); }

    .cal-detail { margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }
    .cal-detail-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .cal-detail-head span { font-size: 0.8rem; color: var(--color-text-muted); }
    .cal-detail-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .cal-col-h { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
    .cal-col-h.booked { color: var(--color-red); }
    .cal-col-h.free { color: var(--color-green); }
    .cal-col-h.maint { color: var(--color-text-muted); }
    .cal-none { font-size: 0.8rem; color: var(--color-text-muted); }
    .cal-room { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.8rem; }
    .cal-room .rn { font-weight: 700; font-family: var(--font-mono); min-width: 42px; }
    .cal-room .rt { color: var(--color-text-muted); font-size: 0.75rem; }
    .cal-room .gn { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cal-room .st { font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 100px; }
    .st-confirmed { background: var(--color-blue-soft); color: var(--color-blue); }
    .st-checkedin { background: var(--color-green-soft); color: var(--color-green); }
    .st-checkedout { background: var(--color-surface-2); color: var(--color-text-muted); }
    .cal-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.55rem; border-radius: var(--radius-sm); background: var(--color-green-soft); color: var(--color-green); font-size: 0.78rem; font-weight: 600; font-family: var(--font-mono); }
    .chip small { font-family: var(--font-sans); font-weight: 500; opacity: 0.7; }
    .chip.muted { background: var(--color-surface-2); color: var(--color-text-muted); }

    @media (max-width: 640px) {
      .cal-cell { min-height: 60px; }
      .cal-free { display: none; }
      .cal-detail-cols { grid-template-columns: 1fr; }
    }
  `]
})
export class AvailabilityCalendarComponent implements OnInit {
  private roomSvc = inject(RoomService);
  private bookingSvc = inject(BookingService);

  weekdays = WEEKDAYS;
  loading = signal(true);
  rooms = signal<Room[]>([]);
  bookings = signal<Booking[]>([]);
  viewMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selected = signal(ymd(new Date()));

  capacity = computed(() => this.rooms().filter(r => r.status !== 'Maintenance').length);

  monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

  private bookedRoomsOn(day: string) {
    return this.bookings().filter(b =>
      b.status !== 'Cancelled' &&
      String(b.checkInDate).slice(0, 10) <= day &&
      day < String(b.checkOutDate).slice(0, 10));
  }

  cells = computed<DayCell[]>(() => {
    const first = this.viewMonth();
    const start = new Date(first);
    start.setDate(1 - first.getDay()); // back to Sunday
    const todayStr = ymd(new Date());
    const cap = this.capacity();
    const out: DayCell[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = ymd(date);
      const distinctRooms = new Set(this.bookedRoomsOn(key).map(b => b.roomNumber));
      const booked = distinctRooms.size;
      const free = Math.max(0, cap - booked);
      const ratio = cap > 0 ? booked / cap : 0;
      let level: DayCell['level'] = 'none';
      if (cap > 0) {
        if (ratio >= 1) level = 'full';
        else if (ratio >= 0.75) level = 'high';
        else if (ratio >= 0.4) level = 'mid';
        else level = 'low';
      }
      out.push({
        date, ymd: key,
        inMonth: date.getMonth() === first.getMonth(),
        isToday: key === todayStr,
        isPast: key < todayStr,
        booked, free, level,
      });
    }
    return out;
  });

  detail = computed(() => {
    const day = this.selected();
    if (!day) return null;
    const active = this.bookedRoomsOn(day);
    const bookedNums = new Set(active.map(b => b.roomNumber));
    const booked = active
      .map(b => ({ roomNumber: b.roomNumber, roomType: b.roomType, guestName: b.guestName, status: b.status }))
      .sort((a, z) => a.roomNumber.localeCompare(z.roomNumber, undefined, { numeric: true }));
    const free = this.rooms()
      .filter(r => r.status !== 'Maintenance' && !bookedNums.has(r.roomNumber))
      .sort((a, z) => a.roomNumber.localeCompare(z.roomNumber, undefined, { numeric: true }));
    const maint = this.rooms().filter(r => r.status === 'Maintenance');
    const label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    return { label, booked, free, maint };
  });

  ngOnInit() {
    forkJoin({
      rooms: this.roomSvc.getAll({ pageNumber: 1, pageSize: 500 }),
      bookings: this.bookingSvc.getAll({ pageNumber: 1, pageSize: 500 }),
    }).subscribe({
      next: ({ rooms, bookings }) => {
        if (rooms.success) this.rooms.set(rooms.data.items);
        if (bookings.success) this.bookings.set(bookings.data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  shiftMonth(delta: number) {
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  goToday() {
    const now = new Date();
    this.viewMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selected.set(ymd(now));
  }
}
