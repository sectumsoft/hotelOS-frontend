import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  actorName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFeed {
  unreadCount: number;
  items: AppNotification[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notifications`;

  getFeed(): Observable<ApiResponse<NotificationFeed>> {
    return this.http.get<ApiResponse<NotificationFeed>>(this.base);
  }

  markAllRead(): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.base}/read`, {});
  }

  iconFor(type: string): string {
    const m: Record<string, string> = {
      'room-created': 'bi-door-open',
      'rooms-imported': 'bi-file-earmark-spreadsheet',
      'booking-created': 'bi-calendar-plus',
      'booking-updated': 'bi-pencil-square',
      'booking-cancelled': 'bi-x-circle',
      'check-in': 'bi-box-arrow-in-right',
      'check-out': 'bi-box-arrow-right',
      'bill-generated': 'bi-receipt',
      'staff-added': 'bi-person-plus',
    };
    return m[type] || 'bi-bell';
  }
}
