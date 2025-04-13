// import { Injectable } from "@angular/core";
// import { Router, UrlTree } from "@angular/router";
// import { map, Observable } from "rxjs";
// import { AuthService } from "../services/auth.service";

// // guards/auth.guard.ts
// @Injectable({ providedIn: 'root' })
// export class AuthGuard {
//   constructor(private authService: AuthService, private router: Router) {}

//   canActivate(): Observable<boolean | UrlTree> {
//     return this.authService.isAuthenticated().pipe(
//       map(isAuth => isAuth ? true : this.router.createUrlTree(['/login']))
//     );
//   }
// }