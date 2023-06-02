module.exports = function () {
  const appConstants = require('../../app-constants');
  const logger = require(appConstants.MODULE_DIR + '/logger-module');

  function fbd(id, index, request, res, finalDataArray, cityZip, country) { //  Fbd- Fatch boundary data
    if (index < id.length - 1) {
      index += 1;
      cityBoundaryFetch(id, index, request, res, finalDataArray, cityZip, country);
    } else {
      res.json({"status": "success", data: finalDataArray});
    }
  }

  function cityBoundaryFetch(id, index, request, res, finalDataArray, cityZip, country) {
    const resData = id[index];
    let url = "http://cdn.cmcd1.com/location_data/" + cityZip + "/" + resData + ".txt";

    if (cityZip === 'zipcode') {
      url = "https://cdn.cmcd1.com/location_data/geo_zip_" + country + "/" + resData + ".json";
    } else if (cityZip === 'cities') {
      url = "https://cdn.cmcd1.com/location_data/geo_city_state_" + country + "/" + resData + ".json";
    }
    logger.info(`cityBoundaryFetch ${url}`);

    request(url, function (error, response) {
      try {
        if (!error && response.statusCode === 200) {
          if (cityZip === 'zipcode') {
            const locationObject = JSON.parse(response.body);
            locationObject['zip'] = resData;
            finalDataArray.push(locationObject);
          } else {
            const locationObject = JSON.parse(response.body);
            locationObject['city'] = resData;
            finalDataArray.push(locationObject);
          }

        } else if (response && response.statusCode === 401) {
          finalDataArray = null;
          return res.send(401, {message: "Unauthorized"});
        } else {
          let data = {};
          if (cityZip === 'zipcode') {
            logger.info('data not found');
            data = {zip: resData, features: []};
          } else if (cityZip === 'cities') {
            data = {city: resData, area: []};
          }
          finalDataArray.push(data);
        }
      } catch (e) {
        logger.error(e);
        let data = {};
        if (cityZip === 'zipcode') {
          data = {zip: resData, features: []};
        } else if (cityZip === 'cities') {
          data = {city: resData, area: []};
        }
        finalDataArray.push(data);
      }
      fbd(id, index, request, res, finalDataArray, cityZip, country);
    });
  }

  function boundariesHandler(req, res) {
    const request = require('request');
    let id = req.query.id || '';
    id = (id && id.indexOf(',') !==-1 ) ? id.split(','):[id];
    const country = req.query.country;
    const from = req.query.from;
    const i = 0;
    logger.info(`Id is here : ${id}`);
    logger.info(`${from} Boundary Called :${id}`);
    const cityBoundaryArray = [];
    cityBoundaryFetch(id, i, request, res, cityBoundaryArray, from, country);
  }

  return {
    boundariesHandler: boundariesHandler,
  }

};
