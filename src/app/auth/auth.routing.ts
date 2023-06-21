import {Routes} from '@angular/router';
import {RouteConstants} from '../services/common/constants/route-constants';
 

export const AUTH_ROUTES: Routes = [
  {path: RouteConstants.ROOT, redirectTo: RouteConstants.LOGIN, pathMatch: 'full'},
];
