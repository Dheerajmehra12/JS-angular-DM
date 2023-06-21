(function (window) {
  var AppConfig=function () {
    var env='local';
    var appConfig={
      local: {
        debugEnabled: true,
        gcaptchaSiteKey: '6LdpRDEUAAAAAL8jz573cJZ4UCCCN99JgaFM6NTs',
        gcaptchaSecretKey: '6LdpRDEUAAAAAHYKQNmqxym3zdFDhNu_UUgFeB7l',
        gcaptchaEnable: false,
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '$',
        currency: 'USD',
        homeCountry: 'US',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: 'http://localhost:9999/select-plan',
        // absUrl: '{ABS_SSO_URL}',
        appName: 'Angular-DM',
        appDisplayName: 'app',
        // switchAppUrl:'{SWITCH_APP_URL}'
      },
      staging: {
        debugEnabled: true,
        gcaptchaSiteKey: '6LdpRDEUAAAAAL8jz573cJZ4UCCCN99JgaFM6NTs',
        gcaptchaSecretKey: '6LdpRDEUAAAAAHYKQNmqxym3zdFDhNu_UUgFeB7l',
        gcaptchaEnable: false,
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '$',
        currency: 'USD',
        homeCountry: 'US',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: 'http://localhost:9999/select-plan',
        // absUrl: '{ABS_SSO_URL}',
        appName: 'Angular-DM',
        appDisplayName: 'app',
        // switchAppUrl:'{SWITCH_APP_URL}'
      },
      production: {
        debugEnabled: false,
        gcaptchaSiteKey: '6LdpRDEUAAAAAL8jz573cJZ4UCCCN99JgaFM6NTs',
        gcaptchaSecretKey: '6LdpRDEUAAAAAHYKQNmqxym3zdFDhNu_UUgFeB7l',
        gcaptchaEnable: false,
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '$',
        currency: 'USD',
        homeCountry: 'US',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: 'http://localhost:9999/select-plan',
        // absUrl: '{ABS_SSO_URL}',
        appName: 'Angular-DM',
        appDisplayName: 'app',
        // switchAppUrl:'{SWITCH_APP_URL}'
      }
    };
    if(appConfig[env]){
      return appConfig[env];
    }else{
      appConfig['staging'].gcaptchaEnable=false;
      // appConfig['staging'].notifyEmail='{STRIPE_NOTIFY_EMAIL}';
      // appConfig['staging'].almUrl='{ALM_SSO_URL}';
      // appConfig['staging'].almAdminUrl = '{ALM_SSO_URL_ADMIN}';
      // appConfig['staging'].atmUrl='{ATM_SSO_URL}';
      appConfig['staging'].appUrl='http://localhost:9999/select-plan';
      // appConfig['staging'].absUrl='{ABS_SSO_URL}';
      // appConfig['staging'].ssoBindingRedirect='{SSO_BINDING_REDIRECT}';
      appConfig['staging'].appName='Angular-DM';
      appConfig['staging'].appDisplayName='app';
      // appConfig['staging'].switchAppUrl='{SWITCH_APP_URL}';
    }
    return appConfig.staging;
  };
  window.appConfig = new AppConfig();
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    module.exports = window.appConfig;
  }
  return window.appConfig;
}(window));
