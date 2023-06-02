const path = require('path');
const APP_DIR = path.dirname(require.main.filename);
const MODULE_DIR = `${APP_DIR}/src/server/modules`;
const SERVICES_DIR = `${MODULE_DIR}/services`;
const ENVIRONMENT_DIR = `${APP_DIR}/src/server/environment`;
module.exports = {
    APP_DIR: APP_DIR,
    MODULE_DIR: MODULE_DIR,
    SERVICES_DIR: SERVICES_DIR,
    ENVIRONMENT_DIR: ENVIRONMENT_DIR
};
