const _       = require('lodash');
const Decimal = require('decimal.js');

const Spreads   = require('./index');

const predict = (start, growthRate) => {
  return Decimal.add(growthRate, 1)
    .mul(start)
    .toNumber();
};

const testGrowthRates = () => {
  const quotes = [
    {
      date: '2017-01-01T00:00:00.000Z',
      close: 100
    },
    {
      date: '2018-12-31T00:00:00.000Z',
      close: 120
    },
  ];

  const stats = Spreads.getSpreadGrowthRatesBy(quotes);

  console.log('stats', stats);
  console.log(1.1*110);
  console.log(1.1*100);
  console.log(predict(100, stats.total.annualGrowthRate));
  console.log(predict(predict(100, stats.total.annualGrowthRate), stats.total.annualGrowthRate));
  console.log(predict(100, stats.total.growthRate));
};

testGrowthRates();
