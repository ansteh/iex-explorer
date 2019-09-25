const _       = require('lodash');
const Decimal = require('decimal.js');

const Buffet    = require('../../research/buffet-bonds.js');
const Stock     = require('../index.js');
const Symbols   = require('../../../symbols/index.js');

const STRATEGY_SYMBOLS = {
  COMMON: () => {
    const options = {
      type: 'cs',
      isEnabled: true,
    };

    return Symbols.query(options)
  },
  BUFFET: () => {
    return Buffet.findProspects()
  }
};

const getTickers = (strategy = 'COMMON') => {
  return STRATEGY_SYMBOLS[strategy]()
    .then(stocks => _.map(stocks, 'symbol'))
    .then(stocks => _.filter(stocks, _.isString))
};

const randomSeries = (series = []) => {
  const start = _.random(0, series.length-1);
  return series.slice(start);
};

const split = (series = [], ratio = 0.5) => {
  const position = Math.floor(series.length*ratio);

  return [
    series.slice(0, position),
    series.slice(position),
  ];
};

const candle = (quotes) => {
  const start = quotes.start.close;
  const end = quotes.end.close;

  return {
    start,
    end,
    change: Decimal.div(end, start).sub(1).toNumber(),
    // volume: Decimal.div(quotes.end.volume, quotes.start.volume).sub(1).toNumber(),
  };
};

module.exports = {
  candle,
  getTickers,
  randomSeries,
  split,
};
