const http = require('http');
const https = require('https');
const F = require('./function');

const request = F.curry((options, data, onSuccessCallback, errorCallback) => {
    if (!options.headers) options.headers = {};

    if (data) {
        data = JSON.stringify(data);
        Object.assign(options.headers, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        });
    }

    const scheme = options.scheme === 'https' ? https : http;

    const req = scheme.request(options, (response) => {
        let responseData = '';
        response.on('data', (d) => responseData += d);
        response.on('end', () => onSuccessCallback(JSON.parse(responseData)));
    });

    if (data) req.write(data);

    req.on('error', errorCallback);

    req.end();
});

const get = F.curry((options, onSuccess, onFail) =>
    request(options, undefined, onSuccess, onFail));

const post = F.curry((options, data, onSuccess, onFail) =>
    request(Object.assign({ method: 'POST' }, options), data, onSuccess, onFail));

module.exports = {
    get,
    post,
    request
};
