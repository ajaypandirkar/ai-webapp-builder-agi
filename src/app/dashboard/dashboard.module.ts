import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor/editor.component';
import { FormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SidePanelComponent } from './side-panel/side-panel.component';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  declarations: [EditorComponent, SidePanelComponent],
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    ComponentsModule,
  ],
})
export class DashboardModule {}
