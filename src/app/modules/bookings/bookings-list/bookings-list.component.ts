import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking, BookingFilter, CheckInRequest, Bill } from '../../../shared/models';


@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bookings-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Bookings</h2>
          <p>{{ totalCount }} total bookings</p>
        </div>
        <div class="page-actions">
          <a routerLink="/bookings/add" class="btn-primary-custom">
            <i class="bi bi-plus-lg"></i> New Booking
          </a>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-bar" style="flex:1;max-width:300px">
          <i class="bi bi-search"></i>
          <input type="text" [(ngModel)]="filter.search" (ngModelChange)="onFilterChange()" placeholder="Search guest, room…" class="form-input" style="padding-left:2.25rem" />
        </div>
        <select class="form-input" style="width:auto" [(ngModel)]="filter.status" (ngModelChange)="onFilterChange()">
          <option value="">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="CheckedIn">Checked In</option>
          <option value="CheckedOut">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input type="date" class="form-input" style="width:auto" [(ngModel)]="filter.checkInFrom" (ngModelChange)="onFilterChange()" />
        <input type="date" class="form-input" style="width:auto" [(ngModel)]="filter.checkInTo" (ngModelChange)="onFilterChange()" />
      </div>

      @if (loading) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton" style="height:220px;border-radius:var(--radius-lg)"></div>
          }
        </div>
      } @else if (bookings.length === 0) {
        <div class="empty-state">
          <i class="bi bi-calendar-x"></i>
          <h4>No bookings found</h4>
          <p>Try adjusting filters or create a new booking.</p>
        </div>
      } @else {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem">
          @for (b of bookings; track b.id) {
            <div class="booking-card">
              <div class="booking-header">
                <div>
                  <div class="booking-id">#{{ b.bookingNumber }}</div>
                  <div class="booking-guest">{{ b.guestName }}</div>
                </div>
                <span class="badge-status {{ b.status.toLowerCase() }}">{{ formatStatus(b.status) }}</span>
              </div>
              <div class="booking-details">
                <div class="detail-item">
                  <div class="detail-label">Room</div>
                  <div class="detail-value">{{ b.roomNumber }} · {{ b.roomType }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Nights</div>
                  <div class="detail-value">{{ b.totalNights }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-in</div>
                  <div class="detail-value">{{ b.checkInDate | date:'MMM d' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-out</div>
                  <div class="detail-value">{{ b.checkOutDate | date:'MMM d' }}</div>
                </div>
              </div>
              <div class="booking-footer">
                <div>
                  <div style="font-family:var(--font-mono);font-weight:600;color:var(--color-accent)">\₹{{ b.totalAmount }}</div>
                  @if (b.advancePaid) { <span class="advance-badge">Advance Paid</span> }
                </div>
                <div style="display:flex;gap:0.5rem">
                  @if (b.status === 'Confirmed') {
                    <button class="btn-ghost" style="padding:0.35rem 0.75rem;font-size:0.8rem" (click)="openCheckIn(b)">
                      <i class="bi bi-box-arrow-in-right"></i> Check-In
                    </button>
                  }
                  @if (b.status === 'CheckedIn') {
                    <button class="btn-ghost" style="padding:0.35rem 0.75rem;font-size:0.8rem" (click)="checkOut(b)">
                      <i class="bi bi-box-arrow-right"></i> Check-Out
                    </button>
                  }
                  <a [routerLink]="['/bookings/edit', b.id]" class="btn-ghost" style="padding:0.35rem 0.75rem;font-size:0.8rem">
                    <i class="bi bi-pencil"></i>
                  </a>
                  @if (b.status === 'Confirmed') {
                    <button class="btn-danger-ghost" style="padding:0.35rem 0.75rem;font-size:0.8rem" (click)="cancelBooking(b)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <div class="pagination-wrapper">
        <span class="pagination-info">{{ totalCount }} bookings</span>
        <div class="pagination-controls">
          <button (click)="prevPage()" [disabled]="filter.pageNumber===1"><i class="bi bi-chevron-left"></i></button>
          @for (p of pages; track p) {
            <button [class.active]="p===filter.pageNumber" (click)="goPage(p)">{{ p }}</button>
          }
          <button (click)="nextPage()" [disabled]="filter.pageNumber===totalPages"><i class="bi bi-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <!-- Check-In Modal -->
    @if (checkInBooking) {
      <div class="modal-overlay" (click)="checkInBooking=null">
        <div class="modal-panel" style="max-width:600px;width:95%" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-box-arrow-in-right" style="color:var(--color-accent)"></i> Check-In Guest</h3>
            <button class="modal-close" (click)="checkInBooking=null"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body" style="max-height:75vh;overflow-y:auto">

            <!-- Booking summary -->
            <div class="info-row">
              <span class="info-label">Guest Name</span>
              <span class="info-value" style="font-family:var(--font-sans);font-weight:600">{{ checkInBooking.guestName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Room</span>
              <span class="info-value" style="font-family:var(--font-sans)">{{ checkInBooking.roomNumber }} · {{ checkInBooking.roomType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount</span>
              <span class="info-value">\₹{{ checkInBooking.totalAmount }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Advance Paid</span>
              <span class="info-value">\₹{{ checkInBooking.advanceAmount || 0 }}</span>
            </div>
            <div class="info-row" style="border-bottom:none">
              <span class="info-label">Balance Due</span>
              <span class="info-value" style="color:var(--color-accent)">\₹{{ checkInBooking.balanceAmount }}</span>
            </div>

            <div class="section-divider"></div>

            <!-- Multi-Guest KYC Section -->
            <div style="margin-bottom:1rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                <h5 style="margin:0;font-size:.9rem;font-weight:600">Guest KYC Details</h5>
                <button type="button" class="btn-ghost" style="padding:.3rem .75rem;font-size:.8rem" (click)="addGuest()">
                  <i class="bi bi-person-plus"></i> Add Guest
                </button>
              </div>

              @for (g of guestKycList; track g; let i = $index) {
                <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1rem;margin-bottom:.75rem">

                  <!-- Guest card header -->
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                    <span style="font-size:.85rem;font-weight:600;color:var(--color-text-muted);display:flex;align-items:center;gap:.4rem">
                      <i class="bi bi-person-circle"></i>
                      {{ i === 0 ? 'Primary Guest' : 'Guest ' + (i + 1) }}
                    </span>
                    @if (i > 0) {
                      <button type="button" class="btn-danger-ghost" style="padding:.25rem .5rem;font-size:.8rem" (click)="removeGuest(i)">
                        <i class="bi bi-trash"></i> Remove
                      </button>
                    }
                  </div>

                  <!-- Full Name -->
                  <div class="form-group">
                    <label style="font-size:.85rem">Full Name (as per ID)</label>
                    <input
                      type="text"
                      class="form-input"
                      [(ngModel)]="g.fullName"
                      [name]="'fullName_' + i"
                      placeholder="Enter full legal name"
                    />
                  </div>

                  <!-- ID Type + ID Number side by side -->
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
                    <div class="form-group" style="margin:0">
                      <label style="font-size:.85rem">ID Type</label>
                      <select class="form-input" [(ngModel)]="g.idType" [name]="'idType_' + i">
                        <option value="Aadhar">Aadhar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="DrivingLicense">Driving License</option>
                        <option value="VoterID">Voter ID</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin:0">
                      <label style="font-size:.85rem">ID Number</label>
                      <input
                        type="text"
                        class="form-input"
                        [(ngModel)]="g.idNumber"
                        [name]="'idNumber_' + i"
                        placeholder="Enter ID number"
                      />
                    </div>
                  </div>

                  <!-- ID Proof Upload -->
                  <div class="form-group" style="margin-top:.75rem;margin-bottom:0">
                    <label style="font-size:.85rem">ID Proof Upload</label>
                    <div
                      class="upload-zone"
                      style="padding:.75rem;cursor:pointer"
                      (click)="triggerFileInput(i)"
                    >
                      <i class="bi bi-id-card" style="font-size:1.25rem"></i>
                      <p style="margin:.25rem 0 0;font-size:.8rem">
                        {{ g.idProofName ? g.idProofName : 'Click to upload ID proof (image or PDF)' }}
                      </p>
                    </div>
                    <!-- Hidden file inputs rendered once per guest, tracked by index -->
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style="display:none"
                      [id]="'guestIdProof_' + i"
                      (change)="onGuestIdProof($event, i)"
                    />
                    @if (g.idProofName) {
                      <small style="color:var(--color-green);display:flex;align-items:center;gap:.25rem;margin-top:.35rem">
                        <i class="bi bi-check-circle-fill"></i> {{ g.idProofName }}
                        <button
                          type="button"
                          style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);margin-left:.25rem;padding:0;font-size:.75rem"
                          (click)="clearGuestIdProof(i)"
                        >
                          <i class="bi bi-x"></i> Remove
                        </button>
                      </small>
                    }
                  </div>

                </div>
              }
            </div>

            <div class="section-divider"></div>

            <!-- Amount Received -->
            <div class="form-group" style="margin-top:1rem">
              <label>Amount Received</label>
              <input type="number" class="form-input" [(ngModel)]="checkInAmount" placeholder="Enter amount" />
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="checkInBooking=null">Cancel</button>
            <button class="btn-primary-custom" (click)="confirmCheckIn()" [disabled]="checkInLoading">
              @if (checkInLoading) { <span class="loading-spinner" style="width:14px;height:14px;border-width:2px"></span> }
              <i class="bi bi-check-lg"></i> Confirm Check-In
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bill Generation Modal -->
    @if (billBooking) {
      <div class="modal-overlay" (click)="billBooking=null">
        <div class="modal-panel" style="max-width:560px;width:95%" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-receipt" style="color:var(--color-accent)"></i> Generate Bill</h3>
            <button class="modal-close" (click)="billBooking=null"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">

            <!-- guest & room summary -->
            <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:1rem;margin-bottom:1.25rem">
              <div style="display:flex;justify-content:space-between;margin-bottom:.5rem">
                <span style="font-weight:600">{{ billBooking.guestName }}</span>
                <span style="font-size:.8rem;color:var(--color-text-muted)">{{ billBooking.bookingNumber }}</span>
              </div>
              <div style="font-size:.85rem;color:var(--color-text-muted)">
                Room {{ billBooking.roomNumber }} · {{ billBooking.roomType }} · {{ billBooking.totalNights }} nights
              </div>
              <div style="font-family:var(--font-mono);color:var(--color-accent);margin-top:.5rem">
                Room Charges: \₹{{ billBooking.totalAmount }}
              </div>
            </div>

            <!-- extra services -->
            <div style="margin-bottom:1.25rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                <h5 style="margin:0;font-size:.9rem">Extra Services</h5>
                <button type="button" class="btn-ghost" style="padding:.3rem .75rem;font-size:.8rem" (click)="addExtraService()">
                  <i class="bi bi-plus"></i> Add Service
                </button>
              </div>
              @for (svc of extraServices; track svc; let i = $index) {
                <div style="display:grid;grid-template-columns:1fr 100px 60px 32px;gap:.5rem;margin-bottom:.5rem;align-items:center">
                  <input type="text" class="form-input" [(ngModel)]="svc.description" placeholder="Service name" style="font-size:.85rem" />
                  <input type="number" class="form-input" [(ngModel)]="svc.amount" placeholder="Amount" min="0" style="font-size:.85rem" />
                  <input type="number" class="form-input" [(ngModel)]="svc.quantity" placeholder="Qty" min="1" style="font-size:.85rem" />
                  <button type="button" class="btn-danger-ghost" style="padding:.3rem .5rem;font-size:.8rem" (click)="removeExtraService(i)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              }
              @if (extraServices.length === 0) {
                <p style="font-size:.8rem;color:var(--color-text-muted);text-align:center;padding:.75rem">No extra services added</p>
              }
            </div>

            <!-- tax & discount -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
              <div class="form-group" style="margin:0">
                <label style="font-size:.85rem">Discount Amount (₹)</label>
                <input type="number" class="form-input" [(ngModel)]="discountAmount" min="0" placeholder="0.00" />
              </div>
              <div class="form-group" style="margin:0">
                <label style="font-size:.85rem">Tax (%)</label>
                <input type="number" class="form-input" [(ngModel)]="taxPercent" min="0" max="100" placeholder="10" />
              </div>
            </div>

            <!-- notes -->
            <div class="form-group" style="margin-bottom:1.25rem">
              <label style="font-size:.85rem">Notes (optional)</label>
              <textarea class="form-input" [(ngModel)]="billNotes" placeholder="Any additional notes..." rows="2"></textarea>
            </div>

            <!-- live bill preview -->
            <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:1rem;border:1px solid var(--color-border)">
              <h5 style="margin:0 0 .75rem;font-size:.85rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em">Bill Preview</h5>
              <div style="display:flex;justify-content:space-between;padding:.3rem 0;font-size:.9rem">
                <span>Subtotal</span><span style="font-family:var(--font-mono)">\₹{{ getBillSubTotal() }}</span>
              </div>
              @if (discountAmount > 0) {
                <div style="display:flex;justify-content:space-between;padding:.3rem 0;font-size:.9rem;color:var(--color-green)">
                  <span>Discount</span><span style="font-family:var(--font-mono)">-\₹{{ discountAmount }}</span>
                </div>
              }
              @if (taxPercent > 0) {
                <div style="display:flex;justify-content:space-between;padding:.3rem 0;font-size:.9rem">
                  <span>Tax ({{ taxPercent }}%)</span><span style="font-family:var(--font-mono)">\₹{{ getBillTax() }}</span>
                </div>
              }
              <div style="display:flex;justify-content:space-between;padding:.5rem 0 0;font-size:1.1rem;font-weight:700;border-top:1px solid var(--color-border);margin-top:.5rem">
                <span>Total</span><span style="font-family:var(--font-mono);color:var(--color-accent)">\₹{{ getBillTotal() }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:.3rem 0;font-size:.85rem;color:var(--color-text-muted)">
                <span>Amount Paid</span><span style="font-family:var(--font-mono)">-\₹{{ billBooking.advanceAmount || 0 }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:.3rem 0;font-size:.95rem;font-weight:600;color:var(--color-red)">
                <span>Balance Due</span>
                <span style="font-family:var(--font-mono)">\₹{{ getBillTotal() - (billBooking.advanceAmount || 0) }}</span>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="billBooking=null">Skip</button>
            <button class="btn-primary-custom" (click)="confirmGenerateBill()" [disabled]="billLoading">
              @if (billLoading) { <span class="loading-spinner" style="width:14px;height:14px;border-width:2px"></span> }
              <i class="bi bi-receipt"></i> Generate Bill
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bill View Modal -->
    @if (showBillView && currentBill) {
      <div class="modal-overlay">
        <div class="modal-panel" style="max-width:680px;width:95%" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-file-text" style="color:var(--color-accent)"></i> Bill — {{ currentBill.billNumber }}</h3>
            <div style="display:flex;gap:.5rem;align-items:center">
              <button class="btn-ghost" style="padding:.35rem .75rem;font-size:.85rem" (click)="printBill()">
                <i class="bi bi-printer"></i> Print
              </button>
              <button class="btn-ghost" style="padding:.35rem .75rem;font-size:.85rem" (click)="downloadPdf()">
                <i class="bi bi-download"></i> PDF
              </button>
              <button class="modal-close" (click)="closeBillView()"><i class="bi bi-x"></i></button>
            </div>
          </div>

          <!-- printable area -->
          <div class="modal-body" id="bill-print-area" style="max-height:75vh;overflow-y:auto">

            <!-- bill header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
              <div>
                <h2 style="margin:0;font-size:1.4rem">INVOICE</h2>
                <div style="font-size:.85rem;color:var(--color-text-muted);margin-top:.25rem">{{ currentBill.billNumber }}</div>
                <div style="font-size:.8rem;color:var(--color-text-muted)">Generated: {{ currentBill.generatedAt | date:'MMM d, yyyy h:mm a' }}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;font-size:1rem">HotelOS</div>
                <div style="font-size:.8rem;color:var(--color-text-muted)">Hotel Management System</div>
              </div>
            </div>

            <!-- guest & booking info -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
              <div>
                <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:.5rem">Bill To</div>
                <div style="font-weight:600">{{ currentBill.guestName }}</div>
                <div style="font-size:.85rem;color:var(--color-text-muted)">{{ currentBill.guestPhone }}</div>
                @if (currentBill.guestAddress) {
                  <div style="font-size:.85rem;color:var(--color-text-muted)">{{ currentBill.guestAddress }}</div>
                }
              </div>
              <div>
                <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:.5rem">Booking Details</div>
                <div style="font-size:.85rem">Booking: <strong>{{ currentBill.bookingNumber }}</strong></div>
                <div style="font-size:.85rem">Room: <strong>{{ currentBill.roomNumber }} · {{ currentBill.roomType }}</strong></div>
                <div style="font-size:.85rem">Check-in: <strong>{{ currentBill.checkInDate | date:'MMM d, yyyy' }}</strong></div>
                <div style="font-size:.85rem">Check-out: <strong>{{ currentBill.checkOutDate | date:'MMM d, yyyy' }}</strong></div>
                <div style="font-size:.85rem">Nights: <strong>{{ currentBill.totalNights }}</strong></div>
              </div>
            </div>

            <!-- line items table -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem">
              <thead>
                <tr style="background:var(--color-surface-2)">
                  <th style="padding:.6rem 1rem;text-align:left;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--color-border)">Description</th>
                  <th style="padding:.6rem 1rem;text-align:center;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--color-border)">Qty</th>
                  <th style="padding:.6rem 1rem;text-align:right;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--color-border)">Unit Price</th>
                  <th style="padding:.6rem 1rem;text-align:right;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--color-border)">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (item of currentBill.items; track item.description) {
                  <tr style="border-bottom:1px solid var(--color-border)">
                    <td style="padding:.6rem 1rem;font-size:.9rem">
                      {{ item.description }}
                      <span style="font-size:.75rem;color:var(--color-text-muted);margin-left:.5rem">{{ item.category }}</span>
                    </td>
                    <td style="padding:.6rem 1rem;text-align:center;font-size:.9rem">{{ item.quantity }}</td>
                    <td style="padding:.6rem 1rem;text-align:right;font-family:var(--font-mono);font-size:.9rem">\₹{{ item.unitPrice }}</td>
                    <td style="padding:.6rem 1rem;text-align:right;font-family:var(--font-mono);font-size:.9rem"
                        [style.color]="item.amount < 0 ? 'var(--color-green)' : 'inherit'">
                      \₹{{ item.amount }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- totals summary -->
            <div style="display:flex;justify-content:flex-end">
              <div style="min-width:280px">
                <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem">
                  <span style="color:var(--color-text-muted)">Subtotal</span>
                  <span style="font-family:var(--font-mono)">\₹{{ currentBill.subTotal }}</span>
                </div>
                @if (currentBill.discountAmount > 0) {
                  <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem;color:var(--color-green)">
                    <span>Discount</span>
                    <span style="font-family:var(--font-mono)">-\₹{{ currentBill.discountAmount }}</span>
                  </div>
                }
                @if (currentBill.taxAmount > 0) {
                  <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem">
                    <span style="color:var(--color-text-muted)">Tax</span>
                    <span style="font-family:var(--font-mono)">\₹{{ currentBill.taxAmount }}</span>
                  </div>
                }
                <div style="display:flex;justify-content:space-between;padding:.6rem 0;font-size:1.1rem;font-weight:700;border-top:2px solid var(--color-border);margin-top:.25rem">
                  <span>Total</span>
                  <span style="font-family:var(--font-mono);color:var(--color-accent)">\₹{{ currentBill.totalAmount }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:.4rem 0;font-size:.9rem;color:var(--color-green)">
                  <span>Amount Paid</span>
                  <span style="font-family:var(--font-mono)">-\₹{{ currentBill.amountPaid }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:.5rem 0;font-size:1rem;font-weight:700;color:var(--color-red);border-top:1px solid var(--color-border);margin-top:.25rem">
                  <span>Balance Due</span>
                  <span style="font-family:var(--font-mono)">\₹{{ currentBill.balanceDue }}</span>
                </div>
              </div>
            </div>

            <!-- notes -->
            @if (currentBill.notes) {
              <div style="margin-top:1.25rem;padding:1rem;background:var(--color-surface-2);border-radius:var(--radius-md);font-size:.85rem">
                <strong>Notes:</strong> {{ currentBill.notes }}
              </div>
            }

            <!-- footer -->
            <div style="margin-top:1.5rem;text-align:center;font-size:.75rem;color:var(--color-text-muted);border-top:1px solid var(--color-border);padding-top:1rem">
              Thank you for staying with us. We hope to see you again!
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeBillView()">
              <i class="bi bi-check-lg"></i> Done
            </button>
            <button class="btn-ghost" (click)="printBill()">
              <i class="bi bi-printer"></i> Print
            </button>
            <button class="btn-primary-custom" (click)="downloadPdf()">
              <i class="bi bi-download"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class BookingsListComponent implements OnInit {
  private bookingSvc = inject(BookingService);
  private toast = inject(ToastService);

  bookings: Booking[] = [];
  loading = true;
  totalCount = 0;
  totalPages = 1;
  filter: BookingFilter = { pageNumber: 1, pageSize: 12 };

  // ── check-in state ──
  checkInBooking: Booking | null = null;
  checkInAmount = 0;
  checkInLoading = false;

  // ── multi-guest KYC list ──
  guestKycList: GuestKyc[] = [this.newGuest()];

  // ── bill generation state ──
  billBooking: Booking | null = null;
  billLoading = false;
  taxPercent = 10;
  discountAmount = 0;
  billNotes = '';
  extraServices: { description: string; amount: number; quantity: number }[] = [];

  // ── bill view state ──
  currentBill: Bill | null = null;
  showBillView = false;

  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  ngOnInit() { this.loadBookings(); }

  // ── bookings list ──
  loadBookings() {
    this.loading = true;
    this.bookingSvc.getAll(this.filter).subscribe({
      next: res => {
        if (res.success) {
          this.bookings = res.data.items;
          this.totalCount = res.data.totalCount;
          this.totalPages = res.data.totalPages;
        }
        this.loading = false;
      },
      error: () => {
        this.bookings = this.getMockBookings();
        this.loading = false;
        this.totalCount = this.bookings.length;
      }
    });
  }

  onFilterChange() { this.filter.pageNumber = 1; this.loadBookings(); }
  prevPage() { if (this.filter.pageNumber > 1) { this.filter.pageNumber--; this.loadBookings(); } }
  nextPage() { if (this.filter.pageNumber < this.totalPages) { this.filter.pageNumber++; this.loadBookings(); } }
  goPage(p: number) { this.filter.pageNumber = p; this.loadBookings(); }

  formatStatus(s: string) {
    return s === 'CheckedIn' ? 'Checked In' : s === 'CheckedOut' ? 'Checked Out' : s;
  }

  // ── multi-guest KYC helpers ──
  newGuest(): GuestKyc {
    return { fullName: '', idType: 'Aadhar', idNumber: '', idProofFile: null, idProofName: '' };
  }

  addGuest() {
    this.guestKycList.push(this.newGuest());
  }

  removeGuest(i: number) {
    this.guestKycList.splice(i, 1);
  }

  /** Triggers the hidden file input for the given guest index via DOM id */
  triggerFileInput(i: number) {
    const el = document.getElementById('guestIdProof_' + i) as HTMLInputElement | null;
    el?.click();
  }

  onGuestIdProof(e: Event, i: number) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.guestKycList[i].idProofFile = file;
      this.guestKycList[i].idProofName = file.name;
    }
  }

  clearGuestIdProof(i: number) {
    this.guestKycList[i].idProofFile = null;
    this.guestKycList[i].idProofName = '';
    // Also clear the input so the same file can be re-selected if needed
    const el = document.getElementById('guestIdProof_' + i) as HTMLInputElement | null;
    if (el) el.value = '';
  }

  // ── check-in ──
  openCheckIn(b: Booking) {
    this.checkInBooking = b;
    this.checkInAmount = b.balanceAmount;
    this.guestKycList = [this.newGuest()];
  }

  confirmCheckIn() {
    if (!this.checkInBooking) return;

    // Validate primary guest
    const primary = this.guestKycList[0];
    if (!primary?.fullName?.trim() || !primary?.idNumber?.trim()) {
      this.toast.error('Please enter the primary guest\'s full name and ID details');
      return;
    }

    // Validate additional guests (must have name + id if partially filled)
    for (let i = 1; i < this.guestKycList.length; i++) {
      const g = this.guestKycList[i];
      if ((g.fullName.trim() || g.idNumber.trim()) && (!g.fullName.trim() || !g.idNumber.trim())) {
        this.toast.error(`Guest ${i + 1}: please fill in both full name and ID number`);
        return;
      }
    }

    this.checkInLoading = true;
    const checkedInBooking = this.checkInBooking;

    const formData = new FormData();
    formData.append('bookingId', checkedInBooking.id);
    formData.append('amountReceived', this.checkInAmount.toString());

    // Append each guest's KYC data
    this.guestKycList.forEach((g, i) => {
      formData.append(`guests[${i}].fullName`, g.fullName);
      formData.append(`guests[${i}].idType`, g.idType);
      formData.append(`guests[${i}].idNumber`, g.idNumber);
      if (g.idProofFile) {
        formData.append(`idProof_${i}`, g.idProofFile);
      }
    });

    this.bookingSvc.checkIn(formData).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Guest checked in successfully!');

          // Reset all check-in state
          this.checkInBooking = null;
          this.checkInAmount = 0;
          this.guestKycList = [this.newGuest()];

          this.loadBookings();
          this.openBillGeneration(checkedInBooking);
        } else {
          this.toast.error(res.message || 'Check-in failed');
        }
        this.checkInLoading = false;
      },
      error: (err) => {
        console.error('Check-in error:', err);
        this.toast.error('Check-in failed');
        this.checkInLoading = false;
      }
    });
  }

  // ── bill generation ──
  openBillGeneration(b: Booking) {
    this.billBooking = b;
    this.extraServices = [];
    this.taxPercent = 10;
    this.discountAmount = 0;
    this.billNotes = '';
  }

  addExtraService() {
    this.extraServices.push({ description: '', amount: 0, quantity: 1 });
  }

  removeExtraService(i: number) {
    this.extraServices.splice(i, 1);
  }

  getBillSubTotal(): number {
    if (!this.billBooking) return 0;
    const servicesTotal = this.extraServices.reduce((s, i) => s + (i.amount * i.quantity), 0);
    return this.billBooking.totalAmount + servicesTotal;
  }

  getBillTax(): number {
    return Math.round((this.getBillSubTotal() - this.discountAmount) * (this.taxPercent / 100) * 100) / 100;
  }

  getBillTotal(): number {
    return this.getBillSubTotal() - this.discountAmount + this.getBillTax();
  }

  confirmGenerateBill() {
    if (!this.billBooking) return;
    this.billLoading = true;
    this.bookingSvc.generateBill(this.billBooking.id, {
      extraServices: this.extraServices.filter(s => s.description && s.amount > 0),
      discountAmount: this.discountAmount,
      taxPercent: this.taxPercent,
      notes: this.billNotes
    }).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Bill generated!');
          this.bookingSvc.getBill(this.billBooking!.id).subscribe({
            next: billRes => {
              if (billRes.success) {
                this.currentBill = billRes.data;
                this.showBillView = true;
                this.billBooking = null;
              }
              this.billLoading = false;
            }
          });
        }
      },
      error: () => { this.toast.error('Failed to generate bill'); this.billLoading = false; }
    });
  }

  // ── bill view / print / pdf ──
  closeBillView() { this.showBillView = false; this.currentBill = null; }

  printBill() { window.print(); }

  downloadPdf() {
    const printContents = document.getElementById('bill-print-area')?.innerHTML;
    if (!printContents) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const billNumber = this.currentBill?.billNumber ?? '';
    win.document.write(
      '<html><head><title>Bill - ' + billNumber + '</title>' +
      '<style>' +
      'body { font-family: Arial, sans-serif; padding: 2rem; color: #000; }' +
      'table { width: 100%; border-collapse: collapse; }' +
      'th, td { padding: 8px 12px; border-bottom: 1px solid #eee; text-align: left; }' +
      'th { background: #f5f5f5; font-weight: 600; }' +
      '.text-right { text-align: right; }' +
      '.total-row td { font-weight: bold; border-top: 2px solid #000; }' +
      'h2, h3 { margin: 0 0 0.5rem; }' +
      '.bill-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }' +
      '.summary-row { display: flex; justify-content: space-between; padding: 4px 0; }' +
      '.balance { color: #e53e3e; font-size: 1.2rem; font-weight: bold; }' +
      '</style>' +
      '</head><body>' + printContents + '</body></html>'
    );
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  // ── check-out / cancel ──
  checkOut(b: Booking) {
    this.bookingSvc.checkOut(b.id).subscribe({
      next: () => { this.toast.success('Guest checked out'); this.loadBookings(); },
      error: () => { this.toast.error('Check-out failed'); }
    });
  }

  cancelBooking(b: Booking) {
    if (!confirm(`Cancel booking #${b.bookingNumber}?`)) return;
    this.bookingSvc.cancel(b.id).subscribe({
      next: () => { this.toast.success('Booking cancelled'); this.loadBookings(); },
      error: () => { this.toast.error('Failed to cancel'); }
    });
  }

  getMockBookings(): Booking[] {
    return [
      { id: '1', bookingNumber: 'BK-0001', tenantId: 't1', guestId: 'g1', guestName: 'James Wilson', guestPhone: '+1 555 0101', roomId: 'r1', roomNumber: '201', roomType: 'Deluxe', checkInDate: '2024-03-15', checkOutDate: '2024-03-18', totalNights: 3, totalAmount: 447, advancePaid: true, advanceAmount: 150, balanceAmount: 297, status: 'Confirmed', createdAt: '', updatedAt: '' },
      { id: '2', bookingNumber: 'BK-0002', tenantId: 't1', guestId: 'g2', guestName: 'Sarah Chen', guestPhone: '+1 555 0102', roomId: 'r2', roomNumber: '301', roomType: 'Suite', checkInDate: '2024-03-14', checkOutDate: '2024-03-17', totalNights: 3, totalAmount: 897, advancePaid: true, advanceAmount: 300, balanceAmount: 597, status: 'CheckedIn', createdAt: '', updatedAt: '' },
      { id: '3', bookingNumber: 'BK-0003', tenantId: 't1', guestId: 'g3', guestName: 'Robert Martinez', guestPhone: '+1 555 0103', roomId: 'r3', roomNumber: '102', roomType: 'Standard', checkInDate: '2024-03-10', checkOutDate: '2024-03-12', totalNights: 2, totalAmount: 178, advancePaid: false, balanceAmount: 178, status: 'CheckedOut', createdAt: '', updatedAt: '' },
      { id: '4', bookingNumber: 'BK-0004', tenantId: 't1', guestId: 'g4', guestName: 'Emily Johnson', guestPhone: '+1 555 0104', roomId: 'r4', roomNumber: '202', roomType: 'Deluxe', checkInDate: '2024-03-20', checkOutDate: '2024-03-22', totalNights: 2, totalAmount: 298, advancePaid: false, balanceAmount: 298, status: 'Confirmed', createdAt: '', updatedAt: '' },
    ];
  }
}

// ── local interface for guest KYC ──
interface GuestKyc {
  fullName: string;
  idType: string;
  idNumber: string;
  idProofFile: File | null;
  idProofName: string;
}