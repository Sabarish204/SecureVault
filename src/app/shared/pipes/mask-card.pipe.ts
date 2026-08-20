import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskCard',
  standalone: true
})
export class MaskCardPipe implements PipeTransform {
  transform(value: string | null | undefined, visible: boolean = false): string {
    if (!value) {
      return '';
    }
    const cleanDigits = value.replace(/\D/g, '');
    if (visible) {
      // Format into 4-digit groups
      return cleanDigits.replace(/(.{4})/g, '$1 ').trim();
    }
    if (cleanDigits.length < 4) {
      return '••••';
    }
    const lastFour = cleanDigits.slice(-4);
    if (cleanDigits.length <= 8) {
      return `•••• ${lastFour}`;
    }
    if (cleanDigits.length <= 12) {
      return `•••• •••• ${lastFour}`;
    }
    return `•••• •••• •••• ${lastFour}`;
  }
}
