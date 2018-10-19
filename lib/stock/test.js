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

const getGrowthRatesBy = _.curry((itemsPath, property, stock) => {
  const items = _.get(stock, itemsPath);
  return growthRate(_.map(items, property));
});

const getGrowthRateBy = _.curry((itemsPath, property, stock) => {
  const items = _.get(stock, itemsPath);
  return growthRate(_.map(items, property));
});

const getMeanGrowthRateBy = _.curry((itemsPath, property, stock) => {
  const items = _.get(stock, itemsPath);
  return getMeanGrowthRate(_.map(items, property));
});

const aggregate = _.curry((itemsPath, options, stock) => {
  const items = _.get(stock, itemsPath);
  const { property, axtract } = options;

  return _.reduce(_.keys(_.first(items)), (accu, key) => {
    return _.set(accu, `${itemsPath}.${property}.${key}`, axtract(itemsPath, key, stock));
  }, {});
});

Stock.get('AAPL')
  .then((stock) => {
    return aggregate('financials.annual', { property: 'meanGrowthRate', axtract: getMeanGrowthRateBy }, stock);
  })
  .then(content => JSON.stringify(content, null, 2))
  .then(console.log)
  .catch(console.log)
// Stock.get('AAPL')
//   .then((stock) => {
//     return {
//       financials: {
//         annual: {
//           // growthRate: {
//           //   grossProfit: getGrowthRatesBy('financials.annual', 'grossProfit', stock),
//           // },
//           meanGrowthRate: {
//             grossProfit: getMeanGrowthRateBy('financials.annual', 'grossProfit', stock),
//             cashFlow: getMeanGrowthRateBy('financials.annual', 'cashFlow', stock),
//             currentAssets: getMeanGrowthRateBy('financials.annual', 'currentAssets', stock),
//             currentCash: getMeanGrowthRateBy('financials.annual', 'currentCash', stock),
//             currentDebt: getMeanGrowthRateBy('financials.annual', 'currentDebt', stock),
//             netIncome: getMeanGrowthRateBy('financials.annual', 'netIncome', stock),
//             operatingExpense: getMeanGrowthRateBy('financials.annual', 'operatingExpense', stock),
//             operatingIncome: getMeanGrowthRateBy('financials.annual', 'operatingIncome', stock),
//             operatingRevenue: getMeanGrowthRateBy('financials.annual', 'operatingRevenue', stock),
//             researchAndDevelopment: getMeanGrowthRateBy('financials.annual', 'researchAndDevelopment', stock),
//             shareholderEquity: getMeanGrowthRateBy('financials.annual', 'shareholderEquity', stock),
//             totalAssets: getMeanGrowthRateBy('financials.annual', 'totalAssets', stock),
//             totalCash: getMeanGrowthRateBy('financials.annual', 'totalCash', stock),
//             totalDebt: getMeanGrowthRateBy('financials.annual', 'totalDebt', stock),
//             totalRevenue: getMeanGrowthRateBy('financials.annual', 'totalRevenue', stock),
//           },
//         }
//       }
//     };
//   })
//   .then(content => JSON.stringify(content, null, 2))
//   .then(console.log)
//   .catch(console.log)
