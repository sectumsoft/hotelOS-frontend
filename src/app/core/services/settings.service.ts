import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/settings`;

  createHotelSettings(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });

    return this.http.post(`${this.base}/hotelSettings`, JSON.stringify(data), { headers });
  }
  getHotelSettings() {
  return this.http.get(`${this.base}/hotelDetails`);
}
}