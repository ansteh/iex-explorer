const _ = require('lodash');

const filterSoundFundamentals = (stock) => {
  const financials = _.get(stock, 'metrics.financials.annual');

  return _.get(financials, 'grossProfit.mean') >= 0.07
      && _.get(financials, 'cashFlow.mean') >= 0.07

      && _.get(financials, 'currentAssets.mean') >= 0.07
      && _.get(financials, 'currentCash.mean') >= 0.07
      && _.get(financials, 'currentDebt.mean') <= 0.07

      && _.get(financials, 'operatingExpense.mean') < 0.07

      && _.get(financials, 'totalAssets.mean') >= 0.07
      && _.get(financials, 'totalCash.mean') >= 0.07
      && _.get(financials, 'totalDebt.mean') <= 0.07
      && _.get(financials, 'totalRevenue.mean') >= 0.07

      && _.get(financials, 'shareholderEquity.mean') >= 0.07
};

const filterByMetrics = _.curry((source, filter, stock) => {
  return filter(_.get(stock, `metrics.${source || 'financials.annual'}`));
});

// const filterTotalRevenue = (stock, source, property) => {
//   source = source || 'financials.annual';
//   property = 'totalRevenue';
//
//   // const series = _
//   //   .chain(_.get(stock, source))
//   //   .map(property)
//   //   .filter(_.isNumber)
//   //   .value();
//
//   const metrics = _.get(stock, `metrics.${source}`);
//   // console.log(_.get(metrics, `${property}.mean`));
//   // console.log(series);
//
//   if(_.get(metrics, `${property}.count`) > 3) {
//     return _.get(metrics, `${property}.mean`) >= 0.07;
//   }
//
//   return false;
// };

const filterTotalRevenue = filterByMetrics('financials.annual', (metrics) => {
  const property = 'totalRevenue';

  if(_.get(metrics, `${property}.count`) > 3) {
    return _.get(metrics, `${property}.mean`) >= 0.07;
  }

  return false;
});

module.exports = {
  filterSoundFundamentals,
  filterTotalRevenue,
};
