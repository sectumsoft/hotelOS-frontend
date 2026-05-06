import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, ReportRow, ReportFilter } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  getReport(filter: ReportFilter): Observable<ApiResponse<PagedResult<ReportRow>>> {
    let params = new HttpParams()
      .set('dateFrom', filter.dateFrom)
      .set('dateTo', filter.dateTo)
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());
    if (filter.roomType) params = params.set('roomType', filter.roomType);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<ApiResponse<PagedResult<ReportRow>>>(this.base, { params });
  }

  exportExcel(filter: ReportFilter): Observable<Blob> {
    const params = new HttpParams()
      .set('dateFrom', filter.dateFrom)
      .set('dateTo', filter.dateTo);
    return this.http.get(`${this.base}/export/excel`, { params, responseType: 'blob' });
  }

  exportCsv(filter: ReportFilter): Observable<Blob> {
    const params = new HttpParams()
      .set('dateFrom', filter.dateFrom)
      .set('dateTo', filter.dateTo);
    return this.http.get(`${this.base}/export/csv`, { params, responseType: 'blob' });
  }
}
