import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthModule} from '../auth/auth.module';
import {NGXLogger} from 'ngx-logger';
import {FormsModule} from '@angular/forms';
import { PersonalProfileRoutingModule } from './personal-profile-routing.module';
import { PersonalProfileComponent } from './personal-profile.component';
import { CreateAdSharedModule } from '../shared/create-ad-sharing.module';


@NgModule({
  declarations: [
    PersonalProfileComponent
  ],
  imports: [
    CommonModule,
    AuthModule,
    PersonalProfileRoutingModule,
    CreateAdSharedModule,
    FormsModule
  ]
})
export class PersonalProfileModule { 
  
}
