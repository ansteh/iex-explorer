const _       = require('lodash');

const POSITION = {
  count: 0,
  invested: 0,
  net: 0,
  history: [],
};

const trade = (position, quote, amount) => {
  if(_.isNumber(amount) && _.isNaN(amount) == false && amount !== 0) {
    const commitment = amount * quote.close;
    // console.log('commitment', commitment);

    position.count += amount;
    position.invested += commitment;

    position.history.push({ amount, price: quote.close, commitment, date: quote.date });
  }

  position.avgPricePerShare = _
    .chain(position.history)
    .map('price')
    .mean()
    .round(2)
    .value();

  position.net = position.count * quote.close;
  position.balance = position.net - position.invested;

  return position;
};

module.exports = {
  trade,
};

// const position = _.cloneDeep(POSITION);
//
// trade(position, { close: 5 }, 100);
// console.log(position);
//
// trade(position, { close: 5 }, -50);
// console.log(position);
//
// trade(position, { close: 6 }, -25);
// console.log(position);
//
// trade(position, { close: 2 }, -25);
// console.log(position);

const simulateSellOnLong = (price, amount) => {
  const position = _.cloneDeep(POSITION);

  trade(position, { close: _.round(_.random(price.min, price.max), 2) }, amount);
  console.log(position);

  do {
    const move = -_.random(1, amount);

    trade(position, { close: _.round(_.random(price.min, price.max), 2) }, move);
    console.log(position);

    amount += move;
  } while (amount > 0);
};

simulateSellOnLong({ min: 2, max: 6 }, 100)
