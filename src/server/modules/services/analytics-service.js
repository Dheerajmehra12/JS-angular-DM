module.exports = function (express, app) {
    const appConstants = require('../../app-constants');
    const logger = require(appConstants.MODULE_DIR+ '/logger-module');
    const needle = require('needle');
    require('dotenv').config({path: appConstants.ENVIRONMENT_DIR + '/' + (process.env.ENV || '') + '.env'}).parsed;
    const xl = require('excel4node');
    const AWS=require('aws-sdk');
    const s3 = new AWS.S3();
    const moment = require('moment');
    const puppeteer = require('puppeteer');

    const cdnBaseUrl=process.env.CDN_BASE_URL || 'https://cdn.cmcd1.com';
    const bucket=process.env.S3_BUCKET || 'cd_cdn';
    const basepath=process.env.S3_BASE_UPLOAD_PATH  || '/alm/stage';
    let actualApiBase = `http://${process.env.API_HOST}:${process.env.API_HOST_PORT}`;
    const supportedExportFormat = {
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pdf': 'application/pdf'
    };

    async function uploadFileOnS3(uploadRequest) {
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
        logger.info(`uploadFileOnS3::: ${location}, ${key}`);
        return location;
    }

    function exportAnalyticsXLS(httpReq, httpRes) {
        let campaignId=httpReq.query.campaignId;
        let sortBy=httpReq.query.sortBy;
        let sortOrder=httpReq.query.sortOrder;
        let useSample=httpReq.query.useSample && httpReq.query.useSample==='true';

        let data={startIdx: 0, pageSize: 100, sortBy: sortBy, sortOrder: sortOrder, useSample: useSample};
        let headers=httpReq.headers;
        let opts = {headers: headers};
        if(httpReq.headers.token) {
            opts.headers['Authorization']='Bearer '+httpReq.headers.token; //from ui token comes with header key token while actual api uses Bearer token
            delete opts.headers.token;// removing original token key in header
        }

        logger.info(`campaignId:${campaignId}, data: ${JSON.stringify(data)}, opts:${JSON.stringify(opts)}`);

        let total=0;
        let arrPromise=[];

        let wb = new xl.Workbook();
        let ws = wb.addWorksheet('Analytics');

        var ctrStyle = wb.createStyle({
            numberFormat: '0.00"%"',
        });
        var textRed = wb.createStyle({
            font: { color: "red"}
        });
        var textGreen = wb.createStyle({
            font: { color: "green"}
        });

        var styles={};
        styles.ctr=ctrStyle;
        styles.textRed=textRed;
        styles.textGreen=textGreen;

        fetchAnalyticsReportData(campaignId, data, opts, styles, ws, httpReq).then(function (resp) {
            total=resp.total;
            let totalPages=Math.ceil(total/data.pageSize);
            logger.info(`totalPages:${totalPages}`);
            if(!data.useSample) {
                for(let pageNo=2;pageNo<=totalPages;pageNo++) {
                    let start=data.pageSize*(pageNo-1);
                    arrPromise.push(fetchAnalyticsReportData(campaignId, {
                        startIdx: start,
                        pageSize: data.pageSize,
                        sortBy: sortBy,
                        sortOrder: sortOrder
                    }, opts, styles, ws, httpReq));
                }
            }
            return resp;
        }).then(function () {
            Promise.all(arrPromise).then(function () {
                let timestamp=moment().valueOf();
                let uploadPath=`${basepath}/exports/Analytics_Report_${timestamp}.xlsx`;
                let uploadKey=(uploadPath.startsWith('/'))?uploadPath.substr(1):uploadPath;

                wb.writeToBuffer().then(function (buffer) {
                    exportBufferAndSendResponse(buffer, uploadKey, httpRes);
                });
            });
        });
    }

    async function exportDashboardXLS(httpReq, httpRes) {
        let campaignId = httpReq.query.campaignId;
        let useSample = httpReq.query.useSample && httpReq.query.useSample==='true';
        let datapoints = httpReq.query.datapoints || 6;

        let data = {
            useSample: useSample,
            datapoints: datapoints
        };
        let headers=httpReq.headers;
        let opts = {headers: headers};
        if(httpReq.headers.token) {
            opts.headers['Authorization']='Bearer '+httpReq.headers.token; //from ui token comes with header key token while actual api uses Bearer token
            delete opts.headers.token;// removing original token key in header
        }

        logger.info(`campaignId:${campaignId}, data: ${JSON.stringify(data)}, opts:${JSON.stringify(opts)}`);

        let wb = new xl.Workbook();
        let wsOverall = wb.addWorksheet('Overall');
        let wsDailyStats = wb.addWorksheet('Daily Stats');
        let wsDeviceStats = wb.addWorksheet('Device Stats');

        var ctrStyle = wb.createStyle({
            numberFormat: '0.00"%"',
        });

        var styles={};
        styles.ctr=ctrStyle;

        let dailyStats= await fetchDashboardReportDailyStatsData(campaignId, data, opts, httpReq);

        let overAllStats=writeDailyStatsSheet(wsDailyStats, dailyStats, styles);
        writeOverAllStatsSheet(wsOverall, overAllStats, styles);

        let deviceStats = await fetchDashboardReportDeviceStatsData(campaignId, data, opts, httpReq);
        writeDeviceStatsSheet(wsDeviceStats, deviceStats);

        let timestamp=moment().valueOf();
        let uploadPath=`${basepath}/exports/Dashboard_Report_${timestamp}.xlsx`;
        let uploadKey=(uploadPath.startsWith('/'))?uploadPath.substr(1):uploadPath;

        wb.writeToBuffer().then(function (buffer) {
            exportBufferAndSendResponse(buffer, uploadKey, httpRes);
        });
    }

    async function fetchDashboardReportDailyStatsData(campaignId, data, opts, httpReq) {
        let dailyReport=null;
        if(!data.useSample) {
            dailyReport=await needle('get', `${actualApiBase}/ctv/dailystats/v1/${campaignId}`, data, opts).then(function (resp) {
                return (resp.body && resp.body.response)?resp.body.response:[];
            });
        }else{
            let reqUrl=`${httpReq.protocol}://${httpReq.headers.host}/samples/sample-daily-stats.json`;
            logger.info(`sample export url: ${reqUrl}`);
            dailyReport=await needle('get', reqUrl , {}, {}).then(function (resp) {
                return (resp.body && resp.body.response)?resp.body.response:[];
            });
        }
        return dailyReport;
    }

    async function fetchDashboardReportDeviceStatsData(campaignId, data, opts, httpReq) {
        let dailyReport=null;
        if(!data.useSample) {
            dailyReport=await needle('get', `${actualApiBase}/ctv/devicestats/v1/${campaignId}`, data, opts).then(function (resp) {
                return (resp.body && resp.body.response)?resp.body.response:[];
            });
        }else{
            let reqUrl=`${httpReq.protocol}://${httpReq.headers.host}/samples/sample-device-stats.json`;
            logger.info(`sample export url: ${reqUrl}`);
            dailyReport=await needle('get', reqUrl , {}, {}).then(function (resp) {
                return (resp.body && resp.body.response)?resp.body.response:[];
            });
        }
        return dailyReport;
    }

    function writeDailyStatsSheet(ws, dailyReport, styles) {
        let total=dailyReport.length;
        let totImpressions=0;
        let totClicks=0;
        let netCtr=0;
        let row=1;
        let col=1;
        ws.cell(row,col).string('Start Date');col++;
        ws.cell(row,col).string('End Date');col++;
        ws.cell(row,col).string('Views');col++;
        ws.cell(row,col).string('Clicks');col++;
        ws.cell(row,col).string('CTR');col++;
        row++;
        if (total > 0) {
            for (let index = 0; index < total; index++) {
                let col=1;
                let record=dailyReport[index];
                let tsEndDate = moment(record.date+'T23:59:59.999', 'YYYY-MM-DDTHH:mm:ss.SSS').valueOf();
                logger.info(`End Date: ${moment(tsEndDate).format('YYYY-MM-DD HH:mm:ss.SSS')}`);
                let strStartDay = ((record.daterange && record.daterange.indexOf('-') !== -1) ? record.daterange.split('-')[0] : '01');
                let strStartDate = moment(tsEndDate).format('YYYY-MM') + '-'+strStartDay;
                let tsStartDate = moment(strStartDate+'T00:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS').valueOf();
                ws.cell(row,col).string(moment(tsStartDate).format('YYYY-MM-DD'));col++;
                ws.cell(row,col).string(record.date);col++;
                ws.cell(row,col).number(record.impressions);col++;
                ws.cell(row,col).number(record.clicks);col++;
                ws.cell(row,col).number(record.ctr).style(styles.ctr);
                totImpressions+=record.impressions;
                totClicks+=record.clicks;
                logger.info(`record=${JSON.stringify(record)}, totImpressions=${totImpressions}, totClicks=${totClicks}`);
                row++;
            }
            if(totImpressions>0 && totClicks>0) {
                netCtr=totClicks/totImpressions*100;
            }
        }
        return {impressions: totImpressions, clicks: totClicks, ctr: netCtr};
    }

    function writeDeviceStatsSheet(ws, deviceStats) {
        let total=deviceStats.length;
        let row=1;
        let col=1;
        ws.cell(row,col).string('Device');col++;
        ws.cell(row,col).string('Views');col++;
        ws.cell(row,col).string('Clicks');
        row++;
        if (total > 0) {
            for (let index = 0; index < total; index++) {
                let col=1;
                let record=deviceStats[index];
                ws.cell(row,col).string(record.device);col++;
                ws.cell(row,col).number(record.impressions);col++;
                ws.cell(row,col).number(record.clicks);
                row++;
            }
        }
    }

    function writeOverAllStatsSheet(ws, overAllStats, styles){
        let row=1;
        let col=1;
        ws.cell(row,col).string('Total Views');col++;
        ws.cell(row,col).string('Total Clicks');col++;
        ws.cell(row,col).string('CTR');col++;
        row++;
        col=1;
        ws.cell(row,col).number(overAllStats.impressions);col++;
        ws.cell(row,col).number(overAllStats.clicks);col++;
        ws.cell(row,col).number(overAllStats.ctr).style(styles.ctr);
    }

    function getMimeType(uploadKey) {
        let calculatedMimeType=null;
        Object.keys(supportedExportFormat).forEach(function (mimeType) {
            if(uploadKey.toLowerCase().endsWith(mimeType.toLowerCase())) {
                calculatedMimeType=supportedExportFormat[mimeType];
                return;
            }
        });
        return calculatedMimeType;
    }

    function exportBufferAndSendResponse(buffer, uploadKey, httpRes) {
        let mimeType = getMimeType(uploadKey);
        logger.info(`Calculated mimeType: ${mimeType} for uploadKey: ${uploadKey}`);
        let uploadRequest = {
            Bucket: bucket,
            Key: uploadKey,
            Body: buffer,
            ACL: 'public-read',
            ContentEncoding: 'binary',
            ContentType: 'data:application/octet-stream'
        };
        let location=uploadFileOnS3(uploadRequest);
        location.then(function (s3Url) {
            logger.info(`Returned s3 location is ${s3Url}`);
            let resp={
                ecode:0,
                edesc:null,
                url: `${cdnBaseUrl}/${uploadKey}`,
                s3Url: `${s3Url}`
            };
            logger.info(`export response sent => ${JSON.stringify(resp)}`);
            logger.info('Writing completed');
            httpRes.json(resp);
        },function (err) {
            logger.error(err);
            let resp={
                ecode:500,
                edesc: 'Unable to upload exported file on s3',
                url: null,
                s3Url: null
            };
            logger.info(`export response sent => ${JSON.stringify(resp)}`);
            httpRes.json(resp);
        });
    }

    function fetchAnalyticsReportData(campaignId, data, opts, styles, ws, httpReq) {
        if(!data.useSample) {
            return needle('get', `${actualApiBase}/magnet/statsbycontact/v1/${campaignId}`, data, opts).then(function (resp) {
                return analyticsReportDataHandler(resp, data, styles, ws);
            });
        }else{
            let reqUrl=`${httpReq.protocol}://${httpReq.headers.host}/samples/sample-contact-stats.json`;
            logger.info(`sample export url: ${reqUrl}`);
            return needle('get', reqUrl , {}, {}).then(function (resp) {
                return analyticsReportDataHandler(resp, data, styles, ws);
            });
        }
    }

    function analyticsReportDataHandler(resp, data, styles, ws) {
        let total = (resp.body && resp.body.response) ? resp.body.response.total : 0;
        let records = (resp.body && resp.body.response && resp.body.response.contacts) ? resp.body.response.contacts.length : 0;
        logger.info(`total=${total}, records=${records}`);
        let contacts=[];
        let row=data.startIdx+1;
        if(row===1) {
            let col=1;
            ws.cell(row,col).string('First Name');col++;
            ws.cell(row,col).string('Last Name');col++;
            ws.cell(row,col).string('Street');col++;
            ws.cell(row,col).string('City');col++;
            ws.cell(row,col).string('State');col++;
            ws.cell(row,col).string('Zip Code');col++;
            ws.cell(row,col).string('Home Phone No.');col++;
            ws.cell(row,col).string('Email Address');col++;
            ws.cell(row,col).string('Viewed');col++;
            ws.cell(row,col).string('Clicked');col++;
            //ws.cell(row,col).string('CTR');
            row++;
        }
        if (total > 0 && records > 0) {
            contacts=resp.body.response.contacts;
            for (let index = 0; index < records; index++) {
                let col=1;
                let contact=contacts[index];
                ws.cell(row,col).string(contact.firstName);col++;
                ws.cell(row,col).string(contact.lastName);col++;
                ws.cell(row,col).string(contact.street);col++;
                ws.cell(row,col).string(contact.city);col++;
                ws.cell(row,col).string(contact.state);col++;
                ws.cell(row,col).string(contact.zip);col++;
                ws.cell(row,col).string((contact.mobilePhone===null)?'':contact.mobilePhone);col++;
                ws.cell(row,col).string(contact.email);col++;
                if(contact.impressions>0){
                    ws.cell(row,col).string('\u2714').style(styles.textGreen);col++;
                }else {
                    ws.cell(row,col).string('\u2718').style(styles.textRed);col++;
                }
                if(contact.clicks>0){
                    ws.cell(row,col).string('\u2714').style(styles.textGreen);col++;
                }else {
                    ws.cell(row,col).string('\u2718').style(styles.textRed);col++;
                }
                //ws.cell(row,col).number(contact.ctr).style(styles.ctr);
                row++;
            }
        }
        return {contacts:contacts,total:total,records:records};
    }

    async function doExportPDFReport(pageURL, landscape){
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        logger.info(`openLinkUrl=${pageURL}`);
        try {
          await page.goto(pageURL, {
            waitUntil: "networkidle0",
            timeout: 0
          });
          await page.waitForSelector('#PDF_Report');
        } catch (err) {
          logger.error(`Unable to locate element of target page while exporting pdf: ${err.message}`);
        }
        await page.content();
        let pdf = await page.pdf({
            format: 'a4',
            printBackground: true,
            landscape: landscape,
            scale: (landscape) ? 0.9 : 1
        });
        await browser.close();
        return pdf;
    }

    function getProtocol(httpReq, useReferer = false) {
      const referer = httpReq.headers.referer;
      if (useReferer && referer) {
        const refUrl = new URL(referer);
        return refUrl.protocol.replace(':', '');
      }else{
        return httpReq.protocol;
      }
    }

    async function exportPDFReport(httpReq, httpRes) {
        let campId = (httpReq.query.campaignId || '');
        let token = decodeURIComponent(httpReq.query.token || '');
        let refreshToken = decodeURIComponent(httpReq.query.refreshToken || '');
        let xpressdocCode = httpReq.query.xpressdocCode || '';
        let useSample = httpReq.query.useSample || false;
        let activeTab = httpReq.query.activeTab || 'dashboard';
        let landscape = (activeTab === 'analytics');
        const protocol = getProtocol(httpReq, true);
        logger.info(`exportReport[token]=${token}`);
        logger.info(`exportReport[refreshToken]=${refreshToken}`);
        logger.info(`exportReport[xpressdocCode]=${xpressdocCode}`);
        logger.info(`exportReport[campId]=${campId}`);
        logger.info(`exportReport[useSample]=${useSample}`);
        logger.info(`exportReport[activeTab]=${activeTab}`);
        logger.info(`exportReport[landscape]=${landscape}`);
        logger.info(`exportReport[protocol]=${protocol}`);
        let redirectURL = `${protocol}://${httpReq.headers.host}/campaign-list/campaigns/${campId}/analytics?useSample=${useSample}&activeTab=${activeTab}&hideChatBox=true`;
        let openLinkUrl = `${protocol}://${httpReq.headers.host}/api/sso?token=${encodeURIComponent(token)}&xpressdocCode=${encodeURIComponent(xpressdocCode)}&refreshToken=${encodeURIComponent(refreshToken)}&redirectURL=${encodeURIComponent(redirectURL)}`;
        let pdf = await doExportPDFReport(openLinkUrl,landscape);
        let timestamp = moment().valueOf();
        let uploadPath = `${basepath}/exports/${activeTab}_Report_${timestamp}.pdf`;
        let uploadKey=(uploadPath.startsWith('/'))?uploadPath.substr(1):uploadPath;
        let mimeType = getMimeType(uploadKey);
        logger.info(`Calculated mimeType: ${mimeType} for uploadKey: ${uploadKey}`);
        let uploadRequest = {
            Bucket: bucket,
            Key: uploadKey,
            Body: pdf,
            ACL: 'public-read',
            ContentEncoding: 'binary',
            ContentType: 'data:application/octet-stream'
        };
        let location=await uploadFileOnS3(uploadRequest);
        if(location!=='') {
            httpRes.json({
                ecode:0,
                edesc:null,
                url: `${cdnBaseUrl}/${uploadKey}`,
                s3Url: `${location}`
            });
        }else {
            httpRes.json({
                ecode:500,
                edesc: 'Unable to upload exported file on s3',
                url: null,
                s3Url: null
            });
        }
    }

    async function doExportHeatMap(pageURL, width, height){
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        let viewPortSize = {width: width, height: height+52, deviceScaleFactor: 1};
        await page.setViewport(viewPortSize);
        logger.info(`openLinkUrl=${pageURL}`);
        await page.goto(pageURL, {
            waitUntil: "networkidle0",
            timeout: 0
        });
        await page.content();
        let imageType='jpeg';
        let capturedImage = await page.screenshot({type: imageType, encoding: 'base64'});
        let imageData=`data:image/${imageType};base64,${capturedImage}`;
        await browser.close();
        return imageData;
    }

    async function exportHeatMap(httpReq, httpRes) {
        let campId = httpReq.query.campId || '';
        let token = httpReq.query.token || '';
        let refreshToken = httpReq.query.refreshToken || '';
        let xpressdocCode = httpReq.query.xpressdocCode || '';
        let mapType = httpReq.query.mapType || '';
        let width = httpReq.query.width || '';
        let height = httpReq.query.height || '';
        let redirectURL = `${httpReq.protocol}://${httpReq.headers.host}/#/heatmap/${campId}/${mapType}?width=${width}&height=${height}`;
        let openLinkUrl = `${httpReq.protocol}://${httpReq.headers.host}/#/openLink?token=${encodeURIComponent(token)}&xpressdocCode=${encodeURIComponent(xpressdocCode)}&refreshToken=${encodeURIComponent(refreshToken)}&redirectURL=${encodeURIComponent(redirectURL)}`;
        let imageBase64 = await doExportHeatMap(openLinkUrl,parseInt(width),parseInt(height));
        let timestamp = moment().format('DD_MM_YYYY_HH_mm_ss_SSS');
        let imageData=imageBase64.replace(/^data:image\/\w+;base64,/, '');
        let base64Data = new Buffer.from(imageData, 'base64');
        let ext = imageBase64.split(';')[0].split('/')[1];
        let mimeType = `image/${ext}`;
        let uploadPath = `${basepath}/heatmaps/camp_${campId}_${mapType}_${timestamp}.${ext}`;
        let uploadKey=(uploadPath.startsWith('/'))?uploadPath.substr(1):uploadPath;
        let uploadRequest = {
            Bucket: bucket,
            Key: uploadKey,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: mimeType
        };

        let location=await uploadFileOnS3(uploadRequest);
        if(location!=='') {
            httpRes.json({
                ecode:0,
                edesc:null,
                url: `${cdnBaseUrl}/${uploadKey}`,
                s3Url: `${location}`
            });
        }else {
            httpRes.json({
                ecode:500,
                edesc: 'Unable to upload exported file on s3',
                url: null,
                s3Url: null
            });
        }
    }

    return {
        exportAnalyticsXLS: exportAnalyticsXLS,
        exportDashboardXLS:exportDashboardXLS,
        exportPDFReport:exportPDFReport,
        exportHeatMap:exportHeatMap
    };
};
