// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {NgxLoggerLevel} from 'ngx-logger';
declare const appConfig: any;

export const environment = {
  production: false,
  loggerConfig: {level: NgxLoggerLevel.DEBUG, serverLogLevel: NgxLoggerLevel.OFF},
  atmUrl: appConfig.atmUrl,
  almUrl: appConfig.almUrl,
  almAdminUrl: appConfig.almAdminUrl,
  appUrl: appConfig.appUrl,
  absUrl: appConfig.absUrl,
  hideAlm: false,
  hideAtm: false,
  hideCtv: false,
  hideAbs: false,
  hideLanguageOptionFromMenu:false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
