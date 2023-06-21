module.exports=function (express, app) {
    const path = require('path');
    const fs = require('fs');
    const appConstants = require('../app-constants');
    const pug = require('pug');
    const logger = require(appConstants.MODULE_DIR+ '/logger-module');
    const siteConfig = require(appConstants.MODULE_DIR + '/site-config-module');
    const utility = require(appConstants.MODULE_DIR + '/utility-module')();
    const services = require(appConstants.MODULE_DIR + '/services-module')(express, app);
    const needle = require('needle');
    require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;

    function createThemedIndexFileIfNotExists(theme) {
      if (theme && theme.themeName !== 'default') {
        const styleName = `${theme.themeName}-`;
        const indexFileName = `/index-${theme.themeName.toLowerCase()}.html`;
        const linkHref0 = `css/${styleName}theme${(process.env.ENV && process.env.ENV === 'production') ? '.min' : ''}.css`;
        let linkHref1 = `css/styles/${styleName}style${(process.env.ENV && process.env.ENV === 'production') ? '.min' : ''}.css`;
        let indexFilePath = path.join(appConstants.APP_DIR, '/dist', indexFileName);
        if (!fs.existsSync(indexFilePath)) {
          try {
            const cheerio = require('cheerio');
            const indexHtmlContent = fs.readFileSync(path.join(appConstants.APP_DIR, '/dist', '/index.html')).toString();
            const $ = cheerio.load(indexHtmlContent);
            $('#client-theme-file-0').attr('href', linkHref0);
            $('#client-theme-file-1').attr('href', linkHref1);
            const newIndexHtmlContent = $.html();
            logger.info('New Index HTML Content ' + newIndexHtmlContent);
            fs.writeFileSync(indexFilePath, newIndexHtmlContent);
          } catch (e) {
            logger.error('Error generating index file according to theme: ' + e.message);
          }
        }
      }
    }

    function getIndexFilePathForTheme(theme) {
      let indexFileName = '/index.html';
      if (theme && theme.themeName !== 'default') {
        indexFileName = `/index-${theme.themeName.toLowerCase()}.html`;
      }
      let indexFilePath = path.join(appConstants.APP_DIR,'/dist',indexFileName);
      if(!fs.existsSync(indexFilePath)) {
        indexFileName = '/index.html';
        indexFilePath = path.join(appConstants.APP_DIR,'/dist',indexFileName);
      }
      return indexFilePath;
    }

    function getAngularScriptsFromIndexPage() {
      let angularScipts = '';
      try{
        const cheerio = require('cheerio');
        const indexHtmlContent = fs.readFileSync(path.join(appConstants.APP_DIR, '/dist', '/index.html')).toString();
        const $ = cheerio.load(indexHtmlContent);
        angularScipts = $.html($('body script[type="module"], body script[defer], body script[nomodule]'));
        logger.info(`angularScipts in body = ${angularScipts}`);
      }catch (e) {
        logger.error(e);
        logger.error(`Error dynamic embedding of angularScipts`);
        angularScipts = '';
      }
      return angularScipts;
    }

    function getTheme(request, skipFileCreation = false) {
      logger.info("host: %s, request url: %s", request.headers.host, request.url);
      let theme = siteConfig().theme(request.headers.host);
      if(!skipFileCreation) {
        createThemedIndexFileIfNotExists(theme);
      }
      return theme;
    }

    return {
        loginHandler: services.loginHandler,
        boundariesHandler:services.boundariesHandler,
        validateUrl:services.validateUrl,
        ipToLocationHandler:services.ipToLocationHandler,
        getOfficeLogoHandler:services.getOfficeLogoHandler,
        getFooterBanner:services.getFooterBanner,
        uploadToS3:services.uploadToS3,
        proxyHandler: services.proxyHandler,
        encryptPasswordHandler:services.encryptPasswordHandler,
        decryptPasswordHandler:services.decryptPasswordHandler,
        exportAnalyticsXLS:services.exportAnalyticsXLS,
        exportDashboardXLS:services.exportDashboardXLS,
        linkValidator:services.linkValidator,
        htmlToImage:services.htmlToImage,
        emailViewer:services.emailViewer,
        openLink:services.openLink,
        exportPDFReport:services.exportPDFReport,
        readJsonUrl: services.readJsonUrl,
        redirectService:services.redirectService,
        ctvVideoUploadService:services.ctvVideoUploadService,
        ctvVideoThumbnailUploadService:services.ctvVideoThumbnailUploadService,
        reviewListing:services.reviewListing,
        // stripeCardList:services.stripeCardList,
        listingDetails:services.listingDetails,
        exportHeatMap:services.exportHeatMap,


        // new ap
        myLoginAPI:services.myLoginAPI,
        createAccount:services.createAccount,
        themeHandler: function (request, response) {
            response.json(getTheme(request));
        },
        templateHandler: function (httpReq, httpRes) {
            let id=httpReq.query.id || httpReq.body.id;
            let size=httpReq.query.size || httpReq.body.size || 'm1x';
            let intent=httpReq.query.export || httpReq.body.export || false;
            let tagLine1=httpReq.query.tagLine1 || httpReq.body.tagLine1 || '';
            let tagLine2=httpReq.query.tagLine2 || httpReq.body.tagLine2 || '';
            let themeConfig = getTheme(httpReq);
            let editableValues = (themeConfig && themeConfig.brandingTemplatesEditConfig && themeConfig.brandingTemplatesEditConfig[id] && themeConfig.brandingTemplatesEditConfig[id].editableValues)||{};
            tagLine1 = (tagLine1==='' && editableValues && editableValues.tagLine1)?editableValues.tagLine1:tagLine1;
            tagLine2 = (tagLine2==='' && editableValues && editableValues.tagLine2)?editableValues.tagLine2:tagLine2;
            logger.info(`id: ${id}, size: ${size}, intent: ${intent}, tagLine1: ${tagLine1}, tagLine2: ${tagLine2}`);
            httpReq.body.tagLine1=tagLine1;
            httpReq.body.tagLine2=tagLine2;
            let baseUrl=`${httpReq.protocol}://${httpReq.headers.host}/`;
            logger.info(`posted params: ${JSON.stringify(httpReq.body)}`);
            let html = pug.renderFile(path.join(appConstants.APP_DIR, '/src/partials/templates', '/'+id+'-'+size+'.pug'),{
                id:id,
                pretty: true,
                model: httpReq.body,
                exportIntent: intent,
                baseUrl:baseUrl,
            });
            httpRes.type('html').send(html);
        },
        htmlPartialsHandler: function(httpReq, httpRes) {
            let theme = getTheme(httpReq);
            logger.info(`Requested partials: ${httpReq.url}`);
            let partialPath=httpReq.url.toString().split('/html')[1];
            if(partialPath.endsWith('.html')) {
                partialPath=partialPath.replace('.html','.pug');
            }
            logger.info(`partialPath: ${partialPath}`);
            try{
                let html = pug.renderFile(path.join(appConstants.APP_DIR, '/src/partials', partialPath),{
                    pretty: true,
                    model: httpReq.body,
                    theme: theme
                });
                httpRes.type('html').send(html);
            }catch(ex){
                httpRes.status(404).send('Required file missing');
            }
        },
        verifyCaptcha: function (request, response) {
            needle('post', 'https://www.google.com/recaptcha/api/siteverify', request.body, {}).then(function (resp) {
                response.json(resp.body);
            });
        },
        ssoHandler: function(request, response) {
          logger.info('SSO Handler Invoked');
          const theme = getTheme(request, true);
          const authData = {
            token: request.query.token || '',
            refreshToken: request.query.refreshToken || '',
            xpressdocCode: request.query.xpressdocCode || '',
            redirectURL: request.query.redirectURL || '',
          };
          let html = pug.renderFile(path.join(appConstants.APP_DIR, '/src/partials', '/index.pug'),{
            title: 'Loading...',
            pretty: true,
            model: authData,
            theme: theme,
            angularScipts: getAngularScriptsFromIndexPage(),
          });
          response.type('html').send(html);
        },
        requestHandler: function(request, response) {
          logger.info('Request Handler Invoked');
          const theme = getTheme(request);
          const indexFilePath = getIndexFilePathForTheme(theme);
          logger.info('Index file served '+indexFilePath);
          response.type('html').sendFile(indexFilePath);
        },
        jsonFileMissingErrorHandler: function(err, req, res, next){
            if(err.status === 404) {
                res.status(404).type('json').send({
                    status: 404,
                    ecode: 404,
                    edesc: (err.message) ? err.message: 'Not Found',
                    response: null
                });
            } else{
                next();
            }
        },
        errorHandler: function(err, req, res, next) {
            logger.info('Error Handler Invoked');
            logger.error(err.stack);
            let message = "Something is not right!";
            if(err != undefined) {

                if(err.status === 401) {

                    message = "You do not have access to this resource"

                } else if(err.status == 400) {
                    message = "SAMLResponse is undefined in ACS POST body"
                }
                else {

                    message = "Please contact for further assistance"
                }
            }
            let html = pug.renderFile(path.join(appConstants.APP_DIR, '/src/partials', '/error.pug'),{
                title: 'Something not right!!',
                theme: getTheme(req),
                error: message,
                pretty: true
            });
            res.status(500).type('html').send(html);
        }
    };
};
