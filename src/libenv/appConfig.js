(function (window) {
  var AppConfig=function () {
    var env='{ENV}';
    var appConfig={
      local: {
        debugEnabled: true,
        gcaptchaSiteKey: '{CAPTCHA_SITE_KEY}',
        gcaptchaSecretKey: '{CAPTCHA_SERVER_KEY}',
        gcaptchaEnable: {CAPTCHA_ENABLE},
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '{CURRENCY_SYMBOL_DEFAULT}',
        currency: '{CURRENCY_DEFAULT}',
        homeCountry: '{HOME_COUNTRY}',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: '{APP_URL}',
        // absUrl: '{ABS_SSO_URL}',
        appName: '{APP_NAME}',
        appDisplayName: '{APP_NAME_DISPLAY}',
        // switchAppUrl:'{SWITCH_APP_URL}'
      },
      staging: {
        debugEnabled: true,
        gcaptchaSiteKey: '{CAPTCHA_SITE_KEY}',
        gcaptchaSecretKey: '{CAPTCHA_SERVER_KEY}',
        gcaptchaEnable: {CAPTCHA_ENABLE},
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '{CURRENCY_SYMBOL_DEFAULT}',
        currency: '{CURRENCY_DEFAULT}',
        homeCountry: '{HOME_COUNTRY}',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: '{APP_URL}',
        // absUrl: '{ABS_SSO_URL}',
        appName: '{APP_NAME}',
        appDisplayName: '{APP_NAME_DISPLAY}',
        // switchAppUrl:'{SWITCH_APP_URL}'
      },
      production: {
        debugEnabled: false,
        gcaptchaSiteKey: '{CAPTCHA_SITE_KEY}',
        gcaptchaSecretKey: '{CAPTCHA_SERVER_KEY}',
        gcaptchaEnable: {CAPTCHA_ENABLE},
        // notifyEmail: '{STRIPE_NOTIFY_EMAIL}',
        // ssoBindingRedirect: '{SSO_BINDING_REDIRECT}',
        environment: env,
        currencySymbol: '{CURRENCY_SYMBOL_DEFAULT}',
        currency: '{CURRENCY_DEFAULT}',
        homeCountry: '{HOME_COUNTRY}',
        // almUrl: '{ALM_SSO_URL}',
        // almAdminUrl: '{ALM_SSO_URL_ADMIN}',
        // atmUrl: '{ATM_SSO_URL}',
        appUrl: '{APP_URL}',
        // absUrl: '{ABS_SSO_URL}',
        appName: '{APP_NAME}',
        appDisplayName: '{APP_NAME_DISPLAY}',
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
      appConfig['staging'].appUrl='{APP_URL}';
      // appConfig['staging'].absUrl='{ABS_SSO_URL}';
      // appConfig['staging'].ssoBindingRedirect='{SSO_BINDING_REDIRECT}';
      appConfig['staging'].appName='{APP_NAME}';
      appConfig['staging'].appDisplayName='{APP_NAME_DISPLAY}';
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
