const _         = require('lodash');
const Decimal   = require('decimal.js');

const growthRate = (collection) => {
  console.log(collection);

  if(!collection || collection.length < 2) {
    return 0;
  }

  return _.reduce(collection, (rates, value, index) => {
    if(index > 0) {
      let previous = collection[index-1];
      // rates.push(value/previous - 1);
      rates.push(Decimal.div(value, previous).sub(1).toNumber());
    }
    return rates;
  }, []);
};

const getMeanGrowthRate = (values) => {
  if(!values || values.length < 2) {
    return 0;
  }

  const growthRates = growthRate(values);
  const momentums = getGrowthRateMomentums(values, growthRates);

  return _.mean(momentums);
};

const getGrowthRateMomentums = (values, growthRates) => {
  return _.reduce(growthRates, (momentums, rate, index) => {
    rate = Math.abs(rate);

    const previous = values[index];
    const value = values[index+1];

    momentums.push(previous <= value ? rate : -rate);

    return momentums;
  }, []);
};

module.exports = {
  growthRate,
  getMeanGrowthRate,
  getGrowthRateMomentums,
};
