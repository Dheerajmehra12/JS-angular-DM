import { Pipe, PipeTransform } from '@angular/core';
import {AppConstant} from '../services/common/constants/app-constant';
import {UtilityService} from '../services/common/utility.service';

@Pipe({
  name: 'targetLocationFormat'
})
export class TargetLocationFormatPipe implements PipeTransform {

  constructor(private util: UtilityService) {
  }

  getCountryName(code) {
    const countryOptions = AppConstant.SUPPORTED_COUNTRY;
    let country = '';
    for (let i = 0; i < countryOptions.length; i++) {
      if (code === countryOptions[i].code.toLowerCase()) {
        country = countryOptions[i].name;
      }
    }
    return country;
  }

  transform(value: any, ...args: any[]): string {
    if (typeof value !== 'undefined' && value !== null && typeof value === 'object') {
      const streetName = value.streetName || '';
      const cityName = value.cityName || '';
      const state = value.state || '';
      const zip = value.zip || '';
      const country = value.country || '';
      const addressField = [];
      if (streetName.trim() !== '') {
        addressField.push(streetName.trim());
      }
      if (cityName.trim() !== '') {
        addressField.push(cityName.trim());
      }
      if (state.trim() !== '') {
        const stateName = this.util.getStateCodeAbbrivation(country, state).fullForm;
        addressField.push(stateName.trim());
      }
      if (zip.trim() !== '') {
        addressField.push(zip.trim());
      }
      if (country.trim() !== '') {
        addressField.push(this.getCountryName(country));
      }
      return addressField.join(', ');
    }
    return '';
  }

}
