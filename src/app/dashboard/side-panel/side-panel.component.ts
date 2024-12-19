import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.css'
})
export class SidePanelComponent {
  @Input() isSidebarActive: boolean | undefined;
  isPanelCollapsed = false;
  sidebarWidth = '16rem'; // 256px = 16rem

  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    this.sidebarWidth = this.isPanelCollapsed ? '4rem' : '16rem'; // 64px = 4rem
  }

  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  handleOverlayClick() {
    this.isSidebarActive = false;
  }

  ngOnInit(): void {
  }

  private handleResize() {
    if (window.innerWidth >= 768) { // md breakpoint
      this.isSidebarActive = false; // Reset mobile sidebar state
    }
  }
}
