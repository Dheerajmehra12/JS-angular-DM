const crypto = require('crypto');

module.exports = function () {
    function encrypt(text, secretKey) {
        secretKey = secretKey || 'd6F3Efeq';
        let cipher = crypto.createCipher('aes-256-cbc', secretKey)
        let crypted = cipher.update(text, 'utf8', 'hex')
        crypted += cipher.final('hex');
        return crypted;
    }

    function decrypt(hex, secretKey) {
        secretKey = secretKey || 'd6F3Efeq';
        let decipher = crypto.createDecipher('aes-256-cbc', secretKey)
        let dec = decipher.update(hex, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
    }

    function encryptPasswordHandler(httpReq, httpRes) {
        let username = httpReq.body.username;
        let password = httpReq.body.password;
        let passwordHex = encrypt(password, username);
        httpRes.json({
            username: username,
            password: password,
            passwordHex: passwordHex
        });
    }

    function decryptPasswordHandler(httpReq, httpRes) {
        let username = httpReq.body.username;
        let passwordHex = httpReq.body.passwordHex;
        let password = decrypt(passwordHex, username);
        httpRes.json({
            username: username,
            password: password,
            passwordHex: passwordHex
        });
    }

    return {
        encrypt: encrypt,
        decrypt: decrypt,
        encryptPasswordHandler: encryptPasswordHandler,
        decryptPasswordHandler: decryptPasswordHandler
    }
}
