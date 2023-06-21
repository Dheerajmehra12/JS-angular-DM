const appConstants = require('../../app-constants');
const logger = require(appConstants.MODULE_DIR + '/logger-module');
const utility = require(appConstants.MODULE_DIR + '/utility-module')();
const needle = require('needle');
const path = require('path');
require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
const USERS_FILE = path.join(appConstants.APP_DIR,`/src/server/modules/services/users.json`)

const fs=require('fs');


function prepareCommonHeaders(request) {
    // let headers = {};
    // logger.info(`X-CHALK-IP: ${utility.getClientIP(request)}, X-CHALK-CK: ${request.headers['x-chalk-ck']}`);
    // logger.info(`X-FORWARDED-FOR ${request.headers['x-forwarded-for']||''}`);
    // headers['X-CHALK-IP'] = utility.getClientIP(request);
    // headers['X-CHALK-CK'] = request.headers['x-chalk-ck'] || '';
}

module.exports = function () {

    
// Read existing user data from JSON file
function readUsersFromFile() {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8'); 
      return JSON.parse(data);
    } else {
      return [];
    }
  }

    async function myLoginAPI (req, res){
        let username = req.query.username ||req.body.username;
        let password = req.query.password || req.body.password;
        username = (typeof username==="number")?username.toString():username;
        password = (typeof password==="number")?password.toString():password;

        // Read user data from file
        let fileData = await readUsersFromFile();
        let users = [];
        console.log("typeofusers",typeof fileData)
        if(typeof fileData ==="object" && fileData!==null){
          users = fileData.users?fileData.users:[];
        }
        // Find user by username and password
        if (Array.isArray(users)) {
          // Find user by username and password
          console.log(users);
          const user = users.find((u) => u.username.toLowerCase() == username.toLowerCase() && u.password == password);

          if (user) {
            res.json({ message: 'Login successful!', user });
          } else {
            res.status(401).json({ message: 'Invalid credentials' });
          }
        } else {
          res.status(500).json({ message: 'Error reading user data' });
        }
    }
    
    async function createAccount(req,res){
        const { username, password } = req.body;
        console.log("username",username,password);

        // Read user data from file
        let users = await readUsersFromFile();
        console.log( "username",username,"users",users);

        // Check if the username is already taken
        const existingUser = users.find((u) => u.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exist' });
        }

        // Create a new user
        const newUser = { id: users.length + 1, username, password };
        users.push(newUser);

        // Save the updated user data to JSON file
        await saveUsersToFile(users);
        res.json({ message: 'Account created successfully!', user: newUser });
    }

    // Save user data to JSON file
    function saveUsersToFile(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users), 'utf8');
  }

















    function loginHandler(request, response) {

        // let reqUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/login/v1`;
        // logger.info(`Login request body: ${JSON.stringify(request.body)}`);
        // let headers = prepareCommonHeaders(request);

        // let authStage1=needle('post', reqUrl, request.body, {headers: headers, json: true})
        //     .then(function (res) {
        //         logger.info(`Login Response Stage1 Http Status: ${res.statusCode}`);
        //         let respTemplate={
        //             status: 0,
        //             ecode: 0,
        //             edesc: null,
        //             response: null
        //         };
        //         if(res.statusCode===200) {
        //             respTemplate.status=res.body.status;
        //             respTemplate.ecode=res.body.ecode;
        //             respTemplate.edesc='Authorized Stage 1 Completed';
        //             respTemplate.response=res.body.response;
        //         }else{
        //             respTemplate.status=res.statusCode;
        //             respTemplate.ecode=res.statusCode;
        //             respTemplate.edesc='Unauthorized'
        //         }
        //         return respTemplate;
        //     }).catch(function (err) {
        //         let errorResponse={
        //             status: 500,
        //             ecode: 500,
        //             edesc: 'Internal server error stage 1 authorization',
        //             response: null
        //         };
        //         logger.error(err);
        //         return errorResponse;
        //     });

        // authStage1.then(function (data) {
        //     if(data.response!==null) {
        //         authStage2(data.response.token, data.response.xpressdocCode,headers).then(function (resp) {
        //             response.json(resp);
        //         });
        //     }else{
        //         response.json(data);
        //     }
        // });
    }

    function authStage2(token, xpressdocCode, httpHeaders) {
        // let reqUrl2=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/fetchtokendata/v1/${xpressdocCode}`;
        // logger.info(reqUrl2);
        // let headers = httpHeaders || {};
        // headers['Authorization'] = 'Bearer ' + token;
        // let options = {headers: headers};
        // return needle('get', reqUrl2, {}, options).then(function (resp) {
        //     logger.info(`Login Response Stage2 Http Status: ${resp.statusCode}`);
        //     if(resp.statusCode===200){
        //         return resp.body;
        //     }else{
        //         return {
        //             status: resp.statusCode,
        //             ecode: resp.statusCode,
        //             edesc: resp.body,
        //             response: null
        //         };
        //     }
        // }).catch(function (err) {
        //     logger.error(err);
        //     return {
        //         status: 500,
        //         ecode: 500,
        //         edesc: 'Internal server error stage 2 authorization',
        //         response: null
        //     };
        // });
    }

    async function refreshTokenService(refreshToken) {
        // logger.info(`Invoking refreshTokenService with refreshToken: ${refreshToken}`);
        // let reqTokenUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/refreshtoken/v1`;
        // let refreshTokenResp=await needle('post', reqTokenUrl, {refreshtoken: refreshToken}, {json: true}).then(function (resp) {
        //     logger.info(`Refresh token Response Http Status: ${resp.statusCode}`);
        //     return resp.body;
        // }).catch(function (err) {
        //     logger.error(err);
        //     return {
        //         status: 500,
        //         ecode: 500,
        //         edesc: 'Internal server error Refresh token',
        //         response: null
        //     };
        // });
        // logger.info(`refreshTokenResp: ${JSON.stringify(refreshTokenResp)}`);
        // return refreshTokenResp;
    }

    function openLink(httpReq, httpRes) {
        // let authParams = readAuthParams(httpReq);
        // doAuthWithRefreshTokenRetry(authParams.headers, authParams.xpressdocCode, authParams.token, authParams.refreshToken)
        //     .then(function (resp) {
        //     httpRes.json(resp);
        // });
    }

    function readAuthParams(httpReq) {
        // let headers = prepareCommonHeaders(httpReq);
        // let token = httpReq.query.token || '';
        // let xpressdocCode = httpReq.query.xpressdocCode || httpReq.query.tokenCode || '';
        // let refreshToken = httpReq.query.refreshToken || '';
        // let redirectURL = httpReq.query.redirectURL || '';
        // return {
        //     headers: headers,
        //     token: token,
        //     xpressdocCode: xpressdocCode,
        //     refreshToken: refreshToken,
        //     redirectURL: redirectURL,
        // };
    }

    function doAuthWithRefreshTokenRetry(headers, xpressdocCode, token, refreshToken) {
        // return authStage2(token, xpressdocCode, headers).then(function (resp) {
        //     if(resp.status===401 && refreshToken!=='') {
        //         return refreshTokenService(refreshToken).then(function (refreshTokenResp) {
        //             if (refreshTokenResp.response && refreshTokenResp.response.token) {
        //                 return authStage2(refreshTokenResp.response.token, xpressdocCode, headers)
        //                   .then(function (retryResp) {
        //                     retryResp.response.loginInfo.token=refreshTokenResp.response.token;
        //                     retryResp.response.loginInfo.refreshToken=refreshTokenResp.response.refreshToken;
        //                     return retryResp;
        //                 });
        //             }else{
        //                 return refreshTokenResp;
        //             }
        //         });
        //     }else{
        //         return resp;
        //     }
        // });
    }

    return {
        loginHandler:loginHandler,
        openLink:openLink,
        doAuthWithRefreshTokenRetry:doAuthWithRefreshTokenRetry,
        readAuthParams:readAuthParams,


        createAccount:createAccount,
        myLoginAPI:myLoginAPI
    }
};
