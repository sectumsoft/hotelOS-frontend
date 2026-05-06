import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private show(type: Toast['type'], message: string, title?: string) {
    const toast: Toast = { id: Date.now().toString(), type, message, title };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remove(toast.id), 4000);
  }

  success(message: string, title = 'Success') { this.show('success', message, title); }
  error(message: string, title = 'Error') { this.show('error', message, title); }
  warning(message: string, title = 'Warning') { this.show('warning', message, title); }
  info(message: string, title = 'Info') { this.show('info', message, title); }

  remove(id: string) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
