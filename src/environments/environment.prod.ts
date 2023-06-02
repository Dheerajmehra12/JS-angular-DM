import {NgxLoggerLevel} from 'ngx-logger';
declare const appConfig: any;

export const environment = {
  production: true,
  loggerConfig: {level: NgxLoggerLevel.ERROR, serverLogLevel: NgxLoggerLevel.OFF},
  atmUrl: appConfig.atmUrl,
  almUrl: appConfig.almUrl,
  almAdminUrl: appConfig.almAdminUrl,
  appUrl: appConfig.appUrl,
  absUrl: appConfig.absUrl,
  hideAlm: false,
  hideAtm: false,
  hideCtv: false,
  hideAbs: false,
  hideLanguageOptionFromMenu:true
};
