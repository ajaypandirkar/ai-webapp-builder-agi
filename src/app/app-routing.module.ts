import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { noAuthGuard } from './auth/no-auth.guard';

const routes: Routes = [
  { 
    path: '', 
    loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule) 
  },
  { 
    path: 'editor', 
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [authGuard]
  },
  // Auth routes
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [noAuthGuard]
  },
  // Redirect /login to /auth/login for convenience
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  // Catch-all route for 404
  { 
    path: '**', 
    redirectTo: '' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { 
    scrollPositionRestoration: 'top', 
    useHash: true 
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
