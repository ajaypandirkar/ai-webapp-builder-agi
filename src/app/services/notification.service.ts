import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  show(message: string, type: 'success' | 'error' = 'success'): void {
    // TODO: Implement actual notification display logic
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
