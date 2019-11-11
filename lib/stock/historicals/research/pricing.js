const _       = require('lodash');
const Decimal = require('decimal.js');

const Buffet    = require('../../research/buffet-bonds.js');
const Stock     = require('../index.js');
const Symbols   = require('../../../symbols/index.js');

const Trends    = require('../../../shared/trends');
const Maxima    = require('../../../shared/maxima');
const Research  = require('./util');

const { candle } = require('./util');
const { growthRate } = require('../../../shared/fundamentals/growthRate.js');

const { tradeAfterTurns, long, short, trade } = require('./trade');
const Trader = require('./commit');

const getTrendsByTicker = (ticker) => {
  return Stock.getTimeseries(ticker)
    // .then(Research.randomSeries)
    // .then(Research.split)
    // .then(getTrends)
    // .then(trends => trends.upper)
    .then(tradeAfterTurns(120, 0.12, 'trade'))
};

const getTrends = (series) => {
  return Trends((quote) => { return quote.close; }, series);
};

const longOrShortAnalysis = ({ strategy, options, shuffle, count } = {}) => {
  strategy = strategy || 'COMMON';
  shuffle = shuffle || false;

  return Research.getTickers(strategy)
    .then((tickers) => {
      const candidates = shuffle ? _.shuffle(tickers) : tickers;
      return count ? _.take(candidates, count) : candidates;
    })
    .then(testLongOrShort(options))
};

const buyAndSellPortfolio = (name, options) => {
  return Research.getPortfolio(name)
    .then(stocks => _.map(stocks, 'ticker'))
    .then(testLongOrShort(options))
};

const testLongOrShort = _.curry((options, tickers) => {
  return Promise.all(tickers.map(getAuditByTicker(options)))
    .then((audits) => {
      const backtest = {
        // audits,
        state: {
          invested: _.sumBy(audits, 'invested'),
          net: _.sumBy(audits, 'net'),
          balance: _.sumBy(audits, 'balance'),
        }
      };

      backtest.state.change = _.first(growthRate([backtest.state.invested, backtest.state.net])) || 0;

      return backtest;
    })
    // .then(audits => _.filter(audits, { change: -1 }))
});

const getAuditByTicker = _.curry((options, ticker) => {
  const { windowInDays, threshold } = _.get(options, 'entry') || {
    windowInDays: 120,
    threshold: 0.12,
  };

  const tradeType = _.get(options, 'tradeType') || 'long';
  // console.log('tradeType', tradeType);

  return Stock.getTimeseries(ticker)
    .then(Research.slice(_.get(options, 'range')))
    .then(tradeAfterTurns(windowInDays, threshold, tradeType))
    .then(stats => Object.assign({ ticker }, _.get(stats, 'audit')))
});

const longAndShortAnalysis = ({ strategy, options, shuffle, count } = {}) => {
  strategy = strategy || 'COMMON';
  shuffle = shuffle || false;

  return Research.getTickers(strategy)
    .then((tickers) => {
      const candidates = shuffle ? _.shuffle(tickers) : tickers;
      return count ? _.take(candidates, count) : candidates;
    })
    .then(testLongAndShort(options))
};

const testLongAndShort = _.curry((options, tickers) => {
  const [longs, shorts] = Research.split(tickers);

  return Promise.all([
    Promise.all(longs.map(getAuditByTicker(_.merge(options, { tradeType: 'long'})))),
    Promise.all(shorts.map(getAuditByTicker(_.merge(options, { tradeType: 'short'})))),
  ]).then(_.flatten)
    .then((positions) => {
      const backtest = {
        positions,
        state: Trader.audit(positions),
      };

      // backtest.state.change = _.first(growthRate([backtest.state.invested, backtest.state.net])) || 0;

      return backtest;

      // const [ losers, winners ] = _.partition(audits, (audit) => {
      //   return audit.balance < 0;
      // });
      //
      // const [ shorts, longs ] = _.partition(audits, (audit) => {
      //   return audit.trade === 'short';
      // });
      //
      // const backtest = {
      //   audits,
      //   state: {
      //     invested: _.sumBy(audits, 'invested'),
      //     net: _.sumBy(audits, 'net'),
      //     balance: _.sumBy(audits, 'balance'),
      //
      //     losers: losers.length,
      //     winners: winners.length,
      //
      //     longs: statisticalOverview(longs),
      //     shorts: statisticalOverview(shorts),
      //   }
      // };
      //
      // backtest.state.change = _.first(growthRate([backtest.state.invested, backtest.state.net])) || 0;
      //
      // return backtest;
    })
    // .then(backtest => _.filter(backtest.audits, audit => audit.trade === 'short' && audit.change > 1))
    // .then(backtest => JSON.stringify(backtest, null, 2))
    // .then(audits => _.filter(audits, { change: -1 }))
});

const statisticalOverview = (audits) => {
  const [ losers, winners ] = _.partition(audits, (audit) => {
    return audit.balance < 0;
  });

  return {
    count: audits.length,
    losers: losers.length,
    winners: winners.length,

    invested: _.sumBy(audits, 'invested'),
    net: _.sumBy(audits, 'net'),
    balance: _.sumBy(audits, 'balance'),
  };
};

const findMisfitCandidate = () => {
  return longAndShortAnalysis(config)
    .then(result => result.state.fail.net < -100000 ? result.state.fail.ticker : null)
};

const findMisfit = () => {
  return _.times(1000, _.constant(1)).reduce((promise, value, index) => {
    return promise.then((ticker) => {
      console.log('run', index);
      return ticker || findMisfitCandidate();
    });
  }, Promise.resolve());
};

const simulatePortfolio = () => {
  return longAndShortAnalysis(config)
    .then(result => result.state)
};

const simulatePortfolios = () => {
  return _.times(1000, _.constant(1)).reduce((promise, value, index) => {
    return promise.then((audit) => {
      const report = _.pick(audit, ['count', 'losers', 'winners', 'balance', 'net']);
      report.change = _.first(growthRate([report.net, report.balance + report.net])) || 0;

      console.log('run', index, report);
      return simulatePortfolio();
    });
  }, simulatePortfolio());
};

// console.log(candle({
//   start: {
//     close: 120,
//   },
//   end: {
//     close: 90,
//   }
// }));

// getTrendsByTicker('VALE')
//   .then(console.log)
//   .catch(console.log)

// Stock.getTimeseries('AAPL')
//   .then(Research.slice({ start: '2017-05-01', end: '2018-05-02' }))
//   .then(series => [_.first(series), _.last(series)])
//   .then(console.log)
//   .catch(console.log)

const config = {
  strategy: 'COMMON',
  shuffle: true,
  count: 100,

  options: {
    // tradeType: 'short',
    entry: { windowInDays: 365, threshold: 0.11, },
    range: { start: '2017-05-01', end: '2019-05-01' },
  }
};

// longOrShortAnalysis(config)
//   .then(console.log)
//   .catch(console.log)

longAndShortAnalysis(config)
  .then(console.log)
  .catch(console.log)

// buyAndSellPortfolio('andre', config.options)
//   .then(console.log)
//   .catch(console.log)

// findMisfit()
//   .then(console.log)
//   .catch(console.log)

// simulatePortfolios()
//   .then(console.log)
//   .catch(console.log)
