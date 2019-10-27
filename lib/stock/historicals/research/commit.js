const _       = require('lodash');

const POSITION = { count: 0, invested: 0, net: 0, balance: 0, avgPricePerShare: 0, history: [] };
const PROPERTIES = _.keys(POSITION);

const getAvgPrice = (series) => {
  return _
    .chain(series)
    .map('price')
    .mean()
    .round(2)
    .value()
};

const long = (position, quote, amount) => {
  console.log('long postion', position.count, amount);
  position.trade = 'long';

  if(_.isNumber(amount) && _.isNaN(amount) == false && amount !== 0) {
    const value = amount * quote.close;
    // console.log('value', value);

    position.count += amount;
    position.invested += value;

    position.history.push({ amount, price: quote.close, value, date: quote.date });
  }

  position.avgPricePerShare = getAvgPrice(position.history);
  position.net = position.count * quote.close;
  position.balance = position.net - position.invested;

  return position;
};

const short = (position, quote, amount) => {
  console.log('short postion', position.count, amount);
  position.trade = 'short';

  if(_.isNumber(amount) && _.isNaN(amount) == false && amount !== 0) {
    const value = amount * quote.close;
    // console.log('value', value);

    position.count += amount;
    position.net += value;

    position.history.push({ amount, price: quote.close, value, date: quote.date });
  }

  position.avgPricePerShare = getAvgPrice(position.history);
  position.invested = position.count * quote.close;
  position.balance = position.net - position.invested;

  return position;
};

const trade = (position, quote, amount) => {
  if(!position.trade) {
    position.trade = amount >= 0 ? 'long' : 'short';
  }

  if(position.trade === 'long') {
    if(amount > 0 || position.count + amount >= 0) {
      long(position, quote, amount);
    } else {
      const exchange = position.count + amount;
      long(position, quote, -position.count);
      close(position);
      short(_.assign(position, POSITION), quote, exchange);
    }

    return position;
  }

  if(position.trade === 'short') {
    if(amount < 0 || position.count + amount <= 0) {
      short(position, quote, amount);
    } else {
      const exchange = position.count + amount;
      short(position, quote, -position.count);
      close(position);
      long(_.assign(position, POSITION), quote, exchange);
    }

    return position;
  }
};

const close = (position) => {
  const snapshot = _.assign({}, _.pick(position, PROPERTIES));
  position.trades = position.trades || [];
  position.trades.push(snapshot);
};

module.exports = {
  long,
  short,
  trade,
};

// const position = _.cloneDeep(POSITION);
//
// long(position, { close: 5 }, 100);
// console.log(position);
//
// long(position, { close: 5 }, -50);
// console.log(position);
//
// long(position, { close: 6 }, -25);
// console.log(position);
//
// long(position, { close: 2 }, -25);
// console.log(position);

const simulateSellOnLong = (price, amount) => {
  const position = _.cloneDeep(POSITION);

  long(position, { close: _.round(_.random(price.min, price.max), 2) }, amount);
  console.log(position);

  do {
    const move = -_.random(1, amount);

    long(position, { close: _.round(_.random(price.min, price.max), 2) }, move);
    console.log(position);

    amount += move;
  } while (amount > 0);
};

// simulateSellOnLong({ min: 2, max: 6 }, 100);

const tradeOption = (cost, payoff, probability, runs = 100) => {
  let balance = 0;
  let count = 1;

  let positive = 0;
  let negative = 0;

  while(count <= runs) {
    if(Math.random() <= probability) {
      balance += payoff;
      positive += 1;
    } else {
      balance -= cost;
      negative += 1;
    }

    // console.log('run', count, 'balance', balance, 'positive', positive, 'negative', negative);
    count += 1;
  }

  console.log('runs', count, 'balance', balance, 'positive', positive, 'negative', negative);
  console.log('positives', positive/runs, '%');

  return { runs, balance, positive, negative };
};

// tradeOption(1, 10, 0.12);

const position = _.cloneDeep(POSITION);

trade(position, { close: 5 }, 100);
console.log(position);

trade(position, { close: 5 }, -50);
console.log(position);

trade(position, { close: 6 }, -25);
console.log(position);

trade(position, { close: 2 }, -75);
console.log(position);

trade(position, { close: 1 }, -25);
console.log(position);

trade(position, { close: 3 }, 75);
console.log(position);
