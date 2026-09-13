import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Branded loading indicator — the INNWISE mark with a gentle pulse and an
 * animated "Loading…" caption. Two modes:
 *  - `inline` (default): sits in normal flow, for a card/section/modal that's
 *    fetching its own content (guests list, hotels grid, Guest 360, …).
 *  - `overlay`: fixed full-viewport version used for route transitions
 *    (see AppComponent), where nothing was shown at all before.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="brand-loader" [class.overlay]="mode === 'overlay'">
      <div class="brand-loader-mark">
        <img src="assets/brand/innwise-icon.png" alt="" />
      </div>
      <span class="brand-loader-text">
        {{ text }}<span class="dots"><span>.</span><span>.</span><span>.</span></span>
      </span>
    </div>
  `,
  styles: [`
    .brand-loader {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.75rem;
      padding: 2rem 1rem;
    }
    .brand-loader.overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: var(--color-bg);
      animation: brand-loader-fade-in 0.15s ease both;
    }
    .brand-loader-mark {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      background: #fff;
      border-radius: var(--radius-md);
      padding: 7px;
      box-shadow: 0 4px 16px rgba(59,130,246,0.25);
      animation: brand-loader-pulse 1.3s ease-in-out infinite;
    }
    .brand-loader-mark img { width: 100%; height: 100%; object-fit: contain; }
    .brand-loader-text {
      font-size: 0.8rem; color: var(--color-text-muted);
      letter-spacing: 0.02em;
    }
    .dots span {
      opacity: 0;
      animation: brand-loader-dot 1.2s ease-in-out infinite;
    }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes brand-loader-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    @keyframes brand-loader-fade-in {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes brand-loader-dot {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
  `]
})
export class LoadingComponent {
  @Input() text = 'Loading';
  @Input() mode: 'inline' | 'overlay' = 'inline';
}
