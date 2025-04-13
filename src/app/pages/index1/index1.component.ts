import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-index1',
  templateUrl: './index1.component.html',
  styleUrl: './index1.component.css'
})
export class Index1Component {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateToEditor() {
    // Check if user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // If authenticated, navigate directly to editor
        this.router.navigate(['/editor']);
      } else {
        // If not authenticated, redirect to login with returnUrl
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/editor' }
        });
      }
    });
  }
}
