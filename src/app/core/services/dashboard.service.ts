import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardStats, RevenueDataPoint, OccupancyDataPoint, BookingSourceData } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.base}/stats`);
  }

  getRevenue(days: number = 30): Observable<ApiResponse<RevenueDataPoint[]>> {
    return this.http.get<ApiResponse<RevenueDataPoint[]>>(`${this.base}/revenue?days=${days}`);
  }

  getOccupancy(days: number = 30): Observable<ApiResponse<OccupancyDataPoint[]>> {
    return this.http.get<ApiResponse<OccupancyDataPoint[]>>(`${this.base}/occupancy?days=${days}`);
  }

  getBookingSources(): Observable<ApiResponse<BookingSourceData[]>> {
    return this.http.get<ApiResponse<BookingSourceData[]>>(`${this.base}/booking-sources`);
  }
getRoomAvailability(date: string) {
  return this.http.get(`${environment.apiUrl}/rooms/availability/date?date=${date}`);
}
}
