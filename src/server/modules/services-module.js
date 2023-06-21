module.exports = function (express, app) {
    const appConstants = require('../app-constants');
    const needle = require('needle');
    require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
    const productionEnv = require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/production.env'}).parsed;
    const logger = require(appConstants.MODULE_DIR + '/logger-module');
    const analyticsService=require(appConstants.SERVICES_DIR + '/analytics-service')(express, app);
    const loginService=require(appConstants.SERVICES_DIR + '/login-service')();
    const boundariesService = require(appConstants.SERVICES_DIR+'/boundary-service')();
    const validateUrlService = require(appConstants.SERVICES_DIR+'/validate-url-service')();
    const ipToLocationService = require(appConstants.SERVICES_DIR+'/ipToLocation-service')();
    const getOfficeLogoService = require(appConstants.SERVICES_DIR+'/office-logo-service')();
    const templateService=require(appConstants.SERVICES_DIR + '/template-service')();
    const encryptionService = require(appConstants.MODULE_DIR + '/encrypt_decrypt')();
    const utility = require(appConstants.MODULE_DIR + '/utility-module')();
    const fileUploadService=require(appConstants.SERVICES_DIR + '/fileUpload-service')(express, app);

    function getClientIP(req) {
        return utility.getClientIP(req);
    }

    function proxyHandler(httpReq, httpRes) {
        let actualApiBase = `http://${process.env.API_HOST}:${process.env.API_HOST_PORT}`;
        let originalReqUrl = httpReq.url;
        let finalRequestUrl = actualApiBase + originalReqUrl.replace('/api/proxy', '');
        if (finalRequestUrl.includes('/geocode/v1')) {
          finalRequestUrl = `http://${productionEnv.API_HOST}:${productionEnv.API_HOST_PORT}${originalReqUrl.replace('/api/proxy', '')}`;
        }
        let reqMethod = httpReq.method.toLowerCase();
        let headers = httpReq.headers;
        logger.info(`X-CHALK-IP: ${getClientIP(httpReq)}, X-CHALK-CK: ${headers['x-chalk-ck']}`);
        logger.info(`X-FORWARDED-FOR ${headers['x-forwarded-for']||''}`);
        headers['X-CHALK-IP'] = getClientIP(httpReq);
        headers['X-CHALK-CK'] = headers['x-chalk-ck'] || '';
        if(headers.hasOwnProperty('x-chalk-ck')) {
            delete headers['x-chalk-ck'];
        }
        let opts = {headers: headers, json: true};
        let data = httpReq.body;
        let hasEmptyBody = false;
        if(!data || Object.keys(data).length === 0) {
            hasEmptyBody = true;
        }
        if (reqMethod === 'get') {
            delete opts.json; //this is important to delete otherwise needle request will not use data
            data = httpReq.query;
        }else if(hasEmptyBody) {
            data = httpReq.params; //if request body is empty then fallback to request params
        }
        logger.info(`Received by proxy api for request:${finalRequestUrl}`);
        if(httpReq.headers.token) {
            opts.headers['Authorization']='Bearer '+httpReq.headers.token; //from ui token comes with header key token while actual api uses Bearer token
            delete opts.headers.token;// removing original token key in header
        }
        needle.request(reqMethod, finalRequestUrl, data, opts, utility.createApiResCallback(httpRes,logger));
    }

    function emailViewer(httpReq, httpRes) {
        let url=httpReq.query.url || '';
        let redirectURL=`${httpReq.protocol}://${httpReq.headers.host}/#/viewContent?url=${url}`;
        logger.info(`emailViewer Redirect URL: ${redirectURL}`);
        httpRes.writeHead(302, {
            'Location': redirectURL
        });
        httpRes.end();
    }

    function redirectService(httpReq, httpRes) {
        let redirectURL=httpReq.query.redirectURL;
        logger.info(`redirectService Redirect URL: ${redirectURL}`);
        httpRes.writeHead(302, {
            'Location': redirectURL
        });
        httpRes.end();
    }

    function readJsonUrl(httpReq, httpRes) {
      let jsonUrl=httpReq.query.jsonUrl;
      logger.info(`jsonUrl = ${jsonUrl}`);
      needle.request('get', jsonUrl, {}, {json: false}, (err, resp, body) => {
        if (body.name && body.name === 'Error') {
          httpRes.status(404).json({error: `Invalid json url ${jsonUrl}`});
        } else{
          httpRes.json(body);
        }
      });
    }

    function stripeCardList(httpReq,httpRes) {
        let resTemplate={
            status: 0,
            ecode: 0,
            edesc: null,
            response: null
        };
        let stripeCustomerId=httpReq.body.stripeCustomerId;
        logger.info(`stripeCustomerId:${stripeCustomerId}`);
        let stripe = require('stripe')(`${process.env.STRIPE_API_KEY}`);
        stripe.customers.listSources(
            stripeCustomerId,
            {object: 'card', limit: 3},
            function(err, cards) {
                if(err){
                    resTemplate.status=err.statusCode;
                    resTemplate.ecode=err.statusCode;
                    resTemplate.edesc=err.message;
                    httpRes.status(400).json(resTemplate);
                }else {
                    resTemplate.response=(cards.data && cards.data.length>0)?cards.data.map(function (card) {
                        return {
                            exp_month:card.exp_month,
                            exp_year:card.exp_year,
                            last4:card.last4,
                            id:card.id,
                            brand:card.brand,
                            customer:card.customer
                        };
                    }):null;
                    httpRes.status(200).json(resTemplate);
                }
            }
        );
    }

    return {
        loginHandler:loginService.loginHandler,
        boundariesHandler:boundariesService.boundariesHandler,
        validateUrl:validateUrlService.validateUrl,
        ipToLocationHandler:ipToLocationService.ipToLocationHandler,
        getOfficeLogoHandler:getOfficeLogoService.getOfficeLogoHandler,
        getFooterBanner:getOfficeLogoService.getFooterBanner,
        uploadToS3:templateService.uploadToS3,
        proxyHandler:proxyHandler,
        encryptPasswordHandler:encryptionService.encryptPasswordHandler,
        decryptPasswordHandler:encryptionService.decryptPasswordHandler,
        exportAnalyticsXLS:analyticsService.exportAnalyticsXLS,
        exportDashboardXLS:analyticsService.exportDashboardXLS,
        linkValidator:templateService.linkValidator,
        htmlToImage: templateService.htmlToImage,
        emailViewer:emailViewer,
        openLink:loginService.openLink,
        exportPDFReport:analyticsService.exportPDFReport,
        readJsonUrl:readJsonUrl,
        redirectService:redirectService,
        ctvVideoUploadService:fileUploadService.ctvVideoUploadService,
        ctvVideoThumbnailUploadService:fileUploadService.ctvVideoThumbnailUploadService,
        reviewListing:templateService.reviewListing,
        // stripeCardList:stripeCardList,
        listingDetails:templateService.listingDetails,
        exportHeatMap:analyticsService.exportHeatMap,

        myLoginAPI: loginService.myLoginAPI,
        createAccount:loginService.createAccount
    };
};
