const _       = require('lodash');
const Decimal = require('decimal.js');

const Stock     = require('../index.js');
const Symbols   = require('../../../symbols/index.js');

const Spreads   = require('../../../shared/spread');

const test = (ticker, threshold = 0.2) => {
  return Stock.getTimeseries(ticker)
    .then((series) => {
      // return Spreads.spread(series, 'close');
      return Spreads.getSpreadGrowthRatesBy(series);
    })
    .then(console.log)
    .catch(console.log)
};

const predict = (start, growthRate) => {
  return Decimal.add(growthRate, 1)
    .mul(start)
    .toNumber();
};

const getShareMarket = () => {
  const options = {
    type: 'cs',
    isEnabled: true,
  };

  return Symbols.query(options)
    .then(stocks => _.map(stocks, 'symbol'))
    .then(stocks => _.filter(stocks, _.isString))
    .then(tickers => _.take(tickers, 10))
    .then((tickers) => {
      const spreads = tickers.map(ticker => Stock.getTimeseries(ticker).then(Spreads.getSpreadGrowthRatesBy));

      return Promise.all(spreads)
        .then(Spreads.getShareMarket);
    })
};

// test('AAPL');

getShareMarket()
  .then(console.log)
  .catch(console.log)
