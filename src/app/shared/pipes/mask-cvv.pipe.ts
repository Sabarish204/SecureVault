import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskCvv',
  standalone: true
})
export class MaskCvvPipe implements PipeTransform {
  transform(value: string | null | undefined, visible: boolean = false): string {
    if (!value) {
      return '';
    }
    if (visible) {
      return value;
    }
    return '•'.repeat(value.length || 3);
  }
}
