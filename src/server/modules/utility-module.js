module.exports = function () {
    function getClientIP(req) {
      let xForwardedFor = req.headers['x-forwarded-for'] || '';
      if(xForwardedFor.indexOf(',')!==-1) {
        xForwardedFor = xForwardedFor.split(',')[0].trim();
      }
      return (xForwardedFor ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress);
    }
    function createApiResCallback(httpRes, logger) {
        return function (err, resp) {
            if(err) {
                if(logger) {
                    logger.error(err);
                }
                httpRes.status(500).json({
                    status: 500,
                    ecode: 500,
                    edesc: err.message,
                    response: null
                });
            }else{
                if(resp.statusCode===401){
                    httpRes.status(401).json({
                        status: 401,
                        ecode: 401,
                        edesc: resp.body,
                        response: null
                    });
                }else if(resp.statusCode===400){
                    httpRes.status(400).json({
                        status: 400,
                        ecode: 400,
                        edesc: (resp.body.message)?resp.body.message:'Bad Request',
                        response: null
                    });
                }else {
                    httpRes.status(resp.statusCode).send(resp.body);
                }
            }
        };
    }
    return {
        getClientIP:getClientIP,
        createApiResCallback:createApiResCallback
    }
}
