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

const filterMeanGrowthByProperty = (property, rate = 0.07) => {
  return filterByMetrics('financials.annual', (metrics) => {
    if(_.get(metrics, `${property}.count`) > 3) {
      const mean = _.get(metrics, `${property}.mean`);
      return _.isFunction(rate) ? rate(mean) : mean >= rate;
    }

    return false;
  });
};

const filterByMetrics = _.curry((source, filter, stock) => {
  return filter(_.get(stock, `metrics.${source || 'financials.annual'}`));
});

const filterTotalRevenue = filterMeanGrowthByProperty('totalRevenue');
const filterShareholderEquity = filterMeanGrowthByProperty('shareholderEquity');
const filterGrossProfit = filterMeanGrowthByProperty('grossProfit', mean => mean >= 0);
const filterDescTotalDebt = filterMeanGrowthByProperty('totalDebt', mean => mean <= 0);
const filterAscCashFlow = filterMeanGrowthByProperty('cashFlow')
const filterAscCash = filterMeanGrowthByProperty('totalCash')

const filterValueStocks = (stock) => {
  return _.every([
    filterPositiveFundamentals,

    filterDescTotalDebt,
    filterTotalRevenue,
    filterGrossProfit,
    filterShareholderEquity,
    filterAscCashFlow,
    filterAscCash,
  ], filter => filter(stock));
};

const filterPositiveFundamentals = (stock) => {
  const source = 'financials.annual';

  return _.every([
    isPositive(source, 'totalAssets'),
    isPositive(source, 'totalCash'),
    isPositive(source, 'cashFlow'),
    isPositive(source, 'shareholderEquity'),
  ], filter => filter(stock));
};

const isPositive = _.curry((source, property, stock) => {
  const series = getSeriesByProperty(source, property, stock);
  return _.first(series) > 0;
});

const getSeriesByProperty = (source, property, stock) => {
  return _
    .chain(_.get(stock, source))
    .map(property)
    .filter(_.isNumber)
    .value();
};

module.exports = {
  filterSoundFundamentals,
  filterTotalRevenue,
  filterDescTotalDebt,
  filterValueStocks,
  filterPositiveFundamentals,
};
