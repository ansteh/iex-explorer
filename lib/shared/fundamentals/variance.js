const _         = require('lodash');
const Decimal   = require('decimal.js');

const variance = (collection) => {
  if(!collection || collection.length < 2) {
    return 0;
  }

  const mean = _.mean(collection);

  return _
    .chain(collection)
    .map(value => Decimal.sub(value, mean))
    .map(value => value.pow(2))
    .reduce((sum, value) => { return sum.add(value) }, new Decimal(0))
    .value()
    .div(collection.length)
    .toNumber();
};

const standardDeviation = (collection) => {
  if(!collection || collection.length < 2) {
    return 0;
  }

  return Decimal.sqrt(variance(collection)).toNumber();
};

module.exports = {
  variance,
  standardDeviation,
};
