const Api = require('./api');

class MarketNeutral {
    constructor({ long, short, key, secret }) {
        this.long = long;
        this.short = short;
        this.api = new Api({ key, secret });
    }

    /**
     * @return {Promise<{volume: Number, leverage: string, profit: Number}>}
     */
    async getPositions() {
        const allPositions = await this.api.getPositions();
        const positions = allPositions.filter(row => [this.long, this.short].includes(row.symbol));

        const profit = positions.reduce((acc, { unRealizedProfit }) => acc + Number(unRealizedProfit), 0);
        const volume = positions.reduce((acc, { positionAmt, markPrice }) => acc + Number(markPrice) * Math.abs(positionAmt), 0);
        const [{ leverage }] = positions;

        return { profit, volume, leverage };
    }

    /**
     * @typedef OrderResult
     * @property {Number} orderId
     * @property {string} symbol
     * @property {string} status
     * @property {string} clientOrderId
     * @property {string} price
     * @property {string} avgPrice
     * @property {string} origQty
     * @property {string} executedQty
     * @property {string} cumQty
     * @property {string} cumQuote
     * @property {string} timeInForce
     * @property {string} type
     * @property {boolean} reduceOnly
     * @property {boolean} closePosition
     * @property {boolean} priceProtect
     * @property {string} side
     * @property {string} positionSide
     * @property {string} stopPrice
     * @property {string} workingType
     * @property {string} origType
     * @property {string} updateTime
     *
     * @param volume
     * @return {Promise<OrderResult[]>}
     */
    async open({ volume }) {
        const info = await this.api.exchangeInfo();
        const orders = [];

        for (const symbol of [this.long, this.short]) {
            const { asks: [[ask]], bids: [[bid]] } = await this.api.depth({ symbol });
            const side = this.long === symbol ? 'BUY' : 'SELL';
            const quantity = volume / (side === 'BUY' ? ask : bid); 

            const { filters } = info.symbols.find(row => row.symbol === symbol);
            const { stepSize } = filters.find(row => row.filterType === 'MARKET_LOT_SIZE');

            orders.push({
                symbol,
                side,
                quantity: Number(quantity).toFixed(-Math.log10(stepSize)),
                type: 'MARKET',
            });
        }

        return Promise.all(orders.map((order) => this.api.createOrder(order)));
    }

    /**
     * @return {Promise<OrderResult[]>}
     */
    async close() {
        const positions = await this.api.getPositions();
        const orders = [];

        for (const symbol of [this.long, this.short]) {
            const position = positions.find(row => row.symbol === symbol);
            const { positionAmt } = position;

            if (Number(positionAmt) === 0) {
                continue;
            }

            orders.push({
                symbol,
                side: Number(positionAmt) > 0 ? 'SELL' : 'BUY',
                quantity: Math.abs(positionAmt),
                type: 'MARKET',
            });
        }

        return Promise.all(orders.map((order) => this.api.createOrder(order)));
    }
}

module.exports = MarketNeutral;