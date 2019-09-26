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
  const state = { invested: 0, net: 0, count: 0 };
  const amount = 1;

  return series.reduce((state, quote) => {
    if(quote.action === 'buy') {
      state.invested += amount * quote.close;
      state.count += amount;
      state.net += state.count * quote.close;
    }

    if(quote.action === 'sell') {
      state.invested -= amount * quote.close;
      state.count -= amount;
      state.net += state.count * quote.close;
    }

    return state;
  }, state);
};

// console.log(candle({
//   start: {
//     close: 120,
//   },
//   end: {
//     close: 90,
//   }
// }));

getTrendsByTicker('GME')
  .then(console.log)
  .catch(console.log)
