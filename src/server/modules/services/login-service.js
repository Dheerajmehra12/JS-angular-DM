const appConstants = require('../../app-constants');
const logger = require(appConstants.MODULE_DIR + '/logger-module');
const utility = require(appConstants.MODULE_DIR + '/utility-module')();
const needle = require('needle');
require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const users = require('./users.json');


function prepareCommonHeaders(request) {
    let headers = {};
    logger.info(`X-CHALK-IP: ${utility.getClientIP(request)}, X-CHALK-CK: ${request.headers['x-chalk-ck']}`);
    logger.info(`X-FORWARDED-FOR ${request.headers['x-forwarded-for']||''}`);
    headers['X-CHALK-IP'] = utility.getClientIP(request);
    headers['X-CHALK-CK'] = request.headers['x-chalk-ck'] || '';
}

module.exports = function () {

    async function myLoginAPI (req, res){
        logger.info(req);
        const { email, password } = req.body;
      
        console.log("iam called")
        // Find the user with the given email
        const user = users.users.find(u => u.email === email);
        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      
        // Verify the password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      
        // Generate a JWT token and return it to the client
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
        return res.json({ token });
      }


    function loginHandler(request, response) {
        let reqUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/login/v1`;
        logger.info(`Login request body: ${JSON.stringify(request.body)}`);
        let headers = prepareCommonHeaders(request);

        let authStage1=needle('post', reqUrl, request.body, {headers: headers, json: true})
            .then(function (res) {
                logger.info(`Login Response Stage1 Http Status: ${res.statusCode}`);
                let respTemplate={
                    status: 0,
                    ecode: 0,
                    edesc: null,
                    response: null
                };
                if(res.statusCode===200) {
                    respTemplate.status=res.body.status;
                    respTemplate.ecode=res.body.ecode;
                    respTemplate.edesc='Authorized Stage 1 Completed';
                    respTemplate.response=res.body.response;
                }else{
                    respTemplate.status=res.statusCode;
                    respTemplate.ecode=res.statusCode;
                    respTemplate.edesc='Unauthorized'
                }
                return respTemplate;
            }).catch(function (err) {
                let errorResponse={
                    status: 500,
                    ecode: 500,
                    edesc: 'Internal server error stage 1 authorization',
                    response: null
                };
                logger.error(err);
                return errorResponse;
            });

        authStage1.then(function (data) {
            if(data.response!==null) {
                authStage2(data.response.token, data.response.xpressdocCode,headers).then(function (resp) {
                    response.json(resp);
                });
            }else{
                response.json(data);
            }
        });
    }

    function authStage2(token, xpressdocCode, httpHeaders) {
        let reqUrl2=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/fetchtokendata/v1/${xpressdocCode}`;
        logger.info(reqUrl2);
        let headers = httpHeaders || {};
        headers['Authorization'] = 'Bearer ' + token;
        let options = {headers: headers};
        return needle('get', reqUrl2, {}, options).then(function (resp) {
            logger.info(`Login Response Stage2 Http Status: ${resp.statusCode}`);
            if(resp.statusCode===200){
                return resp.body;
            }else{
                return {
                    status: resp.statusCode,
                    ecode: resp.statusCode,
                    edesc: resp.body,
                    response: null
                };
            }
        }).catch(function (err) {
            logger.error(err);
            return {
                status: 500,
                ecode: 500,
                edesc: 'Internal server error stage 2 authorization',
                response: null
            };
        });
    }

    async function refreshTokenService(refreshToken) {
        logger.info(`Invoking refreshTokenService with refreshToken: ${refreshToken}`);
        let reqTokenUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/ctv/refreshtoken/v1`;
        let refreshTokenResp=await needle('post', reqTokenUrl, {refreshtoken: refreshToken}, {json: true}).then(function (resp) {
            logger.info(`Refresh token Response Http Status: ${resp.statusCode}`);
            return resp.body;
        }).catch(function (err) {
            logger.error(err);
            return {
                status: 500,
                ecode: 500,
                edesc: 'Internal server error Refresh token',
                response: null
            };
        });
        logger.info(`refreshTokenResp: ${JSON.stringify(refreshTokenResp)}`);
        return refreshTokenResp;
    }

    function openLink(httpReq, httpRes) {
        let authParams = readAuthParams(httpReq);
        doAuthWithRefreshTokenRetry(authParams.headers, authParams.xpressdocCode, authParams.token, authParams.refreshToken)
            .then(function (resp) {
            httpRes.json(resp);
        });
    }

    function readAuthParams(httpReq) {
        let headers = prepareCommonHeaders(httpReq);
        let token = httpReq.query.token || '';
        let xpressdocCode = httpReq.query.xpressdocCode || httpReq.query.tokenCode || '';
        let refreshToken = httpReq.query.refreshToken || '';
        let redirectURL = httpReq.query.redirectURL || '';
        return {
            headers: headers,
            token: token,
            xpressdocCode: xpressdocCode,
            refreshToken: refreshToken,
            redirectURL: redirectURL,
        };
    }

    function doAuthWithRefreshTokenRetry(headers, xpressdocCode, token, refreshToken) {
        return authStage2(token, xpressdocCode, headers).then(function (resp) {
            if(resp.status===401 && refreshToken!=='') {
                return refreshTokenService(refreshToken).then(function (refreshTokenResp) {
                    if (refreshTokenResp.response && refreshTokenResp.response.token) {
                        return authStage2(refreshTokenResp.response.token, xpressdocCode, headers)
                          .then(function (retryResp) {
                            retryResp.response.loginInfo.token=refreshTokenResp.response.token;
                            retryResp.response.loginInfo.refreshToken=refreshTokenResp.response.refreshToken;
                            return retryResp;
                        });
                    }else{
                        return refreshTokenResp;
                    }
                });
            }else{
                return resp;
            }
        });
    }

    return {
        loginHandler:loginHandler,
        openLink:openLink,
        doAuthWithRefreshTokenRetry:doAuthWithRefreshTokenRetry,
        readAuthParams:readAuthParams,
        
        myLoginAPI:myLoginAPI
    }
};
