import {DEFAULT_CURRENCY_CODE, Inject, Injectable} from '@angular/core';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../services/common/api-response';
import {Observable} from 'rxjs';
import {NGXLogger} from 'ngx-logger';
import {CurrencyPipe} from '@angular/common';
declare const appConfig: any;

export interface Plan {
  id: number;
  title: string;
  currency: string;
  pricing: string;
  budget: number;
  line1: string;
  line2: string;
  planType: string;
  period: string;
  totalImpressions: number;
}

export interface PlansMap {
  [key: number]: Plan;
}

export interface PlanRespObj {
  budget: number;
  currency: string;
  deleted: number;
  discount: number;
  durationInDays: number;
  id: number;
  line1: string;
  line2: string;
  line3: string;
  planType: string;
  popular: number;
  stripePlanId: string;
  title: string;
  title2: string;
  totalImpressions: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  constructor(private http: HttpClient,
              private logger: NGXLogger,
              private currencyPipe: CurrencyPipe,
              @Inject(DEFAULT_CURRENCY_CODE) private defaultCurrencyCode: string,
  ) {
  }

  getPlansMap() {
    return this.getPlans().pipe(map((plans) => {
      const plansMap: PlansMap = {} as PlansMap;
      plans.forEach(( plan) => {
        plansMap[plan.id] = plan;
      });
      return plansMap;
    }));
  }

  getPlans() {
    return this.http.get<ApiResponse<Array<PlanRespObj>>>('/api/proxy/ctv/pricing/v1')
      .pipe(map((planResp) => {
        const planRespObj = planResp.response;
        const plans = new Array<Plan>();
        if (planResp.response && planResp.response.length > 0) {
          const ctvPlans: Array<PlanRespObj> = planResp.response;
          ctvPlans.forEach((plan) => {
            const currencyCode = (plan.currency) ? plan.currency.trim().toUpperCase() : this.defaultCurrencyCode;
            plans.push({
              id: plan.id,
              currency: currencyCode,
              title: `${plan.totalImpressions} ${appConfig.appDisplayName} Ads`,
              budget: plan.budget,
              pricing: this.currencyPipe.transform(plan.budget, currencyCode, 'symbol', '0.0-2'),
              line1: plan.line1,
              line2: 'Target Ad by One or More Zip Codes',
              planType: (plan.planType && plan.planType.trim().toLowerCase() === 'monthly') ? 'Per Month' : plan.planType || '',
              totalImpressions: plan.totalImpressions,
              period: plan.planType,
            });
          });
        }
        return plans;
      }), catchError((error) => {
        this.logger.error('getPlans Error', error);
        return Observable.of([] as Array<Plan>);
      }));
  }
}
