const Service = require('./service.js');
const Stock   = require('./index.js');

// Service.get('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getDividends('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getRecentEarnings('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getFinancials('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getKeyStats('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Stock.request('AAPL')
//   .then(console.log)
//   .catch(console.log)

const _         = require('lodash');
const Decimal   = require('decimal.js');
const { growthRate, getMeanGrowthRate } = require('../shared/fundamentals/growthRate.js');
const { variance, standardDeviation } = require('../shared/fundamentals/variance.js');

const FINANCIAL_PROPERTIES = [
  'grossProfit',
  'cashFlow',
  'currentAssets',
  'currentCash',
  'currentDebt',
  'netIncome',
  'operatingExpense',
  'operatingIncome',
  'operatingRevenue',
  'researchAndDevelopment',
  'shareholderEquity',
  'totalAssets',
  'totalCash',
  'totalDebt',
  'totalRevenue',
];


const iterateFinancials = (stock, iter, source = 'financials.annual') => {
  const financials = _.get(stock, source);

  return _.reduce(FINANCIAL_PROPERTIES, (contaier, property) => {
    const items = _.map(financials, property);
    return _.set(contaier, property, iter(items));
  }, {});
};

const getAnnualFinancialsMeanGrowthRates = (stock) => {
  return iterateFinancials(stock, getMeanGrowthRate);
};

Stock.get('AAPL')
  .then((stock) => {
    // return getAnnualFinancialsMeanGrowthRates(stock);
    return iterateFinancials(stock, (items) => {
      return standardDeviation(growthRate(items));
    });
  })
  .then(content => JSON.stringify(content, null, 2))
  .then(console.log)
  .catch(console.log)
