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

const getTrendsByTicker = (ticker) => {
  return Stock.getTimeseries(ticker)
    // .then(Research.randomSeries)
    // .then(Research.split)
    // .then(getTrends)
    // .then(trends => trends.upper)
    .then(buyAfterValley(120, 0.12, long))
};

const getTrends = (series) => {
  return Trends((quote) => { return quote.close; }, series);
};

const buyAfterValley = _.curry((days, threshold, tradeType, series) => {
  series = series || [];

  if(!series || series.length < 2) {
    return null;
  }

  let min = series[0];
  let max = series[0];
  let past = 1;

  const buys = [];
  const sells = [];

  _.forEach(_.tail(series), function(quote) {
    if(past === days) {
      min = quote;
      max = quote;
      past = 1;
    }

    min = filter((start, end) => { return start <= end; }, { start: min, end: quote });
    max = filter((start, end) => { return start > end; }, { start: max, end: quote });

    if(isBuy(quote, buys, min, threshold)) {
      buys.push(quote)
    }

    if(isSell(quote, sells, max, -threshold)) {
      sells.push(quote);
    }

    past +=1;
  });

  const actions = mergeActions(buys, sells);
  const trade = tradeType === 'long' ? long : short;
  const audit = trade(actions);

  return { buys, sells, actions, audit };
});

const filter = _.curry((check, quotes) => {
  const start = quotes.start.close;
  const end = quotes.end.close;

  return check(start, end) ? quotes.start : quotes.end;
});

const isBuy = (quote, buys, min, threshold) => {
  const state = candle({ start: min, end: quote });
  // console.log(state.change);

  if(state.change >= threshold) {
    const previous = _.last(buys);

    if(previous) {
      const current = candle({ start: previous, end: quote });
      return current.change >= threshold;
    }

    return true;
  }
};

const isSell = (quote, sells, max, threshold) => {
  const state = candle({ start: max, end: quote });
  // console.log(state.change);

  if(state.change <= threshold) {
    const previous = _.last(sells);

    if(previous) {
      const current = candle({ start: previous, end: quote });
      // if(current.change <= threshold) console.log('current.change', current.change);
      return current.change <= threshold;
    }

    return true;
  }
};

const mergeActions = (buys, sells) => {
  const suggestions = [
    ...buys.map(quote => Object.assign({ action: 'buy'}, quote)),
    ...sells.map(quote => Object.assign({ action: 'sell'}, quote)),
  ];

  return _.sortBy(suggestions, 'date');
};

const long = (series = []) => {
  const state = { count: 0, invested: 0, net: 0, balance: 0, trade: 'long' };
  const amount = 1;

  const track = true;
  if(track) state.steps = [];

  return series.reduce((state, quote) => {
    let active = false;

    if(quote.action === 'buy') {
      active = true;

      state.invested += amount * quote.close;
      state.count += amount;

      if(track) state.steps.push({
        count: state.count,
        price: quote.close,
        value: amount * quote.close
      });
    }

    if(quote.action === 'sell') {
      if(state.count >= amount) {
        active = true;

        state.invested -= amount * quote.close;
        state.count -= amount;

        if(track) state.steps.push({
          count: state.count,
          price: quote.close,
          value: -amount * quote.close
        });
      }
    }

    if(active) {
      state.net = state.count * quote.close;
      state.balance = state.net - state.invested;
      state.change = _.first(growthRate([state.invested, state.net])) || 0;
    }

    return state;
  }, state);
};

const short = (series = []) => {
  const state = { count: 0, invested: 0, net: 0, balance: 0, trade: 'short' };
  const amount = 1;

  const track = true;
  if(track) state.steps = [];

  return series.reduce((state, quote) => {
    let active = false;

    if(quote.action === 'buy') {
      if(state.count >= amount) {
        active = true;
        const value = amount * quote.close;

        state.net -= value;
        state.count -= amount;

        if(track) state.steps.push({
          count: state.count,
          price: quote.close,
          value: -value
        });
      }
    }

    if(quote.action === 'sell') {
      active = true;
      const value = amount * quote.close;

      state.net += value;
      state.count += amount;

      if(track) state.steps.push({
        count: state.count,
        price: quote.close,
        value: value
      });
    }

    if(active) {
      state.invested = state.count * quote.close;
      state.balance = state.net - state.invested;
      state.change = _.first(growthRate([state.invested, state.net])) || 0;
    }

    return state;
  }, state);
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
    .then(buyAfterValley(windowInDays, threshold, tradeType))
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
    .then((audits) => {
      const [ losers, winners ] = _.partition(audits, (audit) => {
        return audit.balance < 0;
      });

      const [ shorts, longs ] = _.partition(audits, (audit) => {
        return audit.trade === 'short';
      });

      const backtest = {
        audits,
        state: {
          invested: _.sumBy(audits, 'invested'),
          net: _.sumBy(audits, 'net'),
          balance: _.sumBy(audits, 'balance'),

          losers: losers.length,
          winners: winners.length,

          longs: statisticalOverview(longs),
          shorts: statisticalOverview(shorts),
        }
      };

      backtest.state.change = _.first(growthRate([backtest.state.invested, backtest.state.net])) || 0;

      return backtest;
    })
    .then(backtest => _.filter(backtest.audits, audit => audit.trade === 'short' && audit.change > 1))
    .then(backtest => JSON.stringify(backtest, null, 2))
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

  // options: {
  //   tradeType: 'short',
  //   entry: { windowInDays: 365, threshold: 0.11, },
  //   range: { start: '2017-05-01', end: '2019-05-01' },
  // }
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
