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
    const items = _
      .chain(financials)
      .map(property)
      .filter(value => _.isNumber(value))
      .value();

    return _.set(contaier, property, iter(items));
  }, {});
};

const getAnnualFinancialsMeanGrowthRates = (stock) => {
  return iterateFinancials(stock, getMeanGrowthRate);
};

const getAnnualFinancialsMeanGrowthDeviation = (stock) => {
  return iterateFinancials(stock, (items) => {
    return standardDeviation(growthRate(items));
  });
};

const getAnnualFinancialsEntryCount = (stock) => {
  return iterateFinancials(stock, (items) => {
    return _.get(items, 'length', 0);
  });
};

const getAnnualFinancialStatistics = (stock) => {
  const annualMeanGrowth = getAnnualFinancialsMeanGrowthRates(stock);
  const annualStandarDeviation = getAnnualFinancialsMeanGrowthDeviation(stock);
  const annualEntryCount = getAnnualFinancialsEntryCount(stock);

  const content = _.reduce(FINANCIAL_PROPERTIES, (content, property) => {
    _.set(content, `${property}.mean`, annualMeanGrowth[property]);
    _.set(content, `${property}.deviation`, annualStandarDeviation[property]);
    _.set(content, `${property}.count`, annualEntryCount[property]);

    return content;
  }, {});

  return _.set({}, 'metrics.financials.annual', content);
};

const getValues = _.curry((getValue, source, stock) => {
  source = source || 'financials.annual';

  return _.map(_.get(stock, source), (entry) => {
    return {
      date: _.get(entry, 'reportDate'),
      value: getValue(entry),
    };
  });
});

const extractAssetsToLiabilitiesRatio = (entry) => {
  return entry.totalDebt/entry.totalAssets;
};

const getDebtToAssets = getValues(extractAssetsToLiabilitiesRatio);
const getAnnualDebtToAssets = getDebtToAssets('financials.annual');

const getSeriesByProperty = (source, property, stock) => {
  return _
    .chain(_.get(stock, source))
    .map((entry) => {
      return {
        date: _.get(entry, 'reportDate'),
        value: _.get(entry, property)
      };
    })
    .value();
};

module.exports = {
  getAnnualFinancialStatistics,
  getAnnualDebtToAssets,
};
