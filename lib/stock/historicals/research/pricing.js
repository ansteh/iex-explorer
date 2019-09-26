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
    .then(buyAfterValley(120, 0.12))
};

const getTrends = (series) => {
  return Trends((quote) => { return quote.close; }, series);
};

const buyAfterValley = _.curry((days, threshold, series) => {
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

const trade = (series = []) => {
  const state = { count: 0, invested: 0, net: 0, balance: 0 };
  const amount = 1;

  const track = true;
  if(track) state.steps = [];

  return series.reduce((state, quote) => {
    let active = false;

    if(quote.action === 'buy') {
      active = true;

      if(track) state.steps.push(amount * quote.close);
      state.invested += amount * quote.close;
      state.count += amount;
    }

    if(quote.action === 'sell') {
      if(state.count >= amount) {
        active = true;

        if(track) state.steps.push(-amount * quote.close);
        state.invested -= amount * quote.close;
        state.count -= amount;
      }
    }

    if(state.count > 0) {
      state.net = state.count * quote.close;
    }

    if(active) {
      state.balance = state.net - state.invested;
      state.change = _.first(growthRate([state.invested, state.net])) || 0;
    }

    return state;
  }, state);
};

const buyAndSellAnalysis = ({ strategy, shuffle, count } = {}) => {
  strategy = strategy || 'COMMON';
  shuffle = shuffle || false;

  return Research.getTickers(strategy)
    .then((tickers) => {
      const candidates = shuffle ? _.shuffle(tickers) : tickers;
      return count ? _.take(candidates, count) : candidates;
    })
    .then((tickers) => {
      return Promise.all(tickers.map(getAuditByTicker));
    })
    // .then(audits => _.filter(audits, { change: -1 }))
};

const getAuditByTicker = (ticker) => {
  return Stock.getTimeseries(ticker)
    .then(buyAfterValley(120, 0.12))
    .then(stats => Object.assign({ ticker }, stats.audit))
};

// console.log(candle({
//   start: {
//     close: 120,
//   },
//   end: {
//     close: 90,
//   }
// }));

// getTrendsByTicker('AAPL')
//   .then(console.log)
//   .catch(console.log)

const options = {
  strategy: 'COMMON',
  shuffle: true,
  count: 25,
};

buyAndSellAnalysis(options)
  .then(console.log)
  .catch(console.log)
