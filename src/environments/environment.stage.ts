import {NgxLoggerLevel} from 'ngx-logger';
declare const appConfig: any;

export const environment = {
  production: false,
  loggerConfig: {level: NgxLoggerLevel.INFO, serverLogLevel: NgxLoggerLevel.OFF},
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
