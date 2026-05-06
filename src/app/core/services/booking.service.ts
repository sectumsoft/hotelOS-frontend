import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, Booking, CreateBookingRequest, CheckInRequest, BookingFilter,Bill, GenerateBillRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/bookings`;

  getAll(filter: BookingFilter): Observable<ApiResponse<PagedResult<Booking>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.checkInFrom) params = params.set('checkInFrom', filter.checkInFrom);
    if (filter.checkInTo) params = params.set('checkInTo', filter.checkInTo);
    return this.http.get<ApiResponse<PagedResult<Booking>>>(this.base, { params });
  }

  getById(id: string): Observable<ApiResponse<Booking>> {
    return this.http.get<ApiResponse<Booking>>(`${this.base}/${id}`);
  }

  create(req: CreateBookingRequest): Observable<ApiResponse<Booking>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.post<ApiResponse<Booking>>(this.base, JSON.stringify(req), { headers });
  }

  update(id: string, req: CreateBookingRequest): Observable<ApiResponse<Booking>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.put<ApiResponse<Booking>>(`${this.base}/${id}`, JSON.stringify(req), { headers });
  }

checkIn(req: FormData): Observable<ApiResponse<Booking>> {
  return this.http.post<ApiResponse<Booking>>(
    `${this.base}/checkin`,
    req
  );
}

  checkOut(id: string): Observable<ApiResponse<Booking>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.post<ApiResponse<Booking>>(`${this.base}/${id}/checkout`, JSON.stringify({}), { headers });
  }

  cancel(id: string): Observable<ApiResponse<Booking>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.post<ApiResponse<Booking>>(`${this.base}/${id}/cancel`, JSON.stringify({}), { headers });
  }
  generateBill(bookingId: string, req: GenerateBillRequest): Observable<ApiResponse<string>> {
  return this.http.post<ApiResponse<string>>(`${this.base}/${bookingId}/generate-bill`, req);
}

getBill(bookingId: string): Observable<ApiResponse<Bill>> {
  return this.http.get<ApiResponse<Bill>>(`${this.base}/${bookingId}/bill`);
}
}
