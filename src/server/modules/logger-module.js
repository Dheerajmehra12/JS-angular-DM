const pino = require('pino');
const appConstants = require('../app-constants');
const moment = require('moment');
require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;

let loggerOptions={};

let timestamp = ()=>{
    let millis=moment();
    return ',"time":"' + millis.format(moment().ISO_8601) + '"';
};

let logger=null;
if(!process.env.ENV){
    loggerOptions={
        prettyPrint: { colorize: true },
        timestamp:timestamp,
        level: process.env.LOG_LEVEL || 'info',
        base:null
    };
    logger=pino(loggerOptions);
}else{
    loggerOptions={
        prettyPrint: process.env.LOG_PRETTY_PRINT || false,
        timestamp:timestamp,
        level: process.env.LOG_LEVEL || 'info',
        base:null
    };
    const fs = require('fs');
    fs.writeFileSync(appConstants.APP_DIR + '/logs/ctv_' + (process.env.ENV || '') + '.pid', '' + process.pid);
    let rotatingLogStream = require('file-stream-rotator').getStream({filename:appConstants.APP_DIR+"/logs/app-%DATE%.log", frequency:"daily", verbose: false, max_logs: 7});
    rotatingLogStream.on('rotate', function (oldFile, newFile) {
        console.log(`Log file changed from ${oldFile} to ${newFile}`);
    });
    logger=pino(loggerOptions,rotatingLogStream);
}
module.exports = logger;
