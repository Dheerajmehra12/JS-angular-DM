module.exports = function () {
  const appConstants = require('../../app-constants');
  const logger = require(appConstants.MODULE_DIR + '/logger-module');
  const AWS = require('aws-sdk');
  AWS.config.region = 'us-east-1';
  const s3 = new AWS.S3();
  let bucket = '';
  bucket = 'cd_cdn';
  const params = {
    Bucket: bucket
  };
  const _return = {};
  s3.headBucket(params, function (err, data) {
    if (err) {
      const params = {
        Bucket: bucket,
        ACL: 'public-read'
      };
      s3.createBucket(params, function (err, data) {
        if (err) {
          logger.error(err);
          logger.warn("WARNING ::: PDF REPORTS MAY NOT WORK");
        } else {
          logger.info(data);
          addCorsToBucket();

        }

      });
    } else {
      logger.info(data);
      addCorsToBucket();
    }
  });

  function uploadImgToS3(key, data, mimeType, cb) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: data,
      ACL: 'public-read',
      ContentType: mimeType,
    };

    s3.upload(params, function (err, data) {
      if (err) {
        logger.error('Error creating the folder');
        logger.error(err);
        cb(err, "", "");
      } else {
        cb("", "success", data);
      }
    });
  }

  function addCorsToBucket() {
    const corsParams = {
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{
          AllowedMethods: ['GET', 'POST'],
          AllowedOrigins: ["*"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["x-amz-server-side-encryption"],
          MaxAgeSeconds: 3000
        }]
      }
    };
    logger.info(`Calling CORS ${JSON.stringify(corsParams)}`);
    s3.putBucketCors(corsParams, function (err, data) {
      logger.info("Cors reply");
      if (err) logger.error(err); // an error occurred
      else {
        logger.info(JSON.stringify(data)); // successful response
        logger.info("Added Cors");
      }
    });
  }

  _return.imgUrl = function (req, callback) {
    const date = new Date();
    const dataArray = req;
    const key = `image/videoBanner/banner${date.getTime()}.jpeg`;
    logger.info(`Key ${key}`);
    const base64Data = dataArray.replace(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,/, "");
    let ext = dataArray.split(';')[0].split('/')[1];
    let mimeType = `image/${ext}`;
    const buffer = new Buffer.from(base64Data, 'base64');
    uploadImgToS3(key, buffer, mimeType, function (err, status, data) {
      data.Location = data.Location.replace("s3.amazonaws.com/cd_cdn", "cdn.cmcd1.com");
      logger.info(`Response from aws received, ${JSON.stringify(data)}, ${data.Location}`);
      callback(data);
      if (err) {
        logger.error({
          "status": "failure",
          "message": "Unable to upload currently, try again later."
        });
      } else {
        logger.info({
          "status": "success",
          data: data
        });
      }
    });
  };
  return _return;
};
