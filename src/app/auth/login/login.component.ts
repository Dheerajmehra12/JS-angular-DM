import {Component, OnInit} from '@angular/core';
import {AuthService, LoginInfo} from '../auth.service';
import { Router} from '@angular/router';
import {NGXLogger} from 'ngx-logger';
import { TranslateService } from '../../services/translate';
import {AppConstant} from '../../services/common/constants/app-constant'; 
import {RouteConstants} from '../../services/common/constants/route-constants';

declare const appConfig: any;
declare const grecaptcha: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  model: LoginInfo = {} as LoginInfo;
  captchaVerified = true;
  passwordInputType = 'password';
  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: NGXLogger,
    private _translate: TranslateService,
  ) { }

  ngOnInit() {
    this.authService.logout();
   localStorage.getItem('language')?this._translate.use(localStorage.getItem('language')):this.selectLang(AppConstant.LANGUAGE) 
    const savedCredentials = this.authService.getSavedCredentials();
    if ( savedCredentials !== null) {
      this.logger.info('savedCredentials', savedCredentials);
      this.authService.decryptPassword(savedCredentials.username, savedCredentials.passwordHex)
        .subscribe((password) => {
          this.model.username = savedCredentials.username;
          this.model.password = password;
          this.model.saveCredentials = true;
        });
    }
    this.renderCaptcha();
  }

  signin() {
    this.logger.info('inside sign in function');
    this.model.errorMessage = '';
    this.logger.info(this.model);
    this.authService.signIn(this.model)
      .subscribe(
        data => {
          if (data.status === 0) {
            if (this.model.saveCredentials) {
              this.authService.encryptPassword(this.model)
                .finally(() => this.router.navigate([RouteConstants.SELECT_PLAN]))
                .subscribe((passwordHex) => {
                  this.logger.info(passwordHex);
                  this.authService.saveCredentials(this.model.password, passwordHex);
                });
            }else{
              this.authService.clearCredentials();
              this.router.navigate([RouteConstants.SELECT_PLAN]);
            }
          } else {
              this.model.errorMessage = this._translate.translate('login.errorMsg.err') ;
              this.logger.info('Invalid Username or password');
          }
        },
        error => {
          this.logger.error(error);
          this.model.errorMessage = this._translate.translate('login.errorMsg.loginError') ;
        }
      );
  }

  onCaptchaInput(token) {
    this.logger.info('verifyCaptcha');
    this.authService.verifyCaptcha(token).subscribe(res => {
      this.captchaVerified = res.success;
      this.logger.info('this.captchaVerified=', this.captchaVerified);
    });
  }

  onCaptchaExpired() {
    if (appConfig && appConfig.gcaptchaEnable) {
      this.logger.info('Resetting captcha on expiry...');
      grecaptcha.reset();
      this.captchaVerified = false;
    }
  }

  selectLang(lang: string) {
    console.log("language is here on selection :",lang);
    localStorage.setItem('language', lang);
    this._translate.use(localStorage.getItem('language'));
}   

  renderCaptcha() {
    if (appConfig && appConfig.gcaptchaEnable) {
      this.logger.info('Creating g-recaptcha');
      grecaptcha.ready(() => {
        grecaptcha.render('g-recaptcha', {
            sitekey: appConfig.gcaptchaSiteKey,
            callback: (token) => this.onCaptchaInput(token),
            'expired-callback': () => this.onCaptchaExpired()
          }
        );
        this.captchaVerified = false;
      });
    }
  }
  
  getTooltipMsg(){
    if(this.passwordInputType==='password'){
      return this._translate.translate('login.tooltipMsg.showPassword')
    }else{
      return this._translate.translate('login.tooltipMsg.hidePassword')
    }
  }

  showHidePassword() {
    if (this.passwordInputType === 'password') {
      this.passwordInputType = 'text';
    } else {
      this.passwordInputType = 'password';
    }
  }
}
