const _       = require('lodash');
const Decimal = require('decimal.js');

const Buffet    = require('../../research/buffet-bonds.js');
const Stock     = require('../index.js');
const Symbols   = require('../../../symbols/index.js');

const test = (ticker, threshold = 0.2) => {
  return Stock.getTimeseries(ticker)
    .then((series) => {
      return candle({
        start: _.first(series),
        end: _.last(series)
      })

      // return candle({
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
      stats = candle({
        start,
        end: point
      });
    }

    return stats;
  }, {});
});

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


const inspectKeepWinnerDumpLoser = (shuffleCount, threshold) => {
  return getTickers('BUFFET')
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

      log.start = _
        .chain(log.runs)
        .map('start')
        .filter(_.isNumber)
        .sum()
        .value();

      log.end = _
        .chain(log.runs)
        .map('end')
        .filter(_.isNumber)
        .sum()
        .value();

      log.realChange = candle({
        start: { close: log.start },
        end: { close: log.end },
      }).change;

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
        console.log('run:', stats);
        log.runs.push(stats);
      })
      .then(() => {
        return logKeepWinnerDumpLoser(_.tail(tickers), threshold, log);
      })
  }

  return Promise.resolve(log);
};

// test('AAPL');

// keepWinnerDumpLoser('AAPL')
//   .then(console.log)
//   .catch(console.log)

// inspectKeepWinnerDumpLoser(100, -0.1)
//   .then(log => _.pick(log, ['change', 'start', 'end', 'realChange']))
//   .then(console.log)
//   .catch(console.log)

inspectKeepWinnerKeepLoser(100)
  .then(log => _.pick(log, ['change', 'start', 'end', 'realChange']))
  .then(console.log)
  .catch(console.log)
