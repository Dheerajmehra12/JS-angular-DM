import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/of';
import {WebStorageService} from '../../services/web-storage.service';
import {StorageKeys} from '../../services/common/constants/storage-keys';
import {HttpClient} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {ApiResponse} from '../../services/common/api-response';
import {map} from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class PayAndPublishService {
  constructor(private storageService: WebStorageService,
              private http: HttpClient,
              private logger: NGXLogger,
              ) {
  }

  getPaymentData() {
    const paymentData = {
      selectedPlan: null,
      footerBanner: undefined,
      campaignInfo: undefined,
      overlaybanner: true,
    };
    paymentData.footerBanner = this.storageService.get(StorageKeys.FOOTER_BANNER) || '';
    paymentData.selectedPlan = this.storageService.get(StorageKeys.SELECTED_PLAN) || {};
    paymentData.campaignInfo = this.storageService.get(StorageKeys.CAMPAIGN_INFO) || {};
    if (paymentData.campaignInfo && paymentData.campaignInfo.hasOwnProperty('overlaybanner')){
      paymentData.overlaybanner = paymentData.campaignInfo.overlaybanner;
    }
    return Observable.of(paymentData);
  }

  private preparePaymentRequest(result){
    const stripeCustomerId = this.storageService.get(StorageKeys.LOGGED_AS).stripeCustomerId;
    const req = {
      notifySuccessUrl: '',
      notifyCancelUrl: '',
      promoCode: '',
      notifyEmail: result.email,
      vendor: 'Stripe',
      currency: 'usd',
      stripeCardId: '',
      cardFingerPrint: '',
      stripeCustomerId: '',
      stripeCardToken: '',
      trailDurationInDays: 0,
    };
    if (result && result.payment_type === 'new'){
      req.cardFingerPrint = result.token.card.fingerprint;
      req.stripeCardToken = result.token.id;
    }else{
      req.stripeCardId = result.id;
    }
    return req;
  }

  initiatePayment(result) {
    const req = this.preparePaymentRequest(result);
    const campaignId = this.storageService.get(StorageKeys.CAMPAIGN_ID);
    return this.http.post<ApiResponse<any>>(`/api/proxy/ctv/initiatepayment/v1/${campaignId}`, req)
      .pipe(map((resp) => resp.response));
  }
}
