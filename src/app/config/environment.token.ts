import { InjectionToken } from '@angular/core';
import { Environment } from '../../environments/environment.interface';

export const ENVIRONMENT = new InjectionToken<Environment>('environment');