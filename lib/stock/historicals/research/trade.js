const _       = require('lodash');

const { candle } = require('./util');
const { growthRate } = require('../../../shared/fundamentals/growthRate.js');

const trader = require('./commit');

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

const trade = (series = []) => {
  const amount = 1;

  return series.reduce((position, quote) => {
    if(quote.action === 'buy') {
      trader.trade(position, quote, amount);
    }

    if(quote.action === 'sell') {
      trader.trade(position, quote, -amount);
    }

    return position;
  }, trader.createPosition());
};

const ACTIONS = { long, short, trade };

const tradeAfterTurns = _.curry((days, threshold, tradeType, series) => {
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
  // const tradeBy = tradeType === 'long' ? long : short;
  // const tradeBy = ACTIONS[tradeType] || trade;
  const tradeBy = trade;
  const audit = tradeBy(actions);

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

module.exports = {
  long,
  short,
  trade,

  tradeAfterTurns,
  isBuy,
  isSell,
};
