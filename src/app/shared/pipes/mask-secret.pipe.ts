import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskSecret',
  standalone: true
})
export class MaskSecretPipe implements PipeTransform {
  transform(value: string | null | undefined, visible: boolean = false, defaultLength: number = 10): string {
    if (!value) {
      return '';
    }
    if (visible) {
      return value;
    }
    // Return a fixed or representative bullet mask
    const length = value.length > 0 ? Math.min(Math.max(value.length, 8), 16) : defaultLength;
    return '•'.repeat(length);
  }
}
