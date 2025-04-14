import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages-routing.module';
import { Index1Component } from './index1/index1.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { PlansComponent } from './plans/plans.component';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  declarations: [Index1Component, ProfileComponent, PlansComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PagesRoutingModule,
    ComponentsModule,
  ],
})
export class PagesModule {}
