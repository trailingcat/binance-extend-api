const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');

class BinanceFuturesAPI {
    constructor({ key, secret, baseUrl }) {
        this.key = key;
        this.secret = secret;
        this.baseUrl = baseUrl || 'https://fapi.binance.com';
    }

    async getPositions(options = {}) {
        return this.request('GET', '/fapi/v1/positionRisk', options);
    }

    async exchangeInfo(options = {}) {
        return this.request('GET', '/fapi/v1/exchangeInfo', options);
    }

    async depth(options) {
        return this.request('GET', '/fapi/v1/depth', options);
    }

    async createOrder(options) {
        return this.request('POST', '/fapi/v1/order', options);
    }

    sign(queryString) {
        return crypto.createHmac('sha256', this.secret)
            .update(queryString)
            .digest('hex');
    }

    async request(method, route, query, security = true) {
        const headers = {};
        const options = { ...query, timestamp: Date.now() };
        let url;
        let data;
        let signature;

        if (security && this.key) {
            headers[ 'X-MBX-APIKEY'] = this.key;
        }

        if (security) {
            signature = this.sign(querystring.stringify(options));
        }

        if (method === 'GET') {
            url = this.baseUrl + route + '?' + querystring.stringify({ ...options, signature });
        } else {
            url = this.baseUrl + route + '?' + querystring.stringify({ signature });
            data = querystring.stringify(options);
        }

        const { data: responseData } = await axios({
            method,
            url,
            headers,
            data,
        });

        return responseData;
    }
}

module.exports = BinanceFuturesAPI;
// module.exports = require('../futures/api');
