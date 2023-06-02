const express = require('express');
const app = express();
var compression = require('compression');
app.use(compression());
const appConstants = require('./src/server/app-constants');
const logger = require(appConstants.MODULE_DIR + '/logger-module');
const envConfig = require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;

require(appConstants.MODULE_DIR + '/route-module')(express,app);

logger.debug('Environment [%s] : envConfig = [%s]',process.env.ENV||'Non Production',JSON.stringify(envConfig));

//default port
let listenPort = 9999;

//overriding port from value in ${ENV}.env file
if(envConfig && envConfig.LISTEN_PORT) {
    listenPort=envConfig.LISTEN_PORT;
}

//overriding port value from command args
if (process.argv.length >= 3) {
    listenPort = process.argv[2];
}

app.listen(listenPort, () => logger.info(`server is listening on ${listenPort}`));
