module.exports = function () {
    const appConstants = require('../../app-constants');
    require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
    const logger = require(appConstants.MODULE_DIR+ '/logger-module');
    const api = require(appConstants.MODULE_DIR+ '/api-module')();
    const request = require('request');

    function consume_assertion(req, res) {
        const host = process.env.API_HOST;
        const port = process.env.API_HOST_PORT;
        const local_redirect = process.env.SSO_LOCAL_REDIRECT_PAGE;
        logger.info(`Consume ASSERTION for the request [${(req.body !== undefined) ? JSON.stringify(req.body) : 'no data in request body'}]`);
      if (req.body !== undefined) {
        consume_assertion_body = {
          url: "http://" + host + ":" + port + "/magnet/acl",
          method: 'post',
          form: {'SAMLResponse': req.body['SAMLResponse']},
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        };
        request(consume_assertion_body, network_callback);
      } else {
        error = {status: 400};
        api.errorHandler(error, req, res, null);
      }
        function network_callback(error, response, body) {
            logger.info(`Response status [${response.statusCode}]`);
            if (response.statusCode === 200) {
                logger.info(`callback got [${JSON.stringify(error)}] body [${JSON.stringify(body)}]`);
                var json = JSON.parse(body);
                var redirectUrl = local_redirect + "e=200&l=1&t=" + encodeURIComponent(json.response.token) + "&c=" + encodeURIComponent(json.response.xpressdocCode);
                logger.info(`Redirect to [${redirectUrl}]`);
                res.redirect(redirectUrl);
            } else if (response.statusCode === 401) {
                logger.info("UnAuthorized access");
                error = {status: response.statusCode};
                api.errorHandler(error, req, res, null);
            } else {
                logger.info("Unknown status");
                if (req.body === undefined) {
                    error = {status: 400}
                } else {
                    error = {status: response.statusCode};
                }
                api.errorHandler(error, req, res, null);
            }
        }
    }
    function consume_assertion_rews(req,res) {
      logger.info(`SAML Request received from REWS`);
      consume_assertion(req,res);
    }
    function consume_assertion_hsf(req,res) {
      logger.info(`SAML Request received from HSF`);
      consume_assertion(req,res);
    }
    return {
        consume_assertion: consume_assertion_hsf,
        consume_assertion_rews: consume_assertion_rews,
    }
};
