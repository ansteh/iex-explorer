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

module.exports = {
  filterSoundFundamentals,
};
