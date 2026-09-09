import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

interface Country { name: string; dial: string; flag: string; }

// Common set, India first (the app's default market).
const COUNTRIES: Country[] = [
  { name: 'India', dial: '+91', flag: '🇮🇳' },
  { name: 'United States', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
  template: `
    <div class="phone-input">
      <select class="form-input dial" [(ngModel)]="dial" (ngModelChange)="push()" [disabled]="disabled"
              aria-label="Country code">
        @for (c of countries; track c.name) {
          <option [value]="c.dial">{{ c.flag }} {{ c.dial }}</option>
        }
      </select>
      <input type="tel" inputmode="numeric" class="form-input num"
             [(ngModel)]="number" (ngModelChange)="onNumber($event)"
             [placeholder]="placeholder" [disabled]="disabled" maxlength="15" />
    </div>
  `,
  styles: [`
    .phone-input { display: flex; gap: 0.5rem; }
    .dial {
      flex: 0 0 auto; width: auto; min-width: 92px; padding-right: 0.5rem;
      font-family: var(--font-sans);
    }
    .num { flex: 1 1 auto; min-width: 0; }
    @media (max-width: 380px) { .dial { min-width: 80px; } }
  `]
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'Phone number';

  countries = COUNTRIES;
  dial = '+91';
  number = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const raw = (value ?? '').trim();
    if (!raw) { this.number = ''; return; }

    if (raw.startsWith('+')) {
      // longest dial-code prefix wins (e.g. +971 before +9)
      const match = [...this.countries]
        .sort((a, z) => z.dial.length - a.dial.length)
        .find(c => raw.startsWith(c.dial));
      if (match) {
        this.dial = match.dial;
        this.number = raw.slice(match.dial.length).replace(/\D/g, '');
        return;
      }
    }
    this.number = raw.replace(/\D/g, '');
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onNumber(v: string) {
    const digits = (v ?? '').replace(/\D/g, '');
    if (digits !== v) this.number = digits;
    this.push();
  }

  push() {
    this.onTouched();
    // emit empty string when no number so Validators.required still fires
    this.onChange(this.number ? `${this.dial} ${this.number}` : '');
  }
}
