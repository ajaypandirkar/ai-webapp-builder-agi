import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages-routing.module';
import { Index1Component } from './index1/index1.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    Index1Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    PagesRoutingModule
  ]
})
export class PagesModule { }
