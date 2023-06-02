(function (window) {
    window.__env = window.__env || {};
    window.__env.stripeKey = '{STRIPE_KEY}';
    window.__env.enableDebug = {STRIPE_DEBUG_MODE};
    if ( typeof module === "object" && typeof module.exports === "object" ) {
      module.exports = window.__env;
    }
    return window.__env;
}(window));
