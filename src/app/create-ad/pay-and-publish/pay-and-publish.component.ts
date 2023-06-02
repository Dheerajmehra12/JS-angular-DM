import {Component, OnInit, ViewChild} from '@angular/core';
import {CREATE_AD_STEPS, NavigationStep, StepNavService} from '../step-nav/step-nav.service';
import {PayAndPublishService} from './pay-and-publish.service';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../../services/web-storage.service';
import {StorageKeys} from '../../services/common/constants/storage-keys';
import {RouteConstants} from '../../services/common/constants/route-constants';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {SpinnerService} from '../../shared/spinner/spinner.service';
import {NgForm} from '@angular/forms';
import { TranslateService } from '../../services/translate';
import { AppConstant } from '../../services/common/constants/app-constant';

declare const Stripe: any;
declare const __env: any;
declare const appConfig: any;

@Component({
  selector: 'app-pay-and-publish',
  templateUrl: './pay-and-publish.component.html',
  styleUrls: ['./pay-and-publish.component.css']
})
export class PayAndPublishComponent implements OnInit {
  paymentData: any;

  private stripe: any = Stripe(__env.stripeKey);
  private cardElem: any;

  email: string;
  cardInputComplete = false;
  nameOnCard: string;
  agreeTerms = false;

  hasPaymentError = false;
  errors: any = {
    payment: ''
  };
  private campaignStatus = -1;

  @ViewChild('paymentForm') paymentForm: NgForm;

  constructor(
    private stepNavService: StepNavService,
    private payAndPublishService: PayAndPublishService,
    private logger: NGXLogger,
    private storageService: WebStorageService,
    private router: Router,
    private titleService: Title,
    private spinnerService: SpinnerService,
    private _translate: TranslateService
  ) {}

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.titleService.setTitle(`${appConfig.appDisplayName}: Payment`);
    if (this.storageService.get(StorageKeys.CAMPAIGN_STATUS)) {
      this.campaignStatus = this.storageService.get(StorageKeys.CAMPAIGN_STATUS);
    }
    this.stepNavService.initSteps(CREATE_AD_STEPS.PAY_AND_PUBLISH, this.campaignStatus);
    this.payAndPublishService.getPaymentData().subscribe( data => this.paymentData = data);
    this.initPaymentForm();
  }

  private initPaymentForm() {

    const options = {fonts: [{
      family: 'Manrope',
      src: 'url(https://cdn.cmcd1.com/magnet/assets/fonts/manrope-regular.woff)',
      weight: '400',
    }]};
    const elements = this.stripe.elements(options);
    const loginInfo = this.storageService.get(StorageKeys.LOGIN_DATA);
    const agentInfo = (loginInfo && loginInfo.agentInfo) ? loginInfo.agentInfo : null;

    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var teamMembers = this.storageService.get(AppConstant.TEAM_MEMBERS);
      var email = '';
      if(teamMembers) {
        teamMembers.forEach(function (member, i){
          if(member['role'] === AppConstant.TEAM_ADMIN) {
            email = member['email'];
          }
        });
        this.email = email;
      }
    } else {

      this.email = (agentInfo && agentInfo.email) || '';
      if (this.email !== null && this.email !== '' && this.email.indexOf(',') !== -1) {
        const emails: Array<string> = this.email.split(',');
        this.email = emails[0].trim();
      }
    }
    this.nameOnCard = (agentInfo) ? (agentInfo.firstName + agentInfo.lastName) : '';
    const carElemOptions = {
      style: {
        base: {
          color: '#495057',
          fontFamily: '"Manrope", Arial',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#00000080',
            fontSize: '16px'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
      hidePostalCode: false
    };
    const card = elements.create('card', carElemOptions);
    card.mount('#cardElement');
    card.on('change', event => {
      const displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
        this.cardInputComplete = false;
      } else {
        displayError.textContent = '';
      }
      if (event.complete) {
        this.logger.debug('Card input completed');
        this.cardInputComplete = true;
      }
    });
    this.cardElem = card;
    this.logger.info('Stripe form initialized');
  }

  private createStripeToken(): Promise<any> {
    return this.stripe.createToken(this.cardElem, {name: this.nameOnCard});
  }

  stepChanged(step: NavigationStep) {
    if (this.stepNavService.isPreviousFromCurrent(step.id)) {
      this.handlePrevious(step);
    }
  }

  handleNext(step) {
    this.logger.info('handleNext', step);
    if (this.paymentForm.form.valid && this.cardInputComplete) {
      this.spinnerService.show();
      this.createStripeToken().then((result) => {
        if (result.error) {
          // Inform the user if there was an error.
          const errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          this.cardInputComplete = false;
          this.spinnerService.close();
        } else {
          result.payment_type = 'new'; // we are paying via new card always
          result.email = this.email;
          // Send the token to your server.
          this.logger.info('token result', result);
          this.payAndPublishService.initiatePayment(result).subscribe((respData) => {
            this.logger.info(respData);
            this.router.navigate([`../${RouteConstants.PAYMENT_DONE}`]);
          });
        }
      });
    }
  }

  submitPayment() {
    this.handleNext(this.stepNavService.nextStep());
  }

  handlePrevious(step: NavigationStep) {
    this.logger.info('handlePrevious', step);
    this.router.navigate(step.routeCommand);
  }

}
