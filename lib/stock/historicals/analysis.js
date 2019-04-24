const _       = require('lodash');
const Decimal = require('decimal.js');

const Stock     = require('./index.js');
const Symbols   = require('../../symbols/index.js');

const test = (ticker, threshold = 0.2) => {
  return Stock.getTimeseries(ticker)
    .then((series) => {
      return candel({
        start: _.first(series),
        end: _.last(series)
      })

      // return candel({
      //   start: { close: 100 },
      //   end: { close: 80 },
      // })
    })
    .then((valuation) => {
      console.log(valuation);
      return predict(valuation.start, valuation.change);
    })
    .then(console.log)
    .catch(console.log)
};

const keepWinnerDumpLoser = (ticker, threshold = -0.2) => {
  return Stock.getTimeseries(ticker)
    .then(randomSeries)
    .then(keepOrDump(threshold))
    .then((stats) => {
      if(stats) {
        stats.ticker = ticker;
      }

      return stats;
    })
};

const candel = (quotes) => {
  const start = quotes.start.close;
  const end = quotes.end.close;

  return {
    start,
    end,
    change: Decimal.div(end, start).sub(1).toNumber()
  };
};

const predict = (start, growthRate) => {
  return Decimal.add(growthRate, 1)
    .mul(start)
    .toNumber();
};

const randomSeries = (series = []) => {
  const start = _.random(0, series.length-1);
  return series.slice(start);
};

const keepOrDump = _.curry((threshold, series) => {
  series = series || [];

  if(!series || series.length < 2) {
    return null;
  }

  let start = series[0];

  return _.reduce(_.tail(series), (stats, point, index) => {
    // console.log('threshold', threshold)
    if(_.has(stats, 'change') === false || _.isNull(threshold) || _.get(stats, 'change') > threshold) {
      stats = candel({
        start,
        end: point
      });
    }

    return stats;
  }, {});
});

const inspectKeepWinnerDumpLoser = (shuffleCount, threshold) => {
  const options = {
    type: 'cs',
    isEnabled: true,
  };

  return Symbols.query(options)
    .then(stocks => _.map(stocks, 'symbol'))
    .then(stocks => _.filter(stocks, _.isString))
    .then((tickers) => {
      if(shuffleCount) {
        return _.take(_.shuffle(tickers), shuffleCount);
      }

      return tickers;
    })
    .then((tickers) => {
      return logKeepWinnerDumpLoser(tickers, threshold);
    })
    .then((log) => {
      log.change = _
        .chain(log.runs)
        .map('change')
        .filter(_.isNumber)
        .mean()
        .value();

      return log;
    })
};

const inspectKeepWinnerKeepLoser = (shuffleCount) => {
  return inspectKeepWinnerDumpLoser(shuffleCount, null);
};

const logKeepWinnerDumpLoser = (tickers, threshold, log = { runs: [] }) => {
  const ticker = _.head(tickers);

  if(ticker) {
    return keepWinnerDumpLoser(ticker, threshold)
      .then((stats) => {
        console.log('run stats', stats);
        log.runs.push(stats);
      })
      .then(() => {
        return logKeepWinnerDumpLoser(_.tail(tickers), threshold, log);
      })
  }

  return Promise.resolve(log);
};

// keepWinnerDumpLoser('AAPL')
//   .then(console.log)
//   .catch(console.log)

// inspectKeepWinnerDumpLoser(1000)
//   .then(log => _.pick(log, ['change']))
//   .then(console.log)
//   .catch(console.log)

inspectKeepWinnerKeepLoser(1000)
  .then(log => _.pick(log, ['change']))
  .then(console.log)
  .catch(console.log)
