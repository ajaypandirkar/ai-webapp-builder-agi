import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotaIndicatorComponent } from './quota-indicator/quota-indicator.component';

@NgModule({
  declarations: [QuotaIndicatorComponent],
  imports: [CommonModule],
  exports: [QuotaIndicatorComponent],
})
export class ComponentsModule {}
