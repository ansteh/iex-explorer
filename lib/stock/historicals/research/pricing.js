const _       = require('lodash');
const Decimal = require('decimal.js');

const Buffet    = require('../../research/buffet-bonds.js');
const Stock     = require('../index.js');
const Symbols   = require('../../../symbols/index.js');

const Trends    = require('../../../shared/trends');
const Maxima    = require('../../../shared/maxima');
const Research  = require('./util');

const { candle } = require('./util');

const getTrendsByTicker = (ticker) => {
  return Stock.getTimeseries(ticker)
    // .then(Research.randomSeries)
    // .then(Research.split)
    .then(getTrends)
    // .then(trends => trends.upper)
    // .then(keepOrDump(threshold))
    // .then((stats) => {
    //   if(stats) {
    //     stats.ticker = ticker;
    //   }
    //
    //   return stats;
    // })
};

const getTrends = (series) => {
  return Trends((quote) => { return quote.close; }, series);
};

const buyAfterValley = _.curry((threshold, series) => {
  series = series || [];

  if(!series || series.length < 2) {
    return null;
  }

  let start = series[0];

  return _.reduce(_.tail(series), (stats, point, index) => {
    // console.log('threshold', threshold)
    if(_.has(stats, 'change') === false || _.isNull(threshold) || _.get(stats, 'change') > threshold) {
      stats = candle({
        start,
        end: point
      });
    }

    return stats;
  }, {});
});

getTrendsByTicker('AAPL')
  .then(console.log)
  .catch(console.log)
