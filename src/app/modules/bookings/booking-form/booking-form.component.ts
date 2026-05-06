import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { RoomService } from '../../../core/services/room.service';
import { ToastService } from '../../../core/services/toast.service';
import { Room } from '../../../shared/models';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="booking-form-page">
      <div class="page-header">
        <div class="page-title">
          <h2>{{ isEdit ? 'Edit Booking' : 'New Booking' }}</h2>
          <p>{{ isEdit ? 'Update booking details' : 'Create a new reservation' }}</p>
        </div>
        <div class="page-actions">
          <a routerLink="/bookings" class="btn-ghost"><i class="bi bi-arrow-left"></i> Back</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 300px;gap:1.25rem;align-items:start" class="booking-form-grid">
        <div class="card-surface">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <h4 style="margin-bottom:1.25rem">Guest Information</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" class="guest-info-grid">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" class="form-input" formControlName="guestName" placeholder="John Smith" />
                @if (f['guestName'].invalid && f['guestName'].touched) {
                  <span style="font-size:.75rem;color:var(--color-red)">Name required</span>
                }
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" class="form-input" formControlName="guestPhone" placeholder="+1 555 0100" />
              </div>
            </div>
            <div class="form-group" style="margin-bottom:1.25rem">
              <label>Address</label>
              <input type="text" class="form-input" formControlName="guestAddress" placeholder="Street, City, Country" />
            </div>

            <hr class="section-divider" />
            <h4 style="margin-bottom:1.25rem">Reservation Details</h4>

            <div class="form-group" style="margin-bottom:1rem">
              <label>Select Room *</label>
              <select class="form-input" formControlName="roomId" (change)="onRoomChange()">
                <option value="">Choose a room</option>
                @for (room of availableRooms; track room.id) {
                  <option [value]="room.id">{{ room.roomNumber }} - {{ room.roomType }} - $ {{ room.pricePerNight }}/night</option>
                }
              </select>
            </div>
<div class="form-group" style="margin-bottom:1rem">
  <label>Number of Guests *</label>
  <input
    type="number"
    class="form-input"
    formControlName="numberOfGuests"
    min="1"
    placeholder="Enter number of guests"
  />
