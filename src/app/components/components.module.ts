import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuotaIndicatorComponent } from './quota-indicator/quota-indicator.component';

@NgModule({
  declarations: [QuotaIndicatorComponent],
  imports: [CommonModule, RouterModule],
  exports: [QuotaIndicatorComponent],
})
export class ComponentsModule {}
