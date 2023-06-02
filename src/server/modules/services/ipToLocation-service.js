module.exports = function () {
  const appConstants = require('../../app-constants');
  const logger = require(appConstants.MODULE_DIR + '/logger-module');
  const utility = require(appConstants.MODULE_DIR + '/utility-module')();
  const productionEnv = require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/production.env'}).parsed;
  function fetchIp(req) {
    let xForwardedForHeader = req.headers['x-forwarded-for'] || '';
    if(xForwardedForHeader.indexOf(',')!==-1) {
      xForwardedForHeader = xForwardedForHeader.split(',')[0].trim();
    }
    let remoteAddress = req.connection.remoteAddress;
    if (xForwardedForHeader) {
      logger.info(`req.headers['x-forwarded-for']:: ${xForwardedForHeader}`);
      return xForwardedForHeader;
    } else if (remoteAddress) {
      logger.info(`req.connection.remoteAddress:: ${remoteAddress.split(':').pop()}`);
      return remoteAddress.split(':').pop();
    } else {
      logger.info("unable to fetch client IP Address.");
      return '127.0.0.1';
    }
  }

  function prepareCommonHeaders(request) {
    let headers = {};
    logger.info(`X-CHALK-IP: ${utility.getClientIP(request)}, X-CHALK-CK: ${request.headers['x-chalk-ck']}`);
    logger.info(`X-FORWARDED-FOR ${request.headers['x-forwarded-for'] || ''}`);
    headers['X-CHALK-IP'] = utility.getClientIP(request);
    headers['X-CHALK-CK'] = request.headers['x-chalk-ck'] || '';
  }

  function ipToLocationHandler(req, res) {
    logger.info("ipToLocation");
    const request = require('request');
    let responseProfile;

    let ip = fetchIp(req);
    logger.info(`ip:: ${ip}`);

    if (ip) {
      ip = ip.toString();
      ip = ip.replace(/\s/g, '');
    }
    let headers = prepareCommonHeaders(req);
    // const ipToLocationUrl = `http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/geocode/ip2geo/v1?ip=${ip}`;
    const ipToLocationUrl = `http://${productionEnv.API_HOST}:${productionEnv.API_HOST_PORT}/geocode/ip2geo/v1?ip=${ip}`;
    const options = {
      url: ipToLocationUrl,
      headers: headers
    };
    logger.info(`options:: ${JSON.stringify(options)}`);

    request.get(options, function (error, response, body) {
      if (response && response.statusCode === 401) {
        logger.info(`Response Status is ${response.statusCode} UnAuthorized Call`);
        return res.status(401).send({'message': 'Unauthorized'});
      } else if (!error && response && response.statusCode === 200) {
        // var responseProfile = body;
        if (toString.call(body) === "[object Object]") {
          responseProfile = body;
        } else {
          responseProfile = JSON.parse(body);
        }
        logger.info(`ipToLocation response:: ${JSON.stringify(responseProfile)}`);
        if (responseProfile.status === 0) {
          res.json({
            'status': 'success',
            'response': responseProfile.response
          });
          logger.info("successfully called ipToLocation");

        } else {
          res.json({
            "status": "failure",
            "message": "Error while fetching lat and lang.",
            "errorcode": responseProfile.edesc
          });
        }

      } else {
        res.json({
          "status": "failure",
          "message": "Error while fetching lat and lang.",
          "errorcode": 500
        });
      }
    });
  }

  return {
    ipToLocationHandler: ipToLocationHandler,
  }
};
