module.exports = function () {
  const appConstants = require('../../app-constants');
  const logger = require(appConstants.MODULE_DIR + '/logger-module');
  const puppeteer = require('puppeteer');
  const uploadToS3 = require('./s3UploadApi')();
  const needle = require('needle');
  require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;

  function toDimension(size) {
    let dimension = (size && typeof size === 'string') ? size.trim().toLowerCase().split('x') : [];
    let width = (dimension.length >= 1 && !isNaN(parseInt(dimension[0]))) ? parseInt(dimension[0]) : 0;
    let height = (dimension.length >= 2 && !isNaN(parseInt(dimension[1]))) ? parseInt(dimension[1]) : 0;
    return {
      width: width,
      height: height
    }
  }

  function gcd(a, b) {
    return (b === 0) ? a : gcd(b, a % b);
  }

  function getAspectRatio(width, height) {
    const r = gcd(width, height);
    const ar = (height === 0) ? width : width / height;
    const rw = (r !== 0) ? width / r : 0;
    const rh = (r !== 0) ? height / r : 0;
    return {
      ratio: ar,
      ratioWidth: rw,
      ratioHeight: rh
    };
  }

  function getOfficeLogoHandler(req, res) {
       const request = require('request');
       const templateId = req.query.templateId;
       const officeId = req.query.officeId;
     //    const officeId = "CA709-001";
       let targetSize = '1700x800';
       let targetDimension = toDimension(targetSize);
       logger.info(`targetDimension ${JSON.stringify(targetDimension)}`);
       let headers = req.headers;
       if (headers['accept-encoding']) {
         delete headers['accept-encoding']; // as endpoint is not supporting this header.
       }
       let url = `http://${process.env.API_HOST}:${process.env.API_HOST_PORT}/hsf/office/${officeId}/logo/v2?portal=ctv&templateId=${templateId}`;
       let options = {
         url: url,
         headers: headers
       };
       if(headers.token) {
         options.headers['Authorization']='Bearer '+headers.token; //from ui token comes with header key token while actual api uses Bearer token
         delete options.headers.token;// removing original token key in header
       }
      request(options, function (error, response, body) {
        try {
          if (error) {
            logger.info("Error");
            res.json({status: "failure", message: "No logo found"})
          } else if (response.statusCode === 401) {
            res.status(401).json({"message": "UnAuthorized"});
          } else if (response.statusCode === 400) {
            res.status(400).json({"message": "Bad Request"});
          } else {
            const logos = JSON.parse(body);
            logger.info(`${url} response: ${JSON.stringify(logos.response)}`);
            let logoUrlsList = logos.response.logoUrl;

            logger.info(logoUrlsList);

            res.json({status: "success", response: logoUrlsList})
          }
        } catch (e) {
          logger.error(e);
          res.json({"status": "failure"});
        }
      });
    }

  function getOfficeLogoWithoutSeal(logoResponse) {
    let logoUrl = {};
    if(logoResponse!==null) {
      Object.entries(logoResponse).forEach(function (values) {
        logger.info(values);
        const size = values[0];
        const url = values[1][0];
        let start = 0;
        let length = url.length;
        let end = length;
        if(url.indexOf("/")!==-1 && !url.endsWith("/")){
          start = url.lastIndexOf("/");
          if(length >= start + 1) {
            start = start  + 1;
          }
        }
        if(url.indexOf(".")!==-1) {
          end = url.lastIndexOf(".");
          if(end<=start){
            end = length;
          }
        }
        const imageName = url.substring(start, end);
        let hasSeal = imageName.toLowerCase().includes("seal");
        let isWhite = !imageName.toLowerCase().includes("cab") && !imageName.toLowerCase().includes('black');
        let isVertical = imageName.toLowerCase().includes("_v_") && !imageName.toLowerCase().includes("_v_sbs_");
        let isHorizontal = imageName.toLowerCase().includes("_h_") && !imageName.toLowerCase().includes("_h_sbs_");
        let isWideLogo = imageName.toLowerCase().includes("_sbs_");
        if(!hasSeal && isWhite) {
          logger.info(`imageName = ${imageName}`);
          logoUrl[size] = url;
        }
      });
    }
    return logoUrl;
  }

  function getLogoByAspectRatio(logoResponse, targetSize) {
    let targetDimension = toDimension(targetSize);
    let logoUrls = null;
    logger.info(`targetDimension ${JSON.stringify(targetDimension)}`);
    if(typeof logoResponse!== 'undefined' && logoResponse!==null) {
      let sizes = Object.keys(logoResponse);
      let tRatio = getAspectRatio(targetDimension.width, targetDimension.height).ratio;
      let diff = tRatio;
      let diffWidth = targetDimension.width;
      logoUrls = logoResponse['200x96'];
      sizes.forEach(function (size) {
        let dimension = toDimension(size);
        let cRatio = getAspectRatio(dimension.width, dimension.height).ratio;
        let cDiff = Math.abs(tRatio - cRatio);
        let cDiffWidth = Math.abs(targetDimension.width - dimension.width);
        if (cDiff < diff && cDiffWidth < diffWidth) {
          diff = cDiff;
          diffWidth = cDiffWidth;
          logoUrls = logoResponse[size];
        }
      });
      if (!logoUrls && sizes.length > 0) {
        logoUrls = logoResponse[sizes[0]];
      }
    }
    return logoUrls;
  }

  async function makeFooterBanner(httpReq, data) {
    logger.info(`**designing footer banner**`);
    let getBannerURL = `${httpReq.protocol}://${httpReq.headers.host}/html/video-banner/${data.bannerName}.html`;
    logger.info(`getBannerURL ${getBannerURL}`);
    return await needle('post', getBannerURL, data, {json: true}).then(function (resp) {
      return resp.body;
    });
  }

  async function htmlTobase64(htmlFormat, data) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setContent(htmlFormat, {waitUntil: 'networkidle2'});
    let dimensions;
    if (data.bannerName === 'footer-banner') {
      if (data.creativeSize === '1920x1080') {
        dimensions = await page.evaluate(() => {
          return {
            width: 1920,
            height: 180,
            deviceScaleFactor: window.devicePixelRatio
          };
        });
      } else {
        dimensions = await page.evaluate(() => {
          return {
            width: 1280,
            height: 180,
            deviceScaleFactor: window.devicePixelRatio
          };
        });
      }

    } else {
      if (data.creativeSize === '1920x1080') {
        dimensions = await page.evaluate(() => {
          return {
            width: 1920,
            height: 1080,
            deviceScaleFactor: window.devicePixelRatio
          };
        });
      } else {
        dimensions = await page.evaluate(() => {
          return {
            width: 1280,
            height: 720,
            deviceScaleFactor: window.devicePixelRatio
          };
        });
      }
    }

    await page.evaluate(() => {
      const images = document.querySelectorAll('img');

      function preLoad() {
        const promises = [];

        function loadImage(img) {
          return new Promise(function (resolve, reject) {
            if (img.complete) {
              resolve(img)
            }
            img.onload = function () {
              resolve(img);
            };
            img.onerror = function (e) {
              resolve(img);
            };
          })
        }

        for (let i = 0; i < images.length; i++) {
          promises.push(loadImage(images[i]));
        }
        return Promise.all(promises);
      }

      return preLoad();
    });

    logger.info(`Dimensions:  ${JSON.stringify(dimensions)}`);
    await page.waitForTimeout(1000);
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
    });
    let imageType = 'jpeg';
    const capturedImage = await page.screenshot({
      type: imageType,
      encoding: 'base64',
      quality: 80
    });
    const imageData = `data:image/${imageType};base64,${capturedImage}`;
    await browser.close();
    return imageData;
  }

  async function getFooterBanner(req, res) {
    const data = req.body;
    logger.info(`data for banner ${JSON.stringify(data)}`);
    const footerBannerHTML = await makeFooterBanner(req, data);
    (async () => {
      const imagebase64Data = await htmlTobase64(footerBannerHTML, data);
      uploadToS3.imgUrl(imagebase64Data, function (data) {
        let logo = data.Location;
        res.status(200).json({
          'status': 'success',
          'response': logo
        });
      })
    })();
  }

  return {
    getOfficeLogoHandler: getOfficeLogoHandler,
    getFooterBanner: getFooterBanner
  }
};
