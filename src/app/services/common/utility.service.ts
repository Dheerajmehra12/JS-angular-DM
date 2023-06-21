import {Injectable} from '@angular/core';
import {AppConstant} from './constants/app-constant';
// import {TokenInterceptorService} from '../token-interceptor/token-interceptor.service';
import {NGXLogger} from 'ngx-logger';


@Injectable()
export class UtilityService {
  constructor(
    private logger: NGXLogger,
  ) {

  }
 public type:any
 public description:any
 public field:any
 public value:any 
 public matches:any
 public matchesTypeField:any
 public setValue:any
 
  sort_by_key(array, key) {
    return array.sort( (a, b) => {
      const x = a[key];
      const y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }

  isVoid(obj) {
    switch (typeof (obj)) {
      case 'undefined':
      case 'object':
        if (obj === null) {
          return true;
        }
        for (const x in obj) {
          if (obj.hasOwnProperty(x)) {
            return false;
          } else {
            return true;
          }
        }
        return true;
      case 'number':
      case 'boolean':
        return false;
      case 'string':
        if (obj === '') {
          return true;
        } else {
          return false;
        }
      default:
        return false;
    }
  }
  getFormattedAdLocations(adLocations, country) {
    let tempLocations = [];
    for (let j = 0; j < adLocations.length; j++) {
      var data = {};
      data['locationRadius'] = !this.isVoid(adLocations[j].locationRadius) ? adLocations[j].locationRadius : '';
      data['unit'] = !this.isVoid(adLocations[j].distanceUnit) ? adLocations[j].distanceUnit : '';
      data['id'] = !this.isVoid(adLocations[j].id) ? adLocations[j].id : '';
      data['locationRadius'] = !this.isVoid(adLocations[j].locationRadius) ? adLocations[j].locationRadius : '';
      data['unit'] = !this.isVoid(adLocations[j].distanceUnit) ? adLocations[j].distanceUnit : '';
      data['poiLocationId'] = !this.isVoid(adLocations[j].poiLocationId) ? adLocations[j].poiLocationId : '';
      data['businessName'] = !this.isVoid(adLocations[j].businessName) ? adLocations[j].businessName : '';
      data['streetName'] = !this.isVoid(adLocations[j].streetName) ? adLocations[j].streetName : '';
      data['cityName'] = !this.isVoid(adLocations[j].cityName) ? adLocations[j].cityName : '';
      data['dmaName'] = !this.isVoid(adLocations[j].dmaName) ? adLocations[j].dmaName : '';
      data['dma'] = !this.isVoid(adLocations[j].dmaName) ? adLocations[j].dma : '';
      data['state'] = !this.isVoid(adLocations[j].state) ? (adLocations[j].state ? (this.getStateCodeAbbrivation(country, adLocations[j].state).code ? this.getStateCodeAbbrivation(country, adLocations[j].state).code.toLowerCase() : adLocations[j].state) : adLocations[j].state) : '';
      data['zip'] = !this.isVoid(adLocations[j].zip) ? adLocations[j].zip : '';
      data['dma'] = !this.isVoid(adLocations[j].dma) ? adLocations[j].dma : '';
      data['country'] = !this.isVoid(adLocations[j].country) ? adLocations[j].country : '';
      data['lat'] = !this.isVoid(adLocations[j].lat) ? adLocations[j].lat : '';
      data['lon'] = !this.isVoid(adLocations[j].lon) ? adLocations[j].lon : '';
      data['contactName'] = !this.isVoid(adLocations[j].contactName) ? adLocations[j].contactName : '';
      data['email'] = !this.isVoid(adLocations[j].email) ? adLocations[j].email : '';
      data['phone'] = !this.isVoid(adLocations[j].phone) ? adLocations[j].phone : '';
      data['startDate'] = !this.isVoid(adLocations[j].startDate) ? adLocations[j].startDate : '';
      data['endDate'] = !this.isVoid(adLocations[j].endDate) ? adLocations[j].endDate : '';
      tempLocations.push(data);
    }
    return tempLocations;
  }
  capitalize(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getStateCodeAbbrivation(country, keyOrValue) {
    this.logger.info('keyOrValue', keyOrValue, 'country', country);
    if (this.isVoid(keyOrValue) || keyOrValue.length < 1) {
      return {value: '', lat: '', lon: '', fullForm: ''};
    }
    let stateList = {};
    if ('us' === country.toLowerCase() || 'united states' === country.toLowerCase()) {
      stateList = AppConstant.USA_STATE_LIST_DATA;
    }
    if ('ca' === country.toLowerCase() || 'canada' === country.toLowerCase()) {
      stateList = AppConstant.CANADA_STATE_LIST;
    }
    if ('de' === country.toLowerCase() || 'germany' === country.toLowerCase()) {
      stateList = AppConstant.GERMANY_STATE_LIST;
    }
    if ('es' === country.toLowerCase() || 'spain' === country.toLowerCase()) {
      stateList = AppConstant.SPAIN_STATE_LIST;
    }

    if ('ae' === country.toLowerCase() || 'united arab emirates' === country.toLowerCase()) {
      stateList = AppConstant.AE_STATE_LIST;
    }
    if ('mx' === country.toLowerCase() || 'mexico' === country.toLowerCase()) {
      stateList = AppConstant.MEXICO_STATE_LIST;
    }


    if (!this.isVoid(stateList[keyOrValue.toUpperCase()])) {
      return {
        value: keyOrValue,
        lat: parseFloat(stateList[keyOrValue.toUpperCase()].split(',')[1]),
        lon: parseFloat(stateList[keyOrValue.toUpperCase()].split(',')[2]),
        fullForm: stateList[keyOrValue.toUpperCase()].split(',')[0]
      };
    } else {
      const a = this.getKeyByValue(stateList, keyOrValue.toLowerCase());
      if (!this.isVoid(a)) {
        this.logger.info('stateList[a].split(\',\')', stateList[a].split(',')[1], 'state', stateList[a.toUpperCase()].split(',')[0]);
        return {
          value: a.toLowerCase(),
          lat: parseFloat(stateList[a].split(',')[1]),
          lon: parseFloat(stateList[a].split(',')[2]),
          fullForm: stateList[a.toUpperCase()].split(',')[0],
          code: a
        };
      } else {
        return {value: keyOrValue, lat: '', lon: '', fullForm: keyOrValue};
      }
    }
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key].split(' ').join('').toLowerCase().indexOf(value.split(' ').join('')) !== -1);
  }
  removeDuplicatesByKeyValue(keyFn, array) {
    let mySet = new Set();
    return array.filter(function (x) {
      let key = keyFn(x), isNew = !mySet.has(key);
      if (isNew) mySet.add(key);
      return isNew;
    });
  }

  buildArrayToCsv(data) {
    let csvData = "";
    var _t = this;
    data.map(function (rowArray) {
      rowArray = rowArray.map((data) => { return !_t.isVoid(data) ? ((data.includes(',')) ? '"' + data + '"' : data) : data })
      let row = rowArray.join(",");
      csvData += row + "\r\n"; // add carriage return
    });
    return csvData
  }

    

   SearchCriteria(type, description, field, value) {
    this.type = type;
    this.description = description;
    this.field = field;
    this.value = value;
    var self = this;

    this.matches = function (selectedCriteria) {
      
        if (typeof selectedCriteria !== 'undefined') {
            if (typeof self.type !== 'undefined' && typeof selectedCriteria.type !== 'undefined' && self.type === selectedCriteria.type) {
                if (typeof self.field !== 'undefined' && typeof selectedCriteria.field !== 'undefined' && self.field === selectedCriteria.field) {
                    if (typeof self.value !== 'undefined' && typeof selectedCriteria.value !== 'undefined' && self.value.trim().toLowerCase() === selectedCriteria.value.trim().toLowerCase()) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    this.matchesTypeField = function (selectedCriteria) {
      // console.log(selectedCriteria,"from match feild 193")
        if (typeof selectedCriteria !== 'undefined') {
          
            if (typeof self.type !== 'undefined' && typeof selectedCriteria.type !== 'undefined' && self.type === selectedCriteria.type) {
                  
              if (typeof self.field !== 'undefined' && typeof selectedCriteria.field !== 'undefined' && self.field === selectedCriteria.field) {
          
                return true;
                }
            }
        }

        return false;
    };
    this.setValue =  (value)=> {
        self.value = value;
        console.log(self,"self values")
        return self;
    };
    return this;
}

addCriteria = function(list, selectedCriteria, callback) {
  if(Array.isArray(list) && typeof selectedCriteria !== 'undefined' && typeof selectedCriteria === 'object') {
      var foundAt = list.findIndex(source => source.matches(selectedCriteria));
      if(foundAt === -1) {
          list.push(selectedCriteria);
      }else{
          list[foundAt].setValue(selectedCriteria.value);
      }
      if(typeof callback!== 'undefined' && typeof callback === "function"){
          callback();
      }
  }
}; 
removeCriteria = function(list, selectedCriteria) {
  if(Array.isArray(list) && typeof selectedCriteria !== 'undefined' && typeof selectedCriteria === 'object') {
      var foundAt = list.findIndex(source => source.matches(selectedCriteria));
      if(foundAt !== -1) {
          return list.slice(0, foundAt)
              .concat(list.slice(foundAt+1));
      }
  }
  return list;
};
copyCriteria = function (selectedCriteria) {
  return new UtilityService(this.logger).SearchCriteria(selectedCriteria.type, selectedCriteria.description, selectedCriteria.field, selectedCriteria.value);
};
newInstance = function (selectedCriteria) {
  return this.copyCriteria(selectedCriteria);
}; 


}
