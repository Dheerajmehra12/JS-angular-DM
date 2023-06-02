const AWS=require('aws-sdk');
const s3 = new AWS.S3();
const appConstants = require('../../app-constants');
const loginService = require(appConstants.SERVICES_DIR + '/login-service')();
const logger = require(appConstants.MODULE_DIR + '/logger-module');
require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
const productionEnv = require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/production.env'}).parsed;
const moment = require('moment');
const needle = require('needle');
const puppeteer = require('puppeteer');

module.exports = function () {
    const cdnBaseUrl=process.env.CDN_BASE_URL || 'https://cdn.cmcd1.com';
    const bucket=process.env.S3_BUCKET || 'cd_cdn';
    const basepath=process.env.S3_BASE_UPLOAD_PATH  || '/ctv/stage';
    const viewPorts = {
        'm1x': {width: 1920, height: 180, deviceScaleFactor: 1},
    };

    async function s3Upload(uploadRequest) {
        let location = '';
        let key = '';
        try {
            const { Location, Key } = await s3.upload(uploadRequest).promise();
            location = Location;
            key = Key;
        } catch (error) {
            logger.error('Error uploading file:',uploadRequest.Key);
            logger.error(error);
        }
        logger.info(`s3Upload::: ${location}, ${key}`);
        return location;
    }

    function getSizeName(size) {
        let sizeArray={
            '1920x180':'m1x',
        };
        if(sizeArray[size]){
            return sizeArray[size];
        }
        return 'custom';
    }

    async function uploadToS3(httpReq,httpRes) {
        logger.info(`cdnBaseUrl=${cdnBaseUrl}`);
        logger.info(`bucket=${bucket}`);
        logger.info(`basepath=${basepath}`);
        let templateId=httpReq.body.templateId;
        let agentId=httpReq.body.agentId;
        let size=httpReq.body.imageSize;
        let imageData=httpReq.body.imageData;
        let data={
            templateId:templateId,
            agentId:agentId,
            imageSize:size,
            imageData:imageData
        };
        let respObj=await uploadBase64ImageToS3(data);
        httpRes.json(respObj);
    }

    function linkValidator(httpReq, httpRes) {
        let url = httpReq.query.url;
        needle('head', url,{rejectUnauthorized:true}).then(
            function success(resp) {
                logger.info(`linkValidator invoked for ${url} : ${resp.statusCode}`);
                return true;
            },
            function failure(err) {
                logger.warn(`linkValidator invoked for ${url} : ${err.message}`);
                return false;
            }
        ).catch(function error(err) {
            logger.warn(`linkValidator invoked for ${url} : ${err.message}`);
            return false;
        }).then(function (valid) {
            httpRes.send(valid);
        });
    }

    function linkValidatorCurl(httpReq, httpRes) {
        let { Curl } = require('node-libcurl');
        let curl = new Curl();
        let close = curl.close.bind(curl);
        let url = httpReq.query.url;

        curl.setOpt(Curl.option.URL, url);
        curl.setOpt(Curl.option.NOBODY, true);
        curl.setOpt(Curl.option.SSL_VERIFYPEER, true);

        curl.on('end', function (statusCode, data) {
            logger.info(`${statusCode}: ${data}`);
            httpRes.send(true);
            this.close();
        });
        curl.on('error', function (error, errorCode) {
            logger.error(`${errorCode}: ${error.message}`);
            httpRes.send(false);
            this.close();
        });
        curl.perform();
    }

    async function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async function uploadTemplateJsonToS3(templateId, size, agentId, templateJsonString) {
      const timestamp=moment().valueOf();
      let templateJsonDataUploadPath=`${basepath}/templateJsonData/${agentId}/data_${templateId}_${size}_${timestamp}.json`;
      let templateJsonDataS3Key=(templateJsonDataUploadPath.startsWith('/'))?templateJsonDataUploadPath.substr(1):templateJsonDataUploadPath;
      const templateJsonDataUploadRequest = {
        Bucket: bucket,
        Key: templateJsonDataS3Key,
        Body: templateJsonString,
        ACL: 'public-read',
        ContentType: 'application/json; charset=utf-8'
      };
      const location = await s3Upload(templateJsonDataUploadRequest);
      let templateJsonDataLocation = '';
      if(location !== '') {
        templateJsonDataLocation = `${cdnBaseUrl}/${templateJsonDataS3Key}`;
      }
      logger.info(`templateJsonDataLocation = ${templateJsonDataLocation}`);
      return  templateJsonDataLocation;
    }

    /**
     * Function that uses puppeteer for converting html to screenshot.  For puppeteer to work google chrome browser must be installed on system where deployment was done.
     * */
    async function htmlToImageV2(httpReq, httpRes) {
      let templateId = httpReq.query.templateId || '';
      let size = httpReq.query.size || '';
      let deviceScaleFactor = parseFloat(httpReq.query.deviceScaleFactor) || -1;
      let templateJsonData = httpReq.body.templateData || {};
      let agentId = httpReq.body.agentId || 'guestagent';
      let viewPortSize = {};
      viewPortSize = Object.assign(viewPortSize, viewPorts[size]);//copying values to avoid replacement in original object
      if (deviceScaleFactor !== -1) {
        viewPortSize.deviceScaleFactor = deviceScaleFactor;
      }
      logger.info(`viewPortSize=${JSON.stringify(viewPortSize)}`);
      logger.info(`deviceScaleFactor=${deviceScaleFactor}`);
      let imageType = 'png';

      let badRequest = false;
      let errorMessage = 'success';

      if (templateId === '') {
        errorMessage = 'Mandatory request parameter templateId is missing';
        badRequest = true;
      } else if (size === '') {
        errorMessage = 'Mandatory request parameter size is missing';
        badRequest = true;
      } else if (typeof templateJsonData === 'undefined' || Object.keys(templateJsonData).length === 0) {
        errorMessage = 'Mandatory attribute templateData is missing request body';
        badRequest = true;
      }

      if (badRequest) {
        httpRes.status(400).json({
          ecode: 400,
          edesc: errorMessage,
          templateId: templateId,
          agentId: agentId,
          url: null,
          s3Url: null,
          format: imageType,
          size: size
        });
      } else {
        try {

          let reqUrl = "";
          const templateJsonString = JSON.stringify(templateJsonData);
          logger.info(`templateJsonString = ${templateJsonString}`);
          logger.info(`Process.ENV = ${process.env.ENV}`);
          if(process.env.ENV === 'production') {
            reqUrl = `https://${httpReq.headers.host}/creatives/templates/${templateId}?hideChatBox=true&data=${encodeURIComponent(templateJsonString)}`;
          } else {
            reqUrl = `${httpReq.protocol}://${httpReq.headers.host}/creatives/templates/${templateId}?hideChatBox=true&data=${encodeURIComponent(templateJsonString)}`;
          }
          logger.info(`htmlToImageV2: ${reqUrl}`);
          const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
          const page = await browser.newPage();
          await page.goto(reqUrl, {
            waitUntil: "networkidle0",
            timeout: 0
          });
          await page.content();
          await page.setViewport(viewPortSize);
          let capturedImage = await page.screenshot({type: imageType, encoding: 'base64'});
          let imageData = `data:image/${imageType};base64,${capturedImage}`;
          let data = {
            templateId: templateId,
            agentId: agentId,
            imageSize: `${viewPortSize.width}x${viewPortSize.height}`,
            imageData: imageData
          };
          await browser.close();
          let respObj = await uploadBase64ImageToS3(data);
          let status = (respObj.ecode === 0) ? 200 : 500;
          httpRes.status(status).json(respObj);
        } catch (err) {
          errorMessage = `Unable to load creative page: ${err.message}`;
          let respObj = {
            ecode: 500,
            edesc: errorMessage,
            templateId: templateId,
            agentId: agentId,
            url: null,
            s3Url: null,
            format: imageType,
            size: size
          };
          logger.error(errorMessage);
          httpRes.status(500).json(respObj);
        }
      }
    }

    /**
     * Function to upload image on s3
     * @param {Object} data
     * @param {String} data.templateId Template id e.g. tpl-br0008
     * @param {String} data.agentId Agent Id e.g 1000038
     * @param {String} data.imageSize e.g. 300x250 or 300x50 etc.
     * @param {String} data.imageData base64 Encoded String e.g. data:image/png;base64,iVBORw0KGgoAA==
     * */
    async function uploadBase64ImageToS3(data) {
        logger.info(`cdnBaseUrl=${cdnBaseUrl}`);
        logger.info(`bucket=${bucket}`);
        logger.info(`basepath=${basepath}`);
        let templateId=data.templateId;
        let agentId=data.agentId;
        let size=data.imageSize;
        let timestamp=moment().valueOf();
        let imageData=data.imageData.replace(/^data:image\/\w+;base64,/, '');
        let base64Data = new Buffer.from(imageData, 'base64');
        let ext = data.imageData.split(';')[0].split('/')[1];
        let mimeType = `image/${ext}`;
        let uploadPath=`${basepath}/${agentId}/${templateId}/camp_${getSizeName(size)}_${timestamp}.${ext}`;
        let uploadKey=(uploadPath.startsWith('/'))?uploadPath.substr(1):uploadPath;
        let uploadRequest = {
            Bucket: bucket,
            Key: uploadKey,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: mimeType
        };
        logger.info(`upload request received => {templateId: ${templateId}, agentId: ${agentId}, uploadKey:${uploadKey}`);
        let location=s3Upload(uploadRequest);
        return location.then(function (s3Url) {
            logger.info(`Returned s3 location is ${s3Url}`);
            let resp={
                ecode:0,
                edesc:null,
                templateId: templateId,
                agentId: agentId,
                url: `${cdnBaseUrl}/${uploadKey}`,
                s3Url: `${s3Url}`,
                format: ext,
                size: size
            };
            logger.info(`upload response sent => ${JSON.stringify(resp)}`);
            return resp;
        },function (err) {
            logger.error(err);
            let resp={
                ecode:500,
                edesc: 'Unable to upload file',
                templateId: templateId,
                agentId: agentId,
                url: null,
                s3Url: null,
                format: ext,
                size: size
            };
            logger.info(`upload response sent => ${JSON.stringify(resp)}`);
            return resp;
        });
    }

    function reviewListing(httpReq, httpRes) {
        let authParams = loginService.readAuthParams(httpReq);
        let listingId = httpReq.query.listingId||'';
        let campaignId = httpReq.query.campaignId||'';
        let almCampaignType = httpReq.query.almCampaignType || 0;
        let landingPageUrl = httpReq.query.landingPageUrl || '';
        let postBackURL=`${httpReq.protocol}://${httpReq.headers.host}/html/pages/reviewListing.html`;
        loginService
            .doAuthWithRefreshTokenRetry(authParams.headers, authParams.xpressdocCode, authParams.token, authParams.refreshToken)
                .then(function (resp) {
                    let loginResponse = resp;
                    if (loginResponse.response
                        && loginResponse.response.loginInfo
                        && loginResponse.response.loginInfo.token) {
                        fetchListing(listingId, loginResponse.response.loginInfo.token, authParams.headers)
                            .then(async function (listingResponse) {
                                let campDetailsResp = await fetchCampaignDetails(campaignId, loginResponse.response.loginInfo.token, authParams.headers);
                                let campaignDetails = null;
                                if (campDetailsResp && campDetailsResp.ecode === 0 && campDetailsResp.response) {
                                    campaignDetails = campDetailsResp.response;
                                }
                                needle('post', postBackURL, {
                                    loginResponse: loginResponse,
                                    listingResponse: listingResponse,
                                    campaignId: campaignId,
                                    listingId: listingId,
                                    campaignDetails: campaignDetails,
                                    almCampaignType: almCampaignType,
                                    landingPageUrl: landingPageUrl
                                }, {json: true}).then(function (resp) {
                                    httpRes.send(resp.body);
                                });
                            });
                    } else {
                        needle('post', postBackURL, {
                            loginResponse: loginResponse,
                            listingResponse: null
                        }, {json: true}).then(function (resp) {
                            httpRes.send(resp.body);
                        });
                    }
                });
    }

    function fetchCampaignDetails(campaignId, token, httpHeaders) {
        let reqUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/alm/fetchcampaign/v1/${campaignId}`;
        logger.info(`fetchCampaignDetails URL=${reqUrl}`);
        let headers = httpHeaders || {};
        headers['Authorization'] = 'Bearer ' + token;
        let options = {headers: headers, json: false};
        return needle('get', reqUrl, {}, options).then(function (resp) {
            logger.info(`fetchCampaignDetails response Http Status: ${resp.statusCode}`);
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
            let errorResponse={
                status: 500,
                ecode: 500,
                edesc: 'Internal server error fetchCampaignDetails response',
                response: null
            };
            return errorResponse;
        });
    }

    function fetchListing(listingId, token, httpHeaders) {
        let reqUrl=`http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/alm/listing/v1/${listingId}`;
        //let reqUrl=`http://${productionEnv.API_HOST}:${productionEnv.API_HOST_PORT}/alm/listing/v1/${listingId}`;
        logger.info(`Listing URL=${reqUrl}`);
        let headers = httpHeaders || {};
        headers['Authorization'] = 'Bearer ' + token;
        let options = {headers: headers,json:false};
        return needle('get', reqUrl, {}, options).then(function (resp) {
            logger.info(`Listing response Http Status: ${resp.statusCode}`);
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
            let errorResponse={
                status: 500,
                ecode: 500,
                edesc: 'Internal server error Listing response',
                response: null
            };
            return errorResponse;
        });
    }

    function listingDetails(httpReq, httpRes) {
        let httpHeaders=httpReq.headers;
        let token=httpHeaders.token || '';
        let listingId=httpReq.params.listingId || '';
        fetchListing(listingId,token,httpHeaders).then(function (listingResp) {
            if(listingResp.status<100) {
                httpRes.status(200).json(listingResp);
            }else{
                httpRes.status(listingResp.status).json(listingResp);
            }
        });
    }

    return {
        uploadToS3:uploadToS3,
        linkValidator:linkValidatorCurl,
        htmlToImage:htmlToImageV2,
        reviewListing:reviewListing,
        listingDetails:listingDetails
    };
};
