import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ClipboardSafetyService {
  private readonly snackBar = inject(MatSnackBar);
  private clearTimerId: any = null;
  private lastCopiedSecret: string | null = null;

  /**
   * Copies sensitive value to clipboard, provides visual toast feedback,
   * never logs the secret, and schedules automatic clipboard clearing.
   */
  async copySecret(value: string, label: string = 'Value', autoClearSeconds: number = 30): Promise<boolean> {
    if (!value) {
      return false;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.lastCopiedSecret = value;
      this.snackBar.open(`${label} copied to clipboard (clears in ${autoClearSeconds}s)`, 'Close', {
        duration: 3500,
        panelClass: 'snack-info'
      });

      // Schedule clipboard wipe
      if (this.clearTimerId) {
        clearTimeout(this.clearTimerId);
      }

      this.clearTimerId = setTimeout(async () => {
        try {
          if (navigator?.clipboard?.readText) {
            const currentClip = await navigator.clipboard.readText();
            if (currentClip === this.lastCopiedSecret) {
              await navigator.clipboard.writeText('');
            }
          }
        } catch {
          // Clipboard read/clear might be blocked by browser security policy when tab is unfocused
        } finally {
          this.lastCopiedSecret = null;
        }
      }, autoClearSeconds * 1000);

      return true;
    } catch {
      this.snackBar.open('Unable to access clipboard.', 'Close', {
        duration: 3000,
        panelClass: 'snack-error'
      });
      return false;
    }
  }

  /**
   * Copies non-sensitive text (like username or bank name)
   */
  async copyText(value: string, label: string = 'Text'): Promise<boolean> {
    if (!value) {
      return false;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      this.snackBar.open(`${label} copied!`, 'Close', {
        duration: 2500,
        panelClass: 'snack-info'
      });
      return true;
    } catch {
      return false;
    }
  }
}
