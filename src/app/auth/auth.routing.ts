import {Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {RouteConstants} from '../services/common/constants/route-constants';
import {SsoComponent} from './sso/sso.component';

export const AUTH_ROUTES: Routes = [
  {path: RouteConstants.ROOT, redirectTo: RouteConstants.LOGIN, pathMatch: 'full'},
  {path: RouteConstants.SSO, component: SsoComponent},
  {path: RouteConstants.LOGIN, component: LoginComponent}
];
