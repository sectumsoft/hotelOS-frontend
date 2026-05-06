import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts$ | async; track toast.id) {
        <div class="toast-item toast-{{ toast.type }}" (click)="remove(toast.id)">
          <div class="toast-icon">
            <i class="bi {{ getIcon(toast.type) }}"></i>
          </div>
          <div class="toast-content">
            @if (toast.title) { <div class="toast-title">{{ toast.title }}</div> }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close"><i class="bi bi-x"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      min-width: 300px;
      max-width: 400px;
      box-shadow: var(--shadow-modal);
      pointer-events: all;
      cursor: pointer;
      animation: slideInRight 0.25s cubic-bezier(0.4,0,0.2,1);
      border-left: 3px solid;
    }
    .toast-success { border-left-color: var(--color-green); }
    .toast-error { border-left-color: var(--color-red); }
    .toast-warning { border-left-color: var(--color-yellow); }
    .toast-info { border-left-color: var(--color-blue); }
    .toast-icon { font-size: 1.1rem; padding-top: 0.1rem; }
    .toast-success .toast-icon { color: var(--color-green); }
    .toast-error .toast-icon { color: var(--color-red); }
    .toast-warning .toast-icon { color: var(--color-yellow); }
    .toast-info .toast-icon { color: var(--color-blue); }
    .toast-title { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.2rem; }
    .toast-message { font-size: 0.8rem; color: var(--color-text-muted); }
    .toast-close {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0;
      font-size: 0.9rem;
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  getIcon(type: Toast['type']): string {
    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    return icons[type];
  }

  remove(id: string) { this.toastService.remove(id); }
}
