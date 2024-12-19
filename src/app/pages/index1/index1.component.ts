import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-index1',
  templateUrl: './index1.component.html',
  styleUrl: './index1.component.css'
})
export class Index1Component {
  constructor(private router: Router) {
    
  }
  navigateToEditor() {
    this.router.navigate(['/editor']);
  }
}
