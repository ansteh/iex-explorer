const _       = require('lodash');

const trade = (position, quote, amount) => {
  position.invested = position.invested || 0;
  position.averagePrice = position.averagePrice || 0;
  position.amount = position.amount || 0;
  position.realised = position.realised || 0;

  if(_.isNumber(amount) && _.isNaN(amount) == false && amount !== 0) {
    const commitment = amount * quote.close;

    position.invested += commitment;
    position.amount += amount;

    if(amount > 0) { // buy

    }

    if(amount < 0) { // sell
      position.realised += -commitment + position.averagePrice * amount;
    }
  }

  position.net = position.amount * quote.close;
  position.averagePrice = position.amount ? position.invested/position.amount : 0;
  position.unrealised = position.net - position.averagePrice * position.amount;

  return position;
};

module.exports = {
  trade,
};

const position = {};

trade(position, { close: 5 }, 100);
console.log(position);

trade(position, { close: 5 }, -50);
console.log(position);

// trade(position, { close: 25 }, -50);
// console.log(position);

trade(position, { close: 2.5 }, -25);
console.log(position);

// trade(position, { close: 2.5 }, -25);
// console.log(position);
