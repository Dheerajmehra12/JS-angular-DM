module.exports = function () {
  const appConstants = require('../../app-constants');
  const logger = require(appConstants.MODULE_DIR + '/logger-module');
  function validator(urls, counter, request, res) {
      const urlObj = urls[counter];
      request.head(urlObj.url, function (error, response, body) {
          try {
            if (!error && response && response.statusCode === 200) {
              urls[counter]["validate"] = true;
            }
            else {
              urls[counter]["validate"] = false;
            }

            if (urls.length - 1 === counter) {
              res.json({
                "status": "success",
                "data": urls,
              });
            }
            else {
              validator(urls, counter + 1, request, res)
            }
          }
          catch (e) {
            logger.error("exception");
            logger.error(e);
            urls[counter]["validate"] = false;
            if (urls.length - 1 === counter) {
              res.json({
                "status": "success",
                "data": urls,
              });
            }
            else {
              validator(urls, counter + 1, request, res)
            }
          }
        });
      }

    function validateUrl(req, res) {
        var request = require('request');
        var urls = req.body.urlList;
        var counter = 0
        validator(urls, counter, request, res)
    }
    return {
        validateUrl: validateUrl,
    }
};
