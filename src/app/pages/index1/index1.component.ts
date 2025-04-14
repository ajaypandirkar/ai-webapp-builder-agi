import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-index1',
  templateUrl: './index1.component.html',
  styleUrl: './index1.component.css',
})
export class Index1Component implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Check authentication state and redirect if authenticated
    this.authService.isAuthenticated$
      .pipe(take(1))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          // If user is authenticated, redirect to editor
          this.router.navigate(['/editor']);
        }
        // If not authenticated, stay on the homepage
      });
  }

  navigateToEditor() {
    // Check if user is authenticated
    this.authService.isAuthenticated$
      .pipe(take(1))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          // If authenticated, navigate directly to editor
          this.router.navigate(['/editor']);
        } else {
          // If not authenticated, redirect to login with returnUrl
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/editor' },
          });
        }
      });
  }
}
