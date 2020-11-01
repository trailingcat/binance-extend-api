const MarketNeutral = require('../src/marketNeutral');

const market = new MarketNeutral({
    long: 'WAVESUSDT',
    short: 'EOSUSDT',
    key: process.env.BINANCE_KEY,
    secret: process.env.BINANCE_SECRET,
});

const run = async () => {
    let stop = false;

    try {
        const { volume, profit } = await market.getPositions();

        if (volume <= 0) {
            await market.open({ volume: 50 });
            console.log('Position open');
        } if (profit > 1) {
            await market.close();
            console.log('Close with profit');
            stop = true;
        } else if (profit < -1) {
            await market.close();
            console.log('Close with lose');
            stop = true;
        }
    } catch (err) {
        console.log('error', err);
    }

    if (stop) {
        clearInterval(interval);
    }
};

const interval = setInterval(run, 10000);
