// pages-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Index1Component } from './index1/index1.component';
import { ProfileComponent } from './profile/profile.component';
import { PlansComponent } from './plans/plans.component';
import { authGuard } from '../auth/auth.guard';

const routes: Routes = [
  { path: '', component: Index1Component },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'plans',
    component: PlansComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
