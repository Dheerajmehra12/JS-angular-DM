module.exports = function() {
    const fs=require('fs');
    const appConstants = require('../app-constants');
    const path=require('path');
    const logger = require(appConstants.MODULE_DIR + '/logger-module');

    function readConfigFile(config, logErr=true) {
        let filePath=path.join(appConstants.APP_DIR,`/src/config/${config}-config.json`);
        try {
            logger.debug(`Reading config file: ${filePath}`);
            let data = fs.readFileSync(filePath);
            return JSON.parse(data.toString());
        } catch (err) {
            var errorMessage=`There was an error reading file:${filePath}`;
            if(logErr){
                logger.error(errorMessage);
                logger.error(err);
            }else{
                logger.warn(errorMessage);
            }
        }
        return null;
    }

    function loadThemeConfiguration(themeName, configFileName, useDefault=true) {
        let logErr=!useDefault;
        let configData=readConfigFile(`${themeName}-${configFileName}`, logErr);
        if(useDefault && configData===null){
            configData=readConfigFile(`default-${configFileName}`, logErr);
        }
        return configData;
    }

    return {
        theme: function (host) {
            let key=host.trim();
            if(host.indexOf(':')!==-1){
                key=host.split(':')[0].trim();
            }
            logger.info(`Calculated Host: ${key}`);
            let config=readConfigFile('hosts-theme');
            let themeName='default';
            if(config && config[key]){
                themeName=config[key];
            }else{
                logger.warn(`No theme mapped for host: ${key}`);
                logger.warn('Default theme will be loaded');
            }
            let themeData=loadThemeConfiguration(themeName,'theme');
            //let brandingTemplates=loadThemeConfiguration(themeName,'branding-templates');
            //let brandingTemplatesEditConfig=loadThemeConfiguration(themeName,'branding-templates-edit');
            let purechatHostsConfig=readConfigFile('hosts-purechat');
            let purechatConfig=null;
            if(purechatHostsConfig) {
                if(purechatHostsConfig[key]) {
                    purechatConfig=purechatHostsConfig[key];
                }else{
                    purechatConfig=purechatHostsConfig['default'];
                }
            }
            return {
                themeName:themeName,
                themeData:themeData,
                // brandingTemplates:brandingTemplates,
                // brandingTemplatesEditConfig:brandingTemplatesEditConfig,
                purechatConfig:purechatConfig
            };
        },
        readConfigFile: readConfigFile
    }
};

