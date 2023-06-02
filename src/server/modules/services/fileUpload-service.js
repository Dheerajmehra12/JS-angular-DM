module.exports = function (express, app) {
    const AWS=require('aws-sdk');
    const multer = require('multer');
    const multerS3 = require('multer-s3');
    const s3 = new AWS.S3();
    const appConstants = require('../../app-constants');
    require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
    const logger = require(appConstants.MODULE_DIR + '/logger-module');
    const bucket=process.env.S3_BUCKET || 'cd_cdn';
    const cdnBaseUrl=process.env.CDN_BASE_URL || 'https://cdn.cmcd1.com';

    let ctvVideoUploads = multer({
        limits: { fileSize: 300 * 1000 * 1000 },
        storage: multerS3({
            s3: s3,
            bucket: bucket,
            cacheControl: 'max-age=900',
            acl: 'public-read',
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function (req, file, cb) {
                cb(null, {fieldName: file.fieldname});
            },
            key: function (req, file, cb) {
                let filename=file.originalname;
                let lastDotIndex=filename.lastIndexOf('.');
                let ext=filename.substring(lastDotIndex+1, filename.length) || filename;
                let originalFileName=(lastDotIndex!==-1)?filename.substring(0,lastDotIndex):filename;
                let s3Key=`ctv/uploads/videos/${originalFileName}_${Date.now().toString()}${(filename!==ext)?'.'+ext:''}`;
                logger.info(`Uploading on s3 with key: ${s3Key}`);
                cb(null, s3Key)
            }
        })
    });

  let ctvVideoThumbnailUploads = multer({
    limits: { fileSize: 50 * 1000 * 1000 },
    storage: multerS3({
      s3: s3,
      bucket: bucket,
      cacheControl: 'max-age=900',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        let filename=file.originalname;
        let lastDotIndex=filename.lastIndexOf('.');
        let ext=filename.substring(lastDotIndex+1, filename.length) || filename;
        let originalFileName=(lastDotIndex!==-1)?filename.substring(0,lastDotIndex):filename;
        let s3Key=`ctv/uploads/thumbnails/${originalFileName}_${Date.now().toString()}${(filename!==ext)?'.'+ext:''}`;
        logger.info(`Uploading on s3 with key: ${s3Key}`);
        cb(null, s3Key)
      }
    })
  });

    function ctvVideoUploadService(httpReq, httpRes) {
        let singleUpload=ctvVideoUploads.single('video');
        singleUpload(httpReq, httpRes, function (error) {
            if(error instanceof multer.MulterError) {
                logger.error(`Error uploading: ${JSON.stringify(error)}`);
                httpRes.json({
                    ecode:400,
                    status:400,
                    edesc:error.message,
                    response:null
                });
            }else if(error) {
                logger.error(`Unknown Error uploading: ${JSON.stringify(error)}`);
                httpRes.json({
                    ecode:500,
                    status:500,
                    edesc:error.message,
                    response:null
                });
            }else{
                let respObj=httpReq.file;
                respObj.url=(respObj.location && respObj.location!=="")?respObj.location.replace(`https://s3.amazonaws.com/${bucket}`,cdnBaseUrl):null;
                logger.info(`Upload Success: ${JSON.stringify(respObj)}`);
                httpRes.json({
                    ecode:200,
                    status:200,
                    edesc: 'Success',
                    response: respObj
                });
            }
        });
    }

  function ctvVideoThumbnailUploadService(httpReq, httpRes) {
    let singleUpload=ctvVideoThumbnailUploads.single('videoThumbnail');
    singleUpload(httpReq, httpRes, function (error) {
      if(error instanceof multer.MulterError) {
        logger.error(`Error uploading: ${JSON.stringify(error)}`);
        httpRes.json({
          ecode:400,
          status:400,
          edesc:error.message,
          response:null
        });
      }else if(error) {
        logger.error(`Unknown Error uploading: ${JSON.stringify(error)}`);
        httpRes.json({
          ecode:500,
          status:500,
          edesc:error.message,
          response:null
        });
      }else{
        let respObj=httpReq.file;
        respObj.url=(respObj.location && respObj.location!=="")?respObj.location.replace(`https://s3.amazonaws.com/${bucket}`,cdnBaseUrl):null;
        logger.info(`Upload Success: ${JSON.stringify(respObj)}`);
        httpRes.json({
          ecode:200,
          status:200,
          edesc: 'Success',
          response: respObj
        });
      }
    });
  }
    return {
        ctvVideoUploadService:ctvVideoUploadService,
        ctvVideoThumbnailUploadService: ctvVideoThumbnailUploadService
    };
};
