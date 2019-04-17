const _         = require('lodash');

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

// const types = [
//   'dividends',
//   // 'earnings',
//   'financials.annual',
//   'financials.quarter',
//   'stats',
//   // 'historicals',
// ];

// Stock.request('AAPL', types)
//   .then(console.log)
//   .catch(console.log)

// Service.getMetrics('AAPL')
//   .then(content => JSON.stringify(content, null, 2))
//   .then(console.log)
//   .catch(console.log)

// Service.get('INFY')
//   .then(content => JSON.stringify(content, null, 2))
//   .then(console.log)
//   .catch(console.log)

const getPrice = (stock) => {
  return _
    .chain(_.get(stock, 'historicals'))
    .last()
    .get('close')
    .value();
};

const getPerShareOutstanding = _.curry((path, stock) => {
  const value = _
    .chain(_.get(stock, 'financials.annual'))
    .last()
    .get(path)
    .value() || 0;

  const sharesOutstanding = _.get(stock, 'stats.sharesOutstanding') || 0;
  return sharesOutstanding === 0 ? 0 : (value / sharesOutstanding);
});

const RATIOS = [
  { property: 'share.price', extract: getPrice },
  { property: 'share.ttmEPS', extract: (stock) => { return _.get(stock, 'stats.ttmEPS') } },
  { property: 'share.dividendRate', extract: (stock) => { return _.get(stock, 'stats.dividendRate') } },
  { property: 'share.dividendYield', extract: (stock) => { return _.get(stock, 'stats.dividendYield') } },
];

const FINANCIALS = [
  'grossProfit',
  'costOfRevenue',
  'operatingRevenue',
  'totalRevenue',
  'operatingIncome',
  'netIncome',
  'researchAndDevelopment',
  'operatingExpense',
  'currentAssets',
  'totalAssets',
  'totalLiabilities',
  'currentCash',
  'currentDebt',
  'totalCash',
  'totalDebt',
  'shareholderEquity',
  'cashChange',
  'cashFlow',
  'operatingGainsLosses'
];

const getFinancialsPerShare = (stock) => {
  return _.reduce(FINANCIALS, (ratios, property) => {
    _.set(ratios, property, getPerShareOutstanding(property, stock));
    return ratios;
  }, {});
};

const getPriceRatios = (ticker) => {
  return Stock.get(ticker)
    .then((stock) => {
      const financialsPerShare = getFinancialsPerShare(stock);

      const ratios = _.reduce(RATIOS, (ratios, { property, extract }) => {
        _.set(ratios, property, extract(stock));
        return ratios;
      }, {});

      const perPrice = _.reduce(FINANCIALS, (perPrice, property) => {
        _.set(perPrice, property, _.get(financialsPerShare, property) / ratios.share.price);
        return perPrice;
      }, {});

      return _.merge(ratios, { share: financialsPerShare }, { perPrice });
    })
};

const sumUp = (data, paths) => {
  return _
    .chain(paths)
    .map(path => _.get(data, path) || 0)
    .sum()
    .value();
};

getPriceRatios('INFY')
  // .then((data) => {
  //   console.log('data', data);
  //   return sumUp(data, ['shareholderEquity', 'totalDebt', 'totalCash', 'totalAssets'].map(property => `perPrice.${property}`));
  // })
  .then(console.log)
  .catch(console.log)