</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem" class="dates-grid">
              <div class="form-group">
                <label>Check-In Date *</label>
                <input type="date" class="form-input" formControlName="checkInDate" (change)="calcTotal()" />
              </div>
              <div class="form-group">   
                <label>Check-Out Date *</label>
                <input type="date" class="form-input" formControlName="checkOutDate" (change)="calcTotal()" />
              </div>
            </div>

            <hr class="section-divider" />
            <h4 style="margin-bottom:1rem">Payment</h4>
            <div style="margin-bottom:1rem">
              <label class="checkbox-item" style="display:inline-flex;width:auto">
                <input type="checkbox" formControlName="advancePaid" (change)="onAdvanceToggle()" />
                Advance Payment Received
              </label>
            </div>
            @if (form.get('advancePaid')?.value) {
              <div class="form-group" style="margin-bottom:1.25rem">
                <label>Advance Amount (INR)</label>
                <input type="number" class="form-input" formControlName="advanceAmount" placeholder="0.00" min="0" />
              </div>
            }

            <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem">
              <a routerLink="/bookings" class="btn-ghost">Cancel</a>
              <button type="submit" class="btn-primary-custom" [disabled]="loading || form.invalid">
                @if (loading) { <span class="loading-spinner" style="width:14px;height:14px;border-width:2px"></span> }
                {{ isEdit ? 'Update Booking' : 'Create Booking' }}
              </button>
            </div>
          </form>
        </div>

        <div class="card-surface">
          <h5 style="margin-bottom:1rem;font-size:.9rem">Booking Summary</h5>
          @if (selectedRoom) {
            <div class="info-row">
              <span class="info-label">Room</span>
              <span class="info-value" style="font-family:var(--font-sans)">{{ selectedRoom.roomNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type</span>
              <span class="info-value" style="font-family:var(--font-sans)">{{ selectedRoom.roomType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rate</span>
              <span class="info-value">₹ {{ selectedRoom.pricePerNight }}/night</span>
            </div>
          }
          @if (totalNights > 0) {
            <div class="info-row">
              <span class="info-label">Nights</span>
              <span class="info-value">{{ totalNights }}</span>
            </div>
          }
          @if (form.get('advancePaid')?.value && form.get('advanceAmount')?.value) {
            <div class="info-row">
              <span class="info-label">Advance</span>
              <span class="info-value" style="color:var(--color-green)">-$ {{ form.get('advanceAmount')?.value }}</span>
            </div>
          }
          <div class="info-row" style="border-top:1px solid var(--color-border);margin-top:.5rem;padding-top:.75rem">
            <span class="info-label" style="font-weight:600;color:var(--color-text)">Total</span>
            <span class="info-value" style="font-size:1.2rem;color:var(--color-accent)">₹ {{ totalAmount }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookingSvc = inject(BookingService);
  private roomSvc = inject(RoomService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  form = this.fb.group({
    guestName: ['', Validators.required],
    guestPhone: ['', Validators.required],
    guestAddress: [''],
    roomId: ['', Validators.required],
    checkInDate: ['', Validators.required],
    checkOutDate: ['', Validators.required],
    numberOfGuests: [1, [Validators.required, Validators.min(1)]],
    advancePaid: [false],
    advanceAmount: [null as number | null]
  });

  availableRooms: Room[] = [];
  selectedRoom: Room | null = null;
  totalNights = 0;
  totalAmount = 0;
  loading = false;
  isEdit = false;
  bookingId = '';

  get f() { return this.form.controls; }

  ngOnInit() {
    this.bookingId = this.route.snapshot.params['id'];
    if (this.bookingId) this.isEdit = true;
    this.loadRooms();
  }

  loadRooms() {
    this.roomSvc.getAll({ pageNumber: 1, pageSize: 100, status: 'Available' }).subscribe({
      next: res => { if (res.success) this.availableRooms = res.data.items; },
      error: () => {
        this.availableRooms = [
          { id: 'r1', tenantId: 't1', roomNumber: '101', roomType: 'Standard', pricePerNight: 89, status: 'Available', amenities: [], images: [], description: '', createdAt: '', updatedAt: '' },
          { id: 'r2', tenantId: 't1', roomNumber: '202', roomType: 'Deluxe', pricePerNight: 149, status: 'Available', amenities: [], images: [], description: '', createdAt: '', updatedAt: '' },
          { id: 'r3', tenantId: 't1', roomNumber: '301', roomType: 'Suite', pricePerNight: 299, status: 'Available', amenities: [], images: [], description: '', createdAt: '', updatedAt: '' },
        ];
      }
    });
  }

  onRoomChange() {
    const id = this.form.get('roomId')?.value;
    this.selectedRoom = this.availableRooms.find(r => r.id === id) || null;
    this.calcTotal();
  }

  calcTotal() {
    const ci = this.form.get('checkInDate')?.value;
    const co = this.form.get('checkOutDate')?.value;
    if (ci && co && this.selectedRoom) {
      const d1 = new Date(ci), d2 = new Date(co);
      this.totalNights = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
      this.totalAmount = this.totalNights * this.selectedRoom.pricePerNight;
    }
  }

  onAdvanceToggle() {
    if (!this.form.get('advancePaid')?.value) this.form.patchValue({ advanceAmount: null });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const data = this.form.value as any;
    const req = this.isEdit ? this.bookingSvc.update(this.bookingId, data) : this.bookingSvc.create(data);
    req.subscribe({
      next: res => {
        if (res.success) {
          this.toast.success(this.isEdit ? 'Booking updated!' : 'Booking created!');
          this.router.navigate(['/bookings']);
        }
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to save booking'); this.loading = false; }
    });
  }
}