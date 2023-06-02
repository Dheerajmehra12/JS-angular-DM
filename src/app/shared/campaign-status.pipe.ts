import { Pipe, PipeTransform } from '@angular/core';

export enum CAMPAIGN_STATUS {
  NEW = -1,
  CANCELLED = 0,
  ACTIVE = 1,
  UNPAID = 2,
  PREPAID = 3,
  FINISHED = 4,
  PROCESSING = 5,
  PENDING = 6,
}

export function transformCampaignStatus(value: number): string {
  if (typeof value !== 'undefined') {
    if (value === CAMPAIGN_STATUS.NEW) {
      return 'New';
    }else if (value === CAMPAIGN_STATUS.CANCELLED) {
      return 'Cancelled';
    }else if (value === CAMPAIGN_STATUS.ACTIVE) {
      return 'Active';
    }else if (value === CAMPAIGN_STATUS.UNPAID) {
      return 'Unpaid';
    }else if (value === CAMPAIGN_STATUS.PREPAID) {
      return 'Prepaid';
    }else if (value === CAMPAIGN_STATUS.FINISHED) {
      return 'Finished';
    }else if (value === CAMPAIGN_STATUS.PROCESSING) {
      return 'Processing';
    }else if (value === CAMPAIGN_STATUS.PENDING) {
      return 'Pending';
    }else {
      return '' + value;
    }
  }
  return '';
}
@Pipe({
  name: 'campaignStatus'
})
export class CampaignStatusPipe implements PipeTransform {

  transform(value: number, ...args: number[]): string {
    return transformCampaignStatus(value);
  }

}
